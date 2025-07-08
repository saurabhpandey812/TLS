// Utility functions for authentication

/**
 * Normalizes a mobile number to E.164 format.
 * @param {string} mobile - The mobile number to normalize.
 * @returns {string} - The normalized mobile number.
 */
function normalizeMobile(mobile) {
  mobile = mobile.replace(/[^\d+]/g, '');
  if (!mobile.startsWith('+')) {
    mobile = `+91${mobile}`;
  }
  return mobile;
}

/**
 * Generates a 6-digit OTP as a string.
 * @returns {string}
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  normalizeMobile,
  generateOtp,
}; 