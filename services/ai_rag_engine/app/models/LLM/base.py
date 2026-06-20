from abc import ABC, abstractmethod
from typing import AsyncGenerator, Any
from langchain_core.messages import BaseMessage

class LLMModel(ABC):
    """
    Abstract Base Class for LLM Models.
    Ensures all models (Gemini, OpenAI, etc.) expose the same interface.

    By defining `astream` here, LLMService is fully decoupled from any
    specific LLM provider (LangChain, OpenAI SDK, etc.).
    """

    @abstractmethod
    def get_client(self) -> Any:
        """
        Return the underlying Langchain or Native client.
        Used for advanced/direct access when needed.
        """
        pass

    @abstractmethod
    def astream(self, messages: list) -> AsyncGenerator[str, None]:
        """
        Stream tokens from the LLM asynchronously.

        Args:
            messages: List of LangChain BaseMessage objects (SystemMessage, HumanMessage, etc.)

        Yields:
            String content chunks as they arrive from the model.
        """
        pass
