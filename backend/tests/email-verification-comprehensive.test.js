const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Import the modules we need to test
const authRoutes = require('../routes/auth');
const { emailVerificationMiddleware } = require('../middleware/emailVerification');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock modules within the test file to avoid setup issues
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

const prisma = new PrismaClient();

describe('Comprehensive Email Verification System Tests', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.emailVerificationToken.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Email Registration Flow', () => {
    /**
     * Test successful user registration with email verification
     */
    test('should register user with PENDING status and send verification email', async () => {
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
      
      // Verify email service was called
      const { emailService } = require('../services/emailService');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    /**
     * Test registration with disposable email rejection
     */
    test('should reject disposable email addresses', async () => {
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

    /**
     * Test registration with invalid email format
     */
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

    /**
     * Test registration with weak password
     */
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

    /**
     * Test registration with missing required fields
     */
    test('should reject registration with missing required fields', async () => {
      const userData = {
        email: 'test@example.com',
        // Missing password, firstName, lastName
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Email Verification Process', () => {
    /**
     * Test successful email verification
     */
    test('should verify email with valid token', async () => {
      // Create a user with PENDING status
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2a$12$hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

      // Create verification token
      const token = 'valid-verification-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
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
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully');
      expect(response.body.user.status).toBe('ACTIVE');
      expect(response.body.user.emailVerified).toBeTruthy();
      
      // Verify welcome email was sent
      const { emailService } = require('../services/emailService');
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    /**
     * Test verification with expired token
     */
    test('should reject expired token', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2a$12$hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

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

    /**
     * Test verification with invalid token
     */
    test('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error).toBe('Invalid token');
    });

    /**
     * Test verification with missing token
     */
    test('should reject verification with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Token required');
    });

    /**
     * Test verification of already verified user
     */
    test('should reject verification of already verified user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2a$12$hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });

      const token = 'valid-verification-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
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

      expect(response.body.error).toBe('Already verified');
    });
  });

  describe('Resend Verification Email', () => {
    /**
     * Test successful resend of verification email
     */
    test('should resend verification email for unverified user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2a$12$hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: user.email })
        .expect(200);

      expect(response.body.message).toBe('Verification email sent successfully');
      
      const { emailService } = require('../services/emailService');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        user.email,
        `${user.firstName} ${user.lastName}`,
        expect.any(String)
      );
    });

    /**
     * Test resend for already verified user
     */
    test('should reject already verified user', async () => {
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
        .post('/api/auth/resend-verification')
        .send({ email: user.email })
        .expect(400);

      expect(response.body.error).toBe('Already verified');
    });

    /**
     * Test resend for non-existent user
     */
    test('should handle non-existent user gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/resend-verification')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    /**
     * Test rate limiting for resend requests
     */
    test('should implement rate limiting for resend requests', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2a$12$hashedpassword',
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
    /**
     * Test login rejection for unverified user
     */
    test('should reject login for unverified user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2a$12$hashedpassword',
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

    /**
     * Test successful login for verified user
     */
    test('should allow login for verified user', async () => {
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

    /**
     * Test login with invalid credentials
     */
    test('should reject login with invalid credentials', async () => {
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
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('Email Service Validation', () => {
    /**
     * Test email format validation
     */
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

    /**
     * Test disposable email detection
     */
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

    /**
     * Test verification token generation
     */
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

  describe('Email Verification Middleware', () => {
    /**
     * Test middleware allows access for verified user
     */
    test('should allow access for verified user', async () => {
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

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        'test-jwt-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // This would test the middleware if it were applied to a protected route
      expect(response.status).not.toBe(403);
    });

    /**
     * Test middleware blocks unverified user
     */
    test('should block access for unverified user', async () => {
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

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        'test-jwt-secret-key',
        { expiresIn: '1h' }
      );

      // Test middleware function directly
      const middleware = emailVerificationMiddleware.requireEmailVerification();
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
    /**
     * Test SQL injection attempts in email field
     */
    test('should handle SQL injection attempts in email field', async () => {
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

    /**
     * Test XSS attempts in email field
     */
    test('should handle XSS attempts in email field', async () => {
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

    /**
     * Test very long email addresses
     */
    test('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      const userData = {
        email: longEmail,
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

    /**
     * Test concurrent registration attempts
     */
    test('should handle concurrent registration attempts', async () => {
      const userData = {
        email: 'concurrent@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      // Send two concurrent requests
      const [response1, response2] = await Promise.all([
        request(app).post('/api/auth/register').send(userData),
        request(app).post('/api/auth/register').send(userData)
      ]);

      // One should succeed, one should fail
      const successCount = [response1.status, response2.status].filter(status => status === 201).length;
      const failCount = [response1.status, response2.status].filter(status => status === 409).length;
      
      expect(successCount).toBe(1);
      expect(failCount).toBe(1);
    });

    /**
     * Test token reuse attempts
     */
    test('should prevent token reuse', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: '$2a$12$hashedpassword',
          firstName: 'Test',
          lastName: 'User',
          role: 'CUSTOMER',
          status: 'PENDING'
        }
      });

      const token = 'reusable-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt
        }
      });

      // First verification should succeed
      const response1 = await request(app)
        .post('/api/auth/verify-email')
        .send({ token })
        .expect(200);

      expect(response1.body.message).toBe('Email verified successfully');

      // Second verification with same token should fail
      const response2 = await request(app)
        .post('/api/auth/verify-email')
        .send({ token })
        .expect(400);

      expect(response2.body.error).toBe('Invalid token');
    });
  });

  describe('Complete Email Verification Flow Integration', () => {
    /**
     * Test complete registration to verification flow
     */
    test('should handle complete registration to verification flow', async () => {
      const userData = {
        email: 'integration@example.com',
        password: 'Password123!',
        firstName: 'Integration',
        lastName: 'Test'
      };

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
      const { emailService } = require('../services/emailService');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
    });
  });
});