from typing import Literal

from pydantic import BaseModel


class ParticipantRole(BaseModel):
    role: Literal[
        "INCIDENT_COMMANDER",
        "ENGINEER",
        "DEVOPS",
        "SRE",
        "SUPPORT",
        "SECURITY",
        "BUSINESS",
        "OBSERVER",
        "UNKNOWN",
    ]
    confidence: float


class RoleRecognizer:

    def recognize(
        self,
        stated_role: str | None,
        speaker_text: str,
    ) -> ParticipantRole:

        if stated_role:
            normalized = stated_role.upper()

            role_map = {
                "INCIDENT COMMANDER": "INCIDENT_COMMANDER",
                "IC": "INCIDENT_COMMANDER",
                "ENGINEER": "ENGINEER",
                "DEVOPS": "DEVOPS",
                "SRE": "SRE",
                "SUPPORT": "SUPPORT",
                "SECURITY": "SECURITY",
                "BUSINESS": "BUSINESS",
            }

            if normalized in role_map:
                return ParticipantRole(
                    role=role_map[normalized],
                    confidence=0.95,
                )

        text = speaker_text.lower()

        if any(
            keyword in text
            for keyword in [
                "customer",
                "ticket",
                "support",
            ]
        ):
            return ParticipantRole(
                role="SUPPORT",
                confidence=0.65,
            )

        if any(
            keyword in text
            for keyword in [
                "deployment",
                "kubernetes",
                "pod",
                "infrastructure",
            ]
        ):
            return ParticipantRole(
                role="DEVOPS",
                confidence=0.65,
            )

        if any(
            keyword in text
            for keyword in [
                "database",
                "api",
                "service",
                "code",
            ]
        ):
            return ParticipantRole(
                role="ENGINEER",
                confidence=0.60,
            )

        return ParticipantRole(
            role="UNKNOWN",
            confidence=0.30,
        )
