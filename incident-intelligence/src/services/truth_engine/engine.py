from ...schemas.transcript_event import TranscriptEvent
from ...schemas.extraction import ExtractionResult
from ...schemas.entities import (
    Fact,
    Hypothesis,
    Action,
    Decision,
    Conflict,
    EntityPriority,
    ConflictStatus,
)
from ...schemas.source import SourceReference
from ...schemas.incident_state import IncidentState
from ..conflict_detection.detector import ConflictDetector
from ..gap_detection.detector import GapDetector
from .timeline import add_timeline_event


class TruthEngine:

    def __init__(self):
        self.conflict_detector = ConflictDetector()
        self.gap_detector = GapDetector()

    async def process(
        self,
        event: TranscriptEvent,
        extraction: ExtractionResult,
        state: IncidentState,
    ) -> IncidentState:

        new_entity_ids = []

        source = SourceReference(
            event_id=event.event_id,
            speaker_id=event.speaker.id,
            speaker_name=event.speaker.name,
            speaker_role=event.speaker.role,
        )

        for index, item in enumerate(extraction.items):

            entity_id = f"{item.type.lower()}-{event.event_id}-{index}"

            if item.type == "FACT":

                fact = Fact(
                    id=entity_id,
                    statement=item.statement,
                    status="UNVERIFIED",
                    source=source,
                    evidence=item.supporting_evidence,
                )

                state.facts.append(fact)
                new_entity_ids.append(entity_id)

            elif item.type == "HYPOTHESIS":

                hypothesis = Hypothesis(
                    id=entity_id,
                    statement=item.statement,
                    status="UNCONFIRMED",
                    source=source,
                    supporting_evidence=item.supporting_evidence,
                    contradicting_evidence=item.contradicting_evidence,
                    required_evidence=item.required_evidence,
                )

                state.hypotheses.append(hypothesis)
                new_entity_ids.append(entity_id)

            elif item.type == "ACTION":

                action = Action(
                    id=entity_id,
                    title=item.statement,
                    purpose="Extracted from incident conversation",
                    priority=EntityPriority.MEDIUM,
                )

                state.actions.append(action)
                new_entity_ids.append(entity_id)

            elif item.type == "DECISION":

                decision = Decision(
                    id=entity_id,
                    decision=item.statement,
                    reason="Extracted from incident conversation",
                    proposed_by=event.speaker.name,
                )

                state.decisions.append(decision)
                new_entity_ids.append(entity_id)

        new_conflicts = []

        for potential in extraction.potential_conflicts:

            related_items = []

            for fact in state.facts:
                if fact.statement == potential.existing_statement:
                    related_items.append(fact.id)

            for hypothesis in state.hypotheses:
                if hypothesis.statement == potential.existing_statement:
                    related_items.append(hypothesis.id)

            for entity_id, item in zip(
                new_entity_ids,
                extraction.items,
            ):
                if item.statement == potential.new_statement:
                    related_items.append(entity_id)

            conflict_id = (
                f"conflict-{event.event_id}-"
                f"{len(state.conflicts)}"
            )

            conflict = Conflict(
                id=conflict_id,
                description=potential.explanation,
                related_items=list(set(related_items)),
                status=ConflictStatus.OPEN,
            )

            state.conflicts.append(conflict)
            new_conflicts.append(conflict)

        detector_conflicts = self.conflict_detector.detect(state)

        for conflict in detector_conflicts:
            if not any(
                existing.id == conflict.id
                for existing in state.conflicts
            ):
                state.conflicts.append(conflict)
                new_conflicts.append(conflict)

        new_gaps = self.gap_detector.detect(state)

        for gap in new_gaps:
            state.unknowns.append(gap)

        if extraction.items:
            add_timeline_event(
                state=state,
                event=event,
                event_type="INFORMATION_EXTRACTED",
                description=(
                    f"New incident information extracted "
                    f"from {event.speaker.name}."
                ),
                related_entities=new_entity_ids,
            )

        for conflict in new_conflicts:
            add_timeline_event(
                state=state,
                event=event,
                event_type="CONFLICT_DETECTED",
                description=conflict.description,
                related_entities=conflict.related_items,
            )

        for gap in new_gaps:
            add_timeline_event(
                state=state,
                event=event,
                event_type="INFORMATION_GAP_DETECTED",
                description=gap.question,
                related_entities=[
                    gap.related_hypothesis_id
                ] if gap.related_hypothesis_id else [],
            )

        state.version += 1

        return state
