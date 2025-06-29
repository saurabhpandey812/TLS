const fs = require('fs');
const path = require('path');

const envContent = `# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/tls_database

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=24h

# Email Configuration (for password reset, etc.)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Twilio Configuration (for SMS OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
`;

const envPath = path.join(__dirname, '.env');

try {
  if (fs.existsSync(envPath)) {
    console.log('.env file already exists. Skipping creation.');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('.env file created successfully!');
    console.log('Please update the values in the .env file with your actual configuration.');
  }
} catch (error) {
  console.error('Error creating .env file:', error);
} 