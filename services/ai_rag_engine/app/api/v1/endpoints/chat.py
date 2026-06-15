import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from services.ai_rag_engine.app.models.schemas import ChatRequest
from services.ai_rag_engine.app.pipeline.orchestrator import orchestrator

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/stream", summary="Stream a chat response based on RAG")
async def chat_stream(request: ChatRequest):
    try:
        # The entire RAG pipeline (Retrieval + Generation) is managed by the Orchestrator
        generator = orchestrator.stream_chat_response(
            query=request.query,
            domain=request.domain
        )
        
        return StreamingResponse(generator, media_type="text/event-stream")
        
    except Exception as e:
        logger.error(f"Error in chat_stream endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
