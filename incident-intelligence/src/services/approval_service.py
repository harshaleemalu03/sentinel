from ..schemas.approval import (
    ApprovalDecision,
    ApprovalRequest,
)
from ..schemas.incident_state import IncidentState


class ApprovalService:

    def create_request(
        self,
        request: ApprovalRequest,
        state: IncidentState,
    ) -> ApprovalRequest:

        existing = next(
            (
                approval
                for approval in state.approvals
                if approval.action_id == request.action_id
            ),
            None,
        )

        if existing:
            return existing

        state.approvals.append(request)

        return request

    def get_request(
        self,
        action_id: str,
        state: IncidentState,
    ) -> ApprovalRequest | None:

        return next(
            (
                approval
                for approval in state.approvals
                if approval.action_id == action_id
            ),
            None,
        )

    def decide(
        self,
        decision: ApprovalDecision,
        state: IncidentState,
    ) -> ApprovalRequest:

        request = self.get_request(
            decision.action_id,
            state,
        )

        if request is None:
            raise ValueError(
                "Approval request not found."
            )

        request.status = decision.decision

        return request
