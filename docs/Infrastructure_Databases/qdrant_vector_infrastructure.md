<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Qdrant Vector Infrastructure</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        The vector database is the mathematical heart of the RAG engine. Storing millions of high-dimensional vectors requires massive RAM. Just like our MongoDB setup, severe financial constraints forced us to adopt a multi-account segmentation strategy for Qdrant Cloud.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The Financial Constraint

Generating and storing 1024D Dense vectors + Sparse vectors simultaneously for millions of Fiqh chunks is highly resource-intensive. Under normal circumstances, this would be hosted on a single, paid enterprise Qdrant cluster to ensure seamless HNSW graph navigation across the entire corpus.

Because a paid cluster was not an option, we hit the RAM limits of the free tier quickly. This required us to split the vector space itself.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Multi-Account Segmentation

To overcome this, we implemented a segmented architecture—while slightly less convoluted than the 12-cluster MongoDB setup, it still adds significant complexity. We divided the vector collections across **2 entirely separate Qdrant Cloud Accounts**.

The Python backend manages an `AccountRouter` that evaluates the domain of the user's query and dynamically decides which API key and cluster URL to authenticate against before sending the vector math request.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Payload Indexing for Speed

Despite the complexity of hopping between two Qdrant accounts, we maintained extreme speed (under 50ms per search) by heavily utilizing **Payload Indexes**.

Every vector contains metadata (Domain, Madhhab, Book ID). By indexing these payloads, Qdrant can perform exact-match filtering *before* executing the complex HNSW graph traversal. This means if the router selects Account A, and the query is about Hanbali Fiqh, Qdrant ignores 80% of the vectors in Account A instantly, effectively decoupling the retrieval latency from the total dataset size.

</div>

</div>
