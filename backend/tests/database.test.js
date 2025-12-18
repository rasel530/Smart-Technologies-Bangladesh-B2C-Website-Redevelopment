const { DatabaseService } = require('../services/database');
const assert = require('assert');

// Mock console methods to capture logs for testing
const originalConsole = { ...console };
let consoleOutput = [];

const mockConsole = {
  log: (...args) => {
    consoleOutput.push({ type: 'log', message: args.join(' ') });
    originalConsole.log(...args);
  },
  error: (...args) => {
    consoleOutput.push({ type: 'error', message: args.join(' ') });
    originalConsole.error(...args);
  },
  warn: (...args) => {
    consoleOutput.push({ type: 'warn', message: args.join(' ') });
    originalConsole.warn(...args);
  },
  info: (...args) => {
    consoleOutput.push({ type: 'info', message: args.join(' ') });
    originalConsole.info(...args);
  }
};

// Test Database Connection Retry Mechanism and Pooling
class DatabaseConnectionTest {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Database Connection Tests...\n');
    
    await this.testSuccessfulConnection();
    await this.testConnectionRetryMechanism();
    await this.testConnectionPoolStats();
    await this.testHealthCheck();
    await this.testGracefulShutdown();
    await this.testEventListeners();
    await this.testTransactionSupport();
    await this.testBangladeshSpecificQueries();
    
