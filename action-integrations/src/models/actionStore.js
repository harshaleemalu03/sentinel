const { v4: uuidv4 } = require('uuid');

// In-memory store. Good enough for a hackathon demo; swap for Redis/Postgres
// later by reimplementing these same functions.
const actions = new Map();

function createAction({ incidentId, title, description, source, owner, deadline, priority, requiresApproval }) {
  const now = new Date().toISOString();
  const action = {
    id: uuidv4(),
    incidentId,
    title,
    description: description || '',
    source: source || { type: 'manual', refId: null },
    owner: owner || null,
    deadline: deadline || null,
    priority: priority || 'medium',
    status: requiresApproval === false ? 'approved' : 'pending_approval',
    requiresApproval: requiresApproval !== false,
    approval: null,
    integrations: {},
    result: null,
    createdAt: now,
    updatedAt: now
  };
  actions.set(action.id, action);
  return action;
}

function getAction(id) {
  return actions.get(id) || null;
}

function listActions({ incidentId, status } = {}) {
  let list = Array.from(actions.values());
  if (incidentId) list = list.filter(a => a.incidentId === incidentId);
  if (status) list = list.filter(a => a.status === status);
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateAction(id, patch) {
  const existing = actions.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  actions.set(id, updated);
  return updated;
}

module.exports = { createAction, getAction, listActions, updateAction };
