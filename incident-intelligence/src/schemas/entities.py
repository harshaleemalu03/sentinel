from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel

from .source import SourceReference


class FactStatus(str, Enum):
    CONFIRMED = "CONFIRMED"
    UNVERIFIED = "UNVERIFIED"


class HypothesisStatus(str, Enum):
    UNCONFIRMED = "UNCONFIRMED"
    SUPPORTED = "SUPPORTED"
    CONTRADICTED = "CONTRADICTED"
    RESOLVED = "RESOLVED"


class EntityPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ActionStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"


class ConflictStatus(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


class Fact(BaseModel):
    id: str
    statement: str
    status: FactStatus
    source: SourceReference
    evidence: list[str] = []


class Hypothesis(BaseModel):
    id: str
    statement: str
    status: HypothesisStatus
    source: SourceReference
    supporting_evidence: list[str] = []
    contradicting_evidence: list[str] = []
    required_evidence: list[str] = []


class Conflict(BaseModel):
    id: str
    description: str
    related_items: list[str]
    status: ConflictStatus
    required_evidence: list[str] = []


class MissingInformation(BaseModel):
    id: str
    question: str
    reason: str
    related_hypothesis_id: Optional[str] = None
    status: str = "OPEN"
    priority: EntityPriority = EntityPriority.MEDIUM


class ActionOwner(BaseModel):
    id: str
    name: str
    role: str


class Action(BaseModel):
    id: str
    title: str
    owner: Optional[ActionOwner] = None
    purpose: str
    related_hypothesis_id: Optional[str] = None
    status: ActionStatus = ActionStatus.PENDING
    priority: EntityPriority = EntityPriority.MEDIUM
    requires_human_approval: bool = False


class Decision(BaseModel):
    id: str
    decision: str
    reason: str
    proposed_by: Optional[str] = None
    status: str = "PENDING"
    requires_human_approval: bool = False


class TimelineEvent(BaseModel):
    id: str
    timestamp: datetime
    event_type: str
    description: str
    related_entities: list[str] = []
    source_event_id: Optional[str] = None
