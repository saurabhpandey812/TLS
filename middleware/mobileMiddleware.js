/**
 * Mobile-specific middleware for React Native applications
 */

const { errorResponse, ERROR_CODES } = require('../utils/mobileResponse');
const reactNativeConfig = require('../config/react-native');

/**
 * Middleware to extract and validate mobile app headers
 */
const mobileHeaders = (req, res, next) => {
  // Extract React Native specific headers
  req.mobileInfo = {
    platform: req.get('X-Platform') || 'unknown', // ios, android, web
    appVersion: req.get('X-App-Version') || reactNativeConfig.reactNative.app.version,
    deviceId: req.get('X-Device-ID') || 'unknown',
    deviceModel: req.get('X-Device-Model') || 'unknown',
    osVersion: req.get('X-OS-Version') || 'unknown',
    screenWidth: req.get('X-Screen-Width') || null,
    screenHeight: req.get('X-Screen-Height') || null,
    networkType: req.get('X-Network-Type') || 'unknown', // wifi, cellular, none
    timezone: req.get('X-Timezone') || 'UTC',
    isReactNative: req.get('X-React-Native') === 'true'
  };

  // Validate required headers for React Native apps
  if (req.mobileInfo.platform === 'unknown' && req.path.startsWith('/api/')) {
    console.warn('React Native app headers not detected for API request:', req.path);
  }

  // Log React Native specific requests
  if (req.mobileInfo.isReactNative) {
    console.log(`📱 React Native Request: ${req.method} ${req.path} - ${req.mobileInfo.platform} v${req.mobileInfo.appVersion}`);
  }

  next();
};

/**
 * Middleware to handle mobile-specific error responses
 */
const mobileErrorHandler = (err, req, res, next) => {
  // Log mobile-specific error information
  if (req.mobileInfo) {
    console.error('Mobile Error:', {
      platform: req.mobileInfo.platform,
      appVersion: req.mobileInfo.appVersion,
      deviceId: req.mobileInfo.deviceId,
      path: req.path,
      method: req.method,
      error: err.message
    });
  }

  // Handle specific React Native errors
  if (err.name === 'ValidationError') {
    return res.status(400).json(errorResponse(
      'Validation failed',
      reactNativeConfig.errorCodes.VALIDATION_ERROR,
      400,
      { fields: Object.keys(err.errors) }
    ));
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse(
      'Invalid token',
      reactNativeConfig.errorCodes.AUTH_ERROR,
      401
    ));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse(
      'Token expired',
      reactNativeConfig.errorCodes.AUTH_ERROR,
      401
    ));
  }

  if (err.code === 11000) { // MongoDB duplicate key error
    return res.status(409).json(errorResponse(
      'Resource already exists',
      reactNativeConfig.errorCodes.VALIDATION_ERROR,
      409
    ));
  }

  // Default error response
  next(err);
};

/**
 * Middleware to optimize responses for mobile apps
 */
const mobileResponseOptimizer = (req, res, next) => {
  // Store original send method
  const originalSend = res.send;

  // Override send method to optimize for mobile
  res.send = function(data) {
    // If it's a JSON response, optimize it for mobile
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        data = optimizeForMobile(parsed, req.mobileInfo);
      } catch (e) {
        // Not JSON, send as is
      }
    } else if (typeof data === 'object') {
      data = optimizeForMobile(data, req.mobileInfo);
    }

    // Add mobile-specific headers
    res.set('X-API-Version', process.env.APP_VERSION || '1.0.0');
    res.set('X-Response-Time', Date.now() - req.startTime + 'ms');

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Optimize response data for mobile apps
 */
const optimizeForMobile = (data, mobileInfo) => {
  if (!data || typeof data !== 'object') return data;

  // Remove sensitive fields for mobile
  const sensitiveFields = ['password', 'otp', 'otpExpires', '__v'];
  
  const cleanData = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => cleanData(item));
    }
    
    if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (!sensitiveFields.includes(key)) {
          cleaned[key] = cleanData(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  };

  return cleanData(data);
};

/**
 * Middleware to handle mobile file uploads
 */
const mobileFileUpload = (req, res, next) => {
  // Check if request is from React Native app
  const isReactNative = req.mobileInfo && req.mobileInfo.isReactNative;
  
  if (isReactNative && req.files) {
    // Optimize file handling for React Native
    req.mobileFiles = req.files.map(file => ({
      ...file,
      optimized: true,
      originalSize: file.size,
      maxSize: reactNativeConfig.reactNative.upload.maxFileSize,
      allowedTypes: reactNativeConfig.reactNative.upload.allowedTypes,
      quality: reactNativeConfig.reactNative.upload.quality
    }));
  }

  next();
};

/**
 * Middleware to track mobile app usage
 */
const mobileAnalytics = (req, res, next) => {
  req.startTime = Date.now();
  
  // Track React Native app usage
  if (req.mobileInfo && req.mobileInfo.isReactNative) {
    console.log(`📱 React Native Request: ${req.method} ${req.path} - ${req.mobileInfo.platform} v${req.mobileInfo.appVersion}`);
  }

  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (req.mobileInfo && req.mobileInfo.isReactNative) {
      console.log(`📱 React Native Response: ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
};

/**
 * Middleware to handle mobile network conditions
 */
const mobileNetworkOptimizer = (req, res, next) => {
  const networkType = req.mobileInfo?.networkType;
  
  if (networkType === 'cellular' && req.mobileInfo?.isReactNative) {
    // Optimize for slower networks in React Native
    req.mobileOptimizations = {
      compressImages: reactNativeConfig.reactNative.performance.imageOptimization,
      reduceDataUsage: true,
      cacheResponses: reactNativeConfig.reactNative.performance.caching,
      cacheDuration: reactNativeConfig.reactNative.performance.cacheDuration
    };
  }

  next();
};

module.exports = {
  mobileHeaders,
  mobileErrorHandler,
  mobileResponseOptimizer,
  mobileFileUpload,
  mobileAnalytics,
  mobileNetworkOptimizer
}; 