<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Chat Memory & History Management</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        To provide a natural, conversational experience, Zad-AI must remember previous interactions. The Chat Memory module handles multi-turn dialogues, ensuring that follow-up questions referencing past entities (e.g., pronouns like "it" or "he") are correctly contextualized before hitting the vector database.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The Challenge of Multi-Turn RAG

In a standard RAG system, if a user asks:
1. *"What are the conditions of Wudu?"* (Searches DB, returns answer).
2. *"What breaks it according to the Shafi'i school?"*

If the second question is sent directly to Qdrant, the vector database will fail because it doesn't know what "it" refers to. The mathematical embedding of "What breaks it" will not match texts about Wudu.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Standalone Question Generator

To solve this, Zad-AI intercepts all follow-up queries and runs them through a **Standalone Question Generator** (a lightweight LLM call) alongside the recent conversation history.

* **Input History:** User: "What are the conditions of Wudu?" -> AI: "...conditions..." -> User: "What breaks it according to the Shafi'i school?"
* **LLM Action:** It resolves the pronoun "it" to "Wudu".
* **Output:** *"What are the nullifiers of Wudu according to the Shafi'i school?"*

This standalone, fully contextualized string is what gets passed to the embedding model, ensuring mathematically accurate retrieval every single time.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Session Management via Redis

To maintain speed and scalability across thousands of users, the conversation history is not stored heavily in RAM. 
Instead, Zad-AI uses **Redis** to store short-term session histories. 

* Each user session is assigned a unique `session_id`.
* The last $N$ messages (typically 5-10) are temporarily cached in Redis.
* This allows the backend to remain entirely stateless, enabling horizontal scaling (spinning up multiple Docker containers) without losing track of user conversations.

</div>

</div>
