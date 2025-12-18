const { AuthMiddleware } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const assert = require('assert');

// Test Authentication Security Improvements (JWT, Rate Limiting, Token Blacklist)
class AuthSecurityTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.authMiddleware = null;
    this.mockRedis = null;
  }

  async runAllTests() {
    console.log('🧪 Starting Authentication Security Tests...\n');
    
    await this.setupMockRedis();
    await this.testValidJWTAuthentication();
    await this.testInvalidJWTToken();
    await this.testExpiredJWTToken();
    await this.testTokenBlacklist();
    await this.testRateLimiting();
    await this.testIPReputation();
    await this.testRoleBasedAuthorization();
    await this.testAPIKeyValidation();
    await this.testSessionValidation();
    await this.testSecurityLogging();
    
    this.generateTestReport();
  }

  async setupMockRedis() {
    // Mock Redis for testing
    this.mockRedis = {
      data: {},
      connect: jest.fn().mockResolvedValue(true),
      on: jest.fn(),
      get: jest.fn((key) => Promise.resolve(this.mockRedis.data[key] || null)),
      setEx: jest.fn((key, ttl, value) => {
        this.mockRedis.data[key] = value;
        return Promise.resolve('OK');
      }),
      del: jest.fn((key) => {
        delete this.mockRedis.data[key];
        return Promise.resolve(1);
      }),
      hGetAll: jest.fn((key) => Promise.resolve(this.mockRedis.data[key] || {})),
      hIncrBy: jest.fn((key, field, increment) => {
        if (!this.mockRedis.data[key]) this.mockRedis.data[key] = {};
        this.mockRedis.data[key][field] = (parseInt(this.mockRedis.data[key][field] || 0) + increment).toString();
        return Promise.resolve(this.mockRedis.data[key][field]);
      }),
      hSet: jest.fn((key, field, value) => {
        if (!this.mockRedis.data[key]) this.mockRedis.data[key] = {};
        this.mockRedis.data[key][field] = value;
        return Promise.resolve(1);
      }),
      expire: jest.fn((key, ttl) => Promise.resolve(1)),
      multi: jest.fn(() => ({
        zRemRangeByScore: jest.fn().mockReturnThis(),
        zAdd: jest.fn().mockReturnThis(),
        zCard: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ reply: 1 }, { reply: 1 }, { reply: 1 }])
      }))
    };

    // Mock Redis module
    jest.mock('redis', () => ({
      createClient: jest.fn(() => this.mockRedis)
    }));

    // Mock config service
    jest.mock('../services/config', () => ({
      configService: {
        get: jest.fn((key) => {
          const config = {
            'REDIS_URL': 'redis://localhost:6379',
            'NODE_ENV': 'test'
          };
          return config[key];
        }),
        getJWTConfig: jest.fn(() => ({
          secret: 'test-jwt-secret',
          algorithm: 'HS256',
          issuer: 'smart-technologies-bd'
        })),
        isProduction: jest.fn(() => false)
      }
    }));

    // Mock logger service
    jest.mock('../services/logger', () => ({
      loggerService: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        logSecurity: jest.fn(),
        logAuth: jest.fn()
      }
    }));

    this.authMiddleware = new AuthMiddleware();
    await this.authMiddleware.initializeRedis();
  }

  async testValidJWTAuthentication() {
    this.testResults.total++;
    console.log('🔍 Test 1: Valid JWT Authentication');
    
    try {
      // Create a valid JWT token
      const validToken = jwt.sign(
        { userId: 'user123', role: 'CUSTOMER', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { algorithm: 'HS256', issuer: 'smart-technologies-bd' }
      );

      const mockReq = {
        headers: { authorization: `Bearer ${validToken}` },
        ip: '192.168.1.1',
        originalUrl: '/api/v1/products',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const authMiddleware = this.authMiddleware.authenticate();
      await authMiddleware(mockReq, mockRes, mockNext);

      assert(mockNext.called, 'Next should be called for valid token');
      assert(mockReq.user.userId === 'user123', 'User ID should be set');
      assert(mockReq.userRole === 'CUSTOMER', 'User role should be set');
      assert(mockReq.token === validToken, 'Token should be set');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Valid JWT Authentication',
        status: 'PASSED',
        message: 'Valid JWT token authenticated successfully'
      });
      
      console.log('✅ PASSED: Valid JWT authentication working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Valid JWT Authentication',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testInvalidJWTToken() {
    this.testResults.total++;
    console.log('🔍 Test 2: Invalid JWT Token');
    
    try {
      const mockReq = {
        headers: { authorization: 'Bearer invalid-token' },
        ip: '192.168.1.1',
        originalUrl: '/api/v1/products',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const authMiddleware = this.authMiddleware.authenticate();
      await authMiddleware(mockReq, mockRes, mockNext);

      assert(!mockNext.called, 'Next should not be called for invalid token');
      assert(mockRes.status.calledWith(401), 'Should return 401 status');
      assert(mockRes.json.called, 'Should return error response');
      
      const errorResponse = mockRes.json.mock.calls[0][0];
      assert(errorResponse.error === 'Authentication failed', 'Should return authentication error');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Invalid JWT Token',
        status: 'PASSED',
        message: 'Invalid JWT token properly rejected'
      });
      
      console.log('✅ PASSED: Invalid JWT token rejection working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Invalid JWT Token',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testExpiredJWTToken() {
    this.testResults.total++;
    console.log('🔍 Test 3: Expired JWT Token');
    
    try {
      // Create an expired JWT token
      const expiredToken = jwt.sign(
        { userId: 'user123', role: 'CUSTOMER', iat: Math.floor(Date.now() / 1000) - 7200, exp: Math.floor(Date.now() / 1000) - 3600 },
        'test-jwt-secret',
        { algorithm: 'HS256', issuer: 'smart-technologies-bd' }
      );

      const mockReq = {
        headers: { authorization: `Bearer ${expiredToken}` },
        ip: '192.168.1.1',
        originalUrl: '/api/v1/products',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const authMiddleware = this.authMiddleware.authenticate();
      await authMiddleware(mockReq, mockRes, mockNext);

      assert(!mockNext.called, 'Next should not be called for expired token');
      assert(mockRes.status.calledWith(401), 'Should return 401 status');
      
      const errorResponse = mockRes.json.mock.calls[0][0];
      assert(errorResponse.error === 'Authentication failed', 'Should return authentication error');
      assert(errorResponse.message === 'Token has expired', 'Should specify token expired');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Expired JWT Token',
        status: 'PASSED',
        message: 'Expired JWT token properly rejected'
      });
      
      console.log('✅ PASSED: Expired JWT token rejection working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Expired JWT Token',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testTokenBlacklist() {
    this.testResults.total++;
    console.log('🔍 Test 4: Token Blacklist');
    
    try {
      // Create a valid JWT token
      const validToken = jwt.sign(
        { userId: 'user123', role: 'CUSTOMER', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { algorithm: 'HS256', issuer: 'smart-technologies-bd' }
      );

      // Blacklist the token
      await this.authMiddleware.blacklistToken(validToken, 'Test logout');

      const mockReq = {
        headers: { authorization: `Bearer ${validToken}` },
        ip: '192.168.1.1',
        originalUrl: '/api/v1/products',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const authMiddleware = this.authMiddleware.authenticate();
      await authMiddleware(mockReq, mockRes, mockNext);

      assert(!mockNext.called, 'Next should not be called for blacklisted token');
      assert(mockRes.status.calledWith(401), 'Should return 401 status');
      
      const errorResponse = mockRes.json.mock.calls[0][0];
      assert(errorResponse.error === 'Token revoked', 'Should return token revoked error');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Token Blacklist',
        status: 'PASSED',
        message: 'Blacklisted token properly rejected'
      });
      
      console.log('✅ PASSED: Token blacklist working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Token Blacklist',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testRateLimiting() {
    this.testResults.total++;
    console.log('🔍 Test 5: Rate Limiting');
    
    try {
      const mockReq = {
        ip: '192.168.1.1',
        originalUrl: '/api/v1/products',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        set: jest.fn()
      };

      const mockNext = jest.fn();

      const rateLimitMiddleware = this.authMiddleware.rateLimit({ max: 2, windowMs: 1000 });
      
      // First request should pass
      await rateLimitMiddleware(mockReq, mockRes, mockNext);
      assert(mockNext.calledOnce, 'First request should pass');
      
      // Second request should pass
      mockNext.mockClear();
      await rateLimitMiddleware(mockReq, mockRes, mockNext);
      assert(mockNext.calledOnce, 'Second request should pass');
      
      // Third request should be rate limited
      mockNext.mockClear();
      await rateLimitMiddleware(mockReq, mockRes, mockNext);
      assert(!mockNext.called, 'Third request should be rate limited');
      assert(mockRes.status.calledWith(429), 'Should return 429 status');
      
      const errorResponse = mockRes.json.mock.calls[0][0];
      assert(errorResponse.error === 'Too many requests', 'Should return rate limit error');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Rate Limiting',
        status: 'PASSED',
        message: 'Rate limiting working correctly'
      });
      
      console.log('✅ PASSED: Rate limiting working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Rate Limiting',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testIPReputation() {
    this.testResults.total++;
    console.log('🔍 Test 6: IP Reputation');
    
    try {
      // Record multiple failed attempts for an IP
      const suspiciousIP = '192.168.1.100';
      for (let i = 0; i < 15; i++) {
        await this.authMiddleware.recordFailedAttempt(suspiciousIP, 'authentication');
      }

      // Create a valid JWT token
      const validToken = jwt.sign(
        { userId: 'user123', role: 'CUSTOMER', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 },
        'test-jwt-secret',
        { algorithm: 'HS256', issuer: 'smart-technologies-bd' }
      );

      const mockReq = {
        headers: { authorization: `Bearer ${validToken}` },
        ip: suspiciousIP,
        originalUrl: '/api/v1/products',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const authMiddleware = this.authMiddleware.authenticate();
      await authMiddleware(mockReq, mockRes, mockNext);

      assert(!mockNext.called, 'Next should not be called for suspicious IP');
      assert(mockRes.status.calledWith(403), 'Should return 403 status');
      
      const errorResponse = mockRes.json.mock.calls[0][0];
      assert(errorResponse.error === 'Access denied', 'Should return access denied error');
      assert(errorResponse.message.includes('Suspicious activity'), 'Should mention suspicious activity');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'IP Reputation',
        status: 'PASSED',
        message: 'Suspicious IP properly blocked'
      });
      
      console.log('✅ PASSED: IP reputation system working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'IP Reputation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testRoleBasedAuthorization() {
    this.testResults.total++;
    console.log('🔍 Test 7: Role-Based Authorization');
    
    try {
      // Test admin-only middleware
      const mockReq = {
        user: { userId: 'user123', role: 'ADMIN' }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const adminMiddleware = this.authMiddleware.adminOnly();
      adminMiddleware(mockReq, mockRes, mockNext);
      assert(mockNext.calledOnce, 'Admin user should pass admin-only check');

      // Test unauthorized user
      mockReq.user.role = 'CUSTOMER';
      mockNext.mockClear();
      adminMiddleware(mockReq, mockRes, mockNext);
      assert(!mockNext.called, 'Non-admin user should not pass admin-only check');
      assert(mockRes.status.calledWith(403), 'Should return 403 for unauthorized role');
      
      // Test manager-or-admin middleware
      mockReq.user.role = 'MANAGER';
      mockNext.mockClear();
      const managerMiddleware = this.authMiddleware.managerOrAdmin();
      managerMiddleware(mockReq, mockRes, mockNext);
      assert(mockNext.calledOnce, 'Manager should pass manager-or-admin check');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Role-Based Authorization',
        status: 'PASSED',
        message: 'Role-based authorization working correctly'
      });
      
      console.log('✅ PASSED: Role-based authorization working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Role-Based Authorization',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testAPIKeyValidation() {
    this.testResults.total++;
    console.log('🔍 Test 8: API Key Validation');
    
    try {
      const validApiKeys = [
        'valid-api-key-1',
        { key: 'valid-api-key-2', id: 'key2', createdAt: Date.now() - 86400000 }
      ];

      // Test valid API key
      const mockReq = {
        headers: { 'x-api-key': 'valid-api-key-1' },
        ip: '192.168.1.1',
        originalUrl: '/api/v1/products',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const apiKeyMiddleware = this.authMiddleware.validateApiKey(validApiKeys);
      apiKeyMiddleware(mockReq, mockRes, mockNext);
      assert(mockNext.calledOnce, 'Valid API key should pass');

      // Test invalid API key
      mockReq.headers['x-api-key'] = 'invalid-api-key';
      mockNext.mockClear();
      apiKeyMiddleware(mockReq, mockRes, mockNext);
      assert(!mockNext.called, 'Invalid API key should not pass');
      assert(mockRes.status.calledWith(401), 'Should return 401 for invalid API key');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'API Key Validation',
        status: 'PASSED',
        message: 'API key validation working correctly'
      });
      
      console.log('✅ PASSED: API key validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'API Key Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testSessionValidation() {
    this.testResults.total++;
    console.log('🔍 Test 9: Session Validation');
    
    try {
      // Create a valid session
      const sessionId = 'session-123';
      const sessionData = {
        userId: 'user123',
        ip: '192.168.1.1',
        expiresAt: Date.now() + 3600000,
        lastActivity: Date.now()
      };
      
      this.mockRedis.data[`session:${sessionId}`] = JSON.stringify(sessionData);

      const mockReq = {
        headers: { 'x-session-id': sessionId },
        ip: '192.168.1.1',
        originalUrl: '/api/v1/products',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      const sessionMiddleware = this.authMiddleware.validateSession();
      await sessionMiddleware(mockReq, mockRes, mockNext);
      assert(mockNext.calledOnce, 'Valid session should pass');
      assert(mockReq.session.userId === 'user123', 'Session user should be set');

      // Test invalid session
      mockReq.headers['x-session-id'] = 'invalid-session';
      mockNext.mockClear();
      await sessionMiddleware(mockReq, mockRes, mockNext);
      assert(!mockNext.called, 'Invalid session should not pass');
      assert(mockRes.status.calledWith(401), 'Should return 401 for invalid session');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Session Validation',
        status: 'PASSED',
        message: 'Session validation working correctly'
      });
      
      console.log('✅ PASSED: Session validation working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Session Validation',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testSecurityLogging() {
    this.testResults.total++;
    console.log('🔍 Test 10: Security Logging');
    
    try {
      // Test security event logging
      const securityDetails = {
        ip: '192.168.1.1',
        userAgent: 'test-agent',
        reason: 'Invalid API key',
        path: '/api/v1/products'
      };

      // Mock logger to capture security logs
      const mockLogger = {
        logSecurity: jest.fn()
      };
      
      this.authMiddleware.logger = mockLogger;
      this.authMiddleware.logSecurity('Invalid API Key Attempt', securityDetails);

      assert(mockLogger.logSecurity.calledOnce, 'Security logging should be called');
      assert(mockLogger.logSecurity.calledWith('Invalid API Key Attempt', null, securityDetails), 'Should log with correct details');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Security Logging',
        status: 'PASSED',
        message: 'Security logging working correctly'
      });
      
      console.log('✅ PASSED: Security logging working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Security Logging',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 AUTHENTICATION SECURITY TEST REPORT');
    console.log('======================================');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%\n`);
    
    console.log('📋 Detailed Results:');
    this.testResults.details.forEach((detail, index) => {
      const status = detail.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${detail.test}: ${detail.message}`);
    });
    
    return this.testResults;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new AuthSecurityTest();
  test.runAllTests().catch(console.error);
}

module.exports = AuthSecurityTest;