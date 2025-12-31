/**
 * Jest setup file for authentication testing
 * Configures global test environment, mocks, and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.TESTING_MODE = 'true';
process.env.EMAIL_VERIFICATION_DISABLED = 'true';
process.env.PHONE_VERIFICATION_DISABLED = 'true';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

// Mock Redis for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    zAdd: jest.fn().mockResolvedValue(1),
    zRange: jest.fn().mockResolvedValue([]),
    zRem: jest.fn().mockResolvedValue(1),
    zRemRangeByScore: jest.fn().mockResolvedValue(1),
    zCard: jest.fn().mockResolvedValue(0),
    hGetAll: jest.fn().mockResolvedValue({}),
    hIncrBy: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    pipeline: jest.fn(() => ({
      exec: jest.fn().mockResolvedValue([])
    }))
  }))
}));

// Mock Nodemailer for email testing
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: '250 OK'
    })
  }))
}));

// Mock Twilio for SMS testing
jest.mock('twilio', () => jest.fn(() => ({
  messages: {
    create: jest.fn().mockResolvedValue({
      sid: 'test-sms-sid',
      status: 'queued'
    })
  }
})));

// Mock bcrypt for consistent password hashing in tests
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockImplementation((password) => 
    Promise.resolve(`hashed_${password}`)
  ),
  compare: jest.fn().mockImplementation((password, hash) => 
    Promise.resolve(hash === `hashed_${password}`)
  ),
  genSalt: jest.fn().mockResolvedValue('test-salt')
}));

// Mock JWT for consistent token generation
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation((payload, secret) => 
    `test-token-${JSON.stringify(payload)}`
  ),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token.startsWith('test-token-')) {
      return JSON.parse(token.replace('test-token-', ''));
    }
    throw new Error('Invalid token');
  })
}));

// Global test utilities
global.testUtils = {
  /**
   * Creates a mock request object
   * @param {Object} overrides - Request properties to override
   * @returns {Object} Mock request object
   */
  createMockRequest: (overrides = {}) => ({
    ip: '127.0.0.1',
    body: {},
    params: {},
    query: {},
    headers: {},
    get: jest.fn((header) => {
      const headers = {
        'user-agent': 'Mozilla/5.0 (Test Browser)',
        'accept-language': 'en-US,en;q=0.9',
        'accept-encoding': 'gzip, deflate, br'
      };
      return headers[header.toLowerCase()] || null;
    }),
    ...overrides
  }),

  /**
   * Creates a mock response object
   * @param {Object} overrides - Response properties to override
   * @returns {Object} Mock response object
   */
  createMockResponse: (overrides = {}) => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      headers: {},
      cookies: {}
    };
    return { ...res, ...overrides };
  },

  /**
   * Creates test user data
   * @param {Object} overrides - User properties to override
   * @returns {Object} Test user data
   */
  createTestUser: (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    phone: '+8801700000001',
    firstName: 'Test',
    lastName: 'User',
    password: 'TestPassword123!',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerified: new Date(),
    phoneVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  /**
   * Creates Bangladesh-specific test data
   * @returns {Object} Bangladesh test data
   */
  createBangladeshTestData: () => ({
    validPhones: [
      '+8801700000001',
      '+8801800000001',
      '+8801900000001',
      '+8801500000001',
      '+8801300000001',
      '+8801400000001',
      '+8801600000001'
    ],
    invalidPhones: [
      '01700000001',
      '1700000001',
      '+880170000000',
      '+88017000000001',
      '+880170000000a',
      '+8701700000001'
    ],
    divisions: [
      'Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 
      'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'
    ],
    districts: {
      'Dhaka': ['Dhaka', 'Gazipur', 'Narayanganj', 'Manikganj'],
      'Chattogram': ['Chattogram', 'Coxs Bazar', 'Bandarban', 'Rangamati'],
      'Khulna': ['Khulna', 'Satkhira', 'Bagerhat', 'Jessore']
    }
  })
};