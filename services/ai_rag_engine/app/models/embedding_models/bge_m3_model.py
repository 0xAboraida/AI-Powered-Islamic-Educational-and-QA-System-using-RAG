import os
import logging
import asyncio
from typing import List
from .base import EmbeddingModel, EmbeddingResult

logger = logging.getLogger(__name__)

class BGEM3EmbeddingModel(EmbeddingModel):

    def __init__(self, model_name="BAAI/bge-m3"):
        try:
            from FlagEmbedding import BGEM3FlagModel
            logger.info("Loading local BGE-M3 model...")
            self.model = BGEM3FlagModel(model_name, use_fp16=False)
            logger.info("Local BGE-M3 model loaded successfully.")
        except ImportError:
            logger.error("FlagEmbedding is not installed. Please install it using 'pip install FlagEmbedding'")
            raise

    def embed_documents(
        self,
        texts: List[str]
    ) -> List[EmbeddingResult]:
        output = self.model.encode(
            texts,
            return_dense=True,
            return_sparse=True,
            return_colbert_vecs=False,
            batch_size=len(texts)
        )
        results = []
        for dense, sparse in zip(
            output['dense_vecs'].tolist(),
            output['lexical_weights']
        ):
            results.append(
                EmbeddingResult(
                    dense=dense,
                    sparse=sparse
                )
            )
        return results

    def embed_query(self, query: str) -> EmbeddingResult:
        output = self.model.encode(
            [query],
            return_dense=True,
            return_sparse=True,
            return_colbert_vecs=False
        )
        return EmbeddingResult(
            dense=output['dense_vecs'][0].tolist(),
            sparse=output['lexical_weights'][0]
        )

    async def aembed_documents(self, texts: List[str]) -> List[EmbeddingResult]:
        import time
        start_t = time.time()
        
        results = await asyncio.to_thread(self.embed_documents, texts)
        logger.info(f"[⏱️ TIMER] Local BGE-M3 (aembed_documents) took: {time.time() - start_t:.2f} seconds")
        return results

    async def aembed_query(self, query: str) -> EmbeddingResult:
        import time
        start_t = time.time()
        
        result = await asyncio.to_thread(self.embed_query, query)
        logger.info(f"[⏱️ TIMER] Local BGE-M3 (aembed_query) took: {time.time() - start_t:.2f} seconds")
        return result
