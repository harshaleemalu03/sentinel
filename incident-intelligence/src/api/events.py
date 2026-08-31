from fastapi import APIRouter, HTTPException

from ..schemas.transcript_event import TranscriptEvent
from ..services.extraction.extractor import IncidentExtractor
from ..services.extraction.mock_provider import MockProvider
from ..services.truth_engine.engine import TruthEngine
from ..services.truth_engine.state_manager import IncidentStateManager


router = APIRouter(
    prefix="/api/v1",
    tags=["Incident Events"]
)


state_manager = IncidentStateManager()
extractor = IncidentExtractor(MockProvider())
truth_engine = TruthEngine()


@router.post("/incidents/{incident_id}/events")
async def receive_transcript_event(
    incident_id: str,
    event: TranscriptEvent
):
    if event.incident_id != incident_id:
        raise HTTPException(
            status_code=400,
            detail="Incident ID mismatch"
        )

    state = state_manager.get_incident(incident_id)

    if state is None:
        state = state_manager.create_incident(
            incident_id=incident_id,
            title="Payment Service Outage",
            severity="SEV-1",
        )

    extraction = await extractor.extract(event)

    state = await truth_engine.process(
        event=event,
        extraction=extraction,
        state=state,
    )

    state_manager.update_incident(state)

    return {
        "status": "processed",
        "incident_id": incident_id,
        "event_id": event.event_id,
        "extracted": extraction.model_dump(),
        "incident_state": state.model_dump(),
    }


@router.get("/incidents/{incident_id}/state")
async def get_incident_state(incident_id: str):

    state = state_manager.get_incident(incident_id)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    return state.model_dump()
