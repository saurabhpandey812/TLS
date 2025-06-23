const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

/**
 * Sends an OTP to the specified mobile number using Twilio Verify.
 * @param {string} mobile - The mobile number to send the OTP to (in E.164 format, e.g., +1234567890).
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const sendSmsOtp = async (mobile) => {
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
 * Verifies the OTP for the specified mobile number using Twilio Verify.
 * @param {string} mobile - The mobile number to verify (in E.164 format).
 * @param {string} otp - The OTP code to verify.
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const verifySmsOtp = async (mobile, otp) => {
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