from datetime import datetime

from fastapi import APIRouter, HTTPException

from ..schemas.entities import ActionStatus
from ..services.truth_engine.state_manager import state_manager


router = APIRouter(
    prefix="/api/v1",
    tags=["Action Results"],
)


@router.post("/incidents/{incident_id}/action-results")
async def receive_action_result(
    incident_id: str,
    payload: dict,
):
    """
    Receive the result of an action executed by Person 3.

    Person 3 may execute the action through Jira, PagerDuty,
    Slack, or another integration and report the result here.
    """

    state = state_manager.get_incident(incident_id)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    # P3's own action ID.
    action_id = payload.get("actionId")

    # Original P2 action ID.
    source_ref_id = payload.get("sourceRefId")

    result = payload.get("result", {})

    # Find the matching action.
    matched_action = None

    for action in state.actions:
        if action.id == action_id:
            matched_action = action
            break

        if action.id == source_ref_id:
            matched_action = action
            break

    if matched_action is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Action not found. "
                f"actionId={action_id}, "
                f"sourceRefId={source_ref_id}"
            ),
        )

    # Mark the original P2 action as completed.
    # Use the enum instead of a raw string.
    matched_action.status = ActionStatus.COMPLETED

    state.version += 1
    state.last_updated = datetime.utcnow()

    state_manager.update_incident(state)

    return {
        "ok": True,
        "incident_id": incident_id,
        "action_id": matched_action.id,
        "external_action_id": action_id,
        "result": result,
        "state_version": state.version,
    }