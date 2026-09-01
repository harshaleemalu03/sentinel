from ...schemas.approval import (
    ApprovalDecision,
    ApprovalRequest,
)


class ApprovalService:

    def __init__(self):
        self._requests: dict[str, ApprovalRequest] = {}

    def create_request(
        self,
        request: ApprovalRequest,
    ) -> ApprovalRequest:

        self._requests[request.action_id] = request

        return request

    def get_request(
        self,
        action_id: str,
    ) -> ApprovalRequest | None:

        return self._requests.get(action_id)

    def decide(
        self,
        decision: ApprovalDecision,
    ) -> ApprovalRequest:

        request = self._requests.get(decision.action_id)

        if request is None:
            raise ValueError(
                "Approval request not found."
            )

        request.status = decision.decision

        return request
