require('dotenv').config();

// Core & third-party imports
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const http = require('http');
const socketIo = require('socket.io');

// Local imports
const { connectDB } = require('./config/db');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const followRoutes = require('./routes/followRoutes');
const postsRoutes = require('./routes/postsRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Create HTTP server and attach socket.io
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });
app.set('io', io);

// React Native config (inline for now)
const reactNativeConfig = {
  reactNative: {
    app: {
      name: 'TLS Mobile App',
      version: '1.0.0',
      platforms: ['ios', 'android'],
    },
    upload: { maxFileSize: 5 * 1024 * 1024 },
    auth: { maxDevices: 2 },
    performance: { cacheDuration: 600 },
    offline: { enabled: true },
    pushNotifications: { enabled: true }
  },
  endpoints: {
    auth: { login: '/api/auth/login', register: '/api/auth/register' },
    profile: { get: '/api/profile' },
    posts: { list: '/api/posts' }
  },
  errorCodes: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    OFFLINE_ERROR: 'OFFLINE_ERROR',
  }
};

// Connect to MongoDB
connectDB();

// Security & performance middleware
app.use(helmet());
app.use(compression());
app.use(cors()); // Allow all origins
app.use(express.json({ limit: reactNativeConfig.reactNative.upload.maxFileSize }));
app.use(express.urlencoded({ extended: true, limit: reactNativeConfig.reactNative.upload.maxFileSize }));

// Rate limiting
const limiter = rateLimit({
  windowMs: reactNativeConfig.reactNative.performance.cacheDuration * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: reactNativeConfig.errorCodes.NETWORK_ERROR
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auth-specific rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: reactNativeConfig.reactNative.auth.maxDevices,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    code: reactNativeConfig.errorCodes.AUTH_ERROR
  },
  skipSuccessfulRequests: true,
});

// Minimal request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat', chatRoutes);

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Server Connected Successfully',
    version: reactNativeConfig.reactNative.app.version,
    timestamp: new Date().toISOString(),
    reactNative: {
      app: reactNativeConfig.reactNative.app.name,
      endpoints: reactNativeConfig.endpoints
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: reactNativeConfig.errorCodes.NETWORK_ERROR,
    timestamp: new Date().toISOString(),
    availableEndpoints: reactNativeConfig.endpoints
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  socket.on('join', (userId) => {
    socket.join(userId);
  });
  socket.on('send_message', (data) => {
    io.to(data.recipient).emit('receive_message', data);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 React Native API ready for ${reactNativeConfig.reactNative.app.name}`);
  console.log(`📱 Supported platforms: ${reactNativeConfig.reactNative.app.platforms.join(', ')}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Offline support: ${reactNativeConfig.reactNative.offline.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`🔔 Push notifications: ${reactNativeConfig.reactNative.pushNotifications.enabled ? 'Enabled' : 'Disabled'}`);
});

module.exports = { io, server };
