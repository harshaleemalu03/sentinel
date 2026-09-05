import pytest
from datetime import datetime, timezone

from src.schemas.transcript_event import TranscriptEvent, Speaker
from src.schemas.approval import ApprovalDecision
from src.services.extraction.extractor import IncidentExtractor
from src.services.extraction.mock_provider import MockProvider
from src.services.truth_engine.engine import TruthEngine
from src.services.truth_engine.state_manager import IncidentStateManager
from src.services.approval_service import ApprovalService


@pytest.mark.asyncio
async def test_human_approval_lifecycle():
    state_manager = IncidentStateManager()
    extractor = IncidentExtractor(MockProvider())
    engine = TruthEngine()
    approval_service = ApprovalService()

    state = state_manager.create_incident(
        incident_id="INC-APP-001",
        title="Payment Service Degradation",
        severity="SEV-1",
    )

    # Critical action requiring human approval
    event = TranscriptEvent(
        event_id="evt-rollback-001",
        incident_id="INC-APP-001",
        timestamp=datetime.now(timezone.utc),
        speaker=Speaker(
            id="user-ic",
            name="Priya",
            role="Incident Commander",
        ),
        text="Rahul, rollback payment-service v4.2 immediately.",
    )

    extraction = await extractor.extract(event)
    state = await engine.process(
        event=event,
        extraction=extraction,
        state=state,
    )

    # 1. Action extracted with human approval required
    assert len(state.actions) >= 1
    rollback_action = next(a for a in state.actions if "rollback" in a.title.lower())
    assert rollback_action.requires_human_approval is True

    # 2. Approval request created
    assert len(state.approvals) >= 1
    approval = next(ap for ap in state.approvals if ap.action_id == rollback_action.id)
    assert approval.status == "PENDING"

    # 3. Incident Commander decides to approve
    decision = ApprovalDecision(
        incident_id="INC-APP-001",
        action_id=rollback_action.id,
        decision="APPROVED",
        decided_by="Priya (Incident Commander)",
        comment="Rollback deployment v4.2 confirmed to remediate latency.",
    )


    result = approval_service.decide(decision=decision, state=state)
    assert result.status == "APPROVED"
    assert rollback_action.status == "APPROVED"

    # 4. Verified on timeline
    assert any(t.event_type == "ACTION_APPROVED" for t in state.timeline)
