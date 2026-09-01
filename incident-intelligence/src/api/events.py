from fastapi import APIRouter, HTTPException

from ..schemas.transcript_event import TranscriptEvent
from ..schemas.intelligence_response import IntelligenceResponse
from ..services.extraction.extractor import IncidentExtractor
from ..services.extraction.mock_provider import MockProvider
from ..services.extraction.openai_provider import OpenAIProvider
from ..services.extraction.context_builder import build_incident_context
from ..services.truth_engine.engine import TruthEngine
from ..services.truth_engine.state_manager import state_manager


router = APIRouter(
    prefix="/api/v1",
    tags=["Incident Events"],
)


truth_engine = TruthEngine()


def create_extractor() -> IncidentExtractor:
    try:
        provider = OpenAIProvider()
        return IncidentExtractor(provider)
    except ValueError:
        return IncidentExtractor(MockProvider())


extractor = create_extractor()


@router.post(
    "/incidents/{incident_id}/events",
    response_model=IntelligenceResponse,
)
async def receive_transcript_event(
    incident_id: str,
    event: TranscriptEvent,
):

    if event.incident_id != incident_id:
        raise HTTPException(
            status_code=400,
            detail="Incident ID mismatch",
        )

    state = state_manager.get_incident(incident_id)

    if state is None:
        state = state_manager.create_incident(
            incident_id=incident_id,
            title="Payment Service Outage",
            severity="SEV-1",
        )

    context = build_incident_context(state)

    extraction = await extractor.extract(
        event=event,
        context=context,
    )

    state = await truth_engine.process(
        event=event,
        extraction=extraction,
        state=state,
    )

    state_manager.update_incident(state)

    return IntelligenceResponse(
        incident_id=incident_id,
        event_id=event.event_id,
        state_version=state.version,
        incident_state=state,
    )


@router.get("/incidents/{incident_id}/state")
async def get_incident_state(
    incident_id: str,
):

    state = state_manager.get_incident(incident_id)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    return state.model_dump()
