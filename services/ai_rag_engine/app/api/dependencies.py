"""
dependencies.py
---------------
FastAPI dependency injection providers for the Zad-AI API.

Usage example inside an endpoint:
    from services.ai_rag_engine.app.api.dependencies import get_orchestrator
    
    @router.post("/stream")
    async def chat_stream(
        request: ChatRequest,
        orc: PipelineOrchestrator = Depends(get_orchestrator),
    ):
        ...
"""

from fastapi import Depends
from services.ai_rag_engine.app.pipeline.orchestrator import orchestrator, PipelineOrchestrator


def get_orchestrator() -> PipelineOrchestrator:
    """
    Returns the singleton PipelineOrchestrator instance.

    The orchestrator is initialized once at startup (heavy models are loaded
    then), so we return the module-level singleton rather than creating a
    new instance per request.
    """
    return orchestrator
