from pydantic import BaseModel

from .incident_state import IncidentState


class IntelligenceResponse(BaseModel):
    incident_id: str
    event_id: str
    state_version: int
    incident_state: IncidentState
