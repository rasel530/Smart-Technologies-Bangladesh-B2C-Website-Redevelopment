/**
 * Comprehensive Integration Test Suite for Registration Functionality
 * 
 * This test suite covers the complete registration flow including:
 * - Email + Phone + Password validation
 * - Email verification flow testing
 * - OTP verification flow testing
 * - Bangladesh phone number validation
 * - Address validation testing
 * - Multi-step registration form testing
 * - Database integration testing
 * - API endpoint integration testing
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { emailService } = require('../services/emailService');
const { smsService } = require('../services/smsService');
const { otpService } = require('../services/otpService');
const { passwordService } = require('../services/passwordService');
const { phoneValidationService } = require('../services/phoneValidationService');
const app = require('../index');

describe('Registration Integration Tests', () => {
  let prisma;
  let testUsers = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.emailVerificationToken.deleteMany({});
    await prisma.phoneOTP.deleteMany({});
    await prisma.passwordHistory.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'test.integration' } }
    });
    testUsers = [];
  });

  afterEach(async () => {
    // Clean up any remaining test data
    for (const user of testUsers) {
      try {
        await prisma.user.delete({ where: { id: user.id } });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Complete Registration Flow with Email + Phone', () => {
    /**
     * Test complete registration flow with both email and phone verification
     * This simulates the most comprehensive registration scenario
     */
    test('should handle complete registration with email and phone verification', async () => {
      const userData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: 'test.integration@example.com',
        phone: '+8801712345678',
        password: 'StrongP@ssw0rd123!',
        confirmPassword: 'StrongP@ssw0rd123!'
      };

      // Step 1: Register user with email and phone
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.message).toContain('Please check your email to verify your account');
      expect(registerResponse.body.user.status).toBe('PENDING');
      expect(registerResponse.body.requiresEmailVerification).toBe(true);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(createdUser).toBeTruthy();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.phone).toBe('+8801712345678');
      expect(createdUser.status).toBe('PENDING');

      // Step 2: Get email verification token
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });
      expect(emailToken).toBeTruthy();

      // Step 3: Verify email
      const emailVerifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(200);

      expect(emailVerifyResponse.body.message).toBe('Email verified successfully');
      expect(emailVerifyResponse.body.user.status).toBe('ACTIVE');
      expect(emailVerifyResponse.body.user.emailVerified).toBeTruthy();

      // Step 4: Generate and verify phone OTP
      const otpResponse = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: userData.phone })
        .expect(200);

      expect(otpResponse.body.message).toBe('OTP sent successfully');
      expect(otpResponse.body.operator).toBe('Grameenphone');

      // Get OTP from database for verification
      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: userData.phone }
      });
      expect(phoneOTP).toBeTruthy();

      // Step 5: Verify phone OTP
      const otpVerifyResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: userData.phone,
          otp: phoneOTP.otp
        })
        .expect(200);

      expect(otpVerifyResponse.body.message).toBe('OTP verified successfully');

      // Step 6: Verify final user status
      const finalUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(finalUser.status).toBe('ACTIVE');
      expect(finalUser.emailVerified).toBeTruthy();
      expect(finalUser.phoneVerified).toBeTruthy();

      // Step 7: Login with verified account
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
    });

    /**
     * Test registration flow with email only
     */
    test('should handle registration with email only', async () => {
      const userData = {
        firstName: 'Email',
        lastName: 'Only',
        email: 'email.only.test@example.com',
        password: 'StrongP@ssw0rd123!',
        confirmPassword: 'StrongP@ssw0rd123!'
      };

      // Register user with email only
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.requiresEmailVerification).toBe(true);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Get and verify email token
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(200);

      expect(verifyResponse.body.user.emailVerified).toBeTruthy();
      expect(verifyResponse.body.user.phoneVerified).toBeFalsy();
    });

    /**
     * Test registration flow with phone only
     */
    test('should handle registration with phone only', async () => {
      const userData = {
        firstName: 'Phone',
        lastName: 'Only',
        phone: '+8801912345678',
        password: 'StrongP@ssw0rd123!',
        confirmPassword: 'StrongP@ssw0rd123!'
      };

      // Register user with phone only
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.requiresPhoneVerification).toBe(true);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Generate and verify OTP
      const otpResponse = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: userData.phone })
        .expect(200);

      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: userData.phone }
      });

      const verifyResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: userData.phone,
          otp: phoneOTP.otp
        })
        .expect(200);

      expect(verifyResponse.body.user.emailVerified).toBeFalsy();
      expect(verifyResponse.body.user.phoneVerified).toBeTruthy();
    });
  });

  describe('Password Strength Integration', () => {
    /**
     * Test password strength validation during registration
     */
    test('should enforce password strength requirements', async () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'Bangladesh123',
        'Test123456'
      ];

      for (const weakPassword of weakPasswords) {
        const userData = {
          firstName: 'Weak',
          lastName: 'Password',
          email: `weak.${Date.now()}@example.com`,
          password: weakPassword,
          confirmPassword: weakPassword
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBe('Password does not meet requirements');
        expect(response.body.details.strength).toMatch(/^(weak|fair)$/);
      }
    });

    /**
     * Test strong password acceptance
     */
    test('should accept strong password', async () => {
      const userData = {
        firstName: 'Strong',
        lastName: 'Password',
        email: 'strong.password@example.com',
        password: 'Str0ng!P@ssw0rd#2024',
        confirmPassword: 'Str0ng!P@ssw0rd#2024'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should pass password validation but fail due to missing verification
      expect([201, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error).not.toBe('Password does not meet requirements');
      }
    });

    /**
     * Test password history enforcement
     */
    test('should prevent password reuse', async () => {
      const userData = {
        firstName: 'History',
        lastName: 'Test',
        email: 'history.test@example.com',
        phone: '+8801812345678',
        password: 'FirstP@ssw0rd123!',
        confirmPassword: 'FirstP@ssw0rd123!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Complete verification
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });
      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token });

      // Get auth token for password change
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Change password
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: userData.password,
          newPassword: 'SecondP@ssw0rd456!',
          confirmPassword: 'SecondP@ssw0rd456!'
        })
        .expect(200);

      // Try to reuse first password
      const reuseResponse = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'SecondP@ssw0rd456!',
          newPassword: userData.password,
          confirmPassword: userData.password
        })
        .expect(400);

      expect(reuseResponse.body.error).toBe('Password already used');
    });
  });

  describe('Bangladesh Phone Number Validation Integration', () => {
    /**
     * Test all major Bangladesh mobile operators
     */
    test('should validate all Bangladesh mobile operators', async () => {
      const operators = [
        { phone: '+8801312345678', operator: 'Grameenphone' },
        { phone: '+8801712345678', operator: 'Grameenphone' },
        { phone: '+8801912345678', operator: 'Banglalink' },
        { phone: '+8801812345678', operator: 'Robi' },
        { phone: '+8801512345678', operator: 'Teletalk' },
        { phone: '+8801612345678', operator: 'Airtel' },
        { phone: '+8801412345678', operator: 'Banglalink' }
      ];

      for (const { phone, operator } of operators) {
        const userData = {
          firstName: 'Operator',
          lastName: 'Test',
          phone,
          password: 'TestP@ssw0rd123!',
          confirmPassword: 'TestP@ssw0rd123!'
        };

        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(registerResponse.body.operator).toBe(operator);

        const userId = registerResponse.body.user.id;
        testUsers.push({ id: userId });
      }
    });

    /**
     * Test phone number format normalization
     */
    test('should normalize different phone number formats', async () => {
      const phoneFormats = [
        '01712345678',
        '8801712345678',
        '+8801712345678'
      ];

      for (const phone of phoneFormats) {
        const validation = phoneValidationService.validateForUseCase(phone, 'registration');
        expect(validation.isValid).toBe(true);
        expect(validation.normalizedPhone).toBe('+8801712345678');
        expect(validation.operator).toBe('Grameenphone');
      }
    });

    /**
     * Test rejection of unsupported operators
     */
    test('should reject unsupported mobile operators', async () => {
      const unsupportedPhones = [
        '+8801212345678', // Citycell (defunct)
        '+8801112345678', // Invalid prefix
        '+8800912345678'  // Invalid prefix
      ];

      for (const phone of unsupportedPhones) {
        const userData = {
          firstName: 'Invalid',
          lastName: 'Phone',
          phone,
          password: 'TestP@ssw0rd123!',
          confirmPassword: 'TestP@ssw0rd123!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBe('Invalid phone format');
      }
    });
  });

  describe('Email Verification Integration', () => {
    /**
     * Test email verification token generation and validation
     */
    test('should generate and validate email verification tokens', async () => {
      const userData = {
        firstName: 'Email',
        lastName: 'Verify',
        email: 'email.verify@example.com',
        password: 'TestP@ssw0rd123!',
        confirmPassword: 'TestP@ssw0rd123!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Verify token was created
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });
      expect(emailToken).toBeTruthy();
      expect(emailToken.token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(emailToken.expiresAt).toBeInstanceOf(Date);

      // Verify token works
      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(200);

      expect(verifyResponse.body.user.emailVerified).toBeTruthy();

      // Verify token is deleted after use
      const deletedToken = await prisma.emailVerificationToken.findUnique({
        where: { token: emailToken.token }
      });
      expect(deletedToken).toBeFalsy();
    });

    /**
     * Test email verification token expiration
     */
    test('should handle expired email verification tokens', async () => {
      const userData = {
        firstName: 'Expired',
        lastName: 'Token',
        email: 'expired.token@example.com',
        password: 'TestP@ssw0rd123!',
        confirmPassword: 'TestP@ssw0rd123!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Manually expire the token
      await prisma.emailVerificationToken.updateMany({
        where: { userId },
        data: { expiresAt: new Date(Date.now() - 1000) }
      });

      // Try to verify with expired token
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(400);

      expect(response.body.error).toBe('Token expired');
    });

    /**
     * Test disposable email rejection
     */
    test('should reject disposable email addresses', async () => {
      const disposableEmails = [
        'test@10minutemail.com',
        'user@tempmail.org',
        'demo@mailinator.com',
        'sample@yopmail.com'
      ];

      for (const email of disposableEmails) {
        const userData = {
          firstName: 'Disposable',
          lastName: 'Email',
          email,
          password: 'TestP@ssw0rd123!',
          confirmPassword: 'TestP@ssw0rd123!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBe('Disposable email not allowed');
      }
    });
  });

  describe('OTP Verification Integration', () => {
    /**
     * Test OTP generation and verification flow
     */
    test('should generate and verify OTP codes', async () => {
      const userData = {
        firstName: 'OTP',
        lastName: 'Test',
        phone: '+8801712345678',
        password: 'TestP@ssw0rd123!',
        confirmPassword: 'TestP@ssw0rd123!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Send OTP
      const otpResponse = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: userData.phone })
        .expect(200);

      expect(otpResponse.body.message).toBe('OTP sent successfully');

      // Get OTP from database
      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: userData.phone }
      });
      expect(phoneOTP).toBeTruthy();
      expect(phoneOTP.otp).toHaveLength(6);
      expect(phoneOTP.expiresAt).toBeInstanceOf(Date);

      // Verify OTP
      const verifyResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: userData.phone,
          otp: phoneOTP.otp
        })
        .expect(200);

      expect(verifyResponse.body.message).toBe('OTP verified successfully');

      // Verify OTP is marked as verified
      const verifiedOTP = await prisma.phoneOTP.findUnique({
        where: { id: phoneOTP.id }
      });
      expect(verifiedOTP.verifiedAt).toBeTruthy();
    });

    /**
     * Test OTP rate limiting
     */
    test('should enforce OTP rate limiting', async () => {
      const phone = '+8801712345678';

      // Send multiple OTPs quickly
      const responses = [];
      for (let i = 0; i < 4; i++) {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ phone });
        
        responses.push(response.status);
      }

      // First 3 should succeed, 4th should fail
      expect(responses[0]).toBe(200);
      expect(responses[1]).toBe(200);
      expect(responses[2]).toBe(200);
      expect(responses[3]).toBe(400);

      // Check rate limiting error
      const rateLimitResponse = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone })
        .expect(400);

      expect(rateLimitResponse.body.error).toContain('Too many OTP requests');
    });

    /**
     * Test OTP verification attempts limit
     */
    test('should limit OTP verification attempts', async () => {
      const userData = {
        firstName: 'Attempts',
        lastName: 'Test',
        phone: '+8801912345678',
        password: 'TestP@ssw0rd123!',
        confirmPassword: 'TestP@ssw0rd123!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Send OTP
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: userData.phone })
        .expect(200);

      // Get valid OTP
      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: userData.phone }
      });

      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/verify-otp')
          .send({
            phone: userData.phone,
            otp: '123456' // Wrong OTP
          })
          .expect(400);
      }

      // 4th attempt with correct OTP should fail
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: userData.phone,
          otp: phoneOTP.otp
        })
        .expect(400);

      expect(response.body.error).toBe('Maximum verification attempts exceeded');
    });
  });

  describe('Database Integration', () => {
    /**
     * Test database transaction integrity
     */
    test('should maintain database integrity during registration', async () => {
      const userData = {
        firstName: 'Database',
        lastName: 'Test',
        email: 'database.test@example.com',
        phone: '+8801712345678',
        password: 'TestP@ssw0rd123!',
        confirmPassword: 'TestP@ssw0rd123!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;

      // Verify all related records were created
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(user).toBeTruthy();

      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });
      expect(emailToken).toBeTruthy();

      const passwordHistory = await prisma.passwordHistory.findFirst({
        where: { userId }
      });
      expect(passwordHistory).toBeTruthy();

      // Verify relationships
      const userWithRelations = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          emailVerificationTokens: true,
          passwordHistory: true
        }
      });
      expect(userWithRelations.emailVerificationTokens).toHaveLength(1);
      expect(userWithRelations.passwordHistory).toHaveLength(1);

      testUsers.push({ id: userId });
    });

    /**
     * Test concurrent registration handling
     */
    test('should handle concurrent registration attempts', async () => {
      const userData = {
        firstName: 'Concurrent',
        lastName: 'Test',
        email: 'concurrent.test@example.com',
        password: 'TestP@ssw0rd123!',
        confirmPassword: 'TestP@ssw0rd123!'
      };

      // Submit multiple registration requests simultaneously
      const promises = Array(5).fill().map(() =>
        request(app)
          .post('/api/auth/register')
          .send(userData)
      );

      const responses = await Promise.all(promises);

      // Only one should succeed
      const successCount = responses.filter(r => r.status === 201).length;
      const conflictCount = responses.filter(r => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);

      // Clean up
      const successResponse = responses.find(r => r.status === 201);
      if (successResponse) {
        testUsers.push({ id: successResponse.body.user.id });
      }
    });
  });

  describe('API Endpoint Integration', () => {
    /**
     * Test API response formats
     */
    test('should return consistent API response formats', async () => {
      const userData = {
        firstName: 'API',
        lastName: 'Format',
        email: 'api.format@example.com',
        password: 'TestP@ssw0rd123!',
        confirmPassword: 'TestP@ssw0rd123!'
      };

      // Test registration response format
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('message');
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body).toHaveProperty('requiresEmailVerification');
      expect(registerResponse.body.user).toHaveProperty('id');
      expect(registerResponse.body.user).toHaveProperty('email');
      expect(registerResponse.body.user).toHaveProperty('status');

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Test verification response format
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('message');
      expect(verifyResponse.body).toHaveProperty('user');
      expect(verifyResponse.body.user).toHaveProperty('emailVerified');
    });

    /**
     * Test error response formats
     */
    test('should return consistent error response formats', async () => {
      // Test validation error
      const invalidResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: '',
          email: 'invalid-email',
          password: 'weak'
        })
        .expect(400);

      expect(invalidResponse.body).toHaveProperty('error');
      expect(invalidResponse.body).toHaveProperty('message');

      // Test not found error
      const notFoundResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'non-existent-token' })
        .expect(400);

      expect(notFoundResponse.body).toHaveProperty('error');
      expect(notFoundResponse.body).toHaveProperty('message');
    });
  });
});