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
    # Qdrant Account 1
    QDRANT_URL_1: str = os.getenv("QDRANT_URL", "https://9455bfe8-df54-49c1-8b09-f5c17b3ff5f3.sa-east-1-0.aws.cloud.qdrant.io:6333")
    QDRANT_API_KEY_1: str = os.getenv("QDRANT_API_KEY", "")

    # Qdrant Account 2
    QDRANT_URL_2: str = os.getenv("QDRANT_URL2", "https://99047c07-cb7e-4a87-bc9f-371ac3466a0f.sa-east-1-0.aws.cloud.qdrant.io:6333")
    QDRANT_API_KEY_2: str = os.getenv("QDRANT_API_KEY2", "")

    # MongoDB URIs for different clusters
    MONGO_URI_PROJECT_1: str = os.getenv("MONGO_URI_PROJECT_1", "mongodb://localhost:27017")
    MONGO_URI_PROJECT_2: str = os.getenv("MONGO_URI_PROJECT_2", "mongodb://localhost:27017")
    MONGO_URI_PROJECT_3: str = os.getenv("MONGO_URI_PROJECT_3", "mongodb://localhost:27017")
    MONGO_URI_PROJECT_4: str = os.getenv("MONGO_URI_PROJECT_4", "mongodb://localhost:27017")
    MONGO_URI_PROJECT_5: str = os.getenv("MONGO_URI_PROJECT_5", "mongodb://localhost:27017")
    MONGO_URI_PROJECT_6: str = os.getenv("MONGO_URI_PROJECT_6", "mongodb://localhost:27017")
    MONGO_URI_PROJECT_7: str = os.getenv("MONGO_URI_PROJECT_7", "mongodb://localhost:27017")
    MONGO_URI_PROJECT_8: str = os.getenv("MONGO_URI_PROJECT_8", "mongodb://localhost:27017")
    MONGO_URI_PROJECT_9: str = os.getenv("MONGO_URI_PROJECT_9", "mongodb://localhost:27017")
    # NOTE: MONGO_URI_PROJECT_11 and MONGO_URI_PROJECT_12 were removed (unused)

    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gemini-2.0-flash")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.0"))

    # ── RAG Pipeline Tuning ──────────────────────────────────────────────────
    # Number of final parents returned to the LLM
    RAG_FINAL_TOP_K: int = int(os.getenv("RAG_FINAL_TOP_K", "3"))

    # Number of child chunks fetched from Qdrant before parent expansion
    RAG_CHILD_TOP_K: int = int(os.getenv("RAG_CHILD_TOP_K", "25"))

    # Dense/Sparse candidate multiplier
    RAG_DENSE_MULTIPLIER: int = int(os.getenv("RAG_DENSE_MULTIPLIER", "1"))

    # RRF smoothing constant
    RAG_RRF_K: int = int(os.getenv("RAG_RRF_K", "60"))

settings = Settings()

