const { loginSecurityService } = require('../services/loginSecurityService');
const { loggerService } = require('../services/logger');

class LoginSecurityMiddleware {
  constructor() {
    this.loginSecurityService = loginSecurityService;
    this.logger = loggerService;
  }

  // Main login security middleware
  enforce() {
    return async (req, res, next) => {
      console.log('[LOGIN SECURITY] Middleware started');
      try {
        const { identifier, password } = req.body;
        // Get IP with fallback for Docker/proxy scenarios
        const ip = req.ip ||
                   req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.connection?.remoteAddress ||
                   'unknown';
        const userAgent = req.get('User-Agent');
        console.log('[LOGIN SECURITY] Step 1: Got request data', { identifier, ip });

        console.log('[LOGIN SECURITY] Step 2: Checking if security disabled');
        // Skip security checks for testing mode if configured
        if (process.env.DISABLE_LOGIN_SECURITY === 'true') {
          console.log('[LOGIN SECURITY] Security disabled, calling next()');
          return next();
        }

        console.log('[LOGIN SECURITY] Step 3: Checking user lockout');
        // Check if user is locked out
        let userLockout;
        try {
          userLockout = await this.loginSecurityService.isUserLockedOut(identifier);
        } catch (lockoutError) {
          console.log('[LOGIN SECURITY] User lockout check failed:', lockoutError.message);
          userLockout = { isLocked: false };
        }
        console.log('[LOGIN SECURITY] Step 4: User lockout check complete', userLockout);
        if (userLockout && userLockout.isLocked) {
          this.logger.logSecurity('Blocked Login Attempt - User Locked Out', null, {
            identifier,
            ip,
            userAgent,
            lockoutReason: userLockout.reason,
            lockedAt: userLockout.lockedAt,
            expiresAt: userLockout.expiresAt,
            remainingTime: userLockout.remainingTime
          });

          return res.status(423).json({
            error: 'Account locked',
            message: 'Your account has been temporarily locked due to too many failed login attempts',
            messageBn: 'অত্যাধিক লগইন চেষ্টার কারণে আপনার অ্যাকাউন্ট সাময়কি করা হয়েছে',
            lockoutDetails: {
              reason: userLockout.reason,
              lockedAt: userLockout.lockedAt,
              expiresAt: userLockout.expiresAt,
              remainingTime: Math.ceil(userLockout.remainingTime / 1000 / 60) // minutes
            }
          });
        }

        // Check if IP is blocked
        let ipBlock;
        try {
          ipBlock = await this.loginSecurityService.isIPBlocked(ip);
        } catch (ipError) {
          console.log('[LOGIN SECURITY] IP block check failed:', ipError.message);
          ipBlock = { isBlocked: false };
        }
        
        if (ipBlock && ipBlock.isBlocked) {
          this.logger.logSecurity('Blocked Login Attempt - IP Blocked', null, {
            identifier,
            ip,
            userAgent,
            blockReason: ipBlock.reason,
            blockedAt: ipBlock.blockedAt,
            expiresAt: ipBlock.expiresAt,
            remainingTime: ipBlock.remainingTime
          });

          return res.status(423).json({
            error: 'IP blocked',
            message: 'Your IP address has been temporarily blocked due to suspicious activity',
            messageBn: 'সন্দেহিত কার্যকলার কারণে আপনার IP ঠিকানা সাময়কি করা হয়েছে',
            blockDetails: {
              reason: ipBlock.reason,
              blockedAt: ipBlock.blockedAt,
              expiresAt: ipBlock.expiresAt,
              remainingTime: Math.ceil(ipBlock.remainingTime / 1000 / 60) // minutes
            }
          });
        }

        // Check for suspicious patterns
        let suspiciousCheck;
        try {
          suspiciousCheck = await this.loginSecurityService.checkSuspiciousPatterns(identifier, ip, userAgent);
        } catch (suspiciousError) {
          console.log('[LOGIN SECURITY] Suspicious check failed:', suspiciousError.message);
          suspiciousCheck = { isSuspicious: false, reasons: [], riskScore: 0 };
        }
        
        if (suspiciousCheck && suspiciousCheck.isSuspicious) {
          this.logger.logSecurity('Suspicious Login Pattern Detected', null, {
            identifier,
            ip,
            userAgent,
            reasons: suspiciousCheck.reasons,
            riskScore: suspiciousCheck.riskScore
          });
        }

        // Check if captcha is required
        let captchaRequired;
        try {
          captchaRequired = await this.loginSecurityService.isCaptchaRequired(identifier, ip);
        } catch (captchaError) {
          console.log('[LOGIN SECURITY] Captcha check failed:', captchaError.message);
          captchaRequired = false;
        }
        
        if (captchaRequired) {
          return res.status(429).json({
            error: 'Captcha required',
            message: 'Please complete the captcha verification to continue',
            messageBn: 'অবির্চ করতে চালিয় করতে অনুগ্রহ করুন',
            captchaRequired: true,
            riskFactors: {
              attempts: await this.getAttemptCount(identifier, ip),
              suspiciousPatterns: suspiciousCheck.reasons
            }
          });
        }

        // Calculate progressive delay
        const delay = await this.loginSecurityService.calculateProgressiveDelay(identifier, ip);
        if (delay > 0) {
          this.logger.logSecurity('Progressive Delay Applied', null, {
            identifier,
            ip,
            delay,
            userAgent
          });

          // Apply delay before proceeding
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Add security headers to response
        this.addSecurityHeaders(res, {
          userLocked: userLockout.isLocked,
          ipBlocked: ipBlock.isBlocked,
          captchaRequired,
          suspiciousActivity: suspiciousCheck.isSuspicious,
          progressiveDelay: delay
        });

        // Attach security context to request for use in login route
        req.securityContext = {
          userLockout,
          ipBlock,
          suspiciousCheck,
          captchaRequired,
          progressiveDelay: delay,
          deviceFingerprint: this.loginSecurityService.generateDeviceFingerprint(req)
        };

        console.log('[LOGIN SECURITY] Step 5: About to call next()');
        next();

      } catch (error) {
        console.log('[LOGIN SECURITY] Error in middleware:', error.message);
        // Safely extract request data with null checks
        const ip = req?.ip ||
                   req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req?.headers?.['x-real-ip'] ||
                   req?.connection?.remoteAddress ||
                   'unknown';
        const userAgent = req?.get ? req.get('User-Agent') : 'unknown';
        const identifier = req?.body?.identifier || 'unknown';
        
        this.logger.error('Login security middleware error', error.message, {
          ip,
          userAgent,
          identifier,
          errorName: error.name,
          errorStack: error.stack,
          timestamp: new Date().toISOString()
        });

        // Check if response has already been sent
        if (!res.headersSent) {
          // Send error response to client instead of timing out
          return res.status(500).json({
            error: 'Login security check failed',
            message: 'An error occurred during login security verification',
            messageBn: 'লগইন নিরাপত্তা যাচাইয়ে ত্রুটি ঘটেছে',
            details: process.env.NODE_ENV === 'development' ? {
              error: error.message,
              name: error.name
            } : undefined
          });
        }
        
        // If response already sent, just log and move on
        next();
      }
    };
  }

  // Get attempt count for response
  async getAttemptCount(identifier, ip) {
    try {
      const stats = await this.loginSecurityService.getLoginAttemptStats(identifier, ip);
      return {
        userAttempts: stats.userAttempts,
        ipAttempts: stats.ipAttempts
      };
    } catch (error) {
      return { userAttempts: 0, ipAttempts: 0 };
    }
  }

  // Add security headers to response
  addSecurityHeaders(res, securityContext) {
    // Add security-related headers
    res.set({
      'X-Login-Security-Enabled': 'true',
      'X-User-Locked': securityContext.userLocked.toString(),
      'X-IP-Blocked': securityContext.ipBlocked.toString(),
      'X-Captcha-Required': securityContext.captchaRequired.toString(),
      'X-Suspicious-Activity': securityContext.suspiciousActivity.toString(),
      'X-Progressive-Delay': securityContext.progressiveDelay.toString(),
      'X-Security-Timestamp': new Date().toISOString()
    });
  }

  // Record successful login (clears failed attempts)
  async recordSuccessfulLogin(req, user) {
    try {
      const { identifier } = req.body;
      const ip = req.ip;
      const userAgent = req.get('User-Agent');

      // Clear failed attempts after successful login
      await this.loginSecurityService.clearFailedAttempts(identifier, ip);

      this.logger.logSecurity('Successful Login', user.id, {
        identifier,
        ip,
        userAgent,
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      // Add success headers
      res.set({
        'X-Login-Status': 'success',
        'X-Security-Cleared': 'true',
        'X-Login-Timestamp': new Date().toISOString()
      });

      return true; // Indicate success
    } catch (error) {
      this.logger.error('Error recording successful login', error.message);
      return false; // Indicate failure but don't throw
    }
  }

  // Record failed login attempt
  recordFailedLogin() {
    return async (req, res, next) => {
      try {
        const { identifier } = req.body;
        const ip = req.ip;
        const userAgent = req.get('User-Agent');

        // Record failed attempt with reason
        const reason = req.authError || 'invalid_credentials';
        await this.loginSecurityService.recordFailedAttempt(identifier, ip, userAgent, reason);

        // Add failure headers
        res.set({
          'X-Login-Status': 'failed',
          'X-Failure-Reason': reason,
          'X-Login-Timestamp': new Date().toISOString()
        });

        next();

      } catch (error) {
        this.logger.error('Error recording failed login', error.message);
        next();
      }
    };
  }

  // Rate limiting middleware specifically for login endpoints
  loginRateLimit(options = {}) {
    return async (req, res, next) => {
      try {
        const config = {
          windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
          max: options.max || 10, // 10 login attempts per window
          message: options.message || 'Too many login attempts, please try again later.',
          skipSuccessfulRequests: options.skipSuccessfulRequests !== false
        };

        const ip = req.ip;
        const key = `login_rate_limit:${ip}`;
        const now = Date.now();
        const windowStart = now - config.windowMs;

        if (this.loginSecurityService.redis) {
          // Use Redis for distributed rate limiting
          const pipeline = this.loginSecurityService.redis.pipeline();
          
          // Remove old entries
          pipeline.zRemRangeByScore(key, 0, windowStart);
          
          // Add current request
          pipeline.zAdd(key, [{ score: now, value: `${now}-${Math.random()}` }]);
          
          // Get current count
          pipeline.zCard(key);
          
          // Set expiration
          pipeline.expire(key, Math.ceil(config.windowMs / 1000));
          
          const results = await pipeline.exec();
          const currentCount = results[2].reply;

          if (currentCount > config.max) {
            this.logger.logSecurity('Login Rate Limit Exceeded', null, {
              ip,
              userAgent: req.get('User-Agent'),
              count: currentCount,
              limit: config.max,
              windowMs: config.windowMs,
              path: req.originalUrl
            });

            return res.status(429).json({
              error: 'Too many login attempts',
              message: config.message,
              messageBn: 'অত্যাধিক লগইন চেষ্টা, অনুগ্রহ পরে চেষ্টা করুন',
              retryAfter: Math.ceil(config.windowMs / 1000),
              rateLimitDetails: {
                currentCount,
                limit: config.max,
                windowMs: config.windowMs,
                resetTime: new Date(now + config.windowMs).toISOString()
              }
            });
          }

          // Add rate limit headers
          res.set({
            'X-Login-RateLimit-Limit': config.max,
            'X-Login-RateLimit-Remaining': Math.max(0, config.max - currentCount),
            'X-Login-RateLimit-Reset': new Date(now + config.windowMs).toISOString()
          });
        }

        next();

      } catch (error) {
        this.logger.error('Login rate limiting error', error.message);
        next(); // Fail open
      }
    };
  }

  // Enhanced security validation middleware
  validateSecurity() {
    return (req, res, next) => {
      try {
        const securityContext = req.securityContext;
        
        if (!securityContext) {
          return next();
        }

        // Additional validation based on security context
        const validationErrors = [];

        // Check for high-risk patterns
        if (securityContext.suspiciousCheck.riskScore >= 5) {
          validationErrors.push('High risk activity detected');
        }

        // Check for multiple security violations
        let violationCount = 0;
        if (securityContext.userLocked.isLocked) { violationCount++; }
        if (securityContext.ipBlock.isBlocked) { violationCount++; }
        if (securityContext.captchaRequired) { violationCount++; }
        if (securityContext.suspiciousCheck.isSuspicious) { violationCount++; }

        if (violationCount >= 2) {
          validationErrors.push('Multiple security violations detected');
        }

        if (validationErrors.length > 0) {
          this.logger.logSecurity('Security Validation Failed', null, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            identifier: req.body.identifier,
            validationErrors,
            securityContext
          });

          return res.status(403).json({
            error: 'Security validation failed',
            message: 'Your request has been blocked due to security concerns',
            messageBn: 'নিরাপত্তিগিয় উদ্বেগ আপনার অনুরোধ ব্লক করা হয়েছে',
            validationErrors,
            securityContext: {
              riskScore: securityContext.suspiciousCheck.riskScore,
              violations: violationCount
            }
          });
        }

        next();

      } catch (error) {
        this.logger.error('Security validation error', error.message);
        next();
      }
    };
  }
}

// Singleton instance
const loginSecurityMiddleware = new LoginSecurityMiddleware();

module.exports = {
  LoginSecurityMiddleware,
  loginSecurityMiddleware
};