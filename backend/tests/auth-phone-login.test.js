const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock services
jest.mock('../services/emailService');
jest.mock('../services/phoneValidationService');
jest.mock('../services/passwordService');
jest.mock('../services/config', () => ({
  configService: {
    getSecurityConfig: () => ({
      bcryptRounds: 12,
      passwordMinLength: 8,
      passwordMaxLength: 128
    }),
    getPasswordPolicyConfig: () => ({
      bcryptRounds: 12,
      passwordMinLength: 8,
      passwordMaxLength: 128,
      minStrengthScore: 2
    })
  }
}));

const authRoutes = require('../routes/auth');
const { emailService } = require('../services/emailService');
const { phoneValidationService } = require('../services/phoneValidationService');
const { passwordService } = require('../services/passwordService');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Phone Login Tests', () => {
  let prisma;
  let testUser;

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Create a test user with both email and phone
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        phone: '+8801712345678',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await prisma.user.delete({
        where: { id: testUser.id }
      });
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    describe('Email Login', () => {
      it('should login successfully with valid email and password', async () => {
        const response = await request(app)
          .post('/auth/login')
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

      it('should reject login with invalid email', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: 'invalid@example.com',
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid credentials');
      });

      it('should reject login with invalid email format', async () => {
        emailService.validateEmail.mockReturnValue(false);
        
        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: 'invalid-email',
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid email format');
      });
    });

    describe('Phone Login', () => {
      it('should login successfully with valid phone and password', async () => {
        phoneValidationService.validateForUseCase.mockReturnValue({
          isValid: true,
          normalizedPhone: '+8801712345678',
          type: 'mobile',
          operator: 'Grameenphone',
          canLogin: true
        });

        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: '01712345678',
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful');
        expect(response.body.user.phone).toBe('+8801712345678');
        expect(response.body.loginType).toBe('phone');
        expect(response.body.token).toBeDefined();
      });

      it('should reject login with invalid phone format', async () => {
        phoneValidationService.validateForUseCase.mockReturnValue({
          isValid: false,
          error: 'Invalid phone format',
          errorBn: 'অবৈধ ফোন ফরম্যাট',
          code: 'INVALID_FORMAT'
        });

        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: '12345',
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid phone format');
      });

      it('should reject login with non-mobile phone', async () => {
        phoneValidationService.validateForUseCase.mockReturnValue({
          isValid: false,
          error: 'Only mobile numbers can be used for login',
          errorBn: 'শুধুমাত্রমাত্র মোবাইল নম্বর দিয়ে লগিন করা যায়',
          code: 'MOBILE_ONLY'
        });

        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: '0212345678', // Landline
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid phone format');
      });
    });

    describe('Password Validation', () => {
      it('should reject login with wrong password', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: 'test@example.com',
            password: 'WrongPassword123!'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid credentials');
      });
    });

    describe('User Status Validation', () => {
      it('should reject login for pending user', async () => {
        // Create a pending user
        const pendingUser = await prisma.user.create({
          data: {
            email: 'pending@example.com',
            password: await bcrypt.hash('TestPassword123!', 10),
            firstName: 'Pending',
            lastName: 'User',
            role: 'CUSTOMER',
            status: 'PENDING'
          }
        });

        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: 'pending@example.com',
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Account not verified');
        expect(response.body.requiresVerification).toBe(true);
        expect(response.body.verificationType).toBe('email');

        // Clean up
        await prisma.user.delete({
          where: { id: pendingUser.id }
        });
      });
    });

    describe('Input Validation', () => {
      it('should reject login with missing identifier', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should reject login with missing password', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: 'test@example.com'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should reject login with empty identifier', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: '',
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('JWT Token Generation', () => {
      it('should generate valid JWT token', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            identifier: 'test@example.com',
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();

        // Verify token
        const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || 'test-secret');
        expect(decoded.userId).toBe(testUser.id);
        expect(decoded.email).toBe(testUser.email);
        expect(decoded.role).toBe(testUser.role);
      });
    });
  });
});