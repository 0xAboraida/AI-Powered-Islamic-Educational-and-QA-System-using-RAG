import sys
import json
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

# Add the project root to sys.path to allow absolute imports
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent.parent.parent
sys.path.insert(0, str(project_root))

from services.ai_rag_engine.app.models.embedding_models.factory import get_embedding_model, ModelType
from services.ai_rag_engine.app.pipeline.embeddings.filters.metadata_filter import MetadataFilter
from services.ai_rag_engine.app.pipeline.embeddings.processors.hierarchy_injector import HierarchyInjector
from services.ai_rag_engine.app.infrastructure.qdrant_db.qdrant_manager import QdrantManager
from services.ai_rag_engine.app.infrastructure.mongo_db.mongo_manager import MongoManager
from services.ai_rag_engine.app.pipeline.embeddings.storage.dual_storage_router import DualStorageRouter
from services.ai_rag_engine.app.pipeline.embeddings.embedding_pipeline import EmbeddingPipeline

def run():
    logger.info("=" * 70)
    logger.info("Starting ingestion pipeline...")
    logger.info("=" * 70)

    # =====================================================
    # ====================== CONFIG ========================
    # =====================================================

    MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1 = "mongodb+srv://aboraidaahmed_db_user:2wX62vgs5CrsBUkv@zad-rag-cluster.nv8rp1b.mongodb.net/?appName=zad-rag-cluster"
    MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2 = "mongodb+srv://shafii_maliki_db:bpx6dQrX9aNosuCk@zad-rag-cluster2.tfdsgpc.mongodb.net/?appName=zad-rag-cluster2"
    QDRANT_URL = "https://9455bfe8-df54-49c1-8b09-f5c17b3ff5f3.sa-east-1-0.aws.cloud.qdrant.io:6333"
    QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwiZXhwIjoxNzk0ODA2MTI3LCJzdWJqZWN0IjoiYXBpLWtleTo4ZTUxOWNiZi1lMzIxLTRkODMtYmI5My00MzJhMTBlOTE1ZDIifQ.M03UW5DbK0AuSTy2jwgfudS-xZog-V48Sd_HXI6IZFU"
    CURRENT_MONGO = MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2

    # Modified to local path as requested
    BOOKS_PATH = project_root / "data" / "02_extracted" / "01_Fiqh" / "shafii"

    QDRANT_COLLECTION = "zad_sharia_collection_childs"
    MONGO_DB_NAME = "zad_rag_db_shafii_maliki"
    MONGO_COLLECTION = "parents_shafii"

    USE_EXISTING_MONGO_CLUSTER = False
    NEW_MONGO_URI = CURRENT_MONGO

    EMBED_BATCH_SIZE = 256

    # =====================================================
    # ================= INITIALIZATION =====================
    # =====================================================

    metadata_filter = MetadataFilter(target_domain="فقه")
    hierarchy_injector = HierarchyInjector()
    bge_m3_model = get_embedding_model(ModelType.BGE_M3)

    qdrant_manager = QdrantManager(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    qdrant_manager.initialize_collection(collection_name=QDRANT_COLLECTION, dense_dim=1024)

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
    logger.info("INGESTION COMPLETE")
    logger.info("=" * 70)

    mongo_manager.close()

if __name__ == "__main__":
    run()
