import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
import json

# Setup environment
current_dir = Path(__file__).resolve().parent
project_root = None
for parent in [current_dir] + list(current_dir.parents):
    if parent.name == "Zad-AI":
        project_root = parent
        break
sys.path.insert(0, str(project_root))
load_dotenv(dotenv_path=project_root / "services" / "ai_rag_engine" / ".env")

# Connect to Hadith DB as an example
uri = os.getenv("MONGO_URI_HADITH_CLUSTER9")
if not uri:
    print("Could not find MONGO_URI_HADITH_CLUSTER9 in .env")
    sys.exit(1)

client = MongoClient(uri)
db = client["zad_rag_db_hadith"]
collection = db["parents_hadith"]

# Fetch one random document
sample_doc = collection.find_one()

if sample_doc:
    # Print only the metadata to avoid flooding the console with huge content
    metadata = sample_doc.get("metadata", {})
    print("=== SAMPLE METADATA FROM MONGO ===")
    print(json.dumps(metadata, ensure_ascii=False, indent=2))
else:
    print("No documents found in the collection.")

client.close()
