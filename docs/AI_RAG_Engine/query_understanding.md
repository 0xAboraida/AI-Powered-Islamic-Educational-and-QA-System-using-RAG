<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Query Understanding & Parsing</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        Before any database retrieval occurs, Zad-AI deeply analyzes the user's input. The Query Understanding module is the first line of execution in the RAG pipeline. Its primary role is to extract semantic intent, resolve linguistic ambiguities, and construct explicit metadata filters to narrow down the vector search space.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The Challenge of Raw Queries

Users rarely provide perfectly structured questions. A query like *"What is the ruling on this in the Hanafi school?"* contains an explicit constraint ("Hanafi") but lacks a defined topic if asked in an ongoing conversation, or might be too broad. The system must transform unstructured natural language into a highly structured retrieval payload.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. LLM-Based Intent Extraction

To achieve maximum accuracy, Zad-AI utilizes a fast, structured-output LLM call (e.g., via `with_structured_output` in LangChain or native Pydantic parsing) the moment a query is received.

The LLM is tasked with outputting a strict JSON object containing:
* **`core_question`**: The refined, standalone version of the question.
* **`domain_filter`**: Extracted domain (e.g., *Fiqh*, *Aqeedah*), if explicitly mentioned.
* **`madhhab_filter`**: Extracted school of jurisprudence (e.g., *Hanafi*, *Shafii*).
* **`book_id`**: If the user asks about a specific text (e.g., *"According to Al-Mabsut..."*).

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Execution Pipeline

1. **Input Reception:** The FastAPI endpoint `/chat` receives the raw string.
2. **State Contextualization:** If there is chat history, the query is rewritten to be self-contained (e.g., resolving pronouns like "it" or "he" to their previous entities).
3. **Structured Parsing:** The parsed JSON object is passed down the pipeline. If a user asks *"Is Wudu required for touching the Quran according to Malik?"*, the parser outputs:

```json
{
  "core_question": "Is Wudu required for touching the Quran?",
  "madhhab_filter": "Maliki",
  "domain_filter": "Fiqh"
}
```

This ensures that when the system queries Qdrant (the Vector DB), it doesn't just search blindly based on vectors; it strictly limits the search space to the Maliki Madhhab, drastically reducing latency and completely eliminating cross-madhhab hallucinations.

</div>
</div>
