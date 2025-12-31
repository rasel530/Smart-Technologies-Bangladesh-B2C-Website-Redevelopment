const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Environment detection and configuration loading
function loadEnvironmentConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`🔍 Environment detected: ${nodeEnv}`);
  
  // Define possible environment files in order of priority
  const envFiles = [
    `.env.${nodeEnv}`,    // Environment-specific (e.g., .env.production, .env.docker)
    '.env.local',         // Local overrides
    '.env'                // Default configuration
  ];
  
  // Load environment files in order, allowing overrides
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📁 Loading environment file: ${envFile}`);
      dotenv.config({ path: envPath, override: false });
    } else {
      console.log(`⚠️  Environment file not found: ${envFile}`);
    }
  }
  
  // Detect Docker environment - Enhanced detection
  const isDockerEnvironment = fs.existsSync('/.dockerenv') ||
    process.env.DOCKER_ENV === 'true' ||
    process.env.IS_DOCKER === 'true' ||
    nodeEnv === 'docker' ||
    (process.env.REDIS_HOST && process.env.REDIS_HOST === 'redis');
  
  if (isDockerEnvironment) {
    console.log('🐳 Docker environment detected, applying Docker-specific configuration');
    process.env.NODE_ENV = 'production'; // Docker containers should run in production mode
    process.env.IS_DOCKER = 'true';
  }
  
  // Auto-configure Redis based on environment
  if (isDockerEnvironment || nodeEnv === 'production') {
    // Docker/Production: Use Redis service name
    if (!process.env.REDIS_HOST || process.env.REDIS_HOST === 'localhost') {
      process.env.REDIS_HOST = 'redis';
      console.log('🔧 Auto-configured Redis host for Docker: redis');
    }
  } else if (nodeEnv === 'development') {
    // Development: Use localhost
    if (!process.env.REDIS_HOST) {
      process.env.REDIS_HOST = 'localhost';
      console.log('🔧 Auto-configured Redis host for development: localhost');
    }
  }
  
  return { nodeEnv, isDockerEnvironment };
}

// Load environment configuration
const { nodeEnv: detectedEnv, isDockerEnvironment: isDocker } = loadEnvironmentConfig();

// Validate required environment variables
// Support both REDIS_URL and separate Redis variables
// Support both DATABASE_URL and POSTGRES_DATABASE_URL
const requiredEnvVars = [
  'JWT_SECRET'
];

// Check database configuration (either DATABASE_URL or POSTGRES_DATABASE_URL)
const hasDatabaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_DATABASE_URL;
if (!hasDatabaseUrl) {
  console.error('❌ Missing database configuration. Either DATABASE_URL or POSTGRES_DATABASE_URL must be provided');
  process.exit(1);
}

// Check if either REDIS_URL or separate Redis variables are available
const hasRedisUrl = process.env.REDIS_URL;
const hasSeparateRedisVars = process.env.REDIS_HOST && process.env.REDIS_PORT && process.env.REDIS_PASSWORD;

if (!hasRedisUrl && !hasSeparateRedisVars) {
  console.error('❌ Missing Redis configuration. Either REDIS_URL or (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD) must be provided');
  process.exit(1);
}

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Database configuration
// Support both DATABASE_URL and POSTGRES_DATABASE_URL (POSTGRES_DATABASE_URL takes precedence)
const databaseUrl = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ Missing database configuration. Either DATABASE_URL or POSTGRES_DATABASE_URL must be provided');
  process.exit(1);
}

const databaseConfig = {
  url: databaseUrl,
  ssl: process.env.POSTGRES_SSL === 'true',
  connectionTimeoutMillis: 10000,
  queryTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20
};

console.log(`🔧 Database URL configured: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

// JWT configuration - Standardize to JWT_SECRET
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

// Redis configuration with REDIS_URL parsing support
const redisTtl = parseInt(process.env.REDIS_TTL) || 3600;

// Parse REDIS_URL if available, otherwise use separate variables
let redisHost, redisPort, redisPassword;

// Use separate Redis variables (updated for local development)
redisHost = process.env.REDIS_HOST || 'localhost';
redisPort = parseInt(process.env.REDIS_PORT) || 6379;
redisPassword = process.env.REDIS_PASSWORD || '';

// If REDIS_URL is provided, parse it for configuration
if (process.env.REDIS_URL) {
  console.log(`🔍 Raw REDIS_URL: ${process.env.REDIS_URL}`);
  try {
    const redisUrl = new URL(process.env.REDIS_URL);
    redisHost = redisUrl.hostname || redisHost;
    redisPort = parseInt(redisUrl.port) || redisPort;
    redisPassword = redisUrl.password || redisPassword;
    
    console.log(`✅ Parsed REDIS_URL: ${redisUrl.protocol}//${redisUrl.hostname}:${redisUrl.port}`);
    console.log(`🔧 Final Redis config: host=${redisHost}, port=${redisPort}, password=${redisPassword ? '***' : 'none'}`);
  } catch (error) {
    console.warn(`⚠️  Failed to parse REDIS_URL: ${error.message}. Using separate variables.`);
  }
}

