
/**
 * Jest Setup File
 * 
 * This file sets up the test environment for all Jest tests
 * including global mocks, test utilities, and configuration
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);

// Mock modules that cause issues in tests
jest.mock('../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    logAuth: jest.fn(),
    logSecurity: jest.fn(),
    logPerformance: jest.fn()
  }
}));

jest.mock('../services/config', () => ({
  configService: {
    get: jest.fn((key) => {
      const defaults = {
        'JWT_SECRET': 'test-jwt-secret-key',
        'DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db',
        'REDIS_URL': 'redis://localhost:6379',
        'NODE_ENV': 'test'
      };
      return defaults[key] || null;
    }),
    getJWTConfig: jest.fn(() => ({
      secret: 'test-jwt-secret-key',
      algorithm: 'HS256',
      issuer: 'smart-technologies-bd',
      expiresIn: '1h'
    })),
    getCORSConfig: jest.fn(() => ({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Request-ID']
    })),
    isProduction: jest.fn(() => false),
    validateConfig: jest.fn()
  }
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(),
    setEx: jest.fn().mockResolvedValue(),
    del: jest.fn().mockResolvedValue(),
    hGetAll: jest.fn().mockResolvedValue({}),
    hIncrBy: jest.fn().mockResolvedValue(),
    hSet: jest.fn().mockResolvedValue(),
    expire: jest.fn().mockResolvedValue(),
    multi: jest.fn(() => ({
      zRemRangeByScore: jest.fn().mockReturnThis(),
      zAdd: jest.fn().mockReturnThis(),
      zCard: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ reply: 0 }, { reply: 0 }, { reply: 0 }])
    }))
  }))
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'CUSTOMER',
    iat: Date.now() / 1000,
    exp: (Date.now() / 1000) + 3600
  })),
  decode: jest.fn(() => ({
    userId: 'test-user-id',
    exp: (Date.now() / 1000) + 3600
  }))
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn().mockResolvedValue(),
    $disconnect: jest.fn().mockResolvedValue(),
    $use: jest.fn(),
    $on: jest.fn(),
    $transaction: jest.fn(),
    cart: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn()
    },
    cartItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn()
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }))
}));

// Global test utilities
global.testUtils = {
  /**
   * Create a mock request object
   */
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: '127.0.0.1',
    get: jest.fn(),
    ...overrides
  }),

  /**
   * Create a mock response object
   */
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };
    return res;
  },

  /**
   * Create a mock next function
   */
  createMockNext: () => jest.fn(),

  /**
   * Wait for async operations
   */
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate test JWT token
   */
  generateTestToken: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'CUSTOMER',
      ...payload
    }, 'test-jwt-secret-key', { expiresIn: '1h' });
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

