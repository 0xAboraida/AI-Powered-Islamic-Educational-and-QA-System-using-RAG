import json
import logging
from pathlib import Path
from typing import Dict

logger = logging.getLogger(__name__)

# Path to the dynamically generated index
INDEX_FILE = Path(__file__).parent / "extracted_books_index.json"

DYNAMIC_KNOWN_BOOKS: Dict[str, int] = {}

def _load_dynamic_books():
    """
    Loads the dynamically built index of books from extracted JSON files.
    This replaces the need for hardcoding massive dictionaries.
    To update the index, run: python scripts/build_book_index.py
    """
    global DYNAMIC_KNOWN_BOOKS
    if INDEX_FILE.exists():
        try:
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                DYNAMIC_KNOWN_BOOKS = json.load(f)
            logger.info(f"[DynamicBooks] Loaded {len(DYNAMIC_KNOWN_BOOKS)} books into the dictionary")
        except Exception as e:
            logger.error(f"[DynamicBooks] Failed to load extracted books index: {e}")
    else:
        logger.warning(
            f"[DynamicBooks] extracted_books_index.json not found at {INDEX_FILE}. "
            "Please run `python scripts/build_book_index.py`."
        )

# Load the books on module import
_load_dynamic_books()

# Expose the keys as a list for difflib fuzzy matching
KNOWN_BOOK_TITLES = list(DYNAMIC_KNOWN_BOOKS.keys())
