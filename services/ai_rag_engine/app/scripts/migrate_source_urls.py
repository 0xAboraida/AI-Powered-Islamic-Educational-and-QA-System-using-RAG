import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# Add project root to path
current_dir = Path(__file__).resolve().parent
project_root = None
for parent in [current_dir] + list(current_dir.parents):
    if parent.name == "Zad-AI":
        project_root = parent
        break
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Load .env
env_path = project_root / "services" / "ai_rag_engine" / ".env"
load_dotenv(dotenv_path=env_path, override=True)

from services.ai_rag_engine.app.config.settings import settings


def migrate_collection(mongo_uri: str, db_name: str, collection_name: str):
    if not mongo_uri:
        logger.warning(f"Skipping DB {db_name} — No URI provided.")
        return

    logger.info(f"Connecting to MongoDB: {db_name} -> {collection_name}")
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        collection = db[collection_name]
        
        # Test connection
        client.admin.command('ping')
    except Exception as e:
        logger.error(f"Failed to connect: {e}")
        return

    total_docs = collection.count_documents({})
    logger.info(f"Found {total_docs} documents. Scanning for incorrect URLs...")

    # We only fetch documents that have 'id' (book_id) and 'page_id'
    cursor = collection.find(
        {"metadata.id": {"$exists": True}, "metadata.page_id": {"$exists": True}},
        {"metadata.id": 1, "metadata.page_id": 1, "metadata.source_url": 1}
    )

    updates = []
    processed = 0
    updated = 0
    batch_size = 1000

    for doc in cursor:
        processed += 1
        meta = doc.get("metadata", {})
        book_id = meta.get("id")
        page_id = meta.get("page_id")
        old_url = meta.get("source_url", "")

        # The correct URL format
        new_url = f"https://ketabonline.com/ar/books/{book_id}/pages/{page_id}"

        # Only update if it's different (i.e. contains ?part=...&page=...)
        if old_url != new_url:
            updates.append(
                UpdateOne(
                    {"_id": doc["_id"]},
                    {"$set": {"metadata.source_url": new_url}}
                )
            )
            updated += 1

        # Execute in batches
        if len(updates) >= batch_size:
            collection.bulk_write(updates)
            logger.info(f"Updated {updated} documents so far...")
            updates.append([]) # clear
            updates = []

    # Process remaining
    if updates:
        collection.bulk_write(updates)

    logger.info(f"✅ Migration complete for {db_name}. Processed: {processed}, Updated: {updated}\n")
    client.close()


def run_migration():
    logger.info("=" * 60)
    logger.info("🚀 STARTING SOURCE URL MIGRATION ACROSS MONGODB CLUSTERS")
    logger.info("=" * 60)

    # Define all your DBs, Collections, and the corresponding URI from settings
    targets = [
        (settings.MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1, "zad_rag_db_fiqh_hanbali_hanafi", "parents_fiqh"),
        (settings.MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2, "zad_rag_db_fiqh_shafii_maliki", "parents_fiqh"),
        (settings.MONGO_URI_AQEEDAH_CLUSTER3, "zad_rag_db_aqeedah", "parents_aqeedah"),
        (settings.MONGO_URI_AQEEDAH_CLUSTER3, "zad_rag_db_tafseer_1", "parents_tafseer_1"),
        (settings.MONGO_URI_TAFSEER_CLUSTER4, "zad_rag_db_tafseer_2", "parents_tafseer_2"),
        (settings.MONGO_URI_SEERAH_CLUSTER5, "zad_rag_db_seerah", "parents_seerah"),
        (settings.MONGO_URI_TARIKH_CLUSTER6, "zad_rag_db_tarikh_1", "parents_tarikh_1"),
        (settings.MONGO_URI_TARIKH_CLUSTER7, "zad_rag_db_tarikh_2", "parents_tarikh_2"),
        (settings.MONGO_URI_TARIKH_CLUSTER8, "zad_rag_db_nahw_sarf", "parents_nahw_sarf"),
        (settings.MONGO_URI_HADITH_CLUSTER9, "zad_rag_db_hadith", "parents_hadith"),
    ]

    for uri, db_name, collection_name in targets:
        if uri:
            migrate_collection(uri, db_name, collection_name)
        else:
            logger.warning(f"⚠️ Skipping {db_name} — URI not found in settings/env.")

    logger.info("=" * 60)
    logger.info("🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY")
    logger.info("=" * 60)


if __name__ == "__main__":
    run_migration()
