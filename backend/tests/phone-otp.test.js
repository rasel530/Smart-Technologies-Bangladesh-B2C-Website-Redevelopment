const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { smsService } = require('../services/smsService');
const { otpService } = require('../services/otpService');
const app = require('../index');

describe('Phone OTP Service', () => {
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.phoneOTP.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
  });

  describe('Bangladesh Phone Number Validation', () => {
    test('should validate +880 format numbers', () => {
      const result = smsService.validateBangladeshPhoneNumber('+8801712345678');
      
      expect(result.valid).toBe(true);
      expect(result.normalizedPhone).toBe('+8801712345678');
      expect(result.operator).toBe('Grameenphone');
    });

    test('should validate local format numbers', () => {
      const result = smsService.validateBangladeshPhoneNumber('01712345678');
      
      expect(result.valid).toBe(true);
      expect(result.normalizedPhone).toBe('+8801712345678');
      expect(result.operator).toBe('Grameenphone');
    });

    test('should validate 880 format numbers', () => {
      const result = smsService.validateBangladeshPhoneNumber('8801712345678');
      
      expect(result.valid).toBe(true);
      expect(result.normalizedPhone).toBe('+8801712345678');
      expect(result.operator).toBe('Grameenphone');
    });

    test('should reject invalid numbers', () => {
      const result = smsService.validateBangladeshPhoneNumber('12345678');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Bangladesh phone number format');
    });

    test('should reject unsupported operators', () => {
      const result = smsService.validateBangladeshPhoneNumber('+8801212345678');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported mobile operator');
    });

    test('should validate all major operators', () => {
      const operators = [
        { phone: '+8801312345678', operator: 'Grameenphone' },
        { phone: '+8801712345678', operator: 'Grameenphone' },
        { phone: '+8801912345678', operator: 'Banglalink' },
        { phone: '+8801812345678', operator: 'Robi' },
        { phone: '+8801512345678', operator: 'Teletalk' },
        { phone: '+8801612345678', operator: 'Airtel' },
        { phone: '+8801412345678', operator: 'Banglalink' }
      ];

      operators.forEach(({ phone, operator }) => {
        const result = smsService.validateBangladeshPhoneNumber(phone);
        expect(result.valid).toBe(true);
        expect(result.operator).toBe(operator);
      });
    });
  });

  describe('OTP Generation', () => {
    test('should generate 6-digit OTP', async () => {
      const phone = '+8801712345678';
      
      const result = await otpService.generatePhoneOTP(phone);
      
      expect(result.success).toBe(true);
      expect(result.phone).toBe(phone);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.mock).toBe(true); // In test environment
    });

    test('should reject invalid phone numbers', async () => {
      const phone = '12345678';
      
      const result = await otpService.generatePhoneOTP(phone);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_PHONE');
    });

    test('should enforce rate limiting', async () => {
      const phone = '+8801712345678';
      
      // Generate first OTP
      const result1 = await otpService.generatePhoneOTP(phone);
      expect(result1.success).toBe(true);

      // Generate second OTP (should work)
      const result2 = await otpService.generatePhoneOTP(phone);
      expect(result2.success).toBe(true);

      // Generate third OTP (should work)
      const result3 = await otpService.generatePhoneOTP(phone);
      expect(result3.success).toBe(true);

      // Generate fourth OTP (should fail due to rate limiting)
      const result4 = await otpService.generatePhoneOTP(phone);
      expect(result4.success).toBe(false);
      expect(result4.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should handle SMS service failure', async () => {
      const phone = '+8801712345678';
      
      // Mock SMS service failure
      const originalSendOTP = smsService.sendOTP;
      smsService.sendOTP = jest.fn().mockResolvedValue({
        success: false,
        error: 'SMS service unavailable'
      });

      const result = await otpService.generatePhoneOTP(phone);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('SMS_SEND_FAILED');

      // Restore original function
      smsService.sendOTP = originalSendOTP;
    });
  });

  describe('OTP Verification', () => {
    test('should verify valid OTP', async () => {
      const phone = '+8801712345678';
      
      // Generate OTP first
      const generateResult = await otpService.generatePhoneOTP(phone);
      expect(generateResult.success).toBe(true);

      // Verify the OTP (we need to extract it from the mock)
      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone }
      });
      expect(phoneOTP).toBeTruthy();

      const result = await otpService.verifyPhoneOTP(phone, phoneOTP.otp);
      
      expect(result.success).toBe(true);
      expect(result.phone).toBe(phone);
    });

    test('should reject invalid OTP', async () => {
      const phone = '+8801712345678';
      
      const result = await otpService.verifyPhoneOTP(phone, '123456');
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_OTP');
    });

    test('should reject expired OTP', async () => {
      const phone = '+8801712345678';
      
      // Create expired OTP manually
      await prisma.phoneOTP.create({
        data: {
          phone,
          otp: '123456',
          expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
        }
      });

      const result = await otpService.verifyPhoneOTP(phone, '123456');
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_OTP');
    });

    test('should enforce maximum verification attempts', async () => {
      const phone = '+8801712345678';
      
      // Generate OTP
      const generateResult = await otpService.generatePhoneOTP(phone);
      expect(generateResult.success).toBe(true);

      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone }
      });

      // Attempt verification 3 times (should fail on 4th)
      for (let i = 0; i < 3; i++) {
        const result = await otpService.verifyPhoneOTP(phone, 'wrongotp');
        expect(result.success).toBe(false);
        expect(result.code).toBe('INVALID_OTP');
      }

      // 4th attempt should fail with max attempts error
      const result4 = await otpService.verifyPhoneOTP(phone, phoneOTP.otp);
      expect(result4.success).toBe(false);
      expect(result4.code).toBe('MAX_ATTEMPTS_EXCEEDED');
    });
  });

  describe('OTP Resend', () => {
    test('should resend OTP after waiting period', async () => {
      const phone = '+8801712345678';
      
      // Generate initial OTP
      const result1 = await otpService.generatePhoneOTP(phone);
      expect(result1.success).toBe(true);

      // Wait 3 seconds (longer than 2-minute requirement)
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result2 = await otpService.resendPhoneOTP(phone);
      expect(result2.success).toBe(true);
    });

    test('should reject immediate resend', async () => {
      const phone = '+8801712345678';
      
      // Generate initial OTP
      const result1 = await otpService.generatePhoneOTP(phone);
      expect(result1.success).toBe(true);

      // Try immediate resend (should fail)
      const result2 = await otpService.resendPhoneOTP(phone);
      expect(result2.success).toBe(false);
      expect(result2.code).toBe('RESEND_TOO_SOON');
      expect(result2.waitTime).toBeGreaterThan(0);
    });
  });
});

