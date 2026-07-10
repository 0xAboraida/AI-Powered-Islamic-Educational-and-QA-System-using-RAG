<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Data Extraction Phase</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        The data extraction phase is the absolute foundation of Zad-AI. The quality of the Retrieval-Augmented Generation (RAG) pipeline is directly proportional to the quality, cleanliness, and structural integrity of the underlying text data. This document outlines the exhaustive journey of acquiring classical Islamic texts and the sophisticated, state-of-the-art extraction engine we ultimately engineered.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. The Initial Struggle: Al-Maktaba Al-Shamela

Initially, the project relied on scraping data from **Al-Maktaba Al-Shamela** (The Comprehensive Library). We spent a significant amount of time downloading books in HTML format, writing complex BeautifulSoup parsers, and attempting to clean the raw markup. 

**Severe Architectural Flaws:**
1. **Inconsistent Structural Integrity:** The HTML formatting across thousands of books was highly inconsistent. A parser designed for one book would often fail or extract corrupted text for another, leading to a lack of trust in the overarching dataset.
2. **The Citation URL Dilemma (The Dealbreaker):** For a scholarly AI assistant, providing an exact, clickable URL to the specific chapter or issue is non-negotiable. Al-Maktaba Al-Shamela's structure made it nearly impossible to programmatically generate an accurate URL pointing directly to the exact chunk of text used by the LLM. 

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. The Breakthrough: Jame' Al-Kutub Al-Islamiyyah

Realizing that unreliable data would cripple the RAG pipeline, we embarked on a massive research phase, evaluating **over 50 different Islamic library websites and APIs**. 

The breakthrough occurred when we integrated with **Jame' Al-Kutub Al-Islamiyyah (KetabOnline)**. Unlike others, their backend provided a highly structured, JSON-based API that exposed not only the text but also the exact pagination, metadata, and a strict Table of Contents (TOC) hierarchy. Most importantly, it allowed us to map every single extracted chunk to a precise, verifiable URL.

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. The Extraction Engine: An Engineering Masterpiece

Extracting tens of thousands of pages from an API requires more than simple loops. We engineered a highly resilient, asynchronous extraction pipeline (`extractor.py` and `hierarchy_builder.py`) that treats data ingestion as an art form.

#### 3.1. Recursive Hierarchy Building
Before extracting a single page of text, the `HierarchyBuilder` recursively queries the API to construct the entire Table of Contents (up to depth 3). 
- It maps every `page_id` to its corresponding chapter, section, and sub-section.
- It normalizes Arabic titles to ensure exact string matching later in the pipeline.
- This creates a `page_to_items_map` that gives every future chunk an exact academic "address" (e.g., `[Book -> Chapter -> Section]`).

#### 3.2. Highly Concurrent Asynchronous Fetching
To handle massive volumes of data (some books span tens of thousands of pages), the `BookExtractor` utilizes `aiohttp` and `asyncio.Semaphore`. 
- Pages are fetched concurrently in batches of 100.
- Network timeouts and failures are handled gracefully with exponential backoff retries.

#### 3.3. Smart Chunk Merging (The Art of Context)
A common flaw in RAG systems is arbitrary chunking (e.g., cutting text strictly by word count), which destroys semantic meaning. Our engine implements **Smart Merging**:
- As the processor reads a page, it checks the pre-built hierarchy map. 
- If a new paragraph belongs to the **exact same hierarchy** as the previous paragraph, and does not introduce a new title, it merges them together. 
- This ensures that a single Fiqh issue or a continuous thought is kept together in one cohesive chunk, maximizing the LLM's comprehension.

#### 3.4. Resilient State Management
Network drops are inevitable when scraping gigabytes of data. The `StateManager` ensures zero data loss.
- After successfully processing a page and writing it to the JSONL stream, the engine saves its exact state (last page, last chunk, current hierarchy).
- If the script crashes on page 5,432, restarting it will instantly resume from page 5,432, reloading the exact hierarchy context into memory without duplicating data or losing continuity.

#### 3.5. Dynamic Metadata Injection
Every single chunk outputted by the engine is heavily enriched before saving. It injects:
- `book_id` and `title`
- `author` and `author_death_year` (extracted dynamically via RegEx)
- `hijri_century` (calculated for historical timeline filtering)
- `domain` (e.g., Fiqh, Aqeedah) and `madhhab` (e.g., Hanbali, Shafii)
- The exact `source_url` pointing to the KetabOnline page.

</div>