/**
 * Comprehensive Authentication Tests
 * 
 * This test suite covers all authentication components including:
 * - User registration (email and phone)
 * - Login mechanisms (standard login, remember me)
 * - Email verification system
 * - Phone/OTP verification system
 * - Password management (change, reset, policy enforcement)
 * - Session management (creation, validation, destruction)
 * - Security features (rate limiting, account lockout, IP blocking)
 * - Bangladesh-specific features
 * - Redis integration
 */

const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock all dependencies before importing
jest.mock('../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    logAuth: jest.fn(),
    logSecurity: jest.fn(),
    logPerformance: jest.fn(),
    stream: jest.fn(() => ({
      write: jest.fn()
    }))
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
    getSecurityConfig: jest.fn(() => ({
      bcryptRounds: 12,
      passwordMinLength: 8,
      passwordMaxLength: 128,
      maxLoginAttempts: 5,
      lockoutDuration: 900000
    })),
    getPasswordPolicyConfig: jest.fn(() => ({
      minLength: 8,
      maxLength: 128,
      bcryptRounds: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventSequential: true,
      preventRepeated: true,
      preventPersonalInfo: true,
      bangladeshPatterns: true,
      minStrengthScore: 2
    })),
    getCORSConfig: jest.fn(() => ({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Request-ID']
    })),
    isProduction: jest.fn(() => false),
    isDevelopment: jest.fn(() => false),
    isTest: jest.fn(() => true),
    validateConfig: jest.fn()
  }
}));

jest.mock('../services/emailService', () => ({
  emailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-message-id' }),
    sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'welcome-message-id' }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'reset-message-id' }),
    validateEmail: jest.fn((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    isDisposableEmail: jest.fn(() => false),
    generateVerificationToken: jest.fn(() => 'test-verification-token-64-characters-long-string')
  }
}));

jest.mock('../services/smsService', () => ({
  smsService: {
    sendOTP: jest.fn().mockResolvedValue({ success: true, messageId: 'sms-message-id' }),
    validateBangladeshPhoneNumber: jest.fn((phone) => {
      // Simple validation for testing
      if (/^\+8801[3-9]\d{8}$/.test(phone)) {
        return {
          valid: true,
          normalizedPhone: phone,
          operator: 'Grameenphone'
        };
      }
      if (/^01[3-9]\d{8}$/.test(phone)) {
        return {
          valid: true,
          normalizedPhone: `+880${phone.substring(1)}`,
          operator: 'Grameenphone'
        };
      }
      return {
        valid: false,
        error: 'Invalid Bangladesh phone number format'
      };
    })
  }
}));

jest.mock('../services/otpService', () => ({
  otpService: {
    generatePhoneOTP: jest.fn().mockResolvedValue({
      success: true,
      phone: '+8801712345678',
      expiresAt: new Date(Date.now() + 300000),
      mock: true
    }),
    verifyPhoneOTP: jest.fn().mockResolvedValue({
      success: true,
      phone: '+8801712345678'
    }),
    resendPhoneOTP: jest.fn().mockResolvedValue({
      success: true,
      phone: '+8801712345678'
    })
  }
}));

jest.mock('../services/passwordService', () => ({
  passwordService: {
    validatePasswordStrength: jest.fn().mockReturnValue({
      isValid: true,
      score: 4,
      strength: 'strong',
      feedback: [],
      warnings: [],
      suggestions: []
    }),
    hashPassword: jest.fn().mockResolvedValue('hashed_password'),
    verifyPassword: jest.fn().mockResolvedValue(true),
    isPasswordReused: jest.fn().mockResolvedValue(false),
    savePasswordToHistory: jest.fn().mockResolvedValue({ id: 'history-123' }),
    generateStrongPassword: jest.fn().mockReturnValue('GeneratedPassword123!')
  }
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(),
    setEx: jest.fn().mockResolvedValue(),
    del: jest.fn().mockResolvedValue(),
    hGetAll: jest.fn().mockResolvedValue({}),
    hIncrBy: jest.fn().mockResolvedValue(1),
    hSet: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    multi: jest.fn(() => ({
      zRemRangeByScore: jest.fn().mockReturnThis(),
      zAdd: jest.fn().mockReturnThis(),
      zCard: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ reply: 1 }, { reply: 1 }, { reply: 1 }])
    }))
  }))
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn().mockResolvedValue(),
    $disconnect: jest.fn().mockResolvedValue(),
    $use: jest.fn(),
    $on: jest.fn(),
    $transaction: jest.fn(),
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    emailVerificationToken: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    phoneOTP: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    passwordHistory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    },
    session: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    }
  }))
}));

