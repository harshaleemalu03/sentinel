import pytest
from datetime import datetime, timezone

from src.schemas.transcript_event import TranscriptEvent, Speaker
from src.schemas.extraction import ExtractionResult, ExtractedItem
from src.schemas.action_extraction import ExtractedAction, ExtractedActionOwner
from src.services.truth_engine.engine import TruthEngine
from src.services.truth_engine.state_manager import IncidentStateManager


@pytest.mark.asyncio
async def test_action_owner_is_preserved():

    state_manager = IncidentStateManager()

    state = state_manager.create_incident(
        incident_id="INC-001",
        title="Payment Service Outage",
        severity="SEV-1",
    )

    event = TranscriptEvent(
        event_id="evt-action-001",
        incident_id="INC-001",
        timestamp=datetime.now(timezone.utc),
        speaker=Speaker(
            id="user-001",
            name="Priya",
            role="Incident Commander",
        ),
        text="Rahul, please check the payment service logs.",
    )

    extraction = ExtractionResult(
        items=[
            ExtractedItem(
                type="ACTION",
                statement="Check the payment service logs.",
                confidence=0.97,
                action=ExtractedAction(
                    title="Check the payment service logs.",
                    purpose="Investigate the payment outage.",
                    owner=ExtractedActionOwner(
                        id="user-002",
                        name="Rahul",
                        role="DevOps",
                    ),
                    priority="HIGH",
                ),
            )
        ]
    )

    engine = TruthEngine()

    state = await engine.process(
        event=event,
        extraction=extraction,
        state=state,
    )

    assert len(state.actions) == 1

    action = state.actions[0]

    assert action.owner is not None
    assert action.owner.name == "Rahul"
    assert action.owner.role == "DevOps"
    assert action.priority == "HIGH"
