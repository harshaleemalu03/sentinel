# Sentinel — Incident Intelligence API Contract

## 1. Purpose

The **Incident Intelligence** module receives real-time transcript events from the live Agora incident room and converts them into a structured, evidence-aware incident state.

The module is responsible for:

* Extracting facts, hypotheses, decisions, actions and evidence
* Recognizing participant roles
* Tracking action ownership
* Detecting conflicting information
* Detecting missing information/evidence
* Tracking hypothesis status
* Maintaining the incident timeline
* Identifying actions that require human approval
* Maintaining the shared `IncidentState`

The module **does not independently determine the root cause** and does not automatically execute production-impacting actions.

---

# 2. Architecture

```text
┌──────────────────────────┐
│      Agora AI Room       │
│                          │
│ Engineers / SRE /        │
│ Support / Business       │
└────────────┬─────────────┘
             │
             │ Real-time transcript events
             ▼
┌──────────────────────────┐
│  Incident Intelligence  │
│                          │
│  LLM Extraction          │
│  Role Recognition        │
│  Truth Engine             │
│  Evidence Tracking       │
│  Conflict Detection      │
│  Gap Detection           │
│  Action Tracking         │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│      IncidentState       │
│                          │
│ Facts                    │
│ Hypotheses               │
│ Conflicts                │
│ Unknowns / Gaps          │
│ Actions + Owners         │
│ Decisions                │
│ Approvals                │
│ Timeline                 │
│ Participants             │
└────────────┬─────────────┘
             │
             ├──────────────► Dashboard
             ├──────────────► Slack
             ├──────────────► Jira
             ├──────────────► PagerDuty
             └──────────────► Monitoring
```

---

# 3. Base URL

All endpoints are under:

```text
/api/v1
```

---

# 4. Agora → Incident Intelligence

## Endpoint

```text
POST /api/v1/incidents/{incident_id}/events
```

Person 1 / Agora integration sends **one transcript event at a time**.

---

## Request Body

```json
{
  "event_id": "evt-001",
  "incident_id": "INC-001",
  "timestamp": "2026-09-02T16:30:00Z",
  "speaker": {
    "id": "user-123",
    "name": "Rahul",
    "role": "DevOps"
  },
  "text": "Payment API latency has crossed 8 seconds."
}
```

### Fields

| Field          | Type            | Required | Description                            |
| -------------- | --------------- | -------: | -------------------------------------- |
| `event_id`     | string          |      Yes | Unique ID for this transcript event    |
| `incident_id`  | string          |      Yes | ID of the active incident              |
| `timestamp`    | ISO-8601 string |      Yes | Time at which the statement occurred   |
| `speaker.id`   | string          |      Yes | Unique participant ID                  |
| `speaker.name` | string          |      Yes | Participant name                       |
| `speaker.role` | string/null     |       No | Known role from Agora/UI, if available |
| `text`         | string          |      Yes | Transcript text                        |

### Speaker Role

If Agora/the frontend already knows the participant's role, send it.

Example:

```text
"role": "DevOps"
```

If the role is unknown:

```text
"role": null
```

Incident Intelligence can attempt to infer the role.

---

# 5. Important Integration Rule

Person 1 **does not need to understand or implement the Incident Intelligence logic**.

Person 1 only needs to:

```text
Agora voice room
      ↓
Real-time speech/transcript
      ↓
Convert transcript into the event schema
      ↓
POST /incidents/{incident_id}/events
```

The Incident Intelligence module handles everything after that.

---

# 6. Example Transcript Events

### Example 1 — Fact

```json
{
  "event_id": "evt-002",
  "incident_id": "INC-001",
  "timestamp": "2026-09-02T16:31:00Z",
  "speaker": {
    "id": "user-456",
    "name": "Priya",
    "role": "SRE"
  },
  "text": "Payment API error rate is currently 42 percent."
}
```

Sentinel may extract:

```text
FACT:
Payment API error rate is 42%.

Source:
Priya / SRE / evt-002
```

---

### Example 2 — Hypothesis

