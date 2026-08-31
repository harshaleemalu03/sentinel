import pytest
from datetime import datetime, timezone

from src.schemas.transcript_event import TranscriptEvent, Speaker
from src.services.extraction.extractor import IncidentExtractor
from src.services.extraction.mock_provider import MockProvider
from src.services.truth_engine.engine import TruthEngine
from src.services.truth_engine.state_manager import IncidentStateManager


@pytest.mark.asyncio
async def test_payment_incident_pipeline():

    state_manager = IncidentStateManager()

    extractor = IncidentExtractor(
        MockProvider()
    )

    truth_engine = TruthEngine()

    state = state_manager.create_incident(
        incident_id="INC-001",
        title="Payment Service Outage",
        severity="SEV-1",
    )

    event = TranscriptEvent(
        event_id="evt-001",
        incident_id="INC-001",
        timestamp=datetime.now(timezone.utc),
        speaker=Speaker(
            id="user-001",
            name="Rahul",
            role="DevOps",
        ),
        text="Payment API latency has crossed 8 seconds.",
    )

    extraction = await extractor.extract(event)

    state = await truth_engine.process(
        event=event,
        extraction=extraction,
        state=state,
    )

    assert len(state.facts) == 1
    assert state.facts[0].statement == (
        "Payment API latency has crossed 8 seconds."
    )

    assert len(state.timeline) == 1
    assert state.version == 2
