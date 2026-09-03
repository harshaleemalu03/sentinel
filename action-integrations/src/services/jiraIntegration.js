const axios = require('axios');

async function createIssue(action) {
  const useReal = process.env.USE_REAL_JIRA === 'true';

  if (!useReal) {
    const fakeKey = `SENT-${Math.floor(1000 + Math.random() * 9000)}`;
    console.log(`[jira:mock] Created issue ${fakeKey} for action ${action.id}: "${action.title}"`);
    return { key: fakeKey, url: `https://mock.jira.local/browse/${fakeKey}` };
  }

  const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY } = process.env;
  const res = await axios.post(
    `${JIRA_BASE_URL}/rest/api/3/issue`,
    {
      fields: {
        project: { key: JIRA_PROJECT_KEY },
        summary: action.title,
        description: action.description,
        issuetype: { name: 'Task' }
      }
    },
    { auth: { username: JIRA_EMAIL, password: JIRA_API_TOKEN } }
  );
  return { key: res.data.key, url: `${JIRA_BASE_URL}/browse/${res.data.key}` };
}

module.exports = { createIssue };
