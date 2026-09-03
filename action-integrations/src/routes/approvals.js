const express = require('express');
const router = express.Router();
const approvalService = require('../services/approvalService');

// Body: { decidedBy, note }
router.post('/:id/approve', async (req, res) => {
  const updated = await approvalService.decideAction(req.params.id, {
    decision: 'approve',
    decidedBy: req.body.decidedBy,
    note: req.body.note
  });
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.json(updated);
});

router.post('/:id/reject', async (req, res) => {
  const updated = await approvalService.decideAction(req.params.id, {
    decision: 'reject',
    decidedBy: req.body.decidedBy,
    note: req.body.note
  });
  if (!updated) return res.status(404).json({ error: 'not found' });
  res.json(updated);
});

module.exports = router;
