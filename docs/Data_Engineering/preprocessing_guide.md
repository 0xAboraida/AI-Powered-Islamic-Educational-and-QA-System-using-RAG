<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Preprocessing Pipeline Guide</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        The preprocessing pipeline acts as the bridge between the raw, extracted HTML/JSON data and the Vector Database. In classical Islamic texts, preprocessing is exceptionally complex due to the heavy use of Arabic diacritics (Tashkeel), varying bracket notations for titles, and the presence of embedded Quranic and Prophetic texts. Zad-AI implements a highly modular, two-stage preprocessing engine designed for optimal semantic retrieval and accurate Language Model generation.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. Pipeline Architecture

The core engine is located in `preprocessing_pipeline.py`. It orchestrates two distinct sequential stages:
1. **Clean Stage:** Text normalization and noise reduction.
2. **Chunk Stage:** Parent-Child segmentation.

A massive architectural advantage of this pipeline is its **Dual Representation System**. Throughout all stages, the pipeline maintains two parallel fields for every chunk:
* `original_content`: The raw text, completely untouched, preserving all Tashkeel (diacritics) and original formatting. This is the text passed to the LLM for final generation and displayed to the user, ensuring scholarly accuracy.
* `content`: A highly normalized, stripped version of the text used exclusively for mathematical embedding (BGE-M3) and vector search.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Stage 1: Text Cleaning (`cleaner.py`)

Classical Arabic texts require aggressive normalization to ensure that the Vector Database can accurately calculate cosine similarity. The `ArabicTextCleaner` performs the following operations:

#### 2.1. Tashkeel Removal
Diacritics significantly alter the mathematical embedding of a word, causing a query without Tashkeel to miss a document with Tashkeel. The cleaner mathematically strips all characters in the Unicode ranges `[\u0617-\u061A\u064B-\u0652...]`, converting the text to plain Arabic letters.

#### 2.2. Title Normalization
Books often wrap their chapter titles in decorative brackets, such as `[كتاب السهو]`, `(باب الطهارة)`, or `{فصل}`. The cleaner uses regular expressions to recursively strip these outer wrappers, ensuring that the hierarchy metadata is clean and matches exact queries.

#### 2.3. Noise and Redundancy Reduction
* Removes section markers (e.g., `§`).
* Normalizes infinite whitespaces and line breaks into single spaces.
* **Smart Dropping:** The pipeline intelligently drops chunks that are entirely empty after cleaning, or chunks whose content is absolutely identical to their chapter title (preventing redundant embeddings).

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Stage 2: Parent-Child Chunking (`chunker.py`)

Once the text is perfectly clean, the pipeline executes the chunking algorithm. 
Instead of a standard sliding window, Zad-AI utilizes a **Parent-Child architecture**. The pipeline slices the Fiqh issue or chapter into:
* **Child Chunks:** Small, highly focused segments (e.g., 400 words) with overlapping boundaries. These are strictly used for dense vector search in Qdrant.
* **Parent Documents:** The overarching context that houses the child chunks.

*(Note: The exact algorithmic mathematics behind the chunking logic is detailed comprehensively in `chunking_strategy.md`).*

</div>
</div>