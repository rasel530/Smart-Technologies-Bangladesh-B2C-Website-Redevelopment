const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import services
const { databaseService } = require('./services/database');
const { configService } = require('./services/config');
const { loggerService } = require('./services/logger');
const { authMiddleware } = require('./middleware/auth');
const { swaggerService } = require('./swagger');
const { loginSecurityService } = require('./services/loginSecurityService');
const { redisConnectionPool } = require('./services/redisConnectionPool');
const { redisFallbackService } = require('./services/redisFallbackService');
const { redisStartupValidator } = require('./services/redisStartupValidator');
const { rateLimitService } = require('./services/rateLimitService');

// Import routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const oauthRoutes = require('./routes/oauth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const brandRoutes = require('./routes/brands');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');
const couponRoutes = require('./routes/coupons');
const routeIndex = require('./routes/index');
const userPreferencesRoutes = require('./routes/userPreferences');
const accountManagementRoutes = require('./routes/accountManagement');

const app = express();
const PORT = configService.get('PORT');

// Middleware
app.use(helmet());

// Enhanced CORS configuration with strict origin validation
const corsConfig = configService.getCORSConfig();
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
    'https://smarttechnologies-bd.com',
    'https://www.smarttechnologies-bd.com',
    'https://admin.smarttechnologies-bd.com'
  ]
  : process.env.NODE_ENV === 'staging'
    ? [
      'https://staging.smarttechnologies-bd.com',
      'https://admin-staging.smarttechnologies-bd.com'
    ]
    : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: corsConfig.credentials,
  methods: corsConfig.methods,
  allowedHeaders: corsConfig.allowedHeaders,
  exposedHeaders: corsConfig.exposedHeaders,
  optionsSuccessStatus: 200
}));

app.use(morgan('combined', { stream: loggerService.stream() }));

// Enhanced JSON parsing with error handling
app.use(express.json({
  limit: '10mb',
  strict: true
}));

// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'The request body contains invalid JSON',
      messageBn: 'অনুরোধ বডিতে অবৈধ JSON রয়েছে',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory with CORS and CORP headers
app.use('/uploads', (req, res, next) => {
  // Set Cross-Origin-Resource-Policy header to allow cross-origin resource loading
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  // Set Cross-Origin-Opener-Policy header
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // Set Cache-Control for images
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Request ID middleware
app.use(authMiddleware.requestId());

// Login attempt rate limiting - TEMPORARILY DISABLED FOR DEBUGGING
// app.use('/api/v1/auth/login', authMiddleware.rateLimit());

// General rate limiting
app.use(authMiddleware.rateLimit());

// API routes - Mount with /api prefix
app.use('/api', routeIndex);

// OAuth routes
app.use('/api/v1/oauth', oauthRoutes);

// Profile management routes
app.use('/api/v1/profile', profileRoutes);

// Session management routes
app.use('/api/v1/sessions', sessionRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Technologies Bangladesh B2C Website Backend API',
    version: '1.0.0',
    status: 'running',
    database: 'connected',
    services: {
      database: databaseService.getClient() ? 'connected' : 'disconnected',
      config: 'loaded',
      logger: 'active'
    }
  });
});

// Health check endpoint with database connection
app.get('/health', async (req, res) => {
  try {
    const healthStatus = await databaseService.healthCheck();
    
    // Check Redis connection status
    let redisStatus = 'disconnected';
    try {
      const { redisConnectionPool } = require('./services/redisConnectionPool');
      if (redisConnectionPool.isInitialized) {
        redisStatus = 'connected';
      }
    } catch (error) {
      loggerService.warn('Redis status check failed', error.message);
    }

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: healthStatus.database,
      redis: redisStatus,
      environment: configService.get('NODE_ENV'),
      services: {
        database: healthStatus.database === 'connected' ? 'healthy' : 'unhealthy',
        redis: redisStatus === 'connected' ? 'healthy' : 'unhealthy',
        loginSecurity: 'initialized',
        rateLimiting: 'active'
      }
    });
  } catch (error) {
    loggerService.error('Health check failed', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      redis: 'unknown',
      error: 'Health check failed'
    });
  }
});

