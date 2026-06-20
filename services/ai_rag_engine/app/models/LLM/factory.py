from enum import Enum
from .base import LLMModel
from .gemini_model import GeminiLLMModel
from .groq_model import GroqLLMModel

class ModelType(Enum):
    GEMINI = "gemini"
    GROQ = "groq"
    OPENAI = "openai"
    # OPENAI = "openai"  # Future support

def get_llm_model(
    model_type: ModelType = ModelType.GEMINI,
    api_key: str = None
) -> LLMModel:
    """
    Factory method to retrieve the appropriate LLM model instance.
    """
    if model_type == ModelType.GEMINI:
        from services.ai_rag_engine.app.config.key_manager import gemini_key_manager
        key_to_use = api_key if api_key else gemini_key_manager.get_next_key()
        return GeminiLLMModel(api_key=key_to_use)
    elif model_type == ModelType.GROQ:
        return GroqLLMModel()
    elif model_type == ModelType.OPENAI:
        from .openai_model import OpenAILLMModel
        return OpenAILLMModel()
    else:
        raise ValueError(f"Unknown LLM model type: {model_type}")
