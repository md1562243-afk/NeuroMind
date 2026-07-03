// src/components/auth/OTPInput.js
// Reusable 6-digit OTP input with auto-focus behavior

import React, { useRef, useEffect } from 'react';

const OTPInput = ({ value, onChange, disabled = false }) => {
  // Keep OTP as array of 6 characters
  const otpArray = value.split('').concat(Array(6).fill('')).slice(0, 6);

  // Refs for each input box (for auto-focus)
  const inputRefs = useRef([]);

  // Focus first box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, newValue) => {
    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) return;

    const newOTP = [...otpArray];
    newOTP[index] = newValue;
    onChange(newOTP.join(''));

    // Auto-focus next input after typing
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Move back on backspace
    if (e.key === 'Backspace') {
      if (!otpArray[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOTP = [...otpArray];
        newOTP[index - 1] = '';
        onChange(newOTP.join(''));
      }
    }
    // Move forward on right arrow
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Move back on left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    // Allow pasting full OTP
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    // Focus last filled input
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="otp-container">
      {otpArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`otp-input ${digit ? 'filled' : ''}`}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;
