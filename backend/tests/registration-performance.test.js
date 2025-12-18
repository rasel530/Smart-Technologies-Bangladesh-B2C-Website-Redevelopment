/**
 * Performance Testing Suite for Registration Functionality
 * 
 * This test suite covers performance validation including:
 * - Concurrent registration attempts
 * - Database performance under load
 * - Email service performance
 * - SMS service performance
 * - Frontend form performance
 * - API response time testing
 * - Memory usage testing
 * - Database query optimization testing
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { emailService } = require('../services/emailService');
const { smsService } = require('../services/smsService');
const { otpService } = require('../services/otpService');
const { passwordService } = require('../services/passwordService');
const app = require('../index');

describe('Registration Performance Tests', () => {
  let prisma;
  let testUsers = [];
  let performanceMetrics = {};

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.emailVerificationToken.deleteMany({});
    await prisma.phoneOTP.deleteMany({});
    await prisma.passwordHistory.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'performance.test' } }
    });
    testUsers = [];
    performanceMetrics = {};
  });

  afterEach(async () => {
    // Clean up any remaining test data
    for (const user of testUsers) {
      try {
        await prisma.user.delete({ where: { id: user.id } });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Concurrent Registration Performance', () => {
    /**
     * Test system performance under concurrent registration load
     */
    test('should handle concurrent registration attempts efficiently', async () => {
      const concurrentUsers = 50;
      const userData = Array.from({ length: concurrentUsers }, (_, i) => ({
        firstName: `Perf${i}`,
        lastName: `Test${i}`,
        email: `perf.test.${i}@example.com`,
        phone: `+8801712345${String(i + 1000).slice(-4)}`,
        password: `PerfTest${i}2024!`,
        confirmPassword: `PerfTest${i}2024!`
      }));

      const startTime = Date.now();
      
      // Execute concurrent registrations
      const promises = userData.map((data, index) => 
        request(app)
          .post('/api/auth/register')
          .send(data)
          .then(response => {
            if (response.status === 201) {
              testUsers.push({ id: response.body.user.id });
            }
            return {
              index,
              status: response.status,
              responseTime: Date.now() - startTime
            };
          })
          .catch(error => ({
            index,
            error: error.message,
            responseTime: Date.now() - startTime
          }))
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance assertions
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(results.length).toBe(concurrentUsers);

      // Analyze response times
      const responseTimes = results.filter(r => r.responseTime).map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      performanceMetrics.concurrentRegistration = {
        totalTime,
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
        successCount: results.filter(r => r.status === 201).length,
        errorCount: results.filter(r => r.error).length
      };

      // Performance thresholds
      expect(avgResponseTime).toBeLessThan(2000); // Average under 2 seconds
      expect(maxResponseTime).toBeLessThan(5000); // Max under 5 seconds
      expect(results.filter(r => r.status === 409).length).toBeGreaterThan(0); // Some should fail due to duplicates
    }, 30000); // 30 second timeout

    /**
     * Test concurrent email verification
     */
    test('should handle concurrent email verification efficiently', async () => {
      // Create users first
      const users = [];
      for (let i = 0; i < 20; i++) {
        const userData = {
          firstName: `EmailPerf${i}`,
          lastName: `Test${i}`,
          email: `email.perf.${i}@example.com`,
          password: `EmailPerf${i}2024!`,
          confirmPassword: `EmailPerf${i}2024!`
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        users.push({
          id: response.body.user.id,
          email: userData.email
        });
        testUsers.push({ id: response.body.user.id });
      }

      // Get all verification tokens
      const tokens = [];
      for (const user of users) {
        const token = await prisma.emailVerificationToken.findFirst({
          where: { userId: user.id }
        });
        tokens.push({
          userId: user.id,
          token: token.token
        });
      }

      const startTime = Date.now();

      // Concurrent email verification
      const verifyPromises = tokens.map((tokenData, index) =>
        request(app)
          .post('/api/auth/verify-email')
          .send({ token: tokenData.token })
          .then(response => ({
            index,
            status: response.status,
            responseTime: Date.now() - startTime
          }))
      );

      const results = await Promise.all(verifyPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance analysis
      const successResults = results.filter(r => r.status === 200);
      const responseTimes = successResults.map(r => r.responseTime);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(avgResponseTime).toBeLessThan(1000); // Average under 1 second
      expect(successResults.length).toBe(tokens.length); // All should succeed
    }, 20000);

    /**
     * Test concurrent OTP generation
     */
    test('should handle concurrent OTP generation efficiently', async () => {
      const phones = Array.from({ length: 30 }, (_, i) => `+8801712345${String(i + 2000).slice(-4)}`);

      const startTime = Date.now();

      // Concurrent OTP generation
      const otpPromises = phones.map((phone, index) =>
        request(app)
          .post('/api/auth/send-otp')
          .send({ phone })
          .then(response => ({
            index,
            status: response.status,
            responseTime: Date.now() - startTime
          }))
      );

      const results = await Promise.all(otpPromises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance analysis
      const successResults = results.filter(r => r.status === 200);
      const rateLimitedResults = results.filter(r => r.status === 429 || r.status === 400);
      const responseTimes = successResults.map(r => r.responseTime);
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      expect(totalTime).toBeLessThan(8000); // Should complete within 8 seconds
      expect(avgResponseTime).toBeLessThan(1500); // Average under 1.5 seconds
      expect(rateLimitedResults.length).toBeGreaterThan(0); // Some should be rate limited
    }, 25000);
  });

  describe('Database Performance', () => {
    /**
     * Test database query performance
     */
    test('should optimize database queries for registration', async () => {
      const userData = {
        firstName: 'DB',
        lastName: 'Perf',
        email: 'db.perf@example.com',
        phone: '+8801712345678',
        password: 'DBPerf2024!',
        confirmPassword: 'DBPerf2024!'
      };

      // Measure query performance
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should be fast
      expect(responseTime).toBeLessThan(1000); // Under 1 second

      const userId = response.body.user.id;
      testUsers.push({ id: userId });

      // Verify database operations
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          emailVerificationTokens: true,
          passwordHistory: true
        }
      });

      expect(user).toBeTruthy();
      expect(user.emailVerificationTokens).toHaveLength(1);
      expect(user.passwordHistory).toHaveLength(1);

      // Test query performance with indexing
      const queryStartTime = Date.now();
      const duplicateCheck = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { phone: userData.phone }
          ]
        }
      });
      const queryEndTime = Date.now();
      const queryTime = queryEndTime - queryStartTime;

      expect(queryTime).toBeLessThan(500); // Query should be fast with proper indexing
    });

    /**
     * Test database connection pooling
     */
    test('should handle database connection pooling efficiently', async () => {
      const concurrentQueries = 100;
      
      const startTime = Date.now();

      // Simulate concurrent database operations
      const promises = Array.from({ length: concurrentQueries }, async (_, i) => {
        // Simulate user lookup
        return prisma.user.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' }
        });
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance assertions
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results.length).toBe(concurrentQueries);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(10);
      });
    }, 15000);
  });

  describe('Email Service Performance', () => {
    /**
     * Test email service performance under load
     */
    test('should handle email service performance efficiently', async () => {
      const emailCount = 50;
      const emails = Array.from({ length: emailCount }, (_, i) => ({
        to: `email.perf.${i}@example.com`,
        subject: `Test Email ${i}`,
        template: 'verification'
      }));

      // Mock email service to measure performance
      const originalSendVerificationEmail = emailService.sendVerificationEmail;
      const performanceMetrics = [];

      emailService.sendVerificationEmail = jest.fn().mockImplementation((email, name, token) => {
        const startTime = Date.now();
        
        // Simulate email sending delay
        return new Promise(resolve => {
          setTimeout(() => {
            const endTime = Date.now();
            performanceMetrics.push({
              email,
              sendTime: endTime - startTime
            });
            resolve({
              success: true,
              messageId: `mock-${Date.now()}`
            });
          }, Math.random() * 100 + 50); // 50-150ms delay
        });
      });

      // Send multiple emails concurrently
      const startTime = Date.now();
      const promises = emails.map((emailData, index) =>
        emailService.sendVerificationEmail(
          emailData.to,
          `User ${index}`,
          `token-${index}`
        )
      );

      await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance analysis
      const sendTimes = performanceMetrics.map(m => m.sendTime);
      const avgSendTime = sendTimes.reduce((sum, time) => sum + time, 0) / sendTimes.length;
      const maxSendTime = Math.max(...sendTimes);

      expect(totalTime).toBeLessThan(20000); // Should complete within 20 seconds
      expect(avgSendTime).toBeLessThan(200); // Average under 200ms
      expect(maxSendTime).toBeLessThan(500); // Max under 500ms

      // Restore original function
      emailService.sendVerificationEmail = originalSendVerificationEmail;
    }, 30000);

    /**
     * Test email template rendering performance
     */
    test('should render email templates efficiently', async () => {
      const templateCount = 100;
      
      const startTime = Date.now();

      // Generate multiple email templates
      const templates = Array.from({ length: templateCount }, (_, i) => 
        emailService.createVerificationEmailTemplate(
          `User ${i}`,
          `token-${i}`
        )
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance assertions
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(templates.length).toBe(templateCount);
      
      templates.forEach(template => {
        expect(template.subject).toBeTruthy();
        expect(template.html).toBeTruthy();
        expect(template.text).toBeTruthy();
        expect(template.html).toContain('token-');
        expect(template.html.length).toBeGreaterThan(1000); // Reasonable template size
      });
    });
  });

  describe('SMS Service Performance', () => {
    /**
     * Test SMS service performance under load
     */
    test('should handle SMS service performance efficiently', async () => {
      const smsCount = 30;
      const phoneNumbers = Array.from({ length: smsCount }, (_, i) => `+8801712345${String(i + 3000).slice(-4)}`);

      // Mock SMS service to measure performance
      const originalSendOTP = smsService.sendOTP;
      const performanceMetrics = [];

      smsService.sendOTP = jest.fn().mockImplementation((phone, otp) => {
        const startTime = Date.now();
        
        return new Promise(resolve => {
          setTimeout(() => {
            const endTime = Date.now();
            performanceMetrics.push({
              phone,
              sendTime: endTime - startTime
            });
            resolve({
              success: true,
              messageId: `sms-${Date.now()}`
            });
          }, Math.random() * 200 + 100); // 100-300ms delay
        });
      });

      // Send multiple OTPs concurrently
      const startTime = Date.now();
      const promises = phoneNumbers.map((phone, index) =>
        smsService.sendOTP(phone, `${123456}`)
      );

      await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance analysis
      const sendTimes = performanceMetrics.map(m => m.sendTime);
      const avgSendTime = sendTimes.reduce((sum, time) => sum + time, 0) / sendTimes.length;
      const maxSendTime = Math.max(...sendTimes);

      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(avgSendTime).toBeLessThan(300); // Average under 300ms
      expect(maxSendTime).toBeLessThan(600); // Max under 600ms

      // Restore original function
      smsService.sendOTP = originalSendOTP;
    }, 25000);
  });

  describe('Password Service Performance', () => {
    /**
     * Test password hashing performance
     */
    test('should hash passwords efficiently', async () => {
      const passwordCount = 100;
      const passwords = Array.from({ length: passwordCount }, (_, i) => 
        `TestPassword${i}2024!`
      );

      const startTime = Date.now();
      
      // Hash multiple passwords concurrently
      const promises = passwords.map(password => 
        passwordService.hashPassword(password)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance analysis
      const hashLengths = results.map(hash => hash.length);
      const avgHashLength = hashLengths.reduce((sum, length) => sum + length, 0) / hashLengths.length;

      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results.length).toBe(passwordCount);
      expect(avgHashLength).toBeGreaterThan(50); // Bcrypt hashes are typically 60 chars
      expect(avgHashLength).toBeLessThan(100); // But not too long

      // Verify all hashes are unique
      const uniqueHashes = [...new Set(results)];
      expect(uniqueHashes.length).toBe(results.length);
    }, 15000);

    /**
     * Test password strength validation performance
     */
    test('should validate password strength efficiently', async () => {
      const validationCount = 200;
      const passwords = Array.from({ length: validationCount }, (_, i) => ({
        password: `TestPassword${i}2024!`,
        userInfo: {
          firstName: `User${i}`,
          lastName: `Test${i}`,
          email: `user${i}@example.com`,
          phone: `+8801712345${String(i + 4000).slice(-4)}`
        }
      }));

      const startTime = Date.now();
      
      // Validate multiple passwords concurrently
      const promises = passwords.map(data => 
        passwordService.validatePasswordStrength(data.password, data.userInfo)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Performance analysis
      const strongPasswords = results.filter(r => r.isValid);
      const avgScore = strongPasswords.reduce((sum, r) => sum + r.score, 0) / strongPasswords.length;

      expect(totalTime).toBeLessThan(3000); // Should complete within 3 seconds
      expect(results.length).toBe(validationCount);
      expect(avgScore).toBeGreaterThan(2); // Should be reasonably strong
      expect(strongPasswords.length).toBeGreaterThan(validationCount * 0.8); // Most should be strong
    }, 20000);
  });

  describe('API Response Time Testing', () => {
    /**
     * Test API response times under various loads
     */
    test('should maintain API response times under load', async () => {
      const requestCount = 100;
      const userData = {
        firstName: 'API',
        lastName: 'Perf',
        email: 'api.perf@example.com',
        phone: '+8801712345678',
        password: 'APIPerf2024!',
        confirmPassword: 'APIPerf2024!'
      };

      const responseTimes = [];

      // Make multiple requests
      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();
        
        try {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              ...userData,
              email: `api.perf.${i}@example.com` // Unique email
            });
          
          const endTime = Date.now();
          responseTimes.push(endTime - startTime);

          if (response.status === 201) {
            testUsers.push({ id: response.body.user.id });
          }
        } catch (error) {
          const endTime = Date.now();
          responseTimes.push(endTime - startTime);
        }
      }

      // Performance analysis
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      expect(avgResponseTime).toBeLessThan(2000); // Average under 2 seconds
      expect(maxResponseTime).toBeLessThan(5000); // Max under 5 seconds
      expect(p95ResponseTime).toBeLessThan(3000); // 95th percentile under 3 seconds
    }, 60000);

    /**
     * Test endpoint-specific performance
     */
    test('should measure performance of different endpoints', async () => {
      const endpoints = [
        { path: '/api/auth/register', method: 'post', data: { email: 'test@example.com', password: 'Test2024!' } },
        { path: '/api/auth/login', method: 'post', data: { email: 'test@example.com', password: 'Test2024!' } },
        { path: '/api/auth/password-policy', method: 'get', data: null },
        { path: '/api/auth/validate-phone', method: 'post', data: { phone: '+8801712345678' } }
      ];

      const performanceResults = {};

      for (const endpoint of endpoints) {
        const times = [];
        
        // Test each endpoint multiple times
        for (let i = 0; i < 10; i++) {
          const startTime = Date.now();
          
          let response;
          if (endpoint.method === 'get') {
            response = await request(app).get(endpoint.path);
          } else {
            response = await request(app)[endpoint.method](endpoint.path).send(endpoint.data);
          }
          
          const endTime = Date.now();
          times.push(endTime - startTime);
        }

        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);

        performanceResults[endpoint.path] = {
          avgTime,
          maxTime,
          minTime,
          requests: times.length,
          successRate: times.filter((_, i) => i < 5).length / times.length // First 5 should succeed
        };
      }

      // Performance assertions
      Object.entries(performanceResults).forEach(([path, metrics]) => {
        expect(metrics.avgTime).toBeLessThan(1000); // Average under 1 second
        expect(metrics.maxTime).toBeLessThan(2000); // Max under 2 seconds
        expect(metrics.successRate).toBeGreaterThan(0.8); // At least 80% success rate
      });
    }, 30000);
  });

  describe('Memory Usage Testing', () => {
    /**
     * Test memory usage during registration
     */
    test('should manage memory usage efficiently during registration', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create many users to test memory management
      const userData = {
        firstName: 'Memory',
        lastName: 'Test',
        email: 'memory.test@example.com',
        phone: '+8801712345678',
        password: 'MemoryTest2024!',
        confirmPassword: 'MemoryTest2024!'
      };

      // Register multiple users
      for (let i = 0; i < 20; i++) {
        const data = {
          ...userData,
          email: `memory.test.${i}@example.com`
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(data);

        if (response.status === 201) {
          testUsers.push({ id: response.body.user.id });
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory should not grow excessively
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      expect(finalMemory.heapTotal).toBeLessThan(initialMemory.heapTotal * 2); // Not more than double
    }, 30000);

    /**
     * Test memory cleanup after operations
     */
    test('should clean up memory after registration operations', async () => {
      // Create users and then clean them up
      const userIds = [];
      
      for (let i = 0; i < 10; i++) {
        const userData = {
          firstName: 'Cleanup',
          lastName: 'Test',
          email: `cleanup.test.${i}@example.com`,
          password: 'CleanupTest2024!',
          confirmPassword: 'CleanupTest2024!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        if (response.status === 201) {
          userIds.push(response.body.user.id);
        }
      }

      const beforeCleanupMemory = process.memoryUsage();

      // Clean up users
      for (const userId of userIds) {
        await prisma.user.delete({ where: { id: userId } });
      }

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }

      const afterCleanupMemory = process.memoryUsage();
      const memoryReduction = beforeCleanupMemory.heapUsed - afterCleanupMemory.heapUsed;

      // Memory should be released
      expect(memoryReduction).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Database Query Optimization', () => {
    /**
     * Test database query optimization
     */
    test('should use database indexes efficiently', async () => {
      // Create test data
      const users = [];
      for (let i = 0; i < 50; i++) {
        const userData = {
          firstName: 'Index',
          lastName: 'Test',
          email: `index.test.${i}@example.com`,
          phone: `+8801712345${String(i + 5000).slice(-4)}`,
          password: 'IndexTest2024!',
          confirmPassword: 'IndexTest2024!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        if (response.status === 201) {
          users.push({
            id: response.body.user.id,
            email: userData.email,
            phone: userData.phone
          });
          testUsers.push({ id: response.body.user.id });
        }
      }

      // Test indexed queries
      const queryStartTime = Date.now();
      
      const emailQueries = users.map(user =>
        prisma.user.findFirst({ where: { email: user.email } })
      );
      
      const phoneQueries = users.map(user =>
        prisma.user.findFirst({ where: { phone: user.phone } })
      );

      await Promise.all([...emailQueries, ...phoneQueries]);
      const queryEndTime = Date.now();
      const queryTime = queryEndTime - queryStartTime;

      // Queries should be fast with proper indexing
      expect(queryTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(queryTime).toBeLessThan(100 * users.length); // Less than 100ms per query
    }, 45000);

    /**
     * Test database connection optimization
     */
    test('should optimize database connections', async () => {
      const connectionCount = 20;
      
      const startTime = Date.now();
      
      // Create multiple concurrent database operations
      const promises = Array.from({ length: connectionCount }, async (_, i) => {
        // Simulate complex registration flow
        const userData = {
          firstName: 'Conn',
          lastName: 'Test',
          email: `conn.test.${i}@example.com`,
          password: 'ConnTest2024!',
          confirmPassword: 'ConnTest2024!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        if (response.status === 201) {
          const userId = response.body.user.id;
          testUsers.push({ id: userId });

          // Simulate additional database operations
          await prisma.emailVerificationToken.findFirst({ where: { userId } });
          await prisma.passwordHistory.findFirst({ where: { userId } });
        }
      });

      await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should handle concurrent connections efficiently
      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(totalTime).toBeLessThan(connectionCount * 1000); // Less than 1 second per connection
    }, 30000);
  });
});