import sys
import logging
from pathlib import Path

# Fix Windows console unicode printing
sys.stdout.reconfigure(encoding="utf-8")

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


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    # format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

from services.ai_rag_engine.app.pipeline.extraction.books_config import SEERAH_BOOKS, TAFSEER_BOOKS, NAHW_SARF_BOOK, HISTORY_BOOKS, HADITH_BOOKS
from services.ai_rag_engine.app.pipeline.extraction.extractor import BookExtractor

BookConfig = {
    **SEERAH_BOOKS,
    **TAFSEER_BOOKS,
    **NAHW_SARF_BOOK,
    **HISTORY_BOOKS,
    **HADITH_BOOKS
}

def main():
    # ----------------------------------------------------
    # ⚙️ CONFIGURATION ZONE
    # ----------------------------------------------------
    START_PAGE_ID = 1
    END_PAGE_ID = None  # None = auto-detect
    RESET_STATE = False  # Set to True to start from scratch and delete existing output
    # ----------------------------------------------------

    for book_id, meta in BookConfig.items():
        domain = meta[0]
        madhhab = meta[1]

        logging.info(f"==================================================")
        logging.info(f"🟢 Starting extraction for book_id: {book_id} | Domain: {domain} | Madhhab: {madhhab}")
        logging.info(f"==================================================")

        extractor = BookExtractor(
            book_id=book_id, custom_domain=domain, custom_madhhab=madhhab
        )

        # Run the extractor
        try:
            extractor.extract(
                start_page=START_PAGE_ID, end_page=END_PAGE_ID, reset=RESET_STATE
            )
            logging.info(f"✅ Successfully completed extraction for book_id: {book_id}")
        except Exception as e:
            logging.error(f"❌ Failed to extract book_id {book_id}. Error: {e}")


if __name__ == "__main__":
    main()
