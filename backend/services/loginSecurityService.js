const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { configService } = require('./config');
const { loggerService } = require('./logger');
const { redisConnectionPool } = require('./redisConnectionPool');

class LoginSecurityService {
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = null;
    this.config = configService;
    this.logger = loggerService;
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      // Initialize Redis connection pool
      await redisConnectionPool.initialize();
      
      // Get shared Redis client for login security service
      this.redis = redisConnectionPool.getClient('loginSecurityService');
      
      if (!this.redis) {
        this.logger.warn('Redis client not available, login security will use database only');
        return;
      }

      this.logger.info('Login security service using shared Redis connection');
    } catch (error) {
      this.logger.error('Failed to initialize Redis for login security service', error.message);
      this.redis = null;
    }
  }

  // Get security configuration
  getSecurityConfig() {
    return {
      // Login attempt limits
      maxAttempts: this.config.get('MAX_LOGIN_ATTEMPTS') || 5,
      attemptWindow: this.config.get('LOGIN_ATTEMPT_WINDOW') || 15 * 60 * 1000, // 15 minutes
      
      // Account lockout settings
      lockoutDuration: this.config.get('ACCOUNT_LOCKOUT_DURATION') || 30 * 60 * 1000, // 30 minutes
      maxLockouts: this.config.get('MAX_ACCOUNT_LOCKOUTS') || 3,
      
      // IP blocking settings
      ipMaxAttempts: this.config.get('IP_MAX_ATTEMPTS') || 20,
      ipBlockDuration: this.config.get('IP_BLOCK_DURATION') || 60 * 60 * 1000, // 1 hour
      
      // Progressive delay settings
      delayEnabled: this.config.get('LOGIN_DELAY_ENABLED') !== 'false',
      baseDelay: this.config.get('LOGIN_BASE_DELAY') || 1000, // 1 second
      maxDelay: this.config.get('LOGIN_MAX_DELAY') || 10000, // 10 seconds
      
      // Captcha settings
      captchaThreshold: this.config.get('CAPTCHA_THRESHOLD') || 3,
      captchaEnabled: this.config.get('CAPTCHA_ENABLED') === 'true'
    };
  }

  // Record failed login attempt
  async recordFailedAttempt(identifier, ip, userAgent, reason = 'invalid_credentials') {
    try {
      const securityConfig = this.getSecurityConfig();
      const now = Date.now();
      
      // Determine if identifier is email or phone
      const isEmail = identifier.includes('@');
      const identifierType = isEmail ? 'email' : 'phone';
      
      // Record attempt in Redis if available
      if (this.redis) {
        await this.recordFailedAttemptInRedis(identifier, ip, userAgent, reason, now, securityConfig);
      } else {
        await this.recordFailedAttemptInDatabase(identifier, ip, userAgent, reason, now, securityConfig);
      }

      // Log security event
      this.logger.logSecurity('Failed Login Attempt', null, {
        identifier,
        identifierType,
        ip,
        userAgent,
        reason,
        timestamp: new Date(now).toISOString()
      });

    } catch (error) {
      this.logger.error('Failed to record failed login attempt', error.message);
      throw error;
    }
  }

  // Record failed attempt in Redis
  async recordFailedAttemptInRedis(identifier, ip, userAgent, reason, now, config) {
    const pipeline = this.redis.pipeline();
    
    // Record user-specific attempts
    const userKey = `login_attempts:${identifier}`;
    pipeline.zAdd(userKey, [{ score: now, value: `${now}-${crypto.randomBytes(8).toString('hex')}` }]);
    pipeline.expire(userKey, Math.ceil(config.attemptWindow / 1000));
    
    // Record IP-specific attempts
    const ipKey = `ip_attempts:${ip}`;
    pipeline.zAdd(ipKey, [{ score: now, value: `${now}-${crypto.randomBytes(8).toString('hex')}` }]);
    pipeline.expire(ipKey, Math.ceil(config.attemptWindow / 1000));
    
    // Record global suspicious activity
    const suspiciousKey = `suspicious_activity:${ip}`;
    pipeline.hIncrBy(suspiciousKey, 'count', 1);
    pipeline.expire(suspiciousKey, 24 * 60 * 60); // 24 hours
    
    await pipeline.exec();
    
    // Check if user should be locked out
    await this.checkAndApplyUserLockout(identifier, config);
    
    // Check if IP should be blocked
    await this.checkAndApplyIPBlock(ip, config);
  }

  // Record failed attempt in database (fallback)
  async recordFailedAttemptInDatabase(identifier, ip, userAgent, reason, now, config) {
    // This would require creating loginAttempt and loginLockout tables
    // For now, we'll implement a basic version using existing structures
    this.logger.warn('Using database fallback for login attempt recording - consider implementing dedicated tables');
  }

  // Check and apply user lockout
  async checkAndApplyUserLockout(identifier, config) {
    if (!this.redis) return;
    
    const userKey = `login_attempts:${identifier}`;
    const attempts = await this.redis.zRange(userKey, 0, -1);
    
    const recentAttempts = attempts.filter(attempt => {
      const score = parseInt(attempt.split('-')[0]);
      return (Date.now() - score) < config.attemptWindow;
    });
    
    if (recentAttempts.length >= config.maxAttempts) {
      const lockoutKey = `user_lockout:${identifier}`;
      const lockoutExpiry = Date.now() + config.lockoutDuration;
      
      await this.redis.setEx(lockoutKey, Math.ceil(config.lockoutDuration / 1000), JSON.stringify({
        reason: 'too_many_attempts',
        attempts: recentAttempts.length,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(lockoutExpiry).toISOString()
      }));
      
      this.logger.logSecurity('User Locked Out', null, {
        identifier,
        reason: 'too_many_attempts',
        attempts: recentAttempts.length,
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(lockoutExpiry).toISOString()
      });
    }
  }

  // Check and apply IP block
  async checkAndApplyIPBlock(ip, config) {
    if (!this.redis) return;
    
    const ipKey = `ip_attempts:${ip}`;
    const attempts = await this.redis.zRange(ipKey, 0, -1);
    
    const recentAttempts = attempts.filter(attempt => {
      const score = parseInt(attempt.split('-')[0]);
      return (Date.now() - score) < config.attemptWindow;
    });
    
    if (recentAttempts.length >= config.ipMaxAttempts) {
      const blockKey = `ip_block:${ip}`;
      const blockExpiry = Date.now() + config.ipBlockDuration;
      
      await this.redis.setEx(blockKey, Math.ceil(config.ipBlockDuration / 1000), JSON.stringify({
        reason: 'too_many_attempts',
        attempts: recentAttempts.length,
        blockedAt: new Date().toISOString(),
        expiresAt: new Date(blockExpiry).toISOString()
      }));
      
      this.logger.logSecurity('IP Blocked', null, {
        ip,
        reason: 'too_many_attempts',
        attempts: recentAttempts.length,
        blockedAt: new Date().toISOString(),
        expiresAt: new Date(blockExpiry).toISOString()
      });
    }
  }

  // Check if user is locked out
  async isUserLockedOut(identifier) {
    try {
      if (!this.redis) return false;
      
      const lockoutKey = `user_lockout:${identifier}`;
      const lockoutData = await this.redis.get(lockoutKey);
      
      if (!lockoutData) return false;
      
      const lockout = JSON.parse(lockoutData);
      return {
        isLocked: true,
        reason: lockout.reason,
        lockedAt: lockout.lockedAt,
        expiresAt: lockout.expiresAt,
        remainingTime: Math.max(0, new Date(lockout.expiresAt).getTime() - Date.now())
      };
      
    } catch (error) {
      this.logger.error('Error checking user lockout status', error.message);
      return false;
    }
  }

  // Check if IP is blocked
  async isIPBlocked(ip) {
    try {
      if (!this.redis) return false;
      
      const blockKey = `ip_block:${ip}`;
      const blockData = await this.redis.get(blockKey);
      
      if (!blockData) return false;
      
      const block = JSON.parse(blockData);
      return {
        isBlocked: true,
        reason: block.reason,
        blockedAt: block.blockedAt,
        expiresAt: block.expiresAt,
        remainingTime: Math.max(0, new Date(block.expiresAt).getTime() - Date.now())
      };
      
    } catch (error) {
      this.logger.error('Error checking IP block status', error.message);
      return false;
    }
  }

  // Calculate progressive delay for failed attempts
  async calculateProgressiveDelay(identifier, ip) {
    try {
      const config = this.getSecurityConfig();
      if (!config.delayEnabled) return 0;
      
      let attemptCount = 0;
      
      if (this.redis) {
        const userKey = `login_attempts:${identifier}`;
        const attempts = await this.redis.zRange(userKey, 0, -1);
        
        attemptCount = attempts.filter(attempt => {
          const score = parseInt(attempt.split('-')[0]);
          return (Date.now() - score) < config.attemptWindow;
        }).length;
      }
      
      // Calculate exponential delay: baseDelay * (2 ^ (attempts - 1))
      const delay = Math.min(
        config.baseDelay * Math.pow(2, Math.max(0, attemptCount - 1)),
        config.maxDelay
      );
      
      return delay;
      
    } catch (error) {
      this.logger.error('Error calculating progressive delay', error.message);
      return 0;
    }
  }

  // Check if captcha is required
  async isCaptchaRequired(identifier, ip) {
    try {
      const config = this.getSecurityConfig();
      if (!config.captchaEnabled) return false;
      
      if (!this.redis) return false;
      
      const userKey = `login_attempts:${identifier}`;
      const attempts = await this.redis.zRange(userKey, 0, -1);
      
      const recentAttempts = attempts.filter(attempt => {
        const score = parseInt(attempt.split('-')[0]);
        return (Date.now() - score) < config.attemptWindow;
      });
      
      return recentAttempts.length >= config.captchaThreshold;
      
    } catch (error) {
      this.logger.error('Error checking captcha requirement', error.message);
      return false;
    }
  }

  // Clear failed attempts after successful login
  async clearFailedAttempts(identifier, ip) {
    try {
      if (this.redis) {
        const pipeline = this.redis.pipeline();
        
        // Clear user attempts
        const userKey = `login_attempts:${identifier}`;
        pipeline.del(userKey);
        
        // Clear user lockout if exists
        const lockoutKey = `user_lockout:${identifier}`;
        pipeline.del(lockoutKey);
        
        // Reduce IP attempt count (but don't clear completely)
        const ipKey = `ip_attempts:${ip}`;
        pipeline.zRemRangeByScore(ipKey, 0, Date.now() - (15 * 60 * 1000));
        
        await pipeline.exec();
        
        this.logger.logSecurity('Login Attempts Cleared', null, {
          identifier,
          ip,
          reason: 'successful_login',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      this.logger.error('Error clearing failed attempts', error.message);
    }
  }

  // Get login attempt statistics
  async getLoginAttemptStats(identifier = null, ip = null) {
    try {
      const stats = {
        userAttempts: 0,
        ipAttempts: 0,
        isUserLocked: false,
        isIPBlocked: false,
        captchaRequired: false,
        progressiveDelay: 0
      };
      
      if (this.redis) {
        if (identifier) {
          const userKey = `login_attempts:${identifier}`;
          const userAttempts = await this.redis.zCard(userKey);
          stats.userAttempts = userAttempts || 0;
          
          const lockoutStatus = await this.isUserLockedOut(identifier);
          stats.isUserLocked = lockoutStatus.isLocked || false;
          
          const captchaRequired = await this.isCaptchaRequired(identifier, ip);
          stats.captchaRequired = captchaRequired;
          
          const delay = await this.calculateProgressiveDelay(identifier, ip);
          stats.progressiveDelay = delay;
        }
        
        if (ip) {
          const ipKey = `ip_attempts:${ip}`;
          const ipAttempts = await this.redis.zCard(ipKey);
          stats.ipAttempts = ipAttempts || 0;
          
          const blockStatus = await this.isIPBlocked(ip);
          stats.isIPBlocked = blockStatus.isBlocked || false;
        }
      }
      
      return stats;
      
    } catch (error) {
      this.logger.error('Error getting login attempt stats', error.message);
      return {
        userAttempts: 0,
        ipAttempts: 0,
        isUserLocked: false,
        isIPBlocked: false,
        captchaRequired: false,
        progressiveDelay: 0
      };
    }
  }

  // Generate device fingerprint for enhanced security
  generateDeviceFingerprint(req) {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    const accept = req.get('Accept') || '';
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}|${acceptLanguage}|${acceptEncoding}|${accept}`)
      .digest('hex');
    
    return fingerprint.substring(0, 32);
  }

  // Check for suspicious login patterns
  async checkSuspiciousPatterns(identifier, ip, userAgent) {
    try {
      const suspicious = {
        isSuspicious: false,
        reasons: [],
        riskScore: 0
      };
      
      if (!this.redis) return suspicious;
      
      const now = Date.now();
      const suspiciousKey = `suspicious_activity:${ip}`;
      const suspiciousData = await this.redis.hGetAll(suspiciousKey);
      
      if (suspiciousData && suspiciousData.count) {
        const attemptCount = parseInt(suspiciousData.count);
        
        // High number of attempts from same IP
        if (attemptCount > 10) {
          suspicious.isSuspicious = true;
          suspicious.reasons.push('high_attempt_volume');
          suspicious.riskScore += 3;
        }
        
        // Rapid successive attempts
        if (attemptCount > 5) {
          suspicious.isSuspicious = true;
          suspicious.reasons.push('rapid_attempts');
          suspicious.riskScore += 2;
        }
      }
      
      // Check for known malicious user agents
      const maliciousPatterns = [
        /bot/i,
        /crawler/i,
        /scanner/i,
        /sqlmap/i,
        /nikto/i,
        /nmap/i
      ];
      
      if (maliciousPatterns.some(pattern => pattern.test(userAgent))) {
        suspicious.isSuspicious = true;
        suspicious.reasons.push('malicious_user_agent');
        suspicious.riskScore += 5;
      }
      
      // Check for automated tools
      const automatedPatterns = [
        /curl/i,
        /wget/i,
        /python/i,
        /java/i,
        /node/i
      ];
      
      if (automatedPatterns.some(pattern => pattern.test(userAgent)) && suspicious.riskScore > 0) {
        suspicious.isSuspicious = true;
        suspicious.reasons.push('automated_tool');
        suspicious.riskScore += 2;
      }
      
      if (suspicious.isSuspicious) {
        this.logger.logSecurity('Suspicious Login Pattern Detected', null, {
          identifier,
          ip,
          userAgent,
          reasons: suspicious.reasons,
          riskScore: suspicious.riskScore,
          timestamp: new Date(now).toISOString()
        });
      }
      
      return suspicious;
      
    } catch (error) {
      this.logger.error('Error checking suspicious patterns', error.message);
      return {
        isSuspicious: false,
        reasons: [],
        riskScore: 0
      };
    }
  }

  // Cleanup expired security data
  async cleanupExpiredData() {
    try {
      let cleanedCount = 0;
      
      if (this.redis) {
        // Redis handles expiration automatically, but we can clean up any orphaned keys
        const patterns = [
          'login_attempts:*',
          'ip_attempts:*',
          'user_lockout:*',
          'ip_block:*',
          'suspicious_activity:*'
        ];
        
        for (const pattern of patterns) {
          const keys = await this.redis.keys(pattern);
          for (const key of keys) {
            const ttl = await this.redis.ttl(key);
            if (ttl === -1) { // No expiration set
              await this.redis.expire(key, 24 * 60 * 60); // Set 24 hour expiration
              cleanedCount++;
            }
          }
        }
      }
      
      this.logger.info('Login security cleanup completed', {
        cleanedCount,
        timestamp: new Date().toISOString()
      });
      
      return { success: true, cleanedCount };
      
    } catch (error) {
      this.logger.error('Login security cleanup error', error.message);
      return { success: false, reason: 'Cleanup failed' };
    }
  }
  // Initialize method for proper setup
  async initialize() {
    try {
      this.logger.info('Initializing login security service...');
      
      // Initialize Redis connection
      await this.initializeRedis();
      
      // Validate configuration
      const config = this.getSecurityConfig();
      this.logger.info('Login security configuration loaded', {
        maxAttempts: config.maxAttempts,
        lockoutDuration: config.lockoutDuration,
        ipMaxAttempts: config.ipMaxAttempts,
        captchaEnabled: config.captchaEnabled
      });
      
      // Perform initial cleanup
      await this.cleanupExpiredData();
      
      this.logger.info('Login security service initialized successfully');
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to initialize login security service', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
const loginSecurityService = new LoginSecurityService();

module.exports = {
  LoginSecurityService,
  loginSecurityService
};