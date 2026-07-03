// src/components/auth/OTPVerify.js
// OTP verification page (shared for registration & login)

import React, { useState, useEffect, useCallback } from 'react';
import OTPInput from './OTPInput';
import api from '../../utils/api';

const OTPVerify = ({ type, email, userId, onSuccess, onBack }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(30); // 30s resend cooldown
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;

      if (type === 'registration') {
        response = await api.post('/auth/verify-registration-otp', { email, otp });
      } else {
        response = await api.post('/auth/verify-login-otp', { userId, otp });
      }

      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => onSuccess(response.data), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResending(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/resend-otp', {
        type,
        email: type === 'registration' ? email : undefined,
        userId: type === 'login' ? userId : undefined
      });

      setSuccess('New OTP sent to your email!');
      setCountdown(30);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '70px', height: '70px',
          background: 'linear-gradient(135deg, #4F46E5, #14B8A6)',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '32px'
        }}>
          📧
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
          Check Your Email
        </h2>
        <p style={{ color: '#64748B', fontSize: '15px' }}>
          We sent a 6-digit verification code to
        </p>
        <p style={{ color: '#4F46E5', fontWeight: '600', fontSize: '15px' }}>
          {email || 'your email'}
        </p>
      </div>

      {/* Error / Success messages */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          ✅ {success}
        </div>
      )}

      {/* OTP Input */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ textAlign: 'center', color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
          Enter the 6-digit code
        </p>
        <OTPInput value={otp} onChange={setOtp} disabled={loading} />
      </div>

      {/* Verify Button */}
      <button
        className="btn btn-primary btn-full btn-lg"
        onClick={handleVerify}
        disabled={loading || otp.length !== 6}
        style={{ marginBottom: '16px' }}
      >
        {loading ? (
          <>
            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            Verifying...
          </>
        ) : '✓ Verify Code'}
      </button>

      {/* Resend OTP */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none', border: 'none',
              color: '#4F46E5', fontWeight: '600',
              cursor: 'pointer', fontSize: '14px'
            }}
          >
            {resending ? 'Sending...' : '🔄 Resend OTP'}
          </button>
        ) : (
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            Resend OTP in <strong style={{ color: '#4F46E5' }}>{countdown}s</strong>
          </p>
        )}
      </div>

      {/* OTP Info */}
      <div className="card" style={{ background: '#F8FAFC', border: 'none', textAlign: 'center' }}>
        <p style={{ color: '#64748B', fontSize: '13px' }}>
          ⏰ OTP expires in 5 minutes • Maximum 5 attempts
        </p>
      </div>

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'block', width: '100%',
            marginTop: '16px', background: 'none',
            border: 'none', color: '#64748B',
            cursor: 'pointer', fontSize: '14px'
          }}
        >
          ← Go back
        </button>
      )}
    </div>
  );
};

export default OTPVerify;
