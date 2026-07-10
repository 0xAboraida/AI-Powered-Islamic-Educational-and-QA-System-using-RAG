<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Useful Developer Scripts</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        The RAG Engine includes several standalone Python scripts designed to test specific parts of the pipeline independently without starting the web server.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. Test Query Preprocessor

Tests the regex, query rewriting, and intent extraction logic independently:
```powershell
python -m services.ai_rag_engine.app.pipeline.preprocessing.question_preprocessing.query_preprocessor
```

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Test Retrieval Pipeline

Simulates a query hitting the Qdrant database and retrieving documents, bypassing the LLM completely. Essential for tuning the `bge-m3` embedding accuracy:
```powershell
python -m services.ai_rag_engine.app.scripts.test_retrieval
```

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Data Ingestion & Embeddings

If you have downloaded new books and need to push them into MongoDB and Qdrant, use these bulk-processing scripts:

```powershell
# Step 1: Run Embeddings on raw text
python -m services.ai_rag_engine.app.scripts.run_embedding

# Step 2: Push structured data to databases
python -m services.ai_rag_engine.app.scripts.run_ingestion
```

</div>

</div>
