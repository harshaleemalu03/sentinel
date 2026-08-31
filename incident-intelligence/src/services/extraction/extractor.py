from ...schemas.transcript_event import TranscriptEvent
from ...schemas.extraction import ExtractionResult
from .provider import LLMProvider
from .prompts import SYSTEM_PROMPT, build_extraction_prompt


class IncidentExtractor:

    def __init__(self, provider: LLMProvider):
        self.provider = provider

    async def extract(
        self,
        event: TranscriptEvent,
        context: str = ""
    ) -> ExtractionResult:

        prompt = build_extraction_prompt(
            event.text,
            context
        )

        return await self.provider.extract(
            event=event,
            context=SYSTEM_PROMPT + "\n" + prompt
        )