// Log the final Redis configuration for debugging
console.log(`🔧 Redis configuration: host=${redisHost}, port=${redisPort}, password=${redisPassword ? '***' : 'none'}`);

// Create Redis configuration with enhanced stability
const redisConfig = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 15000,
  commandTimeout: 5000,
  maxmemoryPolicy: 'allkeys-lru',
  // Enhanced reconnection strategy with exponential backoff
  socket: {
    keepAlive: true,
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        console.error('❌ Redis reconnection failed after 20 attempts');
        return false;
      }
      // Exponential backoff with jitter
      const baseDelay = 1000;
      const maxDelay = 30000; // Increased max delay to 30 seconds
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, retries), maxDelay);
      const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
      const delay = exponentialDelay + jitter;
      
      console.log(`🔄 Redis reconnection attempt ${retries + 1}, delay: ${Math.round(delay)}ms`);
      return delay;
    },
    noDelay: true,
    connectTimeout: 20000, // Increased timeout to 20 seconds
    commandTimeout: 10000, // Increased timeout to 10 seconds
    // Additional socket stability options
    family: 4, // Force IPv4
    noDelay: true,
    keepAlive: true,
    keepAliveInitialDelay: 0
  },
  // Connection pooling configuration
  connectionPool: {
    min: 2, // Minimum connections
    max: 10, // Maximum connections
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000
  },
  // Health check configuration
  healthCheck: {
    enabled: true,
    interval: 30000, // Check every 30 seconds
    timeout: 5000, // 5 second timeout for health check
    maxRetries: 3,
    onFailure: (error) => {
      console.error('❌ Redis health check failed:', error.message);
    },
    onRecovery: () => {
      console.log('✅ Redis connection recovered');
    }
  }
};

// Cache configuration
const cacheConfig = {
  redis: redisConfig,
  ttl: redisTtl,
  keyPrefix: 'smarttech:',
  defaultCacheOptions: {
    ttl: redisTtl,
    updateAgeOnGet: false
  }
};

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  from: process.env.EMAIL_FROM || 'noreply@smarttech.com'
};

// SMS configuration
const smsConfig = {
  apiKey: process.env.SMS_API_KEY,
  apiSecret: process.env.SMS_API_SECRET,
  sender: process.env.SMS_SENDER || 'SmartTech'
};

// Server configuration
const serverConfig = {
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || 'localhost',
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  }
};

// Security configuration
const securityConfig = {
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
  sessionSecret: process.env.SESSION_SECRET || 'fallback-secret-key',
  cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE) || 86400000 // 24 hours
};

// File upload configuration
const uploadConfig = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  allowedTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',') : ['image/jpeg', 'image/png', 'image/gif'],
  destination: process.env.UPLOAD_DEST || 'uploads/'
};

// Logging configuration
const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'combined',
  file: {
    enabled: process.env.LOG_FILE_ENABLED === 'true',
    filename: process.env.LOG_FILENAME || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  }
};

// Configuration service class
class ConfigService {
  constructor() {
    this.database = databaseConfig;
    this.jwt = jwtConfig;
    this.cache = cacheConfig;
    this.email = emailConfig;
    this.sms = smsConfig;
    this.server = serverConfig;
    this.security = securityConfig;
    this.upload = uploadConfig;
    this.logging = loggingConfig;
  }

  // Helper functions
  get(key) {
    return process.env[key];
  }

  getDatabaseUrl() {
    return this.database.url;
  }

  getJwtSecret() {
    return this.jwt.secret;
  }

  getRedisConfig() {
    return redisConfig;
  }

  getCacheConfig() {
    return this.cache;
  }

  getEmailConfig() {
    return this.email;
  }

  getSmsConfig() {
    return this.sms;
  }

  getServerConfig() {
    return this.server;
  }

  getSecurityConfig() {
    return this.security;
  }

  getUploadConfig() {
    return this.upload;
  }

  getLoggingConfig() {
    return this.logging;
  }

  getPasswordPolicyConfig() {
    return {
      minLength: this.security.passwordMinLength || 8,
      maxLength: 128,
      bcryptRounds: this.security.bcryptRounds || 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventSequential: true,
      preventRepeated: true,
      preventPersonalInfo: true,
      bangladeshPatterns: true,
      minStrengthScore: 2
    };
  }

  getCORSConfig() {
    return {
      credentials: this.server.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count']
    };
  }

  // Environment helpers
  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  isTest() {
    return process.env.NODE_ENV === 'test';
  }

  isDocker() {
    return process.env.IS_DOCKER === 'true' ||
           process.env.REDIS_HOST === 'redis' ||
           fs.existsSync('/.dockerenv');
  }

