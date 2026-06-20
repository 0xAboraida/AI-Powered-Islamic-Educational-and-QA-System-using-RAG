"""
e5_model.py
-----------
Embedding model wrapper for the multilingual-E5 (intfloat/multilingual-e5-base) model.

Status: EXPERIMENTAL — not used in the active pipeline.
    The production pipeline uses BGE-M3 (bge_m3_model.py) which supports both
    dense AND sparse vectors required for Hybrid Search.

    E5 is a dense-only model and would require a different retrieval strategy
    (no Sparse/BM42 search). Keep this for future experimentation or comparison.

    To switch: change ModelType in RetrievalService to ModelType.E5 and update
    the Qdrant collection vector configuration accordingly.
"""

from typing import List
from sentence_transformers import SentenceTransformer
from .base import EmbeddingModel, EmbeddingResult

class E5EmbeddingModel(EmbeddingModel):

    def __init__(self, model_name="intfloat/multilingual-e5-base"):
        self.model = SentenceTransformer(model_name)

    def embed_documents(self, texts: List[str]) -> List[EmbeddingResult]:
        texts = [f"passage: {t}" for t in texts]

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=True
        ).tolist()

        return [
            EmbeddingResult(dense=emb)
            for emb in embeddings
        ]

    def embed_query(self, query: str) -> EmbeddingResult:
        query = f"query: {query}"

        embedding = self.model.encode(
            query,
            normalize_embeddings=True,
            show_progress_bar=False
        ).tolist()

        return EmbeddingResult(dense=embedding)

    async def aembed_documents(self, texts: List[str]) -> List[EmbeddingResult]:
        import asyncio
        return await asyncio.to_thread(self.embed_documents, texts)

    async def aembed_query(self, query: str) -> EmbeddingResult:
        import asyncio
        return await asyncio.to_thread(self.embed_query, query)
