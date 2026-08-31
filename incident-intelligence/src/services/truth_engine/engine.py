from ...schemas.transcript_event import TranscriptEvent
from ...schemas.extraction import ExtractionResult
from ...schemas.entities import (
    Fact,
    Hypothesis,
    Action,
    Decision,
    EntityPriority,
)
from ...schemas.incident_state import IncidentState


class TruthEngine:

    async def process(
        self,
        event: TranscriptEvent,
        extraction: ExtractionResult,
        state: IncidentState,
    ) -> IncidentState:

        for index, item in enumerate(extraction.items):

            entity_id = f"{item.type.lower()}-{event.event_id}-{index}"

            if item.type == "FACT":

                fact = Fact(
                    id=entity_id,
                    statement=item.statement,
                    status="UNVERIFIED",
                    source_event_id=event.event_id,
                )

                state.facts.append(fact)

            elif item.type == "HYPOTHESIS":

                hypothesis = Hypothesis(
                    id=entity_id,
                    statement=item.statement,
                    status="UNCONFIRMED",
                    source_event_id=event.event_id,
                )

                state.hypotheses.append(hypothesis)

            elif item.type == "ACTION":

                action = Action(
                    id=entity_id,
                    title=item.statement,
                    purpose="Extracted from incident conversation",
                    priority=EntityPriority.MEDIUM,
                )

                state.actions.append(action)

            elif item.type == "DECISION":

                decision = Decision(
                    id=entity_id,
                    decision=item.statement,
                    reason="Extracted from incident conversation",
                )

                state.decisions.append(decision)

        state.version += 1

        return state
