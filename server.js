require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');

const { initDb } = require('./db');
const { router: authRouter, requireAuth } = require('./routes/auth');
const statusRouter = require('./routes/status');
const commandRouter = require('./routes/command');
const scheduleRouter = require('./routes/schedule');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
  name: 'cauldron_session',
  keys: [process.env.SESSION_SECRET || 'change-me-in-production'],
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
}));

// Public routes (login, and the device-key-protected Arduino endpoints)
app.use('/api', authRouter);
app.use('/api', statusRouter); // POST /status is device-key protected inside the file; GET is below
app.use('/api', commandRouter); // GET /command (Arduino) is device-key protected inside the file

// Everything below this line requires a logged-in session
app.use('/api', requireAuth, scheduleRouter);

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Cauldron backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
