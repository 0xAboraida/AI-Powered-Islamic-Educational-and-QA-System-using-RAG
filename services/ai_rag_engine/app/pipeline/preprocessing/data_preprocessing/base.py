from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseCleaner(ABC):
    """Abstract base class for all text cleaners."""
    
    @abstractmethod
    def clean(self, text: str) -> str:
        """
        Cleans and normalizes the input text.
        
        Args:
            text (str): The raw input text.
            
        Returns:
            str: The cleaned and normalized text.
        """
        pass

class BaseChunker(ABC):
    """Abstract base class for chunking documents."""
    
    @abstractmethod
    def chunk(self, document: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Splits a document into smaller chunks.
        
        Args:
            document (Dict[str, Any]): The document data.
            
        Returns:
            List[Dict[str, Any]]: A list of chunk dictionaries.
        """
        pass

class BaseEntityLinker(ABC):
    """Abstract base class for linking entities like Ayahs and Hadiths."""
    
    @abstractmethod
    def link(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        """
        Identifies and links entities within a chunk.
        
        Args:
            chunk (Dict[str, Any]): The chunk data.
            
        Returns:
            Dict[str, Any]: The chunk data enriched with linked entities.
        """
        pass
