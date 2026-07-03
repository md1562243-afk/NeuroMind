// middleware/auth.js
// Protects routes by verifying JWT tokens

const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware to verify JWT and attach user to request
 * Usage: router.get('/protected', authMiddleware, controller)
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists in database
    const [users] = await db.query(
      'SELECT user_id, full_name, email, dob, gender FROM users WHERE user_id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    // Attach user info to request object
    req.user = users[0];
    next(); // Continue to next middleware or route handler

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

module.exports = authMiddleware;
