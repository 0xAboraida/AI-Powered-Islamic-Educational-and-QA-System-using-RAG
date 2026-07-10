<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Technology Stack</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        Zad-AI is built using a modern, scalable, and resilient technology stack carefully selected to handle the heavy computational requirements of hybrid vector search and real-time audio processing.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. Core AI & Backend Engine
* **Language:** Python 3.11+
* **Framework:** FastAPI
  * Chosen for its extreme performance, native asynchronous support, and auto-generated OpenAPI documentation. It perfectly handles the heavily asynchronous nature of concurrent database querying in our Retrieval-Augmented Generation (RAG) pipeline.
* **Orchestration:** LangChain & Custom Orchestrators
  * While LangChain is used for certain standardized wrappers, the core routing and parent-child retrieval logic is custom-built to circumvent framework limitations and minimize latency.
* **Embedding Model:** BAAI/bge-m3
  * Selected for its state-of-the-art multi-lingual capabilities (specifically Arabic) and its unique ability to generate both Dense (semantic) and Sparse (lexical/BM25) embeddings simultaneously.
* **Reranking Model:** BAAI/bge-reranker-v2-m3
  * A Cross-Encoder used to rigorously score the final retrieved contexts against the user's query, ensuring only mathematically relevant documents reach the LLM.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. LLM Providers & Fallback System
* **Primary Generator:** Google Gemini (Gemini Pro)
  * Utilized for its massive context window and strong Arabic generative capabilities.
* **Fallback Generators:** Groq / OpenAI
  * Implemented via a dynamic fallback architecture (`LLMFallbackManager`). If Gemini hits rate limits or experiences downtime, the system automatically routes the prompt to Groq (for ultra-fast inference) or OpenAI (for maximum reliability).

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Database Infrastructure
* **Vector Store:** Qdrant Cloud
  * Stores the "Child" embeddings. Chosen for its native support for Hybrid Search (combining dense and sparse vectors via Reciprocal Rank Fusion) and its payload filtering capabilities.
* **Document Store:** MongoDB Atlas
  * Stores the full text "Parent" documents. The data is sharded across 12 distinct free-tier clusters to bypass storage limits while maintaining rapid, index-based document retrieval.
* **In-Memory Cache:** Redis
  * Used for session management, storing conversation history, and temporarily caching highly frequent queries to reduce API costs.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 4. Voice & Real-Time Interaction
* **WebRTC Server:** LiveKit
  * Provides ultra-low latency audio streaming between the client and the Python backend.
* **Speech-to-Text (STT):** Groq Whisper API
  * Utilized for near-instantaneous transcription of Arabic speech.
* **Text-to-Speech (TTS):** ElevenLabs / OpenAI TTS (Configurable)
  * Generates natural-sounding Arabic audio responses.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 5. API Gateway & Frontend
* **API Gateway:** ASP.NET Core (.NET 8.0)
  * Serves as the robust entry point for client applications. Handles JWT Authentication, Distributed Rate Limiting, and Request Routing.
* **Client Application:** Flutter (Dart)
  * Provides a unified, cross-platform UI for iOS, Android, and Web users, featuring custom WebRTC plugins for voice interactions.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 6. Deployment & DevOps
* **Containerization:** Docker & Docker Compose
  * Entire microservices ecosystem is containerized for deterministic builds and localized testing.
* **Cloud Infrastructure:** HuggingFace Spaces (Docker Environments)
  * Achieving a fully functional cloud deployment with zero budget by hosting the architecture across three distinct Docker Spaces (Zad-Backend, Zad-RAG, Zad-Voice) that communicate seamlessly via REST APIs.

</div>
