<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
<div style="background-color:#fbeeff; padding:20px; border-left:6px solid purple; border-radius:20px; font-size:16px; color:black; display:block; margin-bottom: 25px;">
    <h2 style="color:Purple; font-weight:bold; margin-top:0;"> Pipeline Execution Guide</h2>
    <p style="margin-bottom:0; line-height:1.6;">
        The Zad-AI data preprocessing pipeline is designed as a highly flexible, production-ready utility. It processes raw Islamic text (from `data/02_extracted`), sanitizes it through the `ArabicTextCleaner`, applies the Parent-Child chunking strategy, and ultimately produces the finalized datasets ready for database insertion. Thanks to dynamic Python path resolution, you can run these scripts from any directory context.
    </p>
</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 1. Global Execution (Process Everything)

If you intend to process **all** books across all domains and madhhabs currently stored in the raw extraction directory:

* **From the project root (`Zad-AI/`):**


python services/ai_rag_engine/app/scripts/01_clean_data.py
```

* **From within the `scripts/` directory:**

```bash
cd services/ai_rag_engine/app/scripts
python 01_clean_data.py
```

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 2. Domain-Specific Execution

To optimize computational resources, you can target specific domains (e.g., Fiqh, Aqeedah, Tafseer) using the `--domain` flag:

```bash
python 01_clean_data.py --domain "1- Fiqh"
# or
python 01_clean_data.py --domain "4- Tafseer"
```

*The script will recursively scan `data/02_extracted/1- Fiqh/`, process the files, and recreate the exact same folder structure inside the output directory.*

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 3. Madhhab-Specific Execution

For even finer granularity, you can chain the `--domain` and `--madhhab` flags to process texts belonging to a specific school of jurisprudence (e.g., Hanafi):

```bash
python 01_clean_data.py --domain "1- Fiqh" --madhhab "hanafi"
```

*This restricts the pipeline to execute solely on files located within `data/02_extracted/1- Fiqh/hanafi/`.*

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 4. Book-Specific Execution (By ID)

If you are iterating or debugging a single text (e.g., *Al-Hidayah*, Book ID `1067`), you can execute the pipeline via the `--book-id` flag:

```bash
python 01_clean_data.py --book-id "1067"
```

*The engine will dynamically search the entire input directory for any file matching the prefix `book_1067_` and process it independently.*

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

### 5. Direct File & Advanced Paths

To process a specific JSON file directly using an absolute or relative file path:

```bash
python 01_clean_data.py --file "path/to/your/book.json"
```

By default, the pipeline reads from `data/02_extracted` and writes to `data/03_cleaned`. You can completely override these target directories during execution:

```bash
python 01_clean_data.py --input-dir "custom/input/path" --output-dir "custom/output/path"
```

</div>

<div style="background-color:#fcf8fd; padding:20px; border-left:4px solid purple; border-radius:12px; font-size:16px; color:black; display:block; margin-bottom: 25px;">

###  Internal Architecture Note
When the script runs, the `discover_files` method dynamically walks the input directory tree (`glob("**/*.json")`) and applies the CLI filters. The `relative_to` method ensures that the output files are saved in the exact same hierarchical folder structure (Domain/Madhhab) to maintain pristine project organization.

</div>

</div>