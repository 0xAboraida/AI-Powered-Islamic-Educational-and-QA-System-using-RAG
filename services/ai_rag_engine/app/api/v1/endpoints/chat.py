import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from services.ai_rag_engine.app.models.schemas import ChatRequest
from services.ai_rag_engine.app.pipeline.orchestrator import orchestrator

logger = logging.getLogger(__name__)

router = APIRouter()

DOMAIN_MAPPING = {
    1: "فقه",
    2: "العقيدة",
    3: "السيرة",
    4: "التفسير",
    5: "الحديث",
    6: "التاريخ",
    7: "علوم القران",
    8: "النحو والصرف"  # علوم اللغة
}

@router.post("/stream", summary="Stream a chat response based on RAG")
async def chat_stream(request: ChatRequest):
    try:
        domain_str = DOMAIN_MAPPING.get(request.domain)
        if not domain_str:
            raise HTTPException(status_code=400, detail="Invalid domain ID")

        generator = orchestrator.stream_chat_response(
            query=request.query,
            domain=domain_str
        )

        return StreamingResponse(generator, media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error in chat_stream endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
