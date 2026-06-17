import re
import unicodedata
# class TextUtils:
#     def __init__(self, ):
#         return

def normalize_title(title: str) -> str:
    """
    Pre-normalizes a TOC title before any Arabic normalization.
    Strips whitespace immediately inside quotation marks:
      '" الإيمان بالله "'  ->  '"الإيمان بالله"'
    Handles Arabic, English, and Unicode curly quotes.
    """
    if not title:
        return ''
    # Normalize various unicode quote characters to a plain double-quote
    title = re.sub(r'[\u201C\u201D\u275D\u275E\u2018\u2019]', '"', title)
    # Strip spaces just inside opening/closing double-quotes
    title = re.sub(r'"\s+', '"', title)   # "  text  -> "text
    title = re.sub(r'\s+"', '"', title)   # text  " -> text"
    # Collapse multiple whitespace runs
    return ' '.join(title.split()).strip()


def normalize_arabic(text: str) -> str:
    if not text: return ''
    # Apply title normalization first (handles quote spacing)
    text = normalize_title(text)
    text = re.sub(r'[\u0617-\u061A\u064B-\u0652]', '', text)
    text = re.sub(r'[أإآ]', 'ا', text)
    text = re.sub(r'ة', 'ه', text)
    text = re.sub(r'ى', 'ي', text)
    # Include common quote characters alongside punctuation
    text = re.sub(r'[\[\]\(\)\.\:\-\_\'"\u201C\u201D]', ' ', text)
    return ' '.join(text.split()).strip()

def build_arabic_regex(norm_title: str) -> str:
    """
    Builds a regex pattern from a normalized Arabic title that can match the original
    text, allowing for optional diacritics and variable whitespace.
    """
    pattern = []
    for char in norm_title:
        if char == ' ':
            pattern.append(r'\s+')
        elif char == 'ا':
            pattern.append(r'[إأآا][\u0617-\u061A\u064B-\u0652]*')
        elif char == 'ه':
            pattern.append(r'[ةه][\u0617-\u061A\u064B-\u0652]*')
        elif char == 'ي':
            pattern.append(r'[يى][\u0617-\u061A\u064B-\u0652]*')
        else:
            pattern.append(re.escape(char) + r'[\u0617-\u061A\u064B-\u0652]*')
    return ''.join(pattern)

def extract_death_year(text: str) -> str:

    if not text:
        return "غير معروف"

    match = re.search(
        r'المتوف(?:ى|ي)\s*[:：]?\s*(\d+)\s*هـ',
        text
    )

    if match:
        return f"{match.group(1)}هـ"

    return "غير معروف"

def get_hijri_century(death_year_str: str) -> str:
    if not death_year_str or death_year_str == "غير معروف":
        return "غير معروف"
    match = re.search(r'(\d+)', death_year_str)
    if match:
        year = int(match.group(1))
        century = (year // 100) + 1
        return f"القرن {century} الهجري"
    return "غير معروف"

def fuzzy_match_title(toc_title: str, text: str) -> bool:
    """
    Checks if there's a strong match between the TOC title and the text.
    It splits into words and checks if the first few significant words match,
    or if a sufficient percentage of words match.
    """
    if not toc_title or not text: return False
    
    toc_words = toc_title.split()
    text_words = set(text.split())
    
    if len(toc_words) <= 2:
        return toc_title in text
        
    # Check 3-word n-grams
    for i in range(len(toc_words) - 2):
        ngram = ' '.join(toc_words[i:i+3])
        if ngram in text:
            return True
            
    # Or if >= 50% of significant words exist in the text
    sig_toc_words = [w for w in toc_words if w not in ['في', 'من', 'عن', 'على', 'باب', 'فصل', 'كتاب']]
    if not sig_toc_words:
        sig_toc_words = toc_words
        
    matches = sum(1 for w in sig_toc_words if w in text_words)
    if matches >= max(3, len(sig_toc_words) // 2):
        return True
        
    return False
