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

                already_available = self._evidence_available(
                    required,
                    state,
                )

                if already_available:
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
                        question=f"Can we verify: {required}?",
                        reason=(
                            f"This evidence is required to evaluate "
                            f"the hypothesis: "
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

        return False

    @staticmethod
    def _normalize(text: str) -> str:
        return (
            text.lower()
            .replace(" ", "_")
            .replace("-", "_")
            .strip()
        )
