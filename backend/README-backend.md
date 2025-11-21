# AI Support Agent - Backend

This backend implements core APIs for the ai-support-agent project: auth, chat (RAG hook), and escalation.

## Quickstart

1. Copy `.env.example` to `.env` and fill values.
2. `npm install` 
3. `npm run dev` (requires MongoDB running)

## Endpoints

- `POST /api/auth/register` {name,email,password}
- `POST /api/auth/login` {email,password}
- `POST /api/chat` {sessionId,message,userId?}
- `POST /api/escalate` {sessionId,reason}

## Notes

- The vector DB client includes Pinecone integration (init in `utils/vectorClient.js`) and a Mongo fallback.
- `utils/openaiClient.js` uses OpenAI SDK. Set `OPENAI_API_KEY` in `.env`.
- This backend is intentionally minimal and includes TODOs where production-grade features should be added (embeddings generation, Pinecone upserts/queries, rate limiting, sanitization).
