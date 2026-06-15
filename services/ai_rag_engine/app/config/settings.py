import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Explicitly load the .env from services/ai_rag_engine to avoid loading the UTF-16 one in ML Codes
current_dir = Path(__file__).resolve().parent
project_root = None
for parent in [current_dir] + list(current_dir.parents):
    if parent.name == "Zad-AI":
        project_root = parent
        break

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
    QDRANT_URL_1: str = os.getenv("QDRANT_URL", "https://9455bfe8-df54-49c1-8b09-f5c17b3ff5f3.sa-east-1-0.aws.cloud.qdrant.io:6333")
    QDRANT_API_KEY_1: str = os.getenv("QDRANT_API_KEY", "")

    # ── Qdrant — Account 2 ───────────────────────────────────────────────────
    QDRANT_URL_2: str = os.getenv("QDRANT_URL2", "https://99047c07-cb7e-4a87-bc9f-371ac3466a0f.sa-east-1-0.aws.cloud.qdrant.io:6333")
    QDRANT_API_KEY_2: str = os.getenv("QDRANT_API_KEY2", "")

    # ── MongoDB cluster URIs ──────────────────────────────────────────────────
    # Names match the env keys used in mongo_router.py → get_routes()
    # Cluster 1: Fiqh — Hanbali + Hanafi
    MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1: str = os.getenv("MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1", "")

    # Cluster 2: Fiqh — Shafi'i + Maliki
    MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2: str = os.getenv("MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2", "")

    # Cluster 3: Aqeedah (+ Tafseer part 1 shares same cluster)
    MONGO_URI_AQEEDAH_CLUSTER3: str = os.getenv("MONGO_URI_AQEEDAH_CLUSTER3", "")

    # Cluster 4: Tafseer part 2
    MONGO_URI_TAFSEER_CLUSTER4: str = os.getenv("MONGO_URI_TAFSEER_CLUSTER4", "")

    # Cluster 5: Seerah
    MONGO_URI_SEERAH_CLUSTER5: str = os.getenv("MONGO_URI_SEERAH_CLUSTER5", "")

    # Cluster 6: Tarikh part 1
    MONGO_URI_TARIKH_CLUSTER6: str = os.getenv("MONGO_URI_TARIKH_CLUSTER6", "")

    # Cluster 7: Tarikh part 2
    MONGO_URI_TARIKH_CLUSTER7: str = os.getenv("MONGO_URI_TARIKH_CLUSTER7", "")

    # Cluster 8: Nahw & Sarf
    MONGO_URI_TARIKH_CLUSTER8: str = os.getenv("MONGO_URI_TARIKH_CLUSTER8", "")

    # Cluster 9: Hadith
    MONGO_URI_HADITH_CLUSTER9: str = os.getenv("MONGO_URI_HADITH_CLUSTER9", "")

    # Cluster 10: Adab & Akhlaq (provision when ready)
    MONGO_URI_ADAB_CLUSTER10: str = os.getenv("MONGO_URI_ADAB_CLUSTER10", "")

    # ── LLM ──────────────────────────────────────────────────────────────────
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.0"))

    # ── RAG Pipeline Tuning ──────────────────────────────────────────────────
    # Number of final parent documents sent to the LLM when there is a single query
    RAG_SINGLE_QUERY_PARENT_TOP_K: int = int(os.getenv("RAG_SINGLE_QUERY_PARENT_TOP_K", "5"))

    # Number of final parent documents per sub-query when there are multiple queries
    RAG_MULTI_QUERY_PARENT_TOP_K: int = int(os.getenv("RAG_MULTI_QUERY_PARENT_TOP_K", "3"))

    # Number of child chunks fetched from Qdrant before parent expansion
    RAG_CHILD_TOP_K: int = int(os.getenv("RAG_CHILD_TOP_K", "25"))

    # Dense/Sparse candidate multiplier before fusion
    RAG_DENSE_MULTIPLIER: int = int(os.getenv("RAG_DENSE_MULTIPLIER", "1"))

    # RRF smoothing constant (original paper recommends 60)
    RAG_RRF_K: int = int(os.getenv("RAG_RRF_K", "60"))


settings = Settings()
