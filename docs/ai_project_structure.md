# 📂 AI RAG Engine Project Structure

Below is the detailed directory structure for the core AI RAG (Retrieval-Augmented Generation) Engine.

```text
Zad-AI/
│
├── services/
│   └── ai_rag_engine/
│       ├── .env
│       ├── requirements.txt
│       └── app/
│           ├── main.py                                     # FastAPI Application Entrypoint
│           │
│           ├── api/                                        # FastAPI endpoints & schemas
│           │   ├── routes.py                               # Central router registry
│           │   └── schemas.py                              # Pydantic validation models
│           │
│           ├── config/
│           │   ├── settings.py                             # Environment variables & constants
│           │   └── key_manager.py                          # Gemini API Key Rotation Manager
│           │
│           ├── infrastructure/
│           │   ├── mongo_db/                               # MongoDB Atlas client (Parent Chunks)
│           │   └── qdrant_db/                              # Qdrant Cloud client (Vector Search)
│           │
│           ├── models/
│           │   ├── embedding_models/                       # Embedding Model Wrappers
│           │   │   ├── base.py
│           │   │   ├── bge_m3_model.py                     # Primary: BGE-M3 (dense + sparse)
│           │   │   ├── e5_model.py                         # Legacy: E5 Model
│           │   │   └── factory.py                          # Model factory
│           │   └── LLM/                                    # LLM Generation Wrappers
│           │       ├── base.py
│           │       ├── factory.py                          # LLM Factory
│           │       ├── gemini_model.py                     # Primary Model (with key rotation)
│           │       ├── groq_model.py                       # High-speed Fallback Model
│           │       └── openai_model.py                     # GitHub Models / OpenAI Fallback
│           │
│           ├── notebooks/                                  # Jupyter notebooks for experimentation
│           │
│           ├── pipeline/                                   # Core RAG Logic
│           │   ├── orchestrator.py                         # Central Brain & Request Routing
│           │   ├── memory_service.py                       # Redis Chat History Management
│           │   │
│           │   ├── extraction/                             # Offline: Book scraping from Ketabonline API
│           │   │
│           │   ├── preprocessing/                          # Offline & Online preprocessing
│           │   │   ├── data_preprocessing/                 # Offline: Cleaning & chunking raw text
│           │   │   └── question_preprocessing/             # Online: Query understanding (LLM rewriting)
│           │   │
│           │   ├── embeddings/                             # Offline: Embedding ingestion pipeline
│           │   │
│           │   ├── retrieval/                              # Online: Vector search & parent fetching
│           │   │   ├── retrieval_service.py                # Main retrieval facade
│           │   │   ├── hybrid_search.py                    # Dense + Sparse combined search
│           │   │   ├── fusion.py                           # RRF fusion for search results
│           │   │   └── parent_child.py                     # Parent-Child mapping via MongoDB
│           │   │
│           │   ├── reranking/                              # Online: Cross-encoder reranking
│           │   │   ├── base_reranker.py
│           │   │   ├── cross_encoder.py                    # Sentence-Transformers Cross-Encoder
│           │   │   └── diversity_scorer.py                 # MMR diversity scoring
│           │   │
│           │   └── generation/                             # Online: Answer generation
│           │       ├── prompt_builder.py                   # Injects context into LLM templates
│           │       ├── llm_service.py                      # LLM Streamer with Key Rotation
│           │       ├── citations.py                        # Source citation JSON formatter
│           │       └── prompts/                            # Domain-specific LLM templates
│           │
│           ├── scripts/                                    # Offline runner scripts & Testing
│           │   ├── run_extraction.py
│           │   ├── run_ingestion.py
│           │   ├── run_preprocessing_pipeline.py
│           │   └── test_stream.py
│           │
│           └── templates/                                  # HTML Templates for UI testing
│
├── data/
│   ├── raw/                                                # Scraped Islamic texts (JSON)
│   ├── processed/                                          # Cleaned & chunked (parent + child)
│   └── embeddings/                                         # Cached embeddings
│
├── infrastructure/
│   ├── docker/
│   │   ├── backend.Dockerfile
│   │   ├── ai.Dockerfile
│   │   ├── docker-compose.yml                              # Local dev deployment
│   │   └── docker-compose.prod.yml                         # Prod deployment (Includes Redis)
│   └── vector-db/
│       └── qdrant-config.yaml
│
├── docs/                                                   # Documentation files
├── start_api.ps1                                           # Windows helper script to launch server
├── requirements.txt
├── README.md
└── LICENSE
```
