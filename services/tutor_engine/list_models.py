import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
keys_str = os.getenv("GEMINI_API_KEYS", "")
current_key = [k.strip() for k in keys_str.split(",") if k.strip()][0]

client = genai.Client(api_key=current_key)
for model in client.models.list():
    print(model.name)
