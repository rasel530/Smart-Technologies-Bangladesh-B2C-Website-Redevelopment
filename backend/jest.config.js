/**
 * Jest Configuration for Smart Technologies Bangladesh B2C Website
 * 
 * This configuration handles:
 * - Module transformation
 * - Path mapping
 * - Test environment setup
 * - Coverage collection
 * - Mock configurations
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.spec.js'
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/'
  ],
  
  // Module transformation
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/jest.setup.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.test.js',
    '!**/*.spec.js'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './routes/cart.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Mock configurations
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Timeout configuration
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!supertest)'
  ],
  
  // Global variables
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      REDIS_URL: 'redis://localhost:6379'
    }
  },
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'json',
    'jsx',
    'ts',
    'tsx',
    'node'
  ],
  
  // Test runner options
  runner: 'jest-runner',
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit
  forceExit: true,
  
  // Maximum workers
  maxWorkers: '50%',
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache'
};