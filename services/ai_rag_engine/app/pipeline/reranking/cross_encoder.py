import logging
from typing import List, Optional
from FlagEmbedding import FlagReranker

from .base_reranker import BaseReranker
from services.ai_rag_engine.app.pipeline.retrieval.parent_child import RetrievedParent

logger = logging.getLogger(__name__)

class CrossEncoderReranker(BaseReranker):
    """
    Reranks documents using a Cross-Encoder model.
    A Cross-Encoder takes (query, document) pairs and outputs a relevance score.
    It is much more accurate than Bi-Encoders (Dense retrieval) but slower, 
    which is why we only run it on the top-k results from the initial retrieval.
    """

    def __init__(self, model_name: str = "BAAI/bge-reranker-v2-m3", use_fp16: bool = True):
        """
        Initializes the Cross-Encoder.
        Recommended model for Arabic/Multilingual: 'BAAI/bge-reranker-v2-m3'
        """
        logger.info(f"Loading Cross-Encoder Reranker model: {model_name}...")
        self.reranker = FlagReranker(model_name, use_fp16=use_fp16)
        logger.info("Cross-Encoder loaded successfully.")

    def rerank(
        self, 
        query: str, 
        documents: List[RetrievedParent], 
        top_k: Optional[int] = 10
    ) -> List[RetrievedParent]:
        """
        Reranks the given parents using the Cross-Encoder.
        """
        if not documents:
            return []

        logger.info(f"[CrossEncoder] Reranking {len(documents)} documents...")

        # Prepare pairs: (query, text)
        pairs = [[query, doc.content] for doc in documents]

        # Compute scores
        # compute_score returns a list of floats (or a single float if 1 pair)
        scores = self.reranker.compute_score(pairs)
        
        # If there's only one document, FlagReranker returns a float instead of a list
        if isinstance(scores, float):
            scores = [scores]

        # Update the scores in the document objects
        for doc, score in zip(documents, scores):
            # We override the best_child_score with the new Cross-Encoder score
            # Or we could create a new field, but overriding is fine for sorting
            doc.best_child_score = float(score)

        # Sort documents by the new score descending
        documents.sort(key=lambda d: d.best_child_score, reverse=True)

        if top_k is not None:
            documents = documents[:top_k]

        logger.info(f"[CrossEncoder] Returning top {len(documents)} reranked documents.")
        return documents