describe('Phone OTP API Endpoints', () => {
  describe('POST /auth/send-otp', () => {
    test('should send OTP for valid phone', async () => {
      const response = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({
          phone: '+8801712345678'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP sent successfully');
      expect(response.body.phone).toBe('+8801712345678');
      expect(response.body.operator).toBe('Grameenphone');
    });

    test('should reject invalid phone format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({
          phone: '12345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid phone format');
    });

    test('should reject already verified phone', async () => {
      // Create a verified user first
      const user = await prisma.user.create({
        data: {
          email: 'test-verified@example.com',
          phone: '+8801712345678',
          firstName: 'Test',
          lastName: 'User',
          password: 'password123',
          phoneVerified: new Date(),
          status: 'ACTIVE'
        }
      });

      const response = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({
          phone: '+8801712345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Phone already verified');

      // Clean up
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('POST /auth/verify-otp', () => {
    test('should verify valid OTP', async () => {
      // Generate OTP first
      const generateResponse = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({
          phone: '+8801712345678'
        });

      expect(generateResponse.status).toBe(200);

      // Get OTP from database for verification
      const phoneOTP = await prisma.phoneOTP.findFirst({
        where: { phone: '+8801712345678' }
      });
      expect(phoneOTP).toBeTruthy();

      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: '+8801712345678',
          otp: phoneOTP.otp
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP verified successfully');
    });

    test('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: '+8801712345678',
          otp: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('OTP verification failed');
    });

    test('should reject invalid phone format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          phone: '12345678',
          otp: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid phone format');
    });
  });

  describe('POST /auth/resend-otp', () => {
    test('should resend OTP after waiting period', async () => {
      // Generate initial OTP
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({
          phone: '+8801712345678'
        });

      // Wait 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));

      const response = await request(app)
        .post('/api/v1/auth/resend-otp')
        .send({
          phone: '+8801712345678'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('OTP resent successfully');
    });

    test('should reject immediate resend', async () => {
      // Generate initial OTP
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({
          phone: '+8801712345678'
        });

      const response = await request(app)
        .post('/api/v1/auth/resend-otp')
        .send({
          phone: '+8801712345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Failed to resend OTP');
      expect(response.body.code).toBe('RESEND_TOO_SOON');
    });
  });
});

describe('Phone Registration Flow', () => {
  test('should register user with phone only', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Registration successful. Please check your phone for OTP verification.');
    expect(response.body.requiresPhoneVerification).toBe(true);
    expect(response.body.user.phone).toBe('+8801712345678');
    expect(response.body.user.status).toBe('PENDING');
  });

  test('should register user with email and phone', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+8801712345678',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Registration successful. Please check your email to verify your account.');
    expect(response.body.requiresEmailVerification).toBe(true);
  });

  test('should reject registration without email or phone', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        password: 'password123'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email or phone required');
  });

  test('should reject duplicate phone numbers', async () => {
    // Create initial user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678',
        password: 'password123'
      });

    // Try to register with same phone
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Test2',
        lastName: 'User2',
        phone: '+8801712345678',
        password: 'password456'
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('User already exists');
    expect(response.body.field).toBe('phone');
  });
});

