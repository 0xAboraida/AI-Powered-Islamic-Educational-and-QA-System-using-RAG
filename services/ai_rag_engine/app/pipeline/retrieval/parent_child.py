"""
parent_child.py
---------------
Small-to-Big Retrieval (Parent-Child Retrieval).

Flow:
    1. Run HybridRetriever → get child chunks from Qdrant
       (each child has: chunk_id, score, content, metadata, parent_id)

    2. Group child chunks by routing key (domain + madhhab)

    3. For each group → route to correct MongoDB cluster(s) using mongo_router
       → fetch full parent documents by parent_id

    4. Return list of RetrievedParent objects (full context, ready for reranker)

Why Parent-Child?
    Child chunks are small (few sentences) → great for precise vector matching.
    But LLMs need MORE context to answer well.
    Parents are the full sections/paragraphs that contain those children.
    We retrieve children, then EXPAND to their parents before generation.
"""

import os
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict

from .base_retriever import RetrievedChunk
from .hybrid_search import HybridRetriever
from services.ai_rag_engine.app.infrastructure.mongo_db.mongo_manager import MongoManager
from services.ai_rag_engine.app.infrastructure.mongo_db.mongo_router import (
    MongoRouteConfig,
    get_routes,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Result dataclass
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class RetrievedParent:
    """
    A full parent document fetched from MongoDB, enriched with the
    retrieval score of the best child chunk that triggered it.
    """
    parent_id: str
    content: str                        # Full parent text (for the LLM)
    original_content: str               # Original text with diacritics (for the UI)
    metadata: Dict[str, Any]           # Domain, madhhab, book_title, etc.
    best_child_score: float            # Highest RRF score among children of this parent
    triggered_by: List[str] = field(default_factory=list)  # child_ids that matched

    def __repr__(self) -> str:
        return (
            f"RetrievedParent(id={self.parent_id!r}, "
            f"score={self.best_child_score:.4f}, "
            f"domain={self.metadata.get('domain', 'N/A')!r})"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Connection pool (lazy, one MongoManager per cluster URI)
# ─────────────────────────────────────────────────────────────────────────────

class _MongoConnectionPool:
    """
    Maintains one live MongoManager per (uri, db_name) pair.
    Avoids creating a new TCP connection for every fetch call.
    """

    def __init__(self, env_vars: Dict[str, str]):
        """
        Args:
            env_vars: Dict of all resolved env vars (from os.environ).
        """
        self._env_vars = env_vars
        self._pool: Dict[Tuple[str, str], MongoManager] = {}

    def get(self, route: MongoRouteConfig) -> Optional[MongoManager]:
        """Get or create a MongoManager for the given route config."""
        uri = self._env_vars.get(route.uri_env_key)
        if not uri:
            logger.error(
                f"❌ Missing env var '{route.uri_env_key}'. "
                f"Cannot connect to MongoDB for route: {route}"
            )
            return None

        # Resolve ${VAR} style references
        if uri.startswith("${") and uri.endswith("}"):
            uri = self._env_vars.get(uri[2:-1], "")

        key = (uri, route.db_name)
        if key not in self._pool:
            logger.info(f"🔌 Opening new MongoDB connection → db='{route.db_name}'")
            self._pool[key] = MongoManager(uri=uri, db_name=route.db_name)

        return self._pool[key]

    def close_all(self):
        for manager in self._pool.values():
            manager.close()
        self._pool.clear()


# ─────────────────────────────────────────────────────────────────────────────
# Main class
# ─────────────────────────────────────────────────────────────────────────────

class ParentChildRetriever:
    """
    Wraps HybridRetriever and expands results from child chunks
    to full parent documents fetched from MongoDB.

    Usage:
        retriever = ParentChildRetriever(hybrid_retriever, env_vars=dict(os.environ))
        parents   = retriever.retrieve(
            query="ما هي أركان الصلاة عند الشافعية؟",
            collection_name="zad_fiqh_collection",
            top_k=10,
            filters={"metadata.madhhab": "شافعي"},
        )
        # parents is List[RetrievedParent] → pass to reranker
    """

    def __init__(
        self,
        hybrid_retriever: HybridRetriever,
        env_vars: Optional[Dict[str, str]] = None,
        child_top_k: int = 30,
    ):
        """
        Args:
            hybrid_retriever: Pre-built HybridRetriever (Dense + Sparse + RRF).
            env_vars:         Dict of env vars (defaults to os.environ).
                              Must contain all MONGO_URI_* keys.
            child_top_k:      How many child chunks to fetch before expanding
                              to parents. More children = better parent coverage
                              but slower. Default: 30.
        """
        self.hybrid_retriever = hybrid_retriever
        self.child_top_k = child_top_k
        self._pool = _MongoConnectionPool(env_vars or dict(os.environ))

    def retrieve(
        self,
        query: str,
        collection_name: str,
        child_top_k: int = 10,
        parent_top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedParent]:
        """
        Full parent-child retrieval pipeline.

        Args:
            query:           Raw Arabic query string.
            collection_name: Qdrant collection to search.
            child_top_k:     Number of child chunks to fetch from Qdrant.
            parent_top_k:    Max number of PARENT documents to return.
            filters:         Optional Qdrant metadata filters dict.

        Returns:
            List of RetrievedParent sorted by best_child_score descending.
            (Ready to be passed to the reranker.)
        """
        # ── Step 1: Retrieve child chunks from Qdrant via Hybrid Search ──────
        logger.info(
            f"[ParentChildRetriever] Step 1: Hybrid search "
            f"(child_top_k={child_top_k})"
        )
        child_chunks: List[RetrievedChunk] = self.hybrid_retriever.retrieve(
            query=query,
            collection_name=collection_name,
            top_k=child_top_k,
            filters=filters,
        )

        if not child_chunks:
            logger.warning("[ParentChildRetriever] No child chunks returned.")
            return []

        logger.info(f"[ParentChildRetriever] Got {len(child_chunks)} child chunks.")

        # ── Step 2: Group children by (domain, madhhab) for routing ──────────
        logger.info("[ParentChildRetriever] Step 2: Grouping by domain/madhhab...")

        # routing_key → list of (parent_id, best_score, child_id)
        # We use a dict to deduplicate parents (keep highest child score)
        RouteKey = Tuple[str, Optional[str]]  # (domain, madhhab)

        # parent_id → {score, child_ids, metadata, route_key}
        parent_map: Dict[str, Dict] = {}

        for chunk in child_chunks:
            parent_id = chunk.parent_id
            if not parent_id:
                logger.debug(f"  Chunk '{chunk.chunk_id}' has no parent_id, skipping.")
                continue

            domain  = chunk.metadata.get("domain")
            madhhab = chunk.metadata.get("madhhab")

            if parent_id not in parent_map:
                parent_map[parent_id] = {
                    "score":     chunk.score,
                    "child_ids": [chunk.chunk_id],
                    "metadata":  chunk.metadata,
                    "domain":    domain,
                    "madhhab":   madhhab,
                }
            else:
                # Update best score and accumulate child ids
                existing = parent_map[parent_id]
                if chunk.score > existing["score"]:
                    existing["score"] = chunk.score
                existing["child_ids"].append(chunk.chunk_id)

        logger.info(
            f"[ParentChildRetriever] {len(parent_map)} unique parents identified."
        )

        # ── Step 3: Group parents by routing key ──────────────────────────────
        # route_key (domain, madhhab) → list of parent_ids
        route_groups: Dict[RouteKey, List[str]] = defaultdict(list)
        route_meta:   Dict[RouteKey, Tuple[str, str]] = {}  # route_key → (domain, madhhab)

        for parent_id, info in parent_map.items():
            key = (info["domain"], info["madhhab"])
            route_groups[key].append(parent_id)
            route_meta[key] = (info["domain"], info["madhhab"])

        # ── Step 4: Fetch parents from MongoDB ───────────────────────────────
        logger.info(
            f"[ParentChildRetriever] Step 4: Fetching from MongoDB "
            f"({len(route_groups)} route groups)..."
        )

        import time
        mongo_t = time.time()
        # parent_id → raw MongoDB doc
        fetched_docs: Dict[str, Dict] = {}

        for route_key, parent_ids in route_groups.items():
            domain, madhhab = route_meta[route_key]

            try:
                routes: List[MongoRouteConfig] = get_routes(domain, madhhab)
            except KeyError as e:
                logger.error(f"  {e}")
                continue

            remaining_ids = set(parent_ids)

            for route in routes:
                if not remaining_ids:
                    break  # All parents found already

                manager = self._pool.get(route)
                if not manager:
                    continue

                docs = manager.fetch_by_ids(
                    collection_name=route.collection_name,
                    ids=list(remaining_ids),
                )

                for doc in docs:
                    doc_id = str(doc.get("_id", ""))
                    fetched_docs[doc_id] = doc
                    remaining_ids.discard(doc_id)

            if remaining_ids:
                logger.warning(
                    f"  ⚠️  Could not find {len(remaining_ids)} parents "
                    f"for domain='{domain}', madhhab='{madhhab}': {list(remaining_ids)[:3]}..."
                )

        logger.info(
            f"[ParentChildRetriever] Fetched {len(fetched_docs)} parent docs from MongoDB."
        )
        logger.info(f"[⏱️ TIMER] ParentChild MongoDB fetching took: {time.time() - mongo_t:.2f} seconds")

        # ── Step 5: Build RetrievedParent list ────────────────────────────────
        results: List[RetrievedParent] = []

        for parent_id, info in parent_map.items():
            doc = fetched_docs.get(parent_id)
            if not doc:
                continue

            # content: normalized text (no diacritics) → used by LLM for faster comprehension
            content = doc.get("content", doc.get("text", ""))
            # original_content: text with full diacritics → displayed to the user in the UI
            original_content = doc.get("original_content", content)

            results.append(
                RetrievedParent(
                    parent_id=parent_id,
                    content=content,
                    original_content=original_content,
                    metadata=doc.get("metadata", info["metadata"]),
                    best_child_score=info["score"],
                    triggered_by=info["child_ids"],
                )
            )

        # Sort by best child score descending, then slice to top_k
        results.sort(key=lambda p: p.best_child_score, reverse=True)
        results = results[:parent_top_k]

        logger.info(
            f"[ParentChildRetriever] ✅ Returning {len(results)} parent documents."
        )
        return results

    async def aretrieve(
        self,
        query: str,
        collection_name: str,
        child_top_k: int = 10,
        parent_top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[RetrievedParent]:
        logger.info(
            f"[ParentChildRetriever] Step 1: Async Hybrid search "
            f"(child_top_k={child_top_k})"
        )
        child_chunks: List[RetrievedChunk] = await self.hybrid_retriever.aretrieve(
            query=query,
            collection_name=collection_name,
            top_k=child_top_k,
            filters=filters,
        )

        if not child_chunks:
            logger.warning("[ParentChildRetriever] No child chunks returned.")
            return []

        logger.info(f"[ParentChildRetriever] Got {len(child_chunks)} child chunks.")

        logger.info("[ParentChildRetriever] Step 2: Grouping by domain/madhhab...")

        RouteKey = Tuple[str, Optional[str]]
        parent_map: Dict[str, Dict] = {}

        for chunk in child_chunks:
            parent_id = chunk.parent_id
            if not parent_id:
                continue

            domain  = chunk.metadata.get("domain")
            madhhab = chunk.metadata.get("madhhab")

            if parent_id not in parent_map:
                parent_map[parent_id] = {
                    "score":     chunk.score,
                    "child_ids": [chunk.chunk_id],
                    "metadata":  chunk.metadata,
                    "domain":    domain,
                    "madhhab":   madhhab,
                }
            else:
                existing = parent_map[parent_id]
                if chunk.score > existing["score"]:
                    existing["score"] = chunk.score
                existing["child_ids"].append(chunk.chunk_id)

        route_groups: Dict[RouteKey, List[str]] = defaultdict(list)
        route_meta:   Dict[RouteKey, Tuple[str, str]] = {}

        for parent_id, info in parent_map.items():
            key = (info["domain"], info["madhhab"])
            route_groups[key].append(parent_id)
            route_meta[key] = (info["domain"], info["madhhab"])

        import time
        import asyncio
        mongo_t = time.time()
        
        def fetch_all_mongo():
            fetched_docs_local = {}
            for route_key, parent_ids in route_groups.items():
                domain, madhhab = route_meta[route_key]
                try:
                    routes = get_routes(domain, madhhab)
                except KeyError:
                    continue
                
                remaining_ids = set(parent_ids)
                for route in routes:
                    if not remaining_ids:
                        break
                    manager = self._pool.get(route)
                    if not manager:
                        continue
                    docs = manager.fetch_by_ids(
                        collection_name=route.collection_name,
                        ids=list(remaining_ids),
                    )
                    for doc in docs:
                        doc_id = str(doc.get("_id", ""))
                        fetched_docs_local[doc_id] = doc
                        remaining_ids.discard(doc_id)
            return fetched_docs_local

        fetched_docs = await asyncio.to_thread(fetch_all_mongo)
        
        logger.info(f"[⏱️ TIMER] ParentChild Async MongoDB fetching took: {time.time() - mongo_t:.2f} seconds")

        results: List[RetrievedParent] = []

        for parent_id, info in parent_map.items():
            doc = fetched_docs.get(parent_id)
            if not doc:
                continue

            content = doc.get("content", doc.get("text", ""))
            original_content = doc.get("original_content", content)

            results.append(
                RetrievedParent(
                    parent_id=parent_id,
                    content=content,
                    original_content=original_content,
                    metadata=doc.get("metadata", info["metadata"]),
                    best_child_score=info["score"],
                    triggered_by=info["child_ids"],
                )
            )

        results.sort(key=lambda p: p.best_child_score, reverse=True)
        results = results[:parent_top_k]

        logger.info(f"[ParentChildRetriever] ✅ Returning {len(results)} parent documents (async).")
        return results

    def close(self):
        """Close all open MongoDB connections."""
        self._pool.close_all()
