from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod

class BaseStorage(ABC):
    @abstractmethod
    def store(self, chunks: List[Dict[str, Any]]) -> None:
        pass

class BaseProcessor(ABC):
    @abstractmethod
    def process(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        pass

class BaseFilter(ABC):
    @abstractmethod
    def should_process(self, chunk: Dict[str, Any]) -> bool:
        pass

class BaseCache(ABC):
    @abstractmethod
    def get(self, text: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def set(self, text: str, embeddings: Dict[str, Any]) -> None:
        pass