```json
{
  "event_id": "evt-003",
  "incident_id": "INC-001",
  "timestamp": "2026-09-02T16:32:00Z",
  "speaker": {
    "id": "user-789",
    "name": "Amit",
    "role": "Engineer"
  },
  "text": "I think the database connection pool might be exhausted."
}
```

Sentinel records:

```text
HYPOTHESIS:
Database connection pool may be exhausted.

Status:
UNCONFIRMED

Required evidence:
Database connection pool metrics/logs
```

The system must **not** treat this as the root cause.

---

### Example 3 — Conflict

```json
{
  "event_id": "evt-004",
  "incident_id": "INC-001",
  "timestamp": "2026-09-02T16:33:00Z",
  "speaker": {
    "id": "user-111",
    "name": "Neha",
    "role": "DBA"
  },
  "text": "Database connection pool is healthy and has plenty of capacity."
}
```

Sentinel can identify:

```text
Potential conflict:

Hypothesis:
Database connection pool may be exhausted.

New evidence:
Connection pool is healthy.

Status:
CONFLICT DETECTED
```

---

### Example 4 — Assigned Action

```json
{
  "event_id": "evt-005",
  "incident_id": "INC-001",
  "timestamp": "2026-09-02T16:34:00Z",
  "speaker": {
    "id": "user-123",
    "name": "Rahul",
    "role": "DevOps"
  },
  "text": "Amit, please check the payment service logs."
}
```

Sentinel creates:

```text
ACTION:
Check payment service logs.

OWNER:
Amit

STATUS:
PENDING
```

---

### Example 5 — Critical Action

```json
{
  "event_id": "evt-006",
  "incident_id": "INC-001",
  "timestamp": "2026-09-02T16:35:00Z",
  "speaker": {
    "id": "user-123",
    "name": "Rahul",
    "role": "Incident Commander"
  },
  "text": "Let's restart the payment service in production."
}
```

Sentinel identifies:

```text
ACTION:
Restart payment service.

RISK:
Production-impacting.

REQUIRES HUMAN APPROVAL:
TRUE
```

Sentinel **does not execute the restart automatically**.

---

# 7. Response

Successful request:

```json
{
  "incident_id": "INC-001",
  "event_id": "evt-001",
  "state_version": 2,
  "incident_state": {
    "incident_id": "INC-001",
    "title": "Payment Service Outage",
    "severity": "SEV-1",
    "status": "ACTIVE",
    "participants": [],
    "facts": [],
    "hypotheses": [],
    "conflicts": [],
    "unknowns": [],
    "decisions": [],
    "actions": [],
    "approvals": [],
    "timeline": [],
    "version": 2
  }
}
```

The exact contents of `incident_state` change as the incident progresses.

---

# 8. Get Current Incident State

## Endpoint

```text
GET /api/v1/incidents/{incident_id}/state
```

Returns the complete current `IncidentState`.

Used by:

* Dashboard
* Integrations
* Voice response system
* Other backend modules

---

# 9. Incident Timeline

## Endpoint

```text
GET /api/v1/incidents/{incident_id}/timeline
```

Returns the chronological incident timeline.

Example:

```json
{
  "incident_id": "INC-001",
  "timeline": [
    {
      "event_type": "INFORMATION_EXTRACTED",
      "description": "New incident information extracted from Rahul.",
      "timestamp": "2026-09-02T16:30:00Z"
    },
    {
      "event_type": "CONFLICT_DETECTED",
      "description": "Database capacity information conflicts with the current hypothesis.",
      "timestamp": "2026-09-02T16:33:00Z"
    }
  ]
}
```

---

# 10. Incident Summary

## Endpoint

```text
GET /api/v1/incidents/{incident_id}/summary
```

Returns the current high-level incident picture:

* Incident status
* Confirmed/unverified facts
* Hypotheses
* Open conflicts
* Missing information
* Actions
* Action owners
* Decisions
* Pending approvals
* Timeline

This endpoint can be used by the dashboard or final-summary module.

---

# 11. Human Approval

Critical production-impacting actions must not be executed automatically.

## Create Approval Request

