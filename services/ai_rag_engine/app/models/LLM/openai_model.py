import os
from typing import AsyncGenerator, Any
from langchain_core.messages import BaseMessage
from langchain_openai import ChatOpenAI
from services.ai_rag_engine.app.models.LLM.base import LLMModel
from services.ai_rag_engine.app.config.settings import settings

class OpenAILLMModel(LLMModel):
    """
    OpenAI Implementation of the LLMModel.
    Supports both native OpenAI API and Azure/GitHub Models inference endpoints.
    """

    def __init__(self):
        # We assume the name of the model is specified via settings
        model_name = settings.FALLBACK_MODEL_NAME
        api_key = settings.OPENAI_API_KEY
        
        # Determine base URL if using GitHub PAT for Azure Inference
        base_url = "https://models.inference.ai.azure.com" if api_key.startswith("github_pat") else None

        self._client = ChatOpenAI(
            api_key=api_key,
            model=model_name,
            temperature=settings.LLM_TEMPERATURE,
            base_url=base_url,
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
        Asynchronous generation (entire response at once).
        """
        response = await self._client.ainvoke(messages)
        return str(response.content)

    def stream(self, messages: list[Any]):
        """
        Synchronous streaming.
        """
        for chunk in self._client.stream(messages):
            yield chunk.content

    async def astream(self, messages: list[Any]) -> AsyncGenerator[str, None]:
        """
        Asynchronous streaming via native LangChain astream().
        """
        async for chunk in self._client.astream(messages):
            if chunk.content:
                yield str(chunk.content)
