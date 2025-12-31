// Simple verification test for remember me functionality
const { sessionService } = require('../services/sessionService');
const { sessionMiddleware } = require('../middleware/session');

describe('Remember Me Verification Tests', () => {
  describe('Core Session Creation', () => {
    test('should create session with remember me enabled', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
      };

      const result = await sessionService.createSession('user-123', mockReq, {
        rememberMe: true,
        loginType: 'password'
      });

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('maxAge');
      expect(result.rememberMe).toBe(true);
      expect(result.persistent).toBe(true);
      expect(result.maxAge).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
      console.log('✅ Remember me session creation test passed');
    });

    test('should create session without remember me', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
      };

      const result = await sessionService.createSession('user-123', mockReq, {
        rememberMe: false,
        loginType: 'password'
      });

      expect(result.rememberMe).toBe(false);
      expect(result.persistent).toBe(false);
      expect(result.maxAge).toBe(24 * 60 * 60 * 1000); // 24 hours
      console.log('✅ Standard session creation test passed');
    });
  });

  describe('Cookie Management', () => {
    test('should set remember me cookies when enabled', () => {
      const mockRes = {
        cookie: jest.fn(),
        headers: {}
      };

      sessionMiddleware.setSessionCookie(mockRes, 'session-123', {
        rememberMe: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      expect(mockRes.cookie).toHaveBeenCalledWith('sessionId', 'session-123', expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith('rememberMe', expect.any(String), expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith('rememberMeEnabled', 'true', expect.any(Object));
      console.log('✅ Remember me cookie setting test passed');
    });

    test('should not set remember me cookies when disabled', () => {
      const mockRes = {
        cookie: jest.fn(),
        headers: {}
      };

      sessionMiddleware.setSessionCookie(mockRes, 'session-123', {
        rememberMe: false,
        maxAge: 24 * 60 * 60 * 1000
      });

      expect(mockRes.cookie).toHaveBeenCalledWith('sessionId', 'session-123', expect.any(Object));
      expect(mockRes.cookie).not.toHaveBeenCalledWith('rememberMe', expect.any(String), expect.any(Object));
      expect(mockRes.clearCookie).toHaveBeenCalledWith('rememberMe', expect.any(Object));
      console.log('✅ Standard cookie setting test passed');
    });
  });

  describe('Session Service Methods', () => {
    test('should generate secure session ID', () => {
      const sessionId1 = sessionService.generateSessionId();
      const sessionId2 = sessionService.generateSessionId();
      
      expect(sessionId1).toMatch(/^[a-f0-9]{32}$/);
      expect(sessionId2).toMatch(/^[a-f0-9]{32}$/);
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toHaveLength(64);
      console.log('✅ Session ID generation test passed');
    });

    test('should generate device fingerprint', () => {
      const mockReq1 = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
      };

      const mockReq2 = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
      };

      const fingerprint1 = sessionService.generateDeviceFingerprint(mockReq1);
      const fingerprint2 = sessionService.generateDeviceFingerprint(mockReq2);

      expect(fingerprint1).toMatch(/^[a-f0-9]{32}$/);
      expect(fingerprint2).toMatch(/^[a-f0-9]{32}$/);
      expect(fingerprint1).not.toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(32);
      console.log('✅ Device fingerprinting test passed');
    });
  });

  describe('Integration Test', () => {
    test('should demonstrate complete remember me flow', async () => {
      console.log('🧪 Starting remember me integration test...');
      
      // Step 1: Create session with remember me
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
      };

      const sessionResult = await sessionService.createSession('user-123', mockReq, {
        rememberMe: true,
        loginType: 'password'
      });

      expect(sessionResult.success !== undefined).toBe(true);
      expect(sessionResult.rememberMe).toBe(true);
      expect(sessionResult.persistent).toBe(true);

      // Step 2: Verify session exists
      expect(sessionResult.sessionId).toBeDefined();
      expect(sessionResult.expiresAt).toBeInstanceOf(Date);

      // Step 3: Test session configuration
      expect(sessionResult.maxAge).toBe(7 * 24 * 60 * 60 * 1000);

      console.log('✅ Remember me integration test completed successfully');
      console.log(`📊 Session ID: ${sessionResult.sessionId}`);
      console.log(`⏰ Expires at: ${sessionResult.expiresAt.toISOString()}`);
      console.log(`📅 Max age: ${sessionResult.maxAge}ms (${Math.round(sessionResult.maxAge / (24 * 60 * 60 * 1000)} days)`);
    });
  });
});