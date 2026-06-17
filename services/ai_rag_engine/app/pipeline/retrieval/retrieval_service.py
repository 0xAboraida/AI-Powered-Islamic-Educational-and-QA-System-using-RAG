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
        logger.info("Initializing RetrievalService...")
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

    def warm_up_all(self):
        """Eagerly load and connect all Qdrant and MongoDB clients."""
        logger.info("🔥 Starting Eager Warm Up for all databases...")
        # A list of primary domains to warm up
        domains_to_warm = ['فقه', 'العقيدة', 'التفسير', 'السيرة', 'التاريخ', 'الحديث', 'النحو والصرف']
        for domain in domains_to_warm:
            try:
                retriever = self._get_or_create_retriever(domain)
                # Warm up Mongo connections specifically for this domain's routes
                retriever.warm_up_mongo(domain)
            except Exception as e:
                logger.warning(f"⚠️ Warm up failed for domain '{domain}': {e}")
        logger.info("✅ All databases warmed up successfully!")

    def retrieve(self, query: str, domain: str, top_k: int = 10, madhhab: Optional[str] = None) -> List[RetrievedParent]:
        import time
        logger.info(f"⏳ Starting retrieval for domain={domain}")
        start_t = time.time()
        parent_retriever = self._get_or_create_retriever(domain)
        init_t = time.time()
        logger.info(f"[⏱️ TIMER] RetrievalService _get_or_create_retriever took: {init_t - start_t:.2f} seconds")

        _, collection_name = qdrant_router.get_client_and_collection(domain)

        filters = {"metadata.domain": domain}
        if madhhab:
            filters["metadata.madhhab"] = madhhab

        parents = parent_retriever.retrieve(
            query=query,
            collection_name=collection_name,
            child_top_k=settings.RAG_CHILD_TOP_K,
            parent_top_k=top_k,
            filters=filters
        )
        logger.info(f"[⏱️ TIMER] RetrievalService ParentChildRetriever sync execution took: {time.time() - init_t:.2f} seconds")
        return parents

    async def retrieve_multi(self, queries: List[str], domain: str, madhhab: Optional[str] = None, custom_filters: Optional[Dict[str, Any]] = None) -> List[RetrievedParent]:
        import time
        import asyncio
        logger.info(f"⏳ Starting parallel retrieval for {len(queries)} queries, domain={domain}")
        start_t = time.time()
        
        if not queries:
            return []

        if len(queries) == 1:
            parent_top_k = getattr(settings, "RAG_SINGLE_QUERY_PARENT_TOP_K", 5)
            child_top_k = settings.RAG_CHILD_TOP_K
        else:
            parent_top_k = getattr(settings, "RAG_MULTI_QUERY_PARENT_TOP_K", 3)
            child_top_k = settings.RAG_CHILD_TOP_K

        filters = {"metadata.domain": domain}
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

        logger.info(f"[⏱️ TIMER] RetrievalService Parallel retrieve_multi execution took: {time.time() - start_t:.2f} seconds")
        return final_results

try:
    retrieval_service = RetrievalService()
except Exception as _e:
    logger.critical(
        f"[RetrievalService] ❌ Failed to initialize at startup: {_e}. "
        "Check QDRANT URLs, API keys, and embedding model availability.",
        exc_info=True
    )
    raise

