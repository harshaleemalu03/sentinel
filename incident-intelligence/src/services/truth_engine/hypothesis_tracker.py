from ...schemas.incident_state import IncidentState
from ...schemas.entities import HypothesisStatus


class HypothesisTracker:

    def update(self, state: IncidentState) -> None:

        for hypothesis in state.hypotheses:

            if hypothesis.contradicting_evidence:
                hypothesis.status = HypothesisStatus.CONTRADICTED

            elif hypothesis.supporting_evidence:
                hypothesis.status = HypothesisStatus.SUPPORTED

            else:
                hypothesis.status = HypothesisStatus.UNCONFIRMED
