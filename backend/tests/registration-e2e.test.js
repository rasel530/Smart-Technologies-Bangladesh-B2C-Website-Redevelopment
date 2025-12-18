/**
 * End-to-End Test Scenarios for Registration Functionality
 * 
 * This test suite covers complete user journey testing including:
 * - Happy path registration (email + phone)
 * - Email-only registration flow
 * - Phone-only registration flow
 * - Registration with verification failures
 * - Registration with password reset
 * - Registration with account suspension
 * - Registration with duplicate detection
 * - Registration with rate limiting
 * - Registration with network failures
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { emailService } = require('../services/emailService');
const { smsService } = require('../services/smsService');
const { otpService } = require('../services/otpService');
const { passwordService } = require('../services/passwordService');
const app = require('../index');

describe('Registration End-to-End Scenarios', () => {
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
      where: { email: { contains: 'e2e.test' } }
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

  describe('Happy Path Registration Scenarios', () => {
    /**
     * Complete happy path registration with both email and phone
     * This simulates the ideal user registration journey
     */
    test('should complete full registration journey with email and phone verification', async () => {
      const userData = {
        firstName: 'Happy',
        lastName: 'Path',
        email: 'happy.path.e2e.test@example.com',
        phone: '+8801712345678',
        password: 'HappyP@th2024!',
        confirmPassword: 'HappyP@th2024!'
      };

      // Step 1: User fills registration form
      console.log('📝 Step 1: User fills registration form');
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.message).toContain('Please check your email to verify your account');
      expect(registerResponse.body.user.status).toBe('PENDING');
      expect(registerResponse.body.requiresEmailVerification).toBe(true);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Step 2: User receives verification email
      console.log('📧 Step 2: User receives verification email');
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });
      expect(emailToken).toBeTruthy();
      expect(emailToken.token).toHaveLength(64);

      // Step 3: User clicks email verification link
      console.log('🔗 Step 3: User clicks email verification link');
      const emailVerifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(200);

      expect(emailVerifyResponse.body.message).toBe('Email verified successfully');
      expect(emailVerifyResponse.body.user.emailVerified).toBeTruthy();

      // Step 4: User requests phone verification
      console.log('📱 Step 4: User requests phone verification');
      const otpResponse = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: userData.phone })
        .expect(200);

      expect(otpResponse.body.message).toBe('OTP sent successfully');
      expect(otpResponse.body.operator).toBe('Grameenphone');

      // Step 5: User receives and enters OTP
      console.log('🔢 Step 5: User receives and enters OTP');
      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: userData.phone }
      });
      expect(phoneOTP).toBeTruthy();

      const otpVerifyResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: userData.phone,
          otp: phoneOTP.otp
        })
        .expect(200);

      expect(otpVerifyResponse.body.message).toBe('OTP verified successfully');

      // Step 6: User logs in with verified account
      console.log('🔐 Step 6: User logs in with verified account');
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

      // Step 7: Verify complete user state
      console.log('✅ Step 7: Verify complete user state');
      const finalUser = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(finalUser.status).toBe('ACTIVE');
      expect(finalUser.emailVerified).toBeTruthy();
      expect(finalUser.phoneVerified).toBeTruthy();
      expect(finalUser.lastLoginAt).toBeTruthy();

      console.log('🎉 Complete registration journey successful!');
    });

    /**
     * Email-only registration journey
     */
    test('should complete email-only registration journey', async () => {
      const userData = {
        firstName: 'Email',
        lastName: 'Only',
        email: 'email.only.e2e.test@example.com',
        password: 'EmailOnly2024!',
        confirmPassword: 'EmailOnly2024!'
      };

      // Registration
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Email verification
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(200);

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.user.emailVerified).toBeTruthy();
      expect(loginResponse.body.user.phoneVerified).toBeFalsy();
    });

    /**
     * Phone-only registration journey
     */
    test('should complete phone-only registration journey', async () => {
      const userData = {
        firstName: 'Phone',
        lastName: 'Only',
        phone: '+8801912345678',
        password: 'PhoneOnly2024!',
        confirmPassword: 'PhoneOnly2024!'
      };

      // Registration
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Phone OTP verification
      const otpResponse = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: userData.phone })
        .expect(200);

      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: userData.phone }
      });

      await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: userData.phone,
          otp: phoneOTP.otp
        })
        .expect(200);

      // Login with email (will fail - need email for login)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com', // No email provided
          password: userData.password
        })
        .expect(401);

      expect(loginResponse.body.error).toBe('Invalid credentials');
    });
  });

  describe('Registration with Verification Failures', () => {
    /**
     * Email verification failure scenarios
     */
    test('should handle email verification failures gracefully', async () => {
      const userData = {
        firstName: 'Email',
        lastName: 'Fail',
        email: 'email.fail.e2e.test@example.com',
        password: 'EmailFail2024!',
        confirmPassword: 'EmailFail2024!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Try to verify with invalid token
      const invalidTokenResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token-123' })
        .expect(400);

      expect(invalidTokenResponse.body.error).toBe('Invalid token');

      // Try to login without verification
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(403);

      expect(loginResponse.body.error).toBe('Email not verified');

      // Get valid token and verify
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      const verifyResponse = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(200);

      expect(verifyResponse.body.user.status).toBe('ACTIVE');

      // Now login should work
      const finalLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(finalLoginResponse.body.user.status).toBe('ACTIVE');
    });

    /**
     * Phone OTP verification failure scenarios
     */
    test('should handle phone OTP verification failures gracefully', async () => {
      const userData = {
        firstName: 'Phone',
        lastName: 'Fail',
        phone: '+8801812345678',
        password: 'PhoneFail2024!',
        confirmPassword: 'PhoneFail2024!'
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

      // Try wrong OTP multiple times
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/auth/verify-otp')
          .send({
            phone: userData.phone,
            otp: '123456'
          })
          .expect(400);
      }

      // Try correct OTP after max attempts
      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: userData.phone }
      });

      const maxAttemptsResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: userData.phone,
          otp: phoneOTP.otp
        })
        .expect(400);

      expect(maxAttemptsResponse.body.error).toBe('Maximum verification attempts exceeded');

      // Request new OTP
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for resend window

      const resendResponse = await request(app)
        .post('/api/auth/resend-otp')
        .send({ phone: userData.phone })
        .expect(200);

      expect(resendResponse.body.message).toBe('OTP resent successfully');

      // Verify with new OTP
      const newPhoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: userData.phone },
        orderBy: { createdAt: 'desc' }
      });

      const verifyResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: userData.phone,
          otp: newPhoneOTP.otp
        })
        .expect(200);

      expect(verifyResponse.body.user.status).toBe('ACTIVE');
    });
  });

  describe('Registration with Password Reset Flow', () => {
    /**
     * Complete password reset journey
     */
    test('should handle complete password reset journey', async () => {
      const userData = {
        firstName: 'Reset',
        lastName: 'Test',
        email: 'reset.test.e2e.test@example.com',
        password: 'OriginalP@ss2024!',
        confirmPassword: 'OriginalP@ss2024!'
      };

      // Register and verify user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Verify email
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(200);

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Request password reset
      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userData.email })
        .expect(200);

      expect(forgotResponse.body.message).toContain('password reset link has been sent');

      // Get reset token
      const resetToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      // Reset password
      const newPassword = 'NewResetP@ss2024!';
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken.token,
          newPassword,
          confirmPassword: newPassword
        })
        .expect(200);

      expect(resetResponse.body.message).toBe('Password reset successfully');

      // Login with new password
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: newPassword
        })
        .expect(200);

      expect(newLoginResponse.body.message).toBe('Login successful');
    });
  });

  describe('Registration with Duplicate Detection', () => {
    /**
     * Duplicate email detection
     */
    test('should prevent duplicate email registration', async () => {
      const userData = {
        firstName: 'Duplicate',
        lastName: 'Email',
        email: 'duplicate.email.e2e.test@example.com',
        password: 'Duplicate2024!',
        confirmPassword: 'Duplicate2024!'
      };

      // First registration
      const firstResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const firstUserId = firstResponse.body.user.id;
      testUsers.push({ id: firstUserId });

      // Second registration with same email
      const secondResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(secondResponse.body.error).toBe('User already exists');
      expect(secondResponse.body.field).toBe('email');
    });

    /**
     * Duplicate phone detection
     */
    test('should prevent duplicate phone registration', async () => {
      const userData = {
        firstName: 'Duplicate',
        lastName: 'Phone',
        phone: '+8801512345678',
        password: 'Duplicate2024!',
        confirmPassword: 'Duplicate2024!'
      };

      // First registration
      const firstResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const firstUserId = firstResponse.body.user.id;
      testUsers.push({ id: firstUserId });

      // Second registration with same phone
      const secondResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(secondResponse.body.error).toBe('User already exists');
      expect(secondResponse.body.field).toBe('phone');
    });
  });

  describe('Registration with Rate Limiting', () => {
    /**
     * Email verification rate limiting
     */
    test('should enforce email verification rate limiting', async () => {
      const userData = {
        firstName: 'Rate',
        lastName: 'Limit',
        email: 'rate.limit.e2e.test@example.com',
        password: 'RateLimit2024!',
        confirmPassword: 'RateLimit2024!'
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Request multiple verification emails quickly
      const responses = [];
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/auth/resend-verification')
          .send({ email: userData.email });
        responses.push(response.status);
      }

      // First should succeed, subsequent should be rate limited
      expect(responses[0]).toBe(200);
      expect(responses[1]).toBe(429);
      expect(responses[2]).toBe(429);
    });

    /**
     * OTP generation rate limiting
     */
    test('should enforce OTP generation rate limiting', async () => {
      const phone = '+8801612345678';

      // Send multiple OTP requests quickly
      const responses = [];
      for (let i = 0; i < 4; i++) {
        const response = await request(app)
          .post('/api/auth/send-otp')
          .send({ phone });
        responses.push(response.status);
      }

      // First 3 should succeed, 4th should be rate limited
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
  });

  describe('Registration with Network Failures', () => {
    /**
     * Email service failure handling
     */
    test('should handle email service failure gracefully', async () => {
      // Mock email service failure
      const originalSendVerificationEmail = emailService.sendVerificationEmail;
      emailService.sendVerificationEmail = jest.fn().mockResolvedValue({
        success: false,
        error: 'SMTP connection failed'
      });

      const userData = {
        firstName: 'Network',
        lastName: 'Fail',
        email: 'network.fail.e2e.test@example.com',
        password: 'NetworkFail2024!',
        confirmPassword: 'NetworkFail2024!'
      };

      // Registration should fail due to email service
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.error).toBe('Registration failed');
      expect(response.body.message).toContain('Failed to send verification email');

      // Verify cleanup occurred
      const user = await prisma.user.findFirst({
        where: { email: userData.email }
      });
      expect(user).toBeFalsy();

      // Restore original function
      emailService.sendVerificationEmail = originalSendVerificationEmail;
    });

    /**
     * SMS service failure handling
     */
    test('should handle SMS service failure gracefully', async () => {
      // Mock SMS service failure
      const originalSendOTP = smsService.sendOTP;
      smsService.sendOTP = jest.fn().mockResolvedValue({
        success: false,
        error: 'Twilio API error'
      });

      const userData = {
        firstName: 'SMS',
        lastName: 'Fail',
        phone: '+8801412345678',
        password: 'SMSFail2024!',
        confirmPassword: 'SMSFail2024!'
      };

      // Registration should fail due to SMS service
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.error).toBe('Registration failed');
      expect(response.body.message).toContain('Failed to send OTP');

      // Verify cleanup occurred
      const user = await prisma.user.findFirst({
        where: { phone: userData.phone }
      });
      expect(user).toBeFalsy();

      // Restore original function
      smsService.sendOTP = originalSendOTP;
    });
  });

  describe('Multi-Step Registration Journey', () => {
    /**
     * Simulate frontend multi-step form journey
     */
    test('should handle multi-step registration form journey', async () => {
      // Step 1: Basic information
      const basicInfo = {
        firstName: 'Multi',
        lastName: 'Step',
        email: 'multi.step.e2e.test@example.com',
        phone: '+8801712345678',
        password: 'MultiStep2024!',
        confirmPassword: 'MultiStep2024!'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(basicInfo)
        .expect(201);

      const userId = registerResponse.body.user.id;
      testUsers.push({ id: userId });

      // Step 2: Email verification
      const emailToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: emailToken.token })
        .expect(200);

      // Step 3: Phone verification
      await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: basicInfo.phone })
        .expect(200);

      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: basicInfo.phone }
      });

      await request(app)
        .post('/api/auth/verify-otp')
        .send({
          phone: basicInfo.phone,
          otp: phoneOTP.otp
        })
        .expect(200);

      // Step 4: Complete profile setup (simulated)
      const profileData = {
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nationalId: '1234567890',
        division: 'DHAKA',
        district: 'Dhaka',
        upazila: 'Dhaka Sadar',
        addressLine1: '123 Test Street',
        addressLine2: 'Apartment 4B',
        postalCode: '1000',
        preferredLanguage: 'en',
        marketingConsent: true,
        termsAccepted: true
      };

      // Simulate profile update (would normally be separate API)
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender,
          nationalId: profileData.nationalId
        }
      });

      // Create address
      await prisma.address.create({
        data: {
          userId,
          type: 'SHIPPING',
          firstName: basicInfo.firstName,
          lastName: basicInfo.lastName,
          phone: basicInfo.phone,
          address: profileData.addressLine1,
          addressLine2: profileData.addressLine2,
          city: profileData.district,
          district: profileData.district,
          division: profileData.division,
          upazila: profileData.upazila,
          postalCode: profileData.postalCode,
          isDefault: true
        }
      });

      // Step 5: Final login and verification
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: basicInfo.email,
          password: basicInfo.password
        })
        .expect(200);

      expect(loginResponse.body.user.status).toBe('ACTIVE');
      expect(loginResponse.body.user.emailVerified).toBeTruthy();
      expect(loginResponse.body.user.phoneVerified).toBeTruthy();

      // Verify complete profile
      const completeUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          addresses: true
        }
      });

      expect(completeUser.dateOfBirth).toEqual(profileData.dateOfBirth);
      expect(completeUser.gender).toBe(profileData.gender);
      expect(completeUser.addresses).toHaveLength(1);
      expect(completeUser.addresses[0].division).toBe(profileData.division);
    });
  });
});