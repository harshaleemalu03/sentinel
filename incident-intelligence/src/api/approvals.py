from fastapi import APIRouter, HTTPException

from ..schemas.approval import (
    ApprovalDecision,
    ApprovalRequest,
)
from ..services.approval_service import ApprovalService
from ..services.truth_engine.state_manager import state_manager


router = APIRouter(
    prefix="/api/v1",
    tags=["Approvals"],
)


approval_service = ApprovalService()


@router.post("/incidents/{incident_id}/approvals")
async def create_approval_request(
    incident_id: str,
    request: ApprovalRequest,
):

    if request.incident_id != incident_id:
        raise HTTPException(
            status_code=400,
            detail="Incident ID mismatch",
        )

    state = state_manager.get_incident(incident_id)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    action = next(
        (
            action
            for action in state.actions
            if action.id == request.action_id
        ),
        None,
    )

    if action is None:
        raise HTTPException(
            status_code=404,
            detail="Action not found",
        )

    if not action.requires_human_approval:
        raise HTTPException(
            status_code=400,
            detail="This action does not require human approval",
        )

    result = approval_service.create_request(
        request=request,
        state=state,
    )

    state_manager.update_incident(state)

    return {
        "status": "pending_approval",
        "approval": result.model_dump(),
    }


@router.get(
    "/incidents/{incident_id}/approvals/{action_id}"
)
async def get_approval(
    incident_id: str,
    action_id: str,
):

    state = state_manager.get_incident(incident_id)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    request = approval_service.get_request(
        action_id=action_id,
        state=state,
    )

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found",
        )

    return request.model_dump()


@router.post(
    "/incidents/{incident_id}/approvals/decision"
)
async def decide_approval(
    incident_id: str,
    decision: ApprovalDecision,
):

    if decision.incident_id != incident_id:
        raise HTTPException(
            status_code=400,
            detail="Incident ID mismatch",
        )

    state = state_manager.get_incident(incident_id)

    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    try:
        result = approval_service.decide(
            decision=decision,
            state=state,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    state_manager.update_incident(state)

    return {
        "status": "approval_updated",
        "approval": result.model_dump(),
    }
