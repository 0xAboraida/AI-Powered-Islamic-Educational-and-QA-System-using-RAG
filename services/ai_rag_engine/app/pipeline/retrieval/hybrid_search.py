"""
hybrid_search.py
----------------
Combines Dense and Sparse Retrieval into a single unified search.

Flow:
    1. Parallel Execution: Runs the `DenseRetriever` (for semantic meaning) and `SparseRetriever` (for exact keyword matching) at the same time.
    2. Shared Embedding: Embeds the query once and passes it to both retrievers to save compute and avoid tokenizer deadlocks.
    3. Fusion: Merges both result lists using the Reciprocal Rank Fusion (RRF) algorithm to balance meaning vs. exact matching.

Why Hybrid Search?
    This approach is absolutely critical for Arabic Islamic text. 
    - Dense search understands paraphrased questions (e.g., "what to do when I miss a prayer").
    - Sparse search guarantees exact Quranic/Hadith terminology is strictly matched (e.g., "سورة البقرة").
    RRF gives us the best of both worlds.
"""

import logging
from typing import List, Dict, Any, Optional

from .base_retriever import BaseRetriever, RetrievedChunk
from .dense_retriever import DenseRetriever
from .sparse_retriever import SparseRetriever
from .fusion import reciprocal_rank_fusion
from services.ai_rag_engine.app.models.embedding_models.base import EmbeddingModel
from services.ai_rag_engine.app.infrastructure.qdrant_db.qdrant_manager import QdrantManager

logger = logging.getLogger(__name__)


class HybridRetriever(BaseRetriever):
    """
    Combines Dense and Sparse retrieval, then re-ranks via RRF.

    Strategy:
        1. Run DenseRetriever  → semantic relevance (captures meaning).
        2. Run SparseRetriever → lexical relevance (captures exact terms).
        3. Merge both result lists using Reciprocal Rank Fusion (RRF).
        4. Return the top-k fused results.

    This approach is ideal for Arabic Islamic text because:
        - Dense search understands paraphrased questions.
        - Sparse search guarantees exact Quranic/Hadith terminology is matched.
    """

    def __init__(
        self,
        embedding_model: EmbeddingModel,
        qdrant_manager: QdrantManager,
        rrf_k: int = 60,
        dense_top_k_multiplier: int = 1,
    ):
        """
        Args:
            embedding_model:         Shared embedding model (BGE-M3).
            qdrant_manager:          Shared Qdrant client wrapper.
            rrf_k:                   RRF smoothing constant (default: 60).
            dense_top_k_multiplier:  Fetch multiplier before fusion.
                                     E.g., if top_k=10, each retriever
                                     fetches 10 * 3 = 30 candidates before
                                     fusion gives us the best 10.
        """
        self.dense_retriever = DenseRetriever(embedding_model, qdrant_manager)
        self.sparse_retriever = SparseRetriever(embedding_model, qdrant_manager)
        self.rrf_k = rrf_k
        self.dense_top_k_multiplier = dense_top_k_multiplier

    def retrieve(
        self,
        query: str,
        collection_name: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedChunk]:
        """
        Args:
            query:           Raw Arabic query string.
            collection_name: Qdrant collection to search in.
            top_k:           Final number of results after fusion.
            filters:         Optional metadata filter dict, e.g.:
                             {"metadata.domain": "aqeedah"}

        Returns:
            List of RetrievedChunk sorted by fused RRF score descending.
        """
        import time
        logger.info(
            f"[HybridRetriever] Starting hybrid search — "
            f"collection='{collection_name}', top_k={top_k}, filters={filters}"
        )

        # Fetch more candidates per retriever to maximize fusion quality
        candidate_k = top_k * self.dense_top_k_multiplier

        # ============================================
        # Step 1: Run Dense retrieval
        # ============================================
        dense_t = time.time()
        dense_results = self.dense_retriever.retrieve(
            query=query,
            collection_name=collection_name,
            top_k=candidate_k,
            filters=filters,
        )
        logger.info(f"[⏱️ TIMER] Hybrid Dense Retrieval took: {time.time() - dense_t:.2f} seconds")

        # ============================================
        # Step 2: Run Sparse retrieval
        # ============================================
        sparse_t = time.time()
        sparse_results = self.sparse_retriever.retrieve(
            query=query,
            collection_name=collection_name,
            top_k=candidate_k,
            filters=filters,
        )
        logger.info(f"[⏱️ TIMER] Hybrid Sparse Retrieval took: {time.time() - sparse_t:.2f} seconds")

        # ============================================
        # Step 3: Fuse with RRF
        # ============================================
        fuse_t = time.time()
        fused_results = reciprocal_rank_fusion(
            result_lists=[dense_results, sparse_results],
            k=self.rrf_k,
            top_k=top_k,
        )
        logger.info(f"[⏱️ TIMER] Hybrid RRF Fusion took: {time.time() - fuse_t:.2f} seconds")

        logger.info(
            f"[HybridRetriever] Fusion complete — "
            f"dense={len(dense_results)}, sparse={len(sparse_results)}, "
            f"final={len(fused_results)}"
        )
        return fused_results

    async def aretrieve(
        self,
        query: str,
        collection_name: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedChunk]:
        import time
        import asyncio
        logger.info(
            f"[HybridRetriever] Starting async hybrid search — "
            f"collection='{collection_name}', top_k={top_k}, filters={filters}"
        )

        candidate_k = top_k * self.dense_top_k_multiplier

        # Run Dense and Sparse retrieval in parallel for maximum speed
        # But first, embed the query ONCE to prevent Tokenizer thread-deadlock on CPU and save 2x compute
        embed_t = time.time()
        shared_embedding = await self.dense_retriever.embedding_model.aembed_query(query)
        logger.info(f"[⏱️ TIMER] Hybrid Shared Embedding took: {time.time() - embed_t:.2f} seconds")

        start_t = time.time()
        dense_task = self.dense_retriever.aretrieve(
            query=query, collection_name=collection_name, top_k=candidate_k, filters=filters, embedding_result=shared_embedding
        )
        sparse_task = self.sparse_retriever.aretrieve(
            query=query, collection_name=collection_name, top_k=candidate_k, filters=filters, embedding_result=shared_embedding
        )
        
        dense_results, sparse_results = await asyncio.gather(dense_task, sparse_task)
        
        logger.info(f"[⏱️ TIMER] Hybrid Async Dense+Sparse Parallel execution took: {time.time() - start_t:.2f} seconds")

        # Fuse with RRF
        fuse_t = time.time()
        # Since fusion is fast CPU-bound work, we can just call it synchronously
        fused_results = reciprocal_rank_fusion(
            result_lists=[dense_results, sparse_results],
            k=self.rrf_k,
            top_k=top_k,
        )
        logger.info(f"[⏱️ TIMER] Hybrid Async RRF Fusion took: {time.time() - fuse_t:.2f} seconds")

        logger.info(
            f"[HybridRetriever] Async Fusion complete — "
            f"dense={len(dense_results)}, sparse={len(sparse_results)}, "
            f"final={len(fused_results)}"
        )
        return fused_results
