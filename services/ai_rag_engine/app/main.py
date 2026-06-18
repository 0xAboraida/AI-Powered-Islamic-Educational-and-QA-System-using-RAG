import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.ai_rag_engine.app.api.routes import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s"
)

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
