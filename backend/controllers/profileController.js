// controllers/profileController.js
// Handles user profile operations

const bcrypt = require('bcryptjs');
const db = require('../config/database');

/**
 * Calculate age from date of birth
 */
const calculateAge = (dob) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// GET /api/profile - Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [users] = await db.query(
      'SELECT user_id, full_name, email, dob, gender, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];
    const age = calculateAge(user.dob);

    return res.status(200).json({
      success: true,
      user: { ...user, age }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// PUT /api/profile - Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { full_name, dob, gender, current_password, new_password } = req.body;

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (full_name) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }
    if (dob) {
      updateFields.push('dob = ?');
      updateValues.push(dob);
    }
    if (gender) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }

    // Handle password change
    if (new_password && current_password) {
      const [users] = await db.query('SELECT password FROM users WHERE user_id = ?', [userId]);
      const isValid = await bcrypt.compare(current_password, users[0].password);

      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const hashed = await bcrypt.hash(new_password, 12);
      updateFields.push('password = ?');
      updateValues.push(hashed);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    updateValues.push(userId);
    await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`,
      updateValues
    );

    // Return updated profile
    const [updated] = await db.query(
      'SELECT user_id, full_name, email, dob, gender FROM users WHERE user_id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: { ...updated[0], age: calculateAge(updated[0].dob) }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// DELETE /api/profile - Delete account and all data
const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // MySQL foreign key constraints with CASCADE will handle related data
    await db.query('DELETE FROM users WHERE user_id = ?', [userId]);

    return res.status(200).json({
      success: true,
      message: 'Account and all data deleted successfully.'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
};

module.exports = { getProfile, updateProfile, deleteProfile };
