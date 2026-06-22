from typing import Dict, Any
from ..core.base import BaseProcessor

class HierarchyInjector(BaseProcessor):
    def process(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        if chunk.get("chunk_type") != "child":
            return chunk  #  return parent as-is, clean
            
        metadata = chunk.get('metadata', {})
        book_title = metadata.get('book_title', '')
        hijri_century = metadata.get('hijri_century', '')
        madhhab = metadata.get('madhhab', '')
        hierarchy = metadata.get('hierarchy', {})
        kitab = hierarchy.get('kitab', '')
        sections = hierarchy.get('sections', [])

        injection_parts = []
        if book_title:
            injection_parts.append(f"الكتاب: {book_title}")
        if madhhab:
            injection_parts.append(f"المذهب: {madhhab}")
        if hijri_century:
            injection_parts.append(f"القرن الهجري: {hijri_century}")
        if kitab:
            injection_parts.append(f"الموضوع: {kitab}")
        if sections:
            sections_str = " > ".join(sections)
            injection_parts.append(f"المسار: {sections_str}")

        if injection_parts:
            prefix = " | ".join(injection_parts)
            original_content = chunk.get('content', '')
            chunk['content'] = (
                f"السياق: [{prefix}]\n\n"
                f"النص: {original_content}"
            )

        return chunk
