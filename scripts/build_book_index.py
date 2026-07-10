import os
import re
import json
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "02_extracted"
EXTRACTION_DIR = PROJECT_ROOT / "services" / "ai_rag_engine" / "app" / "pipeline" / "extraction"
OUTPUT_FILE = EXTRACTION_DIR / "extracted_books_index.json"

def extract_books_metadata():
    """
    Scans the 02_extracted directory for JSON files.
    Reads only the first few lines of each file to extract `id` and `title`.
    Saves the result to a small JSON index.
    """
    if not DATA_DIR.exists():
        print(f"❌ Error: Data directory not found at {DATA_DIR}")
        return

    print(f"Scanning directory: {DATA_DIR} ...")
    
    books_index = {}
    total_files = 0
    successful_extractions = 0

    # Compile regex for fast extraction
    id_pattern = re.compile(r'"id"\s*:\s*(\d+)')
    title_pattern = re.compile(r'"title"\s*:\s*"([^"]+)"')

    # Walk through all directories and files
    for root, _, files in os.walk(DATA_DIR):
        for file in files:
            if not file.endswith(".json"):
                continue
                
            total_files += 1
            file_path = Path(root) / file
            
            # Fast parse: Read line by line until both id and title are found
            # This prevents loading huge 100MB+ JSON files into memory
            book_id = None
            book_title = None
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    for i, line in enumerate(f):
                        # Stop searching after 50 lines (it should be in the very first object)
                        if i > 50:
                            break
                            
                        if book_id is None:
                            match_id = id_pattern.search(line)
                            if match_id:
                                book_id = int(match_id.group(1))
                                
                        if book_title is None:
                            match_title = title_pattern.search(line)
                            if match_title:
                                book_title = match_title.group(1)
                                
                        if book_id is not None and book_title is not None:
                            books_index[book_title] = book_id
                            successful_extractions += 1
                            break
            except Exception as e:
                print(f"Error reading {file.name}: {e}")

    # Save to JSON
    try:
        EXTRACTION_DIR.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_FILE, "w", encoding="utf-8") as out_f:
            json.dump(books_index, out_f, ensure_ascii=False, indent=4)
        print(f"Successfully extracted {successful_extractions} books from {total_files} files.")
        print(f"Index saved to: {OUTPUT_FILE}")
    except Exception as e:
        print(f"Error saving index: {e}")

if __name__ == "__main__":
    extract_books_metadata()
