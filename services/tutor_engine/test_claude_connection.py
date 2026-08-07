import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def main():
    print("="*50)
    print("🧪 جاري اختبار الاتصال بـ AgentRouter (Claude-Opus-5) عبر OpenAI SDK...")
    print("="*50)
    
    CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
    DIAGRAM_MODEL_NAME = os.getenv("DIAGRAM_MODEL_NAME", "claude-opus-5")
    
    if not CLAUDE_API_KEY:
        print("❌ لم يتم العثور على CLAUDE_API_KEY في ملف .env")
        return
        
    client = AsyncOpenAI(
        api_key=CLAUDE_API_KEY,
        base_url="https://agentrouter.org/v1"
    )
    
    try:
        print("⏳ يتم الآن إرسال 'السلام عليكم'...")
        response = await client.chat.completions.create(
            model=DIAGRAM_MODEL_NAME,
            max_tokens=50,
            messages=[
                {"role": "user", "content": "السلام عليكم، هل أنت متصل وتعمل بشكل جيد؟ رد باختصار."}
            ]
        )
        print("\n✅ الاتصال ناجح 100%!")
        print("🤖 رد الموديل:", response.choices[0].message.content.strip())
    except Exception as e:
        print(f"\n❌ حدث خطأ أثناء الاتصال: {e}")

if __name__ == "__main__":
    asyncio.run(main())
