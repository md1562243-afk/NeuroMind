// src/pages/RegisterPage.js
// User registration with DOB picker and password strength indicator

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import OTPVerify from '../components/auth/OTPVerify';
import api from '../utils/api';

// Password strength checker
const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { strength: 0, label: '', color: '' },
    { strength: 1, label: 'Weak', color: '#EF4444' },
    { strength: 2, label: 'Fair', color: '#F59E0B' },
    { strength: 3, label: 'Good', color: '#14B8A6' },
    { strength: 4, label: 'Strong', color: '#22C55E' }
  ];
  return levels[score];
};

const RegisterPage = () => {
  const navigate = useNavigate();

  // Form fields
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    gender: ''
  });
  const [dob, setDob] = useState(null); // Date object for DatePicker

  // UI state
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState('form'); // 'form' or 'otp'
  const [registeredEmail, setRegisteredEmail] = useState('');

  const passwordStrength = getPasswordStrength(formData.password);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Validate form before submission
  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required.';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Enter a valid email address.';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match.';
    if (!dob) newErrors.dob = 'Date of birth is required.';
    if (!formData.gender) newErrors.gender = 'Please select your gender.';
    return newErrors;
  };

  // Submit registration form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // Format DOB as YYYY-MM-DD
      const formattedDob = dob.toISOString().split('T')[0];

      const response = await api.post('/auth/register', {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        dob: formattedDob,
        gender: formData.gender
      });

      if (response.data.success) {
        setRegisteredEmail(formData.email);
        setStep('otp');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // After OTP verified successfully
  const handleOTPSuccess = () => {
    navigate('/login', {
      state: { message: 'Account created! Please login.' }
    });
  };

  // OTP verification step
  if (step === 'otp') {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '40px' }}>
          <OTPVerify
            type="registration"
            email={registeredEmail}
            onSuccess={handleOTPSuccess}
            onBack={() => setStep('form')}
          />
        </div>
      </div>
    );
  }

  // Registration form step
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #F0FDFA 50%, #F8FAFC 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '12px',
            background: 'white', padding: '12px 24px',
            borderRadius: '100px', boxShadow: '0 2px 12px rgba(79,70,229,0.15)'
          }}>
            <span style={{ fontSize: '28px' }}>🧠</span>
            <span style={{
              fontSize: '22px', fontWeight: '800',
              background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>NeuroMind</span>
          </div>
        </div>

        <div className="card" style={{ padding: '40px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', textAlign: 'center', marginBottom: '6px' }}>
            Create Your Account
          </h1>
          <p style={{ color: '#64748B', textAlign: 'center', marginBottom: '28px', fontSize: '15px' }}>
            Start your cognitive assessment journey
          </p>

          {apiError && <div className="alert alert-error">{apiError}</div>}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`form-input ${errors.full_name ? 'error' : ''}`}
              />
              {errors.full_name && <p className="form-error">{errors.full_name}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={`form-input ${errors.email ? 'error' : ''}`}
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            {/* Date of Birth with DatePicker */}
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <DatePicker
                selected={dob}
                onChange={(date) => {
                  setDob(date);
                  if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select your date of birth"
                maxDate={new Date()}                    // Cannot select future dates
                showYearDropdown                         // Year dropdown for easy navigation
                showMonthDropdown
                dropdownMode="select"
                yearDropdownItemNumber={100}
                scrollableYearDropdown
              />
              {errors.dob && <p className="form-error">{errors.dob}</p>}
            </div>

            {/* Gender */}
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`form-input ${errors.gender ? 'error' : ''}`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
              {errors.gender && <p className="form-error">{errors.gender}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '18px', color: '#64748B'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}

              {/* Password strength bar */}
              {formData.password && (
                <div style={{ marginTop: '8px' }}>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(passwordStrength.strength / 4) * 100}%`,
                        background: passwordStrength.color,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: passwordStrength.color, marginTop: '4px', fontWeight: '600' }}>
                    Password strength: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`form-input ${errors.confirm_password ? 'error' : ''}`}
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '18px', color: '#64748B'
                  }}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.confirm_password && <p className="form-error">{errors.confirm_password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                  Creating Account...
                </>
              ) : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748B', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4F46E5', fontWeight: '600', textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
