"""
prompt_builder.py
-----------------
Constructs the final text payload injected into the LLM context window.

Flow:
    1. Context Building: Iterates over the `RetrievedParent` documents and formats them into a structured text block.
    2. Prompt Selection: Fetches the hardcoded Arabic Prompt Template specific to the requested domain (e.g., Fiqh vs. Seerah).
    3. Injection: Injects the formatted context string and the user's query into the template.

Why a Prompt Builder?
    It keeps the `llm_service` clean from massive strings and formatting logic. 
    It also ensures that we only inject the `content` (normalized text without diacritics) 
    into the LLM context for faster generation, rather than sending the heavy `original_content`.
"""

from typing import List
from services.ai_rag_engine.app.pipeline.retrieval.parent_child import RetrievedParent
from services.ai_rag_engine.app.pipeline.generation.prompts import get_prompt_for_domain

def build_context_string(parents: List[RetrievedParent]) -> str:
    """
    Builds the formatted context string injected into the LLM system prompt.

    Uses `parent.content` (normalized, no diacritics) for faster LLM comprehension.
    The diacritized `original_content` is sent separately to the UI via citations.py.
    """
    context_parts = []

    for i, parent in enumerate(parents, start=1):
        metadata = parent.metadata
        book_title  = metadata.get("book_title", "Unknown Book")
        author      = metadata.get("author", "Unknown Author")
        part        = metadata.get("part", "")
        page_id     = metadata.get("page_id", "")
        domain      = metadata.get("domain", "")
        madhhab     = metadata.get("madhhab", "")
        kitab       = (metadata.get("hierarchy") or {}).get("kitab", "")

        context_parts.append(
            f"--- المصدر {i} ---\n"
            f"القسم: {domain} | المذهب: {madhhab}"
            + (f" | الكتاب الفقهي: {kitab}" if kitab else "") + "\n"
            f"الكتاب: {book_title} | المؤلف: {author}\n"
            f"الجزء: {part} | الصفحة: {page_id}\n"
            f"النص:\n{parent.content}\n"   # <- Only content (without diacritics) for the LLM
        )

    return "\n".join(context_parts)

def build_prompt(query: str, domain: str, parents: List[RetrievedParent]) -> str:
    """
    Retrieves the domain-specific prompt template and injects the context and query.
    
    Args:
        query: The user's question.
        domain: The domain (e.g., 'فقه', 'السيرة') to load the correct prompt template.
        parents: The retrieved documents to be formatted as context.
        
    Returns:
        The final formatted prompt string ready to be sent to the LLM.
    """
    # 1. Format the retrieved parents into a string
    full_context = build_context_string(parents)
    
    # 2. Get the prompt template for the specific domain
    system_prompt_template = get_prompt_for_domain(domain)
    
    # 3. Inject context and query into the template
    return system_prompt_template.format(context=full_context, query=query)
