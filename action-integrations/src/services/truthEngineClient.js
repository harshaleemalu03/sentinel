const axios = require('axios');

// Reports a completed action's result back to the Truth Engine so it can
// update IncidentState (e.g. resolve a Hypothesis or fill an Unknown).
async function reportResult(action) {
  const base = process.env.TRUTH_ENGINE_BASE_URL;
  if (!base) {
    console.log(`[truth-engine:mock] Would report result for action ${action.id}`, action.result);
    return { ok: true, mocked: true };
  }

  try {
    const res = await axios.post(`${base}/incidents/${action.incidentId}/action-results`, {
      actionId: action.id,
      sourceRefId: action.source ? action.source.refId : null,
      sourceType: action.source ? action.source.type : null,
      result: action.result
    });
    return { ok: res.status < 300, data: res.data };
  } catch (err) {
    console.error('[truth-engine] failed to report result:', err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { reportResult };
