from ...schemas.transcript_event import TranscriptEvent
from ...schemas.extraction import ExtractionResult
from ...schemas.incident_state import IncidentState


class TruthEngine:

    async def process(
        self,
        event: TranscriptEvent,
        extraction: ExtractionResult,
        state: IncidentState
    ) -> IncidentState:

        for item in extraction.items:

            if item.type == "FACT":
                self._process_fact(item, event, state)

            elif item.type == "HYPOTHESIS":
                self._process_hypothesis(item, event, state)

            elif item.type == "DECISION":
                self._process_decision(item, event, state)

            elif item.type == "ACTION":
                self._process_action(item, event, state)

            elif item.type == "EVIDENCE":
                self._process_evidence(item, event, state)

        state.version += 1

        return state

    def _process_fact(self, item, event, state):
        pass

    def _process_hypothesis(self, item, event, state):
        pass

    def _process_decision(self, item, event, state):
        pass

    def _process_action(self, item, event, state):
        pass

    def _process_evidence(self, item, event, state):
        pass
