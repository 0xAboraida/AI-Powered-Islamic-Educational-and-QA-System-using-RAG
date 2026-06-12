MONGO_URI_FIQH_HANBALI_HANAFI_CLUSTER1 = "mongodb+srv://aboraidaahmed_db_user:2wX62vgs5CrsBUkv@zad-rag-cluster.nv8rp1b.mongodb.net/?appName=zad-rag-cluster"
MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2 = "mongodb+srv://shafii_maliki_db:bpx6dQrX9aNosuCk@zad-rag-cluster2.tfdsgpc.mongodb.net/?appName=zad-rag-cluster2"
QDRANT_URL = "https://9455bfe8-df54-49c1-8b09-f5c17b3ff5f3.sa-east-1-0.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwiZXhwIjoxNzk0ODA2MTI3LCJzdWJqZWN0IjoiYXBpLWtleTo4ZTUxOWNiZi1lMzIxLTRkODMtYmI5My00MzJhMTBlOTE1ZDIifQ.M03UW5DbK0AuSTy2jwgfudS-xZog-V48Sd_HXI6IZFU"
CURRENT_MONGO = MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2

# !pip install -U pymongo certifi dnspython

# !pip uninstall -y pymongo
# !pip install "pymongo[srv]==4.13.0" dnspython certifi

# import os
# os.kill(os.getpid(), 9)

# !pip install pymongo qdrant-client redis FlagEmbedding sentence_transformers


# =========================================================
# ====================== IMPORTS ===========================
# =========================================================

import os
import json
import uuid
import logging

from pathlib import Path
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor

# 
from typing import (
    List,
    Dict,
    Any,
    Optional
)

import certifi

# MongoDB Atlas
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

# Qdrant
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Models
from sentence_transformers import SentenceTransformer
from FlagEmbedding import BGEM3FlagModel

from abc import ABC, abstractmethod
from enum import Enum

# =========================================================
# ======================= LOGGING ==========================
# =========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)

# =========================================================
# ====================== BASE CLASSES ======================
# =========================================================

class BaseStorage(ABC):

    @abstractmethod
    def store(self, chunks: List[Dict[str, Any]]) -> None:
        pass


