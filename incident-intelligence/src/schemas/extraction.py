from typing import Literal, Optional

from pydantic import BaseModel, Field

from .action_extraction import ExtractedAction


class ExtractedItem(BaseModel):
    type: Literal[
        "FACT",
        "HYPOTHESIS",
        "DECISION",
        "ACTION",
        "EVIDENCE",
    ]

    statement: str

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    supporting_evidence: list[str] = []
    contradicting_evidence: list[str] = []
    required_evidence: list[str] = []

    action: Optional[ExtractedAction] = None


class PotentialConflict(BaseModel):
    new_statement: str
    existing_statement: str
    explanation: str

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )


class ExtractionResult(BaseModel):
    items: list[ExtractedItem] = []
    potential_conflicts: list[PotentialConflict] = []
