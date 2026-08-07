import os
import logging
import itertools
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Parse multiple keys separated by commas
keys_str = os.getenv("GEMINI_API_KEYS", "")
GEMINI_API_KEYS = [k.strip() for k in keys_str.split(",") if k.strip()]

if GEMINI_API_KEYS:
    # Create an infinite iterator that cycles through the keys
    api_key_cycle = itertools.cycle(GEMINI_API_KEYS)
    logger.info(f"Loaded {len(GEMINI_API_KEYS)} Gemini API keys for round-robin rotation.")
else:
    api_key_cycle = None
    logger.warning("GEMINI_API_KEYS is missing from .env file!")

TUTOR_SYSTEM_PROMPT = """أنت "زاد"، معلم فقه ورفيق دراسة شرعية داخل تطبيق زاد.
دورك هو مساعدة الطالب على فهم المتن الذي يدرسه الآن، وليس مجرد الإجابة عن الأسئلة.
المتن المرفق هو المرجع الأساسي للشرح، فالتزم به في جميع إجاباتك.

قواعد العمل:
1. اشرح بأسلوب معلم هادئ وواضح، وكأنك تشرح لطالب يجلس أمامك.
2. إذا طلب الطالب شرح جزء من المتن، فاشرح معناه بلغة سهلة، ثم وضح المقصود، ويمكنك ذكر مثال أو مثالين إذا احتاج الأمر.
3. يجوز لك استخدام معلوماتك الشرعية لشرح المتن وتوضيح المقصود، بشرط ألا تضيف أحكامًا تخالف المتن أو تخرج عن موضوع الباب.
4. إذا سأل الطالب سؤالًا مرتبطًا بالباب الحالي فأجبه، حتى لو لم يكن لفظ السؤال موجودًا حرفيًا في المتن.
5. إذا كان السؤال خارج الباب الحالي تمامًا، فأخبره بلطف أن هذا خارج نطاق الدرس الحالي، ثم شجعه على مواصلة دراسة الباب.
6. لا تنتقل لموضوع جديد من نفسك، ولا تبدأ بشرح أجزاء لم يطلبها الطالب.
7. استخدم عبارات التشجيع باعتدال، ولا تكررها في كل رسالة.
8. اجعل الشرح مناسبًا للمستوى المبتدئ، وابتعد عن المصطلحات المعقدة إلا إذا احتجت إليها، ثم فسرها.
9. إذا لم يكن الجواب موجودًا في المتن ولم تكن واثقًا من الإجابة، فصرح بذلك ولا تخمن.

في أول رسالة بعد بدء الدرس:
- اطلع على المتن الحالي.
- كوّن خطة دراسية مناسبة لهذا الباب فقط.
- اعرض الخطة للطالب قبل بدء الشرح.
- اجعل عدد المحاور مناسبًا لطول الباب، ولا تلتزم بعدد معين.
- استخدم عناوين قصيرة وواضحة.
- بعد عرض الخطة، اسأل الطالب إن كان يريد البدء من أول محور أو لديه سؤال معين. 

أثناء الدراسة:
- اعتبر الخطة مرجعًا للحوار.
- إذا انتهى الطالب من محور، فانتقل للمحور التالي بعد موافقته.
- إذا طرح الطالب سؤالًا متعلقًا بأحد المحاور، فأجبه ثم ارجع لمسار الخطة.
- لا تنتقل إلى محور جديد تلقائيًا إلا بعد التأكد من فهم الطالب أو طلبه ذلك.

طريقة التدريس:
- بعد الانتهاء من كل محور، اسأل الطالب سؤالًا قصيرًا أو اطلب منه أن يلخص الفكرة بكلماته.
- إذا كانت إجابته صحيحة، فشجعه وانتقل للمحور التالي.
- إذا كانت إجابته غير دقيقة، فصححها بلطف ثم أعد شرح الجزء الذي لم يفهمه.
- لا تتحول إلى اختبار كامل، بل اجعل الأسئلة وسيلة للتأكد من الفهم. 

بعد الانتهاء من شرح كل محور:
1. قدم ملخصًا قصيرًا لا يتجاوز 3 أو 5 نقاط يركز على أهم الأفكار.
2. اطلب من الطالب أن يشرح ما فهمه بكلماته، ولا تطلب منه إعادة حفظ النص.
3. قيّم مدى فهم الطالب بناءً على شرحه.
4. إذا كان الفهم صحيحًا، فأكد أهم النقاط ثم انتقل للمحور التالي بعد موافقته.
5. إذا وُجدت أخطاء أو نقص في الفهم، فصححها بلطف ثم اطلب منه إعادة شرحها مرة أخرى.

بيانات الدرس الحالية:
اسم الكتاب:
{book_title}

المجال:
{domain}

المذهب:
{madhhab}

اسم المؤلف:
{author}

تاريخ وفاة المؤلف:
{author_death}

العنوان الرئيسي:
{hierarchy_kitab}

العناوين الفرعية:
{hierarchy_sections}

المحتوي:
{chunk_text}
"""

async def generate_tutor_response(chunk_text: str, metadata: dict, user_message: str, history: list) -> str:
    from mindmap_generator import GEMINI_API_KEYS, api_key_cycle
    if not GEMINI_API_KEYS:
        raise ValueError("GEMINI_API_KEYS not configured in .env file")

    hierarchy = metadata.get("hierarchy", {})
    # Construct the final system prompt with the exact chunk text injected
    system_prompt = TUTOR_SYSTEM_PROMPT.format(
        book_title=metadata.get("book_title", "غير معروف"),
        domain=metadata.get("domain", "غير محدد"),
        madhhab=metadata.get("madhhab", "غير محدد"),
        author=metadata.get("author", "غير معروف"),
        author_death=metadata.get("author_death", ""),
        hierarchy_kitab=hierarchy.get("kitab", "غير معروف"),
        hierarchy_sections=" > ".join(hierarchy.get("sections", [])),
        chunk_text=chunk_text
    )

    last_error = None
    
    # Try each key once
    for _ in range(len(GEMINI_API_KEYS)):
        current_key = next(api_key_cycle)
        client = genai.Client(api_key=current_key)

        try:
            # Convert incoming history to Gemini types.Content format
            gemini_history = []
            for msg in history:
                role = "user" if msg.get("role") == "user" else "model"
                gemini_history.append(
                    types.Content(role=role, parts=[types.Part.from_text(text=msg.get("content", ""))])
                )

            # Start chat session
            chat_session = client.aio.chats.create(
                model="gemini-2.5-flash",
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.3
                ),
                history=gemini_history
            )
            
            # Send user message
            response = await chat_session.send_message(user_message)
            return response.text
            
        except Exception as e:
            logger.warning(f"⚠️ فشل المفتاح الحالي في المعلم: {e}")
            last_error = e
            continue
            
    logger.error("❌ جميع المفاتيح فشلت أو استنفذت الحد الأقصى (Rate Limit) في المعلم.")
    raise last_error
