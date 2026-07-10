<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Containerization Strategy</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        Zad-AI is built as a complex, multi-language microservices platform involving Python (AI Engine, Voice Agent) and C# (.NET API Gateway). To ensure absolute consistency between development and production, the entire ecosystem is strictly containerized using Docker.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The Necessity of Docker

A standard local installation of Zad-AI would require setting up Python 3.11, .NET 8.0 SDK, Redis, SQL Server, and installing complex C++ build tools for AI dependencies like `bge-m3` or audio processing libraries.

By packaging each service into its own Docker image (e.g., `abourida/docker-zad-ai-engine:latest`), we guarantee deterministic builds. "It works on my machine" means it works everywhere.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Service Isolation

The architecture is divided into distinct, isolated containers:
*   **`zad-ai-engine`**: The FastAPI Python backend running the Hybrid Search and LLM generation.
*   **`zad-redis`**: An Alpine-based Redis instance used for caching and Chat Session Memory.
*   **`zad-voice-agent`**: The LiveKit Python worker (`abduh38/livekit-voice-agent:latest`) that handles real-time WebRTC audio streams.
*   **`zad-api`**: The .NET Core API Gateway that acts as the front door.
*   **`zad-sqlserver`**: The Microsoft SQL Server instance storing user accounts and permanent chat history.

Each service is decoupled. If the Voice Agent crashes, the Text RAG engine and API Gateway continue to function normally.

</div>

</div>
