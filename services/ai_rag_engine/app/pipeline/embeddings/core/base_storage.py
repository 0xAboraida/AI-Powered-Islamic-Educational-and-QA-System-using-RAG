from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseStorage(ABC):
    """
    Abstract base class for storing chunks and their embeddings.
    """
    
    @abstractmethod
    def store(self, chunks: List[Dict[str, Any]]) -> None:
        """
        Stores a batch of chunks into the appropriate backend (e.g., Qdrant, MongoDB).
        
        Args:
            chunks (List[Dict[str, Any]]): The list of fully processed chunk documents.
        """
        pass
