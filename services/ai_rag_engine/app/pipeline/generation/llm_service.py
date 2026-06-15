import re
import json
import logging
from typing import AsyncGenerator, List

from services.ai_rag_engine.app.models.LLM import get_llm_model, ModelType
from services.ai_rag_engine.app.pipeline.generation.prompt_builder import build_prompt
from services.ai_rag_engine.app.pipeline.generation.citations import prepare_citations_payloads
from services.ai_rag_engine.app.pipeline.retrieval.parent_child import RetrievedParent

logger = logging.getLogger(__name__)

# Regex to match in-text citation markers like [1], [2], [12], etc.
_CITATION_PATTERN = re.compile(r"\[(\d+)\]")


class LLMService:
    def __init__(self):
        # Fetch the LLM model instance using the factory.
        # We keep the wrapper (not just the client) to use the full abstract interface (astream).
        self.llm_model = get_llm_model(ModelType.GEMINI)

    async def generate_streaming_response(
        self, query: str, domain: str, parents: List[RetrievedParent], conversation_history: list | None = None
    ) -> AsyncGenerator[str, None]:
        """
        Yields JSON strings containing context, chunks of the answer, and final citations.

        Stream format:
            {"type": "context",   "data": [...]}  ← raw chunks sent to UI at the start
            {"type": "chunk",     "content": "…"} ← streaming LLM tokens (with inline [1] markers)
            {"type": "citations", "data": [...]}  ← ONLY the citations actually used by the model

        The final citations payload is filtered by tracking which [N] markers appeared
        in the generated text, so the UI only receives sources the model truly cited.
        """

        # 1. Prepare all citation dicts and context payload for UI
        all_citations, context_payload = prepare_citations_payloads(parents)

        # 2. Get domain-specific prompt and inject context + query
        system_prompt = build_prompt(query, domain, parents)

        from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

        # 3. Build messages list: system → history → current query
        messages = [SystemMessage(content=system_prompt)]

        # Inject conversation history for memory context
        for msg in (conversation_history or []):
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "assistant":
                messages.append(AIMessage(content=msg.get("content", "")))

        # Append the current user query
        messages.append(HumanMessage(content=query))

        logger.info(f"[LLMService] Starting stream for domain='{domain}' | query='{query[:60]}...'")

        # 3. Stream the response with in-text citation tracking
        try:
            # ── 3a. Stream LLM tokens via the abstract model interface (SSE) ──
            generated_text_parts: List[str] = []

            async for content_chunk in self.llm_model.astream(messages):
                generated_text_parts.append(content_chunk)
                payload = json.dumps({"text": content_chunk}, ensure_ascii=False)
                yield f"event: token\ndata: {payload}\n\n"

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

            # ── 3d. Filter citations to only those the model referenced ───────
            used_citations = [c for c in all_citations if c["id"] in used_ids]

            if not used_citations:
                # Fallback: if model wrote nothing or cited nothing, send all citations
                logger.warning(
                    "[LLMService] No citation markers found in generated text. "
                    "Falling back to sending all citations."
                )
                used_citations = all_citations

            # ── 3d. Yield filtered citations at end of stream (SSE) ───────────
            citations_payload = json.dumps({"citations": used_citations}, ensure_ascii=False)
            yield f"event: citations\ndata: {citations_payload}\n\n"

        except Exception as e:
            logger.error(f"[LLMService] Error during LLM generation: {e}", exc_info=True)
            error_payload = json.dumps({"text": "حدث خطأ أثناء توليد الإجابة."}, ensure_ascii=False)
            yield f"event: error\ndata: {error_payload}\n\n"


try:
    llm_service = LLMService()
except Exception as _e:
    logger.critical(
        f"[LLMService] ❌ Failed to initialize LLMService at startup: {_e}. "
        "Check GOOGLE_API_KEY and LLM_MODEL_NAME in your .env file.",
        exc_info=True
    )
    raise
