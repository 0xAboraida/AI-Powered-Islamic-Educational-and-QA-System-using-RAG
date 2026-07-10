<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Semantic Caching Strategy</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        In a production-grade AI system, minimizing LLM API costs and reducing latency is critical. Zad-AI implements a caching layer that intercepts queries before they trigger expensive embedding generations, vector searches, and LLM inferences.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The Redundancy Problem

In Islamic QA systems, certain questions are highly frequent (e.g., *"What is the ruling on wiping over socks?"* or *"How to perform Tayammum?"*). 
Running the entire RAG pipeline (BGE-M3 Embedding -> Qdrant Hybrid Search -> MongoDB Fetch -> Gemini Generation) for identical questions wastes immense resources and introduces unnecessary latency.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Exact vs. Semantic Caching

Zad-AI uses **Redis** to cache responses. 

While *Exact Keyword Caching* is simple (checking if the exact string exists in Redis), it is often ineffective because users ask the same question in slightly different ways. 
A more advanced implementation involves **Semantic Caching**, where the system compares the mathematical embedding of the incoming question against previously asked questions.

If the similarity score exceeds a strict threshold (e.g., `0.98`), the system completely bypasses the RAG and LLM generation pipelines, instantly returning the cached scholarly response in milliseconds.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Cache Invalidation & Expiry

To ensure that the cached answers remain accurate and do not permanently lock outdated information (especially if the underlying Qdrant data is updated), the Redis cache implements a Time-To-Live (TTL) expiry policy. 

Answers for highly frequent queries might live in the cache for 24-48 hours before being evicted, forcing the system to regenerate a fresh answer using the latest RAG context on the next query.

</div>

</div>
