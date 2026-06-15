# Zad-AI Useful Commands

This document contains useful commands for running different parts of the Zad-AI RAG pipeline.
All these commands assume you are running them from the root of the project: `E:\AI\AI-Code\ML Codes\Graduation Project Zad\Zad-AI`

### 1. Start the API Server & Chat UI
You can use the provided PowerShell script to easily start the server:
```powershell
.\start_api.ps1
```
*(After it starts, open `http://localhost:8000/chat-ui` in your browser)*

Alternatively, run the python command directly:
```powershell
& "E:\AI\AI-Code\ML Codes\.venv\Scripts\python.exe" -m uvicorn services.ai_rag_engine.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 2. Run Data Ingestion
To ingest parsed data into the Qdrant Vector Store:
```powershell
& "E:\AI\AI-Code\ML Codes\.venv\Scripts\python.exe" -m services.ai_rag_engine.app.scripts.run_ingestion
```

---

### 3. Run Embeddings
To run the embedding script:
```powershell
& "E:\AI\AI-Code\ML Codes\.venv\Scripts\python.exe" "E:\AI\AI-Code\ML Codes\Graduation Project Zad\Zad-AI\services\ai_rag_engine\app\scripts\run_embedding.py"
```

---

### 4. Test Query Preprocessor
To test the query preprocessing logic:
```powershell
& "E:\AI\AI-Code\ML Codes\.venv\Scripts\python.exe" "E:\AI\AI-Code\ML Codes\Graduation Project Zad\Zad-AI\services\ai_rag_engine\app\pipeline\preprocessing\question_preprocessing\query_preprocessor.py"
```

---

### 5. Test Retrieval Pipeline
To test if the semantic search and retrieval is working correctly:
```powershell
& "E:\AI\AI-Code\ML Codes\.venv\Scripts\python.exe" "E:\AI\AI-Code\ML Codes\Graduation Project Zad\Zad-AI\services\ai_rag_engine\app\scripts\test_retrieval.py"
```

---

### 6. Activating Virtual Environment Manually
If you want to manually activate the virtual environment in PowerShell:
```powershell
& "E:\AI\AI-Code\ML Codes\.venv\Scripts\Activate.ps1"
```

---

### Useful Regex Snippets
- Filter out surah numbers: `\s*\d+\s*-\s*(سورة)`
