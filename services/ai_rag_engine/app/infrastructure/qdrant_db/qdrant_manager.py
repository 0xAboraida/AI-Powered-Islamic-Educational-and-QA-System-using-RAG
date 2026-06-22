import logging
from typing import List, Dict, Any, Optional
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

    # =========================================================================
    # ========================= SEARCH / RETRIEVAL ============================
    # =========================================================================

    def build_filter(
        self, filters: Optional[Dict[str, Any]]
    ) -> Optional[models.Filter]:
        """
        Converts a plain Python dict into a Qdrant Filter object.

        Example input:
            {"metadata.domain": "fiqh", "metadata.madhhab": "shafii"}
        """
        if not filters:
            return None

        must_conditions = [
            models.FieldCondition(
                key=key,
                match=models.MatchValue(value=value),
            )
            for key, value in filters.items()
        ]
        return models.Filter(must=must_conditions)

    def search_dense(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Any]:
        """
        Perform a dense (semantic) vector search using cosine similarity.

        Args:
            collection_name: Target Qdrant collection.
            query_vector:    The dense embedding of the query.
            limit:           Number of results to return.
            filters:         Optional metadata filters dict.

        Returns:
            List of Qdrant ScoredPoint objects.
        """
        logger.info(
            f"  - Dense search in '{collection_name}' — top_k={limit}, "
            f"filters={filters}"
        )
        qdrant_filter = self.build_filter(filters)
        results = self.client.query_points(
            collection_name=collection_name,
            query=query_vector,
            using="dense",
            query_filter=qdrant_filter,
            limit=limit,
            with_payload=True,
        ).points
        logger.info(f"  - Dense search returned {len(results)} results.")
        return results

    def search_sparse(
        self,
        collection_name: str,
        query_sparse_vector: Dict[str, float],
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Any]:
        """
        Perform a sparse (lexical/BM42) vector search.

        Args:
            collection_name:      Target Qdrant collection.
            query_sparse_vector:  Dict mapping token indices (as str) to weights.
            limit:                Number of results to return.
            filters:              Optional metadata filters dict.

        Returns:
            List of Qdrant ScoredPoint objects.
        """
        logger.info(
            f"  - Sparse search in '{collection_name}' — top_k={limit}, "
            f"filters={filters}"
        )
        qdrant_filter = self.build_filter(filters)

        # Convert {token: weight} dict → Qdrant SparseVector format
        indices = [int(k) for k in query_sparse_vector.keys()]
        values  = list(query_sparse_vector.values())

        results = self.client.query_points(
            collection_name=collection_name,
            query=models.SparseVector(
                indices=indices,
                values=values,
            ),
            using="sparse",
            query_filter=qdrant_filter,
            limit=limit,
            with_payload=True,
        ).points
        logger.info(f"  - Sparse search returned {len(results)} results.")
        return results
