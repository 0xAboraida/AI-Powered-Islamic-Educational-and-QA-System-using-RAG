import uuid
import logging
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor
from qdrant_client.http import models

from ..core.base import BaseStorage
from ....infrastructure.qdrant_db.qdrant_manager import QdrantManager
from ....infrastructure.mongo_db.mongo_manager import MongoManager

logger = logging.getLogger(__name__)

class DualStorageRouter(BaseStorage):
    def __init__(
        self,
        qdrant_manager: QdrantManager,
        mongo_manager: MongoManager,
        qdrant_collection: str,
        mongo_collection: str
    ):
        self.qdrant_manager = qdrant_manager
        self.mongo_manager = mongo_manager
        self.qdrant_collection = qdrant_collection
        self.mongo_collection = mongo_collection

    def store(self, chunks: List[Dict[str, Any]]) -> None:
        child_chunks = []
        parent_chunks = []

        for chunk in chunks:
            if chunk.get("chunk_type") == "child":
                child_chunks.append(chunk)
            elif chunk.get("chunk_type") == "parent":
                parent_chunks.append(chunk)

        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = []
        
            if child_chunks:
                futures.append(
                    executor.submit(
                        self._store_in_qdrant,
                        child_chunks
                    )
                )
        
            if parent_chunks:
                futures.append(
                    executor.submit(
                        self._store_in_mongo,
                        parent_chunks
                    )
                )
        
            # IMPORTANT: Wait for all threads and raise exceptions
            for future in futures:
                future.result()

    def _store_in_qdrant(self, chunks: List[Dict[str, Any]]):
        points = []

        for chunk in chunks:
            payload = {
                k: v
                for k, v in chunk.items()
                if k != "embeddings"
            }

            embeddings = chunk.get("embeddings", {})
            dense_vector = embeddings.get("dense")
            sparse_vector = embeddings.get("sparse")

            point = models.PointStruct(
                id=str(
                    uuid.uuid5(
                        uuid.NAMESPACE_DNS,
                        chunk["chunk_id"]
                    )
                ),
                payload=payload,
                vector={
                    "dense": dense_vector,
                    "sparse": (
                        models.SparseVector(
                            indices=[
                                int(k)
                                for k in sparse_vector.keys()
                            ],
                            values=list(
                                sparse_vector.values()
                            )
                        )
                        if sparse_vector else None
                    )
                }
            )
            points.append(point)

        try:
            self.qdrant_manager.upsert_points(
                collection_name=self.qdrant_collection,
                points=points
            )
        except Exception as e:
            logger.error(f"Qdrant upload failed: {e}")

    def _store_in_mongo(self, chunks: List[Dict[str, Any]]):
        self.mongo_manager.insert_documents(
            self.mongo_collection,
            chunks
        )
