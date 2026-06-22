from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseCache(ABC):
    """
    Abstract base class for caching embeddings.
    """
    
    @abstractmethod
    def get(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves cached embeddings for the given text.
        
        Args:
            text (str): The text to hash and lookup.
            
        Returns:
            Optional[Dict[str, Any]]: A dictionary containing 'dense' and 'sparse' embeddings, or None.
        """
        pass
        
    @abstractmethod
    def set(self, text: str, embeddings: Dict[str, Any]) -> None:
        """
        Stores embeddings in the cache for the given text.
        
        Args:
            text (str): The text to hash and store.
            embeddings (Dict[str, Any]): A dictionary containing 'dense' and 'sparse' embeddings.
        """
        pass
