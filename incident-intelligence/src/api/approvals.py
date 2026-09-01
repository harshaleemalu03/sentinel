from fastapi import APIRouter, HTTPException

from ..schemas.approval import (
    ApprovalDecision,
    ApprovalRequest,
)
from ..services.approval_service import ApprovalService


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

    result = approval_service.create_request(request)

    return {
        "status": "pending_approval",
        "approval": result.model_dump(),
    }


@router.get("/incidents/{incident_id}/approvals/{action_id}")
async def get_approval(
    incident_id: str,
    action_id: str,
):

    request = approval_service.get_request(action_id)

    if request is None:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found",
        )

    if request.incident_id != incident_id:
        raise HTTPException(
            status_code=404,
            detail="Approval request not found",
        )

    return request.model_dump()


@router.post("/incidents/{incident_id}/approvals/decision")
async def decide_approval(
    incident_id: str,
    decision: ApprovalDecision,
):

    if decision.incident_id != incident_id:
        raise HTTPException(
            status_code=400,
            detail="Incident ID mismatch",
        )

    try:
        result = approval_service.decide(decision)

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    return {
        "status": "approval_updated",
        "approval": result.model_dump(),
    }
