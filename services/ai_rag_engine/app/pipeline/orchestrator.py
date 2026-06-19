"""
orchestrator.py
---------------
The Central Brain of the Zad-AI RAG Pipeline.

Flow:
    1. Preprocessing & Memory: 
       - Fetch conversation history.
       - Use LLM to analyze user query, extract metadata (domain/madhhab), detect ambiguity, and evaluate safety.
    
    2. Guardrail Checks: 
       - Reject unsafe questions.
       - Ask for clarification on ambiguous questions.

    3. Concurrent Retrieval: 
       - Route the extracted search queries to the multi-layered retrieval pipeline (Hybrid Search -> Parent-Child -> Reranking).

    4. Generation & Memory Update: 
       - Pass retrieved context to the LLM to generate the final answer.
       - Save the interaction to memory.

Why an Orchestrator?
    It separates the workflow logic from the individual services. 
    By centrally managing the pipeline, we ensure robust error handling, 
    precise timer logging, and a clean, step-by-step execution model.
"""

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
        self, query: str, domain: str, session_id: int = None
    ) -> dict:
        print("\n\n" + "="*60)
        logger.info(
            f"📥 [REQUEST] New Request | session_id='{session_id}' | domain='{domain}'"
        )
        logger.info(f"🗣️ [USER] Query: '{query}'")
        print("="*60)

        global_start_time = time.time()
        try:
            # Step 1: Preprocessing & Memory
            logger.info("🧠 [PREPROCESSING] Step 1: Fetching Memory and Preprocessing...")
            prep_start_time = time.time()

            # Fetch previous conversation from memory
            chat_history = await memory_service.get_history(session_id)
            if chat_history:
                logger.info(f"📚 [MEMORY] Fetched chat history for session '{session_id}'")

            # Analyze the query and extract metadata asynchronously
            preprocessing_result = await self.preprocessor.process_query(
                user_input=query, chat_history=chat_history
            )

            prep_time = time.time() - prep_start_time
            logger.info(f"⏱️ [TIMER] Preprocessing (LLM) took: {prep_time:.2f} seconds")
            
            # Log the JSON output from the preprocessor
            logger.info(f"⚙️ [PREPROCESSING] Total distinct questions detected: {preprocessing_result.total_questions}")
            for i, q in enumerate(preprocessing_result.questions, 1):
                logger.info(f"   ▶ Question {i}: {q.original_question}")
                logger.info(f"      - Search Query: {q.search_query}")
                logger.info(f"      - Is Safe: {q.is_safe} | Is Ambiguous: {q.is_ambiguous}")
                if q.metadata:
                    logger.info(f"      - Metadata: {q.metadata.model_dump(exclude_none=True)}")

            # ── 🚨 Guardrail Check: Reject non-Islamic questions ──
            unsafe_questions = [q for q in preprocessing_result.questions if not q.is_safe]
            if unsafe_questions:
                logger.warning("🛡️ [GUARDRAIL] Rejected query because it was flagged as non-Islamic (out-of-domain).")
                apology_msg = (
                    "أعتذر، أنا زاد، مساعد متخصص في العلوم الشرعية والعلوم المرتبطة بها، ولذلك لا أستطيع الإجابة عن الأسئلة الخارجة عن نطاق تخصصي.\n\n"
                    "يمكنني مساعدتك في المجالات التالية:\n\n"
                    "• الفقه\n"
                    "• العقيدة\n"
                    "• السيرة النبوية\n"
                    "• الحديث وعلومه\n"
                    "• التفسير\n"
                    "• علوم القرآن\n"
                    "• علوم اللغة العربية\n"
                    "• التاريخ الإسلامي\n\n"
                    "إذا كان لديك سؤال في أحد هذه المجالات، فسأسعى إلى تقديم إجابة دقيقة مستندة إلى المصادر العلمية المتخصصة."
                )
                # Save to memory
                if session_id:
                    await memory_service.add_interaction(session_id, query, apology_msg)
                
                return {
                    "answer": apology_msg,
                    "citations": None
                }

            # ── 🚨 Guardrail Check: Handle Ambiguous queries ──
            ambiguous_questions = [q for q in preprocessing_result.questions if q.is_ambiguous]
            if ambiguous_questions:
                logger.warning("❓ [GUARDRAIL] Rejected query because it was flagged as ambiguous.")
                clarification_msg = ambiguous_questions[0].clarification_message or "عذراً، سؤالك غير واضح. هل يمكنك تحديد ما تقصده بدقة؟"
                
                # Save to memory so the LLM remembers asking for clarification
                if session_id:
                    await memory_service.add_interaction(session_id, query, clarification_msg)
                
                return {
                    "answer": clarification_msg,
                    "citations": None
                }

            print("-" * 60)
            # Step 2: Retrieval
            logger.info("🔍 [RETRIEVAL] Step 2: Starting Concurrent Retrieval...")
            retrieval_start_time = time.time()

            # Use the multiple queries extracted by the Preprocessor
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

            logger.info(f"⏱️ [TIMER] Total Retrieval Pipeline took: {time.time() - retrieval_start_time:.2f} seconds")
            logger.info(f"📦 [RETRIEVAL] Found {len(parents) if parents else 0} parent chunks.")

            if not parents:
                logger.warning(
                    f"⚠️ [RETRIEVAL] No related texts were found for the query in the '{domain}' domain."
                )

            print("-" * 60)
            # Step 3: Generation (Single Response)
            logger.info("🤖 [GENERATION] Step 3: Starting Response Generation...")
            
            # Join the rewritten, explicit search queries to send to the Generation LLM
            # This ensures the LLM never gets confused by pronouns (e.g., "وما دليله؟")
            explicit_queries_for_llm = "\n".join([f"- {q}" for q in search_queries])

            response_data = await self.llm_service.generate_response(
                query=explicit_queries_for_llm, domain=domain, parents=parents
            )

            # Step 4: Save Interaction to Memory
            if session_id:
                answer_text = response_data.get("answer", "")
                await memory_service.add_interaction(session_id, query, answer_text)

            logger.info(f"✅ [SUCCESS] Total Request Processing took: {time.time() - global_start_time:.2f} seconds")
            print("============================================================\n\n")
            
            return response_data

        except Exception as e:
            logger.error(
                f"❌ [ERROR] Unexpected error in Pipeline: {e}", exc_info=True
            )
            print("============================================================\n\n")
            return {
                "answer": "حدث خطأ غير متوقع في معالجة طلبك.",
                "citations": None
            }


orchestrator = PipelineOrchestrator()
