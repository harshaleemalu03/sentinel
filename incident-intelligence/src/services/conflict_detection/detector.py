from ...schemas.entities import Conflict, Fact, Hypothesis
from ...schemas.incident_state import IncidentState


class ConflictDetector:

    def detect(
        self,
        state: IncidentState,
    ) -> list[Conflict]:

        conflicts: list[Conflict] = []

        for hypothesis in state.hypotheses:

            for fact in state.facts:

                if self._contradicts(hypothesis, fact):

                    conflict_id = (
                        f"conflict-{hypothesis.id}-{fact.id}"
                    )

                    # Avoid duplicate conflicts
                    if any(
                        conflict.id == conflict_id
                        for conflict in state.conflicts
                    ):
                        continue

                    conflict = Conflict(
                        id=conflict_id,
                        description=(
                            f"Hypothesis '{hypothesis.statement}' "
                            f"conflicts with fact '{fact.statement}'."
                        ),
                        related_items=[
                            hypothesis.id,
                            fact.id,
                        ],
                        status="OPEN",
                    )

                    conflicts.append(conflict)

        return conflicts

    def _contradicts(
        self,
        hypothesis: Hypothesis,
        fact: Fact,
    ) -> bool:

        hypothesis_text = hypothesis.statement.lower()
        fact_text = fact.statement.lower()

        contradiction_pairs = [
            ("database is overloaded", "database cpu is normal"),
            ("database overloaded", "database cpu is normal"),
            ("database is down", "database is healthy"),
            ("service is down", "service is healthy"),
        ]

        return any(
            first in hypothesis_text and second in fact_text
            or second in hypothesis_text and first in fact_text
            for first, second in contradiction_pairs
        )
