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
        print(f"\n{'=' * 70}")
        print(f"{ORCH_TAG} NEW CHAT REQUEST")
        print(f"      [+] Session ID : {session_id}")
        print(f"      [+] Domain     : {domain}")
        print(f"      [+] Query      : {query}")
        print("-" * 70)

        global_start_time = time.time()
        try:
            # Step 1: Memory
            print(f"{ORCH_TAG} [STEP 1] MEMORY RETRIEVAL")
            mem_start = time.time()

            # Fetch previous conversation from memory
            # pyrefly: ignore [bad-argument-type]
            chat_history = await memory_service.get_history(session_id)
            if chat_history:
                print(f"      {MEM_TAG} [+] Fetched history for session_id={session_id}")
            else:
                print(f"      {MEM_TAG} [+] No prior history found.")
            
            print(f"      {TIMER_TAG} [+] Memory Retrieval took {time.time() - mem_start:.2f}s")
            print("-" * 70)

            # Step 2: Query Preprocessing
            print(f"{ORCH_TAG} [STEP 2] QUERY PREPROCESSING")
            prep_start_time = time.time()
            print(f"      {PREP_TAG} [+] Analyzing user query: '{query}'")
            
            preprocessing_result = await self.preprocessor.process_query(
                user_input=query, chat_history=chat_history, domain=domain
            )

            prep_time = time.time() - prep_start_time
            print(f"      {PREP_TAG} [+] Total distinct questions detected: {preprocessing_result.total_questions}")
            for i, q in enumerate(preprocessing_result.questions, 1):
                print(f"      {PREP_TAG} [+] Q{i} -> '{q.search_query}'")
                print(f"      {PREP_TAG}          -> Safe: {q.is_safe} | Ambiguous: {q.is_ambiguous}")
                print(f"      {PREP_TAG}          -> Ambiguous: {q.is_ambiguous}")
                
            print(f"      {TIMER_TAG} [+] Query Preprocessing Phase took {prep_time:.2f}s")
            print("-" * 70)

            # ── 🚨 Guardrail Check: Reject non-Islamic questions ──
            unsafe_questions = [q for q in preprocessing_result.questions if not q.is_safe]
            if unsafe_questions:
                logger.warning("[Guardrail] Rejected query: flagged as unsafe or out-of-domain.")
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
                    "إذا كان لديك سؤال في أحد هذه المجالات، فسأسعى إلى تقديم إجابة دقيقة مستنداً إلي أمهات الكتب."
                )
                # Save to memory
                if session_id:
                    await memory_service.add_interaction(session_id, query, apology_msg)
                
                return {
                    "answer": apology_msg,
                    "citations": {}
                }

            # ── Guardrail Check: Handle Ambiguous queries ──
            ambiguous_questions = [q for q in preprocessing_result.questions if q.is_ambiguous]
            if ambiguous_questions:
                logger.warning("[Guardrail] Rejected query: flagged as ambiguous.")
                clarification_msg = ambiguous_questions[0].clarification_message or "عذراً، سؤالك غير واضح. هل يمكنك تحديد ما تقصده بدقة؟"
                
                # Save to memory so the LLM remembers asking for clarification
                if session_id:
                    await memory_service.add_interaction(session_id, query, clarification_msg)
                
                return {
                    "answer": clarification_msg,
                    "citations": {}
                }

            # Step 3: Retrieval
            print(f"{ORCH_TAG} [STEP 3] RETRIEVAL PIPELINE")
            retrieval_start_time = time.time()

            # Use the multiple queries extracted by the Preprocessor
            search_queries = [q.search_query for q in preprocessing_result.questions if q.search_query]
            if not search_queries:
                search_queries = [query]

            madhhab_filter = None
            source_book_filter = None
            author_filter = None
            
            for q in preprocessing_result.questions:
                if q.metadata:
                    if q.metadata.madhhab and not madhhab_filter:
                        madhhab_filter = q.metadata.madhhab
                    if q.metadata.source_book and not source_book_filter:
                        source_book_filter = q.metadata.source_book
                    if q.metadata.author and not author_filter:
                        author_filter = q.metadata.author

            custom_filters = {}
            if author_filter:
                custom_filters["metadata.author"] = author_filter
            if source_book_filter:
                custom_filters["metadata.book_title"] = source_book_filter

            print(f"      {RET_TAG} [+] Applying strict filters:")
            if source_book_filter:
                print(f"      {RET_TAG}      -> book_title='{source_book_filter}'")
            if author_filter:
                print(f"      {RET_TAG}      -> author='{author_filter}'")

            parents = await self.retrieval_service.retrieve_multi(
                queries=search_queries, 
                domain=domain, 
                madhhab=madhhab_filter,
                custom_filters=custom_filters if custom_filters else None
            )

            print(f"      {TIMER_TAG} [+] Total Retrieval Pipeline took {time.time() - retrieval_start_time:.2f}s")
            print(f"      {RET_TAG} [+] Found {len(parents) if parents else 0} parent context chunks.")
            
            if parents:
                print(f"      {RET_TAG} [+] Extracted Sources:")
                for i, p in enumerate(parents, 1):
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
                        
                    print(f"      {RET_TAG}      {i}. {book_title} ({author}) | {hierarchy_str}")

            if not parents:
                logger.warning(
                    f"[Retrieval] No related texts found for query in domain='{domain}'."
                )
                apology_msg = "عذراً، لم أتمكن من العثور على معلومات دقيقة في المصادر والكتب المعتمدة لدي للإجابة على هذا السؤال."
                
                # Save to memory
                if session_id:
                    await memory_service.add_interaction(session_id, query, apology_msg)
                
                return {
                    "answer": apology_msg,
                    "citations": {}
                }

            print("-" * 70)
            # Step 4: Generation
            print(f"{ORCH_TAG} [STEP 4] RESPONSE GENERATION")
            gen_start_time = time.time()
            
            # Join the rewritten, explicit search queries to send to the Generation LLM
            explicit_queries_for_llm = "\n".join([f"- {q}" for q in search_queries])

            response_data = await self.llm_service.generate_response(
                query=explicit_queries_for_llm, domain=domain, parents=parents
            )
            print(f"      {TIMER_TAG} [+] Generation Phase took {time.time() - gen_start_time:.2f}s")

            # Step 5: Save Interaction to Memory
            if session_id:
                answer_text = response_data.get("answer", "")
                await memory_service.add_interaction(session_id, query, answer_text)

            print("-" * 70)
            print(f"{ORCH_TAG} [TOTAL TIME] Pipeline completed successfully in {time.time() - global_start_time:.2f}s")
            print("=" * 70 + "\n")
            
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
        print("\n" + "=" * 60)
        logger.info(
            f"[Voice-Orchestrator] New Voice Request | session_id={session_id} domain='{domain}' query='{query}'"
        )
        global_start = time.time()
        try:
            print("-" * 50)
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
                apology = (
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
            print("-" * 50)
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
            print("=" * 60 + "\n")
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
