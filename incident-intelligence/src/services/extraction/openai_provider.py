import os

from openai import AsyncOpenAI

from ...schemas.extraction import ExtractionResult
from ...schemas.transcript_event import TranscriptEvent
from .provider import LLMProvider
from .prompts import SYSTEM_PROMPT, build_extraction_prompt


class OpenAIProvider(LLMProvider):

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is not set."
            )

        self.client = AsyncOpenAI(api_key=api_key)

    async def extract(
        self,
        event: TranscriptEvent,
        context: str = "",
    ) -> ExtractionResult:

        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        try:
            response = await self.client.beta.chat.completions.parse(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": build_extraction_prompt(
                            event.text,
                            context,
                        ),
                    },
                ],
                response_format=ExtractionResult,
            )

            parsed = response.choices[0].message.parsed
            if parsed is None:
                return ExtractionResult(items=[])

            return parsed
        except Exception as e:
            # Fallback to empty extraction result if OpenAI call fails
            return ExtractionResult(items=[])

