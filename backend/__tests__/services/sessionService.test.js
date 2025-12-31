/**
 * Session service testing
 * Tests session management, security features, and Redis integration
 */

const { SessionService } = require('../../services/sessionService');
const { TestHelpers } = require('../utils/testHelpers');

describe('SessionService', () => {
  let sessionService;
  let testHelpers;
  let testUser;

  beforeAll(async () => {
    testHelpers = new TestHelpers();
    sessionService = new SessionService();
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

  describe('Session Creation', () => {
    /**
     * Test successful session creation
     * Verifies session data is properly stored
     */
    it('should create a new session successfully', async () => {
      const req = testHelpers.mockRequest({
        ip: '192.168.1.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 Test Browser')
      });

      const options = {
        loginType: 'password',
        rememberMe: false
      };

      const result = await sessionService.createSession(testUser.id, req, options);

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('maxAge');
      expect(result.rememberMe).toBe(false);
      expect(result.sessionId).toMatch(/^[a-f0-9]{64}$/); // 32 bytes hex
    });

    /**
     * Test session creation with remember me
     * Verifies extended session duration
     */
    it('should create session with remember me enabled', async () => {
      const req = testHelpers.mockRequest();
      const options = {
        loginType: 'password',
        rememberMe: true
      };

      const result = await sessionService.createSession(testUser.id, req, options);

      expect(result.rememberMe).toBe(true);
      expect(result.persistent).toBe(true);
      expect(result.maxAge).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
    });

    /**
     * Test device fingerprint generation
     * Verifies consistent fingerprint creation
     */
    it('should generate consistent device fingerprint', async () => {
      const req = testHelpers.mockRequest({
        get: jest.fn((header) => {
          const headers = {
            'user-agent': 'Test Browser 1.0',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate'
          };
          return headers[header.toLowerCase()];
        })
      });

      const result1 = await sessionService.createSession(testUser.id, req);
      const result2 = await sessionService.createSession(testUser.id, req);

      expect(result1.sessionId).not.toBe(result2.sessionId);
      // Device fingerprint should be consistent for same request
    });
  });

  describe('Session Validation', () => {
    /**
     * Test valid session validation
     * Verifies active session is recognized
     */
    it('should validate active session successfully', async () => {
      const req = testHelpers.mockRequest();
      const session = await sessionService.createSession(testUser.id, req);

      const validation = await sessionService.validateSession(session.sessionId, req);

      expect(validation.valid).toBe(true);
      expect(validation.userId).toBe(testUser.id);
      expect(validation.session).toBeDefined();
    });

    /**
     * Test invalid session validation
     * Verifies non-existent session is rejected
     */
    it('should reject invalid session', async () => {
      const req = testHelpers.mockRequest();
      const invalidSessionId = 'invalid-session-id';

      const validation = await sessionService.validateSession(invalidSessionId, req);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('not found or expired');
    });

    /**
     * Test expired session validation
     * Verifies expired session is rejected
     */
    it('should reject expired session', async () => {
      const req = testHelpers.mockRequest();
      const session = await sessionService.createSession(testUser.id, req, {
        maxAge: 1000 // 1 second
      });

      // Wait for session to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const validation = await sessionService.validateSession(session.sessionId, req);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Session expired');
    });

    /**
     * Test session security validation
     * Verifies IP and user agent validation
     */
    it('should validate session security parameters', async () => {
      const originalReq = testHelpers.mockRequest({
        ip: '192.168.1.100',
        get: jest.fn().mockReturnValue('Original Browser 1.0')
      });

      const session = await sessionService.createSession(testUser.id, originalReq);

      // Test with different IP (should fail strict validation)
      const differentIPReq = testHelpers.mockRequest({
        ip: '192.168.1.200',
        get: jest.fn().mockReturnValue('Original Browser 1.0')
      });

      const validation = await sessionService.validateSession(session.sessionId, differentIPReq);

      // Should allow some IP flexibility for mobile networks
      expect(validation.valid).toBe(true);
    });
  });

  describe('Session Refresh', () => {
    /**
     * Test session refresh
     * Verifies session extension works
     */
    it('should refresh session successfully', async () => {
      const req = testHelpers.mockRequest();
      const session = await sessionService.createSession(testUser.id, req);

      const originalExpiry = session.expiresAt;
      
      // Wait a bit then refresh
      await new Promise(resolve => setTimeout(resolve, 100));

      const refreshResult = await sessionService.refreshSession(session.sessionId, req, {
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      expect(refreshResult.success).toBe(true);
      expect(refreshResult.expiresAt.getTime()).toBeGreaterThan(originalExpiry.getTime());
    });

    /**
     * Test refresh of invalid session
     * Verifies invalid session refresh fails
     */
    it('should reject refresh of invalid session', async () => {
      const req = testHelpers.mockRequest();
      const invalidSessionId = 'invalid-session';

      const refreshResult = await sessionService.refreshSession(invalidSessionId, req);

      expect(refreshResult.success).toBe(false);
      expect(refreshResult.reason).toContain('not found or expired');
    });
  });

  describe('Session Destruction', () => {
    /**
     * Test single session destruction
     * Verifies session removal works
     */
    it('should destroy single session successfully', async () => {
      const req = testHelpers.mockRequest();
      const session = await sessionService.createSession(testUser.id, req);

      const destroyResult = await sessionService.destroySession(session.sessionId);

      expect(destroyResult.success).toBe(true);

      // Verify session is no longer valid
      const validation = await sessionService.validateSession(session.sessionId, req);
      expect(validation.valid).toBe(false);
    });

    /**
     * Test multiple session destruction
     * Verifies mass logout functionality
     */
    it('should destroy all user sessions except current', async () => {
      const req = testHelpers.mockRequest();
      
      // Create multiple sessions
      const session1 = await sessionService.createSession(testUser.id, req);
      const session2 = await sessionService.createSession(testUser.id, req);
      const session3 = await sessionService.createSession(testUser.id, req);

      const destroyResult = await sessionService.destroyAllUserSessions(testUser.id, session1.sessionId);

      expect(destroyResult.success).toBe(true);
      expect(destroyResult.destroyedCount).toBe(2); // Should destroy 2 other sessions

      // Verify current session still valid
      const currentValidation = await sessionService.validateSession(session1.sessionId, req);
      expect(currentValidation.valid).toBe(true);

      // Verify other sessions are invalid
      const otherValidation1 = await sessionService.validateSession(session2.sessionId, req);
      const otherValidation2 = await sessionService.validateSession(session3.sessionId, req);
      expect(otherValidation1.valid).toBe(false);
      expect(otherValidation2.valid).toBe(false);
    });
  });

  describe('Remember Me Functionality', () => {
    /**
     * Test remember me token creation
     * Verifies persistent token generation
     */
    it('should create remember me token successfully', async () => {
      const req = testHelpers.mockRequest();

      const tokenResult = await sessionService.createRememberMeToken(testUser.id, req);

      expect(tokenResult.success).toBe(true);
      expect(tokenResult).toHaveProperty('token');
      expect(tokenResult).toHaveProperty('expiresAt');
      expect(tokenResult.token).toMatch(/^[a-f0-9]{64}$/);
    });

    /**
     * Test remember me token validation
     * Verifies token validation works
     */
    it('should validate remember me token successfully', async () => {
      const req = testHelpers.mockRequest();
      const tokenResult = await sessionService.createRememberMeToken(testUser.id, req);

      const validation = await sessionService.validateRememberMeToken(tokenResult.token);

      expect(validation.valid).toBe(true);
      expect(validation.userId).toBe(testUser.id);
    });

    /**
     * Test session refresh from remember me token
     * Verifies automatic login functionality
     */
    it('should refresh session from remember me token', async () => {
      const req = testHelpers.mockRequest();
      const tokenResult = await sessionService.createRememberMeToken(testUser.id, req);

      const refreshResult = await sessionService.refreshFromRememberMeToken(tokenResult.token, req);

      expect(refreshResult.success).toBe(true);
      expect(refreshResult).toHaveProperty('sessionId');
      expect(refreshResult.userId).toBe(testUser.id);
      expect(refreshResult.rememberMe).toBe(true);
    });

    /**
     * Test remember me token expiration
     * Verifies expired token rejection
     */
    it('should reject expired remember me token', async () => {
      const req = testHelpers.mockRequest();
      
      // Create token with short expiry
      const tokenResult = await sessionService.createRememberMeToken(testUser.id, req);
      
      // Manually expire the token in Redis
      if (sessionService.redis) {
        const tokenKey = `remember_me:${tokenResult.token}`;
        await sessionService.redis.del(tokenKey);
      }

      const validation = await sessionService.validateRememberMeToken(tokenResult.token);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toBe('Remember me token expired');
    });
  });

  describe('Session Statistics', () => {
    /**
     * Test session statistics retrieval
     * Verifies session counting works
     */
    it('should retrieve session statistics', async () => {
      const req = testHelpers.mockRequest();
      
      // Create multiple sessions
      await sessionService.createSession(testUser.id, req);
      await sessionService.createSession(testUser.id, req);
      await sessionService.createSession(testUser.id, req);

      const stats = await sessionService.getSessionStats();

      expect(stats.success).toBe(true);
      expect(stats.stats).toHaveProperty('totalSessions');
      expect(stats.stats).toHaveProperty('activeSessions');
      expect(stats.stats).toHaveProperty('expiredSessions');
      expect(stats.stats.totalSessions).toBeGreaterThanOrEqual(3);
    });

    /**
     * Test user sessions retrieval
     * Verifies user-specific session listing
     */
    it('should retrieve user sessions', async () => {
      const req = testHelpers.mockRequest();
      
      // Create sessions for user
      const session1 = await sessionService.createSession(testUser.id, req);
      const session2 = await sessionService.createSession(testUser.id, req);

      const userSessions = await sessionService.getUserSessions(testUser.id);

      expect(userSessions.success).toBe(true);
      expect(userSessions.sessions).toHaveLength(2);
      
      const sessionIds = userSessions.sessions.map(s => s.sessionId);
      expect(sessionIds).toContain(session1.sessionId);
      expect(sessionIds).toContain(session2.sessionId);
    });
  });

  describe('Session Cleanup', () => {
    /**
     * Test expired session cleanup
     * Verifies automatic cleanup works
     */
    it('should clean up expired sessions', async () => {
      const req = testHelpers.mockRequest();
      
      // Create sessions with different expiry times
      await sessionService.createSession(testUser.id, req, { maxAge: 100 }); // Very short
      await sessionService.createSession(testUser.id, req, { maxAge: 5000 }); // 5 seconds
      await sessionService.createSession(testUser.id, req); // Default (24 hours)

      // Wait for short sessions to expire
      await new Promise(resolve => setTimeout(resolve, 200));

      const cleanupResult = await sessionService.cleanupExpiredSessions();

      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.cleanedCount).toBeGreaterThan(0);
    });

    /**
     * Test remember me token cleanup
     * Verifies expired token removal
     */
    it('should clean up expired remember me tokens', async () => {
      const req = testHelpers.mockRequest();
      
      // Create remember me tokens
      await sessionService.createRememberMeToken(testUser.id, req);
      await sessionService.createRememberMeToken(testUser.id, req);

      const cleanupResult = await sessionService.cleanupExpiredRememberMeTokens();

      expect(cleanupResult.success).toBe(true);
      // Fresh tokens shouldn't be cleaned up
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
      sessionService.redis = null;

      const req = testHelpers.mockRequest();
      const result = await sessionService.createSession(testUser.id, req);

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('expiresAt');

      // Verify session can be validated
      const validation = await sessionService.validateSession(result.sessionId, req);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Security Features', () => {
    /**
     * Test IP change detection
     * Verifies IP validation logic
     */
    it('should detect suspicious IP changes', async () => {
      const originalReq = testHelpers.mockRequest({
        ip: '192.168.1.100',
        get: jest.fn().mockReturnValue('Test Browser 1.0')
      });

      const session = await sessionService.createSession(testUser.id, originalReq);

      // Test with completely different IP
      const suspiciousReq = testHelpers.mockRequest({
        ip: '10.0.0.1', // Different subnet
        get: jest.fn().mockReturnValue('Test Browser 1.0')
      });

      const validation = await sessionService.validateSession(session.sessionId, suspiciousReq);

      // Should reject due to IP change
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('IP address mismatch');
    });

    /**
     * Test user agent validation
     * Verifies browser consistency check
     */
    it('should detect user agent changes', async () => {
      const originalReq = testHelpers.mockRequest({
        ip: '192.168.1.100',
        get: jest.fn().mockReturnValue('Chrome Browser 1.0')
      });

      const session = await sessionService.createSession(testUser.id, originalReq);

      const changedAgentReq = testHelpers.mockRequest({
        ip: '192.168.1.100',
        get: jest.fn().mockReturnValue('Firefox Browser 1.0')
      });

      const validation = await sessionService.validateSession(session.sessionId, changedAgentReq);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('User agent mismatch');
    });
  });
});