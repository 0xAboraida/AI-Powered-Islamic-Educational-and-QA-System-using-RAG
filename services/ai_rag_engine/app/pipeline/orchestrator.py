import time
import logging
from typing import AsyncGenerator

from services.ai_rag_engine.app.pipeline.preprocessing.question_preprocessing.query_preprocessor import (
    QueryPreprocessor,
)
from services.ai_rag_engine.app.pipeline.retrieval.retrieval_service import (
    retrieval_service,
)
from services.ai_rag_engine.app.pipeline.generation.llm_service import llm_service

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    def __init__(self):
        self.preprocessor = QueryPreprocessor()
        self.retrieval_service = retrieval_service
        self.llm_service = llm_service

    async def stream_chat_response(
        self, query: str, domain: str
    ) -> AsyncGenerator[str, None]:
        logger.info(
            f"[Orchestrator] New Request | domain='{domain}' | query='{query[:50]}...'"
        )

        global_start_time = time.time()
        try:
            # Step 1: Preprocessing
            logger.info("[Orchestrator] Step 1.5: Starting Query Preprocessing...")
            prep_start_time = time.time()

            # تحليل السؤال واستخراج الميتا داتا بشكل غير متزامن
            preprocessing_result = await self.preprocessor.process_query(
                user_input=query, chat_history=""
            )

            prep_time = time.time() - prep_start_time
            logger.info(
                f"[⏱️ TIMER] Preprocessing (LLM) took: {prep_time:.2f} seconds"
            )

            # Step 2: Retrieval
            logger.info(
                "[Orchestrator] Step 2: بدء الاسترجاع المتوازي (Concurrent Retrieval)..."
            )
            retrieval_start_time = time.time()

            # هنا نستخدم الأسئلة المتعددة المستخرجة من الـ Preprocessor
            search_queries = [q.search_query for q in preprocessing_result.questions if q.search_query]
            if not search_queries:
                search_queries = [query]

            madhhab_filter = None
            for q in preprocessing_result.questions:
                if q.metadata and q.metadata.madhhab:
                    madhhab_filter = q.metadata.madhhab
                    break

            parents = await self.retrieval_service.retrieve_multi(
                queries=search_queries, domain=domain, madhhab=madhhab_filter
            )

            logger.info(f"[⏱️ TIMER] Total Retrieval Pipeline took: {time.time() - retrieval_start_time:.2f} seconds")

            if not parents:
                logger.warning(
                    f"[Orchestrator] لم يتم العثور على أي نصوص متعلقة بالسؤال في قسم '{domain}'."
                )

            # Step 3: Generation (Streaming)
            logger.info("[Orchestrator] Step 3: بدء توليد الإجابة (Generation)...")
            first_token_received = False
            async for chunk in self.llm_service.generate_streaming_response(
                query=query, domain=domain, parents=parents
            ):
                if not first_token_received and "event: token" in chunk:
                    logger.info(f"[⏱️ TIMER] Time To First Token (TTFT): {time.time() - global_start_time:.2f} seconds")
                    first_token_received = True
                yield chunk

            logger.info(f"[⏱️ TIMER] Total Request Processing took: {time.time() - global_start_time:.2f} seconds")

        except Exception as e:
            logger.error(
                f"[Orchestrator] Unexpected error in Pipeline: {e}", exc_info=True
            )
            yield 'event: error\ndata: {"text": "حدث خطأ غير متوقع في معالجة طلبك."}\n\n'


orchestrator = PipelineOrchestrator()
