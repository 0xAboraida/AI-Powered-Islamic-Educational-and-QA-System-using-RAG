# Zad-AI RAG Retrieval Pipeline Optimizations (v1.1)

This document outlines the major architectural changes and optimizations applied to the Zad-AI Retrieval-Augmented Generation (RAG) pipeline to reduce latency and eliminate cloud dependencies.

## 1. Migration to Local Embeddings (Goodbye Modal)
Previously, the `BGE-M3` embedding model was deployed on the **Modal** cloud platform. This caused two major issues:
- **Cold Starts:** When the Modal container was asleep, the first request could take up to 47 seconds to wake it up.
- **Rate Limits & Costs:** Free-tier accounts have concurrent connection limits resulting in `429 Too Many Requests` when pinging the server.

**The Solution:**
We transitioned to executing the `BGE-M3` model **locally** on the server's CPU using `FlagEmbedding`.
- **Performance Gain:** By explicitly setting `use_fp16=False`, CPU emulation of FP16 was disabled. The model now loads in ~4 seconds on startup, and query encoding takes **~0.2 seconds**.
- **Result:** 100% free, zero network latency, and zero rate limits.

## 2. Re-enabling Parallel Hybrid Search
During the Modal integration, we were forced to execute Dense and Sparse retrieval sequentially to avoid spinning up multiple paid Modal instances. Since we now use the fast local execution:
- We reverted `hybrid_search.py` to use `asyncio.gather()`.
- **Performance Gain:** Dense and Sparse search now happen concurrently, saving ~1 second per query.

## 3. Reranker Integration (The Gemini Latency Fix)
The most significant bottleneck was the **Time To First Token (TTFT)** from Google's Gemini model (often exceeding 90 seconds). This occurred because we were passing 5 massive Parent documents (entire book sections) as the context prompt.

**The Solution:**
We integrated a Cross-Encoder Reranker (`BAAI/bge-reranker-v2-m3`).
- **How it works:** Qdrant returns 10 small child chunks. Instead of fetching the 5 parents for all of them immediately, the Reranker scores the 10 child chunks and selects only the **top 3** most relevant ones.
- **Impact on Context:** We now only fetch and send 3 Parent documents to Gemini instead of 5.
- **Performance Gain:** The prompt size is reduced by 40-70%, dropping Gemini's reading time (TTFT) from 90+ seconds to single digits.

### Reranker Configuration (`.env`)
The reranker can be controlled via the environment variables:
```env
USE_RERANKER=True
RERANKER_MODEL_NAME=BAAI/bge-reranker-v2-m3
RAG_RERANKER_TOP_K=3
```

## Summary of the New Pipeline Flow
1. **User asks a question** → LLM Preprocessing (~3s).
2. **Local BGE-M3** generates Dense and Sparse vectors simultaneously (~0.2s).
3. **Qdrant** executes Dense & Sparse searches in parallel and fuses them with RRF (~2.5s).
4. **Local Reranker** scores the 10 returned chunks and keeps the top 3 (~1-3s).
5. **MongoDB** fetches the 3 full parent documents for those chunks.
6. **Gemini** reads the reduced context and begins streaming the answer instantly.

*Note: For production deployments, ensuring the Backend Server (VPS) is in the same geographical region as the MongoDB Atlas clusters will reduce the MongoDB fetch time from ~24s to <1s.*
