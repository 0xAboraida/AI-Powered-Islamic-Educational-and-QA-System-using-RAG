import asyncio
import os
import sys
import json

# Add parent directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import connect_to_mongo, close_mongo_connection, chunk_collections
from mindmap_generator import generate_mindmap_json

async def main():
    print("="*50)
    print("🧠 جاري تشغيل اختبار الخرائط الذهنية (Mind Map Generator)...")
    print("="*50)
    
    # 1. Connect to Database
    await connect_to_mongo()
    if not chunk_collections:
        print("❌ لم يتم العثور على أي كوليكشن للدروس!")
        return

    # 2. Fetch a specific lesson (e.g. الوضوء)
    print("⏳ جاري البحث عن درس عشوائي (مثال: يحتوي على كلمة 'الوضوء')...")
    
    selected_chunk = None
    for col in chunk_collections:
        cursor = col.find({"content": {"$regex": "الوضوء"}}).limit(1)
        async for doc in cursor:
            if doc.get("content"):
                selected_chunk = doc
                break
        if selected_chunk:
            break
            
    if not selected_chunk:
        for col in chunk_collections:
            cursor = col.find({}).limit(10)
            async for doc in cursor:
                if isinstance(doc.get("content"), str) and doc.get("content").strip():
                    selected_chunk = doc
                    break
            if selected_chunk: break

    if not selected_chunk:
        print("❌ قاعدة البيانات فارغة!")
        return

    chunk_text = selected_chunk.get("content", "")
    metadata = selected_chunk.get("metadata", {})
    book_title = metadata.get("book_title", "غير معروف")
    
    print(f"\n✅ تم اختيار الدرس بنجاح من كتاب: {book_title}")
    print(f"📖 مقتطف من الدرس:\n{repr(chunk_text[:300])}...\n")
    print("="*50)
    print("⏳ جاري الاتصال بـ Gemini 1.5 Flash لبناء الخريطة الذهنية... (قد يستغرق بضع ثوانٍ)")
    
    # 3. Call Gemini
    try:
        nodes = await generate_mindmap_json(chunk_text)
        print("\n✅ تم توليد الخريطة الذهنية بنجاح!")
        print("\n📊 النتيجة (JSON Nested Tree):")
        print(json.dumps(nodes, ensure_ascii=False, indent=2))
        
        # Count total nodes for info
        def count_nodes(n):
            if not n: return 0
            if isinstance(n, list): return sum(count_nodes(child) for child in n)
            return 1 + sum(count_nodes(child) for child in n.get("children", []))
            
        print(f"\n💡 إجمالي العقد (Nodes) المستخرجة: {count_nodes(nodes)} عقدة")
        
    except Exception as e:
        print(f"❌ حدث خطأ: {e}")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
