import codecs
with open('services/ai_rag_engine/.env', 'rb') as f:
    content = f.read().decode('utf-8', errors='ignore')
cleaned = content.split('RAG_RRF_K=60')[0] + 'RAG_RRF_K=60\n\n# Modal Cloud Embedding API\nMODAL_EMBEDDING_URL="https://aboraidaahmed--zad-embedding-service-bge-m3-bgem3modalse-76f9ff.modal.run"\n'
with open('services/ai_rag_engine/.env', 'w', encoding='utf-8') as f:
    f.write(cleaned)
