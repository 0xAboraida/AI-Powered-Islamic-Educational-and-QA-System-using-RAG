import re
from .base import BaseCleaner

class ArabicTextCleaner(BaseCleaner):
    """
    Cleaner for normalizing Arabic text.
    Handles Tashkeel removal, Hamza normalization, whitespace cleanup,
    section-marker (§) removal, and title bracket stripping.
    """
    
    def __init__(self, remove_tashkeel: bool = True, normalize_letters: bool = True):
        self.remove_tashkeel = remove_tashkeel
        self.normalize_letters = normalize_letters
        
        # Regex patterns for Arabic diacritics (Tashkeel)
        self.tashkeel_pattern = re.compile(r'[\u0617-\u061A\u064B-\u0652\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]')

    def clean(self, text: str) -> str:
        if not text:
            return ""
            
        cleaned_text = text
        
        if self.remove_tashkeel:
            cleaned_text = re.sub(self.tashkeel_pattern, '', cleaned_text)
            
        # if self.normalize_letters:
        #     # Normalize Hamzas to bare Alef
        #     # cleaned_text = re.sub(r'[إأآ]', 'ا', cleaned_text)
            
        #     # Normalize Waw with Hamza
        #     # cleaned_text = re.sub(r'ؤ', 'و', cleaned_text)

        #     # Normalize Yeh with Hamza
        #     # cleaned_text = re.sub(r'ئ', 'ي', cleaned_text)
            
        #     # Note: We might want to keep Teh Marbuta distinct from Heh depending on the embedding model
        #     # but usually for classic IR, they are merged.
        #     # cleaned_text = re.sub(r'ة', 'ه', cleaned_text)
            
        #     # Normalize Alef Maksura to Yeh
        #     # cleaned_text = re.sub(r'ى', 'ي', cleaned_text)
            
        #     # ........, ---------

        # Remove section marker §
        cleaned_text = cleaned_text.replace('§', '')

        # Remove extra whitespace, newlines, and tabs
        cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
        
        return cleaned_text

    def clean_title(self, title: str) -> str:
        """
        Strip wrapping brackets/parentheses from a title if they surround
        the entire string. Repeats until no outer wrapper remains.

        Examples:
            '[كتاب السهو]'  -> 'كتاب السهو'
            '(باب الطهارة)' -> 'باب الطهارة'
            '{فصل}'         -> 'فصل'
        """
        if not title:
            return title

        # Pattern: optional whitespace, opening bracket, content, closing bracket, optional whitespace
        wrapper_pattern = re.compile(
            r'^\s*(?P<open>[\[\(\{])(?P<inner>.+?)(?P<close>[\]\)\}])\s*$',
            re.DOTALL
        )
        MATCHING = {'[': ']', '(': ')', '{': '}'}

        stripped = title.strip()
        while True:
            m = wrapper_pattern.match(stripped)
            if m and MATCHING.get(m.group('open')) == m.group('close'):
                stripped = m.group('inner').strip()
            else:
                break

        return stripped