// Enhanced health check endpoint at /api/v1/health
app.get('/api/v1/health', async (req, res) => {
  try {
    const healthStatus = await databaseService.healthCheck();
    
    // Check Redis connection status
    let redisStatus = 'disconnected';
    let redisStats = {};
    try {
      const { redisConnectionPool } = require('./services/redisConnectionPool');
      if (redisConnectionPool.isInitialized) {
        redisStatus = 'connected';
        redisStats = await redisConnectionPool.getStats();
      }
    } catch (error) {
      loggerService.warn('Redis status check failed', error.message);
    }

    // Check configuration validation
    const configValidation = configService.validateConfig();

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: configService.get('NODE_ENV'),
      services: {
        database: {
          status: healthStatus.database === 'connected' ? 'healthy' : 'unhealthy',
          connectionTime: healthStatus.connectionTime
        },
        redis: {
          status: redisStatus === 'connected' ? 'healthy' : 'unhealthy',
          stats: redisStats
        },
        loginSecurity: {
          status: 'initialized',
          features: {
            rateLimiting: 'active',
            accountLockout: 'active',
            ipBlocking: 'active',
            progressiveDelay: 'active'
          }
        },
        configuration: {
          status: configValidation.isValid ? 'valid' : 'invalid',
          errors: configValidation.errors || []
        }
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    loggerService.error('Enhanced health check failed', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const stats = await databaseService.getStats();

    res.status(200).json({
      status: 'connected',
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    loggerService.error('Database status check failed', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to retrieve database statistics',
      timestamp: new Date().toISOString()
    });
  }
});

// Rate limiting status endpoint
app.get('/api/rate-limit-status', async (req, res) => {
  try {
    const rateLimitStatus = rateLimitService.getStatus();
    const redisStatus = await redisFallbackService.checkRedisStatus();

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      rateLimit: {
        isRedisAvailable: rateLimitStatus.isRedisAvailable,
        memoryStoreSize: rateLimitStatus.memoryStoreSize,
        service: 'active'
      },
      redis: {
        isAvailable: redisStatus,
        fallbackMode: redisFallbackService.fallbackMode,
        status: redisStatus ? 'available' : 'unavailable'
      }
    });
  } catch (error) {
    loggerService.error('Rate limit status check failed', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to retrieve rate limiting status',
      timestamp: new Date().toISOString()
    });
  }
});

