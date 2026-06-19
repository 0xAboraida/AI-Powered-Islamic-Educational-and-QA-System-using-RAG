"""
routes.py
---------
Central router registry for the Zad-AI API.

Flow:
    1. Import: Imports all individual endpoint routers (e.g., `chat.router`).
    2. Assembly: Mounts the sub-routers under specific prefixes (like `/v1/chat`).
    3. Export: Exposes a single `api_router` object that `main.py` can include.

Why this file?
    As the application grows with new features (like user auth, admin panels, analytics), 
    we don't want to clutter `main.py` with dozens of `app.include_router` calls. 
    This file acts as a clean, centralized table of contents for the entire REST API.
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
