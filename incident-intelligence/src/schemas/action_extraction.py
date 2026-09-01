from typing import Optional

from pydantic import BaseModel


class ExtractedActionOwner(BaseModel):
    id: Optional[str] = None
    name: str
    role: Optional[str] = None


class ExtractedAction(BaseModel):
    title: str
    purpose: str
    owner: Optional[ExtractedActionOwner] = None
    priority: str = "MEDIUM"
    related_hypothesis: Optional[str] = None
    requires_human_approval: bool = False
