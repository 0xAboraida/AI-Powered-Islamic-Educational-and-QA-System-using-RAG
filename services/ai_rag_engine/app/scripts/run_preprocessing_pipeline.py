import os
import sys
import logging
import argparse
from pathlib import Path

# Fix Windows console unicode printing
sys.stdout.reconfigure(encoding='utf-8')

# Resolve project root dynamically (find Zad-AI in path)
current_path = Path(__file__).resolve()
project_root = None
for parent in [current_path] + list(current_path.parents):
    if parent.name == "Zad-AI":
        project_root = parent
        break
if not project_root:
    project_root = current_path.parents[4]

sys.path.append(str(project_root))

from services.ai_rag_engine.app.pipeline.preprocessing.data_preprocessing import PreprocessingPipeline

# Configure professional logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("PreprocessingCLI")

def main():
    parser = argparse.ArgumentParser(description="Zad Islamic AI - Preprocessing CLI Runner")
    
    # Stage selectors
    parser.add_argument(
        "--stages", 
        type=str, 
        nargs="+", 
        choices=["clean", "chunk", "link", "all"], 
        default=["all"],
        help="Specify which preprocessing stages to run in sequence (default: all)"
    )
    
    # Data Scope Filters
    parser.add_argument("--domain", type=str, default=None, help="Specific domain folder (e.g. '1- Fiqh', '2- Aqeedah')")
    parser.add_argument("--madhhab", type=str, default=None, help="Specific madhhab folder (e.g. 'hanafi')")
    parser.add_argument("--book-id", type=str, default=None, help="Specific book ID (e.g. '1067')")
    parser.add_argument("--file", type=str, default=None, help="Process a single specific file path directly")
    
    # Stage 1: Clean Parameters
    parser.add_argument(
        "--keep-tashkeel", 
        action="store_true", 
        default=False, 
        help="Keep Arabic diacritics/tashkeel in the cleaned search text (default: False, i.e., remove them for search index)"
    )
    parser.add_argument(
        "--no-normalize-letters", 
        dest="normalize_letters", 
        action="store_false", 
        default=True, 
        help="Disable Arabic character normalization"
    )
    
    # Stage 2: Chunk Parameters
    parser.add_argument("--child-word-size", type=int, default=400, help="Target word count for child chunks.")
    parser.add_argument("--overlap-size", type=int, default=50, help="Word overlap between child chunks.")
    
    # Directory Overrides
    parser.add_argument(
        "--extracted-dir", 
        type=str, 
        default=str(project_root / "data" / "02_extracted"),
        help="Path to raw extracted folder"
    )
    parser.add_argument(
        "--cleaned-dir", 
        type=str, 
        default=str(project_root / "data" / "03_cleaned"),
        help="Path to cleaned folder"
    )
    parser.add_argument(
        "--parent-doc-dir", 
        type=str, 
        default=str(project_root / "data" / "04_parent_document"),
        help="Path to chunked parent folder"
    )
    parser.add_argument(
        "--enriched-dir", 
        type=str, 
        default=str(project_root / "data" / "05_enriched_linked"),
        help="Path to final enriched linked folder"
    )
    
    args = parser.parse_args()
    
    stages_to_run = args.stages
    if "all" in stages_to_run:
        stages_to_run = ["clean", "chunk", "link"]
        
    extracted_dir = Path(args.extracted_dir)
    cleaned_dir = Path(args.cleaned_dir)
    parent_doc_dir = Path(args.parent_doc_dir)
    enriched_dir = Path(args.enriched_dir)
    
    # Initialize the core pipeline class
    pipeline = PreprocessingPipeline(
        remove_tashkeel=not args.keep_tashkeel,
        normalize_letters=args.normalize_letters,
        child_word_size=args.child_word_size,
        overlap_size=args.overlap_size
    )
    
    # Execute the pipeline with scopes and configurations
    pipeline.run(
        extracted_dir=extracted_dir,
        cleaned_dir=cleaned_dir,
        parent_doc_dir=parent_doc_dir,
        enriched_dir=enriched_dir,
        stages=stages_to_run,
        domain=args.domain,
        madhhab=args.madhhab,
        book_id=args.book_id,
        single_file=args.file
    )

if __name__ == "__main__":
    main()
