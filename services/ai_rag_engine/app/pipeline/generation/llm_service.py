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

    async def generate_response(
        self, query: str, domain: str, parents: List[RetrievedParent]
    ) -> dict:
        """
        Returns a single dictionary containing the full text, citations, and optionally context.
        """
        # 1. Prepare all citation dicts and context payload for UI
        all_citations, context_payload = prepare_citations_payloads(parents)
        
        # 2. Get domain-specific prompt and inject context + query
        system_prompt = build_prompt(query, domain, parents)

        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

        # 3. Build messages list: system → current query
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=query)]
        logger.info(f"[LLMService] Starting generation for domain='{domain}' | query='{query[:60]}...'")

        # 3. Generate the response with in-text citation tracking
        from services.ai_rag_engine.app.config.key_manager import gemini_key_manager
        all_keys = gemini_key_manager.get_all_keys()
        if not all_keys:
            all_keys = [""]
            
        success = False
        last_exception = None
        full_generated_text = ""

        # ── 3a. Loop over Gemini keys to bypass Rate Limits ──
        for attempt, key in enumerate(all_keys):
            try:
                # Instantiate fresh model wrapper with the rotated key
                current_llm_model = get_llm_model(ModelType.GEMINI, api_key=key)
                
                full_generated_text = ""
                async for content_chunk in current_llm_model.astream(messages):
                    full_generated_text += content_chunk
                    
                success = True
                break # If successfully completed, break out of rotation loop
                
            except Exception as e:
                logger.warning(f"⚠️ Primary LLM (Gemini) failed on attempt {attempt+1}: {e}")
                last_exception = e

        if not success:
            logger.warning("⚠️ All Primary LLM attempts failed. Switching to Fallback LLM...")
            
            try:
                # Initialize Fallback Model based on settings
                provider_str = settings.FALLBACK_PROVIDER.upper()
                fallback_model_type = ModelType[provider_str] if hasattr(ModelType, provider_str) else ModelType.OPENAI
                fallback_model = get_llm_model(fallback_model_type)
                
                ai_message_content = ""
                async for content_chunk in fallback_model.astream(messages):
                    ai_message_content += content_chunk
                    
                full_generated_text = "\n\n*(عذراً، الخادم الأساسي مشغول. تم توليد الإجابة بالمولد الاحتياطي)*\n\n" + ai_message_content
                    
            except Exception as fallback_e:
                logger.error(f"[LLMService] Both Primary and Fallback LLMs failed! Error: {fallback_e}", exc_info=True)
                return {
                    "answer": "عذراً، حدث خطأ في جميع خوادم التوليد. يرجى المحاولة لاحقاً.",
                    "citations": []
                }

        # ── 3b. Extract which citation IDs the model actually used ────────
        used_ids = {
            int(m) for m in _CITATION_PATTERN.findall(full_generated_text)
        }

        # Available IDs are extracted from the keys like "cit_1" -> 1
        available_ids = [int(k.split("_")[1]) for k in all_citations.keys()]

        logger.info(
            f"[LLMService] Generation complete. "
            f"Model cited IDs: {sorted(used_ids)} / "
            f"Available IDs: {sorted(available_ids)}"
        )

        # ── 3c. Filter citations to only those the model referenced ───────
        used_citations = {
            k: v for k, v in all_citations.items()
            if int(k.split("_")[1]) in used_ids
        }

        if not used_citations and all_citations:
            logger.warning(
                "[LLMService] No citation markers found in generated text. "
                "Falling back to sending all citations."
            )
            used_citations = all_citations

        # ── 3d. Return final dictionary ───────────
        response_dict = {
            "answer": full_generated_text,
            "citations": used_citations
        }
        
        if settings.RETURN_CONTEXT_CHUNKS:
            response_dict["context"] = context_payload
            
        return response_dict


llm_service = LLMService()
