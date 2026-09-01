from ...schemas.entities import MissingInformation
from ...schemas.incident_state import IncidentState


class GapDetector:

    def detect(
        self,
        state: IncidentState,
    ) -> list[MissingInformation]:

        missing_information: list[MissingInformation] = []

        for hypothesis in state.hypotheses:

            if not hypothesis.required_evidence:
                continue

            for required in hypothesis.required_evidence:

                if self._evidence_available(required, state):
                    continue

                unknown_id = (
                    f"unknown-{hypothesis.id}-"
                    f"{self._normalize(required)}"
                )

                if any(
                    item.id == unknown_id
                    for item in state.unknowns
                ):
                    continue

                missing_information.append(
                    MissingInformation(
                        id=unknown_id,
                        question=(
                            f"Can we verify: {required}?"
                        ),
                        reason=(
                            "This evidence is required to "
                            "evaluate the hypothesis: "
                            f"{hypothesis.statement}"
                        ),
                        related_hypothesis_id=hypothesis.id,
                        status="OPEN",
                        priority="HIGH",
                    )
                )

        return missing_information

    def _evidence_available(
        self,
        required: str,
        state: IncidentState,
    ) -> bool:

        required_normalized = self._normalize(required)

        for fact in state.facts:

            if required_normalized in self._normalize(
                fact.statement
            ):
                return True

        for hypothesis in state.hypotheses:

            for evidence in hypothesis.supporting_evidence:
                if required_normalized in self._normalize(
                    evidence
                ):
                    return True

            for evidence in hypothesis.contradicting_evidence:
                if required_normalized in self._normalize(
                    evidence
                ):
                    return True

        return False

    @staticmethod
    def _normalize(text: str) -> str:
        return (
            text.lower()
            .replace(" ", "_")
            .replace("-", "_")
            .strip()
        )
