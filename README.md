# TLS Project with Two-Step Registration OTP System

This project includes a complete authentication system with two-step registration using email OTP verification.

## Features

- Two-step user registration process
- Email OTP verification before account creation
- User login (requires completed registration)
- Resend OTP functionality
- JWT-based authentication
- Password hashing with bcrypt
- 10-minute OTP expiration for security
- Support for both email and mobile registration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/your_database_name

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# Email Configuration (for Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Application Configuration
BASE_URL=http://localhost:3000
PORT=3000
```

### 3. Email Setup (Gmail)

To use Gmail for sending emails:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the generated app password in your `EMAIL_PASSWORD` environment variable

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/send-otp` - Send OTP for registration
- `POST /api/auth/register` - Complete registration with OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/resend-otp` - Resend registration OTP

### Two-Step Registration Flow

1. **Step 1**: User enters email/mobile → System sends 6-digit OTP
2. **Step 2**: User enters name, password, and OTP → Account created
3. **Step 3**: User can now login with email/mobile and password

### Login Flow

1. User attempts to login with email/mobile and password
2. System checks if registration is completed
3. If verified, generates JWT token and returns user data

## Email Templates

The system includes professionally designed HTML email templates for:
- Registration OTP (6-digit code)
- Password reset (bonus feature)

## Security Features

- Two-step registration process
- 6-digit OTP codes for verification
- 10-minute OTP expiration
- Maximum 3 failed OTP attempts
- JWT tokens for authentication
- Password hashing with bcrypt
- Secure OTP generation

## Database Schema

The User model includes:
- Basic user information (name, email, mobile, password)
- Email verification status
- OTP code and expiration
- Automatic password hashing on save

## Error Handling

The system includes comprehensive error handling for:
- Invalid/expired OTP codes
- Too many failed OTP attempts
- Email sending failures
- Duplicate email/mobile registration
- Incomplete registration login attempts

## Two-Step Registration Process

### Step 1: Send OTP
1. **Request**: User submits email/mobile
2. **Validation**: Check if user already exists
3. **OTP Generation**: Generate 6-digit OTP
4. **Email/SMS**: Send OTP to user
5. **Storage**: Store OTP temporarily (10 minutes)

### Step 2: Complete Registration
1. **Request**: User submits name, password, and OTP
2. **OTP Verification**: Validate OTP and expiration
3. **User Creation**: Create user account
4. **Cleanup**: Remove OTP from storage
5. **Response**: Return success with user data

## Example API Usage

### Step 1 - Send OTP
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "mobile": "1234567890"
}
```

### Step 2 - Complete Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "mobile": "1234567890",
  "otp": "123456"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Resend OTP
```bash
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "mobile": "1234567890"
}
```

## Testing

Run the test script to see the complete flow:

```bash
node test-email-verification.js
```

## Important Notes

- OTP expires after 10 minutes
- Maximum 3 failed OTP attempts allowed
- User account is only created after successful OTP verification
- Email verification is automatically set to true after OTP verification
- Temporary OTP storage is used (in production, use Redis) 