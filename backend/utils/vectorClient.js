// utils/vectorClient.js
// Minimal but real implementations for vector search. Pinecone is optional
// and will be used if configured via environment variables.

const { Pinecone } = require('@pinecone-database/pinecone');

let pineconeClient = null;
let pineconeIndex = null;

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT; // kept for legacy configs
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;

async function initPinecone() {
  if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
    console.warn('Pinecone not configured. Set PINECONE_API_KEY and PINECONE_INDEX_NAME to enable vector search.');
    return false;
  }

  if (pineconeIndex) {
    return true;
  }

  try {
    pineconeClient = new Pinecone({ apiKey: PINECONE_API_KEY });
    pineconeIndex = pineconeClient.index(PINECONE_INDEX_NAME);
    console.log('Pinecone client initialized');
    return true;
  } catch (err) {
    console.warn('Failed to initialize Pinecone client:', err.message || err);
    pineconeClient = null;
    pineconeIndex = null;
    return false;
  }
}

async function queryPineconeTopK(embedding, topK) {
  if (!pineconeIndex) {
    return [];
  }

  try {
    const result = await pineconeIndex.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });

    return result.matches || [];
  } catch (err) {
    console.warn('Pinecone query failed:', err.message || err);
    return [];
  }
}

async function mongoQueryTopK(embedding, topK) {
  // No Mongo vector collection is defined in this project yet.
  // This function currently returns no results by design.
  return [];
}

module.exports = { initPinecone, queryPineconeTopK, mongoQueryTopK }

