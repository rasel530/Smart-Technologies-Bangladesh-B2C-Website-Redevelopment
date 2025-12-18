const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { passwordService } = require('../services/passwordService');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../services/passwordService');
jest.mock('../services/emailService');
jest.mock('@prisma/client');

describe('Auth Password Endpoints', () => {
  let app;
  let prisma;
  let mockUser;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock Prisma Client
    prisma = new PrismaClient();
    
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '+8801712345678',
      password: 'hashed_password',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    };

    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock returns
    passwordService.validatePasswordStrength.mockReturnValue({
      isValid: true,
      score: 4,
      strength: 'strong',
      feedback: [],
      warnings: [],
      suggestions: []
    });
    
    passwordService.hashPassword.mockResolvedValue('new_hashed_password');
    passwordService.verifyPassword.mockResolvedValue(true);
    passwordService.isPasswordReused.mockResolvedValue(false);
    passwordService.savePasswordToHistory.mockResolvedValue({ id: 'history-123' });
  });

  describe('POST /auth/register with password validation', () => {
    test('should register user with strong password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678'
      };

      // Mock Prisma operations
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: '+8801712345678',
        role: 'CUSTOMER',
        status: 'PENDING'
      });

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(passwordService.validatePasswordStrength).toHaveBeenCalledWith(
        userData.password,
        {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone
        }
      );
      expect(passwordService.hashPassword).toHaveBeenCalledWith(userData.password);
      expect(passwordService.savePasswordToHistory).toHaveBeenCalled();
    });

    test('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678'
      };

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
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password does not meet requirements');
      expect(response.body.details).toEqual({
        strength: 'weak',
        score: 1,
        feedback: ['Password is too weak'],
        warnings: ['Common password pattern'],
        suggestions: ['Use a mix of characters'],
        passwordPolicy: expect.any(Object)
      });
    });

    test('should reject password shorter than 8 characters', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Ab1!', // Only 4 characters
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678'
      };

      prisma.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('minimum');
    });
  });

  describe('POST /auth/change-password', () => {
    beforeEach(() => {
      // Setup auth middleware mock
      const mockAuthMiddleware = (req, res, next) => {
        req.user = mockUser;
        next();
      };
      
      app.use('/auth/change-password', mockAuthMiddleware);
    });

    test('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      const response = await request(app)
        .post('/auth/change-password')
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password changed successfully');
      expect(passwordService.verifyPassword).toHaveBeenCalledWith(
        passwordData.currentPassword,
        mockUser.password
      );
      expect(passwordService.validatePasswordStrength).toHaveBeenCalled();
      expect(passwordService.isPasswordReused).toHaveBeenCalled();
      expect(passwordService.hashPassword).toHaveBeenCalledWith(passwordData.newPassword);
      expect(passwordService.savePasswordToHistory).toHaveBeenCalled();
    });

    test('should reject if current password is incorrect', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!'
      };

      passwordService.verifyPassword.mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/change-password')
        .send(passwordData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid current password');
    });

    test('should reject if new passwords do not match', async () => {
      const passwordData = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'DifferentPassword789!'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/change-password')
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Passwords do not match');
    });

    test('should reject if new password is same as current', async () => {
      const passwordData = {
        currentPassword: 'SamePassword123!',
        newPassword: 'SamePassword123!',
        confirmPassword: 'SamePassword123!'
      };

      passwordService.verifyPassword.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/change-password')
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Same password');
    });

    test('should reject if new password was previously used', async () => {
      const passwordData = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'OldPassword456!',
        confirmPassword: 'OldPassword456!'
      };

      passwordService.isPasswordReused.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/change-password')
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password already used');
      expect(response.body.message).toContain('last 5 changes');
    });
  });

  describe('POST /auth/forgot-password', () => {
    test('should send password reset email', async () => {
      const emailData = { email: 'test@example.com' };
      
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 'token-123' });

      const mockEmailService = require('../services/emailService');
      mockEmailService.emailService.sendPasswordResetEmail.mockResolvedValue({
        success: true,
        messageId: 'email-123'
      });

      const response = await request(app)
        .post('/auth/forgot-password')
        .send(emailData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset email sent successfully');
      expect(passwordService.generateStrongPassword).toHaveBeenCalled();
      expect(passwordService.hashPassword).toHaveBeenCalled();
    });

    test('should not reveal if user exists', async () => {
      const emailData = { email: 'nonexistent@example.com' };
      
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/forgot-password')
        .send(emailData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('If an account with that email exists');
    });
  });

  describe('POST /auth/reset-password', () => {
    test('should reset password successfully', async () => {
      const resetData = {
        token: 'valid-token-123',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!'
      };

      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 60000), // Future
        user: mockUser
      });

      prisma.user.update.mockResolvedValue({});
      prisma.emailVerificationToken.delete.mockResolvedValue({});

      const response = await request(app)
        .post('/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset successfully');
      expect(passwordService.validatePasswordStrength).toHaveBeenCalled();
      expect(passwordService.isPasswordReused).toHaveBeenCalled();
    });

    test('should reject invalid token', async () => {
      const resetData = {
        token: 'invalid-token',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!'
      };

      prisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should reject expired token', async () => {
      const resetData = {
        token: 'expired-token',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!'
      };

      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 60000), // Past
        user: mockUser
      });

      const response = await request(app)
        .post('/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Token expired');
    });
  });

  describe('GET /auth/password-policy', () => {
    test('should return password policy', async () => {
      const response = await request(app)
        .get('/auth/password-policy');

      expect(response.status).toBe(200);
      expect(response.body.policy).toEqual(expect.any(Object));
      expect(response.body.message).toBe('Current password policy requirements');
    });
  });

  describe('Security Features', () => {
    test('should enforce minimum strength score', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'FairPassword123',
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678'
      };

      passwordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        score: 1, // Below minimum score of 2
        strength: 'weak',
        feedback: ['Password score is too low'],
        warnings: [],
        suggestions: []
      });

      prisma.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password does not meet requirements');
    });

    test('should prevent common Bangladeshi patterns', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Dhaka123456',
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678'
      };

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
        .post('/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.details.feedback).toContain('Bangladeshi');
    });
  });
});