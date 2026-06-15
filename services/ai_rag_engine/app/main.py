import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.ai_rag_engine.app.api.routes import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s"
)

app = FastAPI(title="Zad-AI RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all versioned routes from the central router registry
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["health"])
def health_check():
    return {"status": "Zad-AI Engine is running"}
