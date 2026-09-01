from datetime import datetime, timezone

from ...schemas.incident_state import IncidentState


class IncidentStateManager:

    def __init__(self):
        self._incidents: dict[str, IncidentState] = {}

    def create_incident(
        self,
        incident_id: str,
        title: str = "Untitled Incident",
        severity: str = "SEV-2",
    ) -> IncidentState:

        state = IncidentState(
            incident_id=incident_id,
            title=title,
            severity=severity,
            status="ACTIVE",
            last_updated=datetime.now(timezone.utc),
        )

        self._incidents[incident_id] = state

        return state

    def get_incident(
        self,
        incident_id: str,
    ) -> IncidentState | None:

        return self._incidents.get(incident_id)

    def update_incident(
        self,
        state: IncidentState,
    ) -> IncidentState:

        state.last_updated = datetime.now(timezone.utc)

        self._incidents[state.incident_id] = state

        return state


state_manager = IncidentStateManager()
