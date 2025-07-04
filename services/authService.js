const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('../models/Profile');
const sendEmail = require('./emailService');
const { sendSmsOtp } = require('./twilioService');
const { normalizeMobile, generateOtp } = require('../utils/authUtils');

const generateToken = (user) => {
  const payload = {
    userId: user?._id,
    name: user?.name,
    email: user?.email,
  };

  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error };
  }
};

// Express middleware for authentication
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Creates a new user and sends OTP via email or SMS.
 * @param {Object} userData - { name, email, password, mobile }
 * @returns {Object} - { success, message, user, otp, error }
 */
async function createUserAndSendOtp({ name, email, password, mobile }) {
  // Normalize and validate mobile
  if (mobile) {
    mobile = normalizeMobile(mobile);
    if (!/^\+\d{10,15}$/.test(mobile)) {
      return { success: false, message: 'Invalid mobile number format. Use E.164 format (e.g., +1234567890).' };
    }
  }

  // Check for existing user
  const query = [];
  if (email) query.push({ email });
  if (mobile) query.push({ mobile });
  const existingUser = await User.findOne({ $or: query }).select('email_verified mobile_verified');
  if (existingUser) {
    if (email && existingUser.email === email && existingUser.email_verified) {
      return { success: false, message: 'An account with this email already exists.' };
    }
    if (mobile && existingUser.mobile === mobile && existingUser.mobile_verified) {
      return { success: false, message: 'An account with this mobile already exists.' };
    }
    // Allow re-registration if not verified
    await User.deleteOne({ _id: existingUser._id });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 8);
  const userObj = {
    name,
    password: hashedPassword,
    email_verified: false,
    mobile_verified: false,
  };
  if (email) userObj.email = email;
  if (mobile) userObj.mobile = mobile;
  const user = new User(userObj);
  await user.save();

  // Send OTP
  if (mobile) {
    const smsResult = await sendSmsOtp(mobile);
    if (!smsResult.success) {
      return { success: false, message: 'Failed to send SMS OTP.', error: smsResult.message };
    }
    return { success: true, message: `SMS OTP sent to ${mobile}.`, user };
  } else {
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    try {
      await sendEmail({
        email: user?.email,
        subject: 'Your Email Verification OTP',
        message: `Your one-time verification code is: ${otp}`,
      });
      return { success: true, message: `Email OTP sent to ${email}.`, user };
    } catch (emailError) {
      return { success: false, message: 'Failed to send email OTP.', error: emailError.message, otp };
    }
  }
}

/**
 * Verifies email OTP and completes registration.
 * @param {string} email
 * @param {string} otp
 * @returns {Object} - { success, message, user, accessToken, error }
 */
async function verifyEmailOtpService(email, otp) {
  if (!email || !otp) {
    return { success: false, message: 'Email and OTP are required.' };
  }
  const user = await User.findOne({
    email,
    otp,
    otpExpires: { $gt: Date.now() },
  }).select('_id name email mobile');
  if (!user) {
    return { success: false, message: 'Invalid OTP or OTP has expired.' };
  }
  await User.updateOne(
    { _id: user._id },
    { $set: { email_verified: true }, $unset: { otp: 1, otpExpires: 1 } }
  );
  const token = generateToken(user);
  return {
    success: true,
    message: 'Email verified successfully! Registration complete.',
    user: { id: user?._id, name: user?.name, email: user?.email, mobile: user?.mobile },
    accessToken: token,
  };
}

/**
 * Verifies mobile OTP and completes registration.
 * @param {string} mobile
 * @param {string} otp
 * @param {boolean} isDev
 * @returns {Object} - { success, message, user, accessToken, error }
 */
