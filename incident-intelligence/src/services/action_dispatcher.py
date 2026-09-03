import os
import httpx

from ..schemas.entities import Action


async def dispatch_action(
    action: Action,
    incident_id: str,
) -> dict:

    base_url = os.getenv(
        "ACTION_INTEGRATIONS_BASE_URL",
        "http://localhost:4003",
    ).rstrip("/")

    payload = {
        "id": action.id,
        "incidentId": incident_id,
        "title": action.title,
        "description": action.purpose,
        "source": {
            "type": (
                "hypothesis"
                if action.related_hypothesis_id
                else "manual"
            ),
            "refId": (
                action.related_hypothesis_id
                if action.related_hypothesis_id
                else action.id
            ),
        },
        "owner": (
            {
                "name": action.owner.name,
                "role": action.owner.role,
                "contact": "",
            }
            if action.owner
            else None
        ),
        "priority": action.priority.value.lower(),
        "requiresApproval": action.requires_human_approval,
    }

    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.post(
            f"{base_url}/actions",
            json=payload,
        )

        response.raise_for_status()

        return response.json()