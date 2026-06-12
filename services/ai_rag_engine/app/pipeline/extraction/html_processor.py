import re
from typing import Dict, Any, List, Tuple
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup
from .text_utils import normalize_arabic, build_arabic_regex, fuzzy_match_title

def clean_element_text(element) -> str:
    el_copy = BeautifulSoup(str(element), 'lxml').find(element.name)
    if not el_copy: return ''
    for tag in el_copy.find_all(['a', 'i']):
        tag.decompose()
    return ' '.join(el_copy.get_text().split()).strip()

def extract_page_elements(soup: BeautifulSoup) -> List[Dict]:
    elements = []
    for el in soup.find_all(['p', 'div']):
        if el.name == 'p':
            elements.append({'type': 'paragraph', 'element': el})
        elif el.name == 'div' and 'g-title' in (el.get('class') or []):
            elements.append({'type': 'title_div', 'element': el})
    return elements

def process_page(
    page_data: Dict, 
    page_to_items_map: Dict[int, List[Dict]], 
    prev_context: Dict, 
    book_meta: Dict, 
    page_index: int
) -> Tuple[List[Dict], List[str]]:
    
    html = page_data.get('content', '')
    page_num = page_data.get('page')
    db_page_id = page_data.get('id')
    
    soup = BeautifulSoup(html, 'lxml')
    page_elements = extract_page_elements(soup)
    expected_titles = page_to_items_map.get(db_page_id, [])
    
    current_hierarchy = prev_context.get('hierarchy', [])
    
    if not current_hierarchy and page_index == 1:
        all_pages = sorted(page_to_items_map.keys())
        if all_pages:
            current_hierarchy = page_to_items_map[all_pages[0]][0]['full_path']
    
    chunks = []
    current_chunk_text = []
    has_title = False
    chunk_counter = 1
    has_body_content = False

    def create_chunk(content, h, is_title):
        nonlocal chunk_counter
        chunk = {
            **book_meta,
            "page_id": db_page_id,
            "printed_page": page_num,
            "part": page_data.get('part', {}).get('name', '1'),
            "hierarchy": h,
            "chunk_id": chunk_counter,
            "has_title": is_title,
            "content": content,
            "source_url": f"https://ketabonline.com/ar/books/{book_meta['id']}/read?part={page_data.get('part', {}).get('name', '1')}&page={page_num}"
        }
        chunk_counter += 1
        return chunk

    def try_save_current_chunk():
        nonlocal current_chunk_text, has_title, has_body_content
        if current_chunk_text and (has_body_content or has_title):
            chunk_body = ' '.join(current_chunk_text).strip()
            if len(chunk_body) > 10 or (has_title and len(chunk_body) > 3):
                chunks.append(create_chunk(chunk_body, current_hierarchy, has_title))

    matched_title_norms = set()

    # Pre-scan for missing titles to inject early
    page_text_all = ' '.join(clean_element_text(el_info['element']) for el_info in page_elements if el_info['type'] != 'title_div')
    page_title_all = ' '.join(el_info['element'].get_text() for el_info in page_elements if el_info['type'] == 'title_div')
    norm_page_all = normalize_arabic(page_title_all + ' ' + page_text_all)
    
    titles_to_inject_early = []
    for item in expected_titles:
        if item['norm_title'] not in norm_page_all and not fuzzy_match_title(item['norm_title'], norm_page_all):
            titles_to_inject_early.append(item)
            
    for item in titles_to_inject_early:
        chunks.append(create_chunk(item['title'], item['full_path'], True))
        current_hierarchy = item['full_path']
        matched_title_norms.add(item['norm_title'])

    for el_info in page_elements:
        el = el_info['element']
        el_type = el_info['type']
        
        if el_type == 'title_div':
            title_text = ' '.join(el.get_text().split()).strip()
            if not title_text:
                continue
            
            norm_title_text = normalize_arabic(title_text)
            best_match = None
            for item in expected_titles:
                if item['norm_title'] in norm_title_text or norm_title_text in item['norm_title'] or fuzzy_match_title(item['norm_title'], norm_title_text):
                    if item['norm_title'] not in matched_title_norms:
                        best_match = item
                        matched_title_norms.add(item['norm_title'])
                        break
            
            if best_match:
                try_save_current_chunk()
                current_hierarchy = best_match['full_path']
                current_chunk_text = [title_text]
                has_title = True
                has_body_content = False
            else:
                current_chunk_text.append(title_text)
            continue
        
        clean_p_text = clean_element_text(el)
        if not clean_p_text:
            continue
        
        has_body_content = True
        norm_p_for_search = normalize_arabic(clean_p_text)
        
        all_matches = []
        for item in expected_titles:
            if item['norm_title'] not in matched_title_norms:
                if item['norm_title'] in norm_p_for_search or fuzzy_match_title(item['norm_title'], norm_p_for_search):
                    pos = norm_p_for_search.find(item['norm_title'])
                    if pos == -1: pos = 0
                    all_matches.append({'item': item, 'pos': pos})
        
        if all_matches:
            all_matches.sort(key=lambda x: x['pos'])
            best_match = all_matches[-1]
            new_hierarchy = best_match['item']['full_path']
            matched_title_norms.add(best_match['item']['norm_title'])
            
            regex_pattern = build_arabic_regex(best_match['item']['norm_title'])
            match = re.search(regex_pattern, clean_p_text)
            
            if match:
                orig_start = match.start()
                text_above = clean_p_text[:orig_start].strip()
                text_below = clean_p_text[orig_start:].strip()
            else:
                text_above = ""
                text_below = clean_p_text
            
            if text_above:
                current_chunk_text.append(text_above)
                has_body_content = True
            
            try_save_current_chunk()
            
            current_hierarchy = new_hierarchy
            current_chunk_text = []
            has_title = True
            has_body_content = False
            
            if text_below:
                current_chunk_text.append(text_below)
                has_body_content = True
        else:
            current_chunk_text.append(clean_p_text)
            has_body_content = True
            
    if current_chunk_text and (has_body_content or has_title):
        chunk_body = ' '.join(current_chunk_text).strip()
        if len(chunk_body) > 10 or (has_title and len(chunk_body) > 3):
            chunks.append(create_chunk(chunk_body, current_hierarchy, has_title))
            
    # Post-scan fallback for any titles that were expected but never matched
    for item in expected_titles:
        if item['norm_title'] not in matched_title_norms:
            chunks.append(create_chunk(item['title'], item['full_path'], True))
            current_hierarchy = item['full_path']
            matched_title_norms.add(item['norm_title'])
    
    return chunks, current_hierarchy