// Swagger documentation endpoint
app.get('/api-docs', (req, res) => {
  try {
    const swaggerSpec = swaggerService.generateSwaggerSpec();

    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  } catch (error) {
    loggerService.error('Failed to generate Swagger docs', error);
    res.status(500).json({
      error: 'Failed to generate API documentation',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use(authMiddleware.errorLogger());

// Global error handler for consistent JSON responses
app.use((err, req, res, next) => {
  // Log error details
  loggerService.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    messageBn: 'একটি অপ্রত্যাশিত ত্রুটি',
    timestamp: new Date().toISOString()
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      error: 'Validation error',
      message: err.message,
      messageBn: 'যাচাই ত্রুটি',
      timestamp: new Date().toISOString()
    };
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse = {
      error: 'Unauthorized',
      message: 'Authentication required',
      messageBn: 'প্রমাণীকরণ প্রয়োজন',
      timestamp: new Date().toISOString()
    };
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorResponse = {
      error: 'Forbidden',
      message: 'Access denied',
      messageBn: 'অ্যাক্সে অস্বীক',
      timestamp: new Date().toISOString()
    };
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorResponse = {
      error: 'Not found',
      message: 'Resource not found',
      messageBn: 'সম্পদ পাওয়া যায়নি',
      timestamp: new Date().toISOString()
    };
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    errorResponse = {
      error: 'Conflict',
      message: 'Resource conflict',
      messageBn: 'সম্পদ দ্বন্দ্ব',
      timestamp: new Date().toISOString()
    };
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = {
      name: err.name,
      message: err.message
    };
  }

  res.status(statusCode).json(errorResponse);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.originalUrl} was not found`,
    messageBn: `অনুরোধকৃত রুট ${req.method} ${req.originalUrl} পাওয়া যায়নি`,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      profile: '/api/v1/profile',
      oauth: '/api/v1/oauth',
      products: '/api/v1/products',
      categories: '/api/v1/categories',
      brands: '/api/v1/brands',
      orders: '/api/v1/orders',
      cart: '/api/v1/cart',
      wishlist: '/api/v1/wishlist',
      reviews: '/api/v1/reviews',
      coupons: '/api/v1/coupons',
      user: '/api/v1/user',
      sessions: '/api/v1/sessions',
      health: '/api/v1/health',
      docs: '/api-docs'
    }
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  loggerService.info('Server shutdown initiated', { signal: 'SIGINT' });
  await databaseService.disconnect();
  loggerService.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  loggerService.info('Server shutdown initiated', { signal: 'SIGTERM' });
  await databaseService.disconnect();
  loggerService.cleanup();
  process.exit(0);
});

// Start server
loggerService.info('🚀 Attempting to start server on port', PORT);
const server = app.listen(PORT, '0.0.0.0', async () => {
  loggerService.info('✅ Server started successfully', {
    port: PORT,
    environment: configService.get('NODE_ENV'),
    database: 'configured',
    timestamp: new Date().toISOString()
  });

  // Test database connection on startup
  try {
    await databaseService.connect();
    loggerService.info('Database connection established successfully');
  } catch (error) {
    loggerService.error('Database connection failed on startup', error);
  }

  // Redis startup validation
  loggerService.info('🔄 Starting Redis connectivity validation...');
  try {
    const redisValidationResult = await redisStartupValidator.validateRedisStartup();
    if (redisValidationResult) {
      loggerService.info('✅ Redis connectivity validation passed');
    } else {
      loggerService.warn('⚠️ Redis connectivity validation failed, but continuing with fallback');
    }
  } catch (error) {
    loggerService.error('❌ Redis startup validation failed', {
      error: error.message,
      stack: error.stack
    });
  }

  // Initialize Redis fallback service
  loggerService.info('🔄 Starting Redis fallback service initialization...');
  try {
    loggerService.info('📊 Redis connection pool status:', {
      isInitialized: redisConnectionPool.isInitialized,
      poolSize: redisConnectionPool.getPoolSize ? redisConnectionPool.getPoolSize() : 'unknown'
    });
    await redisFallbackService.initialize(redisConnectionPool);
    loggerService.info('✅ Redis fallback service initialized successfully');
  } catch (error) {
    loggerService.error('❌ Redis fallback service initialization failed', {
      error: error.message,
      stack: error.stack
    });
  }

  // Initialize rate limiting service
  loggerService.info('🔄 Starting rate limiting service initialization...');
  try {
    await rateLimitService.initializeRedis();
    loggerService.info('✅ Rate limiting service initialized successfully');
  } catch (error) {
    loggerService.error('❌ Rate limiting service initialization failed', {
      error: error.message,
      stack: error.stack
    });
  }

  // Initialize login security service
  loggerService.info('🔄 Starting login security service initialization...');
  try {
    await loginSecurityService.initialize();
    loggerService.info('✅ Login security service initialized successfully');
  } catch (error) {
    loggerService.error('❌ Login security service initialization failed', {
      error: error.message,
      stack: error.stack
    });
  }

  // Schedule cleanup tasks (every hour)
  scheduleSessionCleanup();
  scheduleSecurityCleanup();
  
  // Increase server timeout for login operations
  server.setTimeout(30000); // 30 seconds
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  
  loggerService.info('Server timeout configured', {
    timeout: 30000,
    keepAliveTimeout: 65000,
    headersTimeout: 66000
  });
});

// Session cleanup scheduling
function scheduleSessionCleanup() {
  const { sessionService } = require('./services/sessionService');

  // Run cleanup every hour
  setInterval(async () => {
    try {
      await sessionService.cleanupExpiredSessions();
      loggerService.info('Scheduled session cleanup completed');
    } catch (error) {
      loggerService.error('Scheduled session cleanup failed', error.message);
    }
  }, 60 * 60 * 1000); // 1 hour

  // Run initial cleanup after 5 minutes
  setTimeout(async () => {
    try {
      await sessionService.cleanupExpiredSessions();
      loggerService.info('Initial session cleanup completed');
    } catch (error) {
      loggerService.error('Initial session cleanup failed', error.message);
    }
  }, 5 * 60 * 1000); // 5 minutes
}

// Security cleanup scheduling
function scheduleSecurityCleanup() {
  // Run security cleanup every hour
  setInterval(async () => {
    try {
      await loginSecurityService.cleanupExpiredData();
      loggerService.info('Scheduled security cleanup completed');
    } catch (error) {
      loggerService.error('Scheduled security cleanup failed', error.message);
    }
  }, 60 * 60 * 1000); // 1 hour

  // Run initial security cleanup after 10 minutes
  setTimeout(async () => {
    try {
      await loginSecurityService.cleanupExpiredData();
      loggerService.info('Initial security cleanup completed');
    } catch (error) {
      loggerService.error('Initial security cleanup failed', error.message);
    }
  }, 10 * 60 * 1000); // 10 minutes
}

module.exports = { app };