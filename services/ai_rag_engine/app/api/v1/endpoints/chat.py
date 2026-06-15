import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.ai_rag_engine.app.models.schemas import ChatRequest
from services.ai_rag_engine.app.pipeline.orchestrator import orchestrator

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/stream", summary="Stream a chat response based on RAG")
async def chat_stream(request: ChatRequest):
    try:
        # Convert ConversationMessage objects to plain dicts for the pipeline
        # SAFETY LIMIT: Keep only the last 6 messages (3 pairs of question/answer) 
        # to prevent token overflow if the client accidentally sends a massive history.
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in (request.conversation_history or [])
        ][-6:]

        generator = orchestrator.stream_chat_response(
            query=request.query,
            domain=request.domain,
            conversation_history=history,
        )

        return StreamingResponse(generator, media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error in chat_stream endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
