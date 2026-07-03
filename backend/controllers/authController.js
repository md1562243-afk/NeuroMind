// controllers/authController.js
// Handles all authentication logic: register, login, OTP verification

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { generateOTP, sendOTPEmail } = require('../utils/email');

// ============================================================
// REGISTRATION - Step 1: Send OTP to email
// POST /api/auth/register
// ============================================================
const register = async (req, res) => {
  try {
    const { full_name, email, password, dob, gender } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !dob || !gender) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    // Check if email already exists in users table
    const [existingUsers] = await db.query(
      'SELECT user_id, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0 && existingUsers[0].email_verified) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login instead.'
      });
    }

    // Hash the password using bcrypt (12 rounds = secure)
    const hashedPassword = await bcrypt.hash(password, 12);

    // If user exists but not verified, update their info
    if (existingUsers.length > 0) {
      await db.query(
        'UPDATE users SET full_name=?, password=?, dob=?, gender=? WHERE email=?',
        [full_name, hashedPassword, dob, gender, email]
      );
    } else {
      // Create new user (not verified yet)
      await db.query(
        'INSERT INTO users (full_name, email, password, dob, gender, email_verified) VALUES (?, ?, ?, ?, ?, FALSE)',
        [full_name, email, hashedPassword, dob, gender]
      );
    }

    // Delete any existing OTPs for this email
    await db.query('DELETE FROM registration_otps WHERE email = ?', [email]);

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Save OTP to database
    await db.query(
      'INSERT INTO registration_otps (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    // Send OTP email
    await sendOTPEmail(email, otp, 'registration');

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify within 5 minutes.',
      email: email
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
// REGISTRATION - Step 2: Verify OTP
// POST /api/auth/verify-registration-otp
// ============================================================
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.'
      });
    }

    // Find the OTP record
    const [otpRecords] = await db.query(
      'SELECT * FROM registration_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please register again.'
      });
    }

    const otpRecord = otpRecords[0];

    // Check if max attempts exceeded
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please register again.'
      });
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    // Increment attempt count
    await db.query(
      'UPDATE registration_otps SET attempts = attempts + 1 WHERE otp_id = ?',
      [otpRecord.otp_id]
    );

    // Verify OTP code
    if (otpRecord.otp_code !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${4 - otpRecord.attempts} attempts remaining.`
      });
    }

    // Mark user as email verified
    await db.query(
      'UPDATE users SET email_verified = TRUE WHERE email = ?',
      [email]
    );

    // Delete used OTP
    await db.query('DELETE FROM registration_otps WHERE email = ?', [email]);

    return res.status(200).json({
      success: true,
      message: 'Email verified! Account created successfully. Please login.'
    });

  } catch (error) {
    console.error('Verify registration OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

// ============================================================
// LOGIN - Step 1: Verify email/password, send OTP
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

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please complete registration and verify your OTP.'
      });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    // Check resend cooldown (30 seconds)
    const [existingOTPs] = await db.query(
      'SELECT * FROM login_otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [user.user_id]
    );

    if (existingOTPs.length > 0) {
      const lastOTP = existingOTPs[0];
      const timeSinceLastResend = Date.now() - new Date(lastOTP.created_at).getTime();
      if (timeSinceLastResend < 30000) { // 30 seconds
        const waitSeconds = Math.ceil((30000 - timeSinceLastResend) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`
        });
      }
    }

    // Delete old OTPs
    await db.query('DELETE FROM login_otps WHERE user_id = ?', [user.user_id]);

    // Generate and send OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      'INSERT INTO login_otps (user_id, otp_code, expires_at) VALUES (?, ?, ?)',
      [user.user_id, otp, expiresAt]
    );

    await sendOTPEmail(email, otp, 'login');

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email.',
      userId: user.user_id
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// ============================================================
// LOGIN - Step 2: Verify OTP and generate JWT
// POST /api/auth/verify-login-otp
// ============================================================
const verifyLoginOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required.'
      });
    }

    // Find OTP record
    const [otpRecords] = await db.query(
      'SELECT * FROM login_otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please login again.'
      });
    }

    const otpRecord = otpRecords[0];

    // Check max attempts
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please login again.'
      });
    }

    // Check expiry
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please login again.'
      });
    }

    // Increment attempts
    await db.query(
      'UPDATE login_otps SET attempts = attempts + 1 WHERE otp_id = ?',
      [otpRecord.otp_id]
    );

    // Verify OTP
    if (otpRecord.otp_code !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${4 - otpRecord.attempts} attempts remaining.`
      });
    }

    // Get user details
    const [users] = await db.query(
      'SELECT user_id, full_name, email, dob, gender FROM users WHERE user_id = ?',
      [userId]
    );

    const user = users[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Delete used OTP
    await db.query('DELETE FROM login_otps WHERE user_id = ?', [userId]);

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
    console.error('Verify login OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

// ============================================================
// RESEND OTP
// POST /api/auth/resend-otp
// ============================================================
const resendOTP = async (req, res) => {
  try {
    const { email, userId, type } = req.body;

    if (type === 'registration') {
      // Check cooldown
      const [existing] = await db.query(
        'SELECT * FROM registration_otps WHERE email = ? ORDER BY created_at DESC LIMIT 1',
        [email]
      );

      if (existing.length > 0) {
        const timeSince = Date.now() - new Date(existing[0].created_at).getTime();
        if (timeSince < 30000) {
          const wait = Math.ceil((30000 - timeSince) / 1000);
          return res.status(429).json({ success: false, message: `Wait ${wait} seconds.` });
        }
      }

      await db.query('DELETE FROM registration_otps WHERE email = ?', [email]);
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await db.query('INSERT INTO registration_otps (email, otp_code, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);
      await sendOTPEmail(email, otp, 'registration');

    } else {
      // Login OTP resend
      const [users] = await db.query('SELECT email FROM users WHERE user_id = ?', [userId]);
      if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });

      const [existing] = await db.query(
        'SELECT * FROM login_otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      if (existing.length > 0) {
        const timeSince = Date.now() - new Date(existing[0].created_at).getTime();
        if (timeSince < 30000) {
          const wait = Math.ceil((30000 - timeSince) / 1000);
          return res.status(429).json({ success: false, message: `Wait ${wait} seconds.` });
        }
      }

      await db.query('DELETE FROM login_otps WHERE user_id = ?', [userId]);
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await db.query('INSERT INTO login_otps (user_id, otp_code, expires_at) VALUES (?, ?, ?)', [userId, otp, expiresAt]);
      await sendOTPEmail(users[0].email, otp, 'login');
    }

    return res.status(200).json({ success: true, message: 'New OTP sent successfully.' });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
};

module.exports = { register, verifyRegistrationOTP, login, verifyLoginOTP, resendOTP };
