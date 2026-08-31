from ...schemas.extraction import (
    ExtractionResult,
    ExtractedItem
)
from ...schemas.transcript_event import TranscriptEvent
from .provider import LLMProvider


class MockProvider(LLMProvider):

    async def extract(
        self,
        event: TranscriptEvent,
        context: str = ""
    ) -> ExtractionResult:

        text = event.text.lower()

        items = []

        if "latency" in text or "error" in text or "failure" in text:
            items.append(
                ExtractedItem(
                    type="FACT",
                    statement=event.text,
                    confidence=0.95
                )
            )

        if any(
            phrase in text
            for phrase in [
                "i think",
                "maybe",
                "probably",
                "might be"
            ]
        ):
            items.append(
                ExtractedItem(
                    type="HYPOTHESIS",
                    statement=event.text,
                    confidence=0.90
                )
            )

        return ExtractionResult(items=items)
