require('dotenv').config();

class ConfigService {
  constructor() {
    this.config = {
      // Server configuration
      PORT: process.env.PORT || 3001,
      NODE_ENV: process.env.NODE_ENV || 'development',
      
      // Database configuration
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_SSL: process.env.DATABASE_SSL === 'true',
      
      // JWT configuration
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      
      // CORS configuration
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
      CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
      
      // File upload configuration
      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '5242880', // 5MB
      UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
      
      // Email configuration
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT || 587,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      SMTP_FROM: process.env.SMTP_FROM || 'noreply@smarttechnologies.bd',
      
      // SMS configuration
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
      
      // Payment gateway configuration
      BKASH_API_KEY: process.env.BKASH_API_KEY,
      BKASH_API_SECRET: process.env.BKASH_API_SECRET,
      NAGAD_API_KEY: process.env.NAGAD_API_KEY,
      NAGAD_API_SECRET: process.env.NAGAD_API_SECRET,
      ROCKET_API_KEY: process.env.ROCKET_API_KEY,
      ROCKET_API_SECRET: process.env.ROCKET_API_SECRET,
      
      // Redis configuration (for caching)
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      REDIS_TTL: process.env.REDIS_TTL || 3600, // 1 hour
      
      // Elasticsearch configuration
      ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      ELASTICSEARCH_INDEX: process.env.ELASTICSEARCH_INDEX || 'smart_ecommerce'
    };

    this.validateConfig();
  }

  validateConfig() {
    console.log('🔍 Starting configuration validation...');
    const startTime = Date.now();
    
    // JWT Secret validation - no fallback in any environment
    if (!this.config.JWT_SECRET) {
      throw new Error('JWT_SECRET is required in all environments. Please set a secure JWT secret in your environment variables.');
    }

    const requiredFields = [
      'DATABASE_URL'
    ];

    const missingFields = requiredFields.filter(field => !this.config[field]);
    
    // Enhanced validation for critical services including payment gateway secrets
    const criticalFields = [
      'DATABASE_URL',
      'JWT_SECRET',
      'BKASH_API_KEY',
      'BKASH_API_SECRET',
      'NAGAD_API_KEY',
      'NAGAD_API_SECRET',
      'ROCKET_API_KEY',
      'ROCKET_API_SECRET'
    ];
    
    const missingCriticalFields = criticalFields.filter(field => !this.config[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required environment variables:', {
        missing: missingFields,
        environment: this.config.NODE_ENV,
        timestamp: new Date().toISOString(),
        validationDuration: Date.now() - startTime
      });
      if (this.config.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
      } else {
        console.warn('⚠️  Missing environment variables (using defaults):', missingFields);
      }
    }
    
    if (missingCriticalFields.length > 0) {
      console.warn('⚠️  Missing critical payment gateway configuration:', {
        missing: missingCriticalFields,
        impact: 'Payment processing will be disabled for these gateways',
        timestamp: new Date().toISOString()
      });
    }

    // Validate database URL format
    if (this.config.DATABASE_URL) {
      try {
        new URL(this.config.DATABASE_URL);
      } catch (error) {
        console.error('❌ Invalid DATABASE_URL format:', error.message);
        if (this.config.NODE_ENV === 'production') {
          throw new Error('Invalid DATABASE_URL format');
        }
      }
    }

    // Validate external service URLs
    const serviceUrls = ['ELASTICSEARCH_URL', 'REDIS_URL'];
    serviceUrls.forEach(urlField => {
      if (this.config[urlField]) {
        try {
          if (urlField === 'REDIS_URL') {
            // Debug the actual config value
            console.log(`🔍 Raw config value for ${urlField}:`, this.config[urlField]);
            console.log(`🔍 Config object keys:`, Object.keys(this.config));
            
            const redisUrl = this.config[urlField] && this.config[urlField].trim();
            console.log(`🔍 Redis URL found: "${redisUrl}"`);
            
            if (!redisUrl || !redisUrl.startsWith('redis://')) {
              throw new Error('REDIS_URL must use redis:// protocol');
            }
            // Basic format validation using regex - handles password authentication
            const redisUrlPattern = /^redis:\/\/(?::([^@]*)@)?([^:]+):(\d+)$/;
            if (!redisUrlPattern.test(redisUrl)) {
              throw new Error('REDIS_URL must use valid format (redis://host:port, redis://:password@host:port, or redis://username:password@host:port)');
            }
            console.log('✅ Redis URL validation passed');
          } else {
            // For other URLs, use URL constructor
            const url = new URL(this.config[urlField]);
          if (urlField === 'ELASTICSEARCH_URL' && !['http:', 'https:'].includes(url.protocol)) {
            throw new Error('ELASTICSEARCH_URL must use http:// or https:// protocol');
          }
          }
        } catch (error) {
          console.error(`❌ Invalid ${urlField} format:`, error.message);
          if (this.config.NODE_ENV === 'production') {
            throw new Error(`Invalid ${urlField} format`);
          }
        }
      }
    });

