"""
retry_logic.py
--------------
Self-Reflection Retry Logic for the Zad-AI RAG pipeline.

Purpose:
    If the SelfReflectionEvaluator determines the generated answer has a
    grounding score below GROUNDING_THRESHOLD, RetryOrchestrator can trigger
    a second retrieval pass with a reformulated query or relaxed filters.

Status: STUB — not yet wired into the pipeline.
    To activate: call RetryOrchestrator inside orchestrator.py after evaluation.
"""

import logging
from typing import List, Optional

from services.ai_rag_engine.app.pipeline.retrieval.parent_child import RetrievedParent
from services.ai_rag_engine.app.pipeline.generation.self_reflection.evaluator import (
    EvaluationResult,
    SelfReflectionEvaluator,
)

logger = logging.getLogger(__name__)


class RetryOrchestrator:
    """
    Decides whether to retry retrieval based on the self-reflection evaluation.

    Retry Strategy (placeholder):
        1. On first failure → retry with the raw query (no madhhab filter).
        2. On second failure → return the best available answer as-is.

    Max retries is kept low (1-2) to avoid excessive latency.
    """

    MAX_RETRIES: int = 1

    def __init__(self, evaluator: Optional[SelfReflectionEvaluator] = None):
        self.evaluator = evaluator or SelfReflectionEvaluator()

    def should_retry(self, evaluation: EvaluationResult) -> bool:
        """Returns True if the evaluation score is below the grounding threshold."""
        return not evaluation.is_grounded

    def get_retry_query(self, original_query: str, attempt: int) -> str:
        """
        Returns a reformulated query for the retry attempt.

        Args:
            original_query: The original search query.
            attempt:        Current retry attempt number (1-indexed).

        Returns:
            A potentially modified query for the retry pass.
        """
        # ── Placeholder: return query as-is for now ───────────────────────────
        # TODO: Implement query reformulation (e.g., broader phrasing, HyDE, etc.)
        logger.debug(
            f"[RetryOrchestrator] Retry attempt {attempt} — "
            f"returning original query unchanged (stub)."
        )
        return original_query
