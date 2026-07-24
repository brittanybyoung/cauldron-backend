const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Arduino pushes its current state here every ~15 seconds.
// No auth on this route — the Arduino can't easily do a login flow, so
// instead we protect it with a shared device key (simpler than a session).
const DEVICE_KEY = process.env.DEVICE_KEY;

router.post('/status', async (req, res) => {
  const { deviceKey, waterState, pumpState } = req.body;

  if (!DEVICE_KEY || deviceKey !== DEVICE_KEY) {
    return res.status(401).json({ error: 'Invalid device key' });
  }

  await pool.query(
    `UPDATE status SET water_state = $1, pump_state = $2, updated_at = now() WHERE id = 1`,
    [waterState, pumpState]
  );

  res.json({ success: true });
});

// Dashboard polls this — requires a logged-in session
router.get('/status', async (req, res) => {
  if (!req.session || !req.session.loggedIn) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const result = await pool.query(`SELECT water_state, pump_state, updated_at FROM status WHERE id = 1`);
  res.json(result.rows[0]);
});

module.exports = router;
