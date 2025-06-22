// controllers/authController.js
const User = require('../models/User');
const { generateToken } = require('../services/authService');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sendEmail = require('../services/emailService');
const { sendSmsOtp, verifySmsOtp } = require('../services/twilioService');

/**
 * Normalizes a mobile number to E.164 format.
 * @param {string} mobile - The mobile number to normalize.
 * @returns {string} - The normalized mobile number.
 */
const normalizeMobile = (mobile) => {
  // Remove any non-digit characters except the leading +
  mobile = mobile.replace(/[^\d+]/g, '');
  // Ensure it starts with a +
  if (!mobile.startsWith('+')) {
    // Assume US country code if none provided (modify as needed)
    mobile = `+91${mobile}`;
  }
  return mobile;
};

/**
 * Handles the first step of registration: sending an OTP via email or SMS.
 */


const signup = async (req, res) => {
  try {
    let { email, name, password, mobile } = req.body;

    // Validate inputs
    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Either email or mobile number is required for registration.',
      });
    }

    // Normalize mobile number if provided
    if (mobile) {
      mobile = normalizeMobile(mobile);
      if (!/^\+\d{10,15}$/.test(mobile)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid mobile number format. Use E.164 format (e.g., +1234567890).',
        });
      }
    }

    // Check for existing verified or unverified users
    const query = [];
    if (email) query.push({ email });
    if (mobile) query.push({ mobile });

    const existingUser = await User.findOne({ $or: query });
    if (existingUser) {
      if (existingUser.email_verified || existingUser.mobile_verified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email or mobile already exists and is verified.',
        });
      }
      // Delete unverified user to allow re-registration
      await User.deleteOne({ _id: existingUser._id });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Password before hashing:", password);
    console.log("Hashed password:", hashedPassword);

    

    // Create new user
    const user = new User({
      name,
      email: email || "",
      mobile: mobile || "",
      password: hashedPassword,
      email_verified: false,
      mobile_verified: false,
    });

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
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      await sendEmail({
        email: user.email,
        subject: 'Your Email Verification OTP',
        message: `Your one-time verification code is: ${otp}`,
      });

      return res.status(200).json({
        success: true,
        message: `Email OTP has been sent to ${email}. Please verify to complete your registration.`,
      });
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



/**
 * Verifies the email OTP and completes the registration.
 */
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid OTP or OTP has expired.' });
    }
    user.email_verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    const token = generateToken(user);
    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Registration complete.',
      user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile },
      accessToken: token,
    });
  } catch (error) {
    console.error('Email OTP Verification error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong during OTP verification.' });
  }
};

/**
 * Verifies the mobile OTP using Twilio and completes the registration.
 */
const verifyMobileOtp = async (req, res) => {
  try {
    let { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required.' });
    }

    // Normalize mobile number
    mobile = normalizeMobile(mobile);
    if (!/^\+\d{10,15}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format. Use E.164 format (e.g., +1234567890).',
      });
    }

    // Verify OTP with Twilio
    const verificationResult = await verifySmsOtp(mobile, otp);
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        message: verificationResult.message || 'Invalid OTP code.',
      });
    }

    // Find and update user
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this mobile number.' });
    }

    user.mobile_verified = true;
    await user.save();

    const token = generateToken(user);
    res.status(200).json({
      success: true,
      message: 'Mobile verified successfully! Registration complete.',
      user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile },
      accessToken: token,
    });
  } catch (error) {
    console.error('Mobile OTP Verification error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong during mobile verification.' });
  }
};

/**
 * Resends a new OTP to the user's email or mobile.
 */
const resendOtp = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile) {
      return res.status(400).json({ success: false, message: 'Email or mobile number is required.' });
    }

    // Normalize mobile number if provided
    let normalizedMobile = mobile ? normalizeMobile(mobile) : null;
    if (mobile && !/^\+\d{10,15}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format. Use E.164 format (e.g., +1234567890).',
      });
    }

    const query = [];
    if (email) query.push({ email });
    if (normalizedMobile) query.push({ mobile: normalizedMobile });

    const user = await User.findOne({ $or: query });
    if (!user) {
      return res.status(404).json({ success: false, message: 'This email or mobile is not registered.' });
    }

    if (user.email_verified && user.mobile_verified) {
      return res.status(400).json({ success: false, message: 'This account is already fully verified.' });
    }

    if (mobile && !user.mobile_verified) {
      const smsResult = await sendSmsOtp(normalizedMobile);
      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to resend SMS OTP. Please try again.',
          error: smsResult.message,
        });
      }
      return res.status(200).json({
        success: true,
        message: `A new SMS OTP has been sent to ${normalizedMobile}.`,
      });
    } else if (email && !user.email_verified) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
      await sendEmail({
        email: user.email,
        subject: 'Your New Verification Code',
        message: `Your new one-time verification code is: ${otp}`,
      });
      return res.status(200).json({ success: true, message: `A new OTP has been sent to ${email}.` });
    } else {
      return res.status(400).json({
        success: false,
        message: 'The provided method is already verified or not applicable.',
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
};

/**
 * Handles user login with either email or mobile.
 */
const login = async (req, res) => {
  try {
    let { email, mobile, password } = req.body;

    console.log("Login request received:", { email, mobile, password });

    if (!password || (!email && !mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Password and either email or mobile are required.',
      });
    }

    // Find user by email or mobile
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (mobile) {
      // For mobile login, try both normalized and original mobile
      const normalizedMobile = normalizeMobile(mobile);
      user = await User.findOne({ 
        $or: [
          { mobile: mobile },
          { mobile: normalizedMobile }
        ]
      });
    }

    console.log("User from DB:", user);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid credentials.' });
    }

    console.log("Stored hash:", user.password);
    console.log("Input password:", password);

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password matched:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Skip verification check for now
    // if (!user.email_verified && !user.mobile_verified) {
    //   return res.status(403).json({ success: false, message: 'Account not verified.' });
    // }

    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        mobile: user.mobile,
        email_verified: user.email_verified,
        mobile_verified: user.mobile_verified
      },
      accessToken: token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong during login.' });
  }
};


module.exports = { signup, login, verifyEmailOtp, verifyMobileOtp, resendOtp };