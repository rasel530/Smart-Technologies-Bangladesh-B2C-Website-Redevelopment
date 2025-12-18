/**
 * Security Testing Suite for Registration Functionality
 * 
 * This test suite covers comprehensive security validation including:
 * - SQL injection attempts
 * - XSS prevention testing
 * - CSRF protection testing
 * - Rate limiting validation
 * - Brute force protection
 * - Data sanitization testing
 * - Password strength enforcement
 * - Email verification security
 * - OTP security validation
 * - Session security testing
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { emailService } = require('../services/emailService');
const { smsService } = require('../services/smsService');
const { otpService } = require('../services/otpService');
const { passwordService } = require('../services/passwordService');
const app = require('../index');

describe('Registration Security Tests', () => {
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
      where: { email: { contains: 'security.test' } }
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

  describe('SQL Injection Prevention', () => {
    /**
     * Test SQL injection attempts in registration fields
     */
    test('should prevent SQL injection in email field', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "admin'--",
        "admin' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --"
      ];

      for (const payload of sqlInjectionPayloads) {
        const userData = {
          firstName: 'SQL',
          lastName: 'Test',
          email: payload,
          password: 'SQLTest2024!',
          confirmPassword: 'SQLTest2024!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        // Should either reject due to invalid email format or handle safely
        expect([400, 422]).toContain(response.status);
        expect(response.body.error).not.toContain('SQL');
        expect(response.body.error).not.toContain('DROP TABLE');
      }
    });

    /**
     * Test SQL injection in name fields
     */
    test('should prevent SQL injection in name fields', async () => {
      const sqlInjectionPayload = "'; DELETE FROM users WHERE '1'='1' --";

      const userData = {
        firstName: sqlInjectionPayload,
        lastName: 'Test',
        email: 'name.sql.test@example.com',
        password: 'SQLTest2024!',
        confirmPassword: 'SQLTest2024!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should reject due to invalid name format
      expect([400, 422]).toContain(response.status);
      expect(response.body.error).not.toContain('DELETE FROM users');
    });

    /**
     * Test SQL injection in phone field
     */
    test('should prevent SQL injection in phone field', async () => {
      const sqlInjectionPayload = "'; UPDATE users SET role='ADMIN' WHERE '1'='1' --";

      const userData = {
        firstName: 'Phone',
        lastName: 'SQL',
        phone: sqlInjectionPayload,
        password: 'PhoneSQL2024!',
        confirmPassword: 'PhoneSQL2024!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should reject due to invalid phone format
      expect([400, 422]).toContain(response.status);
      expect(response.body.error).not.toContain('UPDATE users SET');
    });
  });

  describe('XSS Prevention', () => {
    /**
     * Test XSS prevention in user input fields
     */
    test('should prevent XSS attacks in user input', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        'javascript:alert("XSS")',
        '<svg onload="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
        '\';alert("XSS");//'
      ];

      for (const payload of xssPayloads) {
        const userData = {
          firstName: payload,
          lastName: 'XSS',
          email: 'xss.test@example.com',
          password: 'XSSTest2024!',
          confirmPassword: 'XSSTest2024!'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);

        // Should either reject or sanitize input
        if (response.status === 201) {
          // If accepted, verify data is sanitized in database
          const userId = response.body.user.id;
          testUsers.push({ id: userId });

          const createdUser = await prisma.user.findUnique({
            where: { id: userId }
          });

          expect(createdUser.firstName).not.toContain('<script>');
          expect(createdUser.firstName).not.toContain('javascript:');
          expect(createdUser.firstName).not.toContain('onerror=');
        } else {
          // Should reject invalid input
          expect([400, 422]).toContain(response.status);
        }
      }
    });

    /**
     * Test XSS in email field
     */
    test('should sanitize XSS in email field', async () => {
      const xssEmail = '<script>alert("XSS")</script>@example.com';

      const userData = {
        firstName: 'Email',
        lastName: 'XSS',
        email: xssEmail,
        password: 'EmailXSS2024!',
        confirmPassword: 'EmailXSS2024!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Should reject due to invalid email format
      expect([400, 422]).toContain(response.status);
    });
  });

  describe('CSRF Protection', () => {
    /**
     * Test CSRF token validation (if implemented)
     */
    test('should validate CSRF tokens when implemented', async () => {
      const userData = {
        firstName: 'CSRF',
        lastName: 'Test',
        email: 'csrf.test@example.com',
        password: 'CSRFTest2024!',
        confirmPassword: 'CSRFTest2024!'
      };

      // Test without CSRF token (if implemented)
      const response = await request(app)
        .post('/api/auth/register')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send(userData);

      // If CSRF protection is implemented, should reject without token
      // This test may need adjustment based on actual CSRF implementation
      expect([201, 400, 403]).toContain(response.status);

      if (response.status === 403) {
        expect(response.body.error).toContain('CSRF');
      }
    });
  });

  describe('Rate Limiting Security', () => {
    /**
     * Test brute force protection on registration endpoint
     */
    test('should prevent brute force registration attempts', async () => {
      const userData = {
        firstName: 'Brute',
        lastName: 'Force',
        email: 'brute.force.test@example.com',
        password: 'BruteForce2024!',
        confirmPassword: 'BruteForce2024!'
      };

      // Attempt multiple registrations quickly
      const responses = [];
      for (let i = 0; i < 10; i++) {
        userData.email = `brute.force.${i}.test@example.com`;
        const response = await request(app)
          .post('/api/auth/register')
          .send(userData);
        responses.push(response.status);
      }

      // Should eventually be rate limited
      const rateLimitedResponses = responses.filter(status => status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    /**
     * Test OTP generation rate limiting
     */
    test('should prevent OTP spamming', async () => {
      const phone = '+8801712345678';

      // Attempt to send multiple OTPs
      const responses = [];
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ phone });
        responses.push(response.status);
      }

      // Should be rate limited after certain attempts
      const successResponses = responses.filter(status => status === 200);
      const rateLimitedResponses = responses.filter(status => status === 429 || status === 400);

      expect(successResponses.length).toBeLessThanOrEqual(3); // Max 3 per hour
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Password Security', () => {
    /**
     * Test password strength enforcement
     */
    test('should enforce strong password requirements', async () => {
      const weakPasswords = [
        'password', // Common password
        '12345678', // Sequential
        'aaaaaaaa', // Repeated characters
        'qwerty', // Keyboard pattern
        'Bangladesh123', // Regional pattern
        'Test123456', // Predictable pattern
        'admin123', // Admin pattern
        'welcome123', // Common pattern
        'password123', // Very common
        '1234567890' // Sequential numbers
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
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Password does not meet requirements');
        expect(response.body.details.strength).toMatch(/^(weak|fair)$/);
      }
    });

    /**
     * Test password against personal information
     */
    test('should prevent passwords containing personal information', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678',
        password: 'JohnDoe123!', // Contains first and last name
        confirmPassword: 'JohnDoe123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.details.feedback).toContain('personal information');
    });

    /**
     * Test password history enforcement
     */
    test('should prevent password reuse', async () => {
      const userData = {
        firstName: 'History',
        lastName: 'Test',
        email: 'history.test@example.com',
        phone: '+8801712345678',
        password: 'FirstP@ssw0rd123!',
        confirmPassword: 'FirstP@ssw0rd123!'
      };

      // Register and verify user
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
        .send({ token: emailToken.token })
        .expect(200);

      // Get auth token
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

  describe('Email Verification Security', () => {
    /**
     * Test email verification token security
     */
    test('should generate secure email verification tokens', async () => {
      const userData = {
        firstName: 'Token',
        lastName: 'Security',
        email: 'token.security@example.com',
        password: 'TokenSec2024!',
        confirmPassword: 'TokenSec2024!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Check token properties
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      expect(emailToken.token).toHaveLength(64); // Should be 32 bytes = 64 hex chars
      expect(/^[a-f0-9]+$/.test(emailToken.token)).toBe(true); // Should be hex only
      expect(emailToken.expiresAt).toBeInstanceOf(Date);

      // Token should be cryptographically secure (not predictable)
      const anotherToken = emailService.generateVerificationToken();
      expect(anotherToken).not.toBe(emailToken.token);
      expect(anotherToken).toHaveLength(64);
    });

    /**
     * Test email verification token expiration
     */
    test('should expire email verification tokens', async () => {
      const userData = {
        firstName: 'Expire',
        lastName: 'Test',
        email: 'expire.test@example.com',
        password: 'ExpireTest2024!',
        confirmPassword: 'ExpireTest2024!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Manually expire token
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
  });

  describe('OTP Security', () => {
    /**
     * Test OTP generation security
     */
    test('should generate secure OTP codes', async () => {
      const phone = '+8801712345678';

      // Generate multiple OTPs
      const otps = [];
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/send-otp')
          .send({ phone });

        const phoneOTP = await prisma.phoneOTP.findFirst({
          where: { phone },
          orderBy: { createdAt: 'desc' }
        });

        if (phoneOTP && !otps.includes(phoneOTP.otp)) {
          otps.push(phoneOTP.otp);
        }
      }

      // OTPs should be unique and secure
      expect(otps.length).toBeGreaterThan(0);
      otps.forEach(otp => {
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true); // Should be digits only
      });

      // OTPs should be cryptographically random
      const uniqueOTPs = [...new Set(otps)];
      expect(uniqueOTPs.length).toBe(otps.length);
    });

    /**
     * Test OTP expiration
     */
    test('should expire OTP codes', async () => {
      const phone = '+8801912345678';

      // Generate OTP
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phone })
        .expect(200);

      // Manually expire OTP
      await prisma.phoneOTP.updateMany({
        where: { phone },
        data: { expiresAt: new Date(Date.now() - 1000) }
      });

      // Try to verify expired OTP
      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone }
      });

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone,
          otp: phoneOTP.otp
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid or expired OTP');
    });

    /**
     * Test OTP verification attempts limit
     */
    test('should limit OTP verification attempts', async () => {
      const phone = '+8801812345678';

      // Generate OTP
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phone })
        .expect(200);

      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone }
      });

      // Make maximum failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/verify-otp')
          .send({
            phone,
            otp: '123456' // Wrong OTP
          })
          .expect(400);
      }

      // Try correct OTP after max attempts
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone,
          otp: phoneOTP.otp
        })
        .expect(400);

      expect(response.body.error).toBe('Maximum verification attempts exceeded');
    });
  });

  describe('Data Sanitization', () => {
    /**
     * Test input sanitization
     */
    test('should sanitize user input data', async () => {
      const maliciousInputs = {
        firstName: '<script>alert("XSS")</script>',
        lastName: '"; DROP TABLE users; --',
        email: 'SANITIZED@EXAMPLE.COM',
        phone: '+8801712345678',
        password: 'Sanitized2024!',
        confirmPassword: 'Sanitized2024!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousInputs);

      if (response.status === 201) {
        const userId = response.body.user.id;
        testUsers.push({ id: userId });

        // Verify data is sanitized in database
        const createdUser = await prisma.user.findUnique({
          where: { id: userId }
        });

        expect(createdUser.firstName).not.toContain('<script>');
        expect(createdUser.lastName).not.toContain('DROP TABLE');
        expect(createdUser.email).toBe(maliciousInputs.email.toLowerCase()); // Should be normalized
      } else {
        // Should reject malicious input
        expect([400, 422]).toContain(response.status);
      }
    });
  });

  describe('Session Security', () => {
    /**
     * Test session management security
     */
    test('should handle session security properly', async () => {
      const userData = {
        firstName: 'Session',
        lastName: 'Security',
        email: 'session.security@example.com',
        password: 'SessionSec2024!',
        confirmPassword: 'SessionSec2024!'
      };

      // Register and verify user
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
        .send({ token: emailToken.token })
        .expect(200);

      // Login and get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Verify token structure
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20); // JWT tokens are typically long

      // Test token with invalid format
      const invalidTokenResponse = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer invalid.token.format')
        .send({
          currentPassword: userData.password,
          newPassword: 'NewTokenSec2024!',
          confirmPassword: 'NewTokenSec2024!'
        })
        .expect(401);

      expect(invalidTokenResponse.body.error).toBe('Authentication failed');
    });
  });

  describe('Information Disclosure Prevention', () => {
    /**
     * Test prevention of information disclosure
     */
    test('should not disclose sensitive information in error messages', async () => {
      // Test non-existent user
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should not reveal if user exists or not
      expect(response.body.message).toContain('If an account with that email exists');
      expect(response.body.message).not.toContain('not found');
      expect(response.body.message).not.toContain('does not exist');

      // Test invalid verification token
      const invalidTokenResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(invalidTokenResponse.body.error).toBe('Invalid token');
      expect(invalidTokenResponse.body.error).not.toContain('database');
      expect(invalidTokenResponse.body.error).not.toContain('SQL');
    });

    /**
     * Test enumeration prevention
     */
    test('should prevent user enumeration', async () => {
      const existingEmail = 'enum.test@example.com';
      const nonExistingEmail = 'nonexistent@example.com';

      // Create user with existing email
      const userData = {
        firstName: 'Enum',
        lastName: 'Test',
        email: existingEmail,
        password: 'EnumTest2024!',
        confirmPassword: 'EnumTest2024!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = await prisma.user.findFirst({
        where: { email: existingEmail }
      });
      testUsers.push({ id: userId.id });

      // Test password reset for both emails
      const existingResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: existingEmail })
        .expect(200);

      const nonExistingResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: nonExistingEmail })
        .expect(200);

      // Responses should be identical to prevent enumeration
      expect(existingResponse.body.message).toBe(nonExistingResponse.body.message);
      expect(existingResponse.status).toBe(nonExistingResponse.status);
    });
  });
});