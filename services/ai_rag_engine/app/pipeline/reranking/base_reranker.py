from abc import ABC, abstractmethod
from typing import List, Optional
from services.ai_rag_engine.app.pipeline.retrieval.parent_child import RetrievedParent

class BaseReranker(ABC):
    """
    Abstract base class for all document rerankers.
    Takes a list of retrieved documents and a query, and re-orders them 
    based on a more computationally expensive relevance scoring mechanism 
    (like a Cross-Encoder or LLM-as-a-judge).
    """

    @abstractmethod
    def rerank(
        self, 
        query: str, 
        documents: List[RetrievedParent], 
        top_k: Optional[int] = None
    ) -> List[RetrievedParent]:
        """
        Rerank a list of retrieved documents based on their relevance to the query.

        Args:
            query: The user's original query.
            documents: List of RetrievedParent documents fetched from MongoDB.
            top_k: Number of top documents to return after reranking. If None, returns all.

        Returns:
            A new list of RetrievedParent objects sorted by the new relevance score descending.
        """
        pass
