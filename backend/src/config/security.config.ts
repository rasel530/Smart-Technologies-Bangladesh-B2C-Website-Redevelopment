/**
 * Security Configuration
 * 
 * This module provides centralized configuration for all payment security features
 * including fraud detection, PCI-DSS compliance, rate limiting, and webhook security.
 */

/**
 * Security Configuration
 */
export const securityConfig = {
  // Fraud detection configuration
  fraudDetection: {
    enabled: process.env.FRAUD_DETECTION_ENABLED !== 'false',
    riskThreshold: parseInt(process.env.FRAUD_RISK_THRESHOLD || '70'), // Block if risk score >= 70
    autoBlockDuration: parseInt(process.env.FRAUD_AUTO_BLOCK_DURATION || '3600'), // 1 hour in seconds
    maxFailedAttempts: parseInt(process.env.FRAUD_MAX_FAILED_ATTEMPTS || '5'),
    maxTransactionsPerHour: parseInt(process.env.FRAUD_MAX_TRANSACTIONS_PER_HOUR || '10'),
    maxTransactionsPerDay: parseInt(process.env.FRAUD_MAX_TRANSACTIONS_PER_DAY || '30'),
    maxTransactionAmount: parseInt(process.env.FRAUD_MAX_TRANSACTION_AMOUNT || '100000'),
    suspiciousHours: [2, 3, 4, 5], // 2 AM - 5 AM
    
    // Suspicious amount patterns (regex)
    suspiciousAmountPatterns: [
      /^\d{4,}00$/, // Round thousands (e.g., 10000, 50000)
      /^\d{3,}000$/, // Round thousands (e.g., 5000, 10000)
      /^50000$/,     // Specific round amount
      /^100000$/,    // Specific round amount
      /^25000$/,     // Specific round amount
      /^75000$/      // Specific round amount
    ],
    
    // Suspicious phone patterns (regex)
    suspiciousPhonePatterns: [
      /(\d)\1{9,}/, // Repeated digits (e.g., 1111111111)
      /^1234567890$/, // Sequential
      /^9876543210$/, // Reverse sequential
      /^0{11}$/,      // All zeros
      /^1{11}$/       // All ones
    ],
    
    // Blocked countries (ISO country codes)
    blockedCountries: [
      // Add country codes to block
      // Example: 'US', 'GB', 'CA'
    ],
    
    // Suspicious IP ranges (CIDR notation)
    suspiciousIPRanges: [
      // Add IP ranges to flag as suspicious
      // Example: '192.168.1.0/24', '10.0.0.0/8'
    ],
    
    // Device fingerprinting
    trackDeviceId: true,
    trackIPHistory: true
  },
  
  // PCI-DSS compliance configuration
  pciDss: {
    encryptionKey: process.env.PCI_ENCRYPTION_KEY,
    hashingAlgorithm: 'sha256',
    encryptionAlgorithm: 'aes-256-cbc',
    tokenizationEnabled: process.env.TOKENIZATION_ENABLED !== 'false',
    dataRetentionDays: parseInt(process.env.PCI_DATA_RETENTION_DAYS || '90'),
    
    // Compliance requirements
    enforceEncryption: process.env.PCI_ENFORCE_ENCRYPTION !== 'false',
    enforceTokenization: process.env.PCI_ENFORCE_TOKENIZATION !== 'false',
    enforceSanitization: process.env.PCI_ENFORCE_SANITIZATION !== 'false',
    
    // Key management
    keyRotationDays: parseInt(process.env.PCI_KEY_ROTATION_DAYS || '90'),
    keyStorage: process.env.PCI_KEY_STORAGE || 'environment' // 'environment', 'vault', 'kms'
  },
  
  // Rate limiting configuration
  rateLimiting: {
    // Payment initiation
    paymentInitiation: {
      windowMs: parseInt(process.env.RATE_LIMIT_PAYMENT_WINDOW || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX || '5'), // 5 attempts
      message: 'Too many payment initiation attempts, please try again later'
    },
    
    // Payment verification
    paymentVerification: {
      windowMs: parseInt(process.env.RATE_LIMIT_VERIFICATION_WINDOW || '300000'), // 5 minutes
      max: parseInt(process.env.RATE_LIMIT_VERIFICATION_MAX || '10'), // 10 attempts
      message: 'Too many payment verification attempts, please try again later'
    },
    
    // Refund requests
    refundRequest: {
      windowMs: parseInt(process.env.RATE_LIMIT_REFUND_WINDOW || '3600000'), // 1 hour
      max: parseInt(process.env.RATE_LIMIT_REFUND_MAX || '3'), // 3 attempts
      message: 'Too many refund requests, please try again later'
    },
    
    // Webhook callbacks
    webhookCallback: {
      windowMs: parseInt(process.env.RATE_LIMIT_WEBHOOK_WINDOW || '60000'), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_WEBHOOK_MAX || '100'), // 100 attempts
      message: 'Too many webhook callbacks'
    },
    
    // General API rate limiting
    api: {
      windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW || '60000'), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_API_MAX || '60'), // 60 requests
      message: 'Too many API requests, please try again later'
    }
  },
  
  // Webhook security configuration
  webhook: {
    verifySignatures: process.env.WEBHOOK_VERIFY_SIGNATURES !== 'false',
    allowedIPs: process.env.WEBHOOK_ALLOWED_IPS?.split(',') || [], // Empty to allow all
    requireHTTPS: process.env.WEBHOOK_REQUIRE_HTTPS !== 'false',
    signatureHeader: 'x-signature',
    timestampHeader: 'x-timestamp',
    maxTimestampDrift: parseInt(process.env.WEBHOOK_MAX_TIMESTAMP_DRIFT || '300'), // 5 minutes
    
    // Gateway-specific secrets
    gateways: {
      sslcommerz: {
        secret: process.env.SSLCOMMERZ_STORE_PASSWORD,
        algorithm: 'sha256'
      },
      bkash: {
        secret: process.env.BKASH_APP_SECRET,
        algorithm: 'sha256'
      },
      nagad: {
        secret: process.env.NAGAD_MERCHANT_SECRET,
        algorithm: 'sha256'
      }
    }
  },
  
  // HTTPS enforcement
  https: {
    enforce: process.env.ENFORCE_HTTPS === 'true',
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 1 year
    hstsIncludeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
    hstsPreload: process.env.HSTS_PRELOAD === 'true'
  },
  
  // Security headers
  headers: {
    // Prevent clickjacking
    xFrameOptions: process.env.X_FRAME_OPTIONS || 'DENY',
    
    // Prevent MIME type sniffing
    xContentTypeOptions: 'nosniff',
    
    // Enable XSS protection
    xXssProtection: '1; mode=block',
    
    // Content security policy
    contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY || "default-src 'self'",
    
    // Referrer policy
    referrerPolicy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
    
    // Permissions policy
    permissionsPolicy: process.env.PERMISSIONS_POLICY || 'geolocation=(), microphone=(), camera=()'
  },
  
  // Data sanitization rules
  sanitization: {
    // Fields to completely remove
    removeFields: [
      'cvv',
      'cvc',
      'cvv2',
      'pin',
      'password',
      'secret',
      'token'
    ],
    
    // Fields to partially mask (show last N characters)
    maskFields: {
      cardNumber: 4,
      card_no: 4,
      pan: 4,
      accountNumber: 4,
      bankAccountNumber: 4
    },
    
    // Email masking (show first 2 and last 1 characters)
    maskEmail: true,
    
    // Phone masking (show first 3 and last 2 characters)
    maskPhone: true
  },
  
  // Logging configuration
  logging: {
    enabled: process.env.SECURITY_LOGGING_ENABLED !== 'false',
    logLevel: process.env.SECURITY_LOG_LEVEL || 'info', // 'debug', 'info', 'warn', 'error'
    logToFile: process.env.SECURITY_LOG_TO_FILE === 'true',
    logFilePath: process.env.SECURITY_LOG_FILE_PATH || './logs/security.log',
    logToDatabase: process.env.SECURITY_LOG_TO_DATABASE !== 'false',
    logSensitiveEvents: process.env.SECURITY_LOG_SENSITIVE_EVENTS === 'true',
    
    // Event types to log
    logEventTypes: [
      'FRAUD_DETECTED',
      'HIGH_RISK_TRANSACTION',
      'VELOCITY_LIMIT_EXCEEDED',
      'SUSPICIOUS_IP',
      'SUSPICIOUS_AMOUNT',
      'SUSPICIOUS_TIME',
      'BLOCKED_USER',
      'UNBLOCKED_USER',
      'WEBHOOK_SIGNATURE_INVALID',
      'PCI_DSS_VIOLATION',
      'PAYMENT_INITIATION',
      'PAYMENT_VERIFICATION',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILURE'
    ]
  },
  
  // Audit logging
  audit: {
    enabled: process.env.AUDIT_LOGGING_ENABLED !== 'false',
    logAllChanges: process.env.AUDIT_LOG_ALL_CHANGES === 'true',
    logSensitiveOperations: process.env.AUDIT_LOG_SENSITIVE_OPERATIONS !== 'false',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '365')
  },
  
  // Session security
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // 24 hours
    secure: process.env.SESSION_SECURE === 'true',
    httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
    sameSite: process.env.SESSION_SAME_SITE || 'strict' as 'strict' | 'lax' | 'none',
    domain: process.env.SESSION_DOMAIN,
    path: process.env.SESSION_PATH || '/'
  },
  
  // CORS configuration
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false',
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    maxAge: parseInt(process.env.CORS_MAX_AGE || '86400') // 24 hours
  },
  
  // IP whitelisting/blacklisting
  ipFiltering: {
    enabled: process.env.IP_FILTERING_ENABLED === 'true',
    whitelist: process.env.IP_WHITELIST?.split(',') || [],
    blacklist: process.env.IP_BLACKLIST?.split(',') || [],
    mode: process.env.IP_FILTERING_MODE || 'blacklist' // 'whitelist' or 'blacklist'
  },
  
  // Request validation
  validation: {
    validateContentType: process.env.VALIDATE_CONTENT_TYPE !== 'false',
    allowedContentTypes: ['application/json', 'application/x-www-form-urlencoded'],
    validateBodySize: process.env.VALIDATE_BODY_SIZE !== 'false',
    maxBodySize: parseInt(process.env.MAX_BODY_SIZE || '1048576'), // 1MB
    validateHeaders: process.env.VALIDATE_HEADERS !== 'false',
    requiredHeaders: ['Content-Type']
  },
  
  // Environment-specific settings
  development: {
    fraudDetection: {
      enabled: false
    },
    rateLimiting: {
      relaxed: true
    },
    logging: {
      logLevel: 'debug'
    }
  },
  
  production: {
    fraudDetection: {
      enabled: true
    },
    rateLimiting: {
      relaxed: false
    },
    logging: {
      logLevel: 'info'
    }
  },
  
  test: {
    fraudDetection: {
      enabled: false
    },
    rateLimiting: {
      relaxed: true
    },
    logging: {
      logLevel: 'error'
    }
  }
};

