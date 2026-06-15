import time
import logging
from typing import AsyncGenerator

from services.ai_rag_engine.app.pipeline.preprocessing.question_preprocessing.query_preprocessor import QueryPreprocessor
from services.ai_rag_engine.app.pipeline.retrieval.retrieval_service import retrieval_service
from services.ai_rag_engine.app.pipeline.generation.llm_service import llm_service

logger = logging.getLogger(__name__)

class PipelineOrchestrator:
    def __init__(self):
        self.preprocessor = QueryPreprocessor()
        self.retrieval_service = retrieval_service
        self.llm_service = llm_service

    async def stream_chat_response(self, query: str, domain: str) -> AsyncGenerator[str, None]:
        logger.info(f"[Orchestrator] New Request | domain='{domain}' | query='{query[:50]}...'")
        
        try:
            # Step 1: Preprocessing
            logger.info("[Orchestrator] Step 1.5: Starting Query Preprocessing...")
            start_time = time.time()
            
            # تحليل السؤال واستخراج الميتا داتا
            preprocessing_result = self.preprocessor.process_query(user_input=query, chat_history="")
            
            prep_time = time.time() - start_time
            logger.info(f"⏱️ [TIME TRACKING] Preprocessing took: {prep_time:.2f} seconds")
            
            # Step 2: Retrieval
            logger.info("[Orchestrator] Step 2: بدء الاسترجاع المتوازي (Concurrent Retrieval)...")
            
            # هنا يمكنك استخدام الميتا داتا المستخرجة (مثل المذهب) إذا أردت، ولكن الواجهة ترسل الـ domain مسبقاً
            parents = self.retrieval_service.retrieve(query=query, domain=domain)
            
            if not parents:
                logger.warning(f"[Orchestrator] لم يتم العثور على أي نصوص متعلقة بالسؤال في قسم '{domain}'.")
            
            # Step 3: Generation (Streaming)
            logger.info("[Orchestrator] Step 3: بدء توليد الإجابة (Generation)...")
            async for chunk in self.llm_service.generate_streaming_response(query=query, domain=domain, parents=parents):
                yield chunk

        except Exception as e:
            logger.error(f"[Orchestrator] Unexpected error in Pipeline: {e}", exc_info=True)
            yield '{"type": "error", "content": "حدث خطأ غير متوقع في معالجة طلبك."}\n'

orchestrator = PipelineOrchestrator()
