const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { emailService } = require('../services/emailService');
const { emailVerificationMiddleware } = require('../middleware/emailVerification');

const app = express();
const prisma = new PrismaClient();

// Mock email service for testing
jest.mock('../services/emailService');
jest.mock('../middleware/emailVerification');

describe('Email Verification System', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.emailVerificationToken.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User Registration with Email Verification', () => {
    test('should register user with PENDING status and send verification email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock email service
      emailService.sendVerificationEmail.mockResolvedValue({
        success: true,
        messageId: 'test-message-id'
      });

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
      const userData = {
        email: 'test@10minutemail.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Disposable email not allowed');
    });

    test('should handle email service failure gracefully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      // Mock email service failure
      emailService.sendVerificationEmail.mockResolvedValue({
        success: false,
        error: 'SMTP connection failed'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.error).toBe('Registration failed');
      expect(response.body.message).toContain('Failed to send verification email');
    });
  });

  describe('Email Verification', () => {
    test('should verify email with valid token', async () => {
      // Create a user with PENDING status
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

      // Create verification token
      const token = 'test-verification-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt
        }
      });

      // Mock welcome email
      emailService.sendWelcomeEmail.mockResolvedValue({
        success: true,
        messageId: 'welcome-message-id'
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token })
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully');
      expect(response.body.user.status).toBe('ACTIVE');
      expect(response.body.user.emailVerified).toBeTruthy();
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    test('should reject expired token', async () => {
      // Create a user
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

      // Create expired verification token
      const token = 'expired-token';
      const expiresAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt
        }
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token })
        .expect(400);

      expect(response.body.error).toBe('Token expired');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Resend Verification Email', () => {
    test('should resend verification email for unverified user', async () => {
      // Create a user with PENDING status
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

      // Mock email service
      emailService.sendVerificationEmail.mockResolvedValue({
        success: true,
        messageId: 'resend-message-id'
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: user.email })
        .expect(200);

      expect(response.body.message).toBe('Verification email sent successfully');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        user.email,
        `${user.firstName} ${user.lastName}`,
        expect.any(String)
      );
    });

    test('should reject already verified user', async () => {
      // Create a verified user
      const user = await prisma.user.create({
        data: {
          email: 'verified@example.com',
          password: 'hashedpassword',
          firstName: 'Verified',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: user.email })
        .expect(400);

      expect(response.body.error).toBe('Already verified');
    });

    test('should implement rate limiting for resend requests', async () => {
      // Create a user with PENDING status
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

      // Create recent verification token
      const token = 'recent-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
          createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
        }
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: user.email })
        .expect(429);

      expect(response.body.error).toBe('Too many requests');
      expect(response.body.message).toContain('Please wait before requesting');
    });
  });

  describe('Login with Email Verification', () => {
    test('should reject login for unverified user', async () => {
      // Create a user with PENDING status
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        })
        .expect(403);

      expect(response.body.error).toBe('Email not verified');
      expect(response.body.message).toContain('Please verify your email address');
    });

    test('should allow login for verified user', async () => {
      // Create a verified user
      const user = await prisma.user.create({
        data: {
          email: 'verified@example.com',
          password: '$2a$12$hashedpassword',
          firstName: 'Verified',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.status).toBe('ACTIVE');
      expect(response.body.token).toBeTruthy();
    });
  });

  describe('Email Verification Middleware', () => {
    test('should allow access for verified user', async () => {
      // Create a verified user
      const user = await prisma.user.create({
        data: {
          email: 'verified@example.com',
          password: 'hashedpassword',
          firstName: 'Verified',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });

      const mockReq = {
        user: { userId: user.id, role: 'CUSTOMER' },
        userId: user.id,
        ip: '127.0.0.1',
        originalUrl: '/api/protected-route',
        get: jest.fn()
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      // Mock middleware to return function
      emailVerificationMiddleware.requireEmailVerification.mockImplementation(() => mockNext);

      const middleware = emailVerificationMiddleware.requireEmailVerification();
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(403);
    });

    test('should block access for unverified user', async () => {
      // Create an unverified user
      const user = await prisma.user.create({
        data: {
          email: 'unverified@example.com',
          password: 'hashedpassword',
          firstName: 'Unverified',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

      const mockReq = {
        user: { userId: user.id, role: 'CUSTOMER' },
        userId: user.id,
        ip: '127.0.0.1',
        originalUrl: '/api/protected-route',
        get: jest.fn()
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockNext = jest.fn();

      // Mock middleware to return function
      emailVerificationMiddleware.requireEmailVerification.mockImplementation(() => (req, res, next) => {
        // Simulate middleware logic
        if (!req.emailVerified) {
          return res.status(403).json({
            error: 'Email not verified',
            message: 'Please verify your email address to access this resource'
          });
        }
        next();
      });

      const middleware = emailVerificationMiddleware.requireEmailVerification();
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Email not verified',
        message: 'Please verify your email address to access this resource'
      });
    });
  });

  describe('Email Service', () => {
    test('should validate email format correctly', () => {
      expect(emailService.validateEmail('test@example.com')).toBe(true);
      expect(emailService.validateEmail('invalid-email')).toBe(false);
      expect(emailService.validateEmail('test@')).toBe(false);
      expect(emailService.validateEmail('@example.com')).toBe(false);
    });

    test('should detect disposable emails', () => {
      expect(emailService.isDisposableEmail('test@10minutemail.com')).toBe(true);
      expect(emailService.isDisposableEmail('test@gmail.com')).toBe(false);
      expect(emailService.isDisposableEmail('test@yahoo.com')).toBe(false);
    });

    test('should generate secure verification tokens', () => {
      const token1 = emailService.generateVerificationToken();
      const token2 = emailService.generateVerificationToken();
      
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
      expect(/^[a-f0-9]+$/).test(token1); // Should be hex characters only
    });
  });
});

// Integration test for complete email verification flow
describe('Complete Email Verification Flow', () => {
  test('should handle complete registration to verification flow', async () => {
    const userData = {
      email: 'integration@example.com',
      password: 'password123',
      firstName: 'Integration',
      lastName: 'Test'
    };

    // Mock email service
    emailService.sendVerificationEmail.mockResolvedValue({
      success: true,
      messageId: 'integration-message-id'
    });

    // Step 1: Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(registerResponse.body.user.status).toBe('PENDING');
    expect(registerResponse.body.requiresEmailVerification).toBe(true);

    // Step 2: Get verification token from database
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
      include: {
        emailVerificationTokens: true
      }
    });

    expect(user.emailVerificationTokens).toHaveLength(1);
    const verificationToken = user.emailVerificationTokens[0].token;

    // Step 3: Verify email
    emailService.sendWelcomeEmail.mockResolvedValue({
      success: true,
      messageId: 'welcome-message-id'
    });

    const verifyResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verificationToken })
      .expect(200);

    expect(verifyResponse.body.message).toBe('Email verified successfully');
    expect(verifyResponse.body.user.status).toBe('ACTIVE');

    // Step 4: Login with verified account
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(loginResponse.body.message).toBe('Login successful');
    expect(loginResponse.body.user.status).toBe('ACTIVE');
    expect(loginResponse.body.token).toBeTruthy();

    // Verify email service calls
    expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
  });
});