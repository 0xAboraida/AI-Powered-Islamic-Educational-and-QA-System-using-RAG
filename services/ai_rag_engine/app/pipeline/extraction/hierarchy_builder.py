import json
import time
from pathlib import Path
from typing import Dict, Any, List
import logging
import aiohttp
import asyncio

from .api_client import KetabOnlineAPIClient
from .text_utils import normalize_arabic, normalize_title

logger = logging.getLogger(__name__)

class HierarchyBuilder:
    def __init__(self, api_client: KetabOnlineAPIClient, cache_dir: Path):
        self.api_client = api_client
        self.cache_dir = cache_dir

    def fetch_recursive_index(self, book_id: int, parent_id: int, depth: int = 0) -> List[Dict]:
        if depth > 2: return []
        url = f'https://backend.ketabonline.com/api/v2/books/{book_id}/index/{parent_id}'
        r = self.api_client.get(url)
        if not r: return []
        
        data = r.json().get('data', [])
        all_items = []
        for item in data:
            all_items.append(item)
            children = self.fetch_recursive_index(book_id, item['id'], depth + 1)
            all_items.extend(children)
            if children: time.sleep(0.05)
        return all_items

    def fetch_book_info(self, book_id: int) -> Dict:
        cache_file = self.cache_dir / f'index_cache_{book_id}.json'
        if cache_file.exists():
            logger.info(f"Loading Index from cache for book {book_id}")
            with open(cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)

        logger.info(f"Fetching Book Info and Full Index for {book_id}...")
        url = f'https://backend.ketabonline.com/api/v2/books/{book_id}'
        r = self.api_client.get(url)
        if not r: return None
        
        book_data = r.json()['data']
        top_index = book_data.get('index', [])
        full_index = []
        
        for i, item in enumerate(top_index):
            logger.info(f"Fetching children for top-level index {i+1}/{len(top_index)}")
            full_index.append(item)
            full_index.extend(self.fetch_recursive_index(book_id, item['id']))
            time.sleep(0.1)
            
        book_data['index'] = full_index
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(book_data, f, ensure_ascii=False, indent=2)
            
        return book_data

    async def fetch_recursive_index_async(self, session: aiohttp.ClientSession, semaphore: asyncio.Semaphore, book_id: int, parent_id: int, depth: int = 0) -> List[Dict]:
        if depth > 2: return []
        url = f'https://backend.ketabonline.com/api/v2/books/{book_id}/index/{parent_id}'
        
        async with semaphore:
            for attempt in range(3):
                try:
                    async with session.get(url, ssl=False, timeout=10) as r:
                        if r.status != 200:
                            return []
                        data_json = await r.json()
                        break
                except Exception as e:
                    if attempt == 2:
                        logger.warning(f"Failed to fetch index {parent_id}: {e}")
                        return []
                    await asyncio.sleep(0.5 * (attempt + 1))
        
        data = data_json.get('data', [])
        all_items = []
        
        tasks = []
        for item in data:
            tasks.append(self.fetch_recursive_index_async(session, semaphore, book_id, item['id'], depth + 1))
            
        if tasks:
            results = await asyncio.gather(*tasks)
            for item, children in zip(data, results):
                all_items.append(item)
                all_items.extend(children)
        else:
            for item in data:
                all_items.append(item)
                
        return all_items

    async def fetch_book_info_async(self, book_id: int) -> Dict:
        cache_file = self.cache_dir / f'index_cache_{book_id}.json'
        if cache_file.exists():
            logger.info(f"Loading Index from cache for book {book_id}")
            with open(cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)

        logger.info(f"Fetching Book Info and Full Index for {book_id} (Async)...")
        url = f'https://backend.ketabonline.com/api/v2/books/{book_id}'
        
        semaphore = asyncio.Semaphore(15) # limit concurrent requests
        async with aiohttp.ClientSession(headers={"User-Agent": "Mozilla/5.0"}) as session:
            async with session.get(url, ssl=False) as r:
                if r.status != 200:
                    return None
                resp_json = await r.json()
                book_data = resp_json['data']
            
            top_index = book_data.get('index', [])
            full_index = []
            
            tasks = []
            for item in top_index:
                tasks.append(self.fetch_recursive_index_async(session, semaphore, book_id, item['id']))
                
            if tasks:
                results = await asyncio.gather(*tasks)
                for item, children in zip(top_index, results):
                    full_index.append(item)
                    full_index.extend(children)
            else:
                for item in top_index:
                    full_index.append(item)
                
        book_data['index'] = full_index
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(book_data, f, ensure_ascii=False, indent=2)
            
        return book_data

    @staticmethod
    def build_toc_maps(index_data: List[Dict]) -> Dict[int, List[Dict]]:
        id_to_item = {item['id']: item for item in index_data}
        page_to_items = {}
        
        def get_full_path(item_id):
            path = []
            curr_id = item_id
            while curr_id and curr_id in id_to_item:
                item = id_to_item[curr_id]
                path.insert(0, item['title'])
                curr_id = item['parent']
            return path
            
        for item in index_data:
            p_id = item['page_id']
            # Clean the title from the API (may have extra spaces inside quotes)
            clean_title = normalize_title(item['title'])
            if p_id not in page_to_items: 
                page_to_items[p_id] = []
            page_to_items[p_id].append({
                'title': clean_title,
                'norm_title': normalize_arabic(clean_title),
                'full_path': get_full_path(item['id'])
            })
        return page_to_items
