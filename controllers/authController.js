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
    let { email, name, password, mobile } = req.body;

    // Quick validation
    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Either email or mobile number is required for registration.',
      });
    }

    // Optimized database query - check for existing users
    const query = [];
    if (email) query.push({ email });
    if (mobile) query.push({ mobile });

    const existingUser = await User.findOne({ $or: query }).select('email_verified mobile_verified');

    if (existingUser) {
      if (email && existingUser.email === email && existingUser.email_verified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      if (mobile && existingUser.mobile === mobile && existingUser.mobile_verified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this mobile already exists.',
        });
      }

      // Allow re-registration if not verified
      await User.deleteOne({ _id: existingUser._id });
    }

    // Optimized password hashing with lower rounds for faster processing
    const hashedPassword = await bcrypt.hash(password, 8); // Reduced from 10 to 8 rounds

    const userData = {
      name,      
      password: hashedPassword,
      email_verified: false,
      mobile_verified: false,
    };

    if (email) userData.email = email;
    if (mobile) userData.mobile = mobile;

    const user = new User(userData);
    await user.save();

    // Send OTP based on provided method
    if (mobile) {
      const smsResult = await sendSmsOtp(mobile);
      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to send SMS OTP. Please try again.',
          error: smsResult.message,
        });
      }
      return res.status(200).json({
        success: true,
        message: `SMS OTP has been sent to ${mobile}. Please verify to complete your registration.`,
      });
    } else {
      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // For development, skip email sending and return OTP directly
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Email OTP for ${email}: ${otp}`);
        return res.status(200).json({
          success: true,
          message: `Registration successful! For development, your OTP is: ${otp}. Please verify to complete your registration.`,
          developmentOtp: otp,
        });
      }

      try {
        await sendEmail({
          email: user.email,
          subject: 'Your Email Verification OTP',
          message: `Your one-time verification code is: ${otp}`,
        });

        return res.status(200).json({
          success: true,
          message: `Email OTP has been sent to ${email}. Please verify to complete your registration.`,
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        // For development, return the OTP in the response
        if (process.env.NODE_ENV === 'development') {
          return res.status(200).json({
            success: true,
            message: `Registration successful! For development, your OTP is: ${otp}. Please verify to complete your registration.`,
            developmentOtp: otp,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: 'Failed to send email OTP. Please try again later.',
            error: 'Email service not configured',
          });
        }
      }
    }
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