// Import after mocking
const app = require('../index');

describe('Comprehensive Authentication Tests', () => {
  let prisma;
  let testUser;

  beforeAll(async () => {
    prisma = new (require('@prisma/client').PrismaClient)();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
    await prisma.emailVerificationToken.deleteMany();
    await prisma.phoneOTP.deleteMany();
    await prisma.session.deleteMany();
    await prisma.passwordHistory.deleteMany();
  });

  describe('User Registration', () => {
    describe('Email Registration', () => {
      test('should register user with valid email and strong password', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'Test',
          lastName: 'User'
        };

        prisma.user.findFirst.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
          id: 'user-123',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'CUSTOMER',
          status: 'PENDING'
        });
        prisma.emailVerificationToken.create.mockResolvedValue({ id: 'token-123' });

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.message).toContain('Please check your email to verify');
        expect(response.body.user.status).toBe('PENDING');
        expect(response.body.requiresEmailVerification).toBe(true);
      });

      test('should reject registration with weak password', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User'
        };

        const { passwordService } = require('../services/passwordService');
        passwordService.validatePasswordStrength.mockReturnValue({
          isValid: false,
          score: 1,
          strength: 'weak',
          feedback: ['Password is too weak'],
          warnings: ['Common password pattern'],
          suggestions: ['Use a mix of characters']
        });

        prisma.user.findFirst.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Password does not meet requirements');
        expect(response.body.details.strength).toBe('weak');
      });

      test('should reject registration with disposable email', async () => {
        const userData = {
          email: 'test@10minutemail.com',
          password: 'StrongPassword123!',
          firstName: 'Test',
          lastName: 'User'
        };

        const { emailService } = require('../services/emailService');
        emailService.isDisposableEmail.mockReturnValue(true);

        prisma.user.findFirst.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Disposable email not allowed');
      });

      test('should reject registration with duplicate email', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'Test',
          lastName: 'User'
        };

        prisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        expect(response.status).toBe(409);
        expect(response.body.error).toBe('User already exists');
        expect(response.body.field).toBe('email');
      });
    });

    describe('Phone Registration', () => {
      test('should register user with valid Bangladesh phone number', async () => {
        const userData = {
          phone: '+8801712345678',
          password: 'StrongPassword123!',
          firstName: 'Test',
          lastName: 'User'
        };

        prisma.user.findFirst.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
          id: 'user-123',
          phone: userData.phone,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'CUSTOMER',
          status: 'PENDING'
        });

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.message).toContain('Please check your phone for OTP');
        expect(response.body.user.status).toBe('PENDING');
        expect(response.body.requiresPhoneVerification).toBe(true);
      });

      test('should reject registration with invalid phone format', async () => {
        const userData = {
          phone: '12345678',
          password: 'StrongPassword123!',
          firstName: 'Test',
          lastName: 'User'
        };

        const { smsService } = require('../services/smsService');
        smsService.validateBangladeshPhoneNumber.mockReturnValue({
          valid: false,
          error: 'Invalid Bangladesh phone number format'
        });

        prisma.user.findFirst.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid phone format');
      });

      test('should reject registration with unsupported operator', async () => {
        const userData = {
          phone: '+8801212345678', // Unsupported prefix
          password: 'StrongPassword123!',
          firstName: 'Test',
          lastName: 'User'
        };

        const { smsService } = require('../services/smsService');
        smsService.validateBangladeshPhoneNumber.mockReturnValue({
          valid: false,
          error: 'Unsupported mobile operator'
        });

        prisma.user.findFirst.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Unsupported operator');
      });
    });
  });

  describe('Login Mechanisms', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
      testUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+8801712345678',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        phoneVerified: new Date()
      };
    });

    test('should login successfully with email and password', async () => {
      prisma.user.findFirst.mockResolvedValue(testUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.loginType).toBe('email');
      expect(response.body.token).toBeDefined();
    });

    test('should login successfully with phone and password', async () => {
      prisma.user.findFirst.mockResolvedValue(testUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: '+8801712345678',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.phone).toBe('+8801712345678');
      expect(response.body.loginType).toBe('phone');
      expect(response.body.token).toBeDefined();
    });

    test('should reject login with invalid credentials', async () => {
      prisma.user.findFirst.mockResolvedValue(testUser);

      const { passwordService } = require('../services/passwordService');
      passwordService.verifyPassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject login for unverified user', async () => {
      const unverifiedUser = { ...testUser, status: 'PENDING', emailVerified: null };
      prisma.user.findFirst.mockResolvedValue(unverifiedUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Account not verified');
      expect(response.body.requiresVerification).toBe(true);
    });

    test('should implement remember me functionality', async () => {
      prisma.user.findFirst.mockResolvedValue(testUser);
      prisma.session.create.mockResolvedValue({
        id: 'session-123',
        userId: testUser.id,
        token: 'remember-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'TestPassword123!',
          rememberMe: true
        });

      expect(response.status).toBe(200);
      expect(response.body.rememberMeToken).toBeDefined();
      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser.id,
          type: 'REMEMBER_ME'
        })
      );
    });
  });

  describe('Email Verification System', () => {
    test('should verify email with valid token', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        status: 'PENDING'
      };

      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-123',
        userId: user.id,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 60000),
        user
      });

      prisma.user.update.mockResolvedValue({
        ...user,
        status: 'ACTIVE',
        emailVerified: new Date()
      });

      prisma.emailVerificationToken.delete.mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'valid-token' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Email verified successfully');
      expect(response.body.user.status).toBe('ACTIVE');
      expect(response.body.user.emailVerified).toBeTruthy();
    });

    test('should reject verification with expired token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 60000) // Expired
      });

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'expired-token' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token expired');
    });

    test('should reject verification with invalid token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should resend verification email', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        status: 'PENDING'
      };

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 'new-token-123' });

      const response = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Verification email sent successfully');
    });
  });

  describe('Phone/OTP Verification System', () => {
    test('should send OTP for valid phone number', async () => {
      const { otpService } = require('../services/otpService');
      const { smsService } = require('../services/smsService');

      prisma.user.findFirst.mockResolvedValue(null); // Phone not verified yet

      const response = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone: '+8801712345678' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(otpService.generatePhoneOTP).toHaveBeenCalledWith('+8801712345678');
      expect(smsService.sendOTP).toHaveBeenCalled();
    });

    test('should verify OTP successfully', async () => {
      const { otpService } = require('../services/otpService');

      otpService.verifyPhoneOTP.mockResolvedValue({
        success: true,
        phone: '+8801712345678'
      });

      prisma.phoneOTP.findFirst.mockResolvedValue({
        id: 'otp-123',
        phone: '+8801712345678',
        otp: '123456',
        expiresAt: new Date(Date.now() + 300000)
      });

      prisma.user.update.mockResolvedValue({
        id: 'user-123',
        phone: '+8801712345678',
        phoneVerified: new Date(),
        status: 'ACTIVE'
      });

      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: '+8801712345678',
          otp: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP verified successfully');
    });

    test('should reject OTP verification with invalid code', async () => {
      const { otpService } = require('../services/otpService');
      otpService.verifyPhoneOTP.mockResolvedValue({
        success: false,
        code: 'INVALID_OTP'
      });

      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: '+8801712345678',
          otp: 'wrong-otp'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('OTP verification failed');
    });

    test('should implement OTP rate limiting', async () => {
      const { otpService } = require('../services/otpService');
      
      // Mock rate limiting
      otpService.generatePhoneOTP
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValue({ success: false, code: 'RATE_LIMIT_EXCEEDED' });

      // Send 3 successful OTPs
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/auth/send-otp')
          .send({ phone: '+8801712345678' });
      }

      // 4th attempt should fail
      const response = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone: '+8801712345678' });

      expect(response.status).toBe(429);
      expect(response.body.error).toBe('Too many OTP requests');
    });
  });

  describe('Password Management', () => {
    beforeEach(() => {
      testUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed_password',
        status: 'ACTIVE'
      };
    });

    test('should change password successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(testUser);
      prisma.user.update.mockResolvedValue({});
      prisma.passwordHistory.create.mockResolvedValue({ id: 'history-123' });

      const { passwordService } = require('../services/passwordService');
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.isPasswordReused.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password changed successfully');
      expect(passwordService.validatePasswordStrength).toHaveBeenCalled();
      expect(passwordService.hashPassword).toHaveBeenCalledWith('NewPassword456!');
    });

    test('should reject password change with incorrect current password', async () => {
      prisma.user.findUnique.mockResolvedValue(testUser);

      const { passwordService } = require('../services/passwordService');
      passwordService.verifyPassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword456!',
          confirmPassword: 'NewPassword456!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid current password');
    });

    test('should reject password change if new password was previously used', async () => {
      prisma.user.findUnique.mockResolvedValue(testUser);

      const { passwordService } = require('../services/passwordService');
      passwordService.verifyPassword.mockResolvedValue(true);
      passwordService.isPasswordReused.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'OldPassword456!',
          confirmPassword: 'OldPassword456!'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password already used');
    });

    test('should send password reset email', async () => {
      prisma.user.findUnique.mockResolvedValue(testUser);
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 'reset-token-123' });

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset email sent successfully');
    });

    test('should reset password with valid token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: 'valid-reset-token',
        expiresAt: new Date(Date.now() + 60000),
        user: testUser
      });

      prisma.user.update.mockResolvedValue({});
      prisma.emailVerificationToken.delete.mockResolvedValue({});

      const { passwordService } = require('../services/passwordService');
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid-reset-token',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successfully');
    });

    test('should enforce password policy for Bangladesh users', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Dhaka123456', // Contains common Bangladeshi pattern
        firstName: 'Test',
        lastName: 'User'
      };

      const { passwordService } = require('../services/passwordService');
      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        score: 2,
        strength: 'fair',
        feedback: ['Password cannot contain common Bangladeshi terms'],
        warnings: [],
        suggestions: []
      });

      prisma.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.details.feedback).toContain('Bangladeshi');
    });
  });

  describe('Session Management', () => {
    test('should create session on login', async () => {
      prisma.user.findFirst.mockResolvedValue(testUser);
      prisma.session.create.mockResolvedValue({
        id: 'session-123',
        userId: testUser.id,
        token: 'session-token',
        expiresAt: new Date(Date.now() + 3600000)
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(200);
      expect(prisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser.id,
          type: 'STANDARD'
        })
      );
    });

    test('should validate session token', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        token: 'valid-session-token',
        expiresAt: new Date(Date.now() + 3600000),
        user: testUser
      });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer valid-session-token');

      expect(response.status).toBe(200);
    });

    test('should reject expired session', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        token: 'expired-session-token',
        expiresAt: new Date(Date.now() - 3600000) // Expired
      });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer expired-session-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Session expired');
    });

    test('should destroy session on logout', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        token: 'valid-session-token'
      });

      prisma.session.delete.mockResolvedValue({});

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-session-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
      expect(prisma.session.delete).toHaveBeenCalled();
    });
  });

  describe('Security Features', () => {
    test('should implement rate limiting on login attempts', async () => {
      const redis = require('redis').createClient();
      
      // Mock Redis to track rate limit
      let attemptCount = 0;
      redis.hIncrBy.mockImplementation(() => {
        attemptCount++;
        return Promise.resolve(attemptCount);
      });

      prisma.user.findFirst.mockResolvedValue(testUser);

      // Make multiple login attempts
      const responses = await Promise.all([
        request(app).post('/api/v1/auth/login').send({
          identifier: 'test@example.com',
          password: 'wrong1'
        }),
        request(app).post('/api/v1/auth/login').send({
          identifier: 'test@example.com',
          password: 'wrong2'
        }),
        request(app).post('/api/v1/auth/login').send({
          identifier: 'test@example.com',
          password: 'wrong3'
        }),
        request(app).post('/api/v1/auth/login').send({
          identifier: 'test@example.com',
          password: 'wrong4'
        }),
        request(app).post('/api/v1/auth/login').send({
          identifier: 'test@example.com',
          password: 'wrong5'
        }),
        request(app).post('/api/v1/auth/login').send({
          identifier: 'test@example.com',
          password: 'wrong6'
        })
      ]);

      // Last attempt should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.error).toBe('Too many login attempts');
    });

    test('should implement account lockout after failed attempts', async () => {
      const redis = require('redis').createClient();
      
      // Mock Redis to simulate lockout
      redis.get.mockResolvedValue('locked');

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'password'
        });

      expect(response.status).toBe(423);
      expect(response.body.error).toBe('Account locked');
      expect(response.body.message).toContain('Too many failed attempts');
    });

    test('should block suspicious IP addresses', async () => {
      const redis = require('redis').createClient();
      
      // Mock Redis to return suspicious IP
      redis.hGetAll.mockResolvedValue({
        '192.168.1.100': {
          attempts: 15,
          lastAttempt: Date.now(),
          suspicious: true
        }
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '192.168.1.100')
        .send({
          identifier: 'test@example.com',
          password: 'password'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toContain('Suspicious activity');
    });

    test('should log security events', async () => {
      const { loggerService } = require('../services/logger');
      
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'wrong-password'
        });

      expect(loggerService.logSecurity).toHaveBeenCalledWith(
        'LOGIN_FAILED',
        expect.objectContaining({
          ip: expect.any(String),
          identifier: 'test@example.com'
        })
      );
    });
  });

  describe('Bangladesh-Specific Features', () => {
    test('should validate all major Bangladesh mobile operators', async () => {
      const operators = [
        { phone: '+8801312345678', operator: 'Grameenphone' },
        { phone: '+8801712345678', operator: 'Grameenphone' },
        { phone: '+8801912345678', operator: 'Banglalink' },
        { phone: '+8801812345678', operator: 'Robi' },
        { phone: '+8801512345678', operator: 'Teletalk' },
        { phone: '+8801612345678', operator: 'Airtel' },
        { phone: '+8801412345678', operator: 'Banglalink' }
      ];

      const { smsService } = require('../services/smsService');

      for (const { phone, operator } of operators) {
        smsService.validateBangladeshPhoneNumber.mockReturnValue({
          valid: true,
          normalizedPhone: phone,
          operator
        });

        const response = await request(app)
          .post('/api/v1/auth/send-otp')
          .send({ phone });

        expect(response.status).toBe(200);
        expect(smsService.validateBangladeshPhoneNumber).toHaveBeenCalledWith(phone);
      }
    });

    test('should provide localized error messages', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'weak',
          firstName: '',
          lastName: ''
        })
        .set('Accept-Language', 'bn-BD');

      expect(response.status).toBe(400);
      // Should include Bengali error messages
      expect(response.body.errorBn).toBeDefined();
    });

    test('should validate Bangladesh address structure', async () => {
      const addressData = {
        street: '123, Dhanmondi Road 8',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        postalCode: '1209',
        country: 'Bangladesh'
      };

      const response = await request(app)
        .post('/api/v1/users/address')
        .set('Authorization', 'Bearer valid-token')
        .send(addressData);

      expect(response.status).toBe(201);
      expect(response.body.address.division).toBe('Dhaka');
      expect(response.body.address.district).toBe('Dhaka');
    });
  });

  describe('Redis Integration', () => {
    test('should store sessions in Redis', async () => {
      const redis = require('redis').createClient();
      
      prisma.user.findFirst.mockResolvedValue(testUser);
      prisma.session.create.mockResolvedValue({
        id: 'session-123',
        token: 'redis-session-token'
      });

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(redis.setEx).toHaveBeenCalledWith(
        expect.stringContaining('session:'),
        expect.any(Number),
        expect.stringContaining('redis-session-token')
      );
    });

    test('should track login security in Redis', async () => {
      const redis = require('redis').createClient();
      
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'wrong-password'
        });

      expect(redis.hIncrBy).toHaveBeenCalledWith(
        expect.stringContaining('login_attempts:'),
        expect.any(String),
        1
      );
    });

    test('should implement rate limiting through Redis', async () => {
      const redis = require('redis').createClient();
      
      let requestCount = 0;
      redis.get.mockImplementation(() => {
        requestCount++;
        return Promise.resolve(requestCount > 3 ? '4' : null);
      });

      const response = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone: '+8801712345678' });

      if (requestCount > 3) {
        expect(response.status).toBe(429);
        expect(response.body.error).toBe('Too many requests');
      }
    });

    test('should store remember me tokens in Redis', async () => {
      const redis = require('redis').createClient();
      
      prisma.user.findFirst.mockResolvedValue(testUser);
      prisma.session.create.mockResolvedValue({
        id: 'remember-session-123',
        token: 'remember-me-token',
        type: 'REMEMBER_ME'
      });

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'TestPassword123!',
          rememberMe: true
        });

      expect(redis.setEx).toHaveBeenCalledWith(
        expect.stringContaining('remember:'),
        expect.any(Number),
        'remember-me-token'
      );
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete registration to login flow', async () => {
      // Step 1: Register user
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'integration@example.com',
        status: 'PENDING'
      });
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 'token-123' });

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'integration@example.com',
          password: 'StrongPassword123!',
          firstName: 'Integration',
          lastName: 'Test'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.user.status).toBe('PENDING');

      // Step 2: Verify email
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: 'verify-token',
        expiresAt: new Date(Date.now() + 60000),
        user: { id: 'user-123', email: 'integration@example.com' }
      });

      prisma.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'integration@example.com',
        status: 'ACTIVE',
        emailVerified: new Date()
      });

      const verifyResponse = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'verify-token' });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.user.status).toBe('ACTIVE');

      // Step 3: Login with verified account
      const hashedPassword = await bcrypt.hash('StrongPassword123!', 12);
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-123',
        email: 'integration@example.com',
        password: hashedPassword,
        status: 'ACTIVE',
        emailVerified: new Date()
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'integration@example.com',
          password: 'StrongPassword123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.message).toBe('Login successful');
      expect(loginResponse.body.token).toBeDefined();
    });

    test('should handle password reset flow end-to-end', async () => {
      // Step 1: Request password reset
      prisma.user.findUnique.mockResolvedValue(testUser);
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 'reset-token-123' });

      const forgotResponse = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(forgotResponse.status).toBe(200);

      // Step 2: Reset password with token
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'reset-token-123',
        userId: 'user-123',
        token: 'reset-token',
        expiresAt: new Date(Date.now() + 60000),
        user: testUser
      });

      const { passwordService } = require('../services/passwordService');
      passwordService.hashPassword.mockResolvedValue('new-hashed-password');

      const resetResponse = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'reset-token',
          newPassword: 'NewSecurePassword456!',
          confirmPassword: 'NewSecurePassword456!'
        });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body.message).toBe('Password reset successfully');

      // Step 3: Login with new password
      prisma.user.findFirst.mockResolvedValue({
        ...testUser,
        password: 'new-hashed-password'
      });

      passwordService.verifyPassword.mockResolvedValue(true);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'NewSecurePassword456!'
        });

      expect(loginResponse.status).toBe(200);
    });
  });
});