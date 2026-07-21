const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/health', (_req, res) => {
  try {
    getDb().prepare('SELECT 1').get();
    res.json({ ok: true, service: 'loganb-api' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ ok: false, service: 'loganb-api' });
  }
});

module.exports = router;
