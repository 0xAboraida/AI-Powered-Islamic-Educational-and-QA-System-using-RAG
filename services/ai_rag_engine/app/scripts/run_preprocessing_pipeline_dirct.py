import sys
import logging
from pathlib import Path

# Fix Windows console unicode printing
sys.stdout.reconfigure(encoding='utf-8')

# Resolve project root dynamically and add it to system path
current_path = Path(__file__).resolve()
project_root = None
for parent in [current_path] + list(current_path.parents):
    if parent.name == "Zad-AI":
        project_root = parent
        break
if not project_root:
    project_root = current_path.parents[4]

if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Configure professional logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

from services.ai_rag_engine.app.pipeline.preprocessing.data_preprocessing import PreprocessingPipeline

def main():
    # ----------------------------------------------------
    # ⚙️ CONFIGURATION ZONE (Change variables here directly)
    # ----------------------------------------------------
    REMOVE_TASHKEEL = True        # Strips tashkeel in search "content" field (keeps it in original_content)
    NORMALIZE_LETTERS = True      # Normalize hamzas and special letters
    CHILD_WORD_SIZE = 400         # Word limit for child chunks
    OVERLAP_SIZE = 50             # Overlap size between child chunks
    
    # Scope filters:
    # 1. DOMAIN: 
    #    - Set to None to run ALL domains (e.g., Fiqh, Aqeedah, Tafseer, etc.)
    #    - Set to a single string (e.g., "1- Fiqh") to run a specific domain.
    #    - Set to a list of strings (e.g., ["1- Fiqh", "2- Aqeedah"]) to run specific domains.
    DOMAIN = "09_Hadith"
    
    # 2. MADHHAB: 
    #    - Set to None to run ALL madhhabs in the domain.
    #    - Set to a single string (e.g., "hanafi") to run a specific madhhab.
    #    - Set to a list of strings (e.g., ["hanafi", "maliki"]) to run specific madhhabs.
    MADHHAB = None
    
    # 3. BOOK_ID:
    #    - Set to None to run ALL books.
    #    - Set to a single string/int (e.g., "1067" or 1067) to run a specific book.
    #    - Set to a list of strings/ints (e.g., [1067, 1068, "1069"]) to run specific books.
    BOOK_ID = None
    
    # 4. SINGLE_FILE: Direct path to process a single JSON file or None
    SINGLE_FILE = None
    
    STAGES = ["clean", "chunk"]  # e.g., ["clean"], ["clean", "chunk"], or ["clean", "chunk", "link"]
    # ----------------------------------------------------

    # Resolve data paths relative to project root
    
    extracted_dir = project_root / "data" / "02_extracted"
    cleaned_dir = project_root / "data" / "03_cleaned"
    parent_doc_dir = project_root / "data" / "04_parent_document"
    enriched_dir = project_root / "data" / "05_enriched_linked"

    # 1. Initialize the pipeline with settings
    pipeline = PreprocessingPipeline(
        remove_tashkeel=REMOVE_TASHKEEL,
        normalize_letters=NORMALIZE_LETTERS,
        child_word_size=CHILD_WORD_SIZE,
        overlap_size=OVERLAP_SIZE
    )

    # 2. Run the pipeline
    pipeline.run(
        extracted_dir=extracted_dir,
        cleaned_dir=cleaned_dir,
        parent_doc_dir=parent_doc_dir,
        enriched_dir=enriched_dir,
        stages=STAGES,
        domain=DOMAIN,
        madhhab=MADHHAB,
        book_id=BOOK_ID,
        single_file=SINGLE_FILE
    )

if __name__ == "__main__":
    main()
