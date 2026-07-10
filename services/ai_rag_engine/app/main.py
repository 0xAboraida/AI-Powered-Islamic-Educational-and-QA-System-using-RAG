"""
main.py
-------
The Entry Point for the Zad-AI FastApi Application.

Flow:
    1. Initialization: Configures logging and creates the FastAPI application instance.
    2. Lifespan Events: Eagerly connects to MongoDB clusters on startup to avoid cold-start delays.
    3. Middleware: Injects CORS middleware to allow the external C# backend or Frontend to communicate with this API.
    4. Routing: Mounts all API endpoints from `api/routes.py`.

Why this file?
    This is the standard execution point for uvicorn. It centralizes all application-level 
    configurations, middleware, and lifecycle management without cluttering the business logic.
"""

import logging
import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.ai_rag_engine.app.api.routes import api_router

class TerminalColorsFormatter(logging.Formatter):
    COLORS = {
        "[Orchestrator]": "\033[96m",       # Cyan
        "[Voice-Orchestrator]": "\033[96m", # Cyan
        "[Timer]": "\033[93m",              # Yellow
        "[Preprocessor]": "\033[95m",       # Magenta
        "[Memory]": "\033[92m",             # Green
        "[RetrievalService]": "\033[96m",   # Cyan
        "[HybridSearch]": "\033[95m",       # Magenta
        "[ParentChild]": "\033[94m",        # Blue
        "[DenseRetriever]": "\033[94m",     # Blue
        "[SparseRetriever]": "\033[94m",    # Blue
        "[QdrantManager]": "\033[90m",      # Dark Gray
        "[MongoManager]": "\033[90m",       # Dark Gray
        "[LLMService]": "\033[95m",         # Magenta
        "[DYNAMIC SCHEMA]": "\033[92m",     # Green
        "[Guardrail]": "\033[91m",          # Red
    }
    RESET = "\033[0m"

    def format(self, record):
        msg = super().format(record)        
        # Strip leading spaces that were next to emojis
        msg = msg.strip()

        # Colorize and Smart Indent
        for tag, color in self.COLORS.items():
            if tag in msg:
                # Add 6 spaces indent for sub-services during chat flow
                if tag not in ("[Orchestrator]", "[Voice-Orchestrator]", "[MongoManager]"):
                    # Check if it doesn't already have indentation
                    if not msg.startswith(" ") and "warmed up" not in msg and "Warming up" not in msg and "Opening new" not in msg:
                        msg = "      " + msg.replace(tag, f"{color}{tag}{self.RESET}")
                    else:
                        msg = msg.replace(tag, f"{color}{tag}{self.RESET}")
                else:
                    msg = msg.replace(tag, f"{color}{tag}{self.RESET}")
                break
                
        return msg

# Configure logging globally with our custom formatter
handler = logging.StreamHandler()
handler.setFormatter(TerminalColorsFormatter("%(message)s"))
logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)

# Silence noisy external libraries
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("google_genai").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

import asyncio
from contextlib import asynccontextmanager

from services.ai_rag_engine.app.pipeline.retrieval.retrieval_service import retrieval_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Eagerly initialize MongoDB connections so first user request doesn't suffer 30s delay
    await retrieval_service.warm_up_all()
    
    yield
    
    logger.info("🛑 Shutting down.")

app = FastAPI(title="Zad-AI RAG API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all versioned routes from the central router registry
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["health"])
def health_check():
    return {"status": "Zad-AI Engine is running"}

from fastapi.responses import HTMLResponse
import os

@app.get("/test", tags=["dev"], response_class=HTMLResponse)
def test_ui():
    """Serves the test_stream.html file directly to avoid CORS/file:// protocol issues."""
    html_path = os.path.join(os.path.dirname(__file__), "scripts", "test_stream.html")
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"<h1>Error loading UI: {e}</h1>"
