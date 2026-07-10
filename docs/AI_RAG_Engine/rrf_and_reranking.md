<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> RRF & Cross-Encoder Reranking</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        After Qdrant performs the Hybrid Search, it returns two disparate lists of chunks (Dense and Sparse). These lists must be mathematically merged, and then strictly evaluated to ensure only highly relevant, scholarly text reaches the LLM context window.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. Reciprocal Rank Fusion (RRF)

Dense scores (Cosine Similarity) and Sparse scores (BM25) exist on completely different mathematical scales; you cannot simply add them together. 

To merge them, Qdrant utilizes the **Reciprocal Rank Fusion (RRF)** algorithm. RRF ignores the raw scores and instead looks at the *rank* of the chunk in each list.
The formula applied is:
`RRF_Score = 1 / (k + Rank_Dense) + 1 / (k + Rank_Sparse)` *(where k is a constant, usually 60)*

If a chunk is #1 in semantic meaning and #3 in exact keyword matching, it gets a massive RRF score and rises to the absolute top of the combined list.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. The Necessity of a Cross-Encoder

Even with RRF, Bi-Encoders (like BGE-M3) can make mistakes because they embed the query and the document separately in isolation.
To fix this, we pass the top 15 results from RRF into a **Cross-Encoder Model** (`BAAI/bge-reranker-v2-m3`).

A Cross-Encoder does not use pre-calculated vectors. Instead, it reads the User's Query and the Document *at the exact same time* and calculates a deep attention-based relevance score from `0.0` to `1.0`.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Thresholding & Pruning

Zad-AI implements a strict **Relevance Threshold** (e.g., `Score > 0.45`). 
* If a chunk scores below this threshold, it is permanently discarded.
* If *all* chunks score below this threshold, the system triggers a `No_Context` fallback, and gracefully informs the user that the answer cannot be found in the current Islamic corpus, rather than hallucinating an answer.

The top 3-5 surviving chunks are now ready to have their "Parent Documents" fetched from MongoDB for Context Injection.

</div>
