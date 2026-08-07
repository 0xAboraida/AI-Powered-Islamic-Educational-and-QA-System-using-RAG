import logging
import database

logger = logging.getLogger(__name__)

# In-memory cache for the library tree
_cached_tree = None


def normalize_path(chunk_path, domain="غير محدد", madhhab="غير محدد", book_title="كتاب غير معروف"):
    """
    Normalizes the path from MongoDB to a flat list of strings.
    Handles various Zad metadata formats.
    """
    path_list = []
    
    if not chunk_path:
        path_list = ["بدون عنوان"]
    elif isinstance(chunk_path, list):
        path_list = [str(p) for p in chunk_path]
    elif isinstance(chunk_path, dict):
        if "kitab" in chunk_path:
            path_list.append(str(chunk_path["kitab"]))
        
        sections = chunk_path.get("sections", [])
        if isinstance(sections, list):
            path_list.extend([str(s) for s in sections])
        elif isinstance(sections, str):
            path_list.append(sections)
            
        if not path_list:
            path_list = ["عناوين فرعية"]
    else:
        path_list = [str(chunk_path)]
        
    # Prepend Book, Madhhab, and Domain
    # We want: Domain -> Madhhab -> Book Title -> Path...
    # Reverse order insertion:
    if path_list[0] != book_title:
        path_list.insert(0, str(book_title))
        
    if madhhab and madhhab != "غير محدد":
        path_list.insert(0, str(madhhab))
        
    if domain and domain != "غير محدد":
        path_list.insert(0, str(domain))
        
    return path_list


# Global status tracker for Admin UI
build_status = {
    "is_building": False,
    "current_book": "",
    "chunks_processed": 0,
    "total_expected": 0,
    "cancel_requested": False
}

def unformat_tree_from_flutter(flutter_tree_list):
    """
    Converts a flutter formatted list back to a nested tree dict structure.
    Used for incremental tree merging.
    """
    tree_dict = {}
    if not flutter_tree_list: return tree_dict
    
    for node in flutter_tree_list:
        title = node["title"]
        tree_dict[title] = {
            "title": title,
            "chunk_id": node.get("chunk_id"),
            "is_new": node.get("is_new", False),
            "children": unformat_tree_from_flutter(node.get("children", []))
        }
    return tree_dict

async def build_library_tree(force_refresh: bool = False, book_names: list = None):
    """
    Builds the library tree dynamically based on the 'path' field from Zad metadata.
    """
    global _cached_tree, build_status
    
    if not force_refresh and _cached_tree is not None and not book_names:
        logger.info("Returning library tree from local memory cache...")
        return _cached_tree

    if not database.chunk_collections:
        logger.error("No chunk collections initialized.")
        return []

    logger.info(f"Building library tree from MongoDB... Filters: {book_names}")
    
    query = {}
    if book_names:
        query = {"metadata.book_title": {"$in": book_names}}

    # For progress tracking
    build_status["is_building"] = True
    build_status["cancel_requested"] = False
    build_status["chunks_processed"] = 0
    build_status["current_book"] = "بدء التحميل..."
    
    total_expected = 0
    for col in database.chunk_collections:
        try:
            total_expected += await col.count_documents(query)
        except:
            pass
    build_status["total_expected"] = total_expected

    tree = {}
    
    # --- INCREMENTAL MERGE LOGIC ---
    # If building specific books, load the existing master tree and append to it!
    if book_names:
        existing_master = await get_tree_from_cache(book_names=None)
        if existing_master:
            tree = unformat_tree_from_flutter(existing_master)
            logger.info("Loaded master tree for incremental merge.")
            
    chunk_count = 0
    processed_books = set()

    import asyncio
    try:
        for col in database.chunk_collections:
            # Optimize cursor by increasing batch size
            cursor = col.find(query, {"_id": 1, "path": 1, "metadata": 1}).batch_size(5000)
            
            while True:
                if build_status.get("cancel_requested"):
                    logger.warning("Build cancelled by user!")
                    build_status["is_building"] = False
                    return None
                    
                # Fetch explicitly in large batches to prevent motor cursor hang
                batch = await cursor.to_list(length=5000)
                if not batch:
                    break
                    
                for doc in batch:
                    chunk_count += 1
                    build_status["chunks_processed"] = chunk_count
                    
                    chunk_id = str(doc["_id"])

                    metadata = doc.get("metadata", {})
                    raw_path = doc.get("path", metadata.get("path", metadata.get("hierarchy", [])))
                    book_title = metadata.get("book_title", metadata.get("source", "كتاب غير معروف"))
                    domain = metadata.get("domain", "غير محدد")
                    madhhab = metadata.get("madhhab", "غير محدد")
                    
                    # Log when we start seeing a new book
                    if book_title not in processed_books:
                        logger.info(f"📚 جاري معالجة كتاب: {book_title} (المجال: {domain} | المذهب: {madhhab}) ...")
                        processed_books.add(book_title)
                        build_status["current_book"] = book_title

                    path_list = normalize_path(raw_path, domain=domain, madhhab=madhhab, book_title=book_title)

                    # Insert into tree
                    current_level = tree
                    for i, node_name in enumerate(path_list):
                        if node_name not in current_level:
                            current_level[node_name] = {
                                "title": node_name,
                                "children": {},
                                "chunk_id": None,
                            }
                            
                            # Tag as NEW if we are appending a new book and this is the book level (or below)
                            if book_names and i >= 2:
                                current_level[node_name]["is_new"] = True

                        if i == len(path_list) - 1:
                            if current_level[node_name]["chunk_id"] is None:
                                current_level[node_name]["chunk_id"] = chunk_id

                        current_level = current_level[node_name]["children"]
                        
                # Yield control to the event loop after every batch to keep UI polling alive
                await asyncio.sleep(0.05)
                logger.info(f"⏳ Progress: Processed {chunk_count} chunks so far...")

        logger.info(f"✅ Tree built successfully from a total of {chunk_count} chunks.")
    except Exception as e:
        logger.error(f"❌ Error during tree build: {e}")
        
    build_status["is_building"] = False
    _cached_tree = tree
    return _cached_tree


