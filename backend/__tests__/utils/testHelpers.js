/**
 * Test helpers and utilities for authentication testing
 * Provides reusable functions for creating test data, mocking services, and common test patterns
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class TestHelpers {
  constructor() {
    this.prisma = new PrismaClient();
    this.testUsers = [];
    this.testSessions = [];
  }

  /**
   * Creates a test user in the database
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} Created user
   */
  async createTestUser(userData = {}) {
    const defaultUser = {
      email: `test-${Date.now()}@example.com`,
      phone: `+88017${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      firstName: 'Test',
      lastName: 'User',
      password: 'TestPassword123!',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      phoneVerified: new Date()
    };

    const user = await this.prisma.user.create({
      data: {
        ...defaultUser,
        ...userData,
        password: await bcrypt.hash(userData.password || defaultUser.password, 10)
      }
    });

    this.testUsers.push(user.id);
    return user;
  }

  /**
   * Creates multiple test users with different roles
   * @returns {Promise<Object>} Object containing users with different roles
   */
  async createTestUsersWithRoles() {
    const customer = await this.createTestUser({ 
      email: 'customer@test.com',
      role: 'CUSTOMER'
    });
    
    const admin = await this.createTestUser({ 
      email: 'admin@test.com',
      role: 'ADMIN'
    });
    
    const manager = await this.createTestUser({ 
      email: 'manager@test.com',
      role: 'MANAGER'
    });

    return { customer, admin, manager };
  }

  /**
   * Creates a test session for a user
   * @param {number} userId - User ID
   * @param {Object} sessionData - Additional session data
   * @returns {Promise<Object>} Created session
   */
  async createTestSession(userId, sessionData = {}) {
    const session = await this.prisma.userSession.create({
      data: {
        userId,
        token: `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        ...sessionData
      }
    });

    this.testSessions.push(session.id);
    return session;
  }

  /**
   * Generates a JWT token for testing
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret (uses test secret if not provided)
   * @returns {string} JWT token
   */
  generateTestToken(payload = {}, secret = process.env.JWT_SECRET) {
    return jwt.sign(
      { 
        userId: 1, 
        email: 'test@example.com',
        role: 'CUSTOMER',
        ...payload 
      },
      secret,
      { expiresIn: '1h' }
    );
  }

  /**
   * Creates Bangladesh-specific test data
   * @returns {Object} Bangladesh test data
   */
  createBangladeshTestData() {
    return {
      // Valid phone numbers for different operators
      validPhones: {
        grameenphone: '+8801700000001',
        banglalink: '+8801900000001',
        robi: '+8801800000001',
        teletalk: '+8801500000001',
        airtel: '+8801600000001'
      },
      
      // Invalid phone numbers
      invalidPhones: [
        '01700000001', // Missing country code
        '+880170000000', // Too short
        '+88017000000001', // Too long
        '+880170000000a', // Contains letter
        '+8701700000001', // Wrong country code
        '17000000001' // Missing + and country code
      ],

      // Bangladesh administrative data
      divisions: [
        'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi',
        'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'
      ],

      districts: {
        Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Faridpur', 'Rajbari', 'Madaripur', 'Gopalganj', 'Kishoreganj', 'Tangail', 'Shariatpur'],
        Chattogram: ['Chattogram', 'Coxs Bazar', 'Bandarban', 'Rangamati', 'Khagrachhari', 'Feni', 'Noakhali', 'Lakshmipur', 'Comilla', 'Brahmanbaria', 'Chandpur'],
        Khulna: ['Khulna', 'Satkhira', 'Bagerhat', 'Jessore', 'Narail', 'Magura', 'Jhenaidah', 'Jashore', 'Chuadanga', 'Meherpur', 'Kushtia'],
        Rajshahi: ['Rajshahi', 'Natore', 'Pabna', 'Sirajganj', 'Bogura', 'Joypurhat', 'Naogaon', 'Chapainawabganj'],
        Barishal: ['Barishal', 'Patuakhali', 'Bhola', 'Pirojpur', 'Jhalokathi', 'Barguna'],
        Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
        Rangpur: ['Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
        Mymensingh: ['Mymensingh', 'Netrokona', 'Jamalpur', 'Sherpur']
      },

      // Sample addresses
      sampleAddresses: {
        dhaka: {
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Dhanmondi',
          addressLine1: 'House 12, Road 8',
          addressLine2: 'Dhanmondi Residential Area',
          postalCode: '1209'
        },
        chattogram: {
          division: 'Chattogram',
          district: 'Chattogram',
          upazila: 'Patiya',
          addressLine1: 'Village: South Patiya',
          addressLine2: 'Post Office: Patiya',
          postalCode: '4370'
        }
      }
    };
  }

  /**
   * Creates test data for password strength testing
   * @returns {Object} Password test data
   */
  createPasswordTestData() {
    return {
      // Strong passwords
      strong: [
        'MyStr0ng!P@ssw0rd#123',
        'B@ngl@d3$h!T3ch2024',
        'C0mpl3x#P@ssw0rd!WithNumbers'
      ],
      
      // Weak passwords
      weak: [
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123'
      ],
      
      // Invalid passwords (don't meet requirements)
      invalid: [
        '', // Empty
        '123', // Too short
        'a'.repeat(130), // Too long
        'password' // Common password
      ],
      
      // Edge cases
      edgeCases: [
        'P@ssw0rd!', // Minimum valid
        'A'.repeat(8) + '1!', // Repeated character
        'MyP@ssword' + '1'.repeat(100), // Very long but valid
        'পাসওয়ার্ড123!', // Bengali characters
        'P@ssword🔒', // Unicode characters
        '   P@ssword123!   ', // Leading/trailing spaces
        'P@ss\nword123!', // Newline character
        'P@ss\tword123!' // Tab character
      ]
    };
  }

  /**
   * Creates test data for security testing
   * @returns {Object} Security test data
   */
  createSecurityTestData() {
    return {
      // SQL injection attempts
      sqlInjection: [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1#",
        "'; EXEC xp_cmdshell('dir'); --"
      ],

      // XSS attempts
      xss: [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '"><script>alert(1)</script>',
        '\"><script>alert(document.cookie)</script>'
      ],

      // Malicious user agents
      maliciousUserAgents: [
        'sqlmap/1.0',
        'nikto/2.1.6',
        'nmap scripting engine',
        'python-requests/2.25.1',
        'curl/7.68.0',
        'Wget/1.20.3'
      ],

      // Suspicious IPs for testing
      suspiciousIPs: [
        '192.168.1.100', // Private network
        '10.0.0.1', // Private network
        '172.16.0.1', // Private network
        '127.0.0.1', // Localhost
        '0.0.0.0' // Unspecified
      ]
    };
  }

  /**
   * Mocks express request object
   * @param {Object} overrides - Request properties to override
   * @returns {Object} Mock request object
   */
  mockRequest(overrides = {}) {
    return {
      ip: '192.168.1.1',
      method: 'GET',
      url: '/test',
      headers: {},
      body: {},
      params: {},
      query: {},
      cookies: {},
      get: jest.fn((header) => {
        const headers = {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'accept-language': 'en-US,en;q=0.9',
          'accept-encoding': 'gzip, deflate, br',
          'content-type': 'application/json'
        };
        return headers[header.toLowerCase()];
      }),
      ...overrides
    };
  }

  /**
   * Mocks express response object
   * @param {Object} overrides - Response properties to override
   * @returns {Object} Mock response object
   */
  mockResponse(overrides = {}) {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      headers: {},
      cookies: {},
      locals: {}
    };
    return { ...res, ...overrides };
  }

  /**
   * Mocks next function for middleware testing
   * @returns {Function} Mock next function
   */
  mockNext() {
    return jest.fn();
  }

  /**
   * Cleans up test data
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      // Clean up test sessions
      if (this.testSessions.length > 0) {
        await this.prisma.userSession.deleteMany({
          where: { id: { in: this.testSessions } }
        });
      }

      // Clean up test users
      if (this.testUsers.length > 0) {
        await this.prisma.user.deleteMany({
          where: { id: { in: this.testUsers } }
        });
      }

      // Clean up verification tokens
      await this.prisma.emailVerificationToken.deleteMany({
        where: { userId: { in: this.testUsers } }
      });

      // Reset arrays
      this.testUsers = [];
      this.testSessions = [];

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Disconnects from database
   * @returns {Promise<void>}
   */
  async disconnect() {
    await this.cleanup();
    await this.prisma.$disconnect();
  }
}

module.exports = { TestHelpers };