/**
 * Get environment-specific configuration
 * @returns Configuration for current environment
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return { ...securityConfig, ...securityConfig.production };
    case 'test':
      return { ...securityConfig, ...securityConfig.test };
    case 'development':
    default:
      return { ...securityConfig, ...securityConfig.development };
  }
}

/**
 * Validate security configuration
 * @returns Validation result
 */
export function validateSecurityConfig() {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check PCI encryption key
  if (!securityConfig.pciDss.encryptionKey || 
      securityConfig.pciDss.encryptionKey === 'default-key-change-in-production') {
    if (process.env.NODE_ENV === 'production') {
      errors.push('PCI_ENCRYPTION_KEY must be set in production');
    } else {
      warnings.push('Using default PCI encryption key (change in production)');
    }
  }
  
  // Check webhook secrets
  if (securityConfig.webhook.verifySignatures) {
    for (const [gateway, config] of Object.entries(securityConfig.webhook.gateways)) {
      if (!config.secret) {
        warnings.push(`Webhook secret not configured for ${gateway}`);
      }
    }
  }
  
  // Check rate limiting
  if (securityConfig.rateLimiting.paymentInitiation.max < 1) {
    errors.push('Payment initiation rate limit must be at least 1');
  }
  
  // Check fraud detection
  if (securityConfig.fraudDetection.riskThreshold < 0 || 
      securityConfig.fraudDetection.riskThreshold > 100) {
    errors.push('Fraud risk threshold must be between 0 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get fraud detection rules
 * @returns Fraud detection rules
 */
export function getFraudDetectionRules() {
  return {
    maxTransactionsPerHour: securityConfig.fraudDetection.maxTransactionsPerHour,
    maxTransactionsPerDay: securityConfig.fraudDetection.maxTransactionsPerDay,
    maxTransactionAmount: securityConfig.fraudDetection.maxTransactionAmount,
    maxFailedAttempts: securityConfig.fraudDetection.maxFailedAttempts,
    suspiciousAmountPatterns: securityConfig.fraudDetection.suspiciousAmountPatterns,
    suspiciousPhonePatterns: securityConfig.fraudDetection.suspiciousPhonePatterns,
    blockedCountries: securityConfig.fraudDetection.blockedCountries,
    suspiciousIPRanges: securityConfig.fraudDetection.suspiciousIPRanges,
    trackDeviceId: securityConfig.fraudDetection.trackDeviceId,
    trackIPHistory: securityConfig.fraudDetection.trackIPHistory,
    suspiciousHours: securityConfig.fraudDetection.suspiciousHours
  };
}

/**
 * Get rate limit configuration for a specific endpoint type
 * @param endpointType - Type of endpoint
 * @returns Rate limit configuration
 */
export function getRateLimitConfig(endpointType: 'paymentInitiation' | 'paymentVerification' | 'refundRequest' | 'webhookCallback' | 'api') {
  return securityConfig.rateLimiting[endpointType] || securityConfig.rateLimiting.api;
}

/**
 * Get webhook secret for a specific gateway
 * @param gateway - Gateway name
 * @returns Webhook secret
 */
export function getWebhookSecret(gateway: string): string | undefined {
  const gatewayConfig = securityConfig.webhook.gateways[gateway.toLowerCase() as keyof typeof securityConfig.webhook.gateways];
  return gatewayConfig?.secret;
}
