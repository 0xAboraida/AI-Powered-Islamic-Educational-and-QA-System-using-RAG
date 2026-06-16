import re
import json
import logging
from typing import AsyncGenerator, List

from services.ai_rag_engine.app.models.LLM import get_llm_model, ModelType
from services.ai_rag_engine.app.config.settings import settings
from services.ai_rag_engine.app.pipeline.generation.prompt_builder import build_prompt
from services.ai_rag_engine.app.pipeline.generation.citations import prepare_citations_payloads
from services.ai_rag_engine.app.pipeline.retrieval.parent_child import RetrievedParent

logger = logging.getLogger(__name__)

# Regex to match in-text citation markers like [1], [2], [12], etc.
_CITATION_PATTERN = re.compile(r"\[(\d+)\]")


class LLMService:
    def __init__(self):
        # We no longer keep a static instance of the LLM model.
        # It will be dynamically requested inside generate_streaming_response.
        pass

    async def generate_streaming_response(
        self, query: str, domain: str, parents: List[RetrievedParent], conversation_history: list | None = None
    ) -> AsyncGenerator[str, None]:
        """
        Yields JSON strings containing context, chunks of the answer, and final citations.
        """
        # 1. Prepare all citation dicts and context payload for UI
        all_citations, context_payload = prepare_citations_payloads(parents)
        
        # Yield the context chunks to the frontend
        context_json = json.dumps({"context": context_payload}, ensure_ascii=False)
        yield f"event: context\ndata: {context_json}\n\n"

        # 2. Get domain-specific prompt and inject context + query
        system_prompt = build_prompt(query, domain, parents)

        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

        # 3. Build messages list: system → history → current query
        messages = [SystemMessage(content=system_prompt)]

        for msg in (conversation_history or []):
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg.get("content", "")))

        messages.append(HumanMessage(content=query))
        logger.info(f"[LLMService] Starting stream for domain='{domain}' | query='{query[:60]}...'")

        # 3. Stream the response with in-text citation tracking
        used_ids = set()
        generated_text_parts: List[str] = []
        
        from services.ai_rag_engine.app.config.key_manager import gemini_key_manager
        all_keys = gemini_key_manager.get_all_keys()
        if not all_keys:
            all_keys = [""]
            
        success = False
        last_exception = None

        # ── 3a. Loop over Gemini keys to bypass Rate Limits ──
        for attempt, key in enumerate(all_keys):
            try:
                # Instantiate fresh model wrapper with the rotated key
                current_llm_model = get_llm_model(ModelType.GEMINI, api_key=key)
                
                # Clear text parts if this is a retry
                if attempt > 0:
                    generated_text_parts.clear()
                    
                async for content_chunk in current_llm_model.astream(messages):
                    generated_text_parts.append(content_chunk)
                    payload = json.dumps({"text": content_chunk}, ensure_ascii=False)
                    yield f"event: token\ndata: {payload}\n\n"
                    
                success = True
                break # If successfully completed, break out of rotation loop
                
            except Exception as e:
                logger.warning(f"⚠️ Primary LLM (Gemini) failed on attempt {attempt+1}: {e}")
                last_exception = e
                # Do NOT yield anything to the client yet so we don't pollute the stream 
                # (unless we partially yielded, which means the stream broke midway. 
                # Handling mid-stream errors requires complex recovery, we just retry).

        if not success:
            logger.warning("⚠️ All Primary LLM attempts failed. Switching to Fallback LLM...")
            if not generated_text_parts: # Only yield fallback message if we haven't already yielded tokens
                yield f"event: token\ndata: {json.dumps({'text': '\n\n*(عذراً، الخادم الأساسي مشغول. جاري التبديل للمولد الاحتياطي)*\n\n'}, ensure_ascii=False)}\n\n"
            
            try:
                # Initialize Fallback Model based on settings
                provider_str = settings.FALLBACK_PROVIDER.upper()
                fallback_model_type = ModelType[provider_str] if hasattr(ModelType, provider_str) else ModelType.OPENAI
                fallback_model = get_llm_model(fallback_model_type)
                
                # Stream via Fallback Model
                async for content_chunk in fallback_model.astream(messages):
                    generated_text_parts.append(content_chunk)
                    payload = json.dumps({"text": content_chunk}, ensure_ascii=False)
                    yield f"event: token\ndata: {payload}\n\n"
                    
            except Exception as fallback_e:
                logger.error(f"[LLMService] Both Primary and Fallback LLMs failed! Error: {fallback_e}", exc_info=True)
                error_payload = json.dumps({"text": "\n\nعذراً، حدث خطأ في جميع خوادم التوليد. يرجى المحاولة لاحقاً."}, ensure_ascii=False)
                yield f"event: error\ndata: {error_payload}\n\n"
                return

        # ── 3b. Extract which citation IDs the model actually used ────────
        full_generated_text = "".join(generated_text_parts)
        used_ids = {
            int(m) for m in _CITATION_PATTERN.findall(full_generated_text)
        }

        logger.info(
            f"[LLMService] Stream complete. "
            f"Model cited IDs: {sorted(used_ids)} / "
            f"Available IDs: {[c['id'] for c in all_citations]}"
        )

        # ── 3c. Filter citations to only those the model referenced ───────
        used_citations = [c for c in all_citations if c["id"] in used_ids]

        if not used_citations:
            logger.warning(
                "[LLMService] No citation markers found in generated text. "
                "Falling back to sending all citations."
            )
            used_citations = all_citations

        # ── 3d. Yield filtered citations at end of stream (SSE) ───────────
        citations_payload = json.dumps({"citations": used_citations}, ensure_ascii=False)
        yield f"event: citations\ndata: {citations_payload}\n\n"


llm_service = LLMService()
