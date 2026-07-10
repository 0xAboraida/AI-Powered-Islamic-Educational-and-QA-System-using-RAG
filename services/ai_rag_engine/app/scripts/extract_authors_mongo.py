import os
import sys
import asyncio
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))
from services.ai_rag_engine.app.config.settings import settings
from services.ai_rag_engine.app.infrastructure.mongo_db.mongo_router import _ROUTES, _DOMAIN_MAP
from services.ai_rag_engine.app.infrastructure.mongo_db.mongo_manager import MongoManager

# Reverse mapping to get Arabic names
REVERSE_DOMAIN_MAP = {
    "fiqh": "فقه",
    "aqeedah": "العقيدة",
    "tafseer": "التفسير",
    "seerah": "السيرة",
    "tarikh": "التاريخ",
    "hadith": "الحديث",
    "nahw_sarf": "علوم اللغة",
    "quran_science": "علوم القرآن"
}

def get_env_val(key):
    return getattr(settings, key, "")

def main():
    domain_authors = {}
    
    for (norm_domain, norm_madhhab), routes in _ROUTES.items():
        arabic_domain = REVERSE_DOMAIN_MAP.get(norm_domain, norm_domain)
        if arabic_domain not in domain_authors:
            domain_authors[arabic_domain] = set()
            
        for route in routes:
            uri = get_env_val(route.uri_env_key)
            if not uri:
                print(f"Skipping {route.uri_env_key}, URI not found.")
                continue
                
            print(f"Connecting to {route.db_name}.{route.collection_name}...")
            try:
                manager = MongoManager(uri, route.db_name)
                collection = manager.db[route.collection_name]
                authors = collection.distinct("metadata.author")
                
                # Add to set
                for a in authors:
                    if a and a.strip():
                        domain_authors[arabic_domain].add(a.strip())
                        
                manager.close()
                print(f"  -> Found {len(authors)} authors.")
            except Exception as e:
                print(f"Error querying {route.db_name}.{route.collection_name}: {e}")

    # Convert sets to lists
    final_dict = {k: list(v) for k, v in domain_authors.items()}
    
    with open("authors_from_mongo.json", "w", encoding="utf-8") as f:
        json.dump(final_dict, f, ensure_ascii=False, indent=4)
        
    print("Done. Wrote authors_from_mongo.json")

if __name__ == "__main__":
    main()
