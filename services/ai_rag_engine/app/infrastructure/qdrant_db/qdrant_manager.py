import logging
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models

logger = logging.getLogger(__name__)

class QdrantManager:
    def __init__(self, url: str, api_key: str):
        self.client = QdrantClient(
            url=url,
            api_key=api_key,
            timeout=300
        )
        logger.info("Connected to Qdrant Cloud.")

    def initialize_collection(self, collection_name: str, dense_dim: int = 1024):
        if self.client.collection_exists(collection_name):
            logger.info(f"Collection '{collection_name}' already exists.")
            # IMPORTANT: Ensure indices exist even if collection already exists
            self._setup_payload_indices(collection_name)
            return

        logger.info(f"Creating collection '{collection_name}'...")
        self.client.create_collection(
            collection_name=collection_name,
            vectors_config={
                "dense": models.VectorParams(
                    size=dense_dim,
                    distance=models.Distance.COSINE
                )
            },
            sparse_vectors_config={
                "sparse": models.SparseVectorParams(
                    index=models.SparseIndexParams(
                        on_disk=False
                    )
                )
            }
        )

        # Create payload indices
        self._setup_payload_indices(collection_name)
        logger.info(f"Collection '{collection_name}' created successfully.")

    def upsert_points(self, collection_name: str, points: List[models.PointStruct]):
        logger.info(f"Uploading {len(points)} points to Qdrant...")
        self.client.upsert(
            collection_name=collection_name,
            points=points
        )
        logger.info(f"Successfully uploaded {len(points)} points.")

    def _setup_payload_indices(self, collection_name: str) -> None:
        """Sets up payload indexing for fast metadata filtering."""
        logger.info(f"Setting up payload indices for '{collection_name}'...")

        indices_to_create = [
            # Core retrieval filters
            ("metadata.domain", models.PayloadSchemaType.KEYWORD),
            ("metadata.madhhab", models.PayloadSchemaType.KEYWORD),
            ("metadata.book_title", models.PayloadSchemaType.KEYWORD),
            ("metadata.author", models.PayloadSchemaType.KEYWORD),

            # IDs
            ("parent_id", models.PayloadSchemaType.KEYWORD),
            ("chunk_id", models.PayloadSchemaType.KEYWORD),

            # Optional hierarchy filtering
            ("metadata.hierarchy.kitab", models.PayloadSchemaType.KEYWORD),
            ("metadata.hierarchy.sections", models.PayloadSchemaType.KEYWORD),
        ]

        for field_name, schema_type in indices_to_create:
            try:
                self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field_name,
                    field_schema=schema_type,
                )
                logger.info(f"Payload index created for '{field_name}'.")
            except Exception as e:
                logger.warning(f"Could not create payload index for '{field_name}': {e}")