class BaseProcessor(ABC):

    @abstractmethod
    def process(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        pass


class BaseFilter(ABC):

    @abstractmethod
    def should_process(self, chunk: Dict[str, Any]) -> bool:
        pass


class BaseCache(ABC):

    @abstractmethod
    def get(self, text: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def set(self, text: str, embeddings: Dict[str, Any]) -> None:
        pass


# =========================================================
# ================= EMBEDDING STRUCTURES ===================
# =========================================================

@dataclass
class EmbeddingResult:
    dense: List[float]
    sparse: Optional[Dict[str, float]] = None


class EmbeddingModel(ABC):

    @abstractmethod
    def embed_documents(self, texts: List[str]) -> List[EmbeddingResult]:
        pass

    @abstractmethod
    def embed_query(self, query: str) -> EmbeddingResult:
        pass


# =========================================================
# ===================== EMBEDDING MODELS ===================
# =========================================================

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


class BGEM3EmbeddingModel(EmbeddingModel):

    def __init__(self, model_name="BAAI/bge-m3"):

        logger.info("Loading BGE-M3 model...")

        self.model = BGEM3FlagModel(
            model_name,
            use_fp16=True
        )

        logger.info("BGE-M3 model loaded successfully.")

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


# =========================================================
# ===================== MODEL FACTORY ======================
# =========================================================

class ModelType(Enum):
    E5_MULTILINGUAL = "e5"
    BGE_M3 = "bge_m3"


def get_embedding_model(
    model_type: ModelType = ModelType.BGE_M3
) -> EmbeddingModel:

    if model_type == ModelType.E5_MULTILINGUAL:
        return E5EmbeddingModel()

    elif model_type == ModelType.BGE_M3:
        return BGEM3EmbeddingModel()

    else:
        raise ValueError(f"Unknown model type: {model_type}")


# =========================================================
# ======================== FILTERS =========================
# =========================================================

class MetadataFilter(BaseFilter):

    def __init__(self, target_domain: str):
        self.target_domain = target_domain

    def should_process(self, chunk: Dict[str, Any]) -> bool:

        metadata = chunk.get("metadata", {})
        domain = metadata.get("domain", "")

        return domain == self.target_domain

# =========================================================
# ======================= PROCESSORS =======================
# =========================================================

class HierarchyInjector(BaseProcessor):

    def process(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        if chunk.get("chunk_type") != "child":
            return chunk  #  return parent as-is, clean
        metadata = chunk.get('metadata', {})

        book_title = metadata.get('book_title', '')
        hijri_century = metadata.get('hijri_century', '')
        madhhab = metadata.get('madhhab', '')

        hierarchy = metadata.get('hierarchy', {})

        kitab = hierarchy.get('kitab', '')
        sections = hierarchy.get('sections', [])

        injection_parts = []

        if book_title:
            injection_parts.append(f"الكتاب: {book_title}")

        if madhhab:
            injection_parts.append(f"المذهب: {madhhab}")

        if hijri_century:
            injection_parts.append(f"القرن الهجري: {hijri_century}")

        if kitab:
            injection_parts.append(f"الموضوع: {kitab}")

        if sections:
            sections_str = " > ".join(sections)
            injection_parts.append(f"المسار: {sections_str}")

        if injection_parts:

            prefix = " | ".join(injection_parts)

            original_content = chunk.get('content', '')

            chunk['content'] = (
                f"السياق: [{prefix}]\n\n"
                f"النص: {original_content}"
            )

        return chunk

# =========================================================
# ====================== QDRANT MANAGER ===================
# =========================================================

class QdrantManager:

    def __init__(
        self,
        url: str,
        api_key: str
    ):

        self.client = QdrantClient(
            url=url,
            api_key=api_key,
            timeout=300
        )

        logger.info("Connected to Qdrant Cloud.")

    def initialize_collection(
        self,
        collection_name: str,
        dense_dim: int = 1024
    ):

        if self.client.collection_exists(collection_name):

            logger.info(
                f"Collection '{collection_name}' already exists."
            )

            # IMPORTANT:
            # Ensure indices exist even if collection already exists
            self._setup_payload_indices(collection_name)

            return

        logger.info(
            f"Creating collection '{collection_name}'..."
        )

        self.client.create_collection(
            collection_name=collection_name,

            vectors_config={
                "dense": models.VectorParams(
                    size=dense_dim,
                    distance=models.Distance.COSINE
                )
            },

            sparse_vectors_config={
                "sparse": models.SparseVectorParams(
                    index=models.SparseIndexParams(
                        on_disk=False
                    )
                )
            }
        )

        # Create payload indices
        self._setup_payload_indices(collection_name)

        logger.info(
            f"Collection '{collection_name}' created successfully."
        )

    def upsert_points(
        self,
        collection_name: str,
        points: List[models.PointStruct]
    ):

        logger.info(
            f"Uploading {len(points)} points to Qdrant..."
        )

        self.client.upsert(
            collection_name=collection_name,
            points=points
        )

        logger.info(
            f"Successfully uploaded {len(points)} points."
        )

    def _setup_payload_indices(
        self,
        collection_name: str
    ) -> None:
        """
        Sets up payload indexing for fast metadata filtering.
        """

        logger.info(
            f"Setting up payload indices for '{collection_name}'..."
        )

        indices_to_create = [

            # Core retrieval filters
            ("metadata.domain", models.PayloadSchemaType.KEYWORD),
            ("metadata.madhhab", models.PayloadSchemaType.KEYWORD),
            ("metadata.book_title", models.PayloadSchemaType.KEYWORD),
            ("metadata.author", models.PayloadSchemaType.KEYWORD),

            # IDs
            ("parent_id", models.PayloadSchemaType.KEYWORD),
            ("chunk_id", models.PayloadSchemaType.KEYWORD),

            # Optional hierarchy filtering
            ("metadata.hierarchy.kitab", models.PayloadSchemaType.KEYWORD),
            ("metadata.hierarchy.sections", models.PayloadSchemaType.KEYWORD),
        ]

        for field_name, schema_type in indices_to_create:

            try:

                self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field_name,
                    field_schema=schema_type,
                )

                logger.info(
                    f"Payload index created for '{field_name}'."
                )

            except Exception as e:

                logger.warning(
                    f"Could not create payload index for "
                    f"'{field_name}': {e}"
                )

# =========================================================
# ====================== MONGO MANAGER =====================
# =========================================================

class MongoManager:

    def __init__(
        self,
        uri: str,
        db_name: str
    ):

        self.uri = uri
        self.db_name = db_name

        self.client = None
        self.db = None

        self.connect()

    def connect(self):

        try:

            self.client = MongoClient(
                self.uri,
                tls=True,
                tlsAllowInvalidCertificates=True,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=60000,
            )

            self.client.admin.command("ping")

            self.db = self.client[self.db_name]

            logger.info(
                f"✅ Connected to MongoDB DB: {self.db_name}"
            )

        except ConnectionFailure as e:

            logger.error(f"❌ MongoDB connection failed: {e}")
            raise

    def insert_documents(
        self,
        collection_name: str,
        documents: List[Dict[str, Any]]
    ):

        if not documents:
            return

        collection = self.db[collection_name]

        for doc in documents:

            if 'chunk_id' in doc and '_id' not in doc:
                doc['_id'] = doc['chunk_id']

        try:

            collection.insert_many(
                documents,
                ordered=False
            )

            logger.info(
                f"🟣 Inserted {len(documents)} parent chunks "
                f"🟢 into MongoDB."
            )

        except Exception as e:

            logger.warning(
                f"❌ MongoDB insert warning/error: {e}"
            )

    def close(self):

        if self.client:
            self.client.close()
            logger.info("🟢 MongoDB connection closed.")



# =========================================================
# =================== STORAGE ROUTER =======================
# =========================================================

class DualStorageRouter(BaseStorage):

    def __init__(
        self,
        qdrant_manager: QdrantManager,
        mongo_manager: MongoManager,
        qdrant_collection: str,
        mongo_collection: str
    ):

        self.qdrant_manager = qdrant_manager

        self.mongo_manager = mongo_manager

        self.qdrant_collection = qdrant_collection

        self.mongo_collection = mongo_collection

    def store(
        self,
        chunks: List[Dict[str, Any]]
    ) -> None:

        child_chunks = []
        parent_chunks = []

        for chunk in chunks:

            if chunk.get("chunk_type") == "child":
                child_chunks.append(chunk)

            elif chunk.get("chunk_type") == "parent":
                parent_chunks.append(chunk)

        with ThreadPoolExecutor(max_workers=2) as executor:

            futures = []
        
            if child_chunks:
                futures.append(
                    executor.submit(
                        self._store_in_qdrant,
                        child_chunks
                    )
                )
        
            if parent_chunks:
                futures.append(
                    executor.submit(
                        self._store_in_mongo,
                        parent_chunks
                    )
                )
        
            # IMPORTANT:
            # Wait for all threads and raise exceptions
            for future in futures:
                future.result()

    def _store_in_qdrant(
        self,
        chunks: List[Dict[str, Any]]
    ):

        points = []

        for chunk in chunks:

            payload = {
                k: v
                for k, v in chunk.items()
                if k != "embeddings"
            }

            embeddings = chunk.get("embeddings", {})

            dense_vector = embeddings.get("dense")

            sparse_vector = embeddings.get("sparse")

            point = models.PointStruct(

                id=str(
                    uuid.uuid5(
                        uuid.NAMESPACE_DNS,
                        chunk["chunk_id"]
                    )
                ),

                payload=payload,

                vector={
                    "dense": dense_vector,

                    "sparse": (
                        models.SparseVector(
                            indices=[
                                int(k)
                                for k in sparse_vector.keys()
                            ],
                            values=list(
                                sparse_vector.values()
                            )
                        )
                        if sparse_vector else None
                    )
                }
            )

            points.append(point)

        try:

            self.qdrant_manager.upsert_points(
                collection_name=self.qdrant_collection,
                points=points
            )

        except Exception as e:

            logger.error(
                f"Qdrant upload failed: {e}"
            )

    def _store_in_mongo(
        self,
        chunks: List[Dict[str, Any]]
    ):

        self.mongo_manager.insert_documents(
            self.mongo_collection,
            chunks
        )

# =========================================================
# ==================== EMBEDDING PIPELINE ==================
# =========================================================

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

    def run(
        self,
        chunks: List[Dict[str, Any]]
    ) -> None:

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
                f"Generating embeddings for "
                f"{len(child_texts)} child chunks..."
            )

            embedding_results = (
                self.embedding_model.embed_documents(
                    child_texts
                )
            )

            for chunk, result in zip(
                child_chunks,
                embedding_results
            ):

                chunk["embeddings"] = {
                    "dense": result.dense,
                    "sparse": result.sparse
                }

        # =================================================
        # ===================== STORAGE ====================
        # =================================================

        if processed_chunks:

            self.storage_router.store(
                processed_chunks
            )


# =========================================================
# ========================== MAIN ==========================
# =========================================================

def run():

    logger.info("=" * 70)
    logger.info("Starting ingestion pipeline...")
    logger.info("=" * 70)

    # =====================================================
    # ====================== CONFIG ========================
    # =====================================================

    BOOKS_PATH = (
        "/kaggle/input/datasets/"
        "ahmedaboraida/fiqh-shafii"
    )

    QDRANT_COLLECTION = (
        "zad_sharia_collection_childs"
    )

    MONGO_DB_NAME = "zad_rag_db_shafii_maliki"

    MONGO_COLLECTION = (
        "parents_shafii"
    )

    USE_EXISTING_MONGO_CLUSTER = False

    NEW_MONGO_URI = CURRENT_MONGO

    EMBED_BATCH_SIZE = 256

    # =====================================================
    # ================= INITIALIZATION =====================
    # =====================================================

    metadata_filter = MetadataFilter(
        target_domain="فقه"
    )

    hierarchy_injector = HierarchyInjector()

    bge_m3_model = get_embedding_model(
        ModelType.BGE_M3
    )

    qdrant_manager = QdrantManager(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY
    )

    qdrant_manager.initialize_collection(
        collection_name=QDRANT_COLLECTION,
        dense_dim=1024
    )

    mongo_uri = (
        CURRENT_MONGO
        if USE_EXISTING_MONGO_CLUSTER
        else NEW_MONGO_URI
    )

    mongo_manager = MongoManager(
        uri=mongo_uri,
        db_name=MONGO_DB_NAME
    )

    storage_router = DualStorageRouter(
        qdrant_manager=qdrant_manager,
        mongo_manager=mongo_manager,
        qdrant_collection=QDRANT_COLLECTION,
        mongo_collection=MONGO_COLLECTION
    )

    pipeline = EmbeddingPipeline(
        filters=[metadata_filter],
        processors=[hierarchy_injector],
        embedding_model=bge_m3_model,
        storage_router=storage_router
    )

    # =====================================================
    # ==================== LOAD BOOKS ======================
    # =====================================================

    root_dir = Path(BOOKS_PATH)

    all_books = sorted(
        root_dir.rglob("*_chunks.json")
    )

    logger.info(
        f"Found {len(all_books)} books."
    )

    # =====================================================
    # ================= PROCESS BOOKS ======================
    # =====================================================

    for book_idx, json_path in enumerate(
        all_books,
        start=1
    ):

        logger.info("=" * 70)

        logger.info(
            f"BOOK {book_idx}/{len(all_books)}"
        )

        logger.info(
            f"Current Book: {json_path.name}"
        )

        logger.info("=" * 70)

        try:

            with open(
                json_path,
                "r",
                encoding="utf-8"
            ) as f:

                chunks = json.load(f)

            logger.info(
                f"Loaded {len(chunks)} chunks."
            )

            total_batches = (
                len(chunks) + EMBED_BATCH_SIZE - 1
            ) // EMBED_BATCH_SIZE

            for i in range(
                0,
                len(chunks),
                EMBED_BATCH_SIZE
            ):

                batch = chunks[
                    i:i + EMBED_BATCH_SIZE
                ]

                current_batch = (
                    i // EMBED_BATCH_SIZE
                ) + 1

                start_chunk = i + 1

                end_chunk = min(
                    i + EMBED_BATCH_SIZE,
                    len(chunks)
                )

                logger.info(
                    f"🟢 [BOOK {book_idx}] "
                    f"🔸 [BATCH {current_batch}/{total_batches}] "
                    f"♻️ Chunks {start_chunk} -> {end_chunk}"
                )

                pipeline.run(batch)

            logger.info(
                f"✅ Finished book: {json_path.name}"
            )

        except Exception as e:

            logger.error(
                f"❌ Failed processing "
                f"{json_path.name}"
            )

            logger.error(str(e))

            continue

    logger.info("=" * 70)
    logger.info("INGESTION COMPLETE")
    logger.info("=" * 70)

    mongo_manager.close()



# =========================================================
# ========================= START ==========================
# =========================================================

if __name__ == "__main__":
    run()

# from pymongo import MongoClient

# # uri1 = "mongodb+srv://aboraidaahmed_db_user:2wX62vgs5CrsBUkv@zad-rag-cluster.nv8rp1b.mongodb.net/?appName=zad-rag-cluster"
# # uri2 = "mongodb+srv://shafii_maliki_db:bpx6dQrX9aNosuCk@zad-rag-cluster2.tfdsgpc.mongodb.net/?appName=zad-rag-cluster2"
# uri2 = (
#     "mongodb+srv://shafii_maliki_db:bpx6dQrX9aNosuCk"
#     "@zad-rag-cluster2.tfdsgpc.mongodb.net/"
#     "?retryWrites=true&w=majority"
#     "&tls=true"
#     "&tlsAllowInvalidCertificates=true"
#     "&appName=zad-rag-cluster2"
# )
# client = MongoClient(
#     uri2,
#     serverSelectionTimeoutMS=60000
# )
# print(client.admin.command("ping"))

from pathlib import Path
import json

ROOT = Path("/kaggle/input/datasets/ahmedaboraida/fiqh-shafii")

child_count = 0

for file in ROOT.rglob("*.json"):
    try:
        with open(file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # لو الملف List من الـ chunks
        if isinstance(data, list):
            child_count += sum(
                1
                for item in data
                if isinstance(item, dict)
                and item.get("chunk_type") == "parent"
            )

        # لو الملف Object واحد
        elif isinstance(data, dict):
            if data.get("chunk_type") == "parent":
                child_count += 1

    except Exception as e:
        print(f"Skipped {file}: {e}")

print(f"Total child chunks: {child_count}")

from pymongo import MongoClient
import certifi

# =========================
# Mongo Connection
# =========================

client = MongoClient(
    MONGO_URI_FIQH_SHAFII_MALIKI_CLUSTER2,
    tls=True,
    tlsCAFile=certifi.where()
)

db = client["zad_rag_db_shafii_maliki"]

collection = db["parents_shafii"]

# =========================
# Count Documents
# =========================

count = collection.count_documents({})

print(f"Total parent chunks: {count}")

# from pathlib import Path
# import json

# ROOT = Path("/kaggle/input/datasets/ahmedaboraida/fiqh-shafii")

# parent_count = 0

# for file in ROOT.rglob("*.json"):

#     try:

#         with open(file, "r", encoding="utf-8") as f:
#             data = json.load(f)

#         if isinstance(data, list):

#             parent_count += sum(
#                 1
#                 for item in data
#                 if (
#                     isinstance(item, dict)
#                     and item.get("chunk_type") == "parent"
#                     and item.get("metadata", {}).get("domain") == "فقه"
#                 )
#             )

#     except Exception as e:
#         print(f"Skipped {file}: {e}")

# print(f"Total Fiqh parent chunks: {parent_count}")

# from pymongo import MongoClient
# import certifi

# # =========================
# # Mongo Connection
# # =========================

# client = MongoClient(
#     MONGO_URI,
#     tls=True,
#     tlsCAFile=certifi.where()
# )

# db = client["zad_rag_db"]

# # =========================
# # Database Stats
# # =========================

# stats = db.command("dbStats")

# print("\n===== DATABASE STATS =====\n")

# print(f"Database Name: {db.name}")

# print(
#     f"Data Size: "
#     f"{stats['dataSize'] / (1024**2):.2f} MB"
# )

# print(
#     f"Storage Size: "
#     f"{stats['storageSize'] / (1024**2):.2f} MB"
# )

# print(
#     f"Index Size: "
#     f"{stats['indexSize'] / (1024**2):.2f} MB"
# )

# print(
#     f"Total Collections: "
#     f"{stats['collections']}"
# )

# # =========================
# # Per Collection Stats
# # =========================

# print("\n===== COLLECTIONS =====\n")

# for collection_name in db.list_collection_names():

#     coll_stats = db.command(
#         "collStats",
#         collection_name
#     )

#     print(f"Collection: {collection_name}")

#     print(
#         f"Documents: "
#         f"{coll_stats['count']}"
#     )

#     print(
#         f"Storage: "
#         f"{coll_stats['storageSize'] / (1024**2):.2f} MB"
#     )

#     print(
#         f"Indexes: "
#         f"{coll_stats['totalIndexSize'] / (1024**2):.2f} MB"
#     )

#     print("-" * 50)

# qdrant_manager = QdrantManager(
#     url=QDRANT_URL,
#     api_key=QDRANT_API_KEY
# )

# qdrant_manager._setup_payload_indices(
#     "zad_sharia_collection_childs"
# )

# count = qdrant_manager.client.count(
#     collection_name="zad_sharia_collection_childs",
#     count_filter=models.Filter(
#         must=[
#             models.FieldCondition(
#                 key="metadata.madhhab",
#                 match=models.MatchValue(value="شافعي")
#             )
#         ]
#     ),
#     exact=True
# )

# print(count.count)

# from qdrant_client.http import models

# qdrant_manager.client.delete(
#     collection_name="zad_sharia_collection_childs",
#     points_selector=models.FilterSelector(
#         filter=models.Filter(
#             must=[
#                 models.FieldCondition(
#                     key="metadata.madhhab",
#                     match=models.MatchValue(value="شافعي")
#                 )
#             ]
#         )
#     )
# )

