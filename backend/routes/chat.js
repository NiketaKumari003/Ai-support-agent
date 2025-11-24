// routes/chat.js
const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const { generateGeminiResponse } = require('../utils/geminiClient');
const { initPinecone, queryPineconeTopK, mongoQueryTopK } = require('../utils/vectorClient');

// System prompt (concise/professional)
const SYSTEM_PROMPT = `You are a professional and helpful support assistant. Answer clearly and cite sources when used in the format [source: filename#chunk_id]. If the provided context does not contain the answer, reply: "I don't know — would you like me to create a support ticket?"`;

// Helper to construct user prompt with context
function buildRagPrompt(retrievedChunks, userQuestion) {
  const contextText = retrievedChunks
    .map((c, i) => `[[${i + 1}]] source: ${c.metadata?.source || c.source}#${c.metadata?.chunk_id || c.chunk_id}\n${c.text || c.metadata?.text || c.metadata?.snippet || ''}`)
    .join('\n\n');
  return `CONTEXT:\n${contextText}\n\nQUESTION:\n${userQuestion}\n\nINSTRUCTIONS:\nAnswer using the CONTEXT only. Cite sources inline using [source: filename#chunk_id]. If the context does not answer the question, reply exactly: I don't know — would you like me to create a support ticket?`;
}

// POST /api/chat
// body: { sessionId, message, userId (optional) }
router.post('/', async (req, res) => {
  try {
    const { sessionId, message, userId } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: 'Missing sessionId or message' });

    // 1) Try to query vector DB (Pinecone preferred)
    let retrieved = [];
    try {
      const pineInit = await initPinecone();
      if (pineInit) {
        // Placeholder for real embeddings + Pinecone query.
        retrieved = [];
      }
    } catch (pineErr) {
      console.warn('Pinecone query failed, falling back to mongo:', pineErr.message);
    }

    // fallback: query Mongo (assumes embeddings present in DB)
    if (!retrieved || retrieved.length === 0) {
      retrieved = await mongoQueryTopK(new Array(1536).fill(0), 3);
    }

    // Normalize retrieved to objects with text + metadata
    const normalized = retrieved.map(r => ({
      text: r.metadata?.text || r.text || (r._doc && r._doc.text) || '',
      metadata: r.metadata || { source: r.source, chunk_id: r.chunk_id }
    }));

    // 2) Build RAG prompt
    const ragPrompt = buildRagPrompt(normalized, message);

    // 3) Call LLM (Gemini)
    const llmText = await generateGeminiResponse(SYSTEM_PROMPT, ragPrompt, 800, 0.0);

    // Attempt to parse JSON if LLM returned structured JSON; otherwise wrap
    let parsed = null;
    try {
      parsed = JSON.parse(llmText);
    } catch (err) {
      // Not JSON — return as text with sources extracted heuristically
      parsed = {
        type: 'answer',
        message: llmText,
        sources: normalized.map((n, idx) => ({
          id: `${idx + 1}`,
          title: n.metadata.source,
          chunk_id: n.metadata.chunk_id
        }))
      };
    }

    // 4) Store in Conversation
    let conv = await Conversation.findOne({ sessionId });
    if (!conv) {
      conv = new Conversation({ sessionId, userId: userId || null, messages: [] });
    }
    conv.messages.push({ from: 'user', message });
    conv.messages.push({
      from: 'assistant',
      message: parsed.message || llmText,
      metadata: { sources: parsed.sources || [] }
    });
    await conv.save();

    res.json({ reply: parsed, raw: llmText });
  } catch (err) {
    console.error('Chat error:', err);

    const code = err?.code || err?.error?.code;
    const status = err?.status;
    const message = err?.message || 'Chat failed';

    // OpenAI-style quota error (kept for backwards compatibility)
    if (code === 'insufficient_quota' || status === 429) {
      return res.json({
        reply: {
          type: 'error',
          message:
            'Our AI is temporarily unavailable because the provider quota was exceeded. Please try again later or contact support.',
          sources: [],
        },
        raw: '',
      });
    }

    // Gemini configuration / auth / bad request errors
    if (status && status >= 400 && status < 500) {
      return res.json({
        reply: {
          type: 'error',
          message:
            message ||
            'The AI configuration seems invalid (API key or model). Please verify your Gemini API settings on the server.',
          sources: [],
        },
        raw: '',
      });
    }

    res.status(500).json({
      error: message,
      details: {
        code: code || null,
        status: status || 500,
      },
    });
  }
});

module.exports = router;

