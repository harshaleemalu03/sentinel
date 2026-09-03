const axios = require('axios');

async function triggerAlert(action) {
  const useReal = process.env.USE_REAL_PAGERDUTY === 'true';

  if (!useReal) {
    const fakeId = `PD-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`[pagerduty:mock] Triggered alert ${fakeId} for critical action ${action.id}: "${action.title}"`);
    return { id: fakeId };
  }

  const res = await axios.post('https://events.pagerduty.com/v2/enqueue', {
    routing_key: process.env.PAGERDUTY_ROUTING_KEY,
    event_action: 'trigger',
    payload: {
      summary: action.title,
      source: 'sentinel-action-integrations',
      severity: action.priority === 'critical' ? 'critical' : 'warning'
    }
  });
  return { id: res.data.dedup_key };
}

module.exports = { triggerAlert };
