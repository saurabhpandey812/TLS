// controllers/authController.js
const User = require('../models/Profile');
const { generateToken } = require('../services/authService');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sendEmail = require('../services/emailService');
const { sendSmsOtp, verifySmsOtp } = require('../services/twilioService');
const { generateOtp } = require('../utils/authUtils');
const { createUserAndSendOtp } = require('../services/authService');
const { verifyEmailOtpService, verifyMobileOtpService, resendOtpService } = require('../services/authService');
const { loginService } = require('../services/authService');

// Optimized signup function
const signup = async (req, res) => {
  try {
    const { email, name, password, mobile } = req.body;
    const result = await createUserAndSendOtp({ name, email, password, mobile });
    if (!result.success) {
      return res.status(400).json(result);
    }
    // If mobile, respond with SMS OTP message; if email, respond with email OTP message
    return res.status(200).json(result);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong during the signup process.',
      error: error.message,
    });
  }
};

// Optimized email OTP verification
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }
    
    const result = await verifyEmailOtpService(email, otp);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Email OTP Verification error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong during OTP verification.' });
  }
};

// Optimized mobile OTP verification
const verifyMobileOtp = async (req, res) => {
  try {
    let { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required.' });
    }

    // For development, skip Twilio verification
    if (process.env.NODE_ENV === 'development') {
      const user = await User.findOne({ mobile }).select('_id name email mobile');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found with this mobile number.' });
      }

      await User.updateOne(
        { _id: user._id },
        { $set: { mobile_verified: true } }
      );

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Mobile verified successfully! Registration complete.',
        user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile },
        accessToken: token,
      });
    }

    // Verify OTP with Twilio
    const isDev = process.env.NODE_ENV === 'development';
    const result = await verifyMobileOtpService(mobile, otp, isDev);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Mobile OTP Verification error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong during mobile verification.' });
  }
};

// Optimized resend OTP
const resendOtp = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    const isDev = process.env.NODE_ENV === 'development';
    const result = await resendOtpService({ email, mobile, isDev });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
};

// Optimized login function
const login = async (req, res) => {
  try {
    let { email, mobile, password } = req.body;
    const result = await loginService({ email, mobile, password });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong during login.' });
  }
};

module.exports = { signup, login, verifyEmailOtp, verifyMobileOtp, resendOtp };
