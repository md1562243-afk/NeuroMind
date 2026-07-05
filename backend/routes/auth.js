// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register - Create account directly
router.post('/register', register);

// POST /api/auth/login - Verify credentials, get JWT directly
router.post('/login', login);

module.exports = router;