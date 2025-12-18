/**
 * Authentication API Endpoint Tests
 * 
 * This test suite covers all authentication endpoints including:
 * - User registration
 * - User login
 * - User logout
 * - Token refresh
 * - Input validation
 * - Error handling
 * - Security measures
 */

const request = require('supertest');
const { app } = require('../index');
const { 
  TEST_CONFIG, 
  createTestUser, 
  createTestAdmin,
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure,
  prisma 
} = require('./api-test-utils');

describe('Authentication API Endpoints', () => {
  let testUser, adminUser;

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('POST /api/v1/auth/register', () => {
    /**
     * Test successful user registration
     */
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '+8801234567890'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      
      // Verify user data
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.phone).toBe(userData.phone);
      expect(response.body.user.role).toBe('CUSTOMER');
      expect(response.body.user).not.toHaveProperty('password');
      
      // Verify token structure
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);
    });

    /**
     * Test registration with missing required fields
     */
    it('should return validation error for missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com'
        // Missing password, firstName, lastName
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    /**
     * Test registration with invalid email format
     */
    it('should return validation error for invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test registration with short password
     */
    it('should return validation error for password shorter than 6 characters', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123', // Too short
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test registration with invalid phone format
     */
    it('should return validation error for invalid phone format', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test registration with duplicate email
     */
    it('should return conflict error for duplicate email', async () => {
      // Create first user
      await createTestUser({ email: 'duplicate@example.com' });

      const duplicateData = {
        email: 'duplicate@example.com', // Same email
        password: 'password123',
        firstName: 'Another',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'User already exists');
      expect(response.body).toHaveProperty('field', 'email');
    });

    /**
     * Test registration with duplicate phone
     */
    it('should return conflict error for duplicate phone', async () => {
      // Create first user with phone
      await createTestUser({ phone: '+8801234567890' });

      const duplicateData = {
        email: 'different@example.com',
        password: 'password123',
        firstName: 'Another',
        lastName: 'User',
        phone: '+8801234567890' // Same phone
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'User already exists');
      expect(response.body).toHaveProperty('field', 'phone');
    });

    /**
     * Test registration with Bangladesh phone number
     */
    it('should accept valid Bangladesh phone number format', async () => {
      const bdData = {
        email: 'bduser@example.com',
        password: 'password123',
        firstName: 'Bangladesh',
        lastName: 'User',
        phone: '+8801712345678' // Valid BD format
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(bdData);

      expect(response.status).toBe(201);
      expect(response.body.user.phone).toBe(bdData.phone);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      testUser = await createTestUser();
    });

    /**
     * Test successful user login
     */
    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: testUser.user.email,
        password: TEST_CONFIG.TEST_USER.password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');

      // Verify user data
      expect(response.body.user.email).toBe(testUser.user.email);
      expect(response.body.user.firstName).toBe(testUser.user.firstName);
      expect(response.body.user.lastName).toBe(testUser.user.lastName);
      expect(response.body.user).toHaveProperty('role');
      expect(response.body.user).toHaveProperty('status');
      expect(response.body.user).not.toHaveProperty('password');
    });

    /**
     * Test login with invalid email
     */
    it('should return error for non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    /**
     * Test login with invalid password
     */
    it('should return error for incorrect password', async () => {
      const loginData = {
        email: testUser.user.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    /**
     * Test login with missing email
     */
    it('should return validation error for missing email', async () => {
      const loginData = {
        password: 'password123'
        // Missing email
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test login with missing password
     */
    it('should return validation error for missing password', async () => {
      const loginData = {
        email: testUser.user.email
        // Missing password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test login with invalid email format
     */
    it('should return validation error for invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test that login updates lastLoginAt timestamp
     */
    it('should update lastLoginAt timestamp on successful login', async () => {
      const loginData = {
        email: testUser.user.email,
        password: TEST_CONFIG.TEST_USER.password
      };

      const beforeLogin = new Date();
      
      await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      // Check user was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.user.id }
      });

      expect(updatedUser.lastLoginAt).toBeDefined();
      expect(updatedUser.lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    /**
     * Test successful logout
     */
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    /**
     * Test logout without authentication (should work as it's optional)
     */
    it('should allow logout without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    beforeEach(async () => {
      testUser = await createTestUser();
    });

    /**
     * Test successful token refresh
     */
    it('should refresh token successfully with valid token', async () => {
      const refreshData = {
        token: testUser.token
      };

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');

      // Verify new token is different
      expect(response.body.token).not.toBe(testUser.token);
      
      // Verify user data
      expect(response.body.user.email).toBe(testUser.user.email);
      expect(response.body.user.firstName).toBe(testUser.user.firstName);
    });

    /**
     * Test refresh with missing token
     */
    it('should return error for missing token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Token required');
    });

    /**
     * Test refresh with invalid token
     */
    it('should return error for invalid token', async () => {
      const refreshData = {
        token: 'invalid.token.here'
      };

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    /**
     * Test refresh with expired token
     */
    it('should return error for expired token', async () => {
      // Create expired token
      const expiredToken = require('jsonwebtoken').sign(
        { userId: testUser.user.id, email: testUser.user.email, role: testUser.user.role },
        TEST_CONFIG.JWT_SECRET,
        { expiresIn: '-1h' } // Expired
      );

      const refreshData = {
        token: expiredToken
      };

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    /**
     * Test refresh with token for non-existent user
     */
    it('should return error for token of deleted user', async () => {
      // Create user and get token
      const tempUser = await createTestUser({ email: 'temp@example.com' });
      const token = tempUser.token;

      // Delete user
      await prisma.user.delete({ where: { id: tempUser.user.id } });

      const refreshData = {
        token: token
      };

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('Authentication Security Tests', () => {
    /**
     * Test that passwords are properly hashed
     */
    it('should store passwords as hash, not plain text', async () => {
      const userData = {
        email: 'security@example.com',
        password: 'plainpassword123',
        firstName: 'Security',
        lastName: 'Test'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50); // Hash should be longer
      expect(user.password.startsWith('$2')).toBe(true); // bcrypt hash format
    });

    /**
     * Test rate limiting on login attempts
     */
    it('should implement rate limiting on login attempts', async () => {
      const loginData = {
        email: 'ratelimit@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed attempts
      const promises = Array(10).fill().map(() => 
        request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
      expect(rateLimitedResponse.body).toHaveProperty('error', 'Too many requests');
    });

    /**
     * Test SQL injection protection
     */
    it('should protect against SQL injection in login', async () => {
      const maliciousData = {
        email: "'; DROP TABLE users; --",
        password: "'; DROP TABLE users; --"
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(maliciousData);

      // Should return validation error, not crash
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
      
      // Verify users table still exists
      const userCount = await prisma.user.count();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bangladesh-Specific Authentication Tests', () => {
    /**
     * Test registration with various Bangladesh phone formats
     */
    it('should accept various Bangladesh phone number formats', async () => {
      const bdPhoneFormats = [
        '+8801712345678',
        '+8801812345678',
        '+8801912345678',
        '01712345678',
        '01812345678',
        '01912345678'
      ];

      for (const phone of bdPhoneFormats) {
        const userData = {
          email: `user${phone}@example.com`,
          password: 'password123',
          firstName: 'BD',
          lastName: 'User',
          phone: phone
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.user.phone).toBe(phone);
      }
    });

    /**
     * Test rejection of invalid Bangladesh phone formats
     */
    it('should reject invalid Bangladesh phone formats', async () => {
      const invalidPhoneFormats = [
        '1234567890', // No country code, wrong format
        '+880123456789', // Too short
        '+88012345678901', // Too long
        '01234567890', // Invalid prefix
        '+9101234567890' // Wrong country code
      ];

      for (const phone of invalidPhoneFormats) {
        const userData = {
          email: `invalid${phone}@example.com`,
          password: 'password123',
          firstName: 'Invalid',
          lastName: 'Phone',
          phone: phone
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });
  });
});