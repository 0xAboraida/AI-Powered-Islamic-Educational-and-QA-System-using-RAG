from googlesearch import search
try:
    results = search('site:ketabonline.com "مسند الإمام أحمد بن حنبل"', num_results=3, lang='ar', sleep_interval=2)
    with open('test.txt', 'w', encoding='utf-8') as f:
        for r in results:
            f.write(str(r) + '\n')
except Exception as e:
    with open('test.txt', 'w', encoding='utf-8') as f:
        f.write(str(e) + '\n')
