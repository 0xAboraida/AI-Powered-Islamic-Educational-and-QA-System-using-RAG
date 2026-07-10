<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 5px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Hybrid Search Architecture</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        Standard vector search struggles with Arabic legal (Fiqh) terminology because exact keyword matches are often as important as semantic meaning. To resolve this, Zad-AI completely abandons pure dense retrieval in favor of a Hybrid Search architecture, leveraging BGE-M3 and Qdrant.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The BGE-M3 Embedding Model

Zad-AI uses the `BAAI/bge-m3` model, which is fundamentally different from standard embeddings (like OpenAI's `text-embedding-3`). It is designed to generate multiple representations simultaneously.

When a parsed query (from the Query Understanding module) is passed to BGE-M3, it generates:
1. **Dense Vector (Semantic):** A 1024-dimensional array capturing the deep meaning and intent of the question. (Excellent for finding answers even if synonyms are used).
2. **Sparse Vector (Lexical/BM25):** A massive, sparse array that maps exact token weights. (Excellent for finding specific Fiqh terms like "Tayamum" or "Zakat Al-Fitr" that must match exactly).

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Payload Filtering in Qdrant

Before the mathematical search is executed, Qdrant applies strict **Payload Filters** based on the metadata extracted during the Query Understanding phase. 

If the query parser detected `"madhhab_filter": "Hanafi"`, Qdrant physically isolates the Hanafi chunks before doing any vector math. This architectural decision achieves two things:
1. **Zero Hallucination:** It is mathematically impossible for a Shafii ruling to be retrieved for a Hanafi query.
2. **Extreme Speed:** The search space is reduced by 75-80% instantly.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. The Retrieval Execution

Qdrant executes two independent searches simultaneously across the filtered "Child Chunks":
* A Dense search using Cosine Similarity on the 1024D vector.
* A Sparse search using exact lexical weights.

Qdrant returns two separate lists of top-k candidates (e.g., Top 20 Semantic, Top 20 Lexical). These lists must now be merged mathematically, which leads directly into the **Reciprocal Rank Fusion (RRF)** stage.

</div>

</div>