# 🔄 Data Extraction Pipeline Flow

This document outlines the architecture and execution flow of the Data Extraction Pipeline (Stage 0) for the Zad-AI project. The extraction pipeline is designed to be highly robust, resilient to server crashes, and guarantees zero data loss during the ingestion of Islamic books.

## 📁 Architecture & Components

The pipeline has been modularized into several key components located in `services/ai_rag_engine/app/pipeline/extraction/`:

1. **`api_client.py`**: The network layer. Handles all HTTP requests to the source servers with a robust retry strategy (auto-recovers from 500/502/503/504 errors).
2. **`text_utils.py`**: The helper layer. Normalizes Arabic text, builds smart Regular Expressions, and extracts metadata like death years and Hijri centuries.
3. **`hierarchy_builder.py`**: The index layer. Fetches the hierarchical Table of Contents (TOC) of the book recursively up to 3 levels deep, and maps them to their respective pages.
4. **`html_processor.py`**: The parsing layer. Uses BeautifulSoup to clean HTML, separates section titles from body paragraphs, and splits the page into logical chunks.
5. **`state_manager.py`**: The safety layer. Uses atomic writes to save the exact state of the extraction (current page and buffered chunk) to disk, ensuring 0% data loss upon unexpected termination. Includes `JSONStreamer` for safe appending to the final array.
6. **`extractor.py`**: The Orchestrator (Maestro). Ties all the components together, manages the main loop, and coordinates state saving.
7. **`run_extraction.py`**: The entry point. Where developers configure settings (Book ID, Domain, Madhhab) and initiate the process.

---

## 🗺️ Execution Flow

The following Mermaid diagram illustrates the step-by-step lifecycle of extracting a single book.

```mermaid
sequenceDiagram
    participant User as run_extraction.py
    participant Extractor as extractor.py
    participant API as api_client.py
    participant Hierarchy as hierarchy_builder.py
    participant State as state_manager.py
    participant HTML as html_processor.py
    participant JSON as JSONStreamer

    User->>Extractor: Start Extraction (Book ID)
    
    %% Setup Phase
    Extractor->>Hierarchy: Fetch Book Index & TOC
    Hierarchy->>API: Request TOC Data
    API-->>Hierarchy: JSON Response
    Hierarchy-->>Extractor: Parsed TOC Map
    
    %% Resume Phase
    Extractor->>State: Load previous state?
    alt State exists
        State-->>Extractor: Resume from Page X, Last Chunk Y
    else No state
        State-->>Extractor: Start from Page 1
    end

    %% Main Extraction Loop
    loop For each Page (Page X to End)
        Extractor->>API: Download Page HTML
        
        alt Server Error / Timeout
            API-->>Extractor: Null / Fail
            Note right of Extractor: Skip page, do NOT update state.<br/>Chunk is kept safely in memory.
        else Success
            API-->>Extractor: Page HTML
            Extractor->>HTML: Parse HTML, normalize text, match TOC
            HTML-->>Extractor: List of Extracted Chunks
            
            loop For each Chunk
                alt Same Section (Hierarchy) as Last Chunk
                    Extractor->>Extractor: Merge text into Last Chunk
                else New Section
                    Extractor->>JSON: Append Last Chunk to output file
                    JSON-->>Extractor: Saved to disk
                    Extractor->>Extractor: Make New Chunk the Last Chunk
                end
            end
            
            %% Crucial Checkpoint Step
            Extractor->>State: Save Checkpoint (Page X+1, Last Chunk)
            Note over State: Atomic Write to .state.json<br/>Zero Data Loss Guarantee
        end
    end

    %% Finalization Phase
    Extractor->>JSON: Append Final Last Chunk
    Extractor->>State: Clear State File
    Extractor-->>User: Extraction Completed Successfully!
```

## 🛡️ Zero Data Loss Guarantee
The most critical feature of this pipeline is its resilience. During text extraction, text from multiple pages might belong to the same logical section (Hierarchy). This text is temporarily held in a memory buffer (`last_chunk`). 

If the script crashes before a new section begins, traditional scripts lose this buffer entirely. However, the `StateManager` mitigates this by aggressively writing the contents of the memory buffer alongside the current page pointer to a local file (`.state.json`) after *every single successful page extraction*. Upon restarting, the script seamlessly reloads the buffer and resumes exactly where it left off.

---

## 🌳 Logic Flowchart

Here is an alternative view using a standard Flowchart, which focuses on the logic and decision-making process during the extraction loop.

```mermaid
flowchart TD
    Start([Start Extraction]) --> Setup[Fetch Book Index & Meta]
    Setup --> CheckState{Load State?}
    
    CheckState -- Yes --> Resume[Resume from Page X<br>Load last_chunk buffer]
    CheckState -- No --> StartPage[Start from Page 1<br>Empty buffer]
    
    Resume --> LoopStart
    StartPage --> LoopStart
    
    LoopStart{Are there more pages?}
    
    LoopStart -- Yes --> Download[Download Page HTML]
    
    Download --> CheckAPI{API Request<br>Successful?}
    
    CheckAPI -- No --> LogSkip[Log Error & Skip Page<br>Do NOT update state]
    LogSkip --> LoopStart
    
    CheckAPI -- Yes --> Parse[Parse HTML & Clean Text]
    Parse --> Chunks[Split into logical Chunks]
    Chunks --> ChunkLoop{Iterate Chunks}
    
    ChunkLoop -- Next Chunk --> CheckHierarchy{Same Section as<br>last_chunk?}
    
    CheckHierarchy -- Yes --> Merge[Merge text into<br>last_chunk buffer]
    Merge --> ChunkLoop
    
    CheckHierarchy -- No --> WriteJSON[Write last_chunk to JSON<br>Make new chunk the last_chunk]
    WriteJSON --> ChunkLoop
    
    ChunkLoop -- No more chunks --> SaveState[Save Checkpoint to Disk<br>Page X+1, last_chunk buffer]
    SaveState --> LoopStart
    
    LoopStart -- No (End of Book) --> FinalWrite[Write final last_chunk<br>to JSON file]
    FinalWrite --> ClearState[Delete .state.json file]
    ClearState --> End([End Extraction])
```
