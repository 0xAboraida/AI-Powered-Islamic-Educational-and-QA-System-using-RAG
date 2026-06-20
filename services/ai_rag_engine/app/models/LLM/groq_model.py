import logging
from typing import AsyncGenerator, Any

from .base import LLMModel
from langchain_groq import ChatGroq
from services.ai_rag_engine.app.config.settings import settings

logger = logging.getLogger(__name__)


class GroqLLMModel(LLMModel):
    """
    Groq implementation for LLM Generation using langchain_groq.
    Acts as a high-speed fallback when Gemini fails.
    """

    def __init__(self):
        super().__init__()
        
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY is missing in settings.")

        self._client = ChatGroq(
            api_key=api_key,
            model_name=settings.FALLBACK_MODEL_NAME,
            temperature=settings.LLM_TEMPERATURE,
            streaming=True
        )

    def get_client(self) -> Any:
        return self._client

    def generate(self, messages: list[Any]) -> str:
        """
        Synchronous generation.
        """
        response = self._client.invoke(messages)
        return str(response.content)

    async def agenerate(self, messages: list[Any]) -> str:
        """
        Asynchronous generation.
        """
        response = await self._client.ainvoke(messages)
        return str(response.content)

    def stream(self, messages: list[Any]):
        """
        Synchronous streaming.
        """
        for chunk in self._client.stream(messages):
            if chunk.content:
                yield str(chunk.content)

    async def astream(self, messages: list[Any]) -> AsyncGenerator[str, None]:
        """
        Asynchronous streaming via Server-Sent Events (SSE) chunks.
        """
        try:
            async for chunk in self._client.astream(messages):
                if chunk.content:
                    yield str(chunk.content)
        except Exception as e:
            logger.error(f"[GroqLLMModel] Streaming error: {e}")
            raise
