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

    # We only fetch documents that have 'book_id' and 'page_id'
    cursor = collection.find(
        {"metadata.book_id": {"$exists": True}, "metadata.page_id": {"$exists": True}},
        {"metadata.book_id": 1, "metadata.page_id": 1, "metadata.source_url": 1}
    )

    updates = []
    processed = 0
    updated = 0
    batch_size = 1000

    for doc in cursor:
        processed += 1
        meta = doc.get("metadata", {})
        book_id = meta.get("book_id")
        page_id = meta.get("page_id")
        part = meta.get("part", "1")
        old_url = meta.get("source_url", "")

        # The correct URL format as requested:
        # /read?part={part}&page={page_id} 
        # (where page_id is the internal index, NOT the printed page number)
        new_url = f"https://ketabonline.com/ar/books/{book_id}/read?part={part}&page={page_id}"

        # Only update if it's different
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
    # Matched exactly with mongo_router.py
    targets = [
        (settings.MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1, "zad_rag_db", "parents_hanafi"),
        (settings.MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1, "zad_rag_db", "parents_hanbali"),
        (settings.MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2, "zad_rag_db_shafii_maliki", "parents_maliki"),
        (settings.MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2, "zad_rag_db_shafii_maliki", "parents_shafii"),
        (settings.MONGO_URI_AQEEDAH_CLUSTER3, "zad_rag_db_aqeedah", "parents_aqeedah"),
        (settings.MONGO_URI_AQEEDAH_CLUSTER3, "zad_rag_db_tafseer", "parents_tafseer"),
        (settings.MONGO_URI_TAFSEER_CLUSTER4, "zad_rag_db_tafseer", "parents_tafseer"),
        (settings.MONGO_URI_SEERAH_CLUSTER5, "zad_rag_db_seerah", "parents_seerah"),
        (settings.MONGO_URI_TARIKH_CLUSTER6, "zad_rag_db_tarikh", "parents_tarikh"),
        (settings.MONGO_URI_TARIKH_CLUSTER7, "zad_rag_db_tarikh2", "parents_tarikh2"),
        (settings.MONGO_URI_TARIKH_CLUSTER8, "zad_rag_db_nahwSarf", "parents_nahwSarf"),
        (settings.MONGO_URI_HADITH_CLUSTER9, "zad_rag_db_hadith", "parents_hadith"),
        (settings.MONGO_URI_HADITH_CLUSTER11, "zad_rag_db_hadith2", "parents_hadith2"),
        (settings.MONGO_URI_HADITH_CLUSTER12, "zad_rag_db_hadith3", "parents_hadith3"),
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
