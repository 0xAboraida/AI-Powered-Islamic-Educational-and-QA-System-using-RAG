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
