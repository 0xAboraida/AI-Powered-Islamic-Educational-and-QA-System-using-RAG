import json
import os
import re

# Paths
BASE_DIR = r"E:\AI\AI-Code\ML Codes\Graduation Project Zad\Zad-AI"
QUL_LIB_DIR = os.path.join(BASE_DIR, "data", "QUL_LIB")
EXTRACTED_DIR = os.path.join(BASE_DIR, "data", "02_extracted", "04_Tafseer")

SURAH_NAMES_FILE = os.path.join(QUL_LIB_DIR, "quran-metadata-surah-name.json")
TAFSIR_FILE = os.path.join(EXTRACTED_DIR, "book_4738_تفسير_السعدي___تيسير_الكريم_الرحمن.json")
OUTPUT_FILE = os.path.join(EXTRACTED_DIR, "normalized_book_4738_تفسير_السعدي.json")

def load_surah_mapping():
    with open(SURAH_NAMES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    mapping = {}
    for surah_id_str, surah_info in data.items():
        surah_id = int(surah_id_str)
        arabic_name = surah_info['name_arabic']
        # Normalize the name a bit just in case (e.g., remove spaces)
        clean_name = arabic_name.replace(" ", "").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
        mapping[clean_name] = surah_id
        # Also store original
        mapping[arabic_name] = surah_id
    
    # Specific edge cases in some books
    mapping["ال عمران"] = 3
    
    return mapping

def clean_arabic_text(text):
    return text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace(" ", "")

def parse_ayah_range(ayah_str):
    # Remove any non-numeric and non-range characters
    # Support '-', 'ـ', '،', ','
    # Example: "1 - 5", "1-5", "1، 2", "1"
    
    # Extract all numbers from the string
    numbers = [int(n) for n in re.findall(r'\d+', ayah_str)]
    
    if not numbers:
        return None, None
        
    if len(numbers) == 1:
        return numbers[0], numbers[0]
        
    # If multiple numbers, take the first and last (assuming it's a range or a list)
    return min(numbers), max(numbers)

def main():
    print("Loading Surah mappings from QUL...")
    surah_mapping = load_surah_mapping()
    
    print(f"Loading Tafsir book...")
    with open(TAFSIR_FILE, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
        
    print(f"Processing {len(chunks)} chunks...")
    
    normalized_chunks = []
    matched_surahs = 0
    matched_ayahs = 0
    
    for chunk in chunks:
        hierarchy = chunk.get("hierarchy", [])
        
        # Initialize default QUL metadata fields
        chunk["qul_metadata"] = {
            "surah_id": None,
            "ayah_start": None,
            "ayah_end": None
        }
        
        if not hierarchy:
            normalized_chunks.append(chunk)
            continue
            
        # Try to match Surah name (usually hierarchy[0])
        surah_name_raw = hierarchy[0]
        surah_name_clean = clean_arabic_text(surah_name_raw)
        
        surah_id = surah_mapping.get(surah_name_raw) or surah_mapping.get(surah_name_clean)
        
        if surah_id:
            chunk["qul_metadata"]["surah_id"] = surah_id
            matched_surahs += 1
            
            # Try to match Ayah range (usually hierarchy[1])
            if len(hierarchy) > 1:
                ayah_str = hierarchy[1]
                ayah_start, ayah_end = parse_ayah_range(ayah_str)
                
                if ayah_start is not None:
                    chunk["qul_metadata"]["ayah_start"] = ayah_start
                    chunk["qul_metadata"]["ayah_end"] = ayah_end
                    matched_ayahs += 1
        
        normalized_chunks.append(chunk)
        
    print(f"Matched {matched_surahs} chunks to a Surah.")
    print(f"Matched {matched_ayahs} chunks to an Ayah range.")
    
    print("Saving normalized data...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(normalized_chunks, f, ensure_ascii=False, indent=2)
        
    print("Done!")

if __name__ == "__main__":
    main()
