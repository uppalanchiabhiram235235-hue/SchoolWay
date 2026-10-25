const express = require('express');
const router = express.Router();
const Route = require('../models/Route');

// GET /api/routes (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find().lean();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/routes/:id
router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json(route);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
