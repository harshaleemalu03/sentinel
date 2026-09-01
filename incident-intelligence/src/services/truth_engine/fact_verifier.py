from ...schemas.incident_state import IncidentState
from ...schemas.entities import FactStatus


class FactVerifier:

    def update(self, state: IncidentState) -> None:

        for fact in state.facts:

            supporting_sources = {
                other.source.speaker_id
                for other in state.facts
                if (
                    other.statement == fact.statement
                    and other.id != fact.id
                )
            }

            if supporting_sources:
                fact.status = FactStatus.CONFIRMED
            else:
                fact.status = FactStatus.UNVERIFIED
