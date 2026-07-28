import logging
import threading
from pydantic import BaseModel, Field
from typing import Literal

from services.ai_rag_engine.app.config.settings import settings
from langchain_google_genai import ChatGoogleGenerativeAI, HarmCategory, HarmBlockThreshold
from langchain_core.messages import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)

DomainLiteral = Literal[
    "فقه",
    "العقيدة",
    "السيرة",
    "التفسير",
    "الحديث",
    "علوم القرآن",
    "التاريخ",
    "علوم اللغة",
]

class DomainClassificationResult(BaseModel):
    domain: DomainLiteral = Field(description="المجال المصنف للسؤال")

class DomainClassifier:
    """
    Classifies a user query into one of the available domains.
    Used when the user selects 'auto' or when FORCE_DOMAIN_DETECTION is True.
    """
    def __init__(self):
        self.models = []
        self._index = 0
        self._lock = threading.Lock()
        
        from services.ai_rag_engine.app.config.key_manager import gemini_key_manager
        
        all_keys = gemini_key_manager.get_all_keys()
        if not all_keys:
            all_keys = [""]
            
        for key in all_keys:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                temperature=0.0,
                google_api_key=key,
                max_retries=0,
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                },
            )
            # Initialize Structured Output ONCE per key!
            self.models.append(llm.with_structured_output(DomainClassificationResult))

    def _get_next_model_index(self) -> int:
        """Thread-safe round-robin index generator."""
        with self._lock:
            idx = self._index
            self._index = (self._index + 1) % len(self.models)
            return idx

    async def detect_domain(self, query: str) -> str:
        # Use Chat Messages instead of raw prompt
        messages = [
            SystemMessage(content="""أنت خبير ومصنف للأسئلة الإسلامية.
صنف السؤال في أحد المجالات التالية فقط:
- فقه
- العقيدة
- السيرة
- التفسير
- الحديث
- علوم القرآن
- التاريخ
- علوم اللغة

إذا احتمل السؤال أكثر من مجال اختر الأقرب. إذا لم تعرف اختر فقه."""),
            HumanMessage(content=query)
        ]

        # Start from the current round-robin index
        start_idx = self._get_next_model_index()
        
        for i in range(len(self.models)):
            current_idx = (start_idx + i) % len(self.models)
            model = self.models[current_idx]
            
            try:
                result = await model.ainvoke(messages)
                domain = result.domain
                
                if domain not in settings.SUPPORTED_DOMAINS:
                    domain = "فقه"
                    
                return domain
            except Exception as e:
                # Log the index, NOT the API key!
                logger.debug(f"[DomainClassifier] Key index {current_idx} failed (Attempt {i+1}): {e}")
                continue
                
        logger.error("[DomainClassifier] All keys failed. Defaulting to 'فقه'.")
        return "فقه"
