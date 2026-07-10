<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> FastAPI Internal Endpoints (RAG)</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        While the .NET backend is the public face of Zad-AI, the Python RAG Engine exposes its own internal API layer using FastAPI. These endpoints are strictly consumed by the .NET Gateway and the LiveKit Voice Agent, isolating the heavy AI workloads into a scalable microservice.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The `/ask` Endpoint

**Purpose:** Standard Text-Based RAG Generation.
**Consumers:** The .NET API Gateway.

This is the primary endpoint for written interactions. When it receives a JSON payload containing the user's `query`, `domain` ID, and `session_id`:
1. It validates the request and maps the integer `domain` ID (e.g., `1`) to the literal string required by the AI engine (e.g., `"Fiqh"`).
2. It triggers the entire `orchestrator.generate_chat_response` pipeline (Preprocessing -> Retrieval -> Reranking -> LLM Generation).
3. It returns the final, synthesized Arabic text response along with structured citations.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. The `/chunks` Endpoint

**Purpose:** Voice-Optimized Raw Context Retrieval.
**Consumers:** The LiveKit Voice Agent Plugin.

Unlike the `/ask` endpoint, `/chunks` **bypasses LLM generation entirely**. 
When the Voice Agent detects speech, it converts it to text and sends it to this endpoint. The endpoint only executes:
- Domain Guardrails & Preprocessing.
- Hybrid Search (Qdrant) & Reranking.
- Parent Document Fetching (MongoDB).

It immediately returns the raw, unsummarized text blocks to the Voice Agent. *Why?* Because the LiveKit Voice Agent has its own specialized LLM pipeline (optimized for streaming audio responses). Forcing the text through two LLMs would cause unacceptable latency in a real-time voice conversation.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. The `/transcribe` Endpoint

**Purpose:** Audio-to-Text Transcription.
**Consumers:** Standalone voice recording modules.

This endpoint accepts an audio file (`UploadFile`) and utilizes the `audio_service` to stream it to the **Groq Whisper API**. Groq's dedicated LPUs transcribe the Arabic speech with near-zero latency, returning the text string to be processed by the main RAG engine.

</div>

</div>
