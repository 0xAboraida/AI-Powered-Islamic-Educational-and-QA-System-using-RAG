<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Python Microservice Routing</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        The .NET API Gateway does not perform any AI computations itself. Instead, it acts as a secure reverse proxy and orchestrator, forwarding authenticated AI requests to the internal Python FastAPI RAG Engine.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The ChatController Hub

When a user submits a question via the Flutter application, the request hits the `ChatController` on the .NET API.

This controller performs several critical preliminary tasks:
1. Verifies the user's JWT token.
2. Retrieves or creates a `ChatSession` in the SQL database.
3. Saves the user's raw message to the database for history tracking.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Internal HTTP Forwarding

Once the request is validated and saved, the Application layer utilizes an `HttpClient` configured via the `Zad.Infrastructure` layer to communicate with the internal Python microservice.

*   The Python service (running in a separate Docker container) exposes an internal `/chat` endpoint.
*   The .NET backend packages the user's query, alongside the recent chat history (retrieved from the SQL database), and sends it via an internal HTTP POST request.
*   Because this communication happens on the internal Docker network, it is extremely fast and completely hidden from the public internet.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Response Handling

The Python RAG engine performs the Hybrid Search, Reranking, and LLM Generation, then returns the final Arabic response back to the .NET backend.

The .NET backend:
1. Receives the response.
2. Saves the AI's response to the SQL database under the same `ChatSession`.
3. Forwards the JSON payload back to the client application.

This architecture ensures that the state (chat history, users) is strictly managed by the robust, typed .NET ecosystem, while the raw AI computation is handled by Python's specialized AI libraries.

</div>

</div>