    // Validate SMTP configuration
    const smtpFields = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingSmtpFields = smtpFields.filter(field => !this.config[field]);
    
    if (missingSmtpFields.length > 0) {
      console.warn('⚠️  Missing SMTP configuration:', {
        missing: missingSmtpFields,
        impact: 'Email functionality will be disabled',
        timestamp: new Date().toISOString()
      });
    }

    // Validate SMTP port if provided
    if (this.config.SMTP_PORT) {
      const smtpPort = parseInt(this.config.SMTP_PORT);
      if (isNaN(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
        console.error('❌ Invalid SMTP_PORT:', this.config.SMTP_PORT);
        if (this.config.NODE_ENV === 'production') {
          throw new Error('Invalid SMTP_PORT number');
        }
      }
    }

    // Validate file upload security settings
    if (this.config.MAX_FILE_SIZE) {
      const maxSize = parseInt(this.config.MAX_FILE_SIZE);
      if (isNaN(maxSize) || maxSize <= 0) {
        console.error('❌ Invalid MAX_FILE_SIZE:', this.config.MAX_FILE_SIZE);
        if (this.config.NODE_ENV === 'production') {
          throw new Error('Invalid MAX_FILE_SIZE');
        }
      }
      // Security check: limit file size to 50MB maximum
      if (maxSize > 52428800) {
        console.warn('⚠️  MAX_FILE_SIZE exceeds 50MB security limit:', this.config.MAX_FILE_SIZE);
        if (this.config.NODE_ENV === 'production') {
          throw new Error('MAX_FILE_SIZE exceeds security limit of 50MB');
        }
      }
    }

    // Validate upload path security
    if (this.config.UPLOAD_PATH) {
      // Prevent path traversal attacks
      if (this.config.UPLOAD_PATH.includes('..') || this.config.UPLOAD_PATH.includes('~')) {
        console.error('❌ Unsafe UPLOAD_PATH detected:', this.config.UPLOAD_PATH);
        if (this.config.NODE_ENV === 'production') {
          throw new Error('Unsafe UPLOAD_PATH detected');
        }
      }
    }

    // Validate CORS origin
    if (this.config.CORS_ORIGIN) {
      if (this.config.CORS_ORIGIN === '*') {
        console.warn('⚠️  Wildcard CORS_ORIGIN detected, this may be insecure in production');
      }
    }

    // Validate port
    const port = parseInt(this.config.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('❌ Invalid PORT:', this.config.PORT);
      if (this.config.NODE_ENV === 'production') {
        throw new Error('Invalid PORT number');
      }
    }

    // Validate JWT expiration
    if (this.config.JWT_EXPIRES_IN && !/^\d+[smhdw]$/.test(this.config.JWT_EXPIRES_IN)) {
      console.error('❌ Invalid JWT_EXPIRES_IN format:', this.config.JWT_EXPIRES_IN);
      if (this.config.NODE_ENV === 'production') {
        throw new Error('Invalid JWT_EXPIRES_IN format');
      }
    }

    console.log('✅ Configuration validated successfully', {
      validationDuration: Date.now() - startTime,
      environment: this.config.NODE_ENV,
      criticalServicesConfigured: missingCriticalFields.length === 0,
      timestamp: new Date().toISOString()
    });
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  isProduction() {
    return this.config.NODE_ENV === 'production';
  }

  isDevelopment() {
    return this.config.NODE_ENV === 'development';
  }

  isTest() {
    return this.config.NODE_ENV === 'test';
  }

  // Database helpers
  getDatabaseConfig() {
    return {
      url: this.config.DATABASE_URL,
      ssl: this.config.DATABASE_SSL === 'true',
      connectionTimeout: 10000,
      queryTimeout: 30000,
      statementTimeout: 30000,
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      }
    };
  }

  // JWT helpers
  getJWTConfig() {
    return {
      secret: this.config.JWT_SECRET,
      expiresIn: this.config.JWT_EXPIRES_IN,
      algorithm: 'HS256',
      issuer: 'smart-technologies-bd'
    };
  }

  // CORS helpers
  getCORSConfig() {
    return {
      origin: this.config.CORS_ORIGIN,
      credentials: this.config.CORS_CREDENTIALS === 'true',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count']
    };
  }

