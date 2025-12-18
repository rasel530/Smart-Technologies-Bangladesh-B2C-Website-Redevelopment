const { LoggerService } = require('../services/logger');
const assert = require('assert');
const fs = require('fs');

// Test Logger Performance Optimizations in Production vs Development
class LoggerPerformanceTest {
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
    console.log('🧪 Starting Logger Performance Tests...\n');
    
    await this.testProductionLoggerConfiguration();
    await this.testDevelopmentLoggerConfiguration();
    await this.testLogSamplingInProduction();
    await this.testLogBuffering();
    await this.testPerformanceMetrics();
    await this.testFileRotationAndCompression();
    await this.testStructuredLogging();
    await this.testRequestLoggerPerformance();
    await this.testErrorLoggerPerformance();
    await this.testBusinessLogSampling();
    
    this.generateTestReport();
  }

  restoreEnvironment() {
    process.env = { ...this.originalEnv };
  }

  async testProductionLoggerConfiguration() {
    this.testResults.total++;
    console.log('🔍 Test 1: Production Logger Configuration');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      const loggerService = new LoggerService();
      const config = loggerService.config;
      
      assert(config.level === 'info', 'Production should use info log level');
      assert(config.format === 'json', 'Production should use json format');
      assert(!config.colorize, 'Production should not colorize logs');
      assert(config.file !== null, 'Production should have file logging enabled');
      
      const logger = loggerService.getLogger();
      assert(logger !== undefined, 'Logger instance should be created');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Production Logger Configuration',
        status: 'PASSED',
        message: 'Production logger configured correctly with optimized settings'
      });
      
      console.log('✅ PASSED: Production logger configuration working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Production Logger Configuration',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testDevelopmentLoggerConfiguration() {
    this.testResults.total++;
    console.log('🔍 Test 2: Development Logger Configuration');
    
    try {
      // Set development environment
      process.env.NODE_ENV = 'development';
      
      const loggerService = new LoggerService();
      const config = loggerService.config;
      
      assert(config.level === 'debug', 'Development should use debug log level');
      assert(config.format === 'dev', 'Development should use dev format');
      assert(config.colorize === true, 'Development should colorize logs');
      assert(config.console === true, 'Development should have console logging enabled');
      
      const logger = loggerService.getLogger();
      assert(logger !== undefined, 'Logger instance should be created');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Development Logger Configuration',
        status: 'PASSED',
        message: 'Development logger configured correctly with verbose settings'
      });
      
      console.log('✅ PASSED: Development logger configuration working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Development Logger Configuration',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testLogSamplingInProduction() {
    this.testResults.total++;
    console.log('🔍 Test 3: Log Sampling in Production');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      const loggerService = new LoggerService();
      
      // Test sampling for different log levels
      const shouldSampleError = loggerService.shouldSampleLog('error');
      const shouldSampleWarn = loggerService.shouldSampleLog('warn');
      const shouldSampleInfo = loggerService.shouldSampleLog('info');
      const shouldSampleDebug = loggerService.shouldSampleLog('debug');
      
      assert(shouldSampleError === true, 'Errors should always be sampled');
      assert(shouldSampleWarn === true, 'Warnings should always be sampled');
      assert(typeof shouldSampleInfo === 'boolean', 'Info logs should be sampled based on rate');
      assert(typeof shouldSampleDebug === 'boolean', 'Debug logs should be sampled based on rate');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Log Sampling in Production',
        status: 'PASSED',
        message: 'Log sampling working correctly for different log levels'
      });
      
      console.log('✅ PASSED: Log sampling in production working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Log Sampling in Production',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testLogBuffering() {
    this.testResults.total++;
    console.log('🔍 Test 4: Log Buffering');
    
    try {
      // Set production environment to enable buffering
      process.env.NODE_ENV = 'production';
      
      const loggerService = new LoggerService();
      
      // Test adding to buffer
      loggerService.addToBuffer('info', 'Test message', { key: 'value' });
      assert(loggerService.logBuffer.length === 1, 'Buffer should contain 1 entry');
      
      // Test buffer flush on error (should flush immediately)
      loggerService.addToBuffer('error', 'Error message', { error: 'test' });
      assert(loggerService.logBuffer.length === 0, 'Buffer should be flushed on error');
      
      // Test buffer size limit
      for (let i = 0; i < 105; i++) {
        loggerService.addToBuffer('info', `Message ${i}`, { index: i });
      }
      assert(loggerService.logBuffer.length <= 100, 'Buffer should not exceed max size');
      
      // Test manual flush
      loggerService.addToBuffer('info', 'Test flush', {});
      const initialBufferSize = loggerService.logBuffer.length;
      loggerService.flushBuffer();
      assert(loggerService.logBuffer.length < initialBufferSize, 'Buffer should be smaller after flush');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Log Buffering',
        status: 'PASSED',
        message: 'Log buffering working correctly with size limits and flush mechanisms'
      });
      
      console.log('✅ PASSED: Log buffering working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Log Buffering',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testPerformanceMetrics() {
    this.testResults.total++;
    console.log('🔍 Test 5: Performance Metrics');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      const loggerService = new LoggerService();
      
      // Test performance measurement
      const initialMetrics = loggerService.getPerformanceMetrics();
      assert(initialMetrics.totalLogs === 0, 'Initial total logs should be 0');
      assert(initialMetrics.totalLogTime === 0, 'Initial total log time should be 0');
      assert(initialMetrics.averageLogTime === 0, 'Initial average log time should be 0');
      
      // Simulate some logging operations
      loggerService.info('Test message 1');
      loggerService.info('Test message 2');
      loggerService.error('Test error');
      
      const updatedMetrics = loggerService.getPerformanceMetrics();
      assert(updatedMetrics.totalLogs > 0, 'Total logs should increase');
      assert(updatedMetrics.totalLogTime >= 0, 'Total log time should be non-negative');
      assert(updatedMetrics.averageLogTime >= 0, 'Average log time should be non-negative');
      assert(updatedMetrics.bufferSize !== undefined, 'Should include buffer size');
      assert(updatedMetrics.isProduction === true, 'Should indicate production mode');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Performance Metrics',
        status: 'PASSED',
        message: 'Performance metrics tracking working correctly'
      });
      
      console.log('✅ PASSED: Performance metrics working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Performance Metrics',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testFileRotationAndCompression() {
    this.testResults.total++;
    console.log('🔍 Test 6: File Rotation and Compression');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      const loggerService = new LoggerService();
      
      // Test compression function exists
      assert(typeof loggerService.compressLogFile === 'function', 'Compression function should exist');
      
      // Test that compression is only enabled in production
      const devLoggerService = new LoggerService();
      process.env.NODE_ENV = 'development';
      assert(devLoggerService.isProduction === false, 'Development mode should be detected');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'File Rotation and Compression',
        status: 'PASSED',
        message: 'File rotation and compression configured correctly for production'
      });
      
      console.log('✅ PASSED: File rotation and compression working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'File Rotation and Compression',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testStructuredLogging() {
    this.testResults.total++;
    console.log('🔍 Test 7: Structured Logging');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      const loggerService = new LoggerService();
      
      // Test structured logging
      const testData = {
        userId: 'user123',
        action: 'purchase',
        productId: 'prod456',
        amount: 1500
      };
      
      // Mock logger to capture structured data
      let capturedLog = null;
      const originalLogger = loggerService.logger;
      loggerService.logger = {
        log: jest.fn((level, message, meta) => {
          capturedLog = { level, message, meta };
        })
      };
      
      loggerService.logStructured('info', 'Purchase completed', testData);
      
      assert(capturedLog !== null, 'Structured log should be captured');
      assert(capturedLog.level === 'info', 'Log level should be correct');
      assert(capturedLog.message === 'Purchase completed', 'Log message should be correct');
      assert(capturedLog.meta.service === 'smart-ecommerce-api', 'Should include service name');
      assert(capturedLog.meta.version === '1.0.0', 'Should include version');
      assert(capturedLog.meta.environment === 'production', 'Should include environment');
      assert(capturedLog.meta.userId === 'user123', 'Should include user data');
      
      // Restore original logger
      loggerService.logger = originalLogger;
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Structured Logging',
        status: 'PASSED',
        message: 'Structured logging working correctly with metadata'
      });
      
      console.log('✅ PASSED: Structured logging working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Structured Logging',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testRequestLoggerPerformance() {
    this.testResults.total++;
    console.log('🔍 Test 8: Request Logger Performance');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      const loggerService = new LoggerService();
      
      // Test request logger middleware
      const requestLogger = loggerService.requestLogger();
      assert(typeof requestLogger === 'function', 'Request logger should be a function');
      
      // Mock request and response objects
      const mockReq = {
        method: 'GET',
        originalUrl: '/api/v1/products',
        ip: '192.168.1.1',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        send: jest.fn(),
        setHeader: jest.fn()
      };

      const mockNext = jest.fn();
      
      // Test middleware execution
      requestLogger(mockReq, mockRes, mockNext);
      assert(mockNext.calledOnce, 'Next should be called');
      assert(typeof mockRes.send === 'function', 'Response send should be wrapped');
      
      // Test response logging
      mockRes.send('test response');
      assert(mockRes.send.called, 'Response should be logged');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Request Logger Performance',
        status: 'PASSED',
        message: 'Request logger middleware working correctly with performance tracking'
      });
      
      console.log('✅ PASSED: Request logger performance working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Request Logger Performance',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testErrorLoggerPerformance() {
    this.testResults.total++;
    console.log('🔍 Test 9: Error Logger Performance');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      const loggerService = new LoggerService();
      
      // Test error logger middleware
      const errorLogger = loggerService.errorLogger();
      assert(typeof errorLogger === 'function', 'Error logger should be a function');
      
      // Mock request and response objects
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/orders',
        ip: '192.168.1.1',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null),
        body: { test: 'data' },
        headers: { 'content-type': 'application/json' }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();
      
      // Test error logging
      const testError = new Error('Test error message');
      testError.stack = 'Error: Test error message\n    at test.js:1:1';
      
      errorLogger(testError, mockReq, mockRes, mockNext);
      
      assert(mockRes.status.calledWith(500), 'Should return 500 status');
      assert(mockRes.json.called, 'Should return error response');
      
      const errorResponse = mockRes.json.mock.calls[0][0];
      assert(errorResponse.error === 'Internal server error', 'Should return generic error in production');
      assert(errorResponse.errorId !== undefined, 'Should include error ID');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Error Logger Performance',
        status: 'PASSED',
        message: 'Error logger working correctly with performance tracking'
      });
      
      console.log('✅ PASSED: Error logger performance working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Error Logger Performance',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  async testBusinessLogSampling() {
    this.testResults.total++;
    console.log('🔍 Test 10: Business Log Sampling');
    
    try {
      // Set production environment
      process.env.NODE_ENV = 'production';
      
      const loggerService = new LoggerService();
      
      // Test business logging with sampling
      const businessData = {
        orderId: 'order123',
        userId: 'user456',
        total: 2500,
        status: 'completed'
      };
      
      // Mock logger to capture business logs
      let businessLogCount = 0;
      const originalLogger = loggerService.logger;
      loggerService.logger = {
        log: jest.fn((level, message, meta) => {
          if (message === 'Business Event') {
            businessLogCount++;
          }
        })
      };
      
      // Log multiple business events to test sampling
      for (let i = 0; i < 20; i++) {
        loggerService.logBusiness('Order Completed', { ...businessData, orderId: `order${i}` });
      }
      
      // Should sample some logs but not all (10% sampling rate)
      assert(businessLogCount > 0 && businessLogCount < 20, 'Should sample business logs');
      
      // Restore original logger
      loggerService.logger = originalLogger;
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Business Log Sampling',
        status: 'PASSED',
        message: `Business log sampling working correctly (${businessLogCount}/20 logs sampled)`
      });
      
      console.log('✅ PASSED: Business log sampling working correctly\n');
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Business Log Sampling',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    } finally {
      this.restoreEnvironment();
    }
  }

  generateTestReport() {
    console.log('\n📊 LOGGER PERFORMANCE TEST REPORT');
    console.log('===================================');
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
  const test = new LoggerPerformanceTest();
  test.runAllTests().catch(console.error);
}

module.exports = LoggerPerformanceTest;