from dataclasses import dataclass
from typing import List, Dict, Optional
from abc import ABC, abstractmethod

@dataclass
class EmbeddingResult:
    dense: List[float]
    sparse: Optional[Dict[str, float]] = None

class EmbeddingModel(ABC):

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[EmbeddingResult]:
        pass

    @abstractmethod
    def embed_query(self, query: str) -> EmbeddingResult:
        pass

    @abstractmethod
    async def aembed_documents(self, texts: List[str]) -> List[EmbeddingResult]:
        pass

    @abstractmethod
    async def aembed_query(self, query: str) -> EmbeddingResult:
        pass
