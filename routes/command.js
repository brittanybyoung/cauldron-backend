const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const DEVICE_KEY = process.env.DEVICE_KEY;

// Figures out whether the pump is currently "allowed" to run based on the
// schedule window, unless Halloween Mode is forcing it on regardless of time.
function isWithinSchedule(startTime, endTime) {
  const now = new Date();
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  const current = now.getHours() * 60 + now.getMinutes();

  if (start <= end) {
    return current >= start && current < end;
  }
  // Handles overnight windows, e.g. 22:00 - 02:00
  return current >= start || current < end;
}

// Dashboard sets an override (force on / force off / auto) — requires a logged-in session
router.post('/command', async (req, res) => {
  if (!req.session || !req.session.loggedIn) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { mode } = req.body; // 'auto' | 'force_on' | 'force_off'
  if (!['auto', 'force_on', 'force_off'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }
  await pool.query(
    `UPDATE command SET mode = $1, updated_at = now() WHERE id = 1`,
    [mode]
  );
  res.json({ success: true });
});

// Arduino polls this on each check-in to see what it should be doing.
// Also readable by the logged-in dashboard, so it can display current mode.
router.get('/command', async (req, res) => {
  const { deviceKey } = req.query;
  const isDevice = DEVICE_KEY && deviceKey === DEVICE_KEY;
  const isDashboard = req.session && req.session.loggedIn;

  if (!isDevice && !isDashboard) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const cmdResult = await pool.query(`SELECT mode FROM command WHERE id = 1`);
  const schedResult = await pool.query(
    `SELECT start_time, end_time, schedule_enabled, halloween_mode FROM schedule WHERE id = 1`
  );

  const { mode } = cmdResult.rows[0];
  const { start_time, end_time, schedule_enabled, halloween_mode } = schedResult.rows[0];

  const allowed = halloween_mode || (schedule_enabled && isWithinSchedule(start_time, end_time));

  res.json({ mode, allowed });
});

module.exports = router;
