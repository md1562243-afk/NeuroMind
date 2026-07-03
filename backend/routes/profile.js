// routes/profile.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getProfile, updateProfile, deleteProfile } = require('../controllers/profileController');

// All profile routes require authentication
router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);
router.delete('/', authMiddleware, deleteProfile);

module.exports = router;
