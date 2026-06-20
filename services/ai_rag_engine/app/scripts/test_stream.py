import httpx
import json

url = "http://localhost:8000/api/v1/chat/stream"

payload = {
    "query": "ما حكم الوضوء وما هي شروطه؟",
    "domain": 1,
}

print("🚀 Connecting to Zad-AI Engine...\n")

# Using httpx to receive the SSE Stream
with httpx.stream("POST", url, json=payload, timeout=60.0) as response:
    for line in response.iter_lines():
        if not line:
            continue

        try:
            data = json.loads(line)

            # If the event contains context chunks retrieved from the database
            if data["type"] == "context":
                print(
                    f"📚 Retrieved {len(data['data'])} documents from the database as reference.\n"
                )

            # If the event is streaming LLM tokens
            elif data["type"] == "chunk":
                # Print the word immediately without a newline
                print(data["content"], end="", flush=True)

            # If the event contains final citations used
            elif data["type"] == "citations":
                print("\n\n📑 Citations used in the answer:")
                for cit_key, c in data["data"].items():
                    print(f"- {cit_key} -> Book: {c.get('book_title')} (Author: {c.get('author')})")
                    print(f"  URL: {c.get('source_url')}")

        except json.JSONDecodeError:
            print("Error decoding response:", line)

print("\n\n✅ Generation Complete!")
