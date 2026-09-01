from typing import Literal

from pydantic import BaseModel


class ApprovalRequest(BaseModel):
    action_id: str
    incident_id: str
    requested_by: str
    reason: str
    status: Literal[
        "PENDING",
        "APPROVED",
        "REJECTED",
    ] = "PENDING"


class ApprovalDecision(BaseModel):
    action_id: str
    incident_id: str
    decided_by: str
    decision: Literal[
        "APPROVED",
        "REJECTED",
    ]
    comment: str = ""
