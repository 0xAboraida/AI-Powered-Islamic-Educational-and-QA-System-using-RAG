from typing import List, Dict, Any, Tuple
from services.ai_rag_engine.app.pipeline.retrieval.parent_child import RetrievedParent

def prepare_citations_payloads(parents: List[RetrievedParent]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Extracts citation metadata and context payload from the retrieved parent chunks.

    This function strictly handles preparing the JSON-serializable dictionaries for the UI.
    It uses `parent.original_content` (with diacritics) for beautiful UI display.
    
    Returns:
        Tuple containing:
        - citations_data (Dict): Metadata dictionary keyed by cit_1, cit_2 etc.
        - context_payload (List[Dict]): Raw context texts for the UI context panel.
    """
    citations_data = {}
    context_payload = []

    for i, parent in enumerate(parents, start=1):
        m = parent.metadata
        
        # Build hierarchy string
        hierarchy_dict = m.get("hierarchy") or {}
        kitab = hierarchy_dict.get("kitab") or ""
        sections = hierarchy_dict.get("sections") or []
        hierarchy_str = str(kitab) if kitab else ""
        if sections:
            if hierarchy_str:
                hierarchy_str += " > "
            hierarchy_str += " > ".join(str(s) for s in sections)

        # 1. Build full citations data for the UI based on citation_format.json
        citation = {
            "book_title": m.get("book_title"),
            "madhhab": m.get("madhhab"),
            "author": m.get("author"),
            "author_death": m.get("author_death"),
            "total_parts": m.get("total_parts"),
            "part": str(m.get("part")) if m.get("part") is not None else None,
            "page_id": m.get("page_id"),
            "hierarchy": hierarchy_str,
            "source_url": m.get("source_url", m.get("link", m.get("url", "")))
        }
        
        citations_data[f"cit_{i}"] = citation

        # 3. Build pure context payload for the UI context panel
        context_payload.append({
            "id": i,
            "content": parent.original_content or parent.content,
            "domain": m.get("domain"),
            "book_title": m.get("book_title"),
            "page_id": m.get("page_id"),
            "source_url": citation["source_url"]
        })

    return citations_data, context_payload
