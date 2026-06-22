import logging
import certifi
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

logger = logging.getLogger(__name__)

class MongoManager:
    def __init__(self, uri: str, db_name: str):
        self.uri = uri
        self.db_name = db_name
        self.client = None
        self.db = None
        self.connect()

    def connect(self):
        try:
            self.client = MongoClient(
                self.uri,
                tls=True,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=20000,
                connectTimeoutMS=20000,
                socketTimeoutMS=30000,
                tlsDisableOCSPEndpointCheck=True,
                readPreference="secondaryPreferred"
            )
            self.client.admin.command("ping")
            self.db = self.client[self.db_name]
            logger.info(f"✅ Connected to MongoDB DB: {self.db_name}")

        except ConnectionFailure as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise

    def insert_documents(self, collection_name: str, documents: List[Dict[str, Any]]):
        if not documents:
            return

        # pyrefly: ignore [unsupported-operation]
        collection = self.db[collection_name]

        for doc in documents:
            if 'chunk_id' in doc and '_id' not in doc:
                doc['_id'] = doc['chunk_id']

        try:
            collection.insert_many(documents, ordered=False)
            logger.info(f"🟣 Inserted {len(documents)} parent chunks 🟢 into MongoDB.")
        except Exception as e:
            logger.warning(f"❌ MongoDB insert warning/error: {e}")

    def fetch_by_ids(
        self,
        collection_name: str,
        ids: List[str],
    ) -> List[Dict[str, Any]]:
        """
        Fetch parent documents from MongoDB by their _id field.

        Args:
            collection_name: The collection to query.
            ids:             List of parent_id strings to look up.
                             These correspond to the `_id` field set during
                             ingestion (doc['_id'] = doc['chunk_id']).

        Returns:
            List of matching documents as plain dicts.
        """
        if not ids:
            return []

        # pyrefly: ignore [unsupported-operation]
        collection = self.db[collection_name]
        try:
            cursor = collection.find({"_id": {"$in": ids}})
            results = list(cursor)
            logger.info(
                f"📦 Fetched {len(results)}/{len(ids)} parents "
                f"from '{self.db_name}.{collection_name}'"
            )
            return results
        except Exception as e:
            logger.error(f"❌ MongoDB fetch error in '{collection_name}': {e}")
            return []

    def close(self):
        if self.client:
            self.client.close()
            logger.info("🟢 MongoDB connection closed.")
