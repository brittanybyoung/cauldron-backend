const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/schedule', async (req, res) => {
  const result = await pool.query(
    `SELECT start_time, end_time, schedule_enabled, halloween_mode FROM schedule WHERE id = 1`
  );
  res.json(result.rows[0]);
});

router.post('/schedule', async (req, res) => {
  const { startTime, endTime, scheduleEnabled, halloweenMode } = req.body;

  await pool.query(
    `UPDATE schedule
     SET start_time = COALESCE($1, start_time),
         end_time = COALESCE($2, end_time),
         schedule_enabled = COALESCE($3, schedule_enabled),
         halloween_mode = COALESCE($4, halloween_mode)
     WHERE id = 1`,
    [startTime ?? null, endTime ?? null, scheduleEnabled ?? null, halloweenMode ?? null]
  );

  res.json({ success: true });
});

module.exports = router;
