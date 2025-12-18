const { passwordService } = require('../services/passwordService');
const { PrismaClient } = require('@prisma/client');

describe('Password Service', () => {
  let prisma;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Password Strength Validation', () => {
    test('should validate strong password correctly', () => {
      const password = 'StrongP@ssw0rd123!';
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.strength).toMatch(/^(good|strong)$/);
      expect(result.feedback).toHaveLength(0);
    });

    test('should reject weak password', () => {
      const password = 'weak';
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(2);
      expect(result.strength).toBe('very_weak');
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    test('should reject password with personal information', () => {
      const password = 'John123456!';
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password cannot contain your first name');
    });

    test('should reject password with sequential characters', () => {
      const password = 'Password123!';
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password cannot contain sequential characters');
    });

    test('should reject password with repeated characters', () => {
      const password = 'Passsword!!!';
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password cannot contain repeated characters');
    });

    test('should reject password with Bangladeshi patterns', () => {
      const password = 'Bangladesh123!';
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password cannot contain common Bangladeshi terms');
    });

    test('should enforce minimum length requirement', () => {
      const password = 'Ab1!';
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password must be at least 8 characters long');
    });

    test('should enforce maximum length requirement', () => {
      const password = 'A'.repeat(129);
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain('Password must not exceed 128 characters');
    });
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'TestPassword123!';
      
      const hashedPassword = await passwordService.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    test('should verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(password, hashedPassword);

      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await passwordService.hashPassword(password);
      
      const isValid = await passwordService.verifyPassword(wrongPassword, hashedPassword);

      expect(isValid).toBe(false);
    });
  });

  describe('Password History', () => {
    const testUserId = 'test-user-id';
    
    test('should save password to history', async () => {
      const passwordHash = 'hashed_password_123';
      
      // Mock prisma create
      const mockCreate = jest.spyOn(prisma.passwordHistory, 'create').mockResolvedValue({
        id: 'history-id',
        userId: testUserId,
        passwordHash,
        createdAt: new Date()
      });

      // Mock cleanup
      const mockCleanup = jest.spyOn(passwordService, 'cleanupOldPasswordHistory').mockResolvedValue();

      const result = await passwordService.savePasswordToHistory(testUserId, passwordHash);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          userId: testUserId,
          passwordHash
        }
      });
      expect(mockCleanup).toHaveBeenCalledWith(testUserId);
      expect(result.id).toBe('history-id');
    });

    test('should check password reuse correctly', async () => {
      const newPassword = 'TestPassword123!';
      const oldPasswordHash = await passwordService.hashPassword('OldPassword456!');
      
      // Mock password history
      jest.spyOn(prisma.passwordHistory, 'findMany').mockResolvedValue([
        { id: '1', passwordHash: oldPasswordHash, createdAt: new Date() },
        { id: '2', passwordHash: 'other_hash', createdAt: new Date() }
      ]);

      // Mock verifyPassword to return true for old password
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(true);

      const isReused = await passwordService.isPasswordReused(testUserId, newPassword);

      expect(isReused).toBe(true);
    });

    test('should cleanup old password history', async () => {
      // Mock existing password history
      const mockHistory = Array.from({ length: 8 }, (_, i) => ({
        id: `id-${i}`,
        userId: testUserId,
        passwordHash: `hash_${i}`,
        createdAt: new Date(Date.now() - i * 1000000)
      }));

      jest.spyOn(prisma.passwordHistory, 'findMany').mockResolvedValue(mockHistory);
      jest.spyOn(prisma.passwordHistory, 'deleteMany').mockResolvedValue({ count: 3 });

      await passwordService.cleanupOldPasswordHistory(testUserId);

      expect(prisma.passwordHistory.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['id-5', 'id-6', 'id-7'] }
        }
      });
    });
  });

  describe('Strong Password Generation', () => {
    test('should generate strong password with default length', () => {
      const password = passwordService.generateStrongPassword();

      expect(password).toBeDefined();
      expect(password.length).toBe(12);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)).toBe(true);
    });

    test('should generate strong password with custom length', () => {
      const customLength = 16;
      const password = passwordService.generateStrongPassword(customLength);

      expect(password).toBeDefined();
      expect(password.length).toBe(customLength);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)).toBe(true);
    });
  });

  describe('Password Policy', () => {
    test('should return correct password policy', () => {
      const policy = passwordService.getPasswordPolicy();

      expect(policy.minLength).toBe(8);
      expect(policy.maxLength).toBe(128);
      expect(policy.requireUppercase).toBe(true);
      expect(policy.requireLowercase).toBe(true);
      expect(policy.requireNumbers).toBe(true);
      expect(policy.requireSpecialChars).toBe(true);
      expect(policy.preventSequential).toBe(true);
      expect(policy.preventRepeated).toBe(true);
      expect(policy.preventPersonalInfo).toBe(true);
      expect(policy.minStrengthScore).toBe(2);
      expect(policy.historyLimit).toBe(5);
    });
  });

  describe('Localized Feedback', () => {
    test('should provide Bengali feedback', () => {
      const validationResult = {
        isValid: false,
        score: 1,
        strength: 'weak',
        feedback: ['Password must be at least 8 characters long']
      };

      const localized = passwordService.getLocalizedFeedback(validationResult);

      expect(localized.strength).toBe('দুর্বল');
      expect(localized.feedback[0]).toContain('পাসওয়ার্ড অবশ্যই');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty password', () => {
      const password = '';
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(false);
      expect(result.score).toBe(0);
      expect(result.strength).toBe('very_weak');
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    test('should handle null user info', () => {
      const password = 'TestPassword123!';
      const userInfo = null;

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    test('should handle special characters in password', () => {
      const password = 'Test@Password#123!';
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+8801712345678'
      };

      const result = passwordService.validatePasswordStrength(password, userInfo);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
    });
  });
});