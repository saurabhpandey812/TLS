const twilio = require('twilio');
require('dotenv').config();

const isDev = process.env.NODE_ENV === 'development';
const hasTwilioCreds = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID;

let client, verifyServiceSid;
if (hasTwilioCreds) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
}

/**
 * Sends an OTP to the specified mobile number using Twilio Verify or mocks in dev.
 * @param {string} mobile - The mobile number to send the OTP to (in E.164 format, e.g., +1234567890).
 * @returns {Promise<{ success: boolean, message?: string, developmentOtp?: string }>}
 */
const sendSmsOtp = async (mobile) => {
  if (isDev || !hasTwilioCreds) {
    // Mock OTP in development or if Twilio is not configured
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[DEV] Mock SMS OTP for ${mobile}: ${otp}`);
    return { success: true, message: 'Mock OTP sent (development mode)', developmentOtp: otp };
  }
  try {
    if (!mobile.startsWith('+')) {
      return { success: false, message: 'Mobile number must be in E.164 format (e.g., +1234567890)' };
    }
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: mobile,
        channel: 'sms',
      });
    if (verification.status === 'pending') {
      return { success: true, message: 'OTP sent successfully' };
    } else {
      return { success: false, message: 'Failed to send OTP' };
    }
  } catch (error) {
    console.error('Twilio send OTP error:', error);
    return { success: false, message: 'Failed to send OTP: ' + error.message };
  }
};

/**
 * Verifies the OTP for the specified mobile number using Twilio Verify or mocks in dev.
 * @param {string} mobile - The mobile number to verify (in E.164 format).
 * @param {string} otp - The OTP code to verify.
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const verifySmsOtp = async (mobile, otp) => {
  if (isDev || !hasTwilioCreds) {
    // Always succeed in development or if Twilio is not configured
    console.log(`[DEV] Mock verify OTP for ${mobile}: ${otp}`);
    return { success: true, message: 'Mock OTP verified (development mode)' };
  }
  try {
    if (!mobile.startsWith('+')) {
      return { success: false, message: 'Mobile number must be in E.164 format (e.g., +1234567890)' };
    }
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: mobile,
        code: otp,
      });
    if (verificationCheck.status === 'approved') {
      return { success: true, message: 'OTP verified successfully' };
    } else {
      return { success: false, message: 'Invalid or expired OTP' };
    }
  } catch (error) {
    console.error('Twilio verify OTP error:', error);
    return { success: false, message: 'Failed to verify OTP: ' + error.message };
  }
};

module.exports = { sendSmsOtp, verifySmsOtp };