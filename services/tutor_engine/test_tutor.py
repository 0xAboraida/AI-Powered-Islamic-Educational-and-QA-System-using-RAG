import asyncio
import httpx
from database import connect_to_mongo, close_mongo_connection, chunk_collections
import sys
import json

# Force UTF-8 for Windows console
sys.stdout.reconfigure(encoding='utf-8')

async def run_test():
    print("Connecting to MongoDB to fetch a random chunk...")
    await connect_to_mongo()
    
    if not chunk_collections:
        print("Failed to connect to MongoDB or no chunk collections found.")
        return

    # Get one random chunk from the database
    random_chunk = None
    for col in chunk_collections:
        cursor = col.find({}).limit(1)
        async for doc in cursor:
            random_chunk = doc
            break
        if random_chunk:
            break
        
    await close_mongo_connection()

    if not random_chunk:
        print("No chunks found in the database.")
        return

    chunk_id = str(random_chunk["_id"])
    
    # Try different fields for text
    chunk_text = random_chunk.get("text", random_chunk.get("content", random_chunk.get("page_content", "No text found")))
    
    # Try different fields for path
    metadata = random_chunk.get("metadata", {})
    chunk_path = random_chunk.get("path", metadata.get("path", metadata.get("hierarchy", [])))

    print("\n" + "="*50)
    print("Random Chunk Selected:")
    print(f"ID: {chunk_id}")
    print(f"Keys available: {list(random_chunk.keys())}")
    print(f"Path: {chunk_path}")
    print(f"Metadata: {json.dumps(metadata, ensure_ascii=False)}")
    print(f"Text snippet: {chunk_text[:150]}...")
    print("="*50 + "\n")

    # Ask the tutor a question about this chunk
    question = "اشرح لي هذا النص بأسلوب مبسط كأني طالب مبتدئ."
    print(f"Question to Tutor: {question}")
    
    # We use HTTP request to test the actual FastAPI endpoint
    url = "http://localhost:8002/api/v1/tutor/chat"
    payload = {
        "chunk_id": chunk_id,
        "message": question,
        "history": []
    }

    print("Calling Tutor Engine API...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=30.0)
            
            if response.status_code == 200:
                data = response.json()
                print("\n[Tutor Response]:")
                print("-" * 50)
                print(data.get("reply", "No reply in response"))
                print("-" * 50)
            else:
                print(f"API Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_test())
