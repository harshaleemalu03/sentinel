from ...schemas.entities import TimelineEvent
from ...schemas.incident_state import IncidentState
from ...schemas.transcript_event import TranscriptEvent


def add_timeline_event(
    state: IncidentState,
    event: TranscriptEvent,
    event_type: str,
    description: str,
    related_entities: list[str] | None = None,
) -> None:

    timeline_event = TimelineEvent(
        id=f"timeline-{event.event_id}",
        timestamp=event.timestamp,
        event_type=event_type,
        description=description,
        related_entities=related_entities or [],
        source_event_id=event.event_id,
    )

    state.timeline.append(timeline_event)
