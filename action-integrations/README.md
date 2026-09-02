# action-integrations — Sentinel Coordination & Integrations Module (Person 3)

Owns: action-item creation, owner/deadline assignment, human approval workflow,
Slack/Jira/PagerDuty integrations, and reporting results back to the Truth Engine.

Flow this module implements:
`Hypothesis/Unknown → Action (proposed) → [Human Approval] → Execute (Slack/Jira/PagerDuty) → Result → Truth Engine`

## Setup

```bash
cp .env.example .env
npm install
npm run dev        # nodemon, restarts on change
# or
npm start
```

Server runs on `http://localhost:4003` by default. WebSocket for the dashboard
is at `ws://localhost:4003/ws`.

Run the payment-outage smoke test:
```bash
npm test
```

## API contract (for Module 2 and Module 4)

### `POST /actions` — create an action
Called by the Truth Engine when a Hypothesis/Unknown needs investigation, or
manually from the dashboard.

```json
{
  "incidentId": "incident-payment-outage-demo",
  "title": "Rollback payment-service",
  "description": "Latency spiked to 8s after last deploy.",
  "source": { "type": "hypothesis", "refId": "hyp-deployment-regression" },
  "priority": "critical",
  "requiresApproval": true
}
```
Returns the created `Action` (see `src/schemas/action.schema.json`).
`priority: "critical"` → also triggers a PagerDuty alert once approved.
`requiresApproval: false` → auto-executes immediately (no human gate).

### `GET /actions?incidentId=&status=` — list actions
### `GET /actions/:id` — get one action
### `PATCH /actions/:id` — update owner / deadline / priority

```json
{ "owner": { "name": "Priya", "role": "DB Engineer" }, "deadline": "2026-09-03T18:00:00Z" }
```

### `POST /approvals/:id/approve` / `POST /approvals/:id/reject`
```json
{ "decidedBy": "incident-commander", "note": "confirmed via deploy diff" }
```
On approve: executes the action (Jira issue created, PagerDuty if critical),
then POSTs the result to the Truth Engine, then broadcasts over WebSocket.

### WebSocket events (`/ws`) — for Module 4 dashboard
Event shapes broadcast on every state change:
```json
{ "type": "action_created" | "action_approved" | "action_rejected" | "action_updated", "action": { ... }, "emittedAt": "..." }
```

### What we call on Module 2 (Truth Engine)
`POST {TRUTH_ENGINE_BASE_URL}/incidents/:incidentId/action-results`
```json
{ "actionId": "...", "sourceRefId": "hyp-deployment-regression", "sourceType": "hypothesis", "result": { "summary": "...", "evidenceUrl": "...", "reportedAt": "..." } }
```
**Coordinate this endpoint name/shape with Person 2** — it's a guess based on
the shared `IncidentState` design; confirm before the integration step.

## Integrations
- **Slack**: real, via incoming webhook (`SLACK_WEBHOOK_URL` in `.env`). Falls
  back to console log if unset — safe to demo without it.
- **Jira**: mocked by default (`USE_REAL_JIRA=false`) — generates a fake
  `SENT-1234` key so the rest of the flow works without a Jira account. Flip
  the flag + fill in `JIRA_*` vars to go real.
- **PagerDuty**: mocked by default, same pattern as Jira. Only fires for
  `priority: "critical"` actions.

## Next steps for the sprint (suggested order)
1. Get this module running standalone (`npm run dev`, run smoke test).
2. Agree the `action-results` webhook shape with Person 2 (Truth Engine).
3. Confirm with Person 4 whether the dashboard connects to our `/ws` directly
   or wants us to POST to a `DASHBOARD_WEBHOOK_URL` instead — flip the switch
   in `.env` once decided.
4. Wire a real Slack webhook for the demo (5 min: Slack app → Incoming Webhooks).
5. Once Module 1→2 produce a real payment-outage transcript, replace the
   smoke test's manual `proposeAction()` call with an actual call from Module 2.
6. Add owner directory (who's "DB Engineer", "DevOps") — currently owner is
   free text; ok for hackathon scope.
