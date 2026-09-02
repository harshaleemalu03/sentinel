const actionStore = require('../models/actionStore');
const slack = require('./slackIntegration');
const jira = require('./jiraIntegration');
const pagerduty = require('./pagerdutyIntegration');
const truthEngine = require('./truthEngineClient');
const broadcaster = require('../utils/broadcaster');

// Called when a new action is proposed (from Truth Engine hypothesis/unknown, or manual).
async function proposeAction(input) {
  const created = actionStore.createAction(input);
  broadcaster.broadcast({ type: 'action_created', action: created });

  if (created.requiresApproval) {
    await slack.postActionForApproval(created);
    return created;
  }

  // Low-risk actions can auto-execute (e.g. "notify DB engineer" vs "rollback prod")
  return executeAction(created.id);
}

async function decideAction(id, { decision, decidedBy, note }) {
  const action = actionStore.getAction(id);
  if (!action) return null;

  const updated = actionStore.updateAction(id, {
    status: decision === 'approve' ? 'approved' : 'rejected',
    approval: { decision, decidedBy, note: note || '', decidedAt: new Date().toISOString() }
  });

  await slack.postActionUpdate(updated, decision === 'approve' ? ':white_check_mark: Approved' : ':x: Rejected');
  broadcaster.broadcast({ type: decision === 'approve' ? 'action_approved' : 'action_rejected', action: updated });

  if (decision === 'approve') {
    await executeAction(id);
  }

  return actionStore.getAction(id);
}

// Executes an approved action against the relevant external tool.
async function executeAction(id) {
  const action = actionStore.getAction(id);
  if (!action) return null;

  actionStore.updateAction(id, { status: 'in_progress' });

  try {
    const integrations = {};

    // Route to the right tool based on action content/priority.
    // Simple heuristic for the hackathon; can be replaced with explicit
    // action "type" field later.
    const wantsJira = true; // every actionable item gets tracked in Jira
    const wantsPagerDuty = action.priority === 'critical';

    if (wantsJira) {
      const issue = await jira.createIssue(action);
      integrations.jiraIssueKey = issue.key;
    }
    if (wantsPagerDuty) {
      const alert = await pagerduty.triggerAlert(action);
      integrations.pagerdutyIncidentId = alert.id;
    }

    const executed = actionStore.updateAction(id, {
      status: 'done',
      integrations,
      result: {
        summary: `Action executed via ${wantsJira ? 'Jira' : ''}${wantsPagerDuty ? ' + PagerDuty' : ''}`,
        evidenceUrl: integrations.jiraIssueKey ? `https://mock.jira.local/browse/${integrations.jiraIssueKey}` : '',
        reportedAt: new Date().toISOString()
      }
    });

    await truthEngine.reportResult(executed);
    broadcaster.broadcast({ type: 'action_updated', action: executed });
    return executed;
  } catch (err) {
    const failed = actionStore.updateAction(id, { status: 'failed' });
    broadcaster.broadcast({ type: 'action_updated', action: failed });
    throw err;
  }
}

module.exports = { proposeAction, decideAction, executeAction };
