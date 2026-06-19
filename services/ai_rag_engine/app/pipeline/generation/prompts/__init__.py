"""
prompts/__init__.py
-------------------
Dynamic Prompt Loader for Domain-Specific Context.

Flow:
    1. Mapping: Maintains a mapping from Arabic domain names to local Python module names.
    2. Dynamic Import: When a response is being generated, dynamically loads the correct `PROMPT` string from that domain's file.
    3. Fallback: If a domain doesn't exist, gracefully falls back to a general Islamic prompt.

Why this file?
    We have different instruction sets for different sciences (e.g., Fiqh needs strict ruling extraction, 
    while Seerah needs chronological storytelling). Hardcoding 8 massive Arabic prompts in `llm_service` 
    would make the code unreadable. This module lazily loads only the prompt needed for the current request.
"""

import importlib
import logging

logger = logging.getLogger(__name__)

DOMAIN_TO_MODULE = {
    "السيرة": "seerah",
    "فقه": "fiqh",
    "العقيدة": "aqeedah",
    "التفسير": "tafseer",
    "الحديث": "hadith",
    "النحو والصرف": "nahw_sarf",
    "التاريخ": "tarikh",
    "الآداب والأخلاق": "adab",
}

def get_prompt_for_domain(domain: str) -> str:
    """
    Dynamically loads the prompt from the specific domain file.
    Falls back to 'general' if the domain is not found.
    """
    module_name = DOMAIN_TO_MODULE.get(domain, "general")
    try:
        # Dynamically import the module for the specific domain
        module = importlib.import_module(f"services.ai_rag_engine.app.pipeline.generation.prompts.{module_name}")
        return module.PROMPT
    except Exception as e:
        logger.error(f"Failed to load prompt for domain '{domain}' (module: {module_name}): {e}")
        # Fallback to general
        from services.ai_rag_engine.app.pipeline.generation.prompts.general import PROMPT
        return PROMPT
