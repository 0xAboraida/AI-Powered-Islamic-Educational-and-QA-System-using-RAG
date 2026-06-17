"""
test_retrieval.py
-----------------
Manual integration test for the Retrieval Phase.

Usage:
    python services/ai_rag_engine/app/scripts/test_retrieval.py

What it does:
    1. Loads credentials from .env
    2. Initializes BGE-M3 embedding model
    3. Initializes QdrantManager (shared client)
    4. Runs Dense, Sparse, and Hybrid retrieval against a target collection
    5. Prints results in a readable format for manual inspection
"""

import sys
import os
import logging
from pathlib import Path

# ── Fix Windows console unicode ──────────────────────────────────────────────
sys.stdout.reconfigure(encoding="utf-8")

# ── Resolve project root & add to sys.path ───────────────────────────────────
current_dir = Path(__file__).resolve().parent
project_root = None
for parent in [current_dir] + list(current_dir.parents):
    if parent.name == "Zad-AI":
        project_root = parent
        break
if not project_root:
    project_root = current_dir.parent.parent.parent.parent

if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# ── Load .env ─────────────────────────────────────────────────────────────────
from dotenv import load_dotenv
env_path = project_root / "services" / "ai_rag_engine" / ".env"
load_dotenv(dotenv_path=env_path)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ── Internal imports ──────────────────────────────────────────────────────────
from services.ai_rag_engine.app.models.embedding_models.factory import get_embedding_model, ModelType
from services.ai_rag_engine.app.infrastructure.qdrant_db.qdrant_manager import QdrantManager
# pyrefly: ignore [missing-import]
from services.ai_rag_engine.app.pipeline.retrieval import (
    DenseRetriever,
    SparseRetriever,
    HybridRetriever,
    ParentChildRetriever,
)

# =============================================================================
# ========================== CONFIGURATION ZONE ===============================
# =============================================================================

QUERY            = "ماذا حدث في غزوه تبوك؟"   # ← ضع سؤالك هنا
COLLECTION_NAME  = "zad_seerah_collection"       # ← اسم الـ collection في Qdrant
TOP_K            = 5
FILTERS          = None                          # e.g. {"metadata.domain": "التاريخ"}
RUN_PARENT_CHILD = True    # ← True لاختبار جلب الـ parents من MongoDB
RUN_RERANKER     = False   # ← False لايقاف تجربة الـ Cross-Encoder حالياً

# =============================================================================


def print_results(title: str, results: list, divider: str = "─" * 70):
    print(f"\n{divider}")
    print(f"  {title}  ({len(results)} results)")
    print(divider)
    for i, chunk in enumerate(results, start=1):
        print(f"\n  [{i}] chunk_id : {chunk.chunk_id}")
        print(f"       score    : {chunk.score:.6f}")
        print(f"       domain   : {chunk.metadata.get('domain', 'N/A')}")
        print(f"       book     : {chunk.metadata.get('book_title', 'N/A')}")
        print(f"       content  : {chunk.content.strip()}...")
    print(divider)


