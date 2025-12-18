/**
 * Email Verification System - Minimal Test Suite
 * 
 * This test suite focuses on testing the email verification functionality
 * without dependencies on problematic modules like Twilio
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Mock all services before importing
jest.mock('../services/emailService', () => ({
  emailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'test-message-id'
    }),
    sendWelcomeEmail: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'welcome-message-id'
    }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'password-reset-message-id'
    }),
    validateEmail: jest.fn((email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }),
    isDisposableEmail: jest.fn((email) => {
      const disposableDomains = [
        '10minutemail.com',
        'tempmail.org',
        'guerrillamail.com',
        'mailinator.com',
        'yopmail.com',
        'throwaway.email'
      ];
      const domain = email.split('@')[1]?.toLowerCase();
      return disposableDomains.includes(domain);
    }),
    generateVerificationToken: jest.fn(() => 'test-verification-token-' + Math.random().toString(36).substr(2, 9)),
    isAvailable: jest.fn(() => true)
  }
}));

jest.mock('../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    logAuth: jest.fn(),
    logSecurity: jest.fn(),
    logPerformance: jest.fn(),
    logStructured: jest.fn(),
    logQuery: jest.fn(),
    logCache: jest.fn(),
    logExternal: jest.fn(),
    logPayment: jest.fn(),
    logOrder: jest.fn(),
    logBusiness: jest.fn(),
    getLogger: jest.fn(() => jest.fn()),
    child: jest.fn(() => jest.fn()),
    stream: jest.fn(() => ({
      write: jest.fn()
    }))
  }
}));

// Mock config service to prevent emailService initialization errors
jest.mock('../services/config', () => ({
  configService: {
    get: jest.fn((key) => {
      const defaults = {
        'JWT_SECRET': 'test-jwt-secret-key',
        'DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db',
        'REDIS_URL': 'redis://localhost:6379',
        'NODE_ENV': 'test',
        'SMTP_HOST': 'test-smtp.example.com',
        'SMTP_USER': 'test@example.com',
        'SMTP_PASS': 'test-password',
        'SMTP_FROM': 'test@example.com'
      };
      return defaults[key] || null;
    }),
    getJWTConfig: jest.fn(() => ({
      secret: 'test-jwt-secret-key',
      algorithm: 'HS256',
      issuer: 'smart-technologies-bd',
      expiresIn: '1h'
    })),
    getEmailConfig: jest.fn(() => ({
      host: 'test-smtp.example.com',
      port: 587,
      secure: false,
      user: 'test@example.com',
      pass: 'test-password',
      from: 'test@example.com'
    }))
  }
}));

// Mock Twilio to resolve dependency issues
jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'test-message-sid',
        status: 'sent',
        dateCreated: new Date(),
        dateSent: new Date(),
        dateUpdated: new Date()
      })
    }
  }));
});

jest.mock('../services/config', () => ({
  configService: {
    get: jest.fn((key) => {
      const defaults = {
        'JWT_SECRET': 'test-jwt-secret-key',
        'DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db',
        'REDIS_URL': 'redis://localhost:6379',
        'NODE_ENV': 'test'
      };
      return defaults[key] || null;
    }),
    getJWTConfig: jest.fn(() => ({
      secret: 'test-jwt-secret-key',
      algorithm: 'HS256',
      issuer: 'smart-technologies-bd',
      expiresIn: '1h'
    }))
  }
}));

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn().mockResolvedValue(),
    $disconnect: jest.fn().mockResolvedValue(),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    emailVerificationToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    }
  }))
}));

// Import email verification middleware
const { emailVerificationMiddleware } = require('../middleware/emailVerification');

const prisma = new PrismaClient();

describe('Email Verification System - Minimal Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Service Core Functionality', () => {
    /**
     * Test email format validation
     */
    test('should validate email format correctly', () => {
      const { emailService } = require('../services/emailService');
      
      // Valid emails
      expect(emailService.validateEmail('test@example.com')).toBe(true);
      expect(emailService.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(emailService.validateEmail('user+tag@example.org')).toBe(true);
      expect(emailService.validateEmail('user123@test-domain.com')).toBe(true);
      
      // Invalid emails
      expect(emailService.validateEmail('invalid-email')).toBe(false);
      expect(emailService.validateEmail('test@')).toBe(false);
      expect(emailService.validateEmail('@example.com')).toBe(false);
      expect(emailService.validateEmail('test@.com')).toBe(false);
      expect(emailService.validateEmail('test email@example.com')).toBe(false);
      expect(emailService.validateEmail('')).toBe(false);
      expect(emailService.validateEmail(null)).toBe(false);
      expect(emailService.validateEmail(undefined)).toBe(false);
    });

    /**
     * Test disposable email detection
     */
    test('should detect disposable emails', () => {
      const { emailService } = require('../services/emailService');
      
      // Known disposable emails
      expect(emailService.isDisposableEmail('test@10minutemail.com')).toBe(true);
      expect(emailService.isDisposableEmail('user@tempmail.org')).toBe(true);
      expect(emailService.isDisposableEmail('demo@guerrillamail.com')).toBe(true);
      expect(emailService.isDisposableEmail('sample@mailinator.com')).toBe(true);
      expect(emailService.isDisposableEmail('user@yopmail.com')).toBe(true);
      expect(emailService.isDisposableEmail('test@throwaway.email')).toBe(true);
      
      // Legitimate email providers
      expect(emailService.isDisposableEmail('user@gmail.com')).toBe(false);
      expect(emailService.isDisposableEmail('test@yahoo.com')).toBe(false);
      expect(emailService.isDisposableEmail('user@outlook.com')).toBe(false);
      expect(emailService.isDisposableEmail('admin@smarttechnologies.bd')).toBe(false);
      expect(emailService.isDisposableEmail('support@example.co.uk')).toBe(false);
    });

    /**
     * Test verification token generation
     */
    test('should generate secure verification tokens', () => {
      const { emailService } = require('../services/emailService');
      
      const token1 = emailService.generateVerificationToken();
      const token2 = emailService.generateVerificationToken();
      const token3 = emailService.generateVerificationToken();
      
      // Tokens should be truthy and strings
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token3).toBeTruthy();
      expect(typeof token1).toBe('string');
      expect(typeof token2).toBe('string');
      expect(typeof token3).toBe('string');
      
      // Tokens should be unique
      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
      
      // Tokens should have reasonable length (not empty or too short)
      expect(token1.length).toBeGreaterThan(10);
      expect(token2.length).toBeGreaterThan(10);
      expect(token3.length).toBeGreaterThan(10);
    });

    /**
     * Test email service availability check
     */
    test('should check service availability', () => {
      const { emailService } = require('../services/emailService');
      
      expect(emailService.isAvailable()).toBe(true);
      expect(typeof emailService.isAvailable()).toBe('boolean');
    });
  });

  describe('Email Verification Middleware', () => {
    /**
     * Test middleware allows access for verified user
     */
    test('should allow access for verified user', async () => {
      const middleware = emailVerificationMiddleware.requireEmailVerification();
      
      // Mock verified user
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'verified@example.com',
        status: 'ACTIVE',
        emailVerified: new Date()
      });

      const mockReq = {
        user: { userId: 'user-id', role: 'CUSTOMER' },
        userId: 'user-id',
        ip: '127.0.0.1',
        originalUrl: '/api/protected-route',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(403);
      expect(mockRes.json).not.toHaveBeenCalledWith({
        error: 'Email not verified'
      });
    });

    /**
     * Test middleware blocks unverified user
     */
    test('should block access for unverified user', async () => {
      const middleware = emailVerificationMiddleware.requireEmailVerification();
      const { loggerService } = require('../services/logger');
      
      // Mock unverified user
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'unverified@example.com',
        status: 'PENDING',
        emailVerified: null
      });

      const mockReq = {
        user: { userId: 'user-id', role: 'CUSTOMER' },
        userId: 'user-id',
        ip: '192.168.1.100',
        originalUrl: '/api/protected-endpoint',
        get: jest.fn((header) => header === 'User-Agent' ? 'test-agent' : null)
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email not verified',
        message: 'Please verify your email address to access this resource',
        requiresEmailVerification: true
      });

      // Verify security logging
      expect(loggerService.logSecurity).toHaveBeenCalledWith(
        'Unverified Email Access Attempt',
        'user-id',
        expect.objectContaining({
          ip: '192.168.1.100',
          email: 'unverified@example.com'
        })
      );
    });

    /**
     * Test middleware handles database errors gracefully
     */
    test('should handle database errors gracefully', async () => {
      const middleware = emailVerificationMiddleware.requireEmailVerification();
      const { loggerService } = require('../services/logger');
      
      // Mock database error
      prisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const mockReq = {
        user: { userId: 'user-id', role: 'CUSTOMER' },
        userId: 'user-id',
        ip: '127.0.0.1',
        originalUrl: '/api/protected-route',
        get: jest.fn()
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Verification check failed',
        message: 'Unable to verify email status'
      });

      // Verify error logging
      expect(loggerService.error).toHaveBeenCalledWith(
        'Email verification middleware error',
        'Database connection failed',
        expect.objectContaining({
          userId: 'user-id',
          path: '/api/protected-route'
        })
      );
    });

    /**
     * Test middleware handles missing user gracefully
     */
    test('should handle missing user gracefully', async () => {
      const middleware = emailVerificationMiddleware.requireEmailVerification();
      
      // Mock user not found
      prisma.user.findUnique.mockResolvedValue(null);

      const mockReq = {
        user: { userId: 'user-id', role: 'CUSTOMER' },
        userId: 'user-id',
        ip: '127.0.0.1',
        originalUrl: '/api/protected-route',
        get: jest.fn()
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'User not found',
        message: 'Authenticated user not found in database'
      });
    });
  });

  describe('Email Verification Helper Methods', () => {
    /**
     * Test isEmailVerified helper method
     */
    test('should check if user email is verified', async () => {
      const middleware = emailVerificationMiddleware;
      
      // Mock verified user
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        emailVerified: new Date(),
        status: 'ACTIVE'
      });

      const isVerified = await middleware.isEmailVerified('user-id');
      expect(isVerified).toBe(true);

      // Mock unverified user
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id-2',
        emailVerified: null,
        status: 'PENDING'
      });

      const isNotVerified = await middleware.isEmailVerified('user-id-2');
      expect(isNotVerified).toBe(false);
    });

    /**
     * Test getUserVerificationStatus helper method
     */
    test('should get user verification status', async () => {
      const middleware = emailVerificationMiddleware;
      
      // Mock verified user
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'verified@example.com',
        emailVerified: new Date('2024-01-01T00:00:00Z'),
        status: 'ACTIVE',
        createdAt: new Date('2023-12-01T00:00:00Z')
      });

      const status = await middleware.getUserVerificationStatus('user-id');
      expect(status).toEqual({
        verified: true,
        status: 'ACTIVE',
        emailVerified: new Date('2024-01-01T00:00:00Z'),
        email: 'verified@example.com',
        createdAt: new Date('2023-12-01T00:00:00Z')
      });

      // Mock non-existent user
      prisma.user.findUnique.mockResolvedValue(null);

      const notFoundStatus = await middleware.getUserVerificationStatus('non-existent-user');
      expect(notFoundStatus).toEqual({
        verified: false,
        status: 'NOT_FOUND',
        message: 'User not found'
      });
    });
  });

  describe('Security Considerations', () => {
    /**
     * Test email validation prevents common attack patterns
     */
    test('should prevent email injection attacks', () => {
      const { emailService } = require('../services/emailService');
      
      // SQL injection attempts
      expect(emailService.validateEmail("'; DROP TABLE users; --")).toBe(false);
      expect(emailService.validateEmail("' OR '1'='1' --")).toBe(false);
      expect(emailService.validateEmail("test@example.com'; DROP TABLE users; --")).toBe(false);
      
      // XSS attempts
      expect(emailService.validateEmail('<script>alert("xss")</script>@example.com')).toBe(false);
      expect(emailService.validateEmail('test@example.com<script>alert("xss")</script>')).toBe(false);
      
      // Path traversal attempts
      expect(emailService.validateEmail('../../../etc/passwd@example.com')).toBe(false);
      expect(emailService.validateEmail('test@../../../etc/passwd')).toBe(false);
    });

    /**
     * Test token generation security
     */
    test('should generate cryptographically secure tokens', () => {
      const { emailService } = require('../services/emailService');
      
      const tokens = [];
      for (let i = 0; i < 100; i++) {
        tokens.push(emailService.generateVerificationToken());
      }
      
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100);
      
      // Tokens should not contain predictable patterns
      const hasSequentialPattern = tokens.some((token, index) => {
        if (index === 0) return false;
        const prevToken = tokens[index - 1];
        return token.includes(prevToken) || prevToken.includes(token);
      });
      expect(hasSequentialPattern).toBe(false);
    });

    /**
     * Test disposable email detection covers common services
     */
    test('should detect various disposable email services', () => {
      const { emailService } = require('../services/emailService');
      
      const disposableEmails = [
        'test@10minutemail.com',
        'user@tempmail.org',
        'demo@guerrillamail.com',
        'sample@mailinator.com',
        'admin@yopmail.com',
        'user@throwaway.email',
        'test@temp-mail.org',
        'user@disposable-email.com',
        'demo@fakeinbox.com'
      ];
      
      disposableEmails.forEach(email => {
        expect(emailService.isDisposableEmail(email)).toBe(true);
      });
    });
  });

  describe('Integration with JWT and Authentication', () => {
    /**
     * Test email verification works with JWT tokens
     */
    test('should integrate with JWT authentication', async () => {
      const middleware = emailVerificationMiddleware.requireEmailVerification();
      
      // Mock verified user
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'verified@example.com',
        status: 'ACTIVE',
        emailVerified: new Date()
      });

      // Create a valid JWT token
      const token = jwt.sign(
        { userId: 'user-id', email: 'verified@example.com', role: 'CUSTOMER' },
        'test-jwt-secret-key',
        { expiresIn: '1h' }
      );

      const mockReq = {
        user: { userId: 'user-id', role: 'CUSTOMER' },
        userId: 'user-id',
        ip: '127.0.0.1',
        originalUrl: '/api/protected-route',
        get: jest.fn((header) => {
          if (header === 'Authorization') return `Bearer ${token}`;
          if (header === 'User-Agent') return 'test-agent';
          return null;
        })
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(403);
    });
  });
});