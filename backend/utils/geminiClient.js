// utils/geminiClient.js
// Google Gemini client used as an alternative to OpenAI.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Chat responses will fail until it is configured.');
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * Call Google Generative Language (Gemini) API with a system + user prompt
 * and return a single text response.
 */
async function generateGeminiResponse(systemPrompt, userPrompt, maxTokens = 800, temperature = 0.2) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL,
  )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          { text: '\n\n' },
          { text: userPrompt },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    const error = new Error(`Gemini API error ${res.status}: ${errText}`);
    error.status = res.status;
    error.body = errText;
    throw error;
  }

  const data = await res.json();
  const text =
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;

  if (!text) {
    throw new Error('No text returned from Gemini');
  }

  return text;
}

module.exports = { generateGeminiResponse };
