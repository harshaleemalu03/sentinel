from datetime import datetime
from pydantic import BaseModel

from .entities import (
    Action,
    Conflict,
    Decision,
    Fact,
    Hypothesis,
    MissingInformation,
    TimelineEvent,
)


class IncidentState(BaseModel):
    incident_id: str
    title: str
    severity: str
    status: str

    facts: list[Fact] = []
    hypotheses: list[Hypothesis] = []
    conflicts: list[Conflict] = []
    unknowns: list[MissingInformation] = []
    decisions: list[Decision] = []
    actions: list[Action] = []
    timeline: list[TimelineEvent] = []

    version: int = 1
    last_updated: datetime
