import os
import pytest
from datetime import datetime, timezone

from src.schemas.transcript_event import TranscriptEvent, Speaker
from src.services.extraction.openai_provider import OpenAIProvider


@pytest.mark.asyncio
async def test_real_openai_extraction():

    if not os.getenv("OPENAI_API_KEY"):
        pytest.skip("OPENAI_API_KEY is not configured")

    provider = OpenAIProvider()

    event = TranscriptEvent(
        event_id="evt-test-001",
        incident_id="INC-TEST-001",
        timestamp=datetime.now(timezone.utc),
        speaker=Speaker(
            id="user-001",
            name="Rahul",
            role="DevOps",
        ),
        text="Payment API latency has crossed 8 seconds.",
    )

    result = await provider.extract(event)

    assert len(result.items) > 0

    assert any(
        item.type == "FACT"
        for item in result.items
    )
