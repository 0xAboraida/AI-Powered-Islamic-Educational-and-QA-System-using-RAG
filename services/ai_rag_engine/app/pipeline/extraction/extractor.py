import re
from pathlib import Path
import logging
import asyncio

# pyrefly: ignore [missing-import]
import aiohttp
from typing import Optional

from .api_client import KetabOnlineAPIClient
from .hierarchy_builder import HierarchyBuilder
from .html_processor import process_page
from .text_utils import extract_death_year, get_hijri_century
from .state_manager import StateManager, JSONStreamer

logger = logging.getLogger(__name__)

# Resolve project root dynamically
current_path = Path(__file__).resolve()
project_root = None
for parent in [current_path] + list(current_path.parents):
    if parent.name == "Zad-AI":
        project_root = parent
        break
if not project_root:
    project_root = current_path.parents[4]


class BookExtractor:
    def __init__(
        self,
        book_id: int,
        custom_domain: str = "عام",
        custom_madhhab: str = "أهل السنة والجماعة",
    ):
        self.book_id = book_id
        self.custom_domain = custom_domain
        self.custom_madhhab = custom_madhhab
        self.api_client = KetabOnlineAPIClient()

        self.scratch_dir = project_root / "data" / "scratch"
        self.scratch_dir.mkdir(exist_ok=True)

        self.hierarchy_builder = HierarchyBuilder(self.api_client, self.scratch_dir)
        self.state_manager = StateManager(book_id, self.scratch_dir)

    def extract(
        self,
        start_page: int = 1,
        end_page: Optional[int] = None,
        output_file: Optional[Path] = None,
        reset: bool = False,
    ):
        asyncio.run(self._extract_async(start_page, end_page, output_file, reset))

    async def _fetch_page_async(self, session, semaphore, url, page_id, retries=3):
        async with semaphore:
            for attempt in range(retries):
                try:
                    async with session.get(url, ssl=False, timeout=15) as response:
                        response.raise_for_status()
                        data = await response.json()
                        return (page_id, data)
                except Exception as e:
                    logger.warning(
                        f"Error fetching page {page_id} (Attempt {attempt+1}/{retries}): {e}"
                    )
                    if attempt == retries - 1:
                        logger.error(
                            f"Failed to fetch page {page_id} after {retries} attempts."
                        )
                        return (page_id, None)
                    await asyncio.sleep(1 * (attempt + 1))
        return (page_id, None)

    async def _extract_async(
        self,
        start_page: int = 1,
        end_page: Optional[int] = None,
        output_file: Optional[Path] = None,
        reset: bool = False,
    ):
        if reset:
            self.state_manager.clear_state()

        book_data = await self.hierarchy_builder.fetch_book_info_async(self.book_id)
        if not book_data:
            logger.error("Failed to load book data.")
            return

        index_data = book_data["index"]
        page_to_items_map = self.hierarchy_builder.build_toc_maps(index_data)

        # Meta
        authors_list = book_data.get("authors")
        author_name = authors_list[0]["name"] if authors_list else "غير معروف"
        full_desc = book_data.get("description", "") + " " + book_data.get("info", "")
        author_death = extract_death_year(full_desc)

        book_meta = {
            "id": book_data["id"],
            "title": book_data["title"],
            "author": author_name,
            "author_death": author_death,
            "hijri_century": get_hijri_century(author_death),
            "domain": self.custom_domain,
            "madhhab": self.custom_madhhab,
            "volumes_count": len(book_data.get("parts", [])),
        }

        # End page
        effective_end_page = end_page
        valid_page_ids = None
        
        try:
            # API metadata pages_count is often incorrect. Fetch exact page IDs.
            pages_r = self.api_client.get(
                f"https://backend.ketabonline.com/api/v2/books/{self.book_id}/pages"
            )
            if pages_r:
                pages_data = pages_r.json().get("data", [])
                if pages_data:
                    valid_page_ids = sorted(pages_data)
                    if effective_end_page is None:
                        effective_end_page = max(valid_page_ids)
        except Exception as e:
            logger.warning(f"Failed to fetch exact pages list: {e}")

        if effective_end_page is None:
            effective_end_page = sum(
                p.get("pages_count", 0) for p in book_data.get("parts", [])
            )
            if effective_end_page == 0:
                effective_end_page = book_data.get("pages_count", 100)

        # Ensure it never cuts off before the last TOC item
        max_index_page = max(
            [item.get("page_id", 1) for item in index_data], default=1
        )
        effective_end_page = max(effective_end_page, max_index_page)

        logger.info(f"إجمالي عدد الصفحات التي سيتم سحبها: {effective_end_page}")

        # Output
        if not output_file:
            safe_title = re.sub(
                r"[^\w\u0600-\u06ff]", "_", book_data.get("title", str(self.book_id))
            )[:40]

            domain_map = {
                "الفقه": {
                    "حنبلي": ["01_Fiqh", "hanbali"],
                    "شافعي": ["01_Fiqh", "shafii"],
                    "مالكي": ["01_Fiqh", "maliki"],
                    "حنفي": ["01_Fiqh", "hanafi"],
                    "عام": ["01_Fiqh", "general"],
                    "مقارن": ["01_Fiqh", "Comparative"],
                    "أصول الفقه": ["01_Fiqh", "usul"],
                    "القواعد الفقهيه": ["01_Fiqh", "qawaid"],
                    "_default": ["01_Fiqh", "other"],
                },
                "العقيدة": ["02_Aqeedah"],
                "السيرة": {
                    "السيرة الشاملة": ["03_Seerah", "comprehensive"],
                    "المغازي والسرايا": ["03_Seerah", "maghazi"],
                    "الشمائل والصفات": ["03_Seerah", "shamail"],
                    "دلائل النبوة": ["03_Seerah", "dalail"],
                    "الخصائص النبوية": ["03_Seerah", "khasais"],
                    "جوامع السيرة": ["03_Seerah", "jawami"],
                    "_default": ["03_Seerah", "other"],
                },
                "التفسير": {
                    "التفسر بالمأثور": ["04_Tafseer", "mathur"],
                    "التفسر بالرأي": ["04_Tafseer", "ray"],
                    "الجامع بين فني الرواية والدراية": ["04_Tafseer", "jami"],
                },
                "النحو والصرف": {
                    "نحو": ["05_Nahw_Sarf", "nahw"],
                    "صرف": ["05_Nahw_Sarf", "sarf"],
                    "نحو وصرف": ["05_Nahw_Sarf", "nahw_sarf"],
                },
                "التاريخ": {
                    "التاريخ العام": ["06_Tarikh", "general"],
                    "التراجم والطبقات": ["06_Tarikh", "tarajim"],
                    "تواريخ المدن والبلدان": ["06_Tarikh", "cities"],
                    "الأنساب والقبائل": ["06_Tarikh", "ansab"],
                    "تاريخ الخلفاء": ["06_Tarikh", "khulafa"],
                    "تاريخ الدول": ["06_Tarikh", "states"],
                    "ثقافة عامة وتاريخ": ["06_Tarikh", "culture"],
                    "_default": ["06_Tarikh", "other"],
                },
                "اعراب القرآن": ["07_QuranGrammar"],
                "البلاغه والشعر": ["08_Rhetoric_Poetry"],
                "الحديث": {
                    "المسانيد": ["09_Hadith", "masanid"],
                    "المعجمات": ["09_Hadith", "maajim"],
                    "الموطآت والمصنفات": ["09_Hadith", "muwatta_musannafat"],
                    "الصحاح": ["09_Hadith", "sihah"],
                    "السنن": ["09_Hadith", "sunan"],
                    "المستدركات": ["09_Hadith", "mustadrakat"],
                    "المستخرجات": ["09_Hadith", "mustakhrajat"],
                    "المجامع": ["09_Hadith", "majami"],
                    "التخريج": ["09_Hadith", "takhrij"],
                    "الأطراف": ["09_Hadith", "atraf"],
                    "العلل والسؤالات": ["09_Hadith", "ilal"],
                    "الضعيف": ["09_Hadith", "daif"],
                    "الموضوعة": ["09_Hadith", "mawduat"],
                    "مصطلح الحديث": ["09_Hadith", "mustalah"],
                    "شروح الحديث": ["09_Hadith", "shuruh"],
                    "أحاديث الأحكام": ["09_Hadith", "ahkam"],
                    "الترغيب والترهيب": ["09_Hadith", "targhib"],
                    "_default": ["09_Hadith", "other"],
                },
            }

            sub_path = ["other"]
            if self.custom_domain in domain_map:
                domain_val = domain_map[self.custom_domain]
                if isinstance(domain_val, dict):
                    sub_path = domain_val.get(
                        self.custom_madhhab, domain_val.get("_default", ["other"])
                    )
                else:
                    sub_path = domain_val

            output_file = project_root.joinpath(
                "data",
                "02_extracted",
                *sub_path,
                f"book_{self.book_id}_{safe_title}.json",
            )

            output_file.parent.mkdir(parents=True, exist_ok=True)

        streamer = JSONStreamer(output_file, reset=reset)

        # Load State
        state = self.state_manager.load_state()
        resume_page = start_page
        prev_context = {"hierarchy": []}
        last_chunk = None
        chunk_count = 1

        if state and not reset:
            resume_page = state["last_page"]
            last_chunk = state["last_chunk"]
            prev_context = state["prev_context"]
            chunk_count = state.get("chunk_count", 1)
            logger.info(f"Resuming from page {resume_page}")

        logger.info(f"Starting extraction to {output_file}")

        if valid_page_ids:
            pages_to_fetch = [p for p in valid_page_ids if resume_page <= p <= effective_end_page]
        else:
            pages_to_fetch = list(range(resume_page, effective_end_page + 1))

        batch_size = 100
        semaphore = asyncio.Semaphore(30)

        async with aiohttp.ClientSession(
            headers={"User-Agent": "Mozilla/5.0"}
        ) as session:
            for i in range(0, len(pages_to_fetch), batch_size):
                batch_pages = pages_to_fetch[i:i + batch_size]
                
                if not batch_pages:
                    continue

                logger.info(
                    f"Fetching {len(batch_pages)} pages (from ID {batch_pages[0]} to {batch_pages[-1]}) concurrently..."
                )
                tasks = []
                for page_id in batch_pages:
                    url = f"https://backend.ketabonline.com/api/v2/books/{self.book_id}/pages/{page_id}"
                    tasks.append(
                        self._fetch_page_async(session, semaphore, url, page_id)
                    )

                results = await asyncio.gather(*tasks)

                for page_id, page_data_json in results:
                    if not page_data_json:
                        logger.error(
                            f"Skipping processing for page {page_id} due to fetch failure. NOT updating state to prevent chunk loss."
                        )
                        continue

                    page_chunks, last_hierarchy = process_page(
                        page_data_json,
                        page_to_items_map,
                        prev_context,
                        book_meta,
                        page_id,
                    )

                    for chunk in page_chunks:
                        if last_chunk is None:
                            last_chunk = chunk
                            continue

                        same_hierarchy = last_chunk["hierarchy"] == chunk["hierarchy"]
                        no_new_title = not chunk["has_title"]

                        if same_hierarchy and no_new_title:
                            last_chunk["content"] += " " + chunk["content"]
                        else:
                            last_chunk["chunk_number"] = chunk_count
                            chunk_count += 1
                            streamer.append(last_chunk)
                            last_chunk = chunk

                    # Successfully processed page, update state!
                    prev_context["hierarchy"] = last_hierarchy
                    self.state_manager.save_state(
                        page_id + 1, last_chunk, prev_context, chunk_count
                    )

        # Final write
        if last_chunk is not None:
            last_chunk["chunk_number"] = chunk_count
            chunk_count += 1
            streamer.append(last_chunk)
            # End of book, clear state
            self.state_manager.clear_state()

        streamer.close()
        logger.info("Extraction completed successfully.")
