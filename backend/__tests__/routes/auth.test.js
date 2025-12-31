/**
 * Comprehensive authentication routes testing
 * Tests all authentication endpoints including registration, login, logout,
 * email/phone verification, password management, and security features
 */

const request = require('supertest');
const express = require('express');
const { TestHelpers } = require('../utils/testHelpers');

// Import the auth routes
const authRoutes = require('../../routes/auth');

describe('Authentication Routes', () => {
  let app;
  let testHelpers;
  let testUser;

  beforeAll(async () => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRoutes);
    
    testHelpers = new TestHelpers();
  });

  afterAll(async () => {
    await testHelpers.disconnect();
  });

  beforeEach(async () => {
    // Create a fresh test user for each test
    testUser = await testHelpers.createTestUser();
  });

  afterEach(async () => {
    // Clean up any test data
    await testHelpers.cleanup();
  });

  describe('POST /register', () => {
    /**
     * Test successful user registration with email
     * Verifies that a new user can be registered with valid data
     */
    it('should register a new user with email successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'NewUser123!',
        firstName: 'New',
        lastName: 'User',
        confirmPassword: 'NewUser123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('messageBn');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user).not.toHaveProperty('password');
    });

    /**
     * Test successful user registration with phone number
     * Verifies Bangladesh phone number validation and registration
     */
    it('should register a new user with Bangladesh phone number successfully', async () => {
      const userData = {
        phone: '+8801700000001',
        password: 'PhoneUser123!',
        firstName: 'Phone',
        lastName: 'User',
        confirmPassword: 'PhoneUser123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.phone).toBe(userData.phone);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
    });

    /**
     * Test registration with both email and phone
     * Verifies dual identifier registration works
     */
    it('should register user with both email and phone', async () => {
      const userData = {
        email: 'dual@example.com',
        phone: '+8801800000001',
        password: 'DualUser123!',
        firstName: 'Dual',
        lastName: 'User',
        confirmPassword: 'DualUser123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.phone).toBe(userData.phone);
    });

    /**
     * Test registration failure with missing identifiers
     * Verifies that either email or phone is required
     */
    it('should reject registration without email or phone', async () => {
      const userData = {
        password: 'NoIdentifier123!',
        firstName: 'No',
        lastName: 'Identifier',
        confirmPassword: 'NoIdentifier123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Email or phone required');
      expect(response.body.messageBn).toBeDefined();
    });

    /**
     * Test registration failure with mismatched passwords
     * Verifies password confirmation validation
     */
    it('should reject registration with mismatched passwords', async () => {
      const userData = {
        email: 'mismatch@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        firstName: 'Mismatch',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Passwords do not match');
      expect(response.body.messageBn).toBeDefined();
    });

    /**
     * Test registration with weak password
     * Verifies password strength validation
     */
    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'weak@example.com',
        password: '123',
        confirmPassword: '123',
        firstName: 'Weak',
        lastName: 'Password'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Password does not meet requirements');
      expect(response.body.details).toHaveProperty('strength');
      expect(response.body.details).toHaveProperty('feedback');
    });

    /**
     * Test registration with duplicate email
     * Verifies email uniqueness constraint
     */
    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: testUser.email,
        password: 'Duplicate123!',
        firstName: 'Duplicate',
        lastName: 'Email',
        confirmPassword: 'Duplicate123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User already exists');
      expect(response.body.field).toBe('email');
    });

    /**
     * Test registration with invalid Bangladesh phone number
     * Verifies phone number format validation
     */
    it('should reject registration with invalid phone number', async () => {
      const invalidPhones = testHelpers.createBangladeshTestData().invalidPhones;

      for (const phone of invalidPhones) {
        const userData = {
          phone,
          password: 'PhoneTest123!',
          firstName: 'Invalid',
          lastName: 'Phone',
          confirmPassword: 'PhoneTest123!'
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBe('Invalid phone format');
      }
    });

    /**
     * Test registration with disposable email
     * Verifies disposable email rejection
     */
    it('should reject registration with disposable email', async () => {
      const userData = {
        email: 'test@10minutemail.com',
        password: 'Disposable123!',
        firstName: 'Disposable',
        lastName: 'Email',
        confirmPassword: 'Disposable123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Disposable email not allowed');
    });
  });

  describe('POST /login', () => {
    /**
     * Test successful login with email
     * Verifies email-based authentication works
     */
    it('should login user with email successfully', async () => {
      const loginData = {
        identifier: testUser.email,
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('expiresAt');
    });

    /**
     * Test successful login with phone number
     * Verifies phone-based authentication works
     */
    it('should login user with phone number successfully', async () => {
      const phoneUser = await testHelpers.createTestUser({
        email: null,
        phone: '+8801700000002'
      });

      const loginData = {
        identifier: phoneUser.phone,
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user.phone).toBe(phoneUser.phone);
      expect(response.body).toHaveProperty('token');
    });

    /**
     * Test login with remember me functionality
     * Verifies extended session duration
     */
    it('should login with remember me functionality', async () => {
      const loginData = {
        identifier: testUser.email,
        password: 'TestPassword123!',
        rememberMe: true
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.rememberMe).toBe(true);
      expect(response.body.maxAge).toBeGreaterThan(24 * 60 * 60 * 1000); // More than 24 hours
    });

    /**
     * Test login failure with invalid credentials
     * Verifies authentication security
     */
    it('should reject login with invalid credentials', async () => {
      const loginData = {
        identifier: testUser.email,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
      expect(response.body.messageBn).toBeDefined();
    });

    /**
     * Test login failure with non-existent user
     * Verifies user existence validation
     */
    it('should reject login with non-existent user', async () => {
      const loginData = {
        identifier: 'nonexistent@example.com',
        password: 'SomePassword123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    /**
     * Test login with unverified account
     * Verifies email/phone verification requirement
     */
    it('should reject login with unverified account', async () => {
      const unverifiedUser = await testHelpers.createTestUser({
        status: 'PENDING',
        emailVerified: null,
        phoneVerified: null
      });

      const loginData = {
        identifier: unverifiedUser.email,
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body.error).toBe('Account not verified');
      expect(response.body.requiresVerification).toBe(true);
    });
  });

  describe('POST /logout', () => {
    /**
     * Test successful logout
     * Verifies session termination
     */
    it('should logout user successfully', async () => {
      // First login to get session
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testUser.email,
          password: 'TestPassword123!'
        });

      const sessionId = loginResponse.body.sessionId;

      // Then logout
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send()
        .set('Cookie', `sessionId=${sessionId}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
      expect(response.body.messageBn).toBeDefined();
    });

    /**
     * Test logout from all devices
     * Verifies mass session termination
     */
    it('should logout from all devices', async () => {
      const loginData = {
        identifier: testUser.email,
        password: 'TestPassword123!'
      };

      // Create multiple sessions
      await request(app).post('/api/v1/auth/login').send(loginData);
      await request(app).post('/api/v1/auth/login').send(loginData);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ allDevices: true })
        .expect(200);

      expect(response.body.allDevices).toBe(true);
      expect(response.body.destroyedCount).toBeGreaterThan(1);
    });

    /**
     * Test logout without active session
     * Verifies graceful handling of missing session
     */
    it('should handle logout without active session', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send()
        .expect(400);

      expect(response.body.error).toBe('No session found');
    });
  });

  describe('POST /verify-email', () => {
    /**
     * Test successful email verification
     * Verifies email verification token processing
     */
    it('should verify email successfully', async () => {
      // Create verification token
      const token = 'test-verification-token';
      await testHelpers.prisma.emailVerificationToken.create({
        data: {
          userId: testUser.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully');
      expect(response.body.user.status).toBe('ACTIVE');
      expect(response.body.user.emailVerified).toBeDefined();
    });

    /**
     * Test email verification with invalid token
     * Verifies token validation
     */
    it('should reject verification with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error).toBe('Invalid token');
    });

    /**
     * Test email verification with expired token
     * Verifies token expiration handling
     */
    it('should reject verification with expired token', async () => {
      // Create expired token
      const token = 'expired-token';
      await testHelpers.prisma.emailVerificationToken.create({
        data: {
          userId: testUser.id,
          token,
          expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      });

      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(400);

      expect(response.body.error).toBe('Token expired');
    });
  });

  describe('POST /send-otp and /verify-otp', () => {
    /**
     * Test OTP sending for Bangladesh phone numbers
     * Verifies OTP generation and delivery
     */
    it('should send OTP to Bangladesh phone number', async () => {
      const phoneNumbers = testHelpers.createBangladeshTestData().validPhones;

      for (const [operator, phone] of Object.entries(phoneNumbers)) {
        const response = await request(app)
          .post('/api/v1/auth/send-otp')
          .send({ phone })
          .expect(200);

        expect(response.body.message).toBe('OTP sent successfully');
        expect(response.body.phone).toBe(phone);
        expect(response.body.operator).toBeDefined();
      }
    });

    /**
     * Test OTP verification
     * Verifies OTP validation and phone verification
     */
    it('should verify OTP successfully', async () => {
      const phone = '+8801700000003';
      const otp = '123456'; // Mock OTP

      // Mock OTP service to return our test OTP
      jest.mock('../../services/otpService', () => ({
        generatePhoneOTP: jest.fn().mockResolvedValue({
          success: true,
          otp,
          phone
        }),
        verifyPhoneOTP: jest.fn().mockResolvedValue({
          success: true,
          verifiedAt: new Date()
        })
      }));

      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone, otp })
        .expect(200);

      expect(response.body.message).toBe('OTP verified successfully');
      expect(response.body.phone).toBe(phone);
      expect(response.body.verifiedAt).toBeDefined();
    });

    /**
     * Test OTP verification with invalid code
     * Verifies OTP validation security
     */
    it('should reject verification with invalid OTP', async () => {
      const phone = '+8801700000004';
      const invalidOtp = '999999';

      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone, otp: invalidOtp })
        .expect(400);

      expect(response.body.error).toBe('OTP verification failed');
    });

    /**
     * Test OTP sending to invalid phone number
     * Verifies phone number validation
     */
    it('should reject OTP sending to invalid phone number', async () => {
      const invalidPhones = testHelpers.createBangladeshTestData().invalidPhones;

      for (const phone of invalidPhones) {
        const response = await request(app)
          .post('/api/v1/auth/send-otp')
          .send({ phone })
          .expect(400);

        expect(response.body.error).toBe('Invalid phone format');
      }
    });
  });

  describe('Password Management', () => {
    describe('POST /forgot-password', () => {
      /**
       * Test password reset request with email
       * Verifies password reset initiation
       */
      it('should send password reset email', async () => {
        const response = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: testUser.email })
          .expect(200);

        expect(response.body.message).toBe('Password reset email sent successfully');
      });

      /**
       * Test password reset request with non-existent email
       * Verifies security (doesn't reveal email existence)
       */
      it('should handle password reset for non-existent email', async () => {
        const response = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'nonexistent@example.com' })
          .expect(200);

        expect(response.body.message).toContain('If an account with that email exists');
      });
    });

    describe('POST /reset-password', () => {
      /**
       * Test password reset with valid token
       * Verifies password reset completion
       */
      it('should reset password with valid token', async () => {
        // Create reset token
        const token = 'reset-token-123';
        await testHelpers.prisma.emailVerificationToken.create({
          data: {
            userId: testUser.id,
            token,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
          }
        });

        const newPassword = 'NewResetPassword123!';
        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token,
            newPassword,
            confirmPassword: newPassword
          })
          .expect(200);

        expect(response.body.message).toBe('Password reset successfully');
      });

      /**
       * Test password reset with invalid token
       * Verifies token validation
       */
      it('should reject password reset with invalid token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token: 'invalid-reset-token',
            newPassword: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
          })
          .expect(400);

        expect(response.body.error).toBe('Invalid token');
      });

      /**
       * Test password reset with weak password
       * Verifies password strength validation
       */
      it('should reject password reset with weak password', async () => {
        const token = 'reset-token-weak';
        await testHelpers.prisma.emailVerificationToken.create({
          data: {
            userId: testUser.id,
            token,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000)
          }
        });

        const response = await request(app)
          .post('/api/v1/auth/reset-password')
          .send({
            token,
            newPassword: '123',
            confirmPassword: '123'
          })
          .expect(400);

        expect(response.body.error).toBe('Password does not meet requirements');
      });
    });

    describe('POST /change-password', () => {
      /**
       * Test password change with valid current password
       * Verifies authenticated password change
       */
      it('should change password successfully', async () => {
        const newPassword = 'NewChangedPassword123!';
        const response = await request(app)
          .post('/api/v1/auth/change-password')
          .set('Authorization', `Bearer ${testHelpers.generateTestToken({ userId: testUser.id })}`)
          .send({
            currentPassword: 'TestPassword123!',
            newPassword,
            confirmPassword: newPassword
          })
          .expect(200);

        expect(response.body.message).toBe('Password changed successfully');
      });

      /**
       * Test password change with invalid current password
       * Verifies current password validation
       */
      it('should reject password change with invalid current password', async () => {
        const response = await request(app)
          .post('/api/v1/auth/change-password')
          .set('Authorization', `Bearer ${testHelpers.generateTestToken({ userId: testUser.id })}`)
          .send({
            currentPassword: 'WrongPassword123!',
            newPassword: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
          })
          .expect(401);

        expect(response.body.error).toBe('Invalid current password');
      });

      /**
       * Test password change without authentication
       * Verifies authentication requirement
       */
      it('should reject password change without authentication', async () => {
        const response = await request(app)
          .post('/api/v1/auth/change-password')
          .send({
            currentPassword: 'TestPassword123!',
            newPassword: 'NewPassword123!',
            confirmPassword: 'NewPassword123!'
          })
          .expect(401);
      });
    });
  });

  describe('Bangladesh-Specific Features', () => {
    describe('POST /validate-phone', () => {
      /**
       * Test Bangladesh phone number validation
       * Verifies all major operators are supported
       */
      it('should validate all Bangladesh mobile operators', async () => {
        const validPhones = testHelpers.createBangladeshTestData().validPhones;

        for (const [operator, phone] of Object.entries(validPhones)) {
          const response = await request(app)
            .post('/api/v1/auth/validate-phone')
            .send({ phone })
            .expect(200);

          expect(response.body.validation.isValid).toBe(true);
          expect(response.body.validation.operator).toBeDefined();
        }
      });

      /**
       * Test invalid phone number rejection
       * Verifies format validation
       */
      it('should reject invalid phone numbers', async () => {
        const invalidPhones = testHelpers.createBangladeshTestData().invalidPhones;

        for (const phone of invalidPhones) {
          const response = await request(app)
            .post('/api/v1/auth/validate-phone')
            .send({ phone })
            .expect(200);

          expect(response.body.validation.isValid).toBe(false);
        }
      });
    });

    describe('GET /operators', () => {
      /**
       * Test supported operators endpoint
       * Verifies Bangladesh mobile operators are listed
       */
      it('should return supported Bangladesh operators', async () => {
        const response = await request(app)
          .get('/api/v1/auth/operators')
          .expect(200);

        expect(response.body.operators).toBeDefined();
        expect(Array.isArray(response.body.operators)).toBe(true);
        
        // Check for major Bangladesh operators
        const operators = response.body.operators.map(op => op.code);
        expect(operators).toContain('grameenphone');
        expect(operators).toContain('banglalink');
        expect(operators).toContain('robi');
        expect(operators).toContain('teletalk');
        expect(operators).toContain('airtel');
      });
    });
  });

  describe('Security Features', () => {
    /**
     * Test SQL injection protection
     * Verifies input sanitization
     */
    it('should protect against SQL injection attempts', async () => {
      const sqlInjectionAttempts = testHelpers.createSecurityTestData().sqlInjection;

      for (const injection of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            identifier: injection,
            password: 'password123'
          })
          .expect(401);

        expect(response.body.error).toBe('Invalid credentials');
      }
    });

    /**
     * Test XSS protection
     * Verifies input sanitization
     */
    it('should protect against XSS attempts', async () => {
      const xssAttempts = testHelpers.createSecurityTestData().xss;

      for (const xss of xssAttempts) {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'xss@example.com',
            password: 'XssTest123!',
            firstName: xss,
            lastName: 'Test',
            confirmPassword: 'XssTest123!'
          })
          .expect(400);

        // Should not contain script tags in error messages
        expect(response.body.message).not.toContain('<script>');
      }
    });

    /**
     * Test rate limiting
     * Verifies brute force protection
     */
    it('should implement rate limiting for login attempts', async () => {
      const loginData = {
        identifier: testUser.email,
        password: 'WrongPassword123!'
      };

      // Make multiple failed attempts
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send(loginData);
      }

      // Should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body.error).toContain('Too many requests');
    });
  });

  describe('Session Management', () => {
    /**
     * Test session validation
     * Verifies active session checking
     */
    it('should validate active session', async () => {
      // Create session
      const session = await testHelpers.createTestSession(testUser.id);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', `sessionId=${session.token}`)
        .expect(200);

      expect(response.body.data.id).toBe(testUser.id);
    });

    /**
     * Test session expiration
     * Verifies expired session rejection
     */
    it('should reject expired session', async () => {
      // Create expired session
      const session = await testHelpers.createTestSession(testUser.id, {
        expiresAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', `sessionId=${session.token}`)
        .expect(401);

      expect(response.body.error).toContain('Session expired');
    });
  });
});