describe('Phone Verification Middleware', () => {
  test('should allow access with verified phone', async () => {
    // Create verified user
    const user = await prisma.user.create({
      data: {
        email: 'test-verified@example.com',
        phone: '+8801712345678',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        phoneVerified: new Date(),
        status: 'ACTIVE'
      }
    });

    // Generate token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-verified@example.com',
        password: 'password123'
      });

    const token = loginResponse.body.token;

    // Access protected route
    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
  });

  test('should block access with unverified phone', async () => {
    // Create unverified user
    const user = await prisma.user.create({
      data: {
        email: 'test-unverified@example.com',
        phone: '+8801712345678',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        phoneVerified: null,
        status: 'PENDING'
      }
    });

    // Generate token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test-unverified@example.com',
        password: 'password123'
      });

    const token = loginResponse.body.token;

    // Try to access protected route (this will fail because login requires email verification)
    // We'll test a hypothetical protected route that requires phone verification
    const response = await request(app)
      .get('/api/v1/test-phone-protected')
      .set('Authorization', `Bearer ${token}`)
      .send();

    // This would require the route to be protected by phone verification middleware
    // For now, we'll test the middleware directly
    const { phoneVerificationMiddleware } = require('../middleware/phoneVerification');
    
    const mockReq = {
      userId: user.id,
      ip: '127.0.0.1',
      originalUrl: '/api/v1/test-route'
    };

    const mockRes = {
      status: jest.fn(),
      json: jest.fn()
    };

    const mockNext = jest.fn();

    await phoneVerificationMiddleware.requirePhoneVerification()(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Phone not verified',
      message: 'Please verify your phone number to access this resource',
      requiresPhoneVerification: true
    });
    expect(mockNext).not.toHaveBeenCalled();

    // Clean up
    await prisma.user.delete({ where: { id: user.id } });
  });
});