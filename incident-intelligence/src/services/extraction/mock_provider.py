from typing import Optional
import re

from ...schemas.extraction import (
    ExtractionResult,
    ExtractedItem,
    PotentialConflict,
)
from ...schemas.action_extraction import (
    ExtractedAction,
    ExtractedActionOwner,
)
from ...schemas.transcript_event import TranscriptEvent
from .provider import LLMProvider


class MockProvider(LLMProvider):

    async def extract(
        self,
        event: TranscriptEvent,
        context: str = ""
    ) -> ExtractionResult:

        text = event.text.strip()
        lower_text = text.lower()
        items = []
        conflicts = []

        # 1. ACTION & APPROVAL EXTRACTION
        action_verbs = ["rollback", "roll back", "revert", "restart", "deploy", "check", "inspect", "investigate", "verify", "monitor"]
        is_action = any(verb in lower_text for verb in action_verbs) or "please" in lower_text or "i will" in lower_text

        if is_action:
            requires_approval = any(
                keyword in lower_text
                for keyword in ["rollback", "roll back", "revert", "restart", "terminate", "drop", "purge"]
            )
            priority = "CRITICAL" if requires_approval else ("HIGH" if "check" in lower_text or "inspect" in lower_text else "MEDIUM")

            # Extract owner if specified (e.g., "Rahul, please...", "Priya, can you...")
            owner = None
            speaker_name = event.speaker.name if event.speaker else "Unknown"
            speaker_role = event.speaker.role if event.speaker else "Responder"

            name_match = re.match(r"^([A-Z][a-z]+)[,\s]+", text)
            if name_match:
                assigned_name = name_match.group(1)
                owner = ExtractedActionOwner(
                    name=assigned_name,
                    role="Engineer",
                )
            elif "i will" in lower_text or "i'll" in lower_text:
                owner = ExtractedActionOwner(
                    id=event.speaker.id if event.speaker else None,
                    name=speaker_name,
                    role=speaker_role,
                )

            title = text
            # Clean title if addressed to someone
            if name_match:
                title = text[name_match.end():].strip().capitalize()

            items.append(
                ExtractedItem(
                    type="ACTION",
                    statement=text,
                    confidence=0.96,
                    action=ExtractedAction(
                        title=title,
                        purpose="Incident remediation and investigation",
                        owner=owner,
                        priority=priority,
                        requires_human_approval=requires_approval,
                    )
                )
            )

        # 2. HYPOTHESIS EXTRACTION
        hypothesis_indicators = [
            "i think", "maybe", "probably", "might be", "could be",
            "suspect", "hypothesis", "candidate", "potential root cause",
            "possibly", "seems like"
        ]
        is_hypothesis = any(phrase in lower_text for phrase in hypothesis_indicators)
        if is_hypothesis:
            items.append(
                ExtractedItem(
                    type="HYPOTHESIS",
                    statement=text,
                    confidence=0.91,
                    supporting_evidence=[f"Reported by {event.speaker.name} ({event.speaker.role})"],
                    required_evidence=["System metrics verification", "Log validation"],
                )
            )

        # 3. DECISION EXTRACTION
        decision_indicators = ["approved", "decided", "decision:", "agreed to", "let's proceed with", "confirming rollback"]
        is_decision = any(phrase in lower_text for phrase in decision_indicators)
        if is_decision and not is_action:
            items.append(
                ExtractedItem(
                    type="DECISION",
                    statement=text,
                    confidence=0.95,
                )
            )

        # 4. FACT EXTRACTION (Condition, measurement, or telemetry observation)
        fact_indicators = [
            "latency", "error", "failure", "cpu", "memory", "deployed", "completed",
            "returned to normal", "elevated", "spike", "outage", "status", "version",
            "database", "payment", "service"
        ]
        is_fact = any(word in lower_text for word in fact_indicators) and not is_hypothesis

        if is_fact:
            items.append(
                ExtractedItem(
                    type="FACT",
                    statement=text,
                    confidence=0.95,
                    supporting_evidence=[f"Reported by {event.speaker.name} ({event.speaker.role})"],
                )
            )

        # 5. CONFLICT DETECTION (Discrepancy against context)
        if context:
            lower_context = context.lower()
            # If current speaker says normal/fixed, but context has elevated/error
            if ("healthy" in lower_text or "normal" in lower_text or "fixed" in lower_text or "no issue" in lower_text) and (
                "error" in lower_context or "elevated" in lower_context or "degraded" in lower_context or "failure" in lower_context
            ):
                conflicts.append(
                    PotentialConflict(
                        new_statement=text,
                        existing_statement="Incident telemetry reports elevated error rate / degraded service.",
                        explanation=f"{event.speaker.name} reported system healthy/normal, which conflicts with telemetry indicating active degradation.",
                        confidence=0.92,
                    )
                )
            # If current speaker says error rate elevated, but context has rollback completed / resolved
            elif ("elevated" in lower_text or "still failing" in lower_text or "not resolved" in lower_text) and (
                "completed" in lower_context or "resolved" in lower_context or "fixed" in lower_context
            ):
                conflicts.append(
                    PotentialConflict(
                        new_statement=text,
                        existing_statement="Previous report stated rollback or fix was completed.",
                        explanation=f"{event.speaker.name} reports errors are still elevated despite completion of remediation step.",
                        confidence=0.94,
                    )
                )

        return ExtractionResult(items=items, potential_conflicts=conflicts)

