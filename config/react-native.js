module.exports = {
  // React Native specific configuration
  reactNative: {
    // React Native app settings
    app: {
      name: 'TLS Mobile App',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      minSdkVersion: 21, // Android minimum SDK
      targetSdkVersion: 33, // Android target SDK
      iosVersion: '12.0', // Minimum iOS version
    },
    
    // React Native specific CORS origins
    corsOrigins: [
      'http://localhost:8081', // React Native Metro bundler
      'http://localhost:3000', // React Native development
      'http://10.0.2.2:8000', // Android emulator
      'http://10.0.3.2:8000', // Genymotion emulator
      'http://localhost:8000', // iOS simulator
      'http://192.168.1.100:8000', // Local network (update with your IP)
      'https://your-production-domain.com', // Production domain
    ],
    
    // React Native specific headers
    headers: {
      'X-React-Native': 'true',
      'X-App-Version': '1.0.0',
      'X-Platform': 'react-native',
    },
    
    // React Native file upload settings
    upload: {
      maxFileSize: 5 * 1024 * 1024, // 5MB for React Native
      allowedTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime'
      ],
      maxFiles: 3, // React Native usually handles fewer files
      quality: 0.8, // Image quality for React Native
    },
    
    // React Native authentication settings
    auth: {
      jwtExpiry: '30d', // Longer expiry for mobile apps
      refreshTokenExpiry: '90d',
      maxDevices: 2, // React Native apps typically use 2 devices max
      biometricAuth: true, // Support for biometric authentication
      autoRefresh: true, // Auto refresh tokens
    },
    
    // React Native push notifications
    pushNotifications: {
      enabled: true,
      providers: ['fcm', 'apns'], // Firebase Cloud Messaging & Apple Push Notification Service
      retryAttempts: 3,
      batchSize: 100,
    },
    
    // React Native offline support
    offline: {
      enabled: true,
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      queueSize: 100,
    },
    
    // React Native performance settings
    performance: {
      compression: true,
      caching: true,
      cacheDuration: 600, // 10 minutes
      imageOptimization: true,
      lazyLoading: true,
    },
    
    // React Native debugging
    debugging: {
      enabled: process.env.NODE_ENV === 'development',
      logLevel: 'info',
      enableMetrics: true,
      enableCrashReporting: true,
    }
  },
  
  // React Native specific API endpoints
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      verify: '/api/auth/verify',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password',
    },
    profile: {
      get: '/api/profile',
      update: '/api/profile',
      avatar: '/api/profile/avatar',
      deleteAvatar: '/api/profile/avatar',
    },
    posts: {
      list: '/api/posts',
      create: '/api/posts',
      update: '/api/posts',
      delete: '/api/posts',
      like: '/api/like',
      comment: '/api/comment',
    }
  },
  
  // React Native error codes
  errorCodes: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    OFFLINE_ERROR: 'OFFLINE_ERROR',
  }
}; 