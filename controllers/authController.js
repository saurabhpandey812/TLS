// controllers/authController.js
const User = require('../models/Profile');
const { generateToken } = require('../services/authService');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sendEmail = require('../services/emailService');
const { sendSmsOtp, verifySmsOtp } = require('../services/twilioService');
const generateUsername = require('../utils/generateUsername');
const normalizeMobile = require('../utils/normalizeMobile');

// Optimized signup function
const signup = async (req, res) => {
  try {
    let { email, name, password, mobile } = req.body;

    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Either email or mobile number is required for registration.',
      });
    }
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name and password are required for registration.',
      });
    }

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-generate unique username
    const username = await generateUsername(name);

    const userData = {
      name,
      username,
      password: hashedPassword,
      email_verified: false,
      mobile_verified: false,
    };
    if (email) userData.email = email;
    if (mobile) userData.mobile = mobile;

    const user = new User(userData);
    await user.save();

    // Send OTP
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

    mobile = normalizeMobile(mobile);
    if (!/^\+\d{10,15}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format. Use E.164 format (e.g., +1234567890).',
      });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this mobile number.' });
    }

    // Verify OTP with Twilio
    const isDev = process.env.NODE_ENV === 'development';
    const verificationResult = await verifySmsOtp(mobile, otp, isDev);
    if (!verificationResult.success) {
      return res.status(400).json({ success: false, message: verificationResult.message || 'Invalid OTP.' });
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
  } catch (error) {
    console.error('Mobile OTP Verification error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong during mobile verification.' });
  }
};

// Optimized resend OTP
const resendOtp = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile) {
      return res.status(400).json({ success: false, message: 'Email or mobile number is required.' });
    }

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
      // Generate new OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
      
      console.log('Generated new OTP for resend:', otp);
      
      // Update user with new OTP
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
      
      console.log('User OTP saved:', user.otp);
      
      // Send email with OTP
      try {
        await sendEmail({
          email: user.email,
          subject: 'Your New Verification Code',
          message: `Your new one-time verification code is: ${otp}`,
        });
        console.log('Email sent successfully with OTP:', otp);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send email OTP. Please try again.',
          error: emailError.message,
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `A new OTP has been sent to ${email}.`,
      });
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

// Optimized login function
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
    if (email && !user.email_verified) {
      return res.status(403).json({ success: false, message: 'Email is not verified/registered.' });
    }
    if (mobile && !user.mobile_verified) {
      return res.status(403).json({ success: false, message: 'Mobile is not verified/registered.' });
    }

    console.log("Stored hash:", user.password);
    console.log("Input password:", password);

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password matched:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }


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

// forgot password by sending OTP to email or mobile.

const forgotPasswordRequest = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile) {
      return res.status(400).json({ success: false, message: 'Email or mobile is required.' });
    }
    let user;
    if (email) {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: 'User with this email not found.' });
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await user.save();
      await sendEmail({
        email: user.email,
        subject: 'Your Password Reset OTP',
        message: `Your one-time verification code is: ${otp}`,
      });
      return res.status(200).json({ success: true, message: 'OTP sent to email.' });
    } else {
      let normMobile = normalizeMobile(mobile);
      user = await User.findOne({ mobile: normMobile });
      if (!user) return res.status(404).json({ success: false, message: 'User with this mobile not found.' });
      const smsResult = await sendSmsOtp(normMobile);
      if (!smsResult.success) {
        return res.status(500).json({ success: false, message: 'Failed to send SMS OTP.', error: smsResult.message });
      }
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await user.save();
      return res.status(200).json({ success: true, message: 'OTP sent to mobile.' });
    }
  } catch (error) {
    console.error('Forgot password request error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong.', error: error.message });
  }
};

//Verifies OTP for forgot password (email or mobile).

const forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { email, mobile, otp } = req.body;
    if ((!email && !mobile) || !otp) {
      return res.status(400).json({ success: false, message: 'Email or mobile and OTP are required.' });
    }
    let user;
    if (email) {
      user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
      if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
      user.otp = undefined;
      user.otpExpires = undefined;
      user._otpVerifiedForReset = true; // Not saved to DB, just for next step
      await user.save();
      return res.status(200).json({ success: true, message: 'OTP verified. You can now reset your password.' });
    } else {
      let normMobile = normalizeMobile(mobile);
      user = await User.findOne({ mobile: normMobile, otpExpires: { $gt: Date.now() } });
      if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
      // Verify with Twilio
      const verificationResult = await verifySmsOtp(normMobile, otp);
      if (!verificationResult.success) {
        return res.status(400).json({ success: false, message: verificationResult.message || 'Invalid OTP.' });
      }
      user.otpExpires = undefined;
      await user.save();
      return res.status(200).json({ success: true, message: 'OTP verified. You can now reset your password.' });
    }
  } catch (error) {
    console.error('Forgot password OTP verify error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong.', error: error.message });
  }
};

// Resets password after OTP verification.

const forgotPasswordReset = async (req, res) => {
  try {
    const { email, mobile, newPassword } = req.body;
    if ((!email && !mobile) || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email or mobile and new password are required.' });
    }
    let user;
    if (email) {
      user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    } else {
      let normMobile = normalizeMobile(mobile);
      user = await User.findOne({ mobile: normMobile });
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    console.error('Forgot password reset error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong.', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  verifyEmailOtp,
  verifyMobileOtp,
  resendOtp,
  forgotPasswordRequest,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
};
