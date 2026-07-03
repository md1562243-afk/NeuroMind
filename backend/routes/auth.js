// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, verifyRegistrationOTP, login, verifyLoginOTP, resendOTP } = require('../controllers/authController');

// POST /api/auth/register - Step 1: Register and send OTP
router.post('/register', register);

// POST /api/auth/verify-registration-otp - Step 2: Verify OTP to create account
router.post('/verify-registration-otp', verifyRegistrationOTP);

// POST /api/auth/login - Step 1: Verify credentials, send OTP
router.post('/login', login);

// POST /api/auth/verify-login-otp - Step 2: Verify OTP, get JWT
router.post('/verify-login-otp', verifyLoginOTP);

// POST /api/auth/resend-otp - Resend OTP (30s cooldown)
router.post('/resend-otp', resendOTP);

module.exports = router;
