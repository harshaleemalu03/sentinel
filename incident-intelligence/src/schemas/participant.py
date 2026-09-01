from pydantic import BaseModel


class Participant(BaseModel):
    id: str
    name: str
    role: str
    role_confidence: float
    last_seen_event_id: str
    active: bool = True
