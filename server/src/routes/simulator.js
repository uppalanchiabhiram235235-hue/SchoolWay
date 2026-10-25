const express = require('express');
const router = express.Router();
const simulator = require('../simulator/busSimulator');

// GET /api/simulator/mode
router.get('/mode', (req, res) => {
  res.json({
    mode: simulator.getMode(),
    intervalMs: simulator.getIntervalMs(),
    isRunning: simulator.isRunning
  });
});

// POST /api/simulator/mode (toggle between 'demo' and 'realistic')
router.post('/mode', (req, res) => {
  const { mode } = req.body;
  if (mode !== 'demo' && mode !== 'realistic') {
    return res.status(400).json({ message: 'Mode must be "demo" or "realistic"' });
  }

  const io = req.app.get('io');
  simulator.setMode(mode, io);

  res.json({
    success: true,
    mode: simulator.getMode(),
    intervalMs: simulator.getIntervalMs()
  });
});

module.exports = router;
