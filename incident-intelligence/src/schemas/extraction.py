from pydantic import BaseModel, Field
from typing import Literal


class ExtractedItem(BaseModel):
    type: Literal[
        "FACT",
        "HYPOTHESIS",
        "DECISION",
        "ACTION",
        "EVIDENCE"
    ]
    statement: str
    confidence: float = Field(ge=0.0, le=1.0)


class ExtractionResult(BaseModel):
    items: list[ExtractedItem] = []
