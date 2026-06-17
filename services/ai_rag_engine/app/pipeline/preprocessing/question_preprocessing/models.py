from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# Enum-like strict values for the Kitab (Fiqh Topics)
KitabType = Literal[
    "كتاب الطهارة", "كتاب الصلاة", "كتاب الزكاة", "كتاب الصيام", "كتاب الحج",
    "كتاب البيوع", "كتاب النكاح", "كتاب الطلاق", "كتاب العدة", "كتاب الرضاع",
    "كتاب الحدود", "كتاب القصاص", "كتاب الجنايات", "كتاب الأيمان", "كتاب النذور",
    "كتاب الأطعمة", "كتاب اللباس", "كتاب الجنائز", "كتاب الوقف", "كتاب الهبة",
    "كتاب القضاء", "كتاب الشهادات", "كتاب الإجارة", "كتاب الوصية", "كتاب الفرائض"
]

class QuestionMetadata(BaseModel):
    """Metadata extracted from a single user question."""
    domain: Optional[str] = Field(
        None, 
        description="The Islamic domain of the question (e.g., Fiqh, Aqeedah). null if is_safe is false."
    )
    kitab: Optional[KitabType] = Field(
        None, 
        description="Mandatory ONLY if domain is 'Fiqh' or 'فقه'. Must be one of the precise 25 Kitab names. Otherwise, null."
    )
    author: Optional[str] = Field(
        None, 
        description="The name of the author or scholar mentioned in the query, if any."
    )
    source_book: Optional[str] = Field(
        None, 
        description="The name of the specific Islamic book mentioned in the query, if any."
    )
    madhhab: Optional[str] = Field(
        None, 
        description="The Islamic school of thought mentioned in the query, if any (e.g., Hanbali, Shafi'i)."
    )

class ProcessedQuestion(BaseModel):
    """A single processed question resulting from query splitting and rewriting."""
    original_question: str = Field(
        ..., 
        description="The exact text of the question as extracted from the user's input."
    )
    search_query: Optional[str] = Field(
        None, 
        description="A standalone, highly optimized version of the question rewritten in MSA. Must be null if is_safe is false."
    )
    is_safe: bool = Field(
        ..., 
        description="True ONLY if the question is related to Islamic sciences. False if out of scope or harmful."
    )
    metadata: Optional[QuestionMetadata] = Field(
        None, 
        description="The metadata parameters required to filter the RAG search. Must be null if is_safe is false."
    )

class QuestionProcessingResult(BaseModel):
    """The final structured output from the LLM containing all processed questions."""
    total_questions: int = Field(
        ..., 
        description="The total number of distinct questions extracted from the user input."
    )
    questions: List[ProcessedQuestion] = Field(
        ..., 
        description="The list of processed questions."
    )
