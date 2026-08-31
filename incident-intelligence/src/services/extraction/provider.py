from abc import ABC, abstractmethod

from ...schemas.extraction import ExtractionResult
from ...schemas.transcript_event import TranscriptEvent


class LLMProvider(ABC):

    @abstractmethod
    async def extract(
        self,
        event: TranscriptEvent,
        context: str = ""
    ) -> ExtractionResult:
        pass
