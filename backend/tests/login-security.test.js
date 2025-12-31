const request = require('supertest');
const { expect } = require('chai');
const { PrismaClient } = require('@prisma/client');
const { loginSecurityService } = require('../services/loginSecurityService');
const { configService } = require('../services/config');
const { app } = require('../index');

describe('Login Security Service', () => {
  let prisma;
  let testUser;
  let testUserId;

  before(async () => {
    // Initialize test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    });

    // Create test user
    const hashedPassword = await require('bcryptjs').hash('TestPassword123!', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'test-security@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    });
    testUserId = testUser.id;

    // Initialize login security service
    await loginSecurityService.initialize();
  });

  after(async () => {
    // Cleanup test data
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId }
      });
    }
    
    await prisma.$disconnect();
    await loginSecurityService.cleanup();
  });

  beforeEach(async () => {
    // Clear Redis data before each test
    await loginSecurityService.clearTestData();
  });

  describe('Failed Login Attempt Tracking', () => {
    it('should track failed login attempts', async () => {
      const testIP = '192.168.1.100';
      const testIdentifier = 'test-security@example.com';
      
      // Simulate multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await loginSecurityService.recordFailedAttempt(testIP, testIdentifier, 'invalid_password');
      }

      // Check if attempts are tracked
      const attempts = await loginSecurityService.getFailedAttempts(testIP, testIdentifier);
      expect(attempts).to.equal(3);
      
      // Check if user is approaching lockout
      const isLocked = await loginSecurityService.isUserLocked(testIdentifier);
      expect(isLocked).to.be.false;
    });

    it('should lock user after max failed attempts', async () => {
      const testIP = '192.168.1.101';
      const testIdentifier = 'test-security@example.com';
      
      // Simulate max failed attempts
      for (let i = 0; i < 5; i++) {
        await loginSecurityService.recordFailedAttempt(testIP, testIdentifier, 'invalid_password');
      }

      // Check if user is locked
      const isLocked = await loginSecurityService.isUserLocked(testIdentifier);
      expect(isLocked).to.be.true;
      
      // Check lockout time
      const lockoutInfo = await loginSecurityService.getLockoutInfo(testIdentifier);
      expect(lockoutInfo).to.have.property('lockedUntil');
      expect(lockoutInfo).to.have.property('remainingTime');
    });

    it('should clear failed attempts after successful login', async () => {
      const testIP = '192.168.1.102';
      const testIdentifier = 'test-security@example.com';
      
      // Add failed attempts
      await loginSecurityService.recordFailedAttempt(testIP, testIdentifier, 'invalid_password');
      
      // Record successful login
      await loginSecurityService.recordSuccessfulLogin(testIP, testIdentifier, testUserId);
      
      // Check if attempts are cleared
      const attempts = await loginSecurityService.getFailedAttempts(testIP, testIdentifier);
      expect(attempts).to.equal(0);
      
      // Check if user is not locked
      const isLocked = await loginSecurityService.isUserLocked(testIdentifier);
      expect(isLocked).to.be.false;
    });
  });

  describe('IP-based Blocking', () => {
    it('should track IP-based failed attempts', async () => {
      const testIP = '192.168.1.200';
      const testIdentifier1 = 'test1@example.com';
      const testIdentifier2 = 'test2@example.com';
      
      // Simulate failed attempts from same IP
      await loginSecurityService.recordFailedAttempt(testIP, testIdentifier1, 'invalid_password');
      await loginSecurityService.recordFailedAttempt(testIP, testIdentifier2, 'invalid_password');
      
      // Check IP attempts
      const ipAttempts = await loginSecurityService.getIPAttempts(testIP);
      expect(ipAttempts).to.equal(2);
    });

    it('should block IP after max failed attempts', async () => {
      const testIP = '192.168.1.201';
      
      // Simulate max IP failed attempts
      for (let i = 0; i < 10; i++) {
        await loginSecurityService.recordFailedAttempt(testIP, `test${i}@example.com`, 'invalid_password');
      }

      // Check if IP is blocked
      const isBlocked = await loginSecurityService.isIPBlocked(testIP);
      expect(isBlocked).to.be.true;
      
      // Check block info
      const blockInfo = await loginSecurityService.getIPBlockInfo(testIP);
      expect(blockInfo).to.have.property('blockedUntil');
      expect(blockInfo).to.have.property('remainingTime');
    });

    it('should allow login from different IP after IP block', async () => {
      const blockedIP = '192.168.1.201';
      const allowedIP = '192.168.1.202';
      const testIdentifier = 'test-security@example.com';
      
      // Block the first IP
      for (let i = 0; i < 10; i++) {
        await loginSecurityService.recordFailedAttempt(blockedIP, `test${i}@example.com`, 'invalid_password');
      }

      // Try login from blocked IP (should fail)
      const isBlocked1 = await loginSecurityService.isIPBlocked(blockedIP);
      expect(isBlocked1).to.be.true;

      // Try login from allowed IP (should succeed)
      const isBlocked2 = await loginSecurityService.isIPBlocked(allowedIP);
      expect(isBlocked2).to.be.false;
    });
  });

  describe('Progressive Delay', () => {
    it('should apply progressive delay for failed attempts', async () => {
      const testIP = '192.168.1.300';
      const testIdentifier = 'test-security@example.com';
      
      const startTime = Date.now();
      
      // Simulate failed attempts
      for (let i = 0; i < 3; i++) {
        await loginSecurityService.recordFailedAttempt(testIP, testIdentifier, 'invalid_password');
      }

      // Check if delay is applied
      const delayInfo = await loginSecurityService.getDelayInfo(testIP, testIdentifier);
      expect(delayInfo).to.have.property('delay');
      expect(delayInfo.delay).to.be.greaterThan(0);
      
      // Delay should increase with more attempts
      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).to.be.greaterThan(delayInfo.delay);
    });

    it('should not apply delay for successful login', async () => {
      const testIP = '192.168.1.301';
      const testIdentifier = 'test-security@example.com';
      
      // Add failed attempts
      await loginSecurityService.recordFailedAttempt(testIP, testIdentifier, 'invalid_password');
      
      // Record successful login
      await loginSecurityService.recordSuccessfulLogin(testIP, testIdentifier, testUserId);
      
      // Check if delay is cleared
      const delayInfo = await loginSecurityService.getDelayInfo(testIP, testIdentifier);
      expect(delayInfo.delay).to.equal(0);
    });
  });

  describe('Device Fingerprinting', () => {
    it('should track device fingerprints', async () => {
      const testIP = '192.168.1.400';
      const testIdentifier = 'test-security@example.com';
      const deviceFingerprint = 'test-device-fingerprint-123';
      
      // Record login with device fingerprint
      await loginSecurityService.recordSuccessfulLogin(testIP, testIdentifier, testUserId, deviceFingerprint);
      
      // Check if device is tracked
      const deviceInfo = await loginSecurityService.getDeviceInfo(testUserId, deviceFingerprint);
      expect(deviceInfo).to.have.property('lastSeen');
      expect(deviceInfo).to.have.property('loginCount');
      expect(deviceInfo.loginCount).to.equal(1);
    });

    it('should detect suspicious login from new device', async () => {
      const testIP = '192.168.1.401';
      const testIdentifier = 'test-security@example.com';
      const knownDeviceFingerprint = 'known-device-123';
      const newDeviceFingerprint = 'new-device-456';
      
      // Record successful login with known device
      await loginSecurityService.recordSuccessfulLogin(testIP, testIdentifier, testUserId, knownDeviceFingerprint);
      
      // Check suspicious activity for new device
      const suspiciousCheck = await loginSecurityService.checkSuspiciousActivity(
        testIP, 
        testIdentifier, 
        newDeviceFingerprint, 
        testUserId
      );
      expect(suspiciousCheck.isSuspicious).to.be.true;
      expect(suspiciousCheck.reason).to.include('new device');
    });
  });

  describe('Captcha Verification', () => {
    it('should require captcha after threshold attempts', async () => {
      const testIP = '192.168.1.500';
      const testIdentifier = 'test-security@example.com';
      
      // Simulate attempts up to captcha threshold
      for (let i = 0; i < 3; i++) {
        await loginSecurityService.recordFailedAttempt(testIP, testIdentifier, 'invalid_password');
      }

      // Check if captcha is required
      const captchaRequired = await loginSecurityService.isCaptchaRequired(testIP, testIdentifier);
      expect(captchaRequired).to.be.true;
    });

    it('should not require captcha for new users', async () => {
      const testIP = '192.168.1.501';
      const testIdentifier = 'new-user@example.com';
      
      // Check if captcha is required for new user
      const captchaRequired = await loginSecurityService.isCaptchaRequired(testIP, testIdentifier);
      expect(captchaRequired).to.be.false;
    });
  });

  describe('Security Context', () => {
    it('should provide comprehensive security context', async () => {
      const testIP = '192.168.1.600';
      const testIdentifier = 'test-security@example.com';
      const deviceFingerprint = 'test-device-789';
      
      // Record some failed attempts
      await loginSecurityService.recordFailedAttempt(testIP, testIdentifier, 'invalid_password');
      
      // Get security context
      const securityContext = await loginSecurityService.getSecurityContext(
        testIP, 
        testIdentifier, 
        deviceFingerprint
      );
      
      expect(securityContext).to.have.property('riskScore');
      expect(securityContext).to.have.property('requiresCaptcha');
      expect(securityContext).to.have.property('isLocked');
      expect(securityContext).to.have.property('isIPBlocked');
      expect(securityContext).to.have.property('delayMs');
      expect(securityContext).to.have.property('attemptsRemaining');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login requests per IP', async () => {
      const testIP = '192.168.1.700';
      
      // Make multiple rapid login attempts
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/login')
            .set('X-Forwarded-For', testIP)
            .send({
              identifier: 'test-security@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const results = await Promise.allSettled(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = results.filter(result => 
        result.status === 'fulfilled' && 
        result.value.status === 429
      );
      
      expect(rateLimitedResponses.length).to.be.greaterThan(0);
    });
  });

  describe('Integration with Auth Routes', () => {
    it('should enforce security on login endpoint', async () => {
      const testIP = '192.168.1.800';
      const testIdentifier = 'test-security@example.com';
      
      // Simulate failed attempts to trigger security measures
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', testIP)
          .send({
            identifier: testIdentifier,
            password: 'wrongpassword'
          });
      }

      // Next login attempt should be blocked
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', testIP)
        .send({
          identifier: testIdentifier,
          password: 'TestPassword123!'
        });

      expect(response.status).to.equal(423);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('locked');
    });

    it('should allow successful login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '192.168.1.900')
        .send({
          identifier: 'test-security@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('token');
      expect(response.body).to.have.property('sessionId');
      expect(response.body).to.have.property('securityContext');
    });
  });

  describe('Data Cleanup', () => {
    it('should cleanup expired security data', async () => {
      const testIP = '192.168.1.999';
      const testIdentifier = 'cleanup-test@example.com';
      
      // Add old failed attempts
      await loginSecurityService.recordFailedAttempt(testIP, testIdentifier, 'invalid_password');
      
      // Manually expire the data for testing
      await loginSecurityService.expireOldData(Date.now() + 1000);
      
      // Check if data is cleaned up
      const attempts = await loginSecurityService.getFailedAttempts(testIP, testIdentifier);
      expect(attempts).to.equal(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Mock Redis connection failure
      const originalConnect = loginSecurityService.connect;
      loginSecurityService.connect = () => {
        throw new Error('Redis connection failed');
      };

      try {
        await loginSecurityService.recordFailedAttempt('192.168.1.1000', 'test@example.com', 'invalid_password');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Redis connection failed');
      }

      // Restore original function
      loginSecurityService.connect = originalConnect;
    });

    it('should handle database errors gracefully', async () => {
      // Mock database failure
      const originalUserFind = prisma.user.findUnique;
      prisma.user.findUnique = () => {
        throw new Error('Database connection failed');
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test-security@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).to.equal(500);
      expect(response.body).to.have.property('error');

      // Restore original function
      prisma.user.findUnique = originalUserFind;
    });
  });

  describe('Performance', () => {
    it('should handle high volume of login attempts efficiently', async () => {
      const startTime = Date.now();
      const promises = [];
      
      // Simulate 100 concurrent login attempts
      for (let i = 0; i < 100; i++) {
        promises.push(
          loginSecurityService.recordFailedAttempt(
            `192.168.1.${i}`, 
            `user${i}@example.com`, 
            'invalid_password'
          )
        );
      }

      await Promise.all(promises);
      const endTime = Date.now();
      
      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).to.be.lessThan(5000);
    });
  });
});