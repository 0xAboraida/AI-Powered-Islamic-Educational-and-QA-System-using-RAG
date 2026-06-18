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
from services.ai_rag_engine.app.pipeline.memory_service import memory_service

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    def __init__(self):
        self.preprocessor = QueryPreprocessor()
        self.retrieval_service = retrieval_service
        self.llm_service = llm_service

    async def generate_chat_response(
        self, query: str, domain: str, session_id: str = None
    ) -> dict:
        logger.info(
            f"[Orchestrator] New Request | session_id='{session_id}' | domain='{domain}' | query='{query[:50]}...'"
        )

        global_start_time = time.time()
        try:
            # Step 1: Preprocessing & Memory
            logger.info("[Orchestrator] Step 1: Fetching Memory and Preprocessing...")
            prep_start_time = time.time()

            # جلب المحادثة السابقة من الذاكرة
            chat_history = await memory_service.get_history(session_id)
            if chat_history:
                logger.info(f"[Orchestrator] Fetched chat history for session '{session_id}'")

            # تحليل السؤال واستخراج الميتا داتا بشكل غير متزامن
            preprocessing_result = await self.preprocessor.process_query(
                user_input=query, chat_history=chat_history
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

            # Step 3: Generation (Single Response)
            logger.info("[Orchestrator] Step 3: بدء توليد الإجابة (Generation)...")
            
            response_data = await self.llm_service.generate_response(
                query=query, domain=domain, parents=parents
            )

            # Step 4: Save Interaction to Memory
            if session_id:
                answer_text = response_data.get("answer", "")
                await memory_service.add_interaction(session_id, query, answer_text)

            logger.info(f"[⏱️ TIMER] Total Request Processing took: {time.time() - global_start_time:.2f} seconds")
            
            return response_data

        except Exception as e:
            logger.error(
                f"[Orchestrator] Unexpected error in Pipeline: {e}", exc_info=True
            )
            return {
                "answer": "حدث خطأ غير متوقع في معالجة طلبك.",
                "citations": {}
            }


orchestrator = PipelineOrchestrator()
