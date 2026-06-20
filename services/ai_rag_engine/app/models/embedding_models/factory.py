"""
factory.py
----------
The centralized creator for Embedding Models.

Flow:
    1. Model Request: Other services (like RetrievalService) ask for a specific embedding model using the `ModelType` enum.
    2. Initialization: The factory initializes the massive model (e.g., BGE-M3) and loads it into memory.
    3. Delivery: Returns the initialized model to be used for embedding queries or text.

Why a Factory?
    The Factory Pattern abstracts the complex initialization logic of these heavy AI models.
    If we decide to switch from BGE-M3 to a newer model tomorrow, we only change the enum 
    and this file, and the entire RAG pipeline automatically updates without breaking.
"""

from enum import Enum
from .base import EmbeddingModel
from .e5_model import E5EmbeddingModel
from .bge_m3_model import BGEM3EmbeddingModel

class ModelType(Enum):
    E5_MULTILINGUAL = "e5"
    BGE_M3 = "bge_m3"

def get_embedding_model(
    model_type: ModelType = ModelType.BGE_M3
) -> EmbeddingModel:
    if model_type == ModelType.E5_MULTILINGUAL:
        return E5EmbeddingModel()
    elif model_type == ModelType.BGE_M3:
        return BGEM3EmbeddingModel()
    else:
        raise ValueError(f"Unknown model type: {model_type}")
