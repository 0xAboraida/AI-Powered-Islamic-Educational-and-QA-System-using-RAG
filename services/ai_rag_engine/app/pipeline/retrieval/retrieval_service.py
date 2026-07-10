"""
retrieval_service.py
--------------------
The Entry Point for the Document Retrieval Pipeline.

Flow:
    1. Initialization & Warmup: Eagerly creates embedding models and database clients.
    2. Multi-Query Execution: Receives multiple extracted questions from the preprocessor.
    3. Delegation: Spawns parallel tasks for each question and sends them to the `ParentChildRetriever`.
    4. Aggregation: Collects all retrieved parent documents across all questions, deduplicates them (keeping the highest score), and returns the final sorted context.

Why a Retrieval Service?
    Managing multiple Qdrant clusters, multiple MongoDB databases, Dense vs Sparse vectors, 
    and Reranking models can get extremely complex. This service acts as a clean facade. 
    The Orchestrator just calls `retrieve_multi()` and this service handles the parallel execution 
    and aggregation automatically.
"""

import os
import logging
from typing import List, Dict, Any, Optional

from services.ai_rag_engine.app.config.settings import settings
from services.ai_rag_engine.app.models.embedding_models.factory import get_embedding_model, ModelType
from services.ai_rag_engine.app.infrastructure.qdrant_db.qdrant_router import qdrant_router
from services.ai_rag_engine.app.pipeline.retrieval.dense_retriever import DenseRetriever
from services.ai_rag_engine.app.pipeline.retrieval.sparse_retriever import SparseRetriever
from services.ai_rag_engine.app.pipeline.retrieval.hybrid_search import HybridRetriever
from services.ai_rag_engine.app.pipeline.retrieval.parent_child import ParentChildRetriever, RetrievedParent

logger = logging.getLogger(__name__)

class RetrievalService:
    def __init__(self):
        logger.info("[RetrievalService] [+] Initializing RetrievalService")
        self.embedding_model = get_embedding_model(ModelType.BGE_M3)
        # We will keep a small cache of ParentChildRetrievers per domain to avoid recreating them
        # However, ParentChildRetriever holds a Mongo pool, so it's good to reuse it.
        # But HybridRetriever takes a specific QdrantManager which depends on domain.
        self._retrievers: Dict[str, ParentChildRetriever] = {}

    def _get_or_create_retriever(self, domain: str) -> ParentChildRetriever:
        if domain in self._retrievers:
            return self._retrievers[domain]
        
        qdrant_client, _ = qdrant_router.get_client_and_collection(domain)
        
        hybrid_retriever = HybridRetriever(
            self.embedding_model,
            qdrant_client,
            rrf_k=settings.RAG_RRF_K,
            dense_top_k_multiplier=settings.RAG_DENSE_MULTIPLIER
        )
        
        parent_retriever = ParentChildRetriever(
            hybrid_retriever=hybrid_retriever,
            env_vars=dict(os.environ),
            child_top_k=settings.RAG_CHILD_TOP_K
        )
        self._retrievers[domain] = parent_retriever
        return parent_retriever

    async def warm_up_all(self):
        """Eagerly load and connect all Qdrant and MongoDB clients asynchronously."""
        import asyncio
        logger.info("[RetrievalService] [+] Starting eager warmup for all databases")
        
        # Limit concurrent warmups to avoid DNS/Network timeouts when connecting to 8 clusters at once
        sem = asyncio.Semaphore(2)

        async def warm_domain(domain):
            async with sem:
                try:
                    retriever = self._get_or_create_retriever(domain)
                    # Run the blocking mongo warm up in a separate thread
                    await asyncio.to_thread(retriever.warm_up_mongo, domain)
                except Exception as e:
                    logger.warning(f"[RetrievalService] [-] Warmup failed for domain='{domain}': {e}")

        # Run warmups concurrently for all supported domains
        tasks = [warm_domain(domain) for domain in settings.SUPPORTED_DOMAINS]
        await asyncio.gather(*tasks)
        logger.info("[RetrievalService] [+] All databases warmed up successfully")



    async def retrieve_multi(self, queries: List[str], domain: str, madhhab: Optional[str] = None, custom_filters: Optional[Dict[str, Any]] = None) -> List[RetrievedParent]:
        import time
        import asyncio
        logger.info(f"[RetrievalService] [+] Parallel retrieval started: queries={len(queries)} domain='{domain}'")
        start_t = time.time()
        
        if not queries:
            return []

        if len(queries) == 1:
            parent_top_k = getattr(settings, "RAG_SINGLE_QUERY_PARENT_TOP_K", 5)
            child_top_k = settings.RAG_CHILD_TOP_K
        else:
            parent_top_k = getattr(settings, "RAG_MULTI_QUERY_PARENT_TOP_K", 3)
            child_top_k = settings.RAG_CHILD_TOP_K

        filters = {}
        if madhhab:
            filters["metadata.madhhab"] = madhhab
        if custom_filters:
            filters.update(custom_filters)

        parent_retriever = self._get_or_create_retriever(domain)
        _, collection_name = qdrant_router.get_client_and_collection(domain)

        tasks = [
            parent_retriever.aretrieve(
                query=q,
                collection_name=collection_name,
                child_top_k=child_top_k,
                parent_top_k=parent_top_k,
                filters=filters
            )
            for q in queries
        ]

        results_lists = await asyncio.gather(*tasks)

        all_parents: Dict[str, RetrievedParent] = {}
        for res_list in results_lists:
            for parent in res_list:
                if parent.parent_id in all_parents:
                    if parent.best_child_score > all_parents[parent.parent_id].best_child_score:
                        all_parents[parent.parent_id] = parent
                else:
                    all_parents[parent.parent_id] = parent

        final_results = list(all_parents.values())
        final_results.sort(key=lambda p: p.best_child_score, reverse=True)
        return final_results

try:
    retrieval_service = RetrievalService()
except Exception as _e:
    logger.critical(
        f"[RetrievalService] Failed to initialize at startup: {_e}. "
        "Check QDRANT URLs, API keys, and embedding model availability.",
        exc_info=True
    )
    raise

