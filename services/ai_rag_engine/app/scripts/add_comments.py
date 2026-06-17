import os
import re

base_dir = r'E:\AI\AI-Code\ML Codes\Graduation Project Zad\Zad-AI\data\02_extracted'
id_to_title = {}
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.endswith('.json') and f.startswith('book_'):
            # book_1067_title_goes_here.json
            m = re.match(r'book_(\d+)_(.+)\.json', f)
            if m:
                book_id = m.group(1)
                title = m.group(2)
                # Cleanup title: replace underscores with spaces
                title = title.replace('_', ' ').strip()
                id_to_title[book_id] = title

config_path = r'E:\AI\AI-Code\ML Codes\Graduation Project Zad\Zad-AI\services\ai_rag_engine\app\pipeline\extraction\books_config.py'
with open(config_path, 'r', encoding='utf-8') as file:
    lines = file.readlines()

with open(config_path, 'w', encoding='utf-8') as file:
    for line in lines:
        # Match lines like:    6302 : ["الفقه", "عام"],
        m = re.search(r'^(\s*)(\d+)(\s*:\s*\[.*?\],)\s*(#.*)?$', line)
        if m:
            indent = m.group(1)
            book_id = m.group(2)
            content = m.group(3)
            
            if book_id in id_to_title:
                title = id_to_title[book_id]
                new_line = f'{indent}{book_id}{content}    # {title}\n'
                file.write(new_line)
            else:
                file.write(line)
        else:
            file.write(line)
