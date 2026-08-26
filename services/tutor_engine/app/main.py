from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.infrastructure.database import connect_to_mongo, close_mongo_connection
from app.api import admin_routes, library_routes, tutor_routes, ui_routes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(title="Zad Tutor Engine", version="1.0.0", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok", "service": "Zad Tutor Engine", "docs": "/docs", "health": "/health"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "tutor_engine"}

# Include Routers
app.include_router(admin_routes.router)
app.include_router(library_routes.router)
app.include_router(tutor_routes.router)
app.include_router(ui_routes.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