```text
POST /api/v1/incidents/{incident_id}/approvals
```

Example:

```json
{
  "action_id": "action-001",
  "incident_id": "INC-001",
  "requested_by": "Sentinel",
  "reason": "Production service restart requires human confirmation.",
  "status": "PENDING"
}
```

---

## Get Approval Status

```text
GET /api/v1/incidents/{incident_id}/approvals/{action_id}
```

---

## Submit Human Decision

```text
POST /api/v1/incidents/{incident_id}/approvals/decision
```

Example:

```json
{
  "action_id": "action-001",
  "incident_id": "INC-001",
  "decided_by": "incident-commander-001",
  "decision": "APPROVED",
  "comment": "Approved after checking current traffic."
}
```

Possible decisions:

```text
APPROVED
REJECTED
```

---

# 12. Error Responses

### Invalid Incident ID

```text
400 Bad Request
```

```json
{
  "detail": "Incident ID mismatch"
}
```

### Incident Not Found

```text
404 Not Found
```

```json
{
  "detail": "Incident not found"
}
```

### Action Not Found

```text
404 Not Found
```

```json
{
  "detail": "Action not found"
}
```

---

# 13. Data Flow

```text
Agora
  │
  │ transcript event
  ▼
POST /incidents/{id}/events
  │
  ▼
LLM Extraction
  │
  ├── Facts
  ├── Hypotheses
  ├── Evidence
  ├── Actions
  └── Decisions
  │
  ▼
Truth Engine
  │
  ├── Verify/corroborate facts
  ├── Track hypotheses
  ├── Detect conflicts
  ├── Detect information gaps
  ├── Track owners
  └── Detect approval requirements
  │
  ▼
IncidentState
  │
  ├── Dashboard
  ├── Jira
  ├── Slack
  ├── PagerDuty
  └── Voice summaries
```

---

# 14. Responsibility Boundaries

## Person 1 — Agora / Voice

Responsible for:

* Agora live room
* Participant connection
* Real-time audio
* Speech/transcription
* Sending transcript events

Does **not** need to implement:

* Fact extraction
* Hypothesis tracking
* Conflict detection
* Gap detection
* Truth Engine

---

## Person 2 — Incident Intelligence

Responsible for:

* Transcript processing
* LLM extraction
* Truth Engine
* Evidence awareness
* Facts/hypotheses
* Conflicts
* Information gaps
* Actions and ownership
* Participant roles
* Timeline
* Human approval state
* IncidentState APIs

---

## Person 3 — Integrations

Consumes the IncidentState/API to connect:

* Jira
* Slack
* PagerDuty
* Monitoring systems

---

## Person 4 — Dashboard / Voice Response

Consumes the IncidentState/API to provide:

* Live incident dashboard
* Status summaries
* Action/owner view
* Conflict/gap visibility
* Spoken Sentinel updates
* Final incident summary

---

# 15. Core Safety Principle

Sentinel is an **incident intelligence assistant**, not an autonomous root-cause authority.

It must clearly distinguish:

```text
FACT
What is currently supported by evidence.

HYPOTHESIS
A possible explanation.

CONFLICT
Information that currently disagrees.

UNKNOWN
Information/evidence that is still missing.

ACTION
Work identified from the incident discussion.

APPROVAL
Human confirmation required before risky action.
```

The system should always preserve uncertainty rather than presenting an unverified hypothesis as the truth.

---

# 16. Integration Checklist

Before the final demo, verify:

* [ ] Agora room successfully receives participants
* [ ] Agora provides real-time transcript events
* [ ] Transcript events match this API schema
* [ ] Events reach `/events`
* [ ] Incident Intelligence updates `IncidentState`
* [ ] Dashboard receives updated state
* [ ] Facts and hypotheses are visibly separated
* [ ] Conflicts are visibly flagged
* [ ] Missing evidence is shown
* [ ] Actions have owners
* [ ] Critical actions require human approval
* [ ] Approved/rejected status is reflected
* [ ] Timeline updates continuously
* [ ] Final incident summary is generated
* [ ] No component claims an unverified root cause as fact
