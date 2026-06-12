import json
import logging
import sys
import re
from pathlib import Path
from typing import List, Dict, Any

from .cleaner import ArabicTextCleaner
from .chunker import ParentChildChunker
from .entity_linker import RegexEntityLinker

logger = logging.getLogger("PreprocessingPipeline")

class PreprocessingPipeline:
    """
    Unified preprocessing pipeline that coordinates Text Cleaning, 
    Parent-Child Chunking, and Entity Linking in a modular, production-ready way.
    """
    
    def __init__(
        self,
        remove_tashkeel: bool = True,
        normalize_letters: bool = True,
        child_word_size: int = 400,
        overlap_size: int = 50
    ):
        self.remove_tashkeel = remove_tashkeel
        self.normalize_letters = normalize_letters
        self.child_word_size = child_word_size
        self.overlap_size = overlap_size
        
        # Initialize sub-components
        self.cleaner = ArabicTextCleaner(
            remove_tashkeel=self.remove_tashkeel,
            normalize_letters=self.normalize_letters
        )
        self.chunker = ParentChildChunker(
            child_word_size=self.child_word_size,
            overlap_size=self.overlap_size
        )
        self.linker = RegexEntityLinker()

    @staticmethod
    def load_json(filepath: Path) -> List[Dict[str, Any]]:
        """Loads JSON data from a given filepath."""
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)

    @staticmethod
    def save_json(data: Any, filepath: Path):
        """Saves JSON data to a given filepath, creating directories if needed."""
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def discover_files(
        self,
        base_dir: Path, 
        domain: str = None, 
        madhhab: Any = None, 
        book_id: Any = None, 
        single_file: str = None
    ) -> List[Path]:
        """Dynamically finds files to process based on filters."""
        if single_file:
            single_path = Path(single_file)
            if not single_path.exists():
                logger.error(f"Specified file does not exist: {single_file}")
                raise FileNotFoundError(f"File not found: {single_file}")
            return [single_path]
        # Build search path dynamically based on domain
        search_dir = base_dir
        domain_list = []
        if domain:
            if isinstance(domain, str):
                domain_list = [domain.lower()]
            elif isinstance(domain, (list, tuple, set)):
                domain_list = [d.lower() for d in domain]

        if not search_dir.exists():
            logger.warning(f"Search path does not exist: {search_dir}")
            return []

        # Recursively scan for JSON files
        all_files = list(search_dir.glob("**/*.json"))

        # Apply domain filter if provided (supports string or list of strings)
        if domain_list:
            all_files = [
                f for f in all_files 
                if any(d in [part.lower() for part in f.parts] for d in domain_list)
            ]

        # Apply madhhab filter if provided (supports string or list of strings)
        if madhhab:
            if isinstance(madhhab, str):
                madhhab_list = [madhhab.lower()]
            elif isinstance(madhhab, (list, tuple, set)):
                madhhab_list = [m.lower() for m in madhhab]
            else:
                madhhab_list = []
                
            if madhhab_list:
                all_files = [
                    f for f in all_files 
                    if any(m in [part.lower() for part in f.parts] for m in madhhab_list)
                ]

        # Apply book-id filter if provided (supports string/int or list of strings/ints)
        if book_id:
            if isinstance(book_id, (str, int)):
                book_ids = [str(book_id)]
            elif isinstance(book_id, (list, tuple, set)):
                book_ids = [str(bid) for bid in book_id]
            else:
                book_ids = []
                
            if book_ids:
                filtered_files = []
                for f in all_files:
                    for bid in book_ids:
                        if f"book_{bid}_" in f.name or f.name.startswith(f"book_{bid}"):
                            filtered_files.append(f)
                            break
                all_files = filtered_files

        return all_files

    def run_clean_stage(
        self, 
        input_dir: Path, 
        output_dir: Path,
        domain: str = None,
        madhhab: str = None,
        book_id: str = None,
        single_file: str = None
    ) -> List[Path]:
        logger.info("--- Starting Stage 1: Text Cleaning ---")
        json_files = self.discover_files(
            base_dir=input_dir,
            domain=domain,
            madhhab=madhhab,
            book_id=book_id,
            single_file=single_file
        )
        
        if not json_files:
            logger.warning("No files found to clean.")
            return []
            
        logger.info(f"Found {len(json_files)} files to clean.")
        processed_paths = []
        all_dropped_chunks = []
        
        for file_path in json_files:
            try:
                relative_path = file_path.relative_to(input_dir)
            except ValueError:
                relative_path = Path(file_path.name)
                
            out_path = output_dir / relative_path
            logger.info(f"Cleaning: {file_path.name} -> {out_path.name}")
            
            try:
                documents = self.load_json(file_path)
                cleaned_documents = []
                for doc in documents:
                    raw_content = doc.get("content", "")
                    cleaned_content = self.cleaner.clean(raw_content)

                    # --- Clean hierarchy titles (remove wrapping brackets + § from each level) ---
                    hierarchy = doc.get("hierarchy", [])
                    if hierarchy:
                        doc["hierarchy"] = [
                            self.cleaner.clean_title(self.cleaner.clean(level))
                            for level in hierarchy
                        ]
                        hierarchy = doc["hierarchy"]

                    # --- Clean book title field (remove wrapping brackets) ---
                    if doc.get("title"):
                        doc["title"] = self.cleaner.clean_title(doc["title"])

                    # --- Drop Empty or Redundant Chunks ---
                    norm_content = re.sub(r'[^\w]', '', cleaned_content)
                    
                    # 1. Skip if completely empty after removing non-word characters
                    if not norm_content:
                        doc_copy = doc.copy()
                        doc_copy["drop_reason"] = "empty_content"
                        all_dropped_chunks.append(doc_copy)
                        continue
                        
                    # 2. Skip if content is identical to the last hierarchy level
                    if hierarchy:
                        last_level = hierarchy[-1]
                        norm_last_level = re.sub(r'[^\w]', '', last_level)
                        if norm_content == norm_last_level:
                            doc_copy = doc.copy()
                            doc_copy["drop_reason"] = "identical_to_hierarchy"
                            all_dropped_chunks.append(doc_copy)
                            continue

                    doc["original_content"] = raw_content
                    doc["content"] = cleaned_content
                    cleaned_documents.append(doc)
                self.save_json(cleaned_documents, out_path)
                processed_paths.append(out_path)
                logger.info(f"Cleaned {len(cleaned_documents)} records.")
            except Exception as e:
                logger.error(f"Failed to clean {file_path.name}: {e}")
                
        if all_dropped_chunks:
            dropped_path = output_dir / "dropped_chunks.json"
            existing_dropped = []
            if dropped_path.exists():
                try:
                    existing_dropped = self.load_json(dropped_path)
                except Exception:
                    pass
            
            # Append new dropped chunks and save
            existing_dropped.extend(all_dropped_chunks)
            self.save_json(existing_dropped, dropped_path)
            logger.info(f"Saved {len(all_dropped_chunks)} dropped chunks to {dropped_path}")
                
        return processed_paths

    def run_chunk_stage(
        self, 
        input_dir: Path, 
        output_dir: Path,
        domain: str = None,
        madhhab: str = None,
        book_id: str = None,
        single_file: str = None
    ) -> List[Path]:
        logger.info("--- Starting Stage 2: Parent-Child Chunking ---")
        json_files = self.discover_files(
            base_dir=input_dir,
            domain=domain,
            madhhab=madhhab,
            book_id=book_id,
            single_file=single_file
        )
        
        if not json_files:
            logger.warning("No files found to chunk. Please run 'clean' stage first.")
            return []
            
        logger.info(f"Found {len(json_files)} files to chunk.")
        processed_paths = []
        
        for file_path in json_files:
            try:
                relative_path = file_path.relative_to(input_dir)
            except ValueError:
                relative_path = Path(file_path.name)
                
            base_name = file_path.name
            book_prefix = base_name.split("_")[0] + "_" + base_name.split("_")[1] if len(base_name.split("_")) > 1 else base_name.replace(".json", "")
            out_name = f"{book_prefix}_chunks.json"
            
            out_path = output_dir / relative_path.parent / out_name
            logger.info(f"Chunking: {file_path.name} -> {out_path.name}")
            
            try:
                cleaned_documents = self.load_json(file_path)
                processed_chunks = []
                for doc in cleaned_documents:
                    chunks = self.chunker.chunk(doc)
                    if chunks:
                        processed_chunks.extend(chunks)
                self.save_json(processed_chunks, out_path)
                processed_paths.append(out_path)
                logger.info(f"Generated {len(processed_chunks)} chunks.")
            except Exception as e:
                logger.error(f"Failed to chunk {file_path.name}: {e}")
                
        return processed_paths

    def run_link_stage(
        self, 
        input_dir: Path, 
        output_dir: Path,
        domain: str = None,
        madhhab: str = None,
        book_id: str = None,
        single_file: str = None
    ) -> List[Path]:
        logger.info("--- Starting Stage 3: Entity Linking ---")
        json_files = self.discover_files(
            base_dir=input_dir,
            domain=domain,
            madhhab=madhhab,
            book_id=book_id,
            single_file=single_file
        )
        
        if not json_files:
            logger.warning("No files found to link. Please run 'chunk' stage first.")
            return []
            
        logger.info(f"Found {len(json_files)} files to enrich.")
        processed_paths = []
        
        for file_path in json_files:
            try:
                relative_path = file_path.relative_to(input_dir)
            except ValueError:
                relative_path = Path(file_path.name)
                
            out_path = output_dir / relative_path
            logger.info(f"Linking Entities: {file_path.name} -> {out_path.name}")
            
            try:
                chunks = self.load_json(file_path)
                enriched_chunks = []
                
                parent_count = 0
                ayahs_found = 0
                hadiths_found = 0
                
                for chunk in chunks:
                    if chunk.get("chunk_type") == "parent":
                        chunk = self.linker.link(chunk)
                        parent_count += 1
                        entities = chunk.get("metadata", {}).get("entities", {})
                        ayahs_found += len(entities.get("ayahs", []))
                        hadiths_found += len(entities.get("hadiths", []))
                    enriched_chunks.append(chunk)
                    
                self.save_json(enriched_chunks, out_path)
                processed_paths.append(out_path)
                logger.info(f"Successfully enriched {parent_count} parents. Found {ayahs_found} Ayahs and {hadiths_found} Hadiths.")
            except Exception as e:
                logger.error(f"Failed to link entities in {file_path.name}: {e}")
                
        return processed_paths

    def run(
        self,
        extracted_dir: Path,
        cleaned_dir: Path,
        parent_doc_dir: Path,
        enriched_dir: Path,
        stages: List[str] = None,
        domain: str = None,
        madhhab: str = None,
        book_id: str = None,
        single_file: str = None
    ):
        """Runs the selected preprocessing stages in sequence."""
        if not stages:
            stages = ["clean", "chunk", "link"]
            
        logger.info(f"Starting pipeline with stages: {stages}")
        
        if "clean" in stages:
            self.run_clean_stage(
                input_dir=extracted_dir, 
                output_dir=cleaned_dir,
                domain=domain,
                madhhab=madhhab,
                book_id=book_id,
                single_file=single_file
            )
            
        if "chunk" in stages:
            self.run_chunk_stage(
                input_dir=cleaned_dir, 
                output_dir=parent_doc_dir,
                domain=domain,
                madhhab=madhhab,
                book_id=book_id,
                single_file=single_file
            )
            
        if "link" in stages:
            self.run_link_stage(
                input_dir=parent_doc_dir, 
                output_dir=enriched_dir,
                domain=domain,
                madhhab=madhhab,
                book_id=book_id,
                single_file=single_file
            )
            
        logger.info("Pipeline execution completed successfully.")
