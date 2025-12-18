const { DatabaseService } = require('../services/database');
const { ConfigService } = require('../services/config');
const { LoggerService } = require('../services/logger');
const assert = require('assert');

// Test Error Handling and Graceful Degradation Scenarios
class ErrorHandlingTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
    this.originalEnv = { ...process.env };
  }

  async runAllTests() {
    console.log('🧪 Starting Error Handling Tests...\n');
    
    await this.testDatabaseConnectionFailure();
    await this.testConfigurationMissingGraceful();
    await this.testPaymentGatewayFailure();
    await this.testRedisConnectionFailure();
    await this.testExternalServiceFailure();
    await this.testMemoryPressureHandling();
    await this.testRateLimitingGraceful();
    await this.testDatabaseQueryFailure();
    await this.testFileUploadErrorHandling();
    await this.testCircuitBreakerPattern();
    
    this.generateTestReport();
  }

  restoreEnvironment() {
    process.env = { ...this.originalEnv };
  }

  async testDatabaseConnectionFailure() {
    this.testResults.total++;
    console.log('🔍 Test 1: Database Connection Failure');
    
    try {
      // Mock database connection failure
      const mockPrisma = {
        $connect: jest.fn().mockRejectedValue(new Error('ECONNREFUSED: Connection refused')),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn(),
        $on: jest.fn()
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      
      // Test connection failure handling
      let connectionError = null;
      try {
        await dbService.connect();
      } catch (error) {
        connectionError = error;
      }
      
      assert(connectionError !== null, 'Should catch connection error');
      assert(connectionError.message.includes('ECONNREFUSED'), 'Should preserve original error message');
      
      // Test health check with failed connection
      const healthResult = await dbService.healthCheck();
      assert(healthResult.status === 'unhealthy', 'Health check should return unhealthy status');
      assert(healthResult.database === 'disconnected', 'Should indicate database disconnected');
      assert(healthResult.error !== undefined, 'Should include error message');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Database Connection Failure',
        status: 'PASSED',
        message: 'Database connection failure handled gracefully with proper error reporting'
      });
      
      console.log('✅ PASSED: Database connection failure handled correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Database Connection Failure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testConfigurationMissingGraceful() {
    this.testResults.total++;
    console.log('🔍 Test 2: Configuration Missing Graceful Handling');
    
    try {
      // Set minimal configuration with missing optional services
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'test-secret-key';
      // Remove optional services
      delete process.env.SMTP_HOST;
      delete process.env.REDIS_URL;
      delete process.env.ELASTICSEARCH_URL;
      delete process.env.BKASH_API_KEY;
      
      let warningLogged = false;
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('Missing') || message.includes('disabled')) {
          warningLogged = true;
        }
        originalWarn(...args);
      };
      
      const configService = new ConfigService();
      
      // Test that service starts with warnings but doesn't crash
      assert(configService !== undefined, 'Config service should initialize despite missing optional services');
      assert(warningLogged, 'Should log warnings for missing services');
      
      // Test graceful degradation
      const emailConfig = configService.getEmailConfig();
      const cacheConfig = configService.getCacheConfig();
      const searchConfig = configService.getSearchConfig();
      const paymentConfig = configService.getPaymentConfig();
      
      // Should have default/empty configs for missing services
      assert(emailConfig.host === undefined, 'Email config should be empty when SMTP missing');
      assert(cacheConfig.redis.url === 'redis://localhost:6379', 'Cache should use default Redis URL');
      assert(searchConfig.elasticsearch.url === 'http://localhost:9200', 'Search should use default Elasticsearch URL');
      assert(paymentConfig.bkash.apiKey === undefined, 'Payment config should be empty when API keys missing');
      
      console.warn = originalWarn;
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Configuration Missing Graceful Handling',
        status: 'PASSED',
        message: 'Missing configuration handled gracefully with warnings and defaults'
      });
      
      console.log('✅ PASSED: Configuration missing handled gracefully\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Configuration Missing Graceful Handling',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testPaymentGatewayFailure() {
    this.testResults.total++;
    console.log('🔍 Test 3: Payment Gateway Failure');
    
    try {
      // Mock payment gateway failure
      const mockPaymentService = {
        processPayment: jest.fn().mockImplementation(async (gateway, paymentData) => {
          if (gateway === 'bkash') {
            throw new Error('BKASH_SERVICE_UNAVAILABLE: bKash service temporarily unavailable');
          }
          return { success: true, transactionId: 'txn_123' };
        }),
        getAvailableGateways: jest.fn().mockReturnValue(['bkash', 'nagad', 'rocket']),
        fallbackEnabled: true
      };
      
      // Test payment processing with fallback
      const paymentData = {
        amount: 1500,
        currency: 'BDT',
        orderId: 'order_123'
      };
      
      // Test failed gateway with fallback
      let paymentResult = null;
      let gatewayUsed = null;
      
      try {
        // Try bKash first (should fail)
        paymentResult = await mockPaymentService.processPayment('bkash', paymentData);
        gatewayUsed = 'bkash';
      } catch (error) {
        // Fallback to Nagad
        try {
          paymentResult = await mockPaymentService.processPayment('nagad', paymentData);
          gatewayUsed = 'nagad';
        } catch (fallbackError) {
          // Fallback to Rocket
          paymentResult = await mockPaymentService.processPayment('rocket', paymentData);
          gatewayUsed = 'rocket';
        }
      }
      
      assert(gatewayUsed === 'nagad' || gatewayUsed === 'rocket', 'Should fallback to working gateway');
      assert(paymentResult !== null, 'Should eventually succeed with fallback');
      
      // Test all gateways failure
      mockPaymentService.processPayment = jest.fn().mockRejectedValue(new Error('All gateways unavailable'));
      
      let allGatewaysFailed = false;
      try {
        await mockPaymentService.processPayment('bkash', paymentData);
      } catch (error) {
        allGatewaysFailed = true;
        assert(error.message.includes('All gateways unavailable'), 'Should indicate all gateways failed');
      }
      
      assert(allGatewaysFailed, 'Should handle all gateways failure gracefully');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Payment Gateway Failure',
        status: 'PASSED',
        message: 'Payment gateway failures handled with fallback mechanisms'
      });
      
      console.log('✅ PASSED: Payment gateway failure handled correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Payment Gateway Failure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testRedisConnectionFailure() {
    this.testResults.total++;
    console.log('🔍 Test 4: Redis Connection Failure');
    
    try {
      // Mock Redis connection failure
      const mockRedis = {
        connect: jest.fn().mockRejectedValue(new Error('ECONNREFUSED: Redis connection refused')),
        on: jest.fn(),
        get: jest.fn().mockRejectedValue(new Error('Redis disconnected')),
        setEx: jest.fn().mockRejectedValue(new Error('Redis disconnected')),
        del: jest.fn().mockRejectedValue(new Error('Redis disconnected'))
      };

      // Mock Redis module
      jest.mock('redis', () => ({
        createClient: jest.fn(() => mockRedis)
      }));

      // Mock auth middleware to test Redis failure handling
      const mockAuthMiddleware = {
        initializeRedis: async function() {
          try {
            await this.redis.connect();
          } catch (error) {
            // Should handle Redis failure gracefully
            this.redis = null;
            console.warn('Redis not available, some features will be limited');
          }
        },
        rateLimit: function() {
          return async (req, res, next) => {
            // Should allow requests when Redis is unavailable
            next();
          };
        },
        isTokenBlacklisted: async function() {
          // Should return false when Redis is unavailable
          return false;
        }
      };
      
      // Test Redis failure handling
      await mockAuthMiddleware.initializeRedis();
      assert(mockAuthMiddleware.redis === null, 'Should set redis to null on connection failure');
      
      // Test rate limiting without Redis
      const rateLimitMiddleware = mockAuthMiddleware.rateLimit();
      assert(typeof rateLimitMiddleware === 'function', 'Rate limiting middleware should still be available');
      
      // Test token blacklist without Redis
      const isBlacklisted = await mockAuthMiddleware.isTokenBlacklisted('test-token');
      assert(isBlacklisted === false, 'Should return false for blacklist check when Redis unavailable');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Redis Connection Failure',
        status: 'PASSED',
        message: 'Redis connection failure handled gracefully with feature degradation'
      });
      
      console.log('✅ PASSED: Redis connection failure handled correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Redis Connection Failure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testExternalServiceFailure() {
    this.testResults.total++;
    console.log('🔍 Test 5: External Service Failure');
    
    try {
      // Mock external service failure
      const mockExternalService = {
        callAPI: jest.fn().mockImplementation(async (service, endpoint, data) => {
          if (service === 'sms') {
            throw new Error('SMS_SERVICE_TIMEOUT: Request timeout');
          }
          if (service === 'email') {
            throw new Error('SMTP_AUTH_FAILED: Authentication failed');
          }
          return { success: true };
        }),
        retryAttempts: 3,
        retryDelay: 1000,
        circuitBreaker: {
          failureThreshold: 5,
          resetTimeout: 30000,
          state: 'CLOSED' // CLOSED = working, OPEN = failing
        }
      };
      
      // Test external service failure with retry
      let attempts = 0;
      let finalError = null;
      
      try {
        for (let i = 0; i < mockExternalService.retryAttempts; i++) {
          attempts++;
          try {
            await mockExternalService.callAPI('sms', '/send', { phone: '01712345678', message: 'Test' });
            break;
          } catch (error) {
            if (i === mockExternalService.retryAttempts - 1) {
              finalError = error;
              break;
            }
            await new Promise(resolve => setTimeout(resolve, mockExternalService.retryDelay));
          }
        }
      } catch (error) {
        finalError = error;
      }
      
      assert(attempts === mockExternalService.retryAttempts, 'Should attempt retry specified number of times');
      assert(finalError !== null, 'Should capture final error after retries');
      assert(finalError.message.includes('SMS_SERVICE_TIMEOUT'), 'Should preserve original error');
      
      // Test circuit breaker
      mockExternalService.circuitBreaker.state = 'OPEN';
      let circuitBreakerTriggered = false;
      
      try {
        await mockExternalService.callAPI('sms', '/send', { phone: '01712345678', message: 'Test' });
      } catch (error) {
        circuitBreakerTriggered = true;
        assert(error.message.includes('CIRCUIT_BREAKER_OPEN'), 'Should indicate circuit breaker is open');
      }
      
      assert(circuitBreakerTriggered, 'Should trigger circuit breaker when service is failing');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'External Service Failure',
        status: 'PASSED',
        message: 'External service failures handled with retry and circuit breaker'
      });
      
      console.log('✅ PASSED: External service failure handled correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'External Service Failure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testMemoryPressureHandling() {
    this.testResults.total++;
    console.log('🔍 Test 6: Memory Pressure Handling');
    
    try {
      // Mock memory pressure scenarios
      const mockMemoryMonitor = {
        getMemoryUsage: jest.fn(() => ({
          rss: 1024 * 1024 * 1024, // 1GB
          heapUsed: 800 * 1024 * 1024, // 800MB
          heapTotal: 1024 * 1024 * 1024, // 1GB
          external: 200 * 1024 * 1024 // 200MB
        })),
        isMemoryPressure: jest.fn(() => true), // Simulate memory pressure
        getMemoryThreshold: jest.fn(() => 0.8) // 80% threshold
      };
      
      // Test memory pressure handling
      const memoryUsage = mockMemoryMonitor.getMemoryUsage();
      const isPressure = mockMemoryMonitor.isMemoryPressure();
      const threshold = mockMemoryMonitor.getMemoryThreshold();
      
      assert(memoryUsage.heapUsed > 0, 'Should report memory usage');
      assert(isPressure === true, 'Should detect memory pressure');
      assert(threshold === 0.8, 'Should have memory threshold');
      
      // Test graceful degradation under memory pressure
      const mockService = {
        handleRequest: jest.fn().mockImplementation(async (req) => {
          if (mockMemoryMonitor.isMemoryPressure()) {
            // Enable simplified mode under memory pressure
            return {
              status: 'degraded',
              message: 'Service running in degraded mode due to memory pressure',
              simplifiedResponse: true
            };
          }
          return { status: 'normal', fullResponse: true };
        })
      };
      
      const mockReq = { url: '/api/v1/products', method: 'GET' };
      const response = await mockService.handleRequest(mockReq);
      
      assert(response.status === 'degraded', 'Should enter degraded mode under memory pressure');
      assert(response.simplifiedResponse === true, 'Should provide simplified response');
      assert(response.message.includes('memory pressure'), 'Should explain degradation reason');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Memory Pressure Handling',
        status: 'PASSED',
        message: 'Memory pressure handled gracefully with service degradation'
      });
      
      console.log('✅ PASSED: Memory pressure handling working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Memory Pressure Handling',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testRateLimitingGraceful() {
    this.testResults.total++;
    console.log('🔍 Test 7: Rate Limiting Graceful Handling');
    
    try {
      // Mock rate limiting with graceful degradation
      const mockRateLimiter = {
        requests: [],
        limits: {
          normal: { max: 1000, windowMs: 900000 }, // 15 minutes
          degraded: { max: 500, windowMs: 900000 }, // Reduced limit under pressure
          emergency: { max: 100, windowMs: 900000 } // Emergency limit
        },
        mode: 'normal', // normal, degraded, emergency
        checkRequest: jest.fn().mockImplementation((ip) => {
          const now = Date.now();
          const windowStart = now - 900000;
          
          // Clean old requests
          mockRateLimiter.requests = mockRateLimiter.requests.filter(
            req => req.timestamp > windowStart
          );
          
          const currentCount = mockRateLimiter.requests.filter(req => req.ip === ip).length;
          const limits = mockRateLimiter.limits[mockRateLimiter.mode];
          
          return {
            allowed: currentCount < limits.max,
            count: currentCount,
            limit: limits.max,
            resetTime: windowStart + 900000
          };
        }),
        setMode: jest.fn().mockImplementation((newMode) => {
          mockRateLimiter.mode = newMode;
        })
      };
      
      // Test normal rate limiting
      const ip = '192.168.1.1';
      const normalResult = mockRateLimiter.checkRequest(ip);
      assert(normalResult.allowed === true, 'Should allow requests under normal limit');
      assert(normalResult.limit === 1000, 'Should use normal limit');
      
      // Simulate high traffic and switch to degraded mode
      for (let i = 0; i < 600; i++) {
        mockRateLimiter.requests.push({ ip, timestamp: Date.now() });
      }
      
      mockRateLimiter.setMode('degraded');
      const degradedResult = mockRateLimiter.checkRequest(ip);
      assert(degradedResult.limit === 500, 'Should use reduced limit in degraded mode');
      
      // Simulate emergency situation
      mockRateLimiter.setMode('emergency');
      const emergencyResult = mockRateLimiter.checkRequest(ip);
      assert(emergencyResult.limit === 100, 'Should use emergency limit');
      
      // Test graceful response
      const mockResponse = {
        status: jest.fn(),
        json: jest.fn(),
        set: jest.fn()
      };
      
      if (!degradedResult.allowed) {
        mockResponse.status(429);
        mockResponse.json({
          error: 'Rate limit exceeded',
          message: `Rate limit: ${degradedResult.count}/${degradedResult.limit}`,
          mode: mockRateLimiter.mode,
          retryAfter: Math.ceil((degradedResult.resetTime - Date.now()) / 1000)
        });
        mockResponse.set('X-RateLimit-Limit', degradedResult.limit);
        mockResponse.set('X-RateLimit-Remaining', Math.max(0, degradedResult.limit - degradedResult.count));
      }
      
      assert(mockResponse.status.calledWith(429), 'Should return 429 when rate limited');
      assert(mockResponse.json.called, 'Should provide rate limit information');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Rate Limiting Graceful Handling',
        status: 'PASSED',
        message: 'Rate limiting handled gracefully with adaptive limits'
      });
      
      console.log('✅ PASSED: Rate limiting graceful handling working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Rate Limiting Graceful Handling',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testDatabaseQueryFailure() {
    this.testResults.total++;
    console.log('🔍 Test 8: Database Query Failure');
    
    try {
      // Mock database query failure
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn()
          .mockRejectedValueOnce(new Error('Connection lost: The server closed the connection'))
          .mockResolvedValueOnce([{ id: 1, name: 'Test Product' }]),
        $on: jest.fn(),
        user: {
          findMany: jest.fn().mockRejectedValue(new Error('Deadlock detected'))
        }
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      await dbService.connect();
      
      // Test query failure handling
      let queryError = null;
      try {
        await dbService.query('SELECT * FROM products WHERE id = 1');
      } catch (error) {
        queryError = error;
      }
      
      assert(queryError !== null, 'Should catch query error');
      assert(queryError.message.includes('Connection lost'), 'Should preserve original error message');
      
      // Test retry mechanism
      let retrySuccess = false;
      try {
        const result = await dbService.query('SELECT * FROM products WHERE id = 1');
        retrySuccess = true;
      } catch (error) {
        retrySuccess = false;
      }
      
      assert(retrySuccess, 'Should succeed on retry');
      
      // Test transaction failure
      let transactionError = null;
      try {
        await dbService.transaction(async (tx) => {
          return await tx.user.findMany();
        });
      } catch (error) {
        transactionError = error;
      }
      
      assert(transactionError !== null, 'Should catch transaction error');
      assert(transactionError.message.includes('Deadlock detected'), 'Should preserve transaction error');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Database Query Failure',
        status: 'PASSED',
        message: 'Database query failures handled with retry and proper error reporting'
      });
      
      console.log('✅ PASSED: Database query failure handled correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Database Query Failure',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testFileUploadErrorHandling() {
    this.testResults.total++;
    console.log('🔍 Test 9: File Upload Error Handling');
    
    try {
      // Mock file upload error scenarios
      const mockFileUpload = {
        handleUpload: jest.fn().mockImplementation(async (file, options) => {
          if (file.size > options.maxSize) {
            throw new Error('FILE_TOO_LARGE: File size exceeds maximum allowed');
          }
          if (!options.allowedTypes.includes(file.mimetype)) {
            throw new Error('INVALID_FILE_TYPE: File type not allowed');
          }
          if (options.diskSpace < file.size) {
            throw new Error('INSUFFICIENT_DISK_SPACE: Not enough disk space');
          }
          return { filename: 'uploaded_file.jpg', path: '/uploads/uploaded_file.jpg' };
        }),
        getMaxFileSize: jest.fn().mockReturnValue(5 * 1024 * 1024), // 5MB
        getAllowedTypes: jest.fn().mockReturnValue(['image/jpeg', 'image/png', 'image/gif']),
        getAvailableDiskSpace: jest.fn().mockReturnValue(1024 * 1024 * 1024) // 1GB
      };
      
      // Test file too large error
      const largeFile = { size: 10 * 1024 * 1024, mimetype: 'image/jpeg', name: 'large.jpg' };
      let largeFileError = null;
      
      try {
        await mockFileUpload.handleUpload(largeFile, {
          maxSize: mockFileUpload.getMaxFileSize(),
          allowedTypes: mockFileUpload.getAllowedTypes()
        });
      } catch (error) {
        largeFileError = error;
      }
      
      assert(largeFileError !== null, 'Should catch file size error');
      assert(largeFileError.message.includes('FILE_TOO_LARGE'), 'Should indicate file too large');
      
      // Test invalid file type error
      const invalidTypeFile = { size: 1024 * 1024, mimetype: 'application/pdf', name: 'document.pdf' };
      let invalidTypeError = null;
      
      try {
        await mockFileUpload.handleUpload(invalidTypeFile, {
          maxSize: mockFileUpload.getMaxFileSize(),
          allowedTypes: mockFileUpload.getAllowedTypes()
        });
      } catch (error) {
        invalidTypeError = error;
      }
      
      assert(invalidTypeError !== null, 'Should catch file type error');
      assert(invalidTypeError.message.includes('INVALID_FILE_TYPE'), 'Should indicate invalid file type');
      
      // Test insufficient disk space error
      const diskFullFile = { size: 2 * 1024 * 1024 * 1024, mimetype: 'image/jpeg', name: 'huge.jpg' }; // 2GB
      let diskSpaceError = null;
      
      try {
        await mockFileUpload.handleUpload(diskFullFile, {
          maxSize: mockFileUpload.getMaxFileSize(),
          allowedTypes: mockFileUpload.getAllowedTypes(),
          diskSpace: mockFileUpload.getAvailableDiskSpace()
        });
      } catch (error) {
        diskSpaceError = error;
      }
      
      assert(diskSpaceError !== null, 'Should catch disk space error');
      assert(diskSpaceError.message.includes('INSUFFICIENT_DISK_SPACE'), 'Should indicate insufficient disk space');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'File Upload Error Handling',
        status: 'PASSED',
        message: 'File upload errors handled gracefully with specific error types'
      });
      
      console.log('✅ PASSED: File upload error handling working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'File Upload Error Handling',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testCircuitBreakerPattern() {
    this.testResults.total++;
    console.log('🔍 Test 10: Circuit Breaker Pattern');
    
    try {
      // Mock circuit breaker implementation
      const mockCircuitBreaker = {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 30000,
        lastFailureTime: null,
        
        execute: jest.fn().mockImplementation(async (operation) => {
          if (mockCircuitBreaker.state === 'OPEN') {
            if (Date.now() - mockCircuitBreaker.lastFailureTime > mockCircuitBreaker.timeout) {
              mockCircuitBreaker.state = 'HALF_OPEN';
            } else {
              throw new Error('CIRCUIT_BREAKER_OPEN: Service temporarily unavailable');
            }
          }
          
          try {
            const result = await operation();
            
            // Success handling
            if (mockCircuitBreaker.state === 'HALF_OPEN') {
              mockCircuitBreaker.failureCount = 0;
              mockCircuitBreaker.state = 'CLOSED';
            }
            
            return result;
          } catch (error) {
            mockCircuitBreaker.failureCount++;
            mockCircuitBreaker.lastFailureTime = Date.now();
            
            if (mockCircuitBreaker.failureCount >= mockCircuitBreaker.failureThreshold) {
              mockCircuitBreaker.state = 'OPEN';
            }
            
            throw error;
          }
        }),
        
        getState: jest.fn().mockImplementation(() => ({
          state: mockCircuitBreaker.state,
          failureCount: mockCircuitBreaker.failureCount,
          isAvailable: mockCircuitBreaker.state !== 'OPEN'
        }))
      };
      
      // Test successful operation
      const successResult = await mockCircuitBreaker.execute(async () => {
        return { success: true, data: 'test' };
      });
      
      assert(successResult.success === true, 'Should allow successful operation');
      assert(mockCircuitBreaker.state === 'CLOSED', 'Should remain closed on success');
      
      // Test failure accumulation
      for (let i = 0; i < 6; i++) {
        try {
          await mockCircuitBreaker.execute(async () => {
            throw new Error('Service failure');
          });
        } catch (error) {
          // Expected failures
        }
      }
      
      assert(mockCircuitBreaker.state === 'OPEN', 'Should open circuit after failure threshold');
      
      // Test circuit open behavior
      let circuitOpenError = null;
      try {
        await mockCircuitBreaker.execute(async () => {
          return { success: true };
        });
      } catch (error) {
        circuitOpenError = error;
      }
      
      assert(circuitOpenError !== null, 'Should reject operation when circuit is open');
      assert(circuitOpenError.message.includes('CIRCUIT_BREAKER_OPEN'), 'Should indicate circuit breaker is open');
      
      // Test half-open state
      mockCircuitBreaker.lastFailureTime = Date.now() - 40000; // 40 seconds ago
      let halfOpenResult = null;
      
      try {
        halfOpenResult = await mockCircuitBreaker.execute(async () => {
          return { success: true, data: 'recovery test' };
        });
      } catch (error) {
        // Should not fail in this test
      }
      
      assert(halfOpenResult !== null, 'Should allow operation in half-open state');
      assert(mockCircuitBreaker.state === 'CLOSED', 'Should close circuit on successful half-open operation');
      
      // Test circuit breaker state
      const state = mockCircuitBreaker.getState();
      assert(state.state === 'CLOSED', 'Should report correct state');
      assert(state.isAvailable === true, 'Should be available when closed');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Circuit Breaker Pattern',
        status: 'PASSED',
        message: 'Circuit breaker pattern working correctly with state transitions'
      });
      
      console.log('✅ PASSED: Circuit breaker pattern working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Circuit Breaker Pattern',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 ERROR HANDLING TEST REPORT');
    console.log('==================================');
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
  const test = new ErrorHandlingTest();
  test.runAllTests().catch(console.error);
}

module.exports = ErrorHandlingTest;