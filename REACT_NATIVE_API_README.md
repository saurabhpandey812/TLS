# React Native API Documentation

This API has been optimized for React Native mobile applications supporting both iOS and Android platforms.

## 🚀 Features

- **Cross-platform support**: iOS and Android
- **Optimized for mobile networks**: Compression, caching, and rate limiting
- **React Native specific headers**: Platform detection and device information
- **Offline support**: Background sync and queue management
- **Push notifications**: FCM (Android) and APNS (iOS) support
- **File upload optimization**: Image compression and size limits
- **Biometric authentication**: Support for fingerprint/face recognition
- **Auto token refresh**: Seamless authentication experience

## 📱 Configuration

The API uses a centralized React Native configuration file located at `config/react-native.js`. This file contains all mobile-specific settings:

```javascript
// Example configuration
const reactNativeConfig = {
  reactNative: {
    app: {
      name: 'TLS Mobile App',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      minSdkVersion: 21,
      targetSdkVersion: 33,
      iosVersion: '12.0',
    },
    // ... more configuration
  }
};
```

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/your_database

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d

# Server
PORT=8000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
MOBILE_APP_URL=http://localhost:8081

# Email (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Twilio (for SMS OTP)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Push Notifications
PUSH_NOTIFICATIONS_ENABLED=true
FCM_SERVER_KEY=your_fcm_key
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apns_team_id
APNS_PRIVATE_KEY=your_apns_private_key
```

### 3. Start the Server

```bash
npm run dev
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/verify-email` | Verify email OTP |
| POST | `/api/auth/verify-mobile` | Verify mobile OTP |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/logout` | Logout user |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |
| POST | `/api/profile/avatar` | Upload avatar |
| DELETE | `/api/profile/avatar` | Delete avatar |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get posts (with pagination) |
| POST | `/api/posts` | Create new post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |

### Social Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/follow/:userId` | Follow user |
| DELETE | `/api/follow/:userId` | Unfollow user |
| POST | `/api/like/:postId` | Like post |
| DELETE | `/api/like/:postId` | Unlike post |
| POST | `/api/comment/:postId` | Comment on post |
| DELETE | `/api/comment/:commentId` | Delete comment |

## 📱 React Native Headers

Include these headers in your React Native API requests:

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  'X-Platform': Platform.OS, // 'ios' or 'android'
  'X-App-Version': '1.0.0',
  'X-Device-ID': deviceId,
  'X-Device-Model': deviceModel,
  'X-OS-Version': osVersion,
  'X-Screen-Width': screenWidth,
  'X-Screen-Height': screenHeight,
  'X-Network-Type': networkType, // 'wifi', 'cellular', 'none'
  'X-Timezone': timezone,
  'X-React-Native': 'true'
};
```

## 🔐 Authentication

### JWT Token Management

The API uses JWT tokens with automatic refresh:

```javascript
// Login response includes access token
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user data */ },
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### Biometric Authentication

Enable biometric authentication in your React Native app:

```javascript
// Check if biometric auth is available
const isBiometricAvailable = await BiometricAuth.isAvailable();

// Authenticate with biometrics
const result = await BiometricAuth.authenticate();
```

## 📤 File Upload

### Image Upload

```javascript
const formData = new FormData();
formData.append('image', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'photo.jpg'
});

const response = await fetch('/api/profile/avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Platform': Platform.OS,
    'X-React-Native': 'true'
  },
  body: formData
});
```

### Upload Limits

- **Max file size**: 5MB
- **Allowed image types**: JPEG, PNG, GIF, WebP
- **Allowed video types**: MP4, QuickTime
- **Max files per request**: 3
- **Image quality**: 80%

## 🔔 Push Notifications

### Setup

1. **Android (FCM)**:
   - Configure Firebase Cloud Messaging
   - Add FCM server key to environment variables

2. **iOS (APNS)**:
   - Configure Apple Push Notification Service
   - Add APNS credentials to environment variables

### Sending Notifications

```javascript
// The API automatically handles push notifications
// when users interact with posts, comments, etc.
```

## 📊 Response Format

All API responses follow a consistent format:

```javascript
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

### Error Responses

```javascript
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 400,
  "details": { /* additional error details */ }
}
```

## 🔄 Offline Support

The API supports offline functionality:

- **Background sync**: Queues requests when offline
- **Retry mechanism**: Automatically retries failed requests
- **Cache management**: Caches responses for offline access

## 📈 Performance Optimization

### Caching

- **Response caching**: 10 minutes by default
- **Image optimization**: Automatic compression
- **Lazy loading**: Supports pagination

### Network Optimization

- **Compression**: Gzip compression enabled
- **Rate limiting**: Prevents API abuse
- **Connection pooling**: Optimized for mobile networks

## 🛠️ Development

### Debug Mode

Enable debug mode for development:

```javascript
// In config/react-native.js
debugging: {
  enabled: process.env.NODE_ENV === 'development',
  logLevel: 'info',
  enableMetrics: true,
  enableCrashReporting: true,
}
```

### Logging

The API provides detailed logging for React Native requests:

```
📱 React Native Request: POST /api/auth/login - ios v1.0.0
📱 React Native Response: POST /api/auth/login - 200 (150ms)
```

## 🚀 Production Deployment

### Environment Variables

Set production environment variables:

```env
NODE_ENV=production
FRONTEND_URL=https://your-app.com
MOBILE_APP_URL=https://your-app.com
PUSH_NOTIFICATIONS_ENABLED=true
```

### Performance Monitoring

Monitor API performance with built-in metrics:

- Request/response times
- Error rates
- Platform-specific analytics
- Network type tracking

## 📚 Examples

### React Native API Client

```javascript
class APIClient {
  constructor() {
    this.baseURL = 'http://your-api.com';
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-Platform': Platform.OS,
      'X-App-Version': '1.0.0',
      'X-React-Native': 'true',
      ...options.headers
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }

    return data;
  }

  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    this.setToken(response.data.accessToken);
    return response.data;
  }
}
```

## 🤝 Support

For questions and support:

1. Check the API documentation at `/api-docs`
2. Review the health endpoint at `/api/health`
3. Check server logs for detailed error information

## 📄 License

This API is part of the TLS Mobile App project. 