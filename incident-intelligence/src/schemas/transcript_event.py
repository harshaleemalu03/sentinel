from datetime import datetime
from pydantic import BaseModel, Field


class Speaker(BaseModel):
    id: str
    name: str
    role: str


class TranscriptEvent(BaseModel):
    event_id: str
    incident_id: str
    timestamp: datetime
    speaker: Speaker
    text: str = Field(min_length=1)
