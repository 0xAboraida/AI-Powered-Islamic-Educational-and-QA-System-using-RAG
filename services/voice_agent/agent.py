import os
import asyncio
import logging
import httpx
from dotenv import load_dotenv
from livekit import agents  
from livekit.agents import llm, stt, tts, inference
from livekit.agents import Agent, AgentServer, AgentSession, JobContext, room_io
from livekit.agents import AgentStateChangedEvent, MetricsCollectedEvent, metrics
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from duckduckgo_search import DDGS

load_dotenv()
logger = logging.getLogger(__name__)


# Define your agent's behavior by extending the Agent class
class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""
أنت مساعد علمي إسلامي متخصص، اسمك "نور"، تساعد طلاب العلم الشرعي.
تتحدث بالعربية الفصحى الواضحة دائمًا، ولا تنتقل إلى الإنجليزية إلا إذا طلب المستخدم ذلك صراحةً.

## شخصيتك:
- أسلوبك دافئ، علمي، ومحترم — كأنك شيخ متواضع يحدّث طالبًا.
- ابدأ إجاباتك بمقدمة قصيرة تُرحّب بالسؤال أو تُقدّر اهتمام الطالب.
- قسّم الإجابة بوضوح: الحكم الشرعي أولًا، ثم الدليل، ثم التوضيح إن لزم.
- اختم بجملة تشجيعية أو دعاء مختصر.
- إذا كان السؤال يحتمل خلافًا بين المذاهب، اذكر الأقوال الرئيسية باختصار.

## أدواتك:
1. `search_islamic_rag`: استخدمها لأي سؤال عن كتب إسلامية محددة أو فقه أو حديث أو تفسير مخزّن في قاعدة البيانات.
2. `search_web`: استخدمها للبحث السريع في المواقع الإسلامية الموثوقة.

