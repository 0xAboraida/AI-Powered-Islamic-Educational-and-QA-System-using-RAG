from typing import List, Dict, Any, Tuple
from services.ai_rag_engine.app.pipeline.retrieval.parent_child import RetrievedParent

def prepare_citations_payloads(parents: List[RetrievedParent]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Extracts citation metadata and context payload from the retrieved parent chunks.

    This function strictly handles preparing the JSON-serializable dictionaries for the UI.
    It uses `parent.original_content` (with diacritics) for beautiful UI display.
    
    Returns:
        Tuple containing:
        - citations_data (List[Dict]): Metadata + original_content snippets for the UI.
        - context_payload (List[Dict]): Raw context texts for the UI context panel.
    """
    citations_data = []
    context_payload = []

    for i, parent in enumerate(parents, start=1):
        m = parent.metadata
        
        # 1. Extract only the exact fields requested by the user
        filtered_metadata = {
            "domain": m.get("domain"),
            "madhhab": m.get("madhhab"),
            "book_id": m.get("book_id"),
            "book_title": m.get("book_title"),
            "author": m.get("author"),
            "author_death": m.get("author_death"),
            "hijri_century": m.get("hijri_century"),
            "total_parts": m.get("total_parts"),
            "part": m.get("part"),
            "page_id": m.get("page_id"),
            "hierarchy": {
                "kitab": m.get("hierarchy", {}).get("kitab"),
                "sections": m.get("hierarchy", {}).get("sections", [])
            },
            "source_url": m.get("source_url", m.get("link", m.get("url", "")))
        }

        # 2. Build full citations data for the UI
        #    content_snippet uses original_content (with diacritics) for beautiful UI rendering.
        citation = {
            "id": i,
            **filtered_metadata,
            "content_snippet": parent.original_content or parent.content,
        }
        citations_data.append(citation)

        # 3. Build pure context payload for the UI context panel
        context_payload.append({
            "id": i,
            "content": parent.original_content or parent.content,
            **filtered_metadata,
        })

    return citations_data, context_payload