def format_tree_for_flutter(tree_dict):
    """
    Converts the nested dict into a list of nested objects which is usually
    easier to parse in Flutter/Dart.
    """
    result = []
    for key, value in tree_dict.items():
        node = {
            "title": value["title"],
            "chunk_id": value["chunk_id"],
            "children": format_tree_for_flutter(value["children"]),
        }
        if value.get("is_new"):
            node["is_new"] = True
            
        result.append(node)
    return result

import zlib
import json
from bson.binary import Binary

async def save_tree_to_cache(flutter_tree: list, book_names: list = None):
    """
    Saves the processed flutter tree to MongoDB system_cache collection.
    ALWAYS saves to 'library_tree_v1' to maintain a unified master library.
    Uses zlib compression to bypass MongoDB's 16MB document limit.
    """
    if database.system_cache_collection is None:
        logger.error("system_cache_collection not initialized.")
        return False
        
    cache_id = "library_tree_v1"
        
    from datetime import datetime
    
    # Compress the JSON tree
    json_str = json.dumps(flutter_tree, ensure_ascii=False)
    compressed_data = zlib.compress(json_str.encode("utf-8"))
    binary_data = Binary(compressed_data)
    
    await database.system_cache_collection.update_one(
        {"_id": cache_id},
        {
            "$set": {
                "tree_data_compressed": binary_data,
                "last_updated": datetime.utcnow().isoformat()
            }
        },
        upsert=True
    )
    logger.info(f"Tree saved to cache successfully with ID: {cache_id} (Compressed Size: {len(compressed_data) / 1024 / 1024:.2f} MB)")
    return True

async def get_tree_from_cache(book_names: list = None):
    """
    Retrieves the tree from MongoDB system_cache collection.
    ALWAYS retrieves from 'library_tree_v1' (master cache).
    """
    if database.system_cache_collection is None:
        return None
        
    cache_id = "library_tree_v1"
        
    cached_doc = await database.system_cache_collection.find_one({"_id": cache_id})
    if cached_doc:
        logger.info(f"Tree loaded from cache instantly for ID: {cache_id}")
        
        # Support both compressed and old uncompressed formats
        if "tree_data_compressed" in cached_doc:
            decompressed_data = zlib.decompress(cached_doc["tree_data_compressed"])
            return json.loads(decompressed_data.decode("utf-8"))
        elif "tree_data" in cached_doc:
            return cached_doc.get("tree_data")
            
    return None
