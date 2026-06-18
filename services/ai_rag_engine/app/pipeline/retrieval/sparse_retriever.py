import logging
from typing import List, Dict, Any, Optional

from .base_retriever import BaseRetriever, RetrievedChunk
from services.ai_rag_engine.app.models.embedding_models.base import EmbeddingModel
from services.ai_rag_engine.app.infrastructure.qdrant_db.qdrant_manager import QdrantManager

logger = logging.getLogger(__name__)


class SparseRetriever(BaseRetriever):
    """
    Retrieves documents using sparse (lexical/BM42) vector similarity.

    Flow:
        1. Embed the raw query into a sparse vector using the EmbeddingModel.
           (BGE-M3 returns lexical_weights which represent sparse token scores.)
        2. Query Qdrant's "sparse" named vector index.
        3. Map the raw Qdrant ScoredPoints back to RetrievedChunk objects.

    Why Sparse?
        Sparse retrieval is excellent for exact-match Islamic terminology
        (e.g., specific Hadith words, proper nouns like سورة البقرة) that
        dense semantic search might miss.
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
                             {"metadata.madhhab": "hanbali"}

        Returns:
            List of RetrievedChunk sorted by score descending.
        """
        logger.info(f"[SparseRetriever] Query: '{query[:60]}...'")

        # Step 1: Embed the query → get sparse lexical weights
        if embedding_result:
            query_sparse_vector: Dict[str, float] = embedding_result.sparse
        else:
            embedding_result = self.embedding_model.embed_query(query)
            query_sparse_vector: Dict[str, float] = embedding_result.sparse

        if not query_sparse_vector:
            logger.warning(
                "[SparseRetriever] Embedding model returned empty sparse vector. "
                "Returning no results."
            )
            return []

        # Step 2: Search Qdrant sparse index
        raw_results = self.qdrant_manager.search_sparse(
            collection_name=collection_name,
            query_sparse_vector=query_sparse_vector,
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

        logger.info(f"[SparseRetriever] Returned {len(chunks)} chunks.")
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
        logger.info(f"[SparseRetriever] Async Query: '{query[:60]}...'")

        # Step 1: Embed the query async
        if embedding_result:
            query_sparse_vector: Dict[str, float] = embedding_result.sparse
        else:
            embed_start_t = time.time()
            embedding_result = await self.embedding_model.aembed_query(query)
            query_sparse_vector: Dict[str, float] = embedding_result.sparse
            logger.info(f"[⏱️ TIMER] SparseRetriever Embedding took: {time.time() - embed_start_t:.2f} seconds")

        if not query_sparse_vector:
            logger.warning(
                "[SparseRetriever] Embedding model returned empty sparse vector. "
                "Returning no results."
            )
            return []

        # Step 2: Search Qdrant sparse index async wrapper
        qdrant_start_t = time.time()
        raw_results = await asyncio.to_thread(
            self.qdrant_manager.search_sparse,
            collection_name=collection_name,
            query_sparse_vector=query_sparse_vector,
            limit=top_k,
            filters=filters,
        )
        logger.info(f"[⏱️ TIMER] SparseRetriever Qdrant Search took: {time.time() - qdrant_start_t:.2f} seconds")

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

        logger.info(f"[SparseRetriever] Async returned {len(chunks)} chunks.")
        return chunks
