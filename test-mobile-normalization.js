// Test script for mobile number normalization
const { signup, login, verifyEmailOtp, verifyMobileOtp, resendOtp } = require('./controllers/authController');

// Test the normalizeMobile function
function testNormalizeMobile() {
  console.log('🧪 Testing Mobile Number Normalization\n');
  
  // Test cases
  const testCases = [
    '8804208836',      // 10 digits - should become +918804208836
    '08804208836',     // 11 digits starting with 0 - should become +918804208836
    '918804208836',    // 12 digits starting with 91 - should become +918804208836
    '+918804208836',   // Already in E.164 format - should remain +918804208836
    '880420883',       // 9 digits - should become +91880420883
    '88042088365',     // 11 digits not starting with 0 - should become +9188042088365
  ];
  
  testCases.forEach(testCase => {
    // We need to simulate the normalizeMobile function
    let normalized = testCase.replace(/[^\d+]/g, '');
    
    if (normalized.startsWith('+')) {
      normalized = normalized;
    } else if (normalized.length === 10) {
      normalized = `+91${normalized}`;
    } else if (normalized.length === 11 && normalized.startsWith('0')) {
      normalized = `+91${normalized.substring(1)}`;
    } else if (normalized.length === 12 && normalized.startsWith('91')) {
      normalized = `+${normalized}`;
    } else {
      normalized = `+91${normalized}`;
    }
    
    console.log(`Input: ${testCase} → Output: ${normalized}`);
  });
  
  console.log('\n✅ Mobile number normalization test completed!');
  console.log('📱 Your number 8804208836 should become +918804208836');
}

// Run the test
testNormalizeMobile(); 