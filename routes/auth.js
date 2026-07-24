const express = require('express');
const router = express.Router();

// Single shared password for you + your husband — stored as an env var,
// never hardcoded or committed to the repo.
const APP_PASSWORD = process.env.APP_PASSWORD;

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!APP_PASSWORD) {
    return res.status(500).json({ error: 'Server misconfigured: APP_PASSWORD not set' });
  }
  if (password === APP_PASSWORD) {
    req.session.loggedIn = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Incorrect password' });
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ success: true });
});

// Middleware to protect routes — anything using this must have a valid session
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

module.exports = { router, requireAuth };
