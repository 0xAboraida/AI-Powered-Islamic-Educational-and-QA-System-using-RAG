"""
orchestrator.py
---------------
The Central Brain of the Zad-AI RAG Pipeline.

Flow:
    1. Preprocessing & Memory: 
       - Fetch conversation history.
       - Use LLM to analyze user query, extract metadata (domain/madhhab/source_book/author), detect ambiguity, and evaluate safety.
    
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

from services.ai_rag_engine.app.config.settings import settings
import time
import logging
from typing import AsyncGenerator, Optional
import os
import warnings

# Suppress HuggingFace Tokenizer warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")
logging.getLogger("transformers.tokenization_utils_base").setLevel(logging.ERROR)

CYAN = "\033[96m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
RED = "\033[91m"
MAGENTA = "\033[95m"
RESET = "\033[0m"

ORCH_TAG = f"{CYAN}[Orchestrator]{RESET}"
TIMER_TAG = f"{YELLOW}[Timer]{RESET}"
PREP_TAG = f"{MAGENTA}[Preprocessor]{RESET}"
MEM_TAG = f"{GREEN}[Memory]{RESET}"
RET_TAG = f"{CYAN}[RetrievalService]{RESET}"
HYB_TAG = f"{MAGENTA}[HybridSearch]{RESET}"
EMB_TAG = f"{CYAN}[Embedding]{RESET}"

from typing import AsyncGenerator, Optional

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
        self, query: str, domain: str, session_id: Optional[int] = None
    ) -> dict:
        logger.info(f"\n{'=' * 70}")
        logger.info(f"{ORCH_TAG} NEW CHAT REQUEST")
        logger.info(f"      Session ID : {session_id}")
        logger.info(f"      Domain     : {domain}")
        logger.info(f"      Query      : {query}")
        logger.info("-" * 70)

        global_start_time = time.time()
        try:
            # Step 1: Memory
            logger.info(f"{ORCH_TAG} [STEP 1] MEMORY RETRIEVAL")
            mem_start = time.time()

            # Fetch previous conversation from memory
            # pyrefly: ignore [bad-argument-type]
            chat_history = await memory_service.get_history(session_id)
            if chat_history:
                logger.info(f"      {MEM_TAG} Fetched history for session_id={session_id}")
            else:
                logger.info(f"      {MEM_TAG} No prior history found.")
            
            logger.info(f"      {TIMER_TAG} Memory Retrieval took {time.time() - mem_start:.2f}s")
            logger.info("-" * 70)

            # Step 1.5: Domain Detection
            from services.ai_rag_engine.app.config.settings import settings
            
            # If FORCE_DOMAIN_DETECTION is True, or domain is auto, we run the classifier
            if settings.FORCE_DOMAIN_DETECTION or domain == "auto":
                logger.info(f"{ORCH_TAG} [STEP 1.5] DOMAIN CLASSIFICATION")
                from services.ai_rag_engine.app.pipeline.preprocessing.domain_classifier import DomainClassifier
                
                clf_start = time.time()
                classifier = DomainClassifier()
                detected_domain = await classifier.detect_domain(query)
                
                if settings.FORCE_DOMAIN_DETECTION:
                    logger.info(f"      {PREP_TAG} Force Domain Detection is ON.")
                    logger.info(f"      {PREP_TAG} User choice: '{domain}' | LLM choice: '{detected_domain}'")
                    if domain == "auto":
                        domain = detected_domain
                        logger.info(f"      {PREP_TAG} Proceeding with LLM choice: {domain}")
                    else:
                        logger.info(f"      {PREP_TAG} Proceeding with User choice: {domain}")
                else:
                    domain = detected_domain
                    logger.info(f"      {PREP_TAG} Auto-detected domain: {domain}")
                
                logger.info(f"      {TIMER_TAG} Domain Classification took {time.time() - clf_start:.2f}s")
                logger.info("-" * 70)

            # Step 2: Query Preprocessing
            logger.info(f"{ORCH_TAG} [STEP 2] INTENT CLASSIFICATION & METADATA EXTRACTION")
            prep_start_time = time.time()
            logger.info(f"      {PREP_TAG} Analyzing user query: '{query}'")
            
            preprocessing_result = await self.preprocessor.process_query(
                user_input=query, chat_history=chat_history, domain=domain
            )

            prep_time = time.time() - prep_start_time
            logger.info(f"      {PREP_TAG} Total distinct questions detected: {preprocessing_result.total_questions}")
            for i, q in enumerate(preprocessing_result.questions, 1):
                logger.info(f"      {PREP_TAG} Q{i} -> '{q.search_query}'")
                logger.info(f"      {PREP_TAG}      -> Safe: {q.is_safe} | Ambiguous: {q.is_ambiguous}")
                
            logger.info(f"      {TIMER_TAG} Query Classification Phase took {prep_time:.2f}s")
            logger.info("-" * 70)

            # Step 3: Guardrails
            logger.info(f"{ORCH_TAG} [STEP 3] GUARDRAILS & ROUTING")
            unsafe_questions = [q for q in preprocessing_result.questions if not q.is_safe]
            if unsafe_questions:
                logger.warning(f"      [Guardrail] Rejected query: flagged as unsafe or out-of-domain.")
                
                # Fetch dynamic rejection message, fallback to default if missing
                dynamic_rejection = getattr(unsafe_questions[0], 'rejection_message', None)
                
                apology_msg = dynamic_rejection or (
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
                    "إذا كان لديك سؤال في أحد هذه المجالات، فسأسعى إلى تقديم إجابة دقيقة مستنداً إلي أمهات الكتب."
                )
                
                if session_id:
                    await memory_service.add_interaction(session_id, query, apology_msg)
                
                return {"answer": apology_msg, "citations": {}}

            ambiguous_questions = [q for q in preprocessing_result.questions if q.is_ambiguous]
            if ambiguous_questions:
                logger.warning(f"      [Guardrail] Rejected query: flagged as ambiguous.")
                clarification_msg = ambiguous_questions[0].clarification_message or "عذراً، سؤالك غير واضح. هل يمكنك تحديد ما تقصده بدقة؟"
                
                if session_id:
                    await memory_service.add_interaction(session_id, query, clarification_msg)
                
                return {"answer": clarification_msg, "citations": {}}
            
            logger.info(f"      [Guardrail] Passed. Query is safe and clear.")
            logger.info("-" * 70)

            # Step 3.5: Meta & Greetings Bypass
            is_meta_query = any(getattr(q, "is_meta", False) for q in preprocessing_result.questions)
            if is_meta_query:
                logger.info(f"{ORCH_TAG} [STEP 3.5] META/GREETING DETECTED. SKIPPING RETRIEVAL.")
                search_queries = []
                parents = []
            else:
                # Step 4: Dynamic Filtering
                logger.info(f"{ORCH_TAG} [STEP 4] DYNAMIC SEARCH FILTERING")
                
                search_queries = []
                multi_filters = []
                global_madhhab = None
                
                for q in preprocessing_result.questions:
                    sq = q.search_query if q.search_query else query
                    search_queries.append(sq)
                    
                    q_filters = {}
                    if q.metadata:
                        if q.metadata.madhhab and not global_madhhab:
                            global_madhhab = q.metadata.madhhab
                        if q.metadata.author:
                            q_filters["metadata.author"] = q.metadata.author
                        if q.metadata.source_book:
                            q_filters["metadata.book_title"] = q.metadata.source_book
                    multi_filters.append(q_filters)

                if not search_queries:
                    search_queries = [query]
                    multi_filters = [{}]

                logger.info(f"      {RET_TAG} Applying distinct filters per query:")
                for idx, mf in enumerate(multi_filters):
                    if mf:
                        logger.info(f"      {RET_TAG}      -> Q{idx+1} Filters: {mf}")
                    else:
                        logger.info(f"      {RET_TAG}      -> Q{idx+1} Filters: None (Broad Search)")

                logger.info("-" * 70)

                # Step 5: Retrieval
                logger.info(f"{ORCH_TAG} [STEP 5] HYBRID RAG RETRIEVAL")
                retrieval_start_time = time.time()

                parents = await self.retrieval_service.retrieve_multi(
                    queries=search_queries, 
                    domain=domain, 
                    madhhab=global_madhhab,
                    custom_filters=None,
                    multi_filters=multi_filters
                )

                logger.info(f"      {TIMER_TAG} Total Retrieval Pipeline took {time.time() - retrieval_start_time:.2f}s")
                logger.info(f"      {RET_TAG} Found {len(parents) if parents else 0} parent context chunks.")
                
                if parents:
                    logger.info(f"      {RET_TAG} Extracted Sources:")
                    for i, p in enumerate(parents, 1):
                        meta = p.metadata
                        hierarchy = meta.get("hierarchy", "N/A")
                        book_title = meta.get("book_title", "N/A")
                        author = meta.get("author", "N/A")
                        
                        if isinstance(hierarchy, list):
                            hierarchy_str = " > ".join([str(h) for h in hierarchy])
                        else:
                            hierarchy_str = str(hierarchy)
                        if len(hierarchy_str) > 60:
                            hierarchy_str = hierarchy_str[:57] + "..."
                            
                        logger.info(f"      {RET_TAG}      {i}. {book_title} ({author}) | {hierarchy_str}")

                if not parents:
                    logger.warning(
                        f"      [Retrieval] No related texts found for query in domain='{domain}'."
                    )
                    apology_msg = "عذراً، لم أتمكن من العثور على معلومات دقيقة في المصادر والكتب المعتمدة لدي للإجابة على هذا السؤال."
                    
                    if session_id:
                        await memory_service.add_interaction(session_id, query, apology_msg)
                    
                    return {"answer": apology_msg, "citations": {}}

                logger.info("-" * 70)
            
            # Step 6: Generation
            logger.info(f"{ORCH_TAG} [STEP 6] RESPONSE GENERATION")
            gen_start_time = time.time()
            
            # Join the rewritten, explicit search queries to send to the Generation LLM
            explicit_queries_for_llm = "\n".join([f"- {q}" for q in search_queries])
            
            combined_query = (
                f"سؤال المستخدم الأصلي:\n{query}\n\n"
                f"محاور البحث التي تم استخراجها:\n{explicit_queries_for_llm}"
            )

            response_data = await self.llm_service.generate_response(
                query=combined_query, domain=domain, parents=parents
            )
            logger.info(f"      {TIMER_TAG} Generation Phase took {time.time() - gen_start_time:.2f}s")

            # Step 5: Save Interaction to Memory
            if session_id:
                answer_text = response_data.get("answer", "")
                await memory_service.add_interaction(session_id, query, answer_text)

            logger.info("-" * 70)
            import datetime
            end_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            logger.info(f"{ORCH_TAG} [TOTAL TIME] Pipeline completed successfully in {time.time() - global_start_time:.2f}s at [{end_time}]")
            logger.info("=" * 70 + "\n")
            
            return response_data

        except Exception as e:
            logger.error(f"[Orchestrator] Unexpected error during pipeline execution: {e}", exc_info=True)
            return {
                "answer": "حدث خطأ غير متوقع في معالجة طلبك.",
                "citations": {}
            }

    async def retrieve_chunks_for_voice(
        self, query: str, domain: str, session_id: int = None
    ) -> dict:
        """
        Voice-optimized retrieval: runs Steps 1 & 2 only (no local LLM generation).
        Returns raw retrieved chunks + guardrail signals for the LiveKit LLM to handle.
        The LiveKit agent's LLM (GPT-4.1-mini / Gemini) will synthesize the final
        voice-optimized Arabic answer directly from the returned source chunks.
        """
        logger.info("\n" + "=" * 60)
        logger.info(
            f"[Voice-Orchestrator] New Voice Request | session_id={session_id} domain='{domain}' query='{query}'"
        )
        global_start = time.time()
        try:
            logger.info("-" * 50)
            # ── Step 1: Memory + Preprocessing ─────────────────────────────
            logger.info("[Voice-Orchestrator] Step 1: Fetching memory and preprocessing")
            prep_start = time.time()
            chat_history = await memory_service.get_history(session_id)
            preprocessing_result = await self.preprocessor.process_query(
                user_input=query, chat_history=chat_history, domain=domain
            )
            logger.info(f"[Timer] Preprocessing took {time.time() - prep_start:.2f}s")
            # ── Guardrail: Unsafe ───────────────────────────────────────────
            unsafe = [q for q in preprocessing_result.questions if not q.is_safe]
            if unsafe:
                logger.warning("[Guardrail] Rejected voice query: flagged as unsafe.")
                dynamic_rejection = getattr(unsafe[0], 'rejection_message', None)
                apology = dynamic_rejection or (
                    "أعتذر، أنا زاد، مساعد متخصص في العلوم الشرعية والعلوم المرتبطة بها، "
                    "ولذلك لا أستطيع الإجابة عن الأسئلة الخارجة عن نطاق تخصصي."
                )
                return {"guardrail": "unsafe", "message": apology, "chunks": []}
            # ── Guardrail: Ambiguous ────────────────────────────────────────
            ambiguous = [q for q in preprocessing_result.questions if q.is_ambiguous]
            if ambiguous:
                logger.warning("[Guardrail] Rejected voice query: ambiguous.")
                clarification = (
                    ambiguous[0].clarification_message
                    or "عذراً، سؤالك غير واضح. هل يمكنك تحديد ما تقصده بدقة؟"
                )
                return {"guardrail": "ambiguous", "message": clarification, "chunks": []}
            logger.info("-" * 50)
            
            # ── Meta / Greeting Bypass ──────────────────────────────────────
            is_meta_query = any(getattr(q, "is_meta", False) for q in preprocessing_result.questions)
            if is_meta_query:
                logger.info("[Voice-Orchestrator] Meta/Greeting detected. Returning empty chunks to allow LLM to respond directly.")
                return {
                    "guardrail": "ok",
                    "search_queries": [],
                    "chunks": [],
                }

            # ── Step 2: Retrieval ───────────────────────────────────────────
            logger.info("[Voice-Orchestrator] Step 2: Starting retrieval")
            retrieval_start = time.time()
            search_queries = [
                q.search_query for q in preprocessing_result.questions if q.search_query
            ] or [query]
            madhhab_filter = next(
                (
                    q.metadata.madhhab
                    for q in preprocessing_result.questions
                    if q.metadata and q.metadata.madhhab
                ),
                None,
            )
            
            source_book_filter = next(
                (
                    q.metadata.source_book
                    for q in preprocessing_result.questions
                    if q.metadata and q.metadata.source_book
                ),
                None,
            )
            
            author_filter = next(
                (
                    q.metadata.author
                    for q in preprocessing_result.questions
                    if q.metadata and q.metadata.author
                ),
                None,
            )
            
            custom_filters = {}
            if author_filter:
                custom_filters["metadata.author"] = author_filter
                
            if source_book_filter:
                logger.info(f"[Voice-Retrieval] Applying strict filter: book_title='{source_book_filter}'")
                custom_filters["metadata.book_title"] = source_book_filter

            parents = await self.retrieval_service.retrieve_multi(
                queries=search_queries, 
                domain=domain, 
                madhhab=madhhab_filter,
                custom_filters=custom_filters if custom_filters else None
            )
            logger.info(f"[Timer] Retrieval took {time.time() - retrieval_start:.2f}s")
            logger.info(f"[Retrieval] Found {len(parents) if parents else 0} parent chunks.")

            if parents:
                logger.info("[Retrieval] Voice Extracted Sources:")
                for p in parents:
                    meta = p.metadata
                    hierarchy = meta.get("hierarchy", "N/A")
                    book_title = meta.get("book_title", "N/A")
                    author = meta.get("author", "N/A")
                    madhhab = meta.get("madhhab", "N/A")
                    
                    if isinstance(hierarchy, list):
                        hierarchy_str = " > ".join([str(h) for h in hierarchy])
                    else:
                        hierarchy_str = str(hierarchy)
                    if len(hierarchy_str) > 60:
                        hierarchy_str = hierarchy_str[:57] + "..."
                        
                    logger.info(f"  -> madhhab='{madhhab}' author='{author}' book_title='{book_title}' hierarchy='{hierarchy_str}'")
            # ── Serialize RetrievedParent objects ───────────────────────────
            def _serialize(parent) -> dict:
                """Safely serialize a RetrievedParent regardless of its type."""
                # Pydantic v2
                if hasattr(parent, "model_dump"):
                    return parent.model_dump()
                # Pydantic v1
                if hasattr(parent, "dict"):
                    return parent.dict()
                # Dataclass
                try:
                    import dataclasses
                    if dataclasses.is_dataclass(parent):
                        return dataclasses.asdict(parent)
                except Exception:
                    pass
                # Plain object fallback
                return parent.__dict__
            serialized_chunks = [_serialize(p) for p in (parents or [])]
            logger.info(
                f"[Voice-Orchestrator] Request completed in {time.time() - global_start:.2f}s | "
                f"Returned {len(serialized_chunks)} chunks."
            )
            logger.info("=" * 60 + "\n")
            return {
                "guardrail": "ok",
                "search_queries": search_queries,
                "chunks": serialized_chunks,
            }
        except Exception as e:
            logger.error(f"[Voice-Orchestrator] Error during voice retrieval: {e}", exc_info=True)
            return {
                "guardrail": "error",
                "message": "حدث خطأ في استرجاع المعلومات.",
                "chunks": [],
            }
            
orchestrator = PipelineOrchestrator()
