const express = require('express');
const { configService } = require('./services/config');
const { redisConnectionPool } = require('./services/redisConnectionPool');
const { redisFallbackService } = require('./services/redisFallbackService');
const { sessionService } = require('./services/sessionService');
const { loginSecurityService } = require('./services/loginSecurityService');
const { loggerService } = require('./services/logger');

// Create a simple Express app for testing
const app = express();
app.use(express.json());

// Test endpoint to diagnose authentication issues
app.get('/auth-diagnostic', async (req, res) => {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    testingMode: process.env.TESTING_MODE,
    emailVerificationDisabled: process.env.DISABLE_EMAIL_VERIFICATION,
    phoneVerificationDisabled: process.env.DISABLE_PHONE_VERIFICATION,
    configIssues: [],
    redisStatus: {},
    serviceStatus: {},
    routingIssues: []
  };

  // Check configuration issues
  try {
    // Check JWT secret configuration
    const jwtSecret = process.env.JWT_SECRET;
    const postgresJwtSecret = process.env.POSTGRES_JWT_SECRET;

    if (!jwtSecret) {
      diagnostic.configIssues.push('JWT_SECRET environment variable is missing');
    }

    if (jwtSecret !== postgresJwtSecret) {
      diagnostic.configIssues.push('JWT_SECRET and POSTGRES_JWT_SECRET have different values');
    }

    // Check database URL configuration
    const databaseUrl = process.env.DATABASE_URL;
    const postgresDatabaseUrl = process.env.POSTGRES_DATABASE_URL;

    if (!databaseUrl) {
      diagnostic.configIssues.push('DATABASE_URL environment variable is missing');
    }

    if (postgresDatabaseUrl && databaseUrl !== postgresDatabaseUrl) {
      diagnostic.configIssues.push('DATABASE_URL and POSTGRES_DATABASE_URL have different values');
    }

    // Check testing mode helper methods
    if (typeof configService.isTestingMode !== 'function') {
      diagnostic.configIssues.push('configService.isTestingMode() method is missing');
    }

    if (typeof configService.isEmailVerificationDisabled !== 'function') {
      diagnostic.configIssues.push('configService.isEmailVerificationDisabled() method is missing');
    }

    if (typeof configService.isPhoneVerificationDisabled !== 'function') {
      diagnostic.configIssues.push('configService.isPhoneVerificationDisabled() method is missing');
    }

  } catch (error) {
    diagnostic.configIssues.push(`Configuration check error: ${error.message}`);
  }

  // Check Redis connection
  try {
    await redisConnectionPool.initialize();
    const redisClient = redisConnectionPool.getClient('diagnostic');

    if (redisClient) {
      const pingResult = await redisClient.ping();
      diagnostic.redisStatus = {
        connected: true,
        pingResult,
        clientAvailable: true
      };
    } else {
      diagnostic.redisStatus = {
        connected: false,
        error: 'Failed to get Redis client',
        clientAvailable: false
      };
    }
  } catch (error) {
    diagnostic.redisStatus = {
      connected: false,
      error: error.message,
      clientAvailable: false
    };
  }

  // Check Redis fallback service
  try {
    const fallbackStatus = redisFallbackService.getStatus();
    diagnostic.redisFallbackStatus = fallbackStatus;

    const fallbackClient = redisFallbackService.getClient('diagnostic');
    if (fallbackClient) {
      const testResult = await fallbackClient.setEx('test-key', 60, 'test-value');
      const retrievedValue = await fallbackClient.get('test-key');
      diagnostic.redisFallbackStatus.testResult = {
        setSuccess: testResult === 'OK',
        getSuccess: retrievedValue === 'test-value',
        working: testResult === 'OK' && retrievedValue === 'test-value'
      };
    }
  } catch (error) {
    diagnostic.redisFallbackStatus = {
      error: error.message,
      working: false
    };
  }

  // Check service initialization
  try {
    // Check if loginSecurityService has initialize method
    if (typeof loginSecurityService.initialize !== 'function') {
      diagnostic.serviceStatus.loginSecurity = {
        initialized: false,
        error: 'initialize method is missing'
      };
    } else {
      try {
        await loginSecurityService.initialize();
        diagnostic.serviceStatus.loginSecurity = {
          initialized: true,
          redisAvailable: !!loginSecurityService.redis
        };
      } catch (initError) {
        diagnostic.serviceStatus.loginSecurity = {
          initialized: false,
          error: initError.message
        };
      }
    }

    // Check session service
    if (typeof sessionService.createSession === 'function') {
      diagnostic.serviceStatus.sessionService = {
        available: true
      };
    } else {
      diagnostic.serviceStatus.sessionService = {
        available: false,
        error: 'createSession method is missing'
      };
    }
  } catch (error) {
    diagnostic.serviceStatus.error = error.message;
  }

  // Check routing structure
  try {
    // This would be checked by examining the main server file
    // For now, we'll note potential issues
    diagnostic.routingIssues.push('Need to verify route mounting in main server file');
    diagnostic.routingIssues.push('Check for double /api prefix issue');
  } catch (error) {
    diagnostic.routingIssues.push(`Routing check error: ${error.message}`);
  }

  res.json({
    diagnostic,
    summary: {
      criticalIssues: [
        ...diagnostic.configIssues,
        ...(diagnostic.redisStatus.connected ? [] : ['Redis connection failed']),
        ...(diagnostic.serviceStatus.loginSecurity?.initialized ? [] : ['Login security service initialization failed'])
      ],
      warnings: [
        ...(diagnostic.redisFallbackStatus.fallbackMode ? ['Using Redis fallback mode'] : [])
      ]
    }
  });
});

// Test endpoint to simulate authentication flow
app.post('/auth-diagnostic/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Test basic validation
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Identifier and password are required'
      });
    }

    // Test Redis operations
    const redisTest = {};
    try {
      const fallbackClient = redisFallbackService.getClient('login-test');
      await fallbackClient.setEx(`login_test:${Date.now()}`, 60, 'test');
      redisTest.redisWrite = true;

      const testValue = await fallbackClient.get(`login_test:${Date.now()}`);
      redisTest.redisRead = testValue === 'test';
    } catch (error) {
      redisTest.error = error.message;
    }

    // Test database connection (simplified)
    const dbTest = {};
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      dbTest.connected = true;
      await prisma.$disconnect();
    } catch (error) {
      dbTest.error = error.message;
      dbTest.connected = false;
    }

    res.json({
      success: true,
      tests: {
        redis: redisTest,
        database: dbTest,
        config: {
          jwtSecret: !!process.env.JWT_SECRET,
          testingMode: process.env.TESTING_MODE === 'true'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Diagnostic login test failed',
      message: error.message
    });
  }
});

const PORT = process.env.DIAGNOSTIC_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Authentication diagnostic server running on port ${PORT}`);
  console.log(`Access http://localhost:${PORT}/auth-diagnostic for full diagnostic`);
  console.log(`Test POST to http://localhost:${PORT}/auth-diagnostic/login to test authentication flow`);
});

module.exports = app;