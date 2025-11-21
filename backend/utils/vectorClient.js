// utils/vectorClient.js
// Minimal placeholder implementations for vector search so /api/chat works
// even if Pinecone and embeddings are not configured.

async function initPinecone() {
  // Return false to indicate Pinecone is not initialized.
  return false
}

async function queryPineconeTopK(embedding, topK) {
  // Placeholder: no Pinecone results.
  return []
}

async function mongoQueryTopK(embedding, topK) {
  // Placeholder: no Mongo vector results.
  return []
}

module.exports = { initPinecone, queryPineconeTopK, mongoQueryTopK }

