import os
import asyncio
import logging
import httpx
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import llm, stt, tts, inference
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, room_io
from livekit.agents import AgentStateChangedEvent, MetricsCollectedEvent, metrics
from livekit.plugins import (
    noise_cancellation,
    silero,
    openai,
    deepgram,
    cartesia,
    elevenlabs,
    google,
)
from duckduckgo_search import DDGS

load_dotenv()
logger = logging.getLogger(__name__)


# Define your agent's behavior by extending the Agent class
class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""
أنت مساعد علمي إسلامي متخصص، اسمك "نور"، تساعد طلاب العلم الشرعي.

[قواعد صارمة جداً للنطق والصوت]:
1. تتحدث باللغة العربية الفصحى أو العامية الراقية فقط. يُمنع منعاً باتاً نطق أي كلمة إنجليزية.
2. **بدون تنسيق نصي (Markdown)**: ممنوع منعاً باتاً استخدام علامات التنسيق مثل النجوم (**) أو الهاشتاج (#) أو القوائم المنقطة (-). نظام الصوت (TTS) سيقرأ هذه العلامات كنص وتفسد التجربة! استخدم الفواصل والنقاط فقط لتقسيم الجمل.
3. يُمنع منعاً باتاً أن تنطق أسماء دوال البرمجة أو الأدوات (مثل search_web). تصرف كطبيعي وأجب مباشرة أو قل "لحظات أراجع مصادري".
4. إجابتك يجب أن تكون موجهة للمستمع كأنك تتحدث معه وجهًا لوجه (كلام منطوق وليس مكتوب).
5. **التشكيل للضرورة فقط**: قم بتشكيل الكلمات التي يختلف نطقها بدون تشكيل فقط (مثل: الأفعال المبنية للمجهول كنُقِرَ، والكلمات الملتبسة كالصُّورِ). **يُمنع منعاً باتاً تشكيل لفظ الجلالة (الله) أو الكلمات الشائعة جداً** لأن الإفراط في التشكيل يجعل المولد الصوتي ينطقها بطريقة غريبة ومكسرة.

## شخصيتك وطريقة الإجابة:
- أسلوبك دافئ، علمي، ومحترم — كأنك شيخ متواضع يحدّث طالبًا.
- ابدأ إجاباتك بمقدمة قصيرة تُرحّب بالسؤال أو تُقدّر اهتمام الطالب.
- اختم بجملة تشجيعية أو دعاء مختصر.
- إذا كان السؤال يحتمل خلافًا بين المذاهب، اذكر الأقوال الرئيسية باختصار وبأسلوب سهل.

## أدواتك:
1. `search_islamic_rag`: للبحث في الموسوعة الإسلامية.
2. `search_web`: للبحث في المواقع الإسلامية الموثوقة عبر الإنترنت.

## قواعد الإجابة والبحث:
1. الأسئلة العامة (ترحيب، سؤال عن الحال، إلخ): أجب بلطف مباشرة **دون استخدام أي أداة بحث**.
2. الأسئلة الدينية والعلمية (فقه، عقيدة، حديث، إلخ):
   - **ممنوع منعاً باتاً** أن تجيب من معلوماتك الخاصة (من دماغك) مهما كان السؤال بسيطاً.
   - يجب أن تستخدم أداة `search_islamic_rag` **أولاً ودائماً**.
   - إذا لم تجد الإجابة الكافية، استخدم **ثانياً** أداة `search_web`.
3. اذكر المصدر الذي استقيت منه المعلومة بشكل طبيعي في الكلام.
4. اشرح الإجابة بتفصيل علمي وافٍ وممتع. اجعل إجابتك غنية ومريحة للأذن.
"""
        )


server = AgentServer()
vad = silero.VAD.load()


# The entrypoint function runs when a participant joins the room
@server.rtc_session()
async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to room {ctx.room.name}")
    await ctx.connect()

    # Aggregate data across all conversation turns
    usage_collector = metrics.UsageCollector()

    # Track End of Utterance timing
    last_eou_metrics: metrics.EOUMetrics | None = None

    # Define tools that have access to the session closure
    DOMAIN_MAPPING: dict[int, str] = {
        1: "فقه",
        2: "العقيدة",
        3: "السيرة",
        4: "التفسير",
        5: "الحديث",
        6: "علوم القران",
        7: "التاريخ",
        8: "علوم اللغه",
    }

    @llm.function_tool
    async def search_islamic_rag(query: str, domain: int = 1) -> str:
        """أداة البحث الأساسية والإجبارية في قاعدة البيانات الإسلامية لاستخراج النصوص والفتاوى والمصادر.
        **إجباري جداً**: استخدم هذه الأداة أولاً ودائماً لأي سؤال شرعي أو ديني قبل أن تجيب من معلوماتك الخاصة.
        اختر المجال (domain) الأقرب للسؤال:
          1 = فقه
          2 = العقيدة
          3 = السيرة
          4 = التفسير
          5 = الحديث
          6 = علوم القران
          7 = التاريخ
          8 = علوم اللغه

        Args:
            query: السؤال باللغة العربية للبحث عنه.
            domain: رقم المجال من 1 إلى 8.
        """
        domain_name = DOMAIN_MAPPING.get(domain, "غير معروف")
        print(f"\n🔍 [RAG Search] Query: '{query}' | Domain: {domain_name}...")
        session.say("جاري البحث في المصادر الشرعية، لحظات من فضلك.")

        chunks_url = os.getenv("RAG_CHUNKS_URL")
        if not chunks_url:
            return "خطأ: لم يتم إعداد رابط RAG_CHUNKS_URL في ملف .env."

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    chunks_url,
                    json={"session_id": 0, "query": query, "domain": domain},
                )

            if response.status_code != 200:
                return f"فشل الاتصال بقاعدة البيانات الإسلامية. رمز الحالة: {response.status_code}"

            data = response.json()
            guardrail = data.get("guardrail", "ok")

            # ── Guardrail: unsafe or ambiguous — pass message directly ──────
            if guardrail in ("unsafe", "ambiguous", "error"):
                msg = data.get("message", "حدث خطأ في استرجاع المعلومات.")
                logger.warning("RAG guardrail=%s: %s", guardrail, msg)
                return msg

            # ── Format chunks as context block for the LiveKit LLM ──────────
            chunks: list = data.get("chunks", [])
            search_queries: list = data.get("search_queries", [query])

            if not chunks:
                logger.warning("RAG returned 0 chunks for query: %s", query)
                return (
                    "لم أجد نصوصًا مباشرة في قاعدة البيانات (RAG) لهذا السؤال. "
                    "يجب عليك الآن فوراً استخدام أداة `search_web` للبحث عن الإجابة في المواقع الإسلامية الموثوقة."
                )

            # ── Citation logging ─────────────────────────────────────────────
            sep = "─" * 60
            log_lines = [f"\n{sep}", f"📚  RAG CHUNKS  ({len(chunks)} retrieved)", sep]
            for i, chunk in enumerate(chunks, 1):
                meta = chunk.get("metadata") or {}
                title = meta.get("book_title") or meta.get("title") or "مصدر غير معروف"
                author = meta.get("author") or ""
                page = meta.get("page") or meta.get("page_number") or ""
                score = chunk.get("best_child_score") or chunk.get("score") or ""
                page_info = f" ص.{page}" if page else ""
                score_info = f" | score={score:.3f}" if isinstance(score, float) else ""
                log_lines.append(f"  [{i}] {title}{page_info}{score_info}  — {author}")
            log_lines.append(sep)
            logger.info("\n".join(log_lines))
            # ────────────────────────────────────────────────────────────────

            # Build the context string the LiveKit LLM will reason over
            context_parts = [
                f"[مصادر مسترجعة من قاعدة البيانات الإسلامية — مجال: {domain_name}]",
                f"[الأسئلة المُعاد صياغتها للبحث: {' | '.join(search_queries)}]",
                "",
            ]

            for i, chunk in enumerate(chunks, 1):
                meta = chunk.get("metadata") or {}
                title = meta.get("book_title") or meta.get("title") or "مصدر غير معروف"
                author = meta.get("author") or ""
                page = meta.get("page") or meta.get("page_number") or ""
                text = (
                    chunk.get("text")
                    or chunk.get("page_content")
                    or chunk.get("content")
                    or ""
                )
                header = f"📖 المصدر {i}"
                if title:
                    header += f" — {title}"
                if author:
                    header += f" | {author}"
                if page:
                    header += f" (ص. {page})"

                context_parts.append(header)
                context_parts.append("─" * 40)
                context_parts.append(text.strip())
                context_parts.append("")

            context_parts.append(
                "[تعليمات هامة: اعتمد على هذه النصوص في إجابتك، واذكر المرجع بشكل طبيعي في الكلام. "
                "اشرح المسألة بتفصيل وافٍ ولا تختصر، قدم إجابة علمية غنية وكاملة ومريحة للمستمع.]"
            )

            return "\n".join(context_parts)

        except Exception as e:
            logger.error("Error calling RAG /chunks: %s", str(e))
            return f"حدث خطأ أثناء الاتصال بقاعدة البيانات: {str(e)}"

    # ── Trusted Islamic websites ──────────────────────────────────────────────
    # Add or remove sites from this list to control where the agent searches.
    TRUSTED_SITES = [
        "islamweb.net",  # فتاوى وبحوث إسلامية شاملة
        "dorar.net",  # الدرر السنية - موسوعة الحديث والفقه
        "islamqa.info",  # إسلام سؤال وجواب (ابن عثيمين وغيره)
        "binbaz.org.sa",  # موقع الشيخ ابن باز
        "binothaimeen.net",  # موقع الشيخ ابن عثيمين
        "sunnah.com",  # كتب الحديث النبوي
        "quran.com",  # القرآن الكريم
        "alukah.net",  # الألوكة - ملتقى أهل العلم
        "islamhouse.com",  # بيت الإسلام
        "ketabonline.com",  # جامع الكتب الإسلامية - آلاف الكتب الشرعية
    ]

    @llm.function_tool
    async def search_web(query: str, trusted_only: bool = True) -> str:
        """تبحث هذه الأداة في المواقع الإسلامية الموثوقة عبر الإنترنت.

        Args:
            query: السؤال للبحث عنه بالعربية.
            trusted_only: هل تبحث في المواقع الموثوقة فقط (True).
        """
        print(f"\n🌐 [Web Search (Trusted)] Query: '{query}'...")
        session.say("أقوم الآن بالبحث في المواقع الإسلامية الموثوقة، ثوانٍ معدودة.")

        def sync_search(search_query: str, max_results: int = 5):
            with DDGS() as ddgs:
                return list(ddgs.text(search_query, max_results=max_results))

        try:
            results = []

            if trusted_only:
                # Build a site-restricted query: site:islamweb.net OR site:dorar.net ...
                site_filter = " OR ".join(f"site:{s}" for s in TRUSTED_SITES)
                restricted_query = f"({site_filter}) {query}"
                logger.info("Restricted query: %s", restricted_query)
                results = await asyncio.to_thread(sync_search, restricted_query, 5)

            # Fallback to open web if trusted search returned nothing
            if not results:
                logger.info("No trusted-site results; falling back to open web search.")
                results = await asyncio.to_thread(sync_search, query, 3)

            if not results:
                return "لم يتم العثور على نتائج. يرجى إعادة صياغة السؤال."

            # ── Citation logging ───────────────────────────────────────────
            sep = "─" * 60
            lines = [
                f"\n{sep}",
                f"🌐  WEB SEARCH CITATIONS  ({len(results)} results)",
                sep,
            ]
            for i, r in enumerate(results, 1):
                url = r.get("href", "")
                title = r.get("title", "بدون عنوان")
                is_trusted = any(site in url for site in TRUSTED_SITES)
                tag = "✅ trusted" if is_trusted else "⚠️  external"
                lines.append(f"  [{i}] {tag}  |  {title}")
                lines.append(f"       🔗 {url}")
            lines.append(sep)
            logger.info("\n".join(lines))
            # ──────────────────────────────────────────────────────────────

            # Format results for the LLM with clear citations
            formatted_results = []
            for i, r in enumerate(results, 1):
                title = r.get("title", "بدون عنوان")
                body = r.get("body", "")
                url = r.get("href", "")
                is_trusted = any(site in url for site in TRUSTED_SITES)
                trust_tag = "✅ موقع موثوق" if is_trusted else "⚠️ مصدر خارجي"
                formatted_results.append(
                    f"[{i}] {trust_tag}\n"
                    f"العنوان: {title}\n"
                    f"المحتوى: {body}\n"
                    f"المصدر: {url}\n"
                )

            header = f"تم العثور على {len(results)} نتيجة:\n\n"
            return header + "\n".join(formatted_results)

        except Exception as e:
            logger.error("Error in web search: %s", str(e))
            return f"فشل البحث: {str(e)}"

    # Create session FIRST
    session = AgentSession(
        preemptive_generation=False,
        vad=vad,
        # turn_detection=MultilingualModel(),
        llm=inference.LLM(model="openai/gpt-4o"),
        stt=stt.FallbackAdapter(
            [
                deepgram.STT(model="nova-3", language="ar"),
                deepgram.STT(model="nova-2-general"),
            ]
        ),
        tts=inference.TTS(
            model="elevenlabs/eleven_multilingual_v2",
        ),
        tools=[search_islamic_rag, search_web],
    )

    @session.on("user_speech_committed")
    def on_user_speech(msg):
        print(f"\n🗣️ User: {msg.content}")

    @session.on("agent_speech_committed")
    def on_agent_speech(msg):
        print(f"🎙️ Agent (Nour): {msg.content}\n")

    # Register event handlers AFTER session exists
    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        nonlocal last_eou_metrics

        if ev.metrics.type == "eou_metrics":
            last_eou_metrics = ev.metrics

        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info("Usage summary: %s", summary)

    ctx.add_shutdown_callback(log_usage)

    await session.start(
        agent=Assistant(),
        record=True,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
            ),
        ),
    )


if __name__ == "__main__":
    # Suppress verbose LiveKit logs and only show warnings/errors to keep terminal clean
    logging.basicConfig(level=logging.WARNING, format="[%(levelname)s] %(message)s")
    print("\n" + "=" * 50)
    print("🚀 Voice Agent (Nour) Started Successfully!")
    print("Waiting for browser client to connect...")
    print("=" * 50 + "\n")
    agents.cli.run_app(server)
