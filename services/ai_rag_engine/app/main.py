import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.ai_rag_engine.app.api.v1.endpoints import chat

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

app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])

@app.get("/")
def health_check():
    return {"status": "Zad-AI Engine is running"}
