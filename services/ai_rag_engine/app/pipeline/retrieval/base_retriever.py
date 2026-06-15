from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class RetrievedChunk:
    """
    Represents a single retrieved document chunk with its score and metadata.
    """

    def __init__(
        self,
        chunk_id: str,
        score: float,
        content: str,
        metadata: Dict[str, Any],
        parent_id: Optional[str] = None,
    ):
        self.chunk_id = chunk_id
        self.score = score
        self.content = content
        self.metadata = metadata
        self.parent_id = parent_id

    def __repr__(self) -> str:
        return (
            f"RetrievedChunk(id={self.chunk_id!r}, "
            f"score={self.score:.4f}, "
            f"domain={self.metadata.get('domain', 'N/A')!r})"
        )


class BaseRetriever(ABC):
    """
    Abstract base class for all retrievers.

    Every concrete retriever (Dense, Sparse, Hybrid, etc.) must
    implement the `retrieve` method with this exact signature so they
    can be swapped interchangeably inside the RAG pipeline.
    """

    @abstractmethod
    def retrieve(
        self,
        query: str,
        collection_name: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedChunk]:
        """
        Retrieve the top-k most relevant chunks for the given query.

        Args:
            query:           The raw user query (Arabic text).
            collection_name: The Qdrant collection to search in.
            top_k:           Number of results to return.
            filters:         Optional metadata filters, e.g.:
                             {"domain": "fiqh", "madhhab": "shafii"}

        Returns:
            A list of RetrievedChunk objects sorted by relevance score
            (highest first).
        """
        ...
