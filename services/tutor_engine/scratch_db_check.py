import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import connect_to_mongo, chunk_collections

async def m():
    await connect_to_mongo()
    if chunk_collections:
        doc = await chunk_collections[0].find_one({})
        if doc:
            print("KEYS:", list(doc.keys()))
            print("Has page_content?", "page_content" in doc)
            if "page_content" in doc:
                print("page_content length:", len(doc["page_content"]))
            print("Has text?", "text" in doc)
            if "text" in doc:
                print("text length:", len(doc["text"]))
        else:
            print("No doc found")
    else:
        print("No chunk collections")

asyncio.run(m())
