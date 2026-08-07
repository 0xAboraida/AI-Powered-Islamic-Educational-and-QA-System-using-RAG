import asyncio
import os
import sys

# Add parent directory to path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import connect_to_mongo, close_mongo_connection, chunk_collections
from tutor import generate_tutor_response

async def main():
    print("="*50)
    print("🧪 جاري تشغيل اختبار المعلم الذكي (Tutor Core)...")
    print("="*50)
    
    # 1. Connect to Database
    await connect_to_mongo()
    if not chunk_collections:
        print("❌ لم يتم العثور على أي كوليكشن للدروس!")
        return

    # 2. Fetch a random lesson (chunk)
    # Let's try to find a lesson about something specific, like 'الوضوء' or just take a random one
    print("⏳ جاري البحث عن درس عشوائي من قاعدة البيانات...")
    
    selected_chunk = None
    for col in chunk_collections:
        # Search for a chunk that has decent text length
        cursor = col.find({"content": {"$regex": "الوضوء"}}).limit(1)
        async for doc in cursor:
            if len(doc.get("content", "")) > 100:
                selected_chunk = doc
                break
        if selected_chunk:
            break
            
    if not selected_chunk:
        # Fallback to completely random chunk
        for col in chunk_collections:
            selected_chunk = await col.find_one({})
            if selected_chunk: break

    if not selected_chunk:
        print("❌ قاعدة البيانات فارغة!")
        return

    chunk_text = selected_chunk.get("content", "")
    metadata = selected_chunk.get("metadata", {})
    book_title = metadata.get("book_title", "غير معروف")
    
    print(f"\n✅ تم اختيار الدرس بنجاح من كتاب: {book_title}")
    print(f"📖 مقتطف من الدرس:\n{chunk_text[:200]}...\n")
    print("="*50)
    print("🤖 المعلم الذكي (زاد) جاهز الآن! يمكنك التحدث معه.")
    print("اكتب 'خروج' أو 'exit' لإنهاء المحادثة.")
    print("="*50)

    # 3. Interactive Chat Loop
    history = []
    
    # Start the conversation with an initial prompt
    print("\n[أنت]: (بدء الدرس)")
    try:
        reply = await generate_tutor_response(
            chunk_text=chunk_text,
            metadata=metadata,
            user_message="مرحباً يا زاد، أنا مستعد لبدء دراسة هذا الدرس، هل يمكنك وضع خطة والبدء بالشرح؟",
            history=history
        )
        print(f"\n[المعلم زاد]:\n{reply}")
        
        # Add to history
        history.append({"role": "user", "content": "مرحباً يا زاد، أنا مستعد لبدء دراسة هذا الدرس، هل يمكنك وضع خطة والبدء بالشرح؟"})
        history.append({"role": "assistant", "content": reply})
        
    except Exception as e:
        print(f"❌ حدث خطأ: {e}")
        return

    while True:
        user_input = input("\n[أنت]: ")
        if user_input.lower() in ['خروج', 'exit', 'quit']:
            break
            
        print("⏳ (جاري التفكير...)")
        try:
            reply = await generate_tutor_response(
                chunk_text=chunk_text,
                metadata=metadata,
                user_message=user_input,
                history=history
            )
            print(f"\n[المعلم زاد]:\n{reply}")
            
            # Update history for context
            history.append({"role": "user", "content": user_input})
            history.append({"role": "assistant", "content": reply})
            
        except Exception as e:
            print(f"❌ حدث خطأ في الاتصال بالذكاء الاصطناعي: {e}")
            
    await close_mongo_connection()
    print("👋 انتهت المحادثة. بالتوفيق!")

if __name__ == "__main__":
    asyncio.run(main())
