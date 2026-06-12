import re
from typing import Dict, Any, List
from .base import BaseChunker

class ParentChildChunker(BaseChunker):
    """
    Splits a document into a single Parent Chunk (representing the full context)
    and multiple overlapping Child Chunks (for high-precision vector retrieval).
    """
    
    def __init__(self, child_word_size: int = 400, overlap_size: int = 50):
        """
        Initializes the chunker.
        
        Args:
            child_word_size (int): Target number of words per child chunk.
            overlap_size (int): Number of overlapping words between consecutive child chunks.
        """
        self.child_word_size = child_word_size
        self.overlap_size = overlap_size
        self.book_counters = {}

    def chunk(self, document: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Splits a document into Parent and Child chunks.
        
        Args:
            document (Dict[str, Any]): The raw document containing text and metadata.
            
        Returns:
            List[Dict[str, Any]]: A list containing the Parent chunk followed by its Child chunks.
        """
        content = document.get("content", "").strip()
        original_content = document.get("original_content", "").strip()
        if not original_content:
            original_content = content
            
        if not content:
            return []
            
        words = content.split()
        original_words = original_content.split()
        

        
        book_id = document.get("id", "unk")
        page_id = document.get("page_id", "unk")
        
        if book_id not in self.book_counters:
            self.book_counters[book_id] = 1
        else:
            self.book_counters[book_id] += 1
            
        chunk_num = self.book_counters[book_id]
        
        # Generate parent ID based on book and sequential chunk index
        parent_id = f"parent_{book_id}_{page_id}__{chunk_num}"
        
        # Extract hierarchy
        hierarchy_list = document.get("hierarchy", [])
        if isinstance(hierarchy_list, str):
            hierarchy_list = [hierarchy_list]

        # Build structured hierarchy: kitab (level 1) + sections (rest)
        structured_hierarchy = {
            "kitab": hierarchy_list[0] if len(hierarchy_list) > 0 else "",
            "sections": hierarchy_list[1:] if len(hierarchy_list) > 1 else []
        }

        # Prepare Parent Metadata
        parent_metadata = {
            "book_id": book_id,
            "domain": document.get("domain", ""),
            "madhhab": document.get("madhhab", ""),
            "book_title": document.get("title", ""),
            "author": document.get("author", ""),
            "author_death": document.get("author_death", ""),
            "hijri_century": document.get("hijri_century", ""),
            "total_parts": document.get("volumes_count", ""),
            "part": document.get("part", ""),
            "page_id": page_id,
            "hierarchy": structured_hierarchy,
            "source_url": document.get("source_url", "")
        }
        
        child_chunks = []
        child_ids = []
        
        margin = self.child_word_size * 1.2
        if len(words) <= margin:
            # Create a single child chunk if text is short
            child_text = " ".join(words)
            child_orig_text = " ".join(original_words)
            child_id = f"child_{book_id}_{page_id}_{chunk_num}_1"
            child_ids.append(child_id)
            
            child_chunks.append({
                "chunk_id": child_id,
                "chunk_type": "child",
                "parent_id": parent_id,
                "content": child_text,
                "original_content": child_orig_text,
                "metadata": {
                    "book_title": parent_metadata["book_title"],
                    "author": parent_metadata["author"],
                    "domain": parent_metadata["domain"],
                    "madhhab": parent_metadata["madhhab"],
                    "hierarchy": structured_hierarchy
                }
            })
        else:
            # Create overlapping child chunks
            start = 0
            child_index = 1
            while start < len(words):
                end = min(start + self.child_word_size, len(words))
                child_text = " ".join(words[start:end])
                
                # Proportional mapping for original text
                orig_start = int(start * (len(original_words) / max(1, len(words))))
                orig_end = int(end * (len(original_words) / max(1, len(words))))
                child_orig_text = " ".join(original_words[orig_start:orig_end])
                
                child_id = f"child_{book_id}_{page_id}_{chunk_num}_{child_index}"
                child_ids.append(child_id)
                
                child_chunks.append({
                    "chunk_id": child_id,
                    "chunk_type": "child",
                    "parent_id": parent_id,
                    "content": child_text,
                    "original_content": child_orig_text,
                    "metadata": {
                        "book_title": parent_metadata["book_title"],
                        "author": parent_metadata["author"],
                        "domain": parent_metadata["domain"],
                        "madhhab": parent_metadata["madhhab"],
                        "hierarchy": structured_hierarchy
                    }
                })
                
                if end == len(words):
                    break
                    
                start = end - self.overlap_size
                child_index += 1
 
        # Add child IDs to parent metadata
        parent_metadata["child_chunks"] = child_ids
 
        parent_chunk = {
            "chunk_id": parent_id,
            "chunk_type": "parent",
            "content": content,
            "original_content": original_content,
            "metadata": parent_metadata
        }
 
        # Return Parent first, then all Children
        return [parent_chunk] + child_chunks
