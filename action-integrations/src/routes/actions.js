const express = require('express');
const router = express.Router();
const actionStore = require('../models/actionStore');
const approvalService = require('../services/approvalService');

// Create an action. Called by Module 2 (Truth Engine) when a Hypothesis/Unknown
// needs investigation, or manually via the dashboard.
// Body: { incidentId, title, description, source, owner, deadline, priority, requiresApproval }
router.post('/', async (req, res) => {
  try {
    const action = await approvalService.proposeAction(req.body);
    res.status(201).json(action);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List actions, optionally filtered by ?incidentId=&status=
router.get('/', (req, res) => {
  const { incidentId, status } = req.query;
  res.json(actionStore.listActions({ incidentId, status }));
});

router.get('/:id', (req, res) => {
  const action = actionStore.getAction(req.params.id);
  if (!action) return res.status(404).json({ error: 'not found' });
  res.json(action);
});

// Assign or update owner/deadline/priority without changing approval status
router.patch('/:id', (req, res) => {
  const { owner, deadline, priority } = req.body;
  const updated = actionStore.updateAction(req.params.id, {
    ...(owner !== undefined && { owner }),
    ...(deadline !== undefined && { deadline }),
    ...(priority !== undefined && { priority })
  });
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.json(updated);
});

module.exports = router;
