<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">


<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Prompt Engineering & Context Injection</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        Once the Reranker has identified the top most relevant "Child Chunks", Zad-AI executes its unique Parent-Child context expansion. This phase constructs the final Prompt payload that will be sent to the Language Model.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. Parent Document Expansion (MongoDB)

The surviving Child Chunks from Qdrant are highly accurate, but they are too small (e.g., 400 words) to provide a comprehensive scholarly answer. 

1. The RAG engine reads the `parent_id` from each surviving Child Chunk.
2. It executes an asynchronous fetch to **MongoDB Atlas**.
3. It retrieves the *entire* Parent Document (which contains the full, unbroken Fiqh issue, fully diacritized with Tashkeel).

This guarantees that the LLM has maximum context, reducing the chance of misinterpreting a truncated legal sentence.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Context Formatting

The retrieved Parent Documents are formatted into a massive string block. Crucially, Zad-AI injects the metadata directly into the text so the LLM knows *where* the text came from.

```text
[المصدر 1]
الكتاب: المبسوط للسرخسي
المذهب: حنفي
النص: {parent_document_content}
```

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. The System Prompt

The System Prompt is rigorously engineered to constrain the LLM. It enforces several strict rules:
* **No External Knowledge:** The LLM is explicitly forbidden from answering using its pre-trained weights. It MUST use the provided context.
* **Citation Requirement:** The LLM must cite its sources exactly as provided in the context blocks (e.g., "كما ورد في كتاب المبسوط للسرخسي...").
* **Language Constraints:** Must output in formal, classical Arabic without formatting markdown errors.

The final payload (System Prompt + Injected Context + User Query) is now dispatched to the LLM Generation layer.

</div>
