const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import services
const { databaseService } = require('./services/database');
const { configService } = require('./services/config');
const { loggerService } = require('./services/logger');
const { authMiddleware } = require('./middleware/auth');
const { swaggerService } = require('./swagger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const brandRoutes = require('./routes/brands');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');
const couponRoutes = require('./routes/coupons');
const routeIndex = require('./routes/index');

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use(authMiddleware.requestId());

// Authentication middleware (optional)
app.use('/api/v1/auth', authMiddleware.optional());

// Rate limiting
app.use(authMiddleware.rateLimit());

// API routes
app.use('/api', routeIndex);

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
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: healthStatus.database,
      environment: configService.get('NODE_ENV')
    });
  } catch (error) {
    loggerService.error('Health check failed', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
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
const { errorLogger } = require('./middleware/auth');
app.use(errorLogger());

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
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
app.listen(PORT, '0.0.0.0', async () => {
  loggerService.info('Server started', {
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
});

module.exports = { app };