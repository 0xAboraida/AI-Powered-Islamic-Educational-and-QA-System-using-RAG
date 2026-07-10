<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Docker Compose Orchestration</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        Running 5 distinct microservices manually would be an operational nightmare. Zad-AI utilizes Docker Compose to orchestrate the internal networking, dependency resolution, and environment variable injection across the entire ecosystem.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. Internal Bridge Networking (`zad-network`)

The most critical architectural decision in our deployment is the shared internal Docker network called `zad-network`.

Instead of exposing internal services (like the AI Engine or Redis) to `localhost` and dealing with port conflicts, all containers communicate internally via DNS resolution. 
*   The `.NET API Gateway` connects to the AI Engine simply by calling `http://zad-ai-engine:8000`.
*   The `Voice Agent` connects to the RAG endpoints using `http://zad-ai-engine:8000/api/v1/chat/chunks`.

This internal bridge network ensures that the AI workloads and database connections are completely invisible and inaccessible from the public internet. Only the `.NET API Gateway` exposes a port (`8080`) to the outside world.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Dependency Management (`depends_on`)

Startup order is highly critical in a microservices environment. Docker Compose handles this gracefully:
*   `zad-ai-engine` will not start until `redis` is ready.
*   `voice-agent` will not start until `zad-ai-engine` is online (since it relies on the RAG API).
*   `zad-api` will not start until `sqlserver` is ready to accept connections.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Unified Deployment (Local & Server)

Because the entire infrastructure is encapsulated within Docker Compose, the transition from development to production is seamless. Whether presenting the graduation project locally on a laptop, or deploying to a Virtual Private Server (VPS) on Azure or AWS, the exact same `docker-compose.yml` commands are used. 

This guarantees that the exact environment tested during development is perfectly replicated during the final project defense without requiring any complex cloud configuration.

</div>

</div>
