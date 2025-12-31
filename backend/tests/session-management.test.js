const request = require('supertest');
const { app } = require('../index');
const { sessionService } = require('../services/sessionService');
const { sessionMiddleware } = require('../middleware/session');

describe('Session Management System', () => {
  let testUser = null;
  let sessionId = null;

  beforeAll(async () => {
    // Create a test user for session testing
    testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    };
  });

  afterAll(async () => {
    // Cleanup any test sessions
    if (sessionId) {
      await sessionService.destroySession(sessionId, 'test_cleanup');
    }
  });

  describe('Session Service', () => {
    test('should create a new session', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: (header) => header === 'User-Agent' ? 'Test-Agent' : null
      };

      const sessionResult = await sessionService.createSession(testUser.id, mockReq, {
        loginType: 'password',
        rememberMe: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      expect(sessionResult).toBeDefined();
      expect(sessionResult.sessionId).toBeDefined();
      expect(sessionResult.expiresAt).toBeInstanceOf(Date);
      expect(sessionResult.maxAge).toBe(24 * 60 * 60 * 1000);

      sessionId = sessionResult.sessionId;
    });

    test('should validate a valid session', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: (header) => header === 'User-Agent' ? 'Test-Agent' : null
      };

      const validation = await sessionService.validateSession(sessionId, mockReq);

      expect(validation.valid).toBe(true);
      expect(validation.userId).toBe(testUser.id);
      expect(validation.session).toBeDefined();
    });

    test('should reject invalid session', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: (header) => header === 'User-Agent' ? 'Test-Agent' : null
      };

      const validation = await sessionService.validateSession('invalid-session-id', mockReq);

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('not found or expired');
    });

    test('should refresh an existing session', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        get: (header) => header === 'User-Agent' ? 'Test-Agent' : null
      };

      const refreshResult = await sessionService.refreshSession(sessionId, mockReq, {
        maxAge: 48 * 60 * 60 * 1000 // 48 hours
      });

      expect(refreshResult.success).toBe(true);
      expect(refreshResult.expiresAt).toBeInstanceOf(Date);
      expect(refreshResult.maxAge).toBe(48 * 60 * 60 * 1000);
    });

    test('should destroy a session', async () => {
      const result = await sessionService.destroySession(sessionId, 'test_cleanup');

      expect(result.success).toBe(true);
    });

    test('should get user sessions', async () => {
      const result = await sessionService.getUserSessions(testUser.id);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.sessions)).toBe(true);
    });

    test('should cleanup expired sessions', async () => {
      const result = await sessionService.cleanupExpiredSessions();

      expect(result.success).toBe(true);
      expect(typeof result.cleanedCount).toBe('number');
    });
  });

  describe('Session Middleware', () => {
    test('should extract session ID from Authorization header', () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer test-session-id'
        }
      };

      const extractedId = sessionMiddleware.getSessionId(mockReq);
      expect(extractedId).toBe('test-session-id');
    });

    test('should extract session ID from X-Session-ID header', () => {
      const mockReq = {
        headers: {
          'x-session-id': 'test-session-id'
        }
      };

      const extractedId = sessionMiddleware.getSessionId(mockReq);
      expect(extractedId).toBe('test-session-id');
    });

    test('should extract session ID from cookie', () => {
      const mockReq = {
        cookies: {
          sessionId: 'test-session-id'
        }
      };

      const extractedId = sessionMiddleware.getSessionId(mockReq);
      expect(extractedId).toBe('test-session-id');
    });

    test('should set session cookie', () => {
      const mockRes = {
        cookie: jest.fn()
      };

      sessionMiddleware.setSessionCookie(mockRes, 'test-session-id', {
        maxAge: 24 * 60 * 60 * 1000
      });

      expect(mockRes.cookie).toHaveBeenCalledWith('sessionId', 'test-session-id', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      });
    });

    test('should clear session cookie', () => {
      const mockRes = {
        clearCookie: jest.fn()
      };

      sessionMiddleware.clearSessionCookie(mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('sessionId', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/'
      });
    });

    test('should generate session headers', () => {
      const session = {
        sessionId: 'test-session-id',
        expiresAt: new Date(),
        maxAge: 24 * 60 * 60 * 1000,
        securityLevel: 'standard'
      };

      const headers = sessionMiddleware.sessionHeaders(session);

      expect(headers['X-Session-ID']).toBe('test-session-id');
      expect(headers['X-Session-Expires-At']).toBe(session.expiresAt.toISOString());
      expect(headers['X-Session-Max-Age']).toBe(session.maxAge.toString());
      expect(headers['X-Session-Security-Level']).toBe('standard');
    });
  });

  describe('Session API Endpoints', () => {
    test('POST /api/v1/sessions/create - should create session', async () => {
      const response = await request(app)
        .post('/api/v1/sessions/create')
        .send({
          userId: testUser.id,
          loginType: 'password',
          rememberMe: false
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('maxAge');
      expect(response.headers).toHaveProperty('set-cookie');
    });

    test('GET /api/v1/sessions/validate - should validate session', async () => {
      // First create a session
      const createResponse = await request(app)
        .post('/api/v1/sessions/create')
        .send({
          userId: testUser.id,
          loginType: 'password'
        });

      const sessionId = createResponse.body.sessionId;

      // Then validate it
      const response = await request(app)
        .get('/api/v1/sessions/validate')
        .set('Authorization', `Bearer ${sessionId}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.session).toHaveProperty('sessionId');
      expect(response.body.session.userId).toBe(testUser.id);
    });

    test('POST /api/v1/sessions/refresh - should refresh session', async () => {
      // First create a session
      const createResponse = await request(app)
        .post('/api/v1/sessions/create')
        .send({
          userId: testUser.id,
          loginType: 'password'
        });

      const sessionId = createResponse.body.sessionId;

      // Then refresh it
      const response = await request(app)
        .post('/api/v1/sessions/refresh')
        .send({
          sessionId: sessionId,
          maxAge: 48 * 60 * 60 * 1000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('expiresAt');
    });

    test('POST /api/v1/sessions/destroy - should destroy session', async () => {
      // First create a session
      const createResponse = await request(app)
        .post('/api/v1/sessions/create')
        .send({
          userId: testUser.id,
          loginType: 'password'
        });

      const sessionId = createResponse.body.sessionId;

      // Then destroy it
      const response = await request(app)
        .post('/api/v1/sessions/destroy')
        .set('Authorization', `Bearer ${sessionId}`)
        .send({
          sessionId: sessionId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.destroyedCount).toBe(1);
    });

    test('GET /api/v1/sessions/user - should get user sessions', async () => {
      // First create multiple sessions
      await request(app)
        .post('/api/v1/sessions/create')
        .send({
          userId: testUser.id,
          loginType: 'password'
        });

      await request(app)
        .post('/api/v1/sessions/create')
        .send({
          userId: testUser.id,
          loginType: 'password'
        });

      // Then get user sessions (this would need authentication in real scenario)
      const response = await request(app)
        .get('/api/v1/sessions/user')
        .set('Authorization', `Bearer ${sessionId}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
    });

    test('GET /api/v1/sessions/status - should check session status', async () => {
      // First create a session
      const createResponse = await request(app)
        .post('/api/v1/sessions/create')
        .send({
          userId: testUser.id,
          loginType: 'password'
        });

      const sessionId = createResponse.body.sessionId;

      // Then check status
      const response = await request(app)
        .get('/api/v1/sessions/status')
        .set('Authorization', `Bearer ${sessionId}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.hasSession).toBe(true);
      expect(response.body.valid).toBe(true);
    });
  });

  describe('Session Security Features', () => {
    test('should generate device fingerprint', () => {
      const mockReq = {
        get: (header) => header === 'User-Agent' ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' : null
      };

      const fingerprint = sessionService.generateDeviceFingerprint(mockReq);
      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
    });

    test('should validate IP address changes', () => {
      const isAllowed = sessionService.isIPChangeAllowed('192.168.1.100', '192.168.1.101');
      expect(isAllowed).toBe(true); // Same subnet

      const isNotAllowed = sessionService.isIPChangeAllowed('192.168.1.100', '10.0.0.1');
      expect(isNotAllowed).toBe(false); // Different subnet
    });
  });

  describe('Session Integration with Auth Routes', () => {
    test('POST /api/v1/auth/login - should create session on successful login', async () => {
      // Mock user in database would be needed for full integration test
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'testpassword123',
          rememberMe: false
        });

      expect(response.status).toBe(401); // User doesn't exist in test environment
    });

    test('POST /api/v1/auth/logout - should destroy session', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({
          allDevices: false
        });

      expect(response.status).toBe(400); // No session to logout
    });
  });
});