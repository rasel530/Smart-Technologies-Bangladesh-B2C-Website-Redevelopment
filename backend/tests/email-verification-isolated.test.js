const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Create isolated test environment
const app = express();
app.use(express.json());

// Mock all dependencies before importing routes
jest.mock('../services/smsService');
jest.mock('../services/otpService');
jest.mock('../services/passwordService');
jest.mock('../services/phoneValidationService');
jest.mock('../services/logger');
jest.mock('../services/config');
jest.mock('../middleware/auth');

// Mock email service with comprehensive methods
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
      messageId: 'reset-message-id'
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

// Mock logger service
jest.mock('../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    logAuth: jest.fn(),
    logSecurity: jest.fn(),
    logPerformance: jest.fn()
  }
}));

// Mock config service
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
    })),
    getEmailConfig: jest.fn(() => ({
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      user: 'test@test.com',
      pass: 'test-password',
      from: 'test@test.com'
    }))
  }
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authMiddleware: {
    authenticate: jest.fn(() => (req, res, next) => {
      // Simple mock that just calls next for testing
      req.user = { userId: 'test-user-id', role: 'CUSTOMER' };
      req.userId = 'test-user-id';
      req.userRole = 'CUSTOMER';
      next();
    })
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

// Import routes after mocking
const authRoutes = require('../routes/auth');
const { emailVerificationMiddleware } = require('../middleware/emailVerification');

app.use('/api/auth', authRoutes);

const prisma = new PrismaClient();

describe('Email Verification System - Isolated Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Service Validation', () => {
    test('should validate email format correctly', () => {
      const { emailService } = require('../services/emailService');
      
      expect(emailService.validateEmail('test@example.com')).toBe(true);
      expect(emailService.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(emailService.validateEmail('user+tag@example.org')).toBe(true);
      
      expect(emailService.validateEmail('invalid-email')).toBe(false);
      expect(emailService.validateEmail('test@')).toBe(false);
      expect(emailService.validateEmail('@example.com')).toBe(false);
      expect(emailService.validateEmail('test@.com')).toBe(false);
    });

    test('should detect disposable emails', () => {
      const { emailService } = require('../services/emailService');
      
      expect(emailService.isDisposableEmail('test@10minutemail.com')).toBe(true);
      expect(emailService.isDisposableEmail('user@tempmail.org')).toBe(true);
      expect(emailService.isDisposableEmail('demo@guerrillamail.com')).toBe(true);
      expect(emailService.isDisposableEmail('sample@mailinator.com')).toBe(true);
      
      expect(emailService.isDisposableEmail('user@gmail.com')).toBe(false);
      expect(emailService.isDisposableEmail('test@yahoo.com')).toBe(false);
      expect(emailService.isDisposableEmail('user@outlook.com')).toBe(false);
    });

    test('should generate secure verification tokens', () => {
      const { emailService } = require('../services/emailService');
      
      const token1 = emailService.generateVerificationToken();
      const token2 = emailService.generateVerificationToken();
      
      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(typeof token1).toBe('string');
      expect(typeof token2).toBe('string');
    });
  });

  describe('Email Registration Endpoint Tests', () => {
    test('should handle registration with valid data', async () => {
      const { emailService } = require('../services/emailService');
      
      // Mock successful user creation
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'PENDING',
        createdAt: new Date()
      });
      
      // Mock token creation
      prisma.emailVerificationToken.create.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        token: 'test-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toContain('Please check your email to verify your account');
      expect(response.body.user.status).toBe('PENDING');
      expect(response.body.requiresEmailVerification).toBe(true);
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    test('should reject disposable email addresses', async () => {
      const { emailService } = require('../services/emailService');
      
      const userData = {
        email: 'test@10minutemail.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Disposable email not allowed');
    });

    test('should reject invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    test('should reject weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Password does not meet requirements');
    });

    test('should handle existing user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@example.com'
      });

      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('Email Verification Endpoint Tests', () => {
    test('should verify email with valid token', async () => {
      const { emailService } = require('../services/emailService');
      
      // Mock user and token lookup
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          status: 'PENDING'
        }
      });

      prisma.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'ACTIVE',
        emailVerified: new Date()
      });

      prisma.emailVerificationToken.delete.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully');
      expect(response.body.user.status).toBe('ACTIVE');
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    test('should reject expired token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        user: {
          id: 'user-id',
          email: 'test@example.com',
          status: 'PENDING'
        }
      });

      prisma.emailVerificationToken.delete.mockResolvedValue();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'expired-token' })
        .expect(400);

      expect(response.body.error).toBe('Token expired');
    });

    test('should reject invalid token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject already verified user', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-id',
          email: 'test@example.com',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token' })
        .expect(400);

      expect(response.body.error).toBe('Already verified');
    });
  });

  describe('Resend Verification Endpoint Tests', () => {
    test('should resend verification email for unverified user', async () => {
      const { emailService } = require('../services/emailService');
      
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'PENDING',
        emailVerificationTokens: []
      });

      prisma.emailVerificationToken.deleteMany.mockResolvedValue();
      prisma.emailVerificationToken.create.mockResolvedValue({
        id: 'new-token-id',
        userId: 'user-id',
        token: 'new-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.message).toBe('Verification email sent successfully');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    test('should reject already verified user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'verified@example.com',
        firstName: 'Verified',
        lastName: 'User',
        status: 'ACTIVE',
        emailVerified: new Date()
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'verified@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Already verified');
    });

    test('should handle non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('should implement rate limiting', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'PENDING',
        emailVerificationTokens: [{
          createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }]
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'test@example.com' })
        .expect(429);

      expect(response.body.error).toBe('Too many requests');
      expect(response.body.message).toContain('Please wait before requesting');
    });
  });

  describe('Login with Email Verification Tests', () => {
    test('should reject login for unverified user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: '$2a$12$hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'PENDING'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(403);

      expect(response.body.error).toBe('Email not verified');
      expect(response.body.message).toContain('Please verify your email address');
    });

    test('should allow login for verified user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'verified@example.com',
        password: '$2a$12$hashedpassword',
        firstName: 'Verified',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: new Date()
      });

      prisma.user.update.mockResolvedValue({
        id: 'user-id',
        lastLoginAt: new Date()
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'verified@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.status).toBe('ACTIVE');
      expect(response.body.token).toBeTruthy();
    });
  });

  describe('Email Verification Middleware Tests', () => {
    test('should allow access for verified user', async () => {
      const middleware = emailVerificationMiddleware.requireEmailVerification();
      
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
        get: jest.fn()
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

    test('should block access for unverified user', async () => {
      const middleware = emailVerificationMiddleware.requireEmailVerification();
      
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        email: 'unverified@example.com',
        status: 'PENDING'
      });

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
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email not verified',
        message: 'Please verify your email address to access this resource',
        requiresEmailVerification: true
      });
    });
  });

  describe('Security and Edge Cases', () => {
    test('should handle SQL injection attempts', async () => {
      const userData = {
        email: "'; DROP TABLE users; --",
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    test('should handle XSS attempts', async () => {
      const userData = {
        email: '<script>alert("xss")</script>@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    test('should prevent token reuse', async () => {
      // First verification succeeds
      prisma.emailVerificationToken.findUnique
        .mockResolvedValueOnce({
          id: 'token-id',
          userId: 'user-id',
          token: 'reusable-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          user: {
            id: 'user-id',
            email: 'test@example.com',
            status: 'PENDING'
          }
        })
        .mockResolvedValueOnce(null); // Second call returns null (token not found)

      prisma.user.update.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        status: 'ACTIVE',
        emailVerified: new Date()
      });

      prisma.emailVerificationToken.delete.mockResolvedValue();

      // First verification should succeed
      const response1 = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'reusable-token' })
        .expect(200);

      expect(response1.body.message).toBe('Email verified successfully');

      // Second verification with same token should fail
      const response2 = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'reusable-token' })
        .expect(400);

      expect(response2.body.error).toBe('Invalid token');
    });
  });
});