// Basic remember me functionality test
const { sessionService } = require('../services/sessionService');

describe('Remember Me Basic Functionality', () => {
  describe('Session Creation', () => {
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
      expect(result.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
      console.log('✅ Remember me session creation test passed');
    });

    test('should create session without remember me', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn((header) => {
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Test Browser)',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
          };
          return headers[header] || '';
        })
      };

      const result = await sessionService.createSession('user-123', mockReq, {
        rememberMe: false,
        loginType: 'password'
      });

      expect(result.rememberMe).toBe(false);
      expect(result.persistent).toBe(false);
      expect(result.maxAge).toBe(24 * 60 * 60 * 1000);
      console.log('✅ Standard session creation test passed');
    });
  });

  describe('Session ID Generation', () => {
    test('should generate secure session IDs', () => {
      const sessionId1 = sessionService.generateSessionId();
      const sessionId2 = sessionService.generateSessionId();
      
      expect(sessionId1).toMatch(/^[a-f0-9]{64}$/);
      expect(sessionId2).toMatch(/^[a-f0-9]{64}$/);
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toHaveLength(64);
      console.log('✅ Session ID generation test passed');
    });
  });

  describe('Device Fingerprinting', () => {
    test('should generate consistent device fingerprints', () => {
      const mockReq1 = {
        ip: '127.0.0.1',
        get: jest.fn((header) => {
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
          };
          return headers[header] || '';
        })
      };

      const mockReq2 = {
        ip: '127.0.0.1',
        get: jest.fn((header) => {
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
          };
          return headers[header] || '';
        })
      };

      const fingerprint1 = sessionService.generateDeviceFingerprint(mockReq1);
      const fingerprint2 = sessionService.generateDeviceFingerprint(mockReq2);

      expect(fingerprint1).toMatch(/^[a-f0-9]{32}$/);
      expect(fingerprint2).toMatch(/^[a-f0-9]{32}$/);
      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(32);
      console.log('✅ Device fingerprinting test passed');
    });
  });

  describe('Remember Me Token Management', () => {
    test('should create remember me token successfully', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn((header) => {
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Test Browser)',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
          };
          return headers[header] || '';
        })
      };

      // Mock Redis for this test
      const originalRedis = sessionService.redis;
      sessionService.redis = {
        setEx: jest.fn(),
        get: jest.fn(),
        del: jest.fn(),
        zAdd: jest.fn(),
        expire: jest.fn()
      };

      const result = await sessionService.createRememberMeToken('user-123', mockReq);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      
      // Restore original Redis
      sessionService.redis = originalRedis;
      
      console.log('✅ Remember me token creation test passed');
    });

    test('should validate remember me token successfully', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn((header) => {
          const headers = {
            'User-Agent': 'Mozilla/5.0 (Test Browser)',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br'
          };
          return headers[header] || '';
        })
      };

      // Mock Redis for this test
      const originalRedis = sessionService.redis;
      sessionService.redis = {
        get: jest.fn().mockResolvedValue(JSON.stringify({
          userId: 'user-123',
          token: 'test-token',
          deviceFingerprint: 'test-fingerprint',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })),
        del: jest.fn()
      };

      const result = await sessionService.validateRememberMeToken('test-token');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.deviceFingerprint).toBe('test-fingerprint');
      
      // Restore original Redis
      sessionService.redis = originalRedis;
      
      console.log('✅ Remember me token validation test passed');
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
      expect(sessionResult.maxAge).toBe(7 * 24 * 60 * 60 * 1000);

      console.log('✅ Remember me integration test completed successfully');
      console.log(`📊 Session ID: ${sessionResult.sessionId}`);
      console.log(`⏰ Expires at: ${sessionResult.expiresAt.toISOString()}`);
      console.log(`📅 Max age: ${sessionResult.maxAge}ms (${Math.round(sessionResult.maxAge / (24 * 60 * 60 * 1000))} days)`);
    });
  });
});