def main():
    logger.info("=" * 70)
    logger.info("🔍 Starting Retrieval Test")
    logger.info("=" * 70)
    logger.info(f"Query      : {QUERY}")
    logger.info(f"Collection : {COLLECTION_NAME}")
    logger.info(f"Top-K      : {TOP_K}")
    logger.info(f"Filters    : {FILTERS}")

    # ── Helper: resolve ${VAR} references in .env ─────────────────────────────
    def get_env_var(key, default=None):
        val = os.getenv(key, default)
        if val and val.startswith("${") and val.endswith("}"):
            return os.getenv(val[2:-1], default)
        return val

    QDRANT_URL     = get_env_var("CURRENT_QDRANT_URL")
    QDRANT_API_KEY = get_env_var("CURRENT_QDRANT_API_KEY")

    # ── Initialize shared components ──────────────────────────────────────────
    logger.info("⚙️  Loading BGE-M3 embedding model...")
    embedding_model = get_embedding_model(ModelType.BGE_M3)

    logger.info("⚙️  Connecting to Qdrant...")
    qdrant_manager = QdrantManager(url=QDRANT_URL, api_key=QDRANT_API_KEY)

    # ── Build retrievers ──────────────────────────────────────────────────────
    dense_retriever  = DenseRetriever(embedding_model, qdrant_manager)
    sparse_retriever = SparseRetriever(embedding_model, qdrant_manager)
    hybrid_retriever = HybridRetriever(embedding_model, qdrant_manager)

    # ── Run retrieval ─────────────────────────────────────────────────────────
    logger.info("🚀 Running Dense Retrieval...")
    dense_results = dense_retriever.retrieve(
        query=QUERY,
        collection_name=COLLECTION_NAME,
        top_k=TOP_K,
        filters=FILTERS,
    )

    logger.info("🚀 Running Sparse Retrieval...")
    sparse_results = sparse_retriever.retrieve(
        query=QUERY,
        collection_name=COLLECTION_NAME,
        top_k=TOP_K,
        filters=FILTERS,
    )

    logger.info("🚀 Running Hybrid Retrieval (Dense + Sparse + RRF)...")
    hybrid_results = hybrid_retriever.retrieve(
        query=QUERY,
        collection_name=COLLECTION_NAME,
        top_k=TOP_K,
        filters=FILTERS,
    )

    # ── Print results ─────────────────────────────────────────────────────────
    print_results("🔵 DENSE RETRIEVAL",  dense_results)
    print_results("🟠 SPARSE RETRIEVAL", sparse_results)
    print_results("🟢 HYBRID RETRIEVAL (RRF FUSED)", hybrid_results)

    # ── Parent-Child Retrieval ────────────────────────────────────────────────
    if RUN_PARENT_CHILD:
        logger.info("🚀 Running Parent-Child Retrieval (Hybrid → MongoDB)...")
        parent_retriever = ParentChildRetriever(
            hybrid_retriever=hybrid_retriever,
            env_vars=dict(os.environ),
            child_top_k=TOP_K * 3,
        )
        parent_results = parent_retriever.retrieve(
            query=QUERY,
            collection_name=COLLECTION_NAME,
            top_k=TOP_K,
            filters=FILTERS,
        )

        divider = "═" * 70
        print(f"\n{divider}")
        print(f"  🏛️  PARENT-CHILD RETRIEVAL  ({len(parent_results)} parents)")
        print(divider)
        for i, parent in enumerate(parent_results, start=1):
            print(f"\n  [{i}] parent_id   : {parent.parent_id}")
            print(f"       child_score : {parent.best_child_score:.6f}")
            print(f"       domain      : {parent.metadata.get('domain', 'N/A')}")
            print(f"       book        : {parent.metadata.get('book_title', 'N/A')}")
            print(f"       triggered_by: {parent.triggered_by}")
            print(f"       content     : {parent.content.strip()}...")
        print(divider)

        # ── Reranking ─────────────────────────────────────────────────────────
        if RUN_RERANKER and parent_results:
            logger.info("🚀 Running Cross-Encoder Reranker...")
            # We import here locally so we don't trigger PyTorch loading if disabled
            from services.ai_rag_engine.app.pipeline.reranking.cross_encoder import CrossEncoderReranker
            reranker = CrossEncoderReranker(model_name="BAAI/bge-reranker-v2-m3", use_fp16=True)
            
            reranked_results = reranker.rerank(
                query=QUERY,
                documents=parent_results,
                top_k=TOP_K
            )

            print(f"\n{divider}")
            print(f"  🏆  RERANKED PARENTS (Cross-Encoder)  ({len(reranked_results)} parents)")
            print(divider)
            for i, parent in enumerate(reranked_results, start=1):
                print(f"\n  [{i}] parent_id   : {parent.parent_id}")
                print(f"       new_score   : {parent.best_child_score:.6f}")
                print(f"       domain      : {parent.metadata.get('domain', 'N/A')}")
                print(f"       book        : {parent.metadata.get('book_title', 'N/A')}")
                print(f"       content     : {parent.content.strip()}...")
            print(divider)

        parent_retriever.close()

    logger.info("✅ Retrieval test complete.")


if __name__ == "__main__":
    main()
