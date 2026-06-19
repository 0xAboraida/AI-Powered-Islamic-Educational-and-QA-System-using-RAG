# 🐛 Bug Report: Citation URL Navigating to Incorrect Page

**Date:** 2026-06-15  
**Affected Module:** `services/ai_rag_engine/app/pipeline/extraction/html_processor.py`  
**Status:** ✅ Resolved

---

## 📌 Issue Description

When a user clicked the **"Open Original Source"** button in the UI, the website always navigated to the **first page of the book** rather than the specific page containing the cited text.

---

## 🔍 Root Cause

### What went wrong?

In the `create_chunk()` function inside `html_processor.py` (around line 63), the `source_url` was being constructed like this:

```python
# ❌ Old Incorrect Code
"source_url": f"https://ketabonline.com/ar/books/{book_meta['id']}/read"
              f"?part={page_data.get('part', {}).get('name', '1')}"
              f"&page={page_num}"
```

### Why was this incorrect?

There are two different variables representing a page:

| Variable | Value Example | Meaning |
|----------|---------------|---------|
| `page_num` | `"42"` or `42` | The **printed** page number in the physical book. |
| `db_page_id` | `198473` | The internal page ID in ketabonline's database. |

The old code used `page_num` (the printed page number) in the URL query string. However, **ketabonline.com completely ignores** the `?page=` query parameter and defaults to opening the book from the very first page. 

The website only understands the **URL format** that utilizes the `/pages/{db_page_id}` path segment.

### URL Examples

```text
# ❌ Old URL — Always opens the first page of the book
https://ketabonline.com/ar/books/2130/read?part=1&page=42

# ✅ Correct URL — Opens the exact page containing the text
https://ketabonline.com/ar/books/2130/pages/198473
```

---

## 🛠️ Implemented Fix

```python
# ✅ New Correct Code
direct_page_url = (
    f"https://ketabonline.com/ar/books/{book_meta['id']}/pages/{db_page_id}"
)
chunk = {
    ...
    "page_id": db_page_id,       # Internal DB page ID (for the URL)
    "printed_page": page_num,    # Printed page number (for UI display)
    "source_url": direct_page_url,
}
```

**Key Difference:**
- `db_page_id` = `page_data.get('id')` ← Ketabonline's internal ID
- `page_num` = `page_data.get('page')` ← Printed book page number

---

## ⚠️ Impact on Existing Data

> [!WARNING]
> This fix applies automatically only to **newly extracted books**.
> The data currently stored in MongoDB still contains the old, broken URLs.

### Options to handle existing data:

**Option 1 — Migration Script (Fastest):**  
Write a script to update the `metadata.source_url` field for every document in MongoDB based on its existing `metadata.page_id`:
```python
# For each document in MongoDB:
new_url = f"https://ketabonline.com/ar/books/{doc['metadata']['book_id']}/pages/{doc['metadata']['page_id']}"
collection.update_one({"_id": doc["_id"]}, {"$set": {"metadata.source_url": new_url}})
```

**Option 2 — Full Re-extraction (Most Accurate):**  
Re-run `run_extraction.py` for all books to rebuild the data directly from the API. This guarantees 100% metadata accuracy but is significantly slower.

---

## 📁 Affected Layers

| Component | Change |
|-----------|--------|
| `extraction/html_processor.py` | ✅ Modified `create_chunk()` to use `db_page_id` |
| MongoDB collections (Existing Data) | ⚠️ Requires database migration or full re-extraction |
