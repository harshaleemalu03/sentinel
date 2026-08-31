from fastapi import APIRouter

from ..schemas.transcript_event import TranscriptEvent

router = APIRouter(
    prefix="/api/v1",
    tags=["Incident Events"]
)


@router.post("/incidents/{incident_id}/events")
async def receive_transcript_event(
    incident_id: str,
    event: TranscriptEvent
):
    """
    Receive a transcript event from the Agora voice module.
    """

    # Make sure the event belongs to the correct incident
    if event.incident_id != incident_id:
        return {
            "status": "error",
            "message": "Incident ID mismatch"
        }

    # Temporary response.
    # Later this will trigger:
    # Transcript → LLM Extraction → Truth Engine → Incident State

    return {
        "status": "received",
        "event_id": event.event_id,
        "incident_id": incident_id
    }
