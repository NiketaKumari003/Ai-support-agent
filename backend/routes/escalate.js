// routes/escalate.js
const express = require('express');
const router = express.Router();
const HumanQueue = require('../models/HumanQueue');
const Conversation = require('../models/Conversation');

// POST /api/escalate
// body: { sessionId, reason }
router.post('/', async (req, res) => {
  try {
    const { sessionId, reason } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    const conv = await Conversation.findOne({ sessionId });
    const conversationId = conv ? conv._id : null;
    if (conv) {
      conv.escalated = true;
      await conv.save();
    }

    const hq = new HumanQueue({
      conversationId,
      sessionId,
      reason: reason || 'User requested human'
    });
    await hq.save();

    // TODO: send webhook / Slack / email to human agents

    res.json({ ok: true, queueId: hq._id });
  } catch (err) {
    console.error('Escalate error', err);
    res.status(500).json({ error: 'Escalation failed' });
  }
});

module.exports = router;

