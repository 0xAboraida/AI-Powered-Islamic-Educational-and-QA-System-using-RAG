import time
import logging
from typing import AsyncGenerator

from services.ai_rag_engine.app.pipeline.preprocessing.question_preprocessing.query_preprocessor import QueryPreprocessor
from services.ai_rag_engine.app.pipeline.retrieval.retrieval_service import retrieval_service
from services.ai_rag_engine.app.pipeline.generation.llm_service import llm_service
from services.ai_rag_engine.app.pipeline.reranking.cross_encoder import CrossEncoderReranker

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """
    Central coordinator for the entire RAG pipeline.

    Full Flow:
        1. Query Preprocessing  → LLM extracts safe search_queries + madhhab metadata
        2. Parallel Retrieval   → HybridRetriever (Dense + Sparse + RRF) → ParentChildRetriever
        3. Reranking (optional) → CrossEncoder reranker — controlled by USE_RERANKER flag
        4. Generation           → Domain-specific prompt + streaming LLM response
    """

    # ─── Feature Flag ────────────────────────────────────────────────────────
    # Set to True to enable CrossEncoder reranking after retrieval.
    # Reranking improves accuracy but adds ~1-3s latency per request.
    USE_RERANKER: bool = False
    # ─────────────────────────────────────────────────────────────────────────

    def __init__(self):
        self.preprocessor = QueryPreprocessor()
        self.retrieval_service = retrieval_service
        self.llm_service = llm_service

        # Reranker is always initialized (model loaded once at startup),
        # but only CALLED during inference when USE_RERANKER is True.
        if self.USE_RERANKER:
            logger.info("[Orchestrator] Initializing CrossEncoder Reranker...")
            self.reranker = CrossEncoderReranker()
            logger.info("[Orchestrator] Reranker ready.")
        else:
            self.reranker = None
            logger.info("[Orchestrator] Reranker is DISABLED (USE_RERANKER=False). Set to True to enable.")

    async def stream_chat_response(self, query: str, domain: str) -> AsyncGenerator[str, None]:
        logger.info(f"[Orchestrator] New Request | domain='{domain}' | query='{query[:50]}...'")

        try:
            # ── Step 1: Query Preprocessing ───────────────────────────────────
            logger.info("[Orchestrator] Step 1: Starting Query Preprocessing...")
            start_time = time.time()

            preprocessing_result = self.preprocessor.process_query(
                user_input=query,
                chat_history=""
            )

            prep_time = time.time() - start_time
            logger.info(f"⏱️ [TIME TRACKING] Preprocessing took: {prep_time:.2f} seconds")

            # ── Fix #1: Extract search_queries from questions list ─────────────
            # QuestionProcessingResult has no .search_queries attribute directly.
            # We must iterate over .questions and filter safe ones.
            safe_questions = [
                q for q in preprocessing_result.questions
                if q.is_safe and q.search_query
            ]
            search_queries = [q.search_query for q in safe_questions]

            if not search_queries:
                logger.warning(
                    "[Orchestrator] Preprocessor returned no safe queries. "
                    "Falling back to raw user query."
                )
                search_queries = [query]

            logger.info(
                f"[Orchestrator] Extracted {len(search_queries)} safe search "
                f"{'query' if len(search_queries) == 1 else 'queries'} from preprocessor."
            )

            # ── Fix #2: Extract madhhab from first safe question's metadata ────
            # QuestionProcessingResult has no .metadata_filters dict.
            # The metadata lives in questions[i].metadata.madhhab
            madhhab_filter = None
            if safe_questions and safe_questions[0].metadata:
                madhhab_filter = safe_questions[0].metadata.madhhab
                if madhhab_filter:
                    logger.info(f"[Orchestrator] Madhhab filter detected: '{madhhab_filter}'")

            # ── Step 2: Parallel Retrieval ────────────────────────────────────
            logger.info(
                f"[Orchestrator] Step 2: Starting Parallel Retrieval "
                f"({len(search_queries)} {'query' if len(search_queries) == 1 else 'queries'})..."
            )

            parents = await self.retrieval_service.retrieve_multi(
                queries=search_queries,
                domain=domain,
                madhhab=madhhab_filter,
            )

            if not parents:
                logger.warning(
                    f"[Orchestrator] No relevant texts found for domain='{domain}'."
                )

            # ── Fix #3: Reranking (controlled by USE_RERANKER flag) ───────────
            if self.USE_RERANKER and self.reranker and parents:
                logger.info(
                    f"[Orchestrator] Step 2.5: Reranking {len(parents)} documents..."
                )
                rerank_start = time.time()
                parents = self.reranker.rerank(
                    query=query,
                    documents=parents,
                    top_k=5,
                )
                logger.info(
                    f"⏱️ [TIME TRACKING] Reranking took: {time.time() - rerank_start:.2f} seconds"
                )
                logger.info(
                    f"[Orchestrator] Reranking complete → {len(parents)} documents after reranking."
                )
            elif not self.USE_RERANKER:
                logger.debug("[Orchestrator] Reranking skipped (USE_RERANKER=False).")

            # ── Step 3: Streaming Generation ──────────────────────────────────
            logger.info("[Orchestrator] Step 3: Starting Generation (Streaming)...")
            async for chunk in self.llm_service.generate_streaming_response(
                query=query,
                domain=domain,
                parents=parents,
            ):
                yield chunk

        except Exception as e:
            logger.error(
                f"[Orchestrator] Unexpected error in Pipeline: {e}",
                exc_info=True,
            )
            yield '{"type": "error", "content": "حدث خطأ غير متوقع في معالجة طلبك."}\n'


orchestrator = PipelineOrchestrator()
