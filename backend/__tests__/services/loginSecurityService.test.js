/**
 * Login security service testing
 * Tests rate limiting, account lockout, IP blocking, and security features
 */

const { LoginSecurityService } = require('../../services/loginSecurityService');
const { TestHelpers } = require('../utils/testHelpers');

describe('LoginSecurityService', () => {
  let loginSecurityService;
  let testHelpers;
  let testUser;

  beforeAll(async () => {
    testHelpers = new TestHelpers();
    loginSecurityService = new LoginSecurityService();
  });

  afterAll(async () => {
    await testHelpers.disconnect();
  });

  beforeEach(async () => {
    testUser = await testHelpers.createTestUser();
  });

  afterEach(async () => {
    await testHelpers.cleanup();
  });

  describe('Failed Login Attempt Recording', () => {
    /**
     * Test recording failed login attempts
     * Verifies attempt tracking works
     */
    it('should record failed login attempt successfully', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';
      const userAgent = 'Test Browser 1.0';

      await loginSecurityService.recordFailedAttempt(identifier, ip, userAgent);

      const stats = await loginSecurityService.getLoginAttemptStats(identifier, ip);

      expect(stats.userAttempts).toBe(1);
      expect(stats.ipAttempts).toBe(1);
    });

    /**
     * Test recording multiple failed attempts
     * Verifies attempt accumulation
     */
    it('should accumulate multiple failed attempts', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';
      const userAgent = 'Test Browser 1.0';

      // Record multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, userAgent);
      }

      const stats = await loginSecurityService.getLoginAttemptStats(identifier, ip);

      expect(stats.userAttempts).toBe(3);
      expect(stats.ipAttempts).toBe(3);
    });
  });

  describe('User Lockout', () => {
    /**
     * Test user lockout after max attempts
     * Verifies account protection
     */
    it('should lock out user after maximum failed attempts', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';
      const userAgent = 'Test Browser 1.0';

      // Record maximum failed attempts
      const config = loginSecurityService.getSecurityConfig();
      for (let i = 0; i < config.maxAttempts; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, userAgent);
      }

      const lockoutStatus = await loginSecurityService.isUserLockedOut(identifier);

      expect(lockoutStatus.isLocked).toBe(true);
      expect(lockoutStatus.reason).toBe('too_many_attempts');
      expect(lockoutStatus.expiresAt).toBeDefined();
      expect(lockoutStatus.remainingTime).toBeGreaterThan(0);
    });

    /**
     * Test user lockout duration
     * Verifies lockout time is respected
     */
    it('should respect lockout duration', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';
      const userAgent = 'Test Browser 1.0';

      // Lock out user
      const config = loginSecurityService.getSecurityConfig();
      for (let i = 0; i < config.maxAttempts; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, userAgent);
      }

      const lockoutStatus = await loginSecurityService.isUserLockedOut(identifier);
      expect(lockoutStatus.isLocked).toBe(true);

      // Clear failed attempts (simulating successful login after lockout period)
      await new Promise(resolve => setTimeout(resolve, 100));
      await loginSecurityService.clearFailedAttempts(identifier, ip);

      // User should still be locked until duration expires
      const stillLockedStatus = await loginSecurityService.isUserLockedOut(identifier);
      expect(stillLockedStatus.isLocked).toBe(true);
    });

    /**
     * Test lockout clearing after successful login
     * Verifies lockout removal
     */
    it('should clear lockout after successful login', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';
      const userAgent = 'Test Browser 1.0';

      // Lock out user
      const config = loginSecurityService.getSecurityConfig();
      for (let i = 0; i < config.maxAttempts; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, userAgent);
      }

      const lockoutStatus = await loginSecurityService.isUserLockedOut(identifier);
      expect(lockoutStatus.isLocked).toBe(true);

      // Clear failed attempts (successful login)
      await loginSecurityService.clearFailedAttempts(identifier, ip);

      const afterClearStatus = await loginSecurityService.isUserLockedOut(identifier);
      expect(afterClearStatus.isLocked).toBe(false);
    });
  });

  describe('IP Blocking', () => {
    /**
     * Test IP blocking after excessive attempts
     * Verifies IP-based protection
     */
    it('should block IP after excessive failed attempts', async () => {
      const ip = '192.168.1.200';
      const userAgent = 'Test Browser 1.0';

      // Record excessive IP attempts
      const config = loginSecurityService.getSecurityConfig();
      for (let i = 0; i < config.ipMaxAttempts; i++) {
        await loginSecurityService.recordFailedAttempt('user@test.com', ip, userAgent);
      }

      const blockStatus = await loginSecurityService.isIPBlocked(ip);

      expect(blockStatus.isBlocked).toBe(true);
      expect(blockStatus.reason).toBe('too_many_attempts');
      expect(blockStatus.expiresAt).toBeDefined();
      expect(blockStatus.remainingTime).toBeGreaterThan(0);
    });

    /**
     * Test IP block duration
     * Verifies block time is respected
     */
    it('should respect IP block duration', async () => {
      const ip = '192.168.1.200';
      const userAgent = 'Test Browser 1.0';

      // Block IP
      const config = loginSecurityService.getSecurityConfig();
      for (let i = 0; i < config.ipMaxAttempts; i++) {
        await loginSecurityService.recordFailedAttempt('user@test.com', ip, userAgent);
      }

      const blockStatus = await loginSecurityService.isIPBlocked(ip);
      expect(blockStatus.isBlocked).toBe(true);

      // Check stats
      const stats = await loginSecurityService.getLoginAttemptStats(null, ip);
      expect(stats.isIPBlocked).toBe(true);
    });
  });

  describe('Progressive Delay', () => {
    /**
     * Test progressive delay calculation
     * Verifies delay increases with attempts
     */
    it('should calculate progressive delay based on attempts', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';

      // No attempts should have no delay
      let delay = await loginSecurityService.calculateProgressiveDelay(identifier, ip);
      expect(delay).toBe(0);

      // Add attempts and check delay increase
      const config = loginSecurityService.getSecurityConfig();
      for (let i = 1; i <= 4; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, 'Test Browser');
        delay = await loginSecurityService.calculateProgressiveDelay(identifier, ip);
        
        const expectedDelay = Math.min(
          config.baseDelay * Math.pow(2, i - 1),
          config.maxDelay
        );
        expect(delay).toBe(expectedDelay);
      }
    });

    /**
     * Test maximum delay limit
     * Verifies delay doesn't exceed maximum
     */
    it('should not exceed maximum delay', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';
      const config = loginSecurityService.getSecurityConfig();

      // Add many attempts
      for (let i = 0; i < 20; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, 'Test Browser');
      }

      const delay = await loginSecurityService.calculateProgressiveDelay(identifier, ip);
      expect(delay).toBeLessThanOrEqual(config.maxDelay);
    });
  });

  describe('Captcha Requirement', () => {
    /**
     * Test captcha requirement threshold
     * Verifies captcha triggers after threshold
     */
    it('should require captcha after threshold attempts', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';
      const userAgent = 'Test Browser 1.0';

      // Below threshold
      const config = loginSecurityService.getSecurityConfig();
      for (let i = 0; i < config.captchaThreshold - 1; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, userAgent);
      }

      let captchaRequired = await loginSecurityService.isCaptchaRequired(identifier, ip);
      expect(captchaRequired).toBe(false);

      // At threshold
      await loginSecurityService.recordFailedAttempt(identifier, ip, userAgent);
      captchaRequired = await loginSecurityService.isCaptchaRequired(identifier, ip);
      expect(captchaRequired).toBe(true);
    });
  });

  describe('Suspicious Pattern Detection', () => {
    /**
     * Test malicious user agent detection
     * Verifies automated tool detection
     */
    it('should detect malicious user agents', async () => {
      const maliciousAgents = testHelpers.createSecurityTestData().maliciousUserAgents;

      for (const userAgent of maliciousAgents) {
        const suspicious = await loginSecurityService.checkSuspiciousPatterns(
          'test@example.com',
          '192.168.1.100',
          userAgent
        );

        expect(suspicious.isSuspicious).toBe(true);
        expect(suspicious.reasons).toContain('malicious_user_agent');
        expect(suspicious.riskScore).toBeGreaterThan(0);
      }
    });

    /**
     * Test high volume attempt detection
     * Verifies brute force detection
     */
    it('should detect high volume attempts', async () => {
      const ip = '192.168.1.200';
      const userAgent = 'Test Browser 1.0';

      // Make many attempts from same IP
      for (let i = 0; i < 15; i++) {
        await loginSecurityService.recordFailedAttempt('user@test.com', ip, userAgent);
      }

      const suspicious = await loginSecurityService.checkSuspiciousPatterns(
        'test@example.com',
        ip,
        userAgent
      );

      expect(suspicious.isSuspicious).toBe(true);
      expect(suspicious.reasons).toContain('high_attempt_volume');
    });

    /**
     * Test rapid successive attempts
     * Verifies rapid attack detection
     */
    it('should detect rapid successive attempts', async () => {
      const ip = '192.168.1.200';
      const userAgent = 'Test Browser 1.0';

      // Make rapid attempts
      for (let i = 0; i < 6; i++) {
        await loginSecurityService.recordFailedAttempt('user@test.com', ip, userAgent);
        // No delay between attempts
      }

      const suspicious = await loginSecurityService.checkSuspiciousPatterns(
        'test@example.com',
        ip,
        userAgent
      );

      expect(suspicious.isSuspicious).toBe(true);
      expect(suspicious.reasons).toContain('rapid_attempts');
    });
  });

  describe('Device Fingerprinting', () => {
    /**
     * Test device fingerprint generation
     * Verifies consistent fingerprint creation
     */
    it('should generate consistent device fingerprint', async () => {
      const req1 = testHelpers.mockRequest({
        get: jest.fn((header) => {
          const headers = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          };
          return headers[header.toLowerCase()];
        })
      });

      const req2 = testHelpers.mockRequest({
        get: jest.fn((header) => {
          const headers = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          };
          return headers[header.toLowerCase()];
        })
      });

      const fingerprint1 = loginSecurityService.generateDeviceFingerprint(req1);
      const fingerprint2 = loginSecurityService.generateDeviceFingerprint(req2);

      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toMatch(/^[a-f0-9]{32}$/); // 32 character hex
    });

    /**
     * Test device fingerprint uniqueness
     * Verifies different browsers create different fingerprints
     */
    it('should create different fingerprints for different browsers', async () => {
      const chromeReq = testHelpers.mockRequest({
        get: jest.fn((header) => {
          const headers = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
          };
          return headers[header.toLowerCase()];
        })
      });

      const firefoxReq = testHelpers.mockRequest({
        get: jest.fn((header) => {
          const headers = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
          };
          return headers[header.toLowerCase()];
        })
      });

      const chromeFingerprint = loginSecurityService.generateDeviceFingerprint(chromeReq);
      const firefoxFingerprint = loginSecurityService.generateDeviceFingerprint(firefoxReq);

      expect(chromeFingerprint).not.toBe(firefoxFingerprint);
    });
  });

  describe('Statistics and Monitoring', () => {
    /**
     * Test login attempt statistics
     * Verifies comprehensive stats collection
     */
    it('should provide comprehensive login statistics', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';

      // Record some attempts
      for (let i = 0; i < 3; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, 'Test Browser');
      }

      const stats = await loginSecurityService.getLoginAttemptStats(identifier, ip);

      expect(stats).toHaveProperty('userAttempts', 3);
      expect(stats).toHaveProperty('ipAttempts', 3);
      expect(stats).toHaveProperty('isUserLocked', false);
      expect(stats).toHaveProperty('isIPBlocked', false);
      expect(stats).toHaveProperty('captchaRequired', false);
      expect(stats).toHaveProperty('progressiveDelay');
    });

    /**
     * Test security configuration
     * Verifies configuration is accessible
     */
    it('should provide security configuration', () => {
      const config = loginSecurityService.getSecurityConfig();

      expect(config).toHaveProperty('maxAttempts');
      expect(config).toHaveProperty('attemptWindow');
      expect(config).toHaveProperty('lockoutDuration');
      expect(config).toHaveProperty('ipMaxAttempts');
      expect(config).toHaveProperty('ipBlockDuration');
      expect(config).toHaveProperty('delayEnabled');
      expect(config).toHaveProperty('baseDelay');
      expect(config).toHaveProperty('maxDelay');
      expect(config).toHaveProperty('captchaThreshold');
      expect(config).toHaveProperty('captchaEnabled');

      // Verify default values
      expect(config.maxAttempts).toBeGreaterThan(0);
      expect(config.attemptWindow).toBeGreaterThan(0);
      expect(config.lockoutDuration).toBeGreaterThan(0);
    });
  });

  describe('Cleanup Operations', () => {
    /**
     * Test expired data cleanup
     * Verifies automatic cleanup works
     */
    it('should clean up expired security data', async () => {
      // Create some expired data by making attempts
      const identifier = testUser.email;
      const ip = '192.168.1.100';

      for (let i = 0; i < 5; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, 'Test Browser');
      }

      const cleanupResult = await loginSecurityService.cleanupExpiredData();

      expect(cleanupResult.success).toBe(true);
      // Fresh data shouldn't be cleaned up
      expect(cleanupResult.cleanedCount).toBe(0);
    });
  });

  describe('Redis Fallback', () => {
    /**
     * Test database fallback when Redis unavailable
     * Verifies graceful degradation
     */
    it('should fallback to database when Redis is unavailable', async () => {
      // Mock Redis as unavailable
      loginSecurityService.redis = null;

      const identifier = testUser.email;
      const ip = '192.168.1.100';

      // Should not throw error
      await expect(
        loginSecurityService.recordFailedAttempt(identifier, ip, 'Test Browser')
      ).resolves.not.toThrow();

      // Stats should return default values
      const stats = await loginSecurityService.getLoginAttemptStats(identifier, ip);
      expect(stats.userAttempts).toBe(0);
      expect(stats.ipAttempts).toBe(0);
    });
  });

  describe('Security Integration', () => {
    /**
     * Test complete security workflow
     * Verifies all security features work together
     */
    it('should handle complete security workflow', async () => {
      const identifier = testUser.email;
      const ip = '192.168.1.100';
      const userAgent = 'Test Browser 1.0';

      // Initial state
      let stats = await loginSecurityService.getLoginAttemptStats(identifier, ip);
      expect(stats.userAttempts).toBe(0);
      expect(stats.captchaRequired).toBe(false);

      // After some attempts
      const config = loginSecurityService.getSecurityConfig();
      for (let i = 0; i < config.captchaThreshold; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, userAgent);
      }

      stats = await loginSecurityService.getLoginAttemptStats(identifier, ip);
      expect(stats.userAttempts).toBe(config.captchaThreshold);
      expect(stats.captchaRequired).toBe(true);
      expect(stats.progressiveDelay).toBeGreaterThan(0);

      // After maximum attempts
      for (let i = config.captchaThreshold; i < config.maxAttempts; i++) {
        await loginSecurityService.recordFailedAttempt(identifier, ip, userAgent);
      }

      const lockoutStatus = await loginSecurityService.isUserLockedOut(identifier);
      expect(lockoutStatus.isLocked).toBe(true);

      // Clear attempts (successful login)
      await loginSecurityService.clearFailedAttempts(identifier, ip);

      const afterClearStats = await loginSecurityService.getLoginAttemptStats(identifier, ip);
      expect(afterClearStats.userAttempts).toBe(0);
      expect(afterClearStats.captchaRequired).toBe(false);
    });
  });
});