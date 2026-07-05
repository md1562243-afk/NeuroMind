// controllers/authController.js
// Handles authentication: register and login (no OTP)

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// ============================================================
// REGISTER - Create account directly (no OTP)
// POST /api/auth/register
// ============================================================
const register = async (req, res) => {
  try {
    const { full_name, email, password, dob, gender } = req.body;

    if (!full_name || !email || !password || !dob || !gender) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    // Check if email already exists
    const [existingUsers] = await db.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login instead.'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user directly as verified (no OTP step)
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, dob, gender, email_verified) VALUES (?, ?, ?, ?, ?, TRUE)',
      [full_name, email, hashedPassword, dob, gender]
    );

    // Generate JWT immediately
    const token = jwt.sign(
      { userId: result.insertId, email: email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token: token,
      user: {
        user_id: result.insertId,
        full_name,
        email,
        dob,
        gender
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
};

// ============================================================
// LOGIN - Verify credentials, generate JWT directly (no OTP)
// POST /api/auth/login
// ============================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Find user by email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email. Please register first.'
      });
    }

    const user = users[0];

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    // Generate JWT token directly
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        dob: user.dob,
        gender: user.gender
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

module.exports = { register, login };