  // Testing and verification helpers
  isTestingMode() {
    return process.env.TESTING_MODE === 'true' || this.isTest();
  }

  isEmailVerificationDisabled() {
    return process.env.DISABLE_EMAIL_VERIFICATION === 'true' || this.isTestingMode();
  }

  isPhoneVerificationDisabled() {
    return process.env.DISABLE_PHONE_VERIFICATION === 'true' || this.isTestingMode();
  }

  // Get Redis configuration with environment-specific logic
  getRedisConfigWithEnvironment() {
    const baseConfig = this.getRedisConfig();
    
    // Apply environment-specific overrides
    if (this.isDocker()) {
      console.log('🐳 Applying Docker-specific Redis configuration');
      return {
        ...baseConfig,
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
        // Docker-specific connection settings
        socket: {
          ...baseConfig.socket,
          connectTimeout: 15000, // Longer timeout for Docker
          keepAlive: true,
          family: 4, // Force IPv4 in Docker
          noDelay: true
        }
      };
    } else if (this.isDevelopment()) {
      console.log('💻 Applying development-specific Redis configuration');
      return {
        ...baseConfig,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || '',
        // Development-specific connection settings
        socket: {
          ...baseConfig.socket,
          connectTimeout: 10000,
          keepAlive: true,
          family: 4,
          noDelay: true
        }
      };
    }
    
    return baseConfig;
  }

  // Validate Redis connectivity configuration
  validateRedisConfig() {
    const config = this.getRedisConfigWithEnvironment();
    const errors = [];
    
    if (!config.host) {
      errors.push('Redis host is required');
    }
    
    if (!config.port || isNaN(parseInt(config.port))) {
      errors.push('Redis port must be a valid number');
    }
    
    if (config.port < 1 || config.port > 65535) {
      errors.push('Redis port must be between 1 and 65535');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      config: {
        host: config.host,
        port: config.port,
        hasPassword: !!config.password,
        environment: process.env.NODE_ENV,
        isDocker: this.isDocker()
      }
    };
  }

  // Configuration validation
  validateConfig() {
    const errors = [];
    
    // Validate JWT secret
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }
    
    // Validate Redis configuration
    if (!process.env.REDIS_HOST) {
      errors.push('REDIS_HOST is required');
    }
    
    if (!process.env.REDIS_PORT || isNaN(parseInt(process.env.REDIS_PORT))) {
      errors.push('REDIS_PORT must be a valid number');
    }
    
    // Validate database URL
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
const configService = new ConfigService();

// Export configuration objects and service
module.exports = {
  database: databaseConfig,
  jwt: jwtConfig,
  cache: cacheConfig,
  email: emailConfig,
  sms: smsConfig,
  server: serverConfig,
  security: securityConfig,
  upload: uploadConfig,
  logging: loggingConfig,

  // Helper functions
  getDatabaseUrl: () => databaseConfig.url,
  getJwtSecret: () => jwtConfig.secret,
  getRedisConfig: () => redisConfig,
  getCacheConfig: () => cacheConfig,
  getEmailConfig: () => emailConfig,
  getSmsConfig: () => smsConfig,
  getServerConfig: () => serverConfig,
  getSecurityConfig: () => securityConfig,
  getUploadConfig: () => uploadConfig,
  getLoggingConfig: () => loggingConfig,

  // Environment helpers
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isTest: () => process.env.NODE_ENV === 'test',
  
  // Testing and verification helpers
  isTestingMode: () => process.env.TESTING_MODE === 'true' || process.env.NODE_ENV === 'test',
  isEmailVerificationDisabled: () => process.env.DISABLE_EMAIL_VERIFICATION === 'true' || process.env.NODE_ENV === 'test',
  isPhoneVerificationDisabled: () => process.env.DISABLE_PHONE_VERIFICATION === 'true' || process.env.NODE_ENV === 'test',
  
  // Configuration validation
  validateConfig: () => {
    const errors = [];
    
    // Validate JWT secret
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }
    
    // Validate Redis configuration (support both REDIS_URL and separate variables)
    const hasRedisUrl = process.env.REDIS_URL;
    const hasSeparateRedisVars = process.env.REDIS_HOST && process.env.REDIS_PORT && process.env.REDIS_PASSWORD;
    
    if (!hasRedisUrl && !hasSeparateRedisVars) {
      errors.push('Either REDIS_URL or (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD) must be provided');
    }
    
    if (hasSeparateRedisVars) {
      if (!process.env.REDIS_PORT || isNaN(parseInt(process.env.REDIS_PORT))) {
        errors.push('REDIS_PORT must be a valid number');
      }
    }
    
    // Validate database URL (support both DATABASE_URL and POSTGRES_DATABASE_URL)
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_DATABASE_URL) {
      errors.push('Either DATABASE_URL or POSTGRES_DATABASE_URL is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Config service instance
  configService
};
