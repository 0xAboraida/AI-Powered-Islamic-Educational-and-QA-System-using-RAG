from typing import List, Dict
from .base_retriever import RetrievedChunk


def reciprocal_rank_fusion(
    result_lists: List[List[RetrievedChunk]],
    k: int = 60,
    top_k: int = 10,
) -> List[RetrievedChunk]:
    """
    Merge multiple ranked result lists into a single re-ranked list
    using Reciprocal Rank Fusion (RRF).

    Formula:
        RRF_score(doc) = Σ  1 / (k + rank_in_list_i)

    Why k=60?
        The original RRF paper (Cormack et al., 2009) recommends k=60.
        It acts as a smoothing constant — a higher k gives less weight to
        top-ranked documents and makes the fusion more balanced.

    Args:
        result_lists: A list of ranked result lists (e.g., [dense_results, sparse_results]).
        k:            RRF smoothing constant (default: 60).
        top_k:        Number of top results to return after fusion.

    Returns:
        A merged, re-ranked list of RetrievedChunk (highest RRF score first).
    """
    # Maps chunk_id → accumulated RRF score
    rrf_scores: Dict[str, float] = {}

    # Maps chunk_id → its RetrievedChunk object (to reconstruct the final list)
    chunk_map: Dict[str, RetrievedChunk] = {}

    for result_list in result_lists:
        for rank, chunk in enumerate(result_list, start=1):
            # Accumulate RRF score (1-indexed ranks)
            rrf_scores[chunk.chunk_id] = (
                rrf_scores.get(chunk.chunk_id, 0.0) + 1.0 / (k + rank)
            )
            # Store the chunk object (the one with the higher original score wins)
            if chunk.chunk_id not in chunk_map:
                chunk_map[chunk.chunk_id] = chunk
            else:
                # Keep the instance with the higher original retrieval score
                if chunk.score > chunk_map[chunk.chunk_id].score:
                    chunk_map[chunk.chunk_id] = chunk

    # Sort by RRF score descending
    sorted_ids = sorted(rrf_scores, key=lambda cid: rrf_scores[cid], reverse=True)

    # Reconstruct the final list, attaching the fused RRF score
    fused_results = []
    for chunk_id in sorted_ids[:top_k]:
        chunk = chunk_map[chunk_id]
        # Override original score with the RRF score for transparency
        chunk.score = rrf_scores[chunk_id]
        fused_results.append(chunk)

    return fused_results
