import logging
from typing import List, Dict, Any, Optional

from .core.base import BaseFilter, BaseProcessor, BaseStorage, BaseCache
from ...models.embedding_models.base import EmbeddingModel

logger = logging.getLogger(__name__)

class EmbeddingPipeline:
    def __init__(
        self,
        filters: List[BaseFilter],
        processors: List[BaseProcessor],
        embedding_model: EmbeddingModel,
        storage_router: BaseStorage,
        cache: Optional[BaseCache] = None
    ):
        self.filters = filters
        self.processors = processors
        self.embedding_model = embedding_model
        self.storage_router = storage_router
        self.cache = cache

    def run(self, chunks: List[Dict[str, Any]]) -> None:
        processed_chunks = []
        child_chunks = []
        child_texts = []

        # =================================================
        # ========= FILTERING + PROCESSING =================
        # =================================================
        for chunk in chunks:
            passed_filters = True
            for filter_obj in self.filters:
                if not filter_obj.should_process(chunk):
                    passed_filters = False
                    break

            if not passed_filters:
                continue

            for processor in self.processors:
                chunk = processor.process(chunk)

            processed_chunks.append(chunk)

            if chunk.get("chunk_type") == "child":
                text = chunk.get("content", "")
                if text:
                    child_chunks.append(chunk)
                    child_texts.append(text)

        # =================================================
        # ================ BATCH EMBEDDING =================
        # =================================================
        if child_texts:
            logger.info(
                f"➡️ Generating embeddings for "
                f"💠 {len(child_texts)} child chunks..."
            )

            embedding_results = self.embedding_model.embed_documents(child_texts)

            for chunk, result in zip(child_chunks, embedding_results):
                chunk["embeddings"] = {
                    "dense": result.dense,
                    "sparse": result.sparse
                }

        # =================================================
        # ===================== STORAGE ====================
        # =================================================
        if processed_chunks:
            self.storage_router.store(processed_chunks)
