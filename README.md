# AI-Powered-Islamic-Educational-and-QA-System-using-RAG

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![.NET](https://img.shields.io/badge/.NET-8.0+-purple.svg)](https://dotnet.microsoft.com/)
[![Flutter](https://img.shields.io/badge/Flutter-3.10+-blue.svg)](https://flutter.dev/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Cloud-red.svg)](https://qdrant.tech/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)

**Zad** is an intelligent Islamic AI assistant powered by a production-grade **Hybrid RAG** (Retrieval-Augmented Generation) pipeline. It provides accurate, context-aware answers to questions about Islamic sciences (Fiqh, Aqeedah, Tafseer, Seerah, Tarikh) using a parent-child chunking strategy, hybrid dense+sparse vector search, and cross-encoder reranking.

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Mobile App (Flutter)              │
│              iOS / Android / Web Client             │
└───────────────────────┬─────────────────────────────┘
                        │  User Question + Domain
                        ▼
┌─────────────────────────────────────────────────────┐
│                 API Server (.NET Core)              │
│         Auth │ Rate Limiting │ REST Endpoints       │
└───────────────────────┬─────────────────────────────┘
                        │  HTTP Request
                        ▼
┌─────────────────────────────────────────────────────┐
│              AI RAG Engine (Python / FastAPI)       │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              RAG PIPELINE                    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Full RAG Pipeline — Step by Step

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         USER INTERFACE LAYER                             ║
╚══════════════════════════════════════╦═══════════════════════════════════╝
                                       ║
                    ┌──────────────────▼────────────────────────────┐
                    │           User Input                          │
                    │  Question: "ما حكم صلاة الجمعة للمسافر؟"     │
                    │  Domain: "الفقه"                              │
                    └──────────────────┬────────────────────────────┘
                                       │
╔══════════════════════════════════════▼═══════════════════════════════════╗
║                    STEP 1 — QUESTION PREPROCESSING (LLM)                 ║
╚══════════════════════════════════════╦═══════════════════════════════════╝
                                       │
                    ┌──────────────────▼───────────────────┐
                    │        QueryPreprocessor             │
                    │   Model: GPT-4o (via OpenAI API)     │
                    │   or GitHub Models Inference         │
                    │                                      │
                    │  Tasks:                              │
                    │  ✦ Multi-query splitting             │
                    │  ✦ Safety check (is_safe)            │
                    │  ✦ Rewrite in Modern Standard Arabic │
                    │  ✦ Try to predict Kitab name         │
                    │  ✦ Metadata extraction               │
                    └──────────────────┬───────────────────┘
                                       │
                    ┌──────────────────▼────────────────────┐
                    │     Structured JSON Output            │
                    │  (Pydantic: QuestionProcessingResult) │
                    │                                       │
                    │  {                                    │
                    │    "total_questions": 1,              │
                    │    "questions": [{                    │
                    │      "original_question": "...",      │
                    │      "search_query": "...(MSA)...",   │
                    │      "is_safe": true,                 │
                    │      "metadata": {                    │
                    │        "domain": "فقه",                │
                    │        "kitab": "كتاب الصلاة",           │
                    │        "madhhab": "حنبلي",             │
                    │        "author": null,                │
                    │        "source_book": null            │
                    │      }                                │
                    │    }]                                 │
                    │  }                                    │
                    └──────────────────┬────────────────────┘
                                       │
                    ┌──────────────────▼────────────────────┐
                    │         Safety Gate                   │
                    │   is_safe == false → REJECT           │
                    │   is_safe == true  → CONTINUE         │
                    └──────────────────┬────────────────────┘
                                       │
╔══════════════════════════════════════▼═══════════════════════════════════╗
║                    STEP 2 — HYBRID EMBEDDING (BGE-M3)                    ║
╚══════════════════════════════════════╦═══════════════════════════════════╝
                                       │
                    ┌──────────────────▼───────────────────┐
                    │     BGE-M3 Embedding Model           │
                    │  (Hosted Locally via FlagEmbedding)  │
                    │                                      │
                    │  Input: search_query (MSA)           │
                    │                                      │
                    │  Output:                             │
                    │  ┌────────────────────────────────┐  │
                    │  │  Dense Vector  [1024-dim]      │  │
                    │  │  (Cosine Similarity Search)    │  │
                    │  └────────────────────────────────┘  │
                    │  ┌────────────────────────────────┐  │
                    │  │  Sparse Vector (SPLADE-style)  │  │
                    │  │  (Keyword / BM25-style Search) │  │
                    │  └────────────────────────────────┘  │
                    └──────────────────┬───────────────────┘
                                       │
╔══════════════════════════════════════▼═══════════════════════════════════╗
║              STEP 3 — DOMAIN ROUTING → QDRANT COLLECTION                 ║
╚══════════════════════════════════════╦═══════════════════════════════════╝
                                       │
                    ┌──────────────────▼─────────────────────────────────┐
                    │        Domain Router Based on metadata.domain      │
                    └──────────────────┬─────────────────────────────────┘
                                       │
                    ┌──────────────────▼─────────────────────────────────┐
                    │ • فقه        ────────►  zad_seerah_collection      │
                    │ • عقيده      ────────►  zad_aqeedah_collection     │
                    │ • سيره       ────────►  zad_seerah_collection      │
                    │ • تفسير      ────────►  zad_Tafseer_collection     │
                    │ • تاريخ      ────────►  zad_tarikh_collection      │
                    │ • نحو وصرف   ────────►  zad_nahwSarf_collection    │
                    │ • حديث       ────────►  zad_hadith_collection      │
                    │ • بلاغه وشعر ────────►  zad_rhetoricPoetry_collection│
                    │ • علوم القران────────►  zad_quranScience_collection│
                    └──────────────────┬─────────────────────────────────┘
                                       │
╔══════════════════════════════════════▼═══════════════════════════════════╗
║              STEP 4 — HYBRID SEARCH ON QDRANT (Child Chunks)             ║
╚══════════════════════════════════════╦═══════════════════════════════════╝
                                       │
                    ┌──────────────────▼──────────────────┐
                    │     Hybrid Search with Filters       │
                    │                                      │
                    │  Pre-filter by:                      │
                    │   • metadata.domain                  │
                    │   • metadata.madhhab                 │
                    │   • metadata.hierarchy.kitab         │
                    │   • metadata.author (optional)       │
                    │   • metadata.book_title (optional)   │
                    │                                      │
                    │  ┌─────────────────────────────┐    │
                    │  │  Dense Search (COSINE)       │    │
                    │  │  Top-K semantic matches      │    │
                    │  └──────────────┬──────────────┘    │
                    │                 │                    │
                    │  ┌─────────────▼──────────────┐    │
                    │  │  Sparse Search (BM25)       │    │
                    │  │  Top-K keyword matches      │    │
                    │  └──────────────┬──────────────┘    │
                    └─────────────────┼──────────────────┘
                                      │
╔═════════════════════════════════════▼════════════════════════════════════╗
║              STEP 5 — FUSION (Reciprocal Rank Fusion - RRF)             ║
╚═════════════════════════════════════╦════════════════════════════════════╝
                                       │
                    ┌──────────────────▼──────────────────┐
                    │     RRF Fusion                       │
                    │                                      │
                    │  Merge Dense + Sparse ranked lists   │
                    │  Score(d) = Σ 1/(k + rank_i(d))     │
                    │                                      │
                    │  Output: Top 30 Child Chunks         │
                    │  (sorted by unified RRF score)       │
                    └──────────────────┬──────────────────┘
                                       │
╔══════════════════════════════════════▼═══════════════════════════════════╗
║              STEP 6 — PARENT RETRIEVAL (MongoDB Atlas)                  ║
╚══════════════════════════════════════╦═══════════════════════════════════╝
                                       │
                    ┌──────────────────▼──────────────────┐
                    │   Parent-Child Retrieval             │
                    │                                      │
                    │  For each child chunk:               │
                    │   child.parent_id → fetch Parent     │
                    │                                      │
                    │  Route to MongoDB by domain:         │
                    └──────────┬───────────────────────────┘
                               │
    ┌──────────────────────────┼─────────────────────────────────────┐
    │                          │                                     │
    ▼                          ▼                                     ▼
┌───────────────┐    ┌──────────────────┐    ┌──────────────────────────┐
│ Project-1     │    │  Project-3       │    │  Project-4/5/6/7         │
│ zad-rag-      │    │  zad-rag-        │    │  (Aqeedah/Tafseer/       │
│ cluster       │    │  cluster3        │    │   Seerah/Tarikh)         │
│               │    │                  │    │                          │
│ zad_rag_db    │    │ zad_rag_db_      │    │  Each domain has its own │
│ ├ parents_    │    │ aqeedah          │    │  dedicated cluster &     │
│ │  hanafi     │    │  └ parents_      │    │  collection              │
│ └ parents_    │    │    aqeedah       │    │                          │
│    hanbali    │    │ zad_rag_db_      │    │                          │
│               │    │ tafseer          │    │                          │
│ Project-2     │    │  └ parents_      │    │                          │
│ zad-rag-      │    │    tafseer       │    │                          │
│ cluster2      │    │                  │    │                          │
│               │    │                  │    │                          │
│ zad_rag_db_   │    │                  │    │                          │
│ shafii_maliki │    │                  │    │                          │
│ ├ parents_    │    │                  │    │                          │
│ │  maliki     │    │                  │    │                          │
│ └ parents_    │    │                  │    │                          │
│    shafii     │    │                  │    │                          │
└───────────────┘    └──────────────────┘    └──────────────────────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │  30 Full Parent Chunks       │
                    │  (rich, complete context)    │
                    └──────────┬──────────────────┘
                               │
╔══════════════════════════════▼═══════════════════════════════════════════╗
║                  STEP 7 — RERANKING (Cross-Encoder)                     ║
╚══════════════════════════════╦══════════════════════════════════════════╝
                               │
                    ┌──────────▼──────────────────┐
                    │  Cross-Encoder Reranker      │
                    │                              │
                    │  Input:                      │
                    │   • Original Question        │
                    │   • 30 Parent Chunks         │
                    │                              │
                    │  Scores each (Q, Chunk) pair │
                    │  with deep semantic scoring  │
                    │                              │
                    │  Output: Top 10 Chunks       │
                    │  (highest relevance score)   │
                    └──────────┬──────────────────┘
                               │
╔══════════════════════════════▼═══════════════════════════════════════════╗
║                  STEP 8 — RESPONSE GENERATION (LLM)                     ║
╚══════════════════════════════╦══════════════════════════════════════════╝
                               │
                    ┌──────────▼──────────────────┐
                    │     Prompt Builder           │
                    │                              │
                    │  [System Prompt]             │
                    │  + [Top 10 Parent Chunks]    │
                    │  + [User Question]           │
                    │  + [Chat History]            │
                    └──────────┬──────────────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │      LLM Generator           │
                    │   (Primary: Gemini + Keys)   │
                    │   (Fallback: Groq / GitHub)  │
                    │  Generates grounded answer   │
                    │  with source citations       │
                    └──────────┬──────────────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │      Final Response          │
                    │  • Answer (Arabic)           │
                    │  • Sources / Citations       │
                    │  • Referenced Books          │
                    └─────────────────────────────┘
```

---

## 🗄️ Database Architecture

### Qdrant Cloud — Vector Collections (Child Chunks)

| Collection Name | Domain | Notes |
|---|---|---|
| `zad_fiqh_collection`  | الفقه (general, hanafi, hanbali, maliki, shafii) | First collection, legacy name |
| `zad_aqeedah_collection` | العقيدة | — |
| `zad_Tafseer_collection` | التفسير (jami, mathur, ray) | — |
| `zad_tarikh_collection` | التاريخ (ansab, cities, culture, general, khulafa, states, tarajim) | — |
| `zad_seerah_collection` | السيرة النبوية (comprehensive, dalail, jawami, khasais, maghazi, shamail) | — |
| `zad_nahw_sarf_collection` | النحو والصرف (nahw, sarf) | — |
| `zad_hadith_collection` | الحديث (ahkam, atraf, daif, ilal, maajim, majami, masanid, mawduat, mustadrakat, mustakhrajat, mustalah, muwatta_musannafat, shuruh, sihah, sunan, takhrij, targhib) | — |

**Each point stores:**
```json
{
  "chunk_id": "uuid",
  "parent_id": "uuid",
  "content": "child chunk text",
  "embeddings": {
    "dense":  [1024-dim float array],
    "sparse": { "indices": [...], "values": [...] }
  },
  "metadata": {
    "domain":     "فقه",
    "madhhab":    "حنبلي",
    "book_title": "زاد المستقنع",
    "author":     "الحجاوي",
    "hierarchy": {
      "kitab":    "كتاب الصلاة",
      "sections": ["باب صلاة الجمعة"]
    }
  }
}
```

**Payload Indices:** `metadata.domain`, `metadata.madhhab`, `metadata.book_title`, `metadata.author`, `metadata.hierarchy.kitab`, `parent_id`, `chunk_id`

---

### MongoDB Atlas — Parent Chunks Storage

| Project | Cluster | Database | Collections |
|---|---|---|---|
| zad-rag-project-1 | zad-rag-cluster | zad_rag_db | `parents_hanafi`, `parents_hanbali` |
| zad-rag-project-2 | zad-rag-cluster2 | zad_rag_db_shafii_maliki | `parents_maliki`, `parents_shafii` |
| zad-rag-project-3 | zad-rag-cluster3 | zad_rag_db_aqeedah | `parents_aqeedah` |
| zad-rag-project-3 | zad-rag-cluster3 | zad_rag_db_tafseer | `parents_tafseer` |
| zad-rag-project-4 | zad-rag-cluster4 | zad_rag_db_tafseer | `parents_tafseer` |
| zad-rag-project-5 | zad-rag-cluster5 | zad_rag_db_seerah | `parents_seerah` |
| zad-rag-project-6 | zad-rag-cluster6 | zad_rag_db_tarikh | `parents_tarikh` |
| zad-rag-project-7 | zad-rag-cluster7 | zad_rag_db_tarikh2 | `parents_tarikh` |

> Multiple projects for Tafseer and Tarikh due to MongoDB Atlas free-tier storage limits.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Mobile App** | Flutter (Dart) — iOS / Android / Web |
| **API Server** | ASP.NET Core (.NET 8+) |
| **AI Engine** | Python 3.12+, FastAPI |
| **LLM (Preprocessing + Generation)** | Gemini (Primary w/ Rotation) / Groq / GitHub Models |
| **Embedding Model** | BGE-M3 (Dense 1024-dim + Sparse) — Local Execution |
| **Vector Database** | Qdrant Cloud |
| **Document Database** | MongoDB Atlas |
| **Reranker** | Cross-Encoder (sentence-transformers) |
| **Orchestration** | LangChain + Pydantic |
| **Deployment** | Docker / Docker Compose |

---

## 📂 Project Structure

```
Zad-AI/
│
├── services/
│   └── ai_rag_engine/
│       ├── .env
│       ├── requirements.txt
│       └── app/
│           ├── main.py
│           │
│           ├── Orchestrator/
│           │   └── orchestrator.py
│           │
│           ├── api/                                        # FastAPI endpoints
│           │
│           ├── config/
│           │   ├── settings.py
│           │   └── key_manager.py                          # Gemini API Key Rotation Manager
│           │
│           ├── infrastructure/
│           │   ├── mongo_db/
│           │   │   ├── mongo_manager.py                    # MongoDB Atlas client
│           │   │   └── __init__.py
│           │   └── qdrant_db/
│           │       ├── qdrant_manager.py                   # Qdrant Cloud client (dense + sparse)
│           │       └── __init__.py
│           │
│           ├── models/
│           │   ├── embedding_models/
│           │   │   ├── base.py                             # Abstract EmbeddingModel
│           │   │   ├── bge_m3_model.py                     # BGE-M3 (dense + sparse) - Local
│           │   │   ├── e5_model.py                         # E5 model (legacy)
│           │   │   ├── factory.py                          # Model factory
│           │   │   └── __init__.py
│           │   └── LLM/
│           │       ├── factory.py                          # LLM Factory (Gemini / Groq / GitHub)
│           │       ├── gemini_model.py                     # Primary Model with Rotation
│           │       ├── groq_model.py                       # Fallback Model
│           │       ├── openai_model.py                     # GitHub Models / OpenAI Fallback
│           │       ├── base.py
│           │       └── __init__.py
│           │
│           ├── notebooks/                                  # Experimentation notebooks
│           │
│           ├── pipeline/
│           │   ├── extraction/                             # Offline: book scraping from API
│           │   │   ├── api_client.py                       # Ketabonline API client
│           │   │   ├── books_config.py                     # Book IDs & domain mapping
│           │   │   ├── extractor.py                        # Main extraction logic
│           │   │   ├── hierarchy_builder.py                # TOC → hierarchy tree
│           │   │   ├── html_processor.py                   # HTML → clean text
│           │   │   ├── state_manager.py                    # Resume/checkpoint support
│           │   │   ├── text_utils.py                       # Arabic text utilities
│           │   │   └── __init__.py
│           │   │
│           │   ├── preprocessing/                          # Offline & Online preprocessing
│           │   │   ├── data_preprocessing/                 # Offline: cleaning & chunking
│           │   │   ├── question_preprocessing/             # Online: query understanding (LLM)
│           │   │   │   ├── models.py                       # Pydantic schemas (ProcessedQuestion)
│           │   │   │   ├── prompt.py                       # LLM system prompt
│           │   │   │   └── query_preprocessor.py           # QueryPreprocessor class
│           │   │   └── question_processing/                # Online: advanced query ops
│           │   │
│           │   ├── embeddings/                             # Offline: embedding ingestion pipeline
│           │   │   ├── embedding_pipeline.py               # Main ingestion orchestrator
│           │   │   ├── core/
│           │   │   ├── cache/
│           │   │   ├── filters/
│           │   │   ├── processors/
│           │   │   └── storage/
│           │   │
│           │   ├── retrieval/                              # Online: vector search
│           │   │   ├── base_retriever.py
│           │   │   ├── dense_retriever.py                  # Dense cosine similarity search
│           │   │   ├── sparse_retriever.py                 # Sparse BM25-style search
│           │   │   ├── hybrid_search.py                    # Dense + Sparse combined
│           │   │   ├── fusion.py                           # RRF fusion (Top-30)
│           │   │   ├── parent_child.py                     # Fetch parents from MongoDB
│           │   │   └── __init__.py
│           │   │
│           │   ├── reranking/                              # Online: cross-encoder reranking
│           │   │   ├── base_reranker.py
│           │   │   ├── cross_encoder.py                    # Cross-Encoder (Top-30 → Top-10)
│           │   │   ├── diversity_scorer.py                 # MMR diversity scoring
│           │   │   └── __init__.py
│           │   │
│           │   └── generation/                             # Online: answer generation
│           │       ├── prompt_builder.py                   # Build final LLM prompt
│           │       ├── llm_service.py                      # LLM Streamer with Key Rotation
│           │       ├── citations.py                        # Source citation formatter
│           │       └── __init__.py
│           │
│           ├── scripts/                                    # Offline runner scripts & Testing
│           │   ├── run_extraction.py                       # Run book extraction
│           │   ├── run_preprocessing_pipeline.py           # Run data preprocessing
│           │   ├── run_ingestion.py                        # Run embedding + storage
│           │   ├── test_stream.html                        # UI Tester for Streaming
│           │   └── test_retrieval.py                       # Retrieval tester
│           │
│           └── templates/                                  # HTML Templates for endpoints
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
│   │   └── docker-compose.yml
│   └── vector-db/
│       └── qdrant-config.yaml
│
├── docs/
├── start_api.ps1                                           # Helper script to launch Server
├── requirements.txt
├── README.md
└── LICENSE
```
```

---

## 🚀 Covered Islamic Domains

| Domain | Arabic | Qdrant Collection | MongoDB |
|---|---|---|---|
| Fiqh — Hanafi | الفقه الحنفي | `zad_fiqh_collection` | `parents_hanafi` |
| Fiqh — Hanbali | الفقه الحنبلي | `zad_fiqh_collection` | `parents_hanbali` |
| Fiqh — Shafi'i | الفقه الشافعي | `zad_fiqh_collection` | `parents_shafii` |
| Fiqh — Maliki | الفقه المالكي | `zad_fiqh_collection` | `parents_maliki` |
| Aqeedah | العقيدة | `zad_aqeedah_collection` | `parents_aqeedah` |
| Tafseer | التفسير | `zad_Tafseer_collection` | `parents_tafseer` |
| Seerah | السيرة النبوية | `zad_seerah_collection` | `parents_seerah` |
| Tarikh | التاريخ الإسلامي | `zad_tarikh_collection` | `parents_tarikh` |

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- .NET 8.0 SDK
- Python 3.12+
- Flutter SDK (for mobile)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/zad-islamic-ai.git
cd zad-islamic-ai
```

### 2. Configure Environment

```bash
cp services/ai_rag_engine/.env.example services/ai_rag_engine/.env
# Fill in: OPEN_AI_KEY, QDRANT_URL, QDRANT_API_KEY, MONGO_URI_*
```

### 3. Launch with Docker

```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### 4. Run AI Engine Locally

You can run the engine manually or use the provided helper script for Windows.

**Option A: Quick Start (Windows)**
If you are on Windows, you can simply run the provided PowerShell script which will handle activating the environment and starting the server for you:
```powershell
.\start_api.ps1
```

**Option B: Manual Start (All Platforms)**
```bash
# 1. Navigate to the engine directory
cd services/ai_rag_engine

# 2. Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/Mac:
source .venv/bin/activate

# 3. Install the package locally (uses setup.py to resolve imports)
pip install -e .

# 4. Install requirements
pip install -r requirements.txt

# 5. Run the server
uvicorn services.ai_rag_engine.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Run Mobile App

```bash
cd apps/mobile_app
flutter pub get
flutter run
```

---

## 📊 Offline Data Ingestion Pipeline

```
Islamic Books (PDFs)
        │
        ▼
  Text Extraction
  (ketabonline API)
        │
        ▼
  Cleaning & Normalization
  (Arabic text, diacritics, noise)
        │
        ▼
  Hierarchical Chunking
  Parent Chunks (large context)
  └── Child Chunks (small, indexed)
        │
        ▼
  Metadata Injection
  (domain, madhhab, kitab, author,
   book_title, hierarchy, parent_id)
        │
        ├──────────────────────────┐
        ▼                          ▼
  BGE-M3 Embedding         Store Parent Chunks
  (Dense + Sparse)         → MongoDB Atlas
        │
        ▼
  Store Child Chunks
  → Qdrant Cloud
  (with payload indices)
```

---

## 🧪 Testing

```bash
# AI Engine tests
cd services/ai_rag_engine
pytest

# API tests
cd apps/api-sever
dotnet test

# Mobile app tests
cd apps/mobile_app
flutter test
```

---

## 📚 Documentation

- [Architecture Diagrams](./docs/architecture-diagrams/)
- [AI Design](./docs/ai-design.md)
- [API Documentation](./docs/api-documentation/)
- [Deployment Guide](./docs/deployment-guide.md)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

*Built with ❤️ for the Muslim community*

---

User Query
    ↓
Domain Detection
    ↓
Domain Prompt
    ↓
Structured Filters
    ↓
Qdrant Search