## قواعد الإجابة:
- **دائمًا** استخدم الأدوات قبل الإجابة على أسئلة دينية — لا تجتهد من عندك.
- اذكر المصدر الذي استقيت منه المعلومة بشكل طبيعي في الكلام، مثل: "كما جاء في الدرر السنية..." أو "وفقًا لما ذكره ابن باز رحمه الله...".
- إذا لم تجد إجابة واضحة، قل ذلك بصدق وأرشد الطالب لمن يسأل.
- لا تطوّل الإجابة الصوتية — كن وافيًا لكن مختصرًا، فالمستمع لا يقرأ.
"""
        )
server = AgentServer()
vad = silero.VAD.load()


# The entrypoint function runs when a participant joins the room
@server.rtc_session()
async def entrypoint(ctx: JobContext):

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
        """Search the Qdrant & MongoDB Islamic books database (RAG) for source texts.

        Returns raw retrieved passages from Islamic books so you can synthesize
        an accurate, voice-optimized Arabic answer from primary sources.

        Choose the domain that best matches the question:
          1 = فقه       (Islamic jurisprudence — rulings, halal/haram, worship, transactions)
          2 = العقيدة   (Creed & theology — beliefs, tawhid, attributes of Allah)
          3 = السيرة    (Biography of the Prophet ﷺ and his companions)
          4 = التفسير   (Quranic exegesis — meaning and explanation of Quran verses)
          5 = الحديث    (Hadith sciences — narrations, chains, authenticity)
          6 = علوم القران (Quranic sciences — revelation, recitation, preservation)
          7 = التاريخ   (Islamic history — events, civilisations, dynasties)
          8 = علوم اللغه (Arabic language sciences — grammar, morphology, rhetoric)

        Args:
            query: The question or search term to look up in the Islamic books.
            domain: Domain integer (1–8) that best fits the topic of the query.
        """
        domain_name = DOMAIN_MAPPING.get(domain, "غير معروف")
        logger.info("RAG /chunks triggered — query: %s | domain: %s (%s)",
                    query, domain, domain_name)
        session.say("جاري البحث قي قواعد زاد للعلم الشرعي .... يرجي الانتظار")

        chunks_url = os.getenv("RAG_CHUNKS_URL")
        if not chunks_url:
            return "خطأ: لم يتم إعداد رابط RAG_CHUNKS_URL في ملف .env."

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
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
                    "لم أجد نصوصًا مباشرة في قاعدة البيانات لهذا السؤال. "
                    "أجب بناءً على علمك العام في المجال الشرعي مع الإشارة إلى ذلك."
                )

            # ── Citation logging ─────────────────────────────────────────────
            sep = "─" * 60
            log_lines = [f"\n{sep}", f"📚  RAG CHUNKS  ({len(chunks)} retrieved)", sep]
            for i, chunk in enumerate(chunks, 1):
                meta = chunk.get("metadata") or {}
                title  = meta.get("book_title") or meta.get("title") or "مصدر غير معروف"
                author = meta.get("author") or ""
                page   = meta.get("page") or meta.get("page_number") or ""
                score  = chunk.get("best_child_score") or chunk.get("score") or ""
                page_info  = f" ص.{page}" if page else ""
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
                meta   = chunk.get("metadata") or {}
                title  = meta.get("book_title") or meta.get("title") or "مصدر غير معروف"
                author = meta.get("author") or ""
                page   = meta.get("page") or meta.get("page_number") or ""
                text   = (
                    chunk.get("text")
                    or chunk.get("page_content")
                    or chunk.get("content")
                    or ""
                )
                header = f"📖 المصدر {i}"
                if title:  header += f" — {title}"
                if author: header += f" | {author}"
                if page:   header += f" (ص. {page})"

                context_parts.append(header)
                context_parts.append("─" * 40)
                context_parts.append(text.strip())
                context_parts.append("")

            context_parts.append(
                "[تعليمات: اعتمد على هذه النصوص في إجابتك، واذكر المرجع بشكل طبيعي "
                "في الكلام. الإجابة للصوت: اجعلها واضحة ومختصرة دون تنسيق مرئي.]"
            )

            return "\n".join(context_parts)

        except Exception as e:
            logger.error("Error calling RAG /chunks: %s", str(e))
            return f"حدث خطأ أثناء الاتصال بقاعدة البيانات: {str(e)}"


    # ── Trusted Islamic websites ──────────────────────────────────────────────
    # Add or remove sites from this list to control where the agent searches.
    TRUSTED_SITES = [
        "islamweb.net",       # فتاوى وبحوث إسلامية شاملة
        "dorar.net",          # الدرر السنية - موسوعة الحديث والفقه
        "islamqa.info",       # إسلام سؤال وجواب (ابن عثيمين وغيره)
        "binbaz.org.sa",      # موقع الشيخ ابن باز
        "binothaimeen.net",   # موقع الشيخ ابن عثيمين
        "sunnah.com",         # كتب الحديث النبوي
        "quran.com",          # القرآن الكريم
        "alukah.net",         # الألوكة - ملتقى أهل العلم
        "islamhouse.com",     # بيت الإسلام
        "ketabonline.com",    # جامع الكتب الإسلامية - آلاف الكتب الشرعية
    ]

    @llm.function_tool
    async def search_web(query: str, trusted_only: bool = True) -> str:
        """Search trusted Islamic websites for reliable answers about Islamic topics.
        Always prefer this over open-web search for religious questions.
        
        Args:
            query: The search query in Arabic or English.
            trusted_only: If True (default), only searches curated Islamic sites.
                          Set to False to search the open web if no results found.
        """
        logger.info("Web search triggered for query: %s (trusted_only=%s)", query, trusted_only)
        session.say("جاري البحث في مواقع إسلامية موثوقة...")

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
            lines = [f"\n{sep}", f"🌐  WEB SEARCH CITATIONS  ({len(results)} results)", sep]
            for i, r in enumerate(results, 1):
                url        = r.get("href", "")
                title      = r.get("title", "بدون عنوان")
                is_trusted = any(site in url for site in TRUSTED_SITES)
                tag        = "✅ trusted" if is_trusted else "⚠️  external"
                lines.append(f"  [{i}] {tag}  |  {title}")
                lines.append(f"       🔗 {url}")
            lines.append(sep)
            logger.info("\n".join(lines))
            # ──────────────────────────────────────────────────────────────

            # Format results for the LLM with clear citations
            formatted_results = []
            for i, r in enumerate(results, 1):
                title   = r.get("title", "بدون عنوان")
                body    = r.get("body", "")
                url     = r.get("href", "")
                is_trusted = any(site in url for site in TRUSTED_SITES)
                trust_tag  = "✅ موقع موثوق" if is_trusted else "⚠️ مصدر خارجي"
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
        preemptive_generation=True,
        vad=vad,
        turn_detection=MultilingualModel(),
        
        llm=llm.FallbackAdapter(
            [
                inference.LLM(model="openai/gpt-4.1-mini"),
                inference.LLM(model="google/gemini-2.5-flash"),
            ]
        ),

        stt=stt.FallbackAdapter(
            [  
                inference.STT.from_model_string("deepgram/nova-3:ar"),   
                inference.STT.from_model_string("deepgram/flux-general-multi"),
            ]
        ),


        tts=tts.FallbackAdapter(
            [
                # Jameson (Masculine)
                inference.TTS.from_model_string("cartesia/sonic-3:a5136bf9-224c-4d76-b823-52bd5efcffcc"),
                # Liam (Masculine)
                inference.TTS.from_model_string("elevenlabs/eleven_multilingual_v2:TX3293t2o4lhLdbCgKwD"),
            ]
        ),

        
        tools=[search_islamic_rag, search_web],
    )

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
    logging.basicConfig(level=logging.INFO)
    agents.cli.run_app(server)
