require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const postRoutes = require('./routes/postRoutes');
const followRoutes = require('./routes/followRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Mobile middleware
const {
  mobileHeaders,
  mobileErrorHandler,
  mobileResponseOptimizer,
  mobileFileUpload,
  mobileAnalytics,
  mobileNetworkOptimizer
} = require('./middleware/mobileMiddleware');

// React Native configuration - simplified for debugging
const reactNativeConfig = {
  reactNative: {
    app: {
      name: 'TLS Mobile App',
      version: '1.0.0',
      platforms: ['ios', 'android'],
    },
    corsOrigins: [
      'http://localhost:8081',
      'http://localhost:3000',
      'http://10.0.2.2:8000',
      'http://10.0.3.2:8000',
      'http://localhost:8000',
      'http://192.168.1.100:8000',
    ],
    upload: {
      maxFileSize: 5 * 1024 * 1024,
    },
    auth: {
      maxDevices: 2,
    },
    performance: {
      cacheDuration: 600,
    },
    offline: {
      enabled: true,
    },
    pushNotifications: {
      enabled: true,
    }
  },
  endpoints: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
    },
    profile: {
      get: '/api/profile',
    },
    posts: {
      list: '/api/posts',
    }
  },
  errorCodes: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    OFFLINE_ERROR: 'OFFLINE_ERROR',
  }
};

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Compression middleware for mobile optimization
app.use(compression());

// Enhanced CORS configuration for React Native apps
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      ...reactNativeConfig.reactNative.corsOrigins,
      process.env.FRONTEND_URL,
      process.env.MOBILE_APP_URL,
      'https://tls-maf3.onrender.com' // Added Render domain for CORS
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Device-ID',
    'X-App-Version',
    'X-Platform', // For identifying iOS/Android
    'X-React-Native' // React Native specific header
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-API-Version', 'X-Response-Time']
};

app.use(cors(corsOptions));

// Mobile middleware - temporarily disabled for debugging
// app.use(mobileHeaders);
// app.use(mobileAnalytics);
// app.use(mobileNetworkOptimizer);
// app.use(mobileResponseOptimizer);
// app.use(mobileFileUpload);

// Rate limiting for React Native apps
const limiter = rateLimit({
  windowMs: reactNativeConfig.reactNative.performance.cacheDuration * 1000, // Use cache duration as window
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    code: reactNativeConfig.errorCodes.NETWORK_ERROR
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// React Native specific rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: reactNativeConfig.reactNative.auth.maxDevices, // Use max devices as limit
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    code: reactNativeConfig.errorCodes.AUTH_ERROR
  },
  skipSuccessfulRequests: true,
});

app.use(express.json({ limit: reactNativeConfig.reactNative.upload.maxFileSize })); // React Native file upload limit
app.use(express.urlencoded({ extended: true, limit: reactNativeConfig.reactNative.upload.maxFileSize }));

// Mobile request logging middleware
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const platform = req.get('X-Platform') || 'unknown';
  const appVersion = req.get('X-App-Version') || 'unknown';
  const deviceId = req.get('X-Device-ID') || 'unknown';
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Platform: ${platform}, Version: ${appVersion}, Device: ${deviceId}`);
  next();
});

// Mobile-specific error handler - temporarily disabled for debugging
// app.use(mobileErrorHandler);

// Global error handler for mobile apps
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  // Mobile-optimized error response
  const errorResponse = {
    success: false,
    message: err.message || 'Something went wrong',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };
  
  // Add stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint for React Native apps
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    version: reactNativeConfig.reactNative.app.version,
    environment: process.env.NODE_ENV || 'development',
    reactNative: {
      app: reactNativeConfig.reactNative.app.name,
      platforms: reactNativeConfig.reactNative.app.platforms,
      offlineSupport: reactNativeConfig.reactNative.offline.enabled,
      pushNotifications: reactNativeConfig.reactNative.pushNotifications.enabled
    }
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/like', likeRoutes);
app.use('/api/comment', commentRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "Server Connected Successfully",
    version: reactNativeConfig.reactNative.app.version,
    timestamp: new Date().toISOString(),
    reactNative: {
      app: reactNativeConfig.reactNative.app.name,
      endpoints: {
        auth: reactNativeConfig.endpoints.auth,
        profile: reactNativeConfig.endpoints.profile,
        posts: reactNativeConfig.endpoints.posts
      }
    }
  });
});

// 404 handler for React Native apps
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: reactNativeConfig.errorCodes.NETWORK_ERROR,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      auth: reactNativeConfig.endpoints.auth,
      profile: reactNativeConfig.endpoints.profile,
      posts: reactNativeConfig.endpoints.posts
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 React Native API ready for ${reactNativeConfig.reactNative.app.name}`);
  console.log(`📱 Supported platforms: ${reactNativeConfig.reactNative.app.platforms.join(', ')}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Offline support: ${reactNativeConfig.reactNative.offline.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`🔔 Push notifications: ${reactNativeConfig.reactNative.pushNotifications.enabled ? 'Enabled' : 'Disabled'}`);
});