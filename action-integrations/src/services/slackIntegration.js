const axios = require('axios');

async function postActionForApproval(action) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.log(`[slack:mock] Would post approval request for action ${action.id}: "${action.title}"`);
    return { ok: true, mocked: true };
  }

  const payload = {
    text: `:rotating_light: *Action needs approval* — ${action.title}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Action needs approval*\n*${action.title}*\n${action.description || ''}\nPriority: *${action.priority}*  |  Owner: *${action.owner ? action.owner.name : 'unassigned'}*`
        }
      }
    ]
  };

  const res = await axios.post(url, payload);
  return { ok: res.status === 200 };
}

async function postActionUpdate(action, message) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.log(`[slack:mock] Would post update for action ${action.id}: ${message}`);
    return { ok: true, mocked: true };
  }
  const res = await axios.post(url, { text: `${message} — *${action.title}*` });
  return { ok: res.status === 200 };
}

module.exports = { postActionForApproval, postActionUpdate };
