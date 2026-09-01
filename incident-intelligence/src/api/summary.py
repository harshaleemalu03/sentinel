from fastapi import APIRouter, HTTPException

from ..services.truth_engine.state_manager import state_manager


router = APIRouter(
    prefix="/api/v1",
    tags=["Incident Summary"],
)


@router.get("/incidents/{incident_id}/summary")
async def get_incident_summary(
    incident_id: str,
):

    state = state_manager.get_incident(incident_id)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    return {
        "incident_id": state.incident_id,
        "title": state.title,
        "severity": state.severity,
        "status": state.status,
        "facts": [
            fact.model_dump()
            for fact in state.facts
        ],
        "hypotheses": [
            hypothesis.model_dump()
            for hypothesis in state.hypotheses
        ],
        "open_conflicts": [
            conflict.model_dump()
            for conflict in state.conflicts
            if conflict.status == "OPEN"
        ],
        "open_information_gaps": [
            gap.model_dump()
            for gap in state.unknowns
            if gap.status == "OPEN"
        ],
        "actions": [
            action.model_dump()
            for action in state.actions
        ],
        "decisions": [
            decision.model_dump()
            for decision in state.decisions
        ],
        "pending_approvals": [
            approval.model_dump()
            for approval in state.approvals
            if approval.status == "PENDING"
        ],
        "timeline": [
            event.model_dump()
            for event in state.timeline
        ],
    }
