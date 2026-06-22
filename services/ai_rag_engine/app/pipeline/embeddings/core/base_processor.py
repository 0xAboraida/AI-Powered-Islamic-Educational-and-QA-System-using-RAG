from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseProcessor(ABC):
    """
    Abstract base class for processing or mutating chunks before embedding.
    """
    
    @abstractmethod
    def process(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes the chunk (e.g., injecting metadata into content).
        
        Args:
            chunk (Dict[str, Any]): The chunk document.
            
        Returns:
            Dict[str, Any]: The processed chunk.
        """
        pass
