from typing import AsyncGenerator
from langchain_google_genai import ChatGoogleGenerativeAI
from services.ai_rag_engine.app.config.settings import settings
from .base import LLMModel

class GeminiLLMModel(LLMModel):
    """
    Implementation of LLMModel for Google Gemini using Langchain.
    """
    def __init__(self, api_key: str):
        self._client = ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL_NAME,
            google_api_key=api_key,
            streaming=True,
            temperature=settings.LLM_TEMPERATURE,
            max_retries=0,
        )

    def get_client(self) -> ChatGoogleGenerativeAI:
        return self._client

    async def astream(self, messages: list) -> AsyncGenerator[str, None]:
        """Streams tokens from Gemini via LangChain's sync stream interface in a thread to bypass astream bugs."""
        import asyncio
        import queue
        from concurrent.futures import ThreadPoolExecutor

        q = queue.Queue()
        sentinel = object()

        def run_stream():
            try:
                for chunk in self._client.stream(messages):
                    if chunk.content:
                        q.put(chunk.content)
            except Exception as e:
                q.put(e)
            finally:
                q.put(sentinel)

        loop = asyncio.get_running_loop()
        executor = ThreadPoolExecutor(max_workers=1)
        # Start the synchronous stream in a background thread
        future = loop.run_in_executor(executor, run_stream)

        # Yield from the queue asynchronously
        while True:
            # We use run_in_executor to avoid blocking the event loop while waiting for the queue
            item = await loop.run_in_executor(None, q.get)
            if item is sentinel:
                break
            if isinstance(item, Exception):
                raise item
            yield item
