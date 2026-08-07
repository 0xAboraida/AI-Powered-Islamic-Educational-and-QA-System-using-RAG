import asyncio
import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def run_test():
    url = "http://localhost:8002/api/v1/library/trees?force_refresh=true&book_names=بدائع الصنائع في ترتيب الشرائع"

    print(f"Fetching {url} ...")
    
    async with httpx.AsyncClient() as client:
        # Increased timeout to 5 minutes (300 seconds) because the Fiqh DB is massive
        response = await client.get(url, timeout=300.0)
        
        if response.status_code == 200:
            data = response.json()
            tree = data.get("tree", [])
            print(f"✅ Success: {data.get('success')}")
            print(f"🌳 Root nodes count: {len(tree)}")
            
            if tree:
                output_file = "tree_output.json"
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(tree, f, indent=2, ensure_ascii=False)
                print(f"✅ Full tree successfully saved to: {output_file}")
                print("You can open this file in VSCode to explore the tree structure!")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    asyncio.run(run_test())
