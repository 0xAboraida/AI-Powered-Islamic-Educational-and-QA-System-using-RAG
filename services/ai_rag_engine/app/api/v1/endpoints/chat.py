import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.ai_rag_engine.app.models.schemas import ChatRequest, ChatResponse
from services.ai_rag_engine.app.pipeline.orchestrator import orchestrator

logger = logging.getLogger(__name__)

router = APIRouter()

from services.ai_rag_engine.app.config.settings import settings

DOMAIN_MAPPING = settings.DOMAIN_MAPPING

@router.post("/ask", response_model=ChatResponse, summary="Get a chat response based on RAG")
async def chat_endpoint(request: ChatRequest):
    try:
        domain_str = DOMAIN_MAPPING.get(request.domain)
        if not domain_str:
            raise HTTPException(status_code=400, detail="Invalid domain ID")

        response_data = await orchestrator.generate_chat_response(
            query=request.query,
            domain=domain_str,
            session_id=request.session_id
        )

        return response_data

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
