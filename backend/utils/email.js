// utils/email.js
// Handles sending OTP emails via Resend (HTTP-based, works on all hosting platforms)

const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email to user via Resend
 * @param {string} email - Recipient email
 * @param {string} otp - The OTP code
 * @param {string} type - 'registration' or 'login'
 */
const sendOTPEmail = async (email, otp, type = 'login') => {
  const subject = type === 'registration'
    ? 'NeuroMind - Verify Your Email'
    : 'NeuroMind - Login Verification Code';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #4F46E5, #14B8A6); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.8); margin: 5px 0 0; }
        .body { padding: 30px; text-align: center; }
        .otp-box { background: #F8FAFC; border: 2px dashed #4F46E5; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .otp-code { font-size: 40px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; }
        .warning { color: #64748B; font-size: 13px; margin-top: 20px; }
        .footer { background: #F8FAFC; padding: 15px; text-align: center; color: #64748B; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 NeuroMind</h1>
          <p>ADHD Assessment Platform</p>
        </div>
        <div class="body">
          <h2 style="color: #0F172A;">Your Verification Code</h2>
          <p style="color: #64748B;">${type === 'registration' ? 'Please verify your email to complete registration.' : 'Use this code to complete your login.'}</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="warning">⏰ This code expires in <strong>5 minutes</strong>.</p>
          <p class="warning">🔒 Never share this code with anyone.</p>
          <p class="warning">If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2024 NeuroMind | ADHD & Cognitive Assessment Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'NeuroMind <onboarding@resend.dev>',
      to: email,
      subject: subject,
      html: htmlContent
    });

    if (error) {
      console.error('❌ Resend email error:', error);
      throw new Error('Failed to send OTP email. Please try again.');
    }

    console.log('📧 Email sent successfully:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Failed to send OTP email. Please try again.');
  }
};

module.exports = { generateOTP, sendOTPEmail };