    this.generateTestReport();
  }

  async testSuccessfulConnection() {
    this.testResults.total++;
    console.log('🔍 Test 1: Successful Database Connection');
    
    try {
      // Mock successful connection
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn().mockResolvedValue([{ status: 1, server_time: new Date() }]),
        $on: jest.fn(),
        user: { count: jest.fn().mockResolvedValue(10) },
        product: { count: jest.fn().mockResolvedValue(50) },
        category: { count: jest.fn().mockResolvedValue(8) },
        brand: { count: jest.fn().mockResolvedValue(15) },
        order: { count: jest.fn().mockResolvedValue(25) },
        review: { count: jest.fn().mockResolvedValue(100) },
        coupon: { count: jest.fn().mockResolvedValue(5) },
        $transaction: jest.fn()
      };

      // Temporarily replace PrismaClient
      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      const result = await dbService.connect();

      assert.strictEqual(result, true, 'Database connection should return true on success');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Successful Database Connection',
        status: 'PASSED',
        message: 'Database connected successfully with proper retry logic'
      });
      
      console.log('✅ PASSED: Database connection successful\n');
      
      // Restore original PrismaClient
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Successful Database Connection',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testConnectionRetryMechanism() {
    this.testResults.total++;
    console.log('🔍 Test 2: Connection Retry Mechanism');
    
    try {
      let attemptCount = 0;
      const mockPrisma = {
        $connect: jest.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Connection failed');
          }
          return Promise.resolve(true);
        }),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn(),
        $on: jest.fn()
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      const result = await dbService.connect();

      assert.strictEqual(result, true, 'Should succeed after 3 attempts');
      assert.strictEqual(attemptCount, 3, 'Should attempt connection 3 times');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Connection Retry Mechanism',
        status: 'PASSED',
        message: `Retry mechanism worked after ${attemptCount} attempts`
      });
      
      console.log('✅ PASSED: Connection retry mechanism working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Connection Retry Mechanism',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testConnectionPoolStats() {
    this.testResults.total++;
    console.log('🔍 Test 3: Connection Pool Statistics');
    
    try {
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn(),
        $on: jest.fn((event, callback) => {
          if (event === 'query') {
            // Simulate query event
            callback({ query: 'SELECT 1', params: [], duration: 50, timestamp: new Date() });
          }
        })
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      await dbService.connect();
      
      const poolStats = dbService.getConnectionPoolStats();
      
      assert(poolStats !== null, 'Pool stats should not be null');
      assert(typeof poolStats.activeConnections === 'number', 'Should have activeConnections count');
      assert(typeof poolStats.maxConnections === 'number', 'Should have maxConnections count');
      assert(typeof poolStats.utilizationRate === 'string', 'Should have utilization rate as string');
      assert(poolStats.queryCount >= 0, 'Should have query count');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Connection Pool Statistics',
        status: 'PASSED',
        message: 'Pool statistics generated correctly with all required fields'
      });
      
      console.log('✅ PASSED: Connection pool statistics working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Connection Pool Statistics',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testHealthCheck() {
    this.testResults.total++;
    console.log('🔍 Test 4: Database Health Check');
    
    try {
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn().mockResolvedValue([{ status: 1, server_time: new Date() }]),
        $on: jest.fn()
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      await dbService.connect();
      
      const healthResult = await dbService.healthCheck();
      
      assert.strictEqual(healthResult.status, 'healthy', 'Health check should return healthy status');
      assert.strictEqual(healthResult.database, 'connected', 'Database should be connected');
      assert(typeof healthResult.responseTime === 'string', 'Response time should be a string');
      assert(healthResult.connectionPool !== undefined, 'Should include connection pool stats');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Database Health Check',
        status: 'PASSED',
        message: 'Health check returned proper status and metrics'
      });
      
      console.log('✅ PASSED: Database health check working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Database Health Check',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testGracefulShutdown() {
    this.testResults.total++;
    console.log('🔍 Test 5: Graceful Shutdown');
    
    try {
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn(),
        $on: jest.fn()
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      await dbService.connect();
      
      // Test disconnect
      await dbService.disconnect();
      
      // Test cleanup connections
      await dbService.cleanupConnections();
      
      assert(mockPrisma.$disconnect.mock.calls.length >= 1, 'Disconnect should be called');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Graceful Shutdown',
        status: 'PASSED',
        message: 'Graceful shutdown and cleanup completed successfully'
      });
      
      console.log('✅ PASSED: Graceful shutdown working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Graceful Shutdown',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testEventListeners() {
    this.testResults.total++;
    console.log('🔍 Test 6: Database Event Listeners');
    
    try {
      const eventListeners = {};
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn(),
        $on: jest.fn((event, callback) => {
          eventListeners[event] = callback;
        })
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      
      // Verify event listeners are set up
      assert(eventListeners.query !== undefined, 'Query event listener should be set');
      assert(eventListeners.error !== undefined, 'Error event listener should be set');
      assert(eventListeners.info !== undefined, 'Info event listener should be set');
      assert(eventListeners.warn !== undefined, 'Warning event listener should be set');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Database Event Listeners',
        status: 'PASSED',
        message: 'All required event listeners are properly set up'
      });
      
      console.log('✅ PASSED: Database event listeners working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Database Event Listeners',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testTransactionSupport() {
    this.testResults.total++;
    console.log('🔍 Test 7: Transaction Support');
    
    try {
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn(),
        $on: jest.fn(),
        $transaction: jest.fn().mockResolvedValue({ success: true })
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      await dbService.connect();
      
      const result = await dbService.transaction(async (tx) => {
        return { success: true };
      });
      
      assert(mockPrisma.$transaction.mock.calls.length === 1, 'Transaction should be called');
      assert(result.success === true, 'Transaction should return result');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Transaction Support',
        status: 'PASSED',
        message: 'Database transactions working correctly'
      });
      
      console.log('✅ PASSED: Transaction support working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Transaction Support',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  async testBangladeshSpecificQueries() {
    this.testResults.total++;
    console.log('🔍 Test 8: Bangladesh-Specific Queries');
    
    try {
      const mockPrisma = {
        $connect: jest.fn().mockResolvedValue(true),
        $disconnect: jest.fn().mockResolvedValue(true),
        $queryRaw: jest.fn()
          .mockResolvedValueOnce([{ division: 'Dhaka' }, { division: 'Chattogram' }])
          .mockResolvedValueOnce([{ paymentMethod: 'bKash' }, { paymentMethod: 'Nagad' }]),
        $on: jest.fn()
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      require('@prisma/client').PrismaClient = jest.fn(() => mockPrisma);

      const dbService = new DatabaseService();
      await dbService.connect();
      
      // Test divisions query
      const divisions = await dbService.getDivisions();
      assert(Array.isArray(divisions), 'Divisions should be an array');
      assert(divisions.includes('Dhaka'), 'Should include Dhaka division');
      
      // Test payment methods query
      const paymentMethods = await dbService.getPaymentMethods();
      assert(Array.isArray(paymentMethods), 'Payment methods should be an array');
      assert(paymentMethods.includes('bKash'), 'Should include bKash payment method');
      
      this.testResults.passed++;
      this.testResults.details.push({
        test: 'Bangladesh-Specific Queries',
        status: 'PASSED',
        message: 'Bangladesh-specific queries (divisions, payment methods) working correctly'
      });
      
      console.log('✅ PASSED: Bangladesh-specific queries working correctly\n');
      
      require('@prisma/client').PrismaClient = originalPrismaClient;
      
    } catch (error) {
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Bangladesh-Specific Queries',
        status: 'FAILED',
        message: error.message
      });
      
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }

  generateTestReport() {
    console.log('\n📊 DATABASE CONNECTION TEST REPORT');
    console.log('=====================================');
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
  const test = new DatabaseConnectionTest();
  test.runAllTests().catch(console.error);
}

module.exports = DatabaseConnectionTest;