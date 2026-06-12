import re
from typing import Dict, Any, List
from .base import BaseEntityLinker

class RegexEntityLinker(BaseEntityLinker):
    """
    Identifies and extracts Islamic entities like Quranic Ayahs and Hadiths 
    using regular expressions.
    """
    
    def __init__(self):
        # Matches: {Text} [Surah: Ayah]
        # Example: {مَا سَلَكَكُمْ فِي سَقَرَ} [المدثر: 42]
        self.ayah_pattern = re.compile(r'\{([^}]+)\}\s*\[([^:]+):\s*(\d+)\]')
        
        # Matches text enclosed in «...»
        # Example: «الصَّلَاةُ عِمَادُ الدِّينِ»
        self.hadith_pattern = re.compile(r'«([^»]+)»')

    def link(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriches a chunk with identified entities.
        
        Args:
            chunk (Dict[str, Any]): The chunk data.
            
        Returns:
            Dict[str, Any]: The chunk data enriched with 'entities' metadata.
        """
        content = chunk.get("content", "")
        entities = {"ayahs": [], "hadiths": []}
        
        if content:
            # Find Ayahs
            for match in self.ayah_pattern.finditer(content):
                text, surah, ayah_num = match.groups()
                entities["ayahs"].append({
                    "text": text.strip(),
                    "surah": surah.strip(),
                    "ayah_num": int(ayah_num)
                })
                
            # Find Hadiths
            for match in self.hadith_pattern.finditer(content):
                text = match.group(1)
                entities["hadiths"].append({
                    "text": text.strip()
                })
                
        # Add to metadata
        if "metadata" not in chunk:
            chunk["metadata"] = {}
            
        chunk["metadata"]["entities"] = entities
        
        return chunk
