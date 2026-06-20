from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class ChatRequest(BaseModel):
    """Request body for the /stream endpoint."""

    session_id: Optional[int] = Field(None, description="Unique ID for the conversation session.")
    query: str = Field(..., description="The user's current question.")
    domain: int = Field(
        ...,
        ge=1,
        le=8,
        description="1: فقه | 2: العقيدة | 3: السيرة | 4: التفسير | 5: الحديث | 6: علوم القران | 7: التاريخ | 8: علوم اللغه",
    )


class HierarchyInfo(BaseModel):
    kitab: Optional[str] = None
    sections: Optional[List[str]] = []


class CitationDict(BaseModel):
    """Final citation structure."""

    book_title: Optional[str] = None
    madhhab: Optional[str] = None
    author: Optional[str] = None
    author_death: Optional[str] = None
    total_parts: Optional[int] = None
    part: Optional[str] = None
    page_id: Optional[int] = None
    hierarchy: Optional[str] = None
    source_url: Optional[str] = None


class ChatResponse(BaseModel):
    """Final response structure."""

    answer: str
    citations: Optional[dict[str, CitationDict]] = Field(default=None)
