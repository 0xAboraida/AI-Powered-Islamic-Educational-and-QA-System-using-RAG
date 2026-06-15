"""
self_reflection package
-----------------------
Provides post-generation quality evaluation and retry logic for the RAG pipeline.

Modules:
    evaluator   → SelfReflectionEvaluator — scores answer grounding vs context
    retry_logic → RetryOrchestrator       — decides whether to retry retrieval

Status: STUB — wired but not yet activated in orchestrator.py.
    To enable, set a USE_SELF_REFLECTION = True flag in orchestrator.py
    (similar to the USE_RERANKER flag pattern).
"""

from .evaluator import SelfReflectionEvaluator, EvaluationResult
from .retry_logic import RetryOrchestrator

__all__ = [
    "SelfReflectionEvaluator",
    "EvaluationResult",
    "RetryOrchestrator",
]
