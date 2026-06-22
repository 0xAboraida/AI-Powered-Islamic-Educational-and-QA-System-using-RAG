from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseFilter(ABC):
    """
    Abstract base class for filtering chunks before embedding.
    """
    
    @abstractmethod
    def should_process(self, chunk: Dict[str, Any]) -> bool:
        """
        Determines if a chunk should be processed based on its metadata.
        
        Args:
            chunk (Dict[str, Any]): The chunk document.
            
        Returns:
            bool: True if the chunk should be processed, False otherwise.
        """
        pass
