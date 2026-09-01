from fastapi import APIRouter, HTTPException

from ..services.truth_engine.state_manager import state_manager


router = APIRouter(
    prefix="/api/v1",
    tags=["Incident Timeline"],
)


@router.get("/incidents/{incident_id}/timeline")
async def get_incident_timeline(incident_id: str):

    state = state_manager.get_incident(incident_id)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    return {
        "incident_id": incident_id,
        "timeline": [
            event.model_dump()
            for event in state.timeline
        ],
    }
