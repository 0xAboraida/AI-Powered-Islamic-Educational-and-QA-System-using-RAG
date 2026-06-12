# Zad Islamic AI - Preprocessing Pipeline Guide

This guide explains how to run, configure, and programmatic-interact with the text preprocessing pipeline for the Zad Islamic AI RAG engine.

The preprocessing pipeline is divided into three distinct stages:
1. **Clean**: Normalizes Arabic letters, cleans extra spaces/newlines, and separates the text into two fields: `content` (cleaned/stripped of tashkeel for optimal search embeddings) and `original_content` (retains full tashkeel/diacritics for display/generation).
2. **Chunk**: Segments the cleaned document into parent-child chunks, producing parallel `content` and `original_content` segments.
3. **Link**: Automatically detects Quranic Ayahs and Prophetic Hadiths in parent chunks, linking them as metadata.

---

## 🏛️ Pipeline Architecture & Dual Representation

The pipeline follows a clean, decoupled architecture:
* **Core Engine (`app/pipeline/preprocessing/preprocessing_pipeline.py`)**: Contains the `PreprocessingPipeline` class, which holds all execution logic, file operations, and stage processing loops.
* **CLI Wrapper (`app/scripts/run_preprocessing_pipeline.py`)**: A thin command-line interface wrapper that parses terminal arguments and calls the core engine.

### 🎭 Dual Representation Pattern

To ensure optimal embedding matching while displaying beautifully diacritized classical texts to users, every chunk in the output contains:
* **`content`**: The cleaned, normalized text without tashkeel (used for search indexing/vectorization).
* **`original_content`**: The original raw text with full tashkeel/diacritics (used for LLM context generation and user citations).

---

## 🛠️ Method 1: Running via Command Line Interface (CLI)

The CLI script is located at:
`services/ai_rag_engine/app/scripts/run_preprocessing_pipeline.py`

You can run it from the root of the project or from within the `scripts` folder.

### CLI Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `--stages` | List | `all` | Stages to execute. Choices: `clean`, `chunk`, `link`, `all`. |
| `--domain` | String | `None` | Process only books in this domain folder (e.g., `"1- Fiqh"`). |
| `--madhhab` | String | `None` | Process only books in this madhhab folder (e.g., `"hanafi"`). |
| `--book-id` | String | `None` | Process a specific book by ID (e.g., `"1067"`). |
| `--file` | String | `None` | Direct path to process a single JSON file. |
| `--keep-tashkeel` | Flag | `False` | Include this flag to keep Arabic diacritics (tashkeel) in the `content` field. By default, they are stripped for optimal embeddings. |
| `--no-normalize-letters`| Flag | `True` | Include this flag to disable character normalization. |
| `--child-word-size` | Integer| `400` | Word limit for child chunks. |
| `--overlap-size` | Integer| `50` | Word overlap size for child chunks. |

### CLI Execution Examples

#### 1. Run the entire pipeline on the Hanafi corpus (Default: Strip Tashkeel for Search, Keep for Display)
```bash
python services/ai_rag_engine/app/scripts/run_preprocessing_pipeline.py --domain "1- Fiqh" --madhhab "hanafi"
```

#### 2. Run the pipeline keeping Tashkeel in the search index
```bash
python services/ai_rag_engine/app/scripts/run_preprocessing_pipeline.py --domain "1- Fiqh" --madhhab "hanafi" --keep-tashkeel
```

#### 3. Run only the Text Cleaning stage
```bash
python services/ai_rag_engine/app/scripts/run_preprocessing_pipeline.py --domain "1- Fiqh" --stages clean
```

#### 4. Run for a single specific book ID
```bash
python services/ai_rag_engine/app/scripts/run_preprocessing_pipeline.py --book-id "1067"
```

---

## 🐍 Method 2: Running Programmatically (Python API)

Since the execution logic is fully decoupled, you can easily trigger the pipeline inside other modules (e.g., FastAPI endpoints, Celery tasks, or Jupyter Notebooks):

```python
from pathlib import Path
from services.ai_rag_engine.app.pipeline.preprocessing import PreprocessingPipeline

# 1. Initialize the pipeline with desired settings
pipeline = PreprocessingPipeline(
    remove_tashkeel=True,         # Strips tashkeel in search "content" field (recommended)
    normalize_letters=True,       # Normalize hamzas and special letters
    child_word_size=400,          # Set target chunk size
    overlap_size=50               # Set overlap size
)

# 2. Run the pipeline
pipeline.run(
    extracted_dir=Path("data/02_extracted"),
    cleaned_dir=Path("data/03_cleaned"),
    parent_doc_dir=Path("data/04_parent_document"),
    enriched_dir=Path("data/05_enriched_linked"),
    stages=["clean", "chunk", "link"],  # Choose stages to execute
    domain="1- Fiqh",
    madhhab="hanafi",
    book_id="1067"
)
```

---

## 📂 Preprocessing Stages Directory Schema

| Stage | Input Directory | Output Directory | Output Name Format |
| :--- | :--- | :--- | :--- |
| **1. Clean** | `data/02_extracted/` | `data/03_cleaned/` | `book_<id>_<name>.json` |
| **2. Chunk** | `data/03_cleaned/` | `data/04_parent_document/` | `book_<id>_chunks.json` |
| **3. Link** | `data/04_parent_document/` | `data/05_enriched_linked/` | `book_<id>_chunks.json` |
