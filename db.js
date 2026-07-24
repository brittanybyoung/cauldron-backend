const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : false
});

// One-row tables — this app only ever needs a single "current" record for
// status, command, and schedule, so we keep it simple instead of building
// out full history tracking for now.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS status (
      id INTEGER PRIMARY KEY DEFAULT 1,
      water_state TEXT NOT NULL DEFAULT 'UNKNOWN',
      pump_state TEXT NOT NULL DEFAULT 'IDLE',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS command (
      id INTEGER PRIMARY KEY DEFAULT 1,
      mode TEXT NOT NULL DEFAULT 'auto',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedule (
      id INTEGER PRIMARY KEY DEFAULT 1,
      start_time TEXT NOT NULL DEFAULT '18:00',
      end_time TEXT NOT NULL DEFAULT '23:00',
      schedule_enabled BOOLEAN NOT NULL DEFAULT true,
      halloween_mode BOOLEAN NOT NULL DEFAULT false
    );
  `);

  // Seed the single rows if they don't exist yet
  await pool.query(`
    INSERT INTO status (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
  `);
  await pool.query(`
    INSERT INTO command (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
  `);
  await pool.query(`
    INSERT INTO schedule (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
  `);
}

module.exports = { pool, initDb };
