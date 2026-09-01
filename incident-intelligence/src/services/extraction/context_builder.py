from ...schemas.incident_state import IncidentState


def build_incident_context(
    state: IncidentState,
) -> str:

    lines = [
        f"Incident: {state.title}",
        f"Severity: {state.severity}",
        f"Status: {state.status}",
        "",
        "CONFIRMED / UNVERIFIED FACTS:",
    ]

    for fact in state.facts:
        lines.append(
            f"- [{fact.status}] {fact.statement}"
        )

    lines.append("")
    lines.append("HYPOTHESES:")

    for hypothesis in state.hypotheses:
        lines.append(
            f"- [{hypothesis.status}] "
            f"{hypothesis.statement}"
        )

    lines.append("")
    lines.append("OPEN CONFLICTS:")

    for conflict in state.conflicts:
        if conflict.status == "OPEN":
            lines.append(
                f"- {conflict.description}"
            )

    lines.append("")
    lines.append("OPEN INFORMATION GAPS:")

    for unknown in state.unknowns:
        if unknown.status == "OPEN":
            lines.append(
                f"- {unknown.question}"
            )

    return "\n".join(lines)
