from ...schemas.transcript_event import TranscriptEvent
from ...schemas.extraction import ExtractionResult


class IncidentExtractor:

    async def extract(
        self,
        event: TranscriptEvent,
        context: str = ""
    ) -> ExtractionResult:
        """
        Convert a transcript event into structured incident information.
        """

        # LLM implementation will be added here.
        return ExtractionResult(items=[])
