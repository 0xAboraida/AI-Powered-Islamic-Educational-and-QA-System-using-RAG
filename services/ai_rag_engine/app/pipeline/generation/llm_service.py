"""
llm_service.py
--------------
Generates the final response using the LLM.

Flow:
    1. Preparation: Prepares the citation payload and the domain-specific system prompt using the retrieved context.
    2. Generation (Primary): Streams the generation using the primary LLM (Gemini) while rotating API keys to bypass rate limits.
    3. Generation (Fallback): If all Gemini keys fail, automatically falls back to an alternative provider (OpenAI/Groq).
    4. Post-processing: Extracts the in-text citations used by the LLM (e.g., [1], [3]), filters the citations payload to only include those actually used, and sequentially renumbers them.

Why an LLM Service?
    It isolates the complexity of interacting with the LLM API, handling rate limits via key rotation, 
    and managing fallback providers. Most importantly, it handles the complex logic of mapping 
    what the LLM generated (citation markers) back to the actual structured citations sent to the UI.
"""

import re
import json
import logging
from typing import AsyncGenerator, List, Any

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
        
        def estimate_tokens(text: str) -> int:
            return max(len(text) // 4, int(len(text.split()) * 1.5))
            
        input_tokens = estimate_tokens(system_prompt + query)
        logger.info(f"[LLMService] [+] Starting generation for domain='{domain}' | estimated_input_tokens=~{input_tokens}")

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
                logger.warning(f"[LLMService] [-] Primary LLM failed on attempt {attempt+1}: {str(e)[:150]}...")
                last_exception = e

        if not success:
            logger.warning("[LLMService] [-] All Primary LLM attempts failed. Switching to Fallback LLM")
            
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
                logger.error(f"[LLMService] [-] Both Primary and Fallback LLMs failed! Error: {fallback_e}", exc_info=True)
                return {
                    "answer": "عذراً، حدث خطأ في جميع خوادم التوليد. يرجى المحاولة لاحقاً.",
                    "citations": {}
                }

        # ── 3b. Extract which citation IDs the model actually used ────────
        used_ids_set = {
            int(m) for m in _CITATION_PATTERN.findall(full_generated_text)
        }
        used_ids = sorted(list(used_ids_set))

        # Available IDs are extracted from the keys like "cit_1" -> 1
        available_ids = [int(k.split("_")[1]) for k in all_citations.keys()]

        output_tokens = estimate_tokens(full_generated_text)
        
        # Override with exact counts if available
        if hasattr(current_llm_model, "usage_metadata") and current_llm_model.usage_metadata:
            exact_input = current_llm_model.usage_metadata.get("input_tokens")
            exact_output = current_llm_model.usage_metadata.get("output_tokens")
            if exact_input: input_tokens = exact_input
            if exact_output: output_tokens = exact_output
            
        logger.info(
            f"[LLMService] [+] Generation complete | cited_ids={used_ids} available_ids={sorted(available_ids)} | actual_input_tokens={input_tokens} actual_output_tokens={output_tokens}"
        )

        # ── 3c. Filter and Renumber citations ───────
        used_citations = {}
        if used_ids:
            # Map old IDs to new sequential IDs (1, 2, 3...)
            id_mapping = {old_id: new_id for new_id, old_id in enumerate(used_ids, start=1)}
            
            # Replace the old citation numbers in the text with the new ones
            def replace_citation(match):
                old_id = int(match.group(1))
                if old_id in id_mapping:
                    return f"[{id_mapping[old_id]}]"
                return match.group(0)
                
            full_generated_text = _CITATION_PATTERN.sub(replace_citation, full_generated_text)
            
            # Build the final citations list with new sequential keys
            for old_id in used_ids:
                old_key = f"cit_{old_id}"
                if old_key in all_citations:
                    cit_data = all_citations[old_key].copy()
                    used_citations[f"cit_{id_mapping[old_id]}"] = cit_data
        else:
            if all_citations:
                logger.warning(
            "[LLMService] [-] No citation markers found in generated text. Falling back to sending all citations."
        )
                for idx, (key, cit_data) in enumerate(all_citations.items(), start=1):
                    cit = cit_data.copy()
                    used_citations[f"cit_{idx}"] = cit

        # ── 3d. Return final dictionary ───────────
        response_dict: dict[str, Any] = {
            "answer": full_generated_text,
            "citations": used_citations
        }
        
        if settings.RETURN_CONTEXT_CHUNKS:
            response_dict["context"] = context_payload
            
        return response_dict


llm_service = LLMService()