  // File upload helpers
  getFileUploadConfig() {
    return {
      maxSize: parseInt(this.config.MAX_FILE_SIZE),
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      uploadPath: this.config.UPLOAD_PATH,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp'
      ]
    };
  }

  // Payment gateway helpers with environment-specific URLs
  getPaymentConfig() {
    const isProduction = this.isProduction();
    
    return {
      bkash: {
        apiKey: this.config.BKASH_API_KEY,
        apiSecret: this.config.BKASH_API_SECRET,
        baseUrl: isProduction
          ? 'https://checkout.pay.bka.sh/v1.2.0-beta'
          : 'https://checkout.sandbox.bka.sh/v1.2.0-beta'
      },
      nagad: {
        apiKey: this.config.NAGAD_API_KEY,
        apiSecret: this.config.NAGAD_API_SECRET,
        baseUrl: isProduction
          ? 'https://api.nagad.com/v1'
          : 'https://api.sandbox.nagad.com/v1'
      },
      rocket: {
        apiKey: this.config.ROCKET_API_KEY,
        apiSecret: this.config.ROCKET_API_SECRET,
        baseUrl: isProduction
          ? 'https://api.rocket.com/v1'
          : 'https://api.sandbox.rocket.com/v1'
      }
    };
  }

  // Cache helpers
  getCacheConfig() {
    return {
      redis: {
        url: this.config.REDIS_URL,
        ttl: parseInt(this.config.REDIS_TTL),
        keyPrefix: 'smart_ecommerce:',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      }
    };
  }

  // Search helpers
  getSearchConfig() {
    return {
      elasticsearch: {
        url: this.config.ELASTICSEARCH_URL,
        index: this.config.ELASTICSEARCH_INDEX,
        maxResults: 100,
        timeout: 5000
      }
    };
  }

  // Email helpers
  getEmailConfig() {
    return {
      host: this.config.SMTP_HOST,
      port: parseInt(this.config.SMTP_PORT),
      secure: this.config.SMTP_PORT === '465',
      auth: {
        user: this.config.SMTP_USER,
        pass: this.config.SMTP_PASS
      },
      from: this.config.SMTP_FROM,
      templates: {
        welcome: './emails/welcome.html',
        orderConfirmation: './emails/order-confirmation.html',
        passwordReset: './emails/password-reset.html'
      }
    };
  }

  // SMS helpers
  getSMSConfig() {
    return {
      twilioAccountSid: this.config.TWILIO_ACCOUNT_SID,
      twilioAuthToken: this.config.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: this.config.TWILIO_PHONE_NUMBER
    };
  }

  // Rate limiting helpers
  getRateLimitConfig() {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: this.isProduction() ? 100 : 1000, // More lenient in development
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true
    };
  }

  // Security helpers
getSecurityConfig() {
return {
  bcryptRounds: 12,
  passwordMinLength: 8,
  passwordMaxLength: 128,
  sessionMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  cookieSecure: this.isProduction(),
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: false
    }
  }
};
}

// Password policy helpers
getPasswordPolicyConfig() {
return {
  // Basic requirements
  minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
  maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128,
  
  // Character requirements
  requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
  requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
  requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
  requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL === 'true',
  
  // Pattern restrictions
  preventSequential: process.env.PASSWORD_PREVENT_SEQUENTIAL !== 'false',
  preventRepeated: process.env.PASSWORD_PREVENT_REPEATED !== 'false',
  preventPersonalInfo: process.env.PASSWORD_PREVENT_PERSONAL_INFO !== 'false',
  preventCommonPatterns: process.env.PASSWORD_PREVENT_COMMON_PATTERNS !== 'false',
  
  // Strength requirements
  minStrengthScore: parseInt(process.env.PASSWORD_MIN_STRENGTH_SCORE) || 2,
  
  // History and reuse
  passwordHistoryLimit: parseInt(process.env.PASSWORD_HISTORY_LIMIT) || 5,
  preventReuse: process.env.PASSWORD_PREVENT_REUSE !== 'false',
  
  // Bangladesh-specific settings
  bangladeshPatterns: process.env.PASSWORD_BANGLADESH_PATTERNS === 'true',
  
  // Temporary password settings
  tempPasswordLength: parseInt(process.env.TEMP_PASSWORD_LENGTH) || 12,
  tempPasswordExpiry: parseInt(process.env.TEMP_PASSWORD_EXPIRY) || 1, // hours
  
  // Rate limiting
  maxPasswordAttempts: parseInt(process.env.MAX_PASSWORD_ATTEMPTS) || 5,
  passwordAttemptWindow: parseInt(process.env.PASSWORD_ATTEMPT_WINDOW) || 15, // minutes
  lockoutDuration: parseInt(process.env.PASSWORD_LOCKOUT_DURATION) || 30 // minutes
};
}

  // Logging helpers
  getLoggingConfig() {
    return {
      level: this.isProduction() ? 'info' : 'debug',
      format: this.isProduction() ? 'json' : 'dev',
      colorize: !this.isProduction(),
      timestamp: true,
      file: this.isProduction() ? './logs/app.log' : null,
      console: !this.isProduction()
    };
  }

  // API helpers
  getAPIConfig() {
    return {
      version: '1.0.0',
      prefix: '/api/v1',
      rateLimit: this.getRateLimitConfig(),
      pagination: {
        defaultLimit: 20,
        maxLimit: 100
      },
      timeout: 30000,
      compression: true,
      trustProxy: this.isProduction()
    };
  }
}

// Singleton instance
const configService = new ConfigService();

module.exports = {
  ConfigService,
  configService
};