async function verifyMobileOtpService(mobile, otp, isDev = false) {
  if (!mobile || !otp) {
    return { success: false, message: 'Mobile number and OTP are required.' };
  }
  mobile = normalizeMobile(mobile);
  if (!/^\+\d{10,15}$/.test(mobile)) {
    return { success: false, message: 'Invalid mobile number format. Use E.164 format (e.g., +1234567890).' };
  }
  if (isDev) {
    const user = await User.findOne({ mobile }).select('_id name email mobile');
    if (!user) {
      return { success: false, message: 'User not found with this mobile number.' };
    }
    await User.updateOne({ _id: user._id }, { $set: { mobile_verified: true } });
    const token = generateToken(user);
    return {
      success: true,
      message: 'Mobile verified successfully! Registration complete.',
      user: { id: user?._id, name: user?.name, email: user?.email, mobile: user?.mobile },
      accessToken: token,
    };
  }
  // Production: verify with Twilio
  const { verifySmsOtp } = require('./twilioService');
  const verificationResult = await verifySmsOtp(mobile, otp);
  if (!verificationResult.success) {
    return { success: false, message: verificationResult.message || 'Invalid OTP code.' };
  }
  const user = await User.findOne({ mobile }).select('_id name email mobile');
  if (!user) {
    return { success: false, message: 'User not found with this mobile number.' };
  }
  await User.updateOne({ _id: user._id }, { $set: { mobile_verified: true } });
  const token = generateToken(user);
  return {
    success: true,
    message: 'Mobile verified successfully! Registration complete.',
    user: { id: user?._id, name: user?.name, email: user?.email, mobile: user?.mobile },
    accessToken: token,
  };
}

/**
 * Resends OTP for email or mobile.
 * @param {Object} params - { email, mobile, isDev }
 * @returns {Object} - { success, message, developmentOtp, error }
 */
async function resendOtpService({ email, mobile, isDev = false }) {
  if (!email && !mobile) {
    return { success: false, message: 'Email or mobile number is required.' };
  }
  let normalizedMobile = mobile ? normalizeMobile(mobile) : null;
  if (mobile && !/^\+\d{10,15}$/.test(normalizedMobile)) {
    return { success: false, message: 'Invalid mobile number format. Use E.164 format (e.g., +1234567890).' };
  }
  const query = [];
  if (email) query.push({ email });
  if (normalizedMobile) query.push({ mobile: normalizedMobile });
  const user = await User.findOne({ $or: query }).select('email_verified mobile_verified email mobile');
  if (!user) {
    return { success: false, message: 'This email or mobile is not registered.' };
  }
  if (user.email_verified && user.mobile_verified) {
    return { success: false, message: 'This account is already fully verified.' };
  }
  if (mobile && !user.mobile_verified) {
    const smsResult = await sendSmsOtp(normalizedMobile);
    if (!smsResult.success) {
      return { success: false, message: 'Failed to resend SMS OTP.', error: smsResult.message };
    }
    return { success: true, message: `A new SMS OTP has been sent to ${normalizedMobile}.` };
  } else if (email && !user.email_verified) {
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await User.updateOne(
      { _id: user._id },
      { $set: { otp, otpExpires } }
    );
    if (isDev) {
      return {
        success: true,
        message: `A new OTP has been generated. For development, your OTP is: ${otp}`,
        developmentOtp: otp,
      };
    }
    try {
      await sendEmail({
        email: user?.email,
        subject: 'Your New Verification Code',
        message: `Your new one-time verification code is: ${otp}`,
      });
      return { success: true, message: `A new OTP has been sent to ${email}.` };
    } catch (emailError) {
      return { success: false, message: 'Failed to send email OTP.', error: emailError.message, developmentOtp: otp };
    }
  } else {
    return { success: false, message: 'The provided method is already verified or not applicable.' };
  }
}

/**
 * Handles user login with email or mobile and password.
 * @param {Object} params - { email, mobile, password }
 * @returns {Object} - { success, message, user, accessToken, error }
 */
async function loginService({ email, mobile, password }) {
  if (!password || (!email && !mobile)) {
    return { success: false, message: 'Password and either email or mobile are required.' };
  }
  let user;
  if (email) {
    user = await User.findOne({ email }).select('_id name email mobile password email_verified mobile_verified');
  } else if (mobile) {
    const normalizedMobile = normalizeMobile(mobile);
    user = await User.findOne({
      $or: [
        { mobile: mobile },
        { mobile: normalizedMobile }
      ]
    }).select('_id name email mobile password email_verified mobile_verified');
  }
  if (!user) {
    return { success: false, message: 'Invalid credentials.' };
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, message: 'Invalid credentials.' };
  }
  const token = generateToken(user);
  return {
    success: true,
    message: 'Login successful',
    user: {
      id: user?._id,
      name: user?.name,
      email: user?.email,
      mobile: user?.mobile,
      email_verified: user?.email_verified,
      mobile_verified: user?.mobile_verified
    },
    accessToken: token,
  };
}

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  createUserAndSendOtp,
  verifyEmailOtpService,
  verifyMobileOtpService,
  resendOtpService,
  loginService,
};