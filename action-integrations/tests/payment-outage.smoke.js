// Run with: node --test tests
// Simulates Module 2 asking us to investigate a hypothesis during the
// payment-outage demo scenario, then a human approving it.
const test = require('node:test');
const assert = require('node:assert');
const approvalService = require('../src/services/approvalService');

test('payment-outage: propose critical action -> approve -> executes -> jira+pagerduty', async () => {
  const action = await approvalService.proposeAction({
    incidentId: 'incident-payment-outage-demo',
    title: 'Rollback payment-service',
    description: 'Latency spiked to 8s right after the last deploy; hypothesis is a regression.',
    source: { type: 'hypothesis', refId: 'hyp-deployment-regression' },
    priority: 'critical',
    requiresApproval: true
  });

  assert.strictEqual(action.status, 'pending_approval');

  const decided = await approvalService.decideAction(action.id, {
    decision: 'approve',
    decidedBy: 'incident-commander'
  });

  assert.strictEqual(decided.status, 'done');
  assert.ok(decided.integrations.jiraIssueKey, 'expected a Jira issue to be created');
  assert.ok(decided.integrations.pagerdutyIncidentId, 'expected a PagerDuty alert for a critical action');
  assert.ok(decided.result && decided.result.summary, 'expected a result to report back to the Truth Engine');
});

test('low-priority action auto-executes without approval', async () => {
  const action = await approvalService.proposeAction({
    incidentId: 'incident-payment-outage-demo',
    title: 'Notify DB engineer to check CPU graphs',
    priority: 'low',
    requiresApproval: false
  });

  assert.strictEqual(action.status, 'done');
});
