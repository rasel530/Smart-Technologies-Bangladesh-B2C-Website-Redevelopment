const request = require('supertest');
const express = require('express');
const { sessionService } = require('../services/sessionService');
const { sessionMiddleware } = require('../middleware/session');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock services for testing
jest.mock('../services/logger', () => ({
  logSecurity: jest.fn(),
  logAuth: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('../services/config', () => ({
  get: jest.fn((key) => {
    if (key === 'REDIS_URL') return 'redis://localhost:6379';
    return null;
  }),
  isTestingMode: () => true,
  isEmailVerificationDisabled: () => true,
  isPhoneVerificationDisabled: () => true
}));

describe('Remember Me Functionality', () => {
  let server;
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) server.close();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Session Service - Remember Me Features', () => {
    describe('createSession with remember me', () => {
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
        expect(result).toHaveProperty('rememberMe', true);
        expect(result).toHaveProperty('persistent', true);
        expect(result.maxAge).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
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
      });
    });

    describe('Remember Me Token Management', () => {
      test('should create remember me token successfully', async () => {
        const mockReq = {
          ip: '127.0.0.1',
          get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
        };

        const result = await sessionService.createRememberMeToken('user-123', mockReq);

        expect(result.success).toBe(true);
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('expiresAt');
      });

      test('should validate remember me token successfully', async () => {
        const mockReq = {
          ip: '127.0.0.1',
          get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
        };

        // First create a token
        const createResult = await sessionService.createRememberMeToken('user-123', mockReq);
        expect(createResult.success).toBe(true);

        // Then validate it
        const validationResult = await sessionService.validateRememberMeToken(createResult.token);
        expect(validationResult.valid).toBe(true);
        expect(validationResult.userId).toBe('user-123');
      });

      test('should reject expired remember me token', async () => {
        const mockReq = {
          ip: '127.0.0.1',
          get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
        };

        // Create token and manually expire it
        const createResult = await sessionService.createRememberMeToken('user-123', mockReq);
        
        // Mock expiration by directly manipulating Redis
        if (sessionService.redis) {
          const tokenKey = `remember_me:${createResult.token}`;
          await sessionService.redis.del(tokenKey);
        }

        const validationResult = await sessionService.validateRememberMeToken(createResult.token);
        expect(validationResult.valid).toBe(false);
        expect(validationResult.reason).toContain('expired');
      });

      test('should refresh session from remember me token', async () => {
        const mockReq = {
          ip: '127.0.0.1',
          get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
        };

        // Create remember me token
        const tokenResult = await sessionService.createRememberMeToken('user-123', mockReq);
        expect(tokenResult.success).toBe(true);

        // Refresh session from token
        const refreshResult = await sessionService.refreshFromRememberMeToken(tokenResult.token, mockReq);
        expect(refreshResult.success).toBe(true);
        expect(refreshResult).toHaveProperty('sessionId');
        expect(refreshResult).toHaveProperty('expiresAt');
        expect(refreshResult.maxAge).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
      });
    });
  });

  describe('Session Middleware - Remember Me Cookie Management', () => {
    let mockRes;

    beforeEach(() => {
      mockRes = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        headers: {}
      };
    });

    test('should set remember me cookies when enabled', () => {
      sessionMiddleware.setSessionCookie(mockRes, 'session-123', {
        rememberMe: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      expect(mockRes.cookie).toHaveBeenCalledWith('sessionId', 'session-123', expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith('rememberMe', expect.any(String), expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith('rememberMeEnabled', 'true', expect.any(Object));
    });

    test('should not set remember me cookies when disabled', () => {
      sessionMiddleware.setSessionCookie(mockRes, 'session-123', {
        rememberMe: false,
        maxAge: 24 * 60 * 60 * 1000
      });

      expect(mockRes.cookie).toHaveBeenCalledWith('sessionId', 'session-123', expect.any(Object));
      expect(mockRes.cookie).not.toHaveBeenCalledWith('rememberMe', expect.any(String), expect.any(Object));
      expect(mockRes.clearCookie).toHaveBeenCalledWith('rememberMe', expect.any(Object));
      expect(mockRes.clearCookie).toHaveBeenCalledWith('rememberMeEnabled', expect.any(Object));
    });

    test('should clear all remember me cookies on logout', () => {
      sessionMiddleware.clearSessionCookie(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('sessionId', expect.any(Object));
      expect(mockRes.clearCookie).toHaveBeenCalledWith('rememberMe', expect.any(Object));
      expect(mockRes.clearCookie).toHaveBeenCalledWith('rememberMeEnabled', expect.any(Object));
    });
  });

  describe('API Endpoints - Remember Me', () => {
    let testApp;
    let testServer;

    beforeAll(async () => {
      // Import auth routes for testing
      const authRoutes = require('../routes/auth');
      testApp = express();
      testApp.use(express.json());
      testApp.use('/api/v1/auth', authRoutes);
      testServer = testApp.listen(0);
    });

    afterAll(async () => {
      if (testServer) testServer.close();
    });

    test('POST /api/v1/auth/login with remember me true', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'password123',
          rememberMe: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rememberMe', true);
      expect(response.body).toHaveProperty('maxAge', 7 * 24 * 60 * 60 * 1000);
    });

    test('POST /api/v1/auth/login with remember me false', async () => {
      const response = await request(testApp)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'password123',
          rememberMe: false
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rememberMe', false);
      expect(response.body.maxAge).toBe(24 * 60 * 60 * 1000);
    });

    test('POST /api/v1/auth/validate-remember-me', async () => {
      // Mock a valid remember me token
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
      };

      const tokenResult = await sessionService.createRememberMeToken('user-123', mockReq);
      expect(tokenResult.success).toBe(true);

      const response = await request(testApp)
        .post('/api/v1/auth/validate-remember-me')
        .send({
          token: tokenResult.token
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokenValid', true);
      expect(response.body).toHaveProperty('user');
    });

    test('POST /api/v1/auth/refresh-from-remember-me', async () => {
      // Mock a valid remember me token
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
      };

      const tokenResult = await sessionService.createRememberMeToken('user-123', mockReq);
      expect(tokenResult.success).toBe(true);

      const response = await request(testApp)
        .post('/api/v1/auth/refresh-from-remember-me')
        .send({
          token: tokenResult.token
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('rememberMe', true);
      expect(response.body).toHaveProperty('refreshedFrom', 'remember_me_token');
    });

    test('POST /api/v1/auth/disable-remember-me', async () => {
      // Mock authenticated request
      const mockUser = { id: 'user-123' };
      
      const response = await request(testApp)
        .post('/api/v1/auth/disable-remember-me')
        .set('Authorization', 'Bearer mock-session-token')
        .send({
          allDevices: false
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.allDevices).toBe(false);
    });
  });

  describe('Security Features', () => {
    test('should generate secure remember me token', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
      };

      const result = await sessionService.createRememberMeToken('user-123', mockReq);

      expect(result.token).toMatch(/^[a-f0-9]{32}$/); // Hex string
      expect(result.token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    test('should validate device fingerprint for remember me', async () => {
      const mockReq1 = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
      };

      const mockReq2 = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
      };

      // Create token with first device
      const tokenResult = await sessionService.createRememberMeToken('user-123', mockReq1);
      expect(tokenResult.success).toBe(true);

      // Try to refresh with different device fingerprint
      const refreshResult = await sessionService.refreshFromRememberMeToken(tokenResult.token, mockReq2);
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.reason).toContain('Device fingerprint mismatch');
    });

    test('should handle remember me token expiration', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
      };

      const result = await sessionService.createRememberMeToken('user-123', mockReq);
      
      // Fast forward time and check expiration
      jest.useFakeTimers();
      jest.advanceTimersByTime(31 * 24 * 60 * 60 * 1000); // 31 days later

      const validation = await sessionService.validateRememberMeToken(result.token);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('expired');

      jest.useRealTimers();
    });
  });

  describe('Integration Tests', () => {
    test('complete remember me flow', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0 (Test Browser)')
      };

      // Step 1: Login with remember me
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'password123',
          rememberMe: true
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.rememberMe).toBe(true);

      // Step 2: Extract remember me cookie
      const cookies = loginResponse.headers['set-cookie'];
      const rememberMeCookie = cookies.find(cookie => cookie.startsWith('rememberMe='));
      expect(rememberMeCookie).toBeDefined();

      // Step 3: Validate remember me token (would need token extraction in real flow)
      // This is a simplified test - in real flow, token would be extracted from cookie
      const tokenResult = await sessionService.createRememberMeToken('user-123', mockReq);
      expect(tokenResult.success).toBe(true);

      // Step 4: Refresh session using token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh-from-remember-me')
        .send({
          token: tokenResult.token
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.rememberMe).toBe(true);
      expect(refreshResponse.body.sessionId).toBeDefined();
    });
  });
});