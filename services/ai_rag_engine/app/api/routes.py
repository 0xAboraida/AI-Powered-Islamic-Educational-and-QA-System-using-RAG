"""
routes.py
---------
Central router registry for the Zad-AI API.

All routers from all versioned endpoint modules are imported and
assembled here. main.py includes this single router, keeping the
app factory clean and the routing logic in one place.
"""

from fastapi import APIRouter
from services.ai_rag_engine.app.api.v1.endpoints import chat

# Root API router — all versioned sub-routers are mounted here
api_router = APIRouter()

api_router.include_router(
    chat.router,
    prefix="/v1/chat",
    tags=["chat"],
)
