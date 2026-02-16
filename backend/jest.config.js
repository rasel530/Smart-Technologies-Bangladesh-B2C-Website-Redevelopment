module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.ts',
    '**/?(*.)+(spec|test).js',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'services/**/*.ts',
    'controllers/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/types/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 30000,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }],
    '^.+\\.jsx?$': ['babel-jest', {
      presets: ['@babel/preset-env']
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|isomorphic-dompurify|@exodus|parse5|jsdom)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../frontend/src/$1'
  }
};