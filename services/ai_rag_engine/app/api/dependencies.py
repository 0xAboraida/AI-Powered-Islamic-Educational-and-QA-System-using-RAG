"""
dependencies.py
---------------
FastAPI dependency injection providers for the Zad-AI API.

Flow:
    1. Definition: Defines getter functions for core services (like the Orchestrator).
    2. Injection: FastAPI endpoints use `Depends(get_orchestrator)` to receive the required service.

Why this file?
    Dependency Injection (DI) allows us to pass mock objects during testing instead of hitting the real database or LLMs. 
    It also ensures that heavy singletons (like our embedding models or Orchestrator) are loaded once at startup and 
    efficiently passed to each request, rather than being recreated every time a user sends a message.
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
