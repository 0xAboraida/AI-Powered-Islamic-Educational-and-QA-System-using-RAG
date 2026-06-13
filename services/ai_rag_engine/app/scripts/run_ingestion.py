import sys
import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

# Add the project root to sys.path to allow absolute imports
current_dir = Path(__file__).resolve().parent
project_root = None
for parent in [current_dir] + list(current_dir.parents):
    if parent.name == "Zad-AI":
        project_root = parent
        break
if not project_root:
    project_root = current_dir.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables
env_path = project_root / "services" / "ai_rag_engine" / ".env"
load_dotenv(dotenv_path=env_path)

from services.ai_rag_engine.app.models.embedding_models.factory import get_embedding_model, ModelType
from services.ai_rag_engine.app.pipeline.embeddings.filters.metadata_filter import MetadataFilter
from services.ai_rag_engine.app.pipeline.embeddings.processors.hierarchy_injector import HierarchyInjector
from services.ai_rag_engine.app.infrastructure.qdrant_db.qdrant_manager import QdrantManager
from services.ai_rag_engine.app.infrastructure.mongo_db.mongo_manager import MongoManager
from services.ai_rag_engine.app.pipeline.embeddings.storage.dual_storage_router import DualStorageRouter
from services.ai_rag_engine.app.pipeline.embeddings.embedding_pipeline import EmbeddingPipeline

def run():
    logger.info("=" * 70)
    logger.info("🟣 Starting ingestion pipeline...")
    logger.info("=" * 70)

    # =====================================================
    # ====================== CONFIG ========================
    # =====================================================
    
    # Helper to resolve variables like ${MY_VAR} just in case python-dotenv didn't
    def get_env_var(key, default=None):
        val = os.getenv(key, default)
        if val and val.startswith('${') and val.endswith('}'):
            return os.getenv(val[2:-1], default)
        return val

    BGEM3_VECTOR_SIZE = 1024
    
    # =====================================================
    # ================= DOMAIN CONFIG =====================
    # =====================================================
    # Update these values when ingesting a new domain.
    
    TARGET_DOMAIN = "التاريخ"
    BOOKS_REL_PATH = "data/02_extracted/05_Tarikh"
    
    QDRANT_COLLECTION = "zad_tarikh_collection"
    MONGO_DB_NAME = "zad_rag_db_tarikh"
    MONGO_COLLECTION = "parents_tarikh"

    # =====================================================
    
    CURRENT_MONGO = get_env_var("CURRENT_MONGO_URI")
    QDRANT_URL = get_env_var("CURRENT_QDRANT_URL")
    QDRANT_API_KEY = get_env_var("CURRENT_QDRANT_API_KEY")

    if "kaggle" in BOOKS_REL_PATH:
        BOOKS_PATH = Path(BOOKS_REL_PATH)
    else:
        BOOKS_PATH = project_root / BOOKS_REL_PATH

    USE_EXISTING_MONGO_CLUSTER = False
    NEW_MONGO_URI = CURRENT_MONGO

    EMBED_BATCH_SIZE = 256

    # =====================================================
    # ================= INITIALIZATION =====================
    # =====================================================

    metadata_filter = MetadataFilter(target_domain=TARGET_DOMAIN)
    hierarchy_injector = HierarchyInjector()
    bge_m3_model = get_embedding_model(ModelType.BGE_M3)

    qdrant_manager = QdrantManager(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    qdrant_manager.initialize_collection(collection_name=QDRANT_COLLECTION, dense_dim=BGEM3_VECTOR_SIZE)

    mongo_uri = CURRENT_MONGO if USE_EXISTING_MONGO_CLUSTER else NEW_MONGO_URI
    mongo_manager = MongoManager(uri=mongo_uri, db_name=MONGO_DB_NAME)

    storage_router = DualStorageRouter(
        qdrant_manager=qdrant_manager,
        mongo_manager=mongo_manager,
        qdrant_collection=QDRANT_COLLECTION,
        mongo_collection=MONGO_COLLECTION
    )

    pipeline = EmbeddingPipeline(
        filters=[metadata_filter],
        processors=[hierarchy_injector],
        embedding_model=bge_m3_model,
        storage_router=storage_router
    )

    # =====================================================
    # ==================== LOAD BOOKS ======================
    # =====================================================

    all_books = sorted(BOOKS_PATH.rglob("*_chunks.json"))
    if not all_books:
        # Fallback to .json if *_chunks.json not found
        all_books = sorted(BOOKS_PATH.rglob("*.json"))

    logger.info(f"Found {len(all_books)} books.")

    # =====================================================
    # ================= PROCESS BOOKS ======================
    # =====================================================

    for book_idx, json_path in enumerate(all_books, start=1):
        logger.info("=" * 70)
        logger.info(f"BOOK {book_idx}/{len(all_books)}")
        logger.info(f"Current Book: {json_path.name}")
        logger.info("=" * 70)

        try:
            with open(json_path, "r", encoding="utf-8") as f:
                chunks = json.load(f)

            logger.info(f"Loaded {len(chunks)} chunks.")
            total_batches = (len(chunks) + EMBED_BATCH_SIZE - 1) // EMBED_BATCH_SIZE

            for i in range(0, len(chunks), EMBED_BATCH_SIZE):
                batch = chunks[i:i + EMBED_BATCH_SIZE]
                current_batch = (i // EMBED_BATCH_SIZE) + 1
                start_chunk = i + 1
                end_chunk = min(i + EMBED_BATCH_SIZE, len(chunks))

                logger.info(
                    f"🟢 [BOOK {book_idx}] "
                    f"🔸 [BATCH {current_batch}/{total_batches}] "
                    f"♻️ Chunks {start_chunk} -> {end_chunk}"
                )

                pipeline.run(batch)

            logger.info(f"✅ Finished book: {json_path.name}")

        except Exception as e:
            logger.error(f"❌ Failed processing {json_path.name}")
            logger.error(str(e))
            continue

    logger.info("=" * 70)
    logger.info("✅ INGESTION COMPLETE")
    logger.info("=" * 70)

    mongo_manager.close()

if __name__ == "__main__":
    run()
