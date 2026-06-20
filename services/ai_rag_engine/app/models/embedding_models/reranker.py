"""
reranker.py
-----------
Re-evaluates and re-sorts the retrieved child chunks using an advanced cross-encoder model.

Flow:
    1. Initialization: Loads the `FlagReranker` model into CPU memory at startup if enabled.
    2. Input Pairing: Takes the user query and the top-N retrieved chunks (from Hybrid Search).
    3. Cross-Encoding: Feeds the `[query, chunk_text]` pairs into the reranker to calculate a highly accurate semantic score.
    4. Sorting: Replaces the fast Qdrant/RRF scores with the new precise scores, sorts them, and returns the absolute top-K.

Why a Reranker?
    Fast vector search (Dense/Sparse) is great at finding hundreds of *potentially* relevant texts quickly. 
    However, cross-encoders (Rerankers) are much slower but much smarter because they analyze the query 
    and the text together in the same neural network layer. The Reranker acts as a fine-tooth comb 
    to guarantee that only the most strictly relevant chunks are sent to the LLM.
"""

import logging
import time
import asyncio
from typing import List, Tuple
from services.ai_rag_engine.app.config.settings import settings
from services.ai_rag_engine.app.pipeline.retrieval.base_retriever import RetrievedChunk

logger = logging.getLogger(__name__)

class RerankerService:
    def __init__(self):
        self.enabled = settings.USE_RERANKER
        self.model_name = settings.RERANKER_MODEL_NAME
        self.top_k = settings.RAG_RERANKER_TOP_K
        self.reranker = None

        if self.enabled:
            try:
                from FlagEmbedding import FlagReranker
                logger.info(f"Loading local Reranker model: {self.model_name}...")
                start_t = time.time()
                # Initialize reranker with use_fp16=False for CPU speed
                self.reranker = FlagReranker(self.model_name, use_fp16=False)
                logger.info(f"Reranker loaded successfully in {time.time() - start_t:.2f} seconds.")
            except ImportError:
                logger.error("FlagEmbedding is not installed! Reranker disabled.")
                self.enabled = False
            except Exception as e:
                logger.error(f"Failed to load Reranker {self.model_name}: {e}")
                self.enabled = False
        else:
            logger.info("Reranker is disabled in settings.")

    def rerank(self, query: str, chunks: List[RetrievedChunk]) -> List[RetrievedChunk]:
        """Synchronous reranking"""
        if not self.enabled or not self.reranker or not chunks:
            return chunks[:self.top_k]

        start_t = time.time()
        
        # Prepare pairs for the reranker: [ [query, chunk1], [query, chunk2], ... ]
        sentence_pairs = [[query, chunk.content] for chunk in chunks]
        
        # Compute scores
        scores = self.reranker.compute_score(sentence_pairs)
        
        # FlagReranker might return a single float if there's only 1 pair
        if isinstance(scores, float):
            scores = [scores]
            
        # Assign scores to chunks and sort
        for chunk, score in zip(chunks, scores):
            chunk.score = score # Overwrite the fusion score with the highly accurate Reranker score
            
        # Sort chunks by the new score in descending order
        reranked_chunks = sorted(chunks, key=lambda x: x.score, reverse=True)
        
        # Take the top K
        final_chunks = reranked_chunks[:self.top_k]
        
        logger.info(f"[Reranker] Scored {len(chunks)} chunks and selected top {self.top_k} in {time.time() - start_t:.2f} seconds.")
        return final_chunks

    async def arerank(self, query: str, chunks: List[RetrievedChunk]) -> List[RetrievedChunk]:
        """Asynchronous wrapper for reranking"""
        if not self.enabled or not self.reranker or not chunks:
            # If disabled or no chunks, just return the original top_k slice
            return chunks[:self.top_k]
            
        # Run the CPU-heavy reranking in a thread pool to avoid blocking the event loop
        return await asyncio.to_thread(self.rerank, query, chunks)

# Singleton instance
reranker_service = RerankerService()
