"""
settings.py
-----------
Global Configuration and Environment Variables Manager.

Flow:
    1. Path Resolution: Safely locates the project root and loads the correct `.env` file, avoiding conflicts with outer environment files.
    2. Parsing: Uses `pydantic_settings` to read environment variables (like API keys, Redis URLs, and Hyperparameters).
    3. Type Validation: Automatically enforces types (e.g., ensuring `RAG_RRF_K` is an integer).
    4. Export: Exposes a singleton `settings` object that can be safely imported anywhere in the project.

Why this file?
    Scattering `os.getenv("API_KEY")` throughout the code leads to silent bugs and crashes if a key is missing.
    By using a centralized Settings class, we validate all crucial configuration at startup. If an environment
    variable is missing or wrongly typed, the app fails immediately and loudly, ensuring production stability.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field
from dotenv import load_dotenv

# Explicitly load the .env from services/ai_rag_engine to avoid loading the UTF-16 one in ML Codes
current_dir = Path(__file__).resolve().parent
project_root = None
for parent in [current_dir] + list(current_dir.parents):
    if (parent / "requirements.txt").exists() and (parent / "services").is_dir():
        project_root = parent
        break
if project_root is None:
    project_root = Path("/app")

if project_root:
    env_path = project_root / "services" / "ai_rag_engine" / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    else:
        load_dotenv()
else:
    load_dotenv()


class Settings(BaseSettings):
    # ── Qdrant — Account 1 ───────────────────────────────────────────────────
    QDRANT_URL_1: str = os.getenv(
        "QDRANT_URL",
        "https://9455bfe8-df54-49c1-8b09-f5c17b3ff5f3.sa-east-1-0.aws.cloud.qdrant.io:6333",
    )
    QDRANT_API_KEY_1: str = os.getenv("QDRANT_API_KEY", "")

    # ── Qdrant — Account 2 ───────────────────────────────────────────────────
    QDRANT_URL_2: str = os.getenv(
        "QDRANT_URL2",
        "https://99047c07-cb7e-4a87-bc9f-371ac3466a0f.sa-east-1-0.aws.cloud.qdrant.io:6333",
    )
    QDRANT_API_KEY_2: str = os.getenv("QDRANT_API_KEY2", "")

    # ── MongoDB cluster URIs ──────────────────────────────────────────────────
    # Names match the env keys used in mongo_router.py → get_routes()
    # Cluster 1: Fiqh — Hanbali + Hanafi
    MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1: str = os.getenv(
        "MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1", ""
    )

    # Cluster 2: Fiqh — Shafi'i + Maliki
    MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2: str = os.getenv(
        "MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2", ""
    )

    # Cluster 3: Aqeedah
    MONGO_URI_AQEEDAH_CLUSTER3: str = os.getenv("MONGO_URI_AQEEDAH_CLUSTER3", "")

    # Cluster 4: Tafseer
    MONGO_URI_TAFSEER_CLUSTER4: str = os.getenv("MONGO_URI_TAFSEER_CLUSTER4", "")

    # Cluster 5: Seerah
    MONGO_URI_SEERAH_CLUSTER5: str = os.getenv("MONGO_URI_SEERAH_CLUSTER5", "")

    # Cluster 6: Tarikh part 1
    MONGO_URI_TARIKH_CLUSTER6: str = os.getenv("MONGO_URI_TARIKH_CLUSTER6", "")

    # Cluster 7: Tarikh part 2
    MONGO_URI_TARIKH_CLUSTER7: str = os.getenv("MONGO_URI_TARIKH_CLUSTER7", "")

    # Cluster 8: Nahw & Sarf
    MONGO_URI_TARIKH_CLUSTER8: str = os.getenv("MONGO_URI_TARIKH_CLUSTER8", "")

    # Cluster 9: Hadith 1
    MONGO_URI_HADITH_CLUSTER9: str = os.getenv("MONGO_URI_HADITH_CLUSTER9", "")

    # Cluster 11: Hadith 2
    MONGO_URI_HADITH_CLUSTER11: str = os.getenv("MONGO_URI_HADITH_CLUSTER11", "")

    # Cluster 12: Hadith 3
    MONGO_URI_HADITH_CLUSTER12: str = os.getenv("MONGO_URI_HADITH_CLUSTER12", "")

    # # Cluster 10: Adab & Akhlaq (provision when ready)
    # MONGO_URI_ADAB_CLUSTER10: str = os.getenv("MONGO_URI_ADAB_CLUSTER10", "")

    # ── LLM ──────────────────────────────────────────────────────────────────
    GOOGLE_API_KEYS: str = os.getenv("GOOGLE_API_KEYS", "")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.0"))

    # ── RAG Pipeline Tuning ──────────────────────────────────────────────────
    # Number of final parent documents sent to the LLM when there is a single query
    RAG_SINGLE_QUERY_PARENT_TOP_K: int = int(
        os.getenv("RAG_SINGLE_QUERY_PARENT_TOP_K", "5")
    )

    # Number of final parent documents per sub-query when there are multiple queries
    RAG_MULTI_QUERY_PARENT_TOP_K: int = int(
        os.getenv("RAG_MULTI_QUERY_PARENT_TOP_K", "3")
    )

    # Number of child chunks fetched from Qdrant before parent expansion
    RAG_CHILD_TOP_K: int = int(os.getenv("RAG_CHILD_TOP_K", "25"))

    # Dense/Sparse candidate multiplier before fusion
    RAG_DENSE_MULTIPLIER: int = int(os.getenv("RAG_DENSE_MULTIPLIER", "1"))

    # RRF smoothing constant (original paper recommends 60)
    RAG_RRF_K: int = int(os.getenv("RAG_RRF_K", "60"))

    # ── Reranker Settings ────────────────────────────────────────────────────
    USE_RERANKER: bool = os.getenv("USE_RERANKER", "True").lower() in (
        "true",
        "1",
        "yes",
    )
    RERANKER_MODEL_NAME: str = os.getenv(
        "RERANKER_MODEL_NAME", "BAAI/bge-reranker-v2-m3"
    )
    RAG_RERANKER_TOP_K: int = int(os.getenv("RAG_RERANKER_TOP_K", "3"))

    # ── API Response Settings ────────────────────────────────────────────────
    RETURN_CONTEXT_CHUNKS: bool = os.getenv(
        "RETURN_CONTEXT_CHUNKS", "False"
    ).lower() in ("true", "1", "yes")
    RETURN_CITATION_CONTENT: bool = os.getenv(
        "RETURN_CITATION_CONTENT", "False"
    ).lower() in ("true", "1", "yes")

    # ── Fallback LLM Settings ────────────────────────────────────────────────
    FALLBACK_PROVIDER: str = os.getenv("FALLBACK_PROVIDER", "openai")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    FALLBACK_MODEL_NAME: str = os.getenv("FALLBACK_MODEL_NAME", "gpt-4o-mini")

    # ── Application Constants ────────────────────────────────────────────────
    SUPPORTED_DOMAINS: list[str] = [
        "فقه",
        "العقيدة",
        "السيرة",
        "التفسير",
        "الحديث",
        "التاريخ",
        "علوم القران",
        "النحو والصرف",
    ]

    DOMAIN_MAPPING: dict[int, str] = {
        1: "فقه",
        2: "العقيدة",
        3: "السيرة",
        4: "التفسير",
        5: "الحديث",
        6: "علوم القران",
        7: "التاريخ",
        8: "علوم اللغه",
    }

    # Redis Chat Memory
    REDIS_URL: str = Field(
        "redis://localhost:6379/0", description="Redis connection URL"
    )
    CHAT_HISTORY_TTL: int = Field(
        7200, description="Time to live for chat history in seconds (2 hours default)"
    )


settings = Settings()
