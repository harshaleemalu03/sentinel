from ..schemas.approval import (
    ApprovalDecision,
    ApprovalRequest,
)
from ..schemas.entities import ActionStatus
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

        # Update matching action in incident state
        for action in state.actions:
            if action.id == decision.action_id:
                try:
                    action.status = ActionStatus(decision.decision)
                except ValueError:
                    action.status = decision.decision
                break

        # Record approval decision on timeline
        from datetime import datetime, timezone
        from ..schemas.entities import TimelineEvent

        timeline_event = TimelineEvent(
            id=f"timeline-approval-{decision.action_id}-{int(datetime.now(timezone.utc).timestamp())}",
            timestamp=datetime.now(timezone.utc),
            event_type=f"ACTION_{decision.decision}",
            description=f"Action was {decision.decision.lower()} by {decision.decided_by}." + (f" Comment: {decision.comment}" if decision.comment else ""),

            related_entities=[decision.action_id],
        )
        state.timeline.append(timeline_event)
        state.version += 1

        return request

