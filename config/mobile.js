/**
 * Mobile-specific configuration for React Native applications
 * This file is now deprecated in favor of config/react-native.js
 * Please use the React Native configuration file for new features
 */
const reactNativeConfig = require('./react-native');

const mobileConfig = {
  // API Configuration
  api: {
    version: process.env.APP_VERSION || '1.0.0',
    timeout: 30000, // 30 seconds for mobile networks
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB for mobile
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/mov', 'video/avi'],
    imageCompression: {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080
    },
    videoCompression: {
      maxDuration: 60, // 60 seconds
      maxBitrate: 2000000 // 2Mbps
    }
  },

  // Authentication Configuration
  auth: {
    tokenExpiry: '7d', // 7 days for mobile apps
    refreshTokenExpiry: '30d', // 30 days
    otpExpiry: 10 * 60 * 1000, // 10 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Push Notifications Configuration
  pushNotifications: {
    enabled: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
    providers: {
      fcm: {
        enabled: true,
        serverKey: process.env.FCM_SERVER_KEY
      },
      apns: {
        enabled: true,
        keyId: process.env.APNS_KEY_ID,
        teamId: process.env.APNS_TEAM_ID,
        privateKey: process.env.APNS_PRIVATE_KEY
      }
    }
  },

  // Caching Configuration
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100 // Maximum number of cached items
  },

  // Rate Limiting Configuration
  rateLimit: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // requests per window
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // auth requests per window
    },
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10 // uploads per hour
    }
  },

  // Mobile-specific features
  features: {
    offlineSupport: true,
    backgroundSync: true,
    imageOptimization: true,
    videoCompression: true,
    locationServices: process.env.LOCATION_SERVICES_ENABLED === 'true',
    analytics: process.env.ANALYTICS_ENABLED === 'true'
  },

  // Network Configuration
  network: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    compression: true,
    keepAlive: true
  },

  // Security Configuration
  security: {
    requireDeviceId: false, // Set to true to require device ID for all requests
    validateAppVersion: false, // Set to true to validate app version
    maxDevicesPerUser: 5, // Maximum number of devices per user
    sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
  },

  // Development Configuration
  development: {
    debugMode: process.env.NODE_ENV === 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMockData: process.env.ENABLE_MOCK_DATA === 'true'
  }
};

// Platform-specific configurations
const platformConfigs = {
  ios: {
    ...mobileConfig,
    upload: {
      ...mobileConfig.upload,
      maxFileSize: 15 * 1024 * 1024, // 15MB for iOS
      imageCompression: {
        ...mobileConfig.upload.imageCompression,
        quality: 0.9 // Higher quality for iOS
      }
    }
  },
  android: {
    ...mobileConfig,
    upload: {
      ...mobileConfig.upload,
      maxFileSize: 8 * 1024 * 1024, // 8MB for Android
      imageCompression: {
        ...mobileConfig.upload.imageCompression,
        quality: 0.7 // Lower quality for Android to save bandwidth
      }
    }
  }
};

/**
 * Get configuration for specific platform
 * @param {string} platform - Platform name (ios, android, web)
 * @returns {Object} - Platform-specific configuration
 */
const getPlatformConfig = (platform) => {
  return platformConfigs[platform] || mobileConfig;
};

/**
 * Validate mobile app version
 * @param {string} appVersion - App version from mobile app
 * @returns {boolean} - Whether version is supported
 */
const validateAppVersion = (appVersion) => {
  if (!mobileConfig.security.validateAppVersion) {
    return true;
  }

  const minVersion = process.env.MIN_APP_VERSION || '1.0.0';
  const currentVersion = process.env.APP_VERSION || '1.0.0';

  // Simple version comparison (you might want to use a proper semver library)
  const parseVersion = (version) => {
    return version.split('.').map(Number);
  };

  const appVersionParts = parseVersion(appVersion);
  const minVersionParts = parseVersion(minVersion);

  for (let i = 0; i < Math.max(appVersionParts.length, minVersionParts.length); i++) {
    const appPart = appVersionParts[i] || 0;
    const minPart = minVersionParts[i] || 0;
    
    if (appPart < minPart) return false;
    if (appPart > minPart) return true;
  }

  return true;
};

module.exports = {
  mobileConfig: reactNativeConfig.reactNative,
  platformConfigs: {
    ios: reactNativeConfig.reactNative,
    android: reactNativeConfig.reactNative,
    web: reactNativeConfig.reactNative
  },
  getPlatformConfig: (platform) => reactNativeConfig.reactNative,
  validateAppVersion: (appVersion) => {
    // Simple version validation for backward compatibility
    return appVersion >= reactNativeConfig.reactNative.app.version;
  }
}; 