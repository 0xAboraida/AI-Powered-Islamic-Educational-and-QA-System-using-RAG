import logging
from typing import List, Dict, Any, Optional

from .base_retriever import BaseRetriever, RetrievedChunk
from services.ai_rag_engine.app.models.embedding_models.base import EmbeddingModel
from services.ai_rag_engine.app.infrastructure.qdrant_db.qdrant_manager import QdrantManager

logger = logging.getLogger(__name__)


class DenseRetriever(BaseRetriever):
    """
    Retrieves documents using dense (semantic) vector similarity.

    Flow:
        1. Embed the raw query into a dense vector using the EmbeddingModel.
        2. Query Qdrant's "dense" named vector index via cosine similarity.
        3. Map the raw Qdrant ScoredPoints back to RetrievedChunk objects.
    """

    def __init__(
        self,
        embedding_model: EmbeddingModel,
        qdrant_manager: QdrantManager,
    ):
        self.embedding_model = embedding_model
        self.qdrant_manager = qdrant_manager

    def retrieve(
        self,
        query: str,
        collection_name: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        embedding_result: Optional[any] = None,
    ) -> List[RetrievedChunk]:
        """
        Args:
            query:           Raw Arabic query string.
            collection_name: Qdrant collection to search in.
            top_k:           Maximum number of results to return.
            filters:         Optional metadata filter dict, e.g.:
                             {"metadata.domain": "fiqh"}

        Returns:
            List of RetrievedChunk sorted by score descending.
        """
        logger.info(f"  - 🤖 [DENSE] Query: '{query[:60]}...'")

        # Step 1: Embed the query
        if embedding_result:
            query_vector = embedding_result.dense
        else:
            embedding_result = self.embedding_model.embed_query(query)
            query_vector = embedding_result.dense

        # Step 2: Search Qdrant
        raw_results = self.qdrant_manager.search_dense(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=top_k,
            filters=filters,
        )

        # Step 3: Map results → RetrievedChunk
        chunks = []
        for hit in raw_results:
            payload = hit.payload or {}
            chunks.append(
                RetrievedChunk(
                    chunk_id=payload.get("chunk_id", str(hit.id)),
                    score=hit.score,
                    content=payload.get("content", ""),
                    metadata=payload.get("metadata", {}),
                    parent_id=payload.get("parent_id"),
                )
            )

        logger.info(f"  - 🤖 [DENSE] Returned {len(chunks)} chunks.")
        return chunks

    async def aretrieve(
        self,
        query: str,
        collection_name: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        embedding_result: Optional[any] = None,
    ) -> List[RetrievedChunk]:
        import time
        import asyncio
        logger.info(f"  - 🤖 [DENSE] Async Query: '{query[:60]}...'")

        # Step 1: Embed the query async
        if embedding_result:
            query_vector = embedding_result.dense
        else:
            embed_start_t = time.time()
            embedding_result = await self.embedding_model.aembed_query(query)
            query_vector = embedding_result.dense
            logger.info(f"  - ⏱️ [TIMER] DenseRetriever Embedding took: {time.time() - embed_start_t:.2f} seconds")

        # Step 2: Search Qdrant (wrap sync qdrant call in to_thread)
        qdrant_start_t = time.time()
        raw_results = await asyncio.to_thread(
            self.qdrant_manager.search_dense,
            collection_name=collection_name,
            query_vector=query_vector,
            limit=top_k,
            filters=filters,
        )
        logger.info(f"  - ⏱️ [TIMER] DenseRetriever Qdrant Search took: {time.time() - qdrant_start_t:.2f} seconds")

        # Step 3: Map results
        chunks = []
        for hit in raw_results:
            payload = hit.payload or {}
            chunks.append(
                RetrievedChunk(
                    chunk_id=payload.get("chunk_id", str(hit.id)),
                    score=hit.score,
                    content=payload.get("content", ""),
                    metadata=payload.get("metadata", {}),
                    parent_id=payload.get("parent_id"),
                )
            )

        logger.info(f"  - 🤖 [DENSE] Async returned {len(chunks)} chunks.")
        return chunks
