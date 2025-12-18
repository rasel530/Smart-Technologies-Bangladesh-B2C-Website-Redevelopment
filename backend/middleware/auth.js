const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const configService = require('../services/config');
const loggerService = require('../services/logger');

class AuthMiddleware {
  constructor() {
    this.config = configService;
    this.logger = loggerService;
    this.redis = null;
    // Initialize Redis asynchronously to avoid blocking
    this.initializeRedis().catch(err => {
      if (err) {
        console.error('Failed to initialize Redis:', err.message);
      }
    });
  }

  async initializeRedis() {
    try {
      const Redis = require('redis');
      const redisUrl = this.config.get('REDIS_URL');
      
      // Check if Redis URL is available
      if (!redisUrl) {
        this.logger.warn('REDIS_URL not configured, running without Redis');
          this.redis = null;
          return;
        }
      
      this.redis = Redis.createClient({
        url: redisUrl,
        retry_delay_on_failover: 100,
        max_retries_per_request: 3,
        connectTimeout: 5000,
        lazyConnect: true
      });
      
      this.redis.on('error', (err) => {
        this.logger.error('Redis connection error', err.message);
        this.redis = null; // Reset to null on error
      });
      
      this.redis.on('connect', () => {
        this.logger.info('Redis connected successfully');
      });
      
      this.redis.on('end', () => {
        this.logger.warn('Redis connection ended');
        this.redis = null;
      });
      
      // Try to connect with timeout
      await Promise.race([
        this.redis.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )
      ]);
      
    } catch (error) {
      if (this.logger && typeof this.logger.error === 'function') {
        this.logger.error('Failed to initialize Redis', error.message);
      }
      // Don't throw error, just set redis to null and continue
      this.redis = null;
      if (this.logger && typeof this.logger.warn === 'function') {
        this.logger.warn('Running without Redis - some security features will be limited');
      } else {
        console.warn('Running without Redis - some security features will be limited');
      }
    }
  }

  // Enhanced JWT authentication middleware with proper security
  authenticate() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
          return res.status(401).json({
            error: 'Access token required',
            message: 'Authorization header is missing'
          });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({
            error: 'Invalid token format',
            message: 'Authorization header must be in format "Bearer <token>"'
          });
        }

        // Check if token is blacklisted
        const isBlacklisted = await this.isTokenBlacklisted(token);
        if (isBlacklisted) {
          this.logger.logSecurity('Blacklisted Token Access Attempt', null, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl
          });
          
          return res.status(401).json({
            error: 'Token revoked',
            message: 'This token has been revoked and cannot be used'
          });
        }

        // Enhanced JWT verification with proper algorithm validation
        const jwtConfig = this.config.getJWTConfig();
        const decoded = jwt.verify(token, jwtConfig.secret, {
          algorithms: [jwtConfig.algorithm],
          issuer: jwtConfig.issuer,
          clockTolerance: 30 // 30 seconds clock skew tolerance
        });
        
        if (!decoded) {
          return res.status(401).json({
            error: 'Invalid token',
            message: 'Token is expired or invalid'
          });
        }

        // Validate token structure and required fields
        if (!decoded.userId || !decoded.role || !decoded.iat || !decoded.exp) {
          return res.status(401).json({
            error: 'Invalid token structure',
            message: 'Token is missing required claims'
          });
        }

        // Check token expiration with additional buffer
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp <= now) {
          return res.status(401).json({
            error: 'Token expired',
            message: 'Authentication token has expired'
          });
        }

        // Check for suspicious activity from this IP
        const ipReputation = await this.checkIPReputation(req.ip);
        if (ipReputation.isSuspicious) {
          this.logger.logSecurity('Suspicious IP Access Attempt', decoded.userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            reputation: ipReputation,
            path: req.originalUrl
          });
          
          return res.status(403).json({
            error: 'Access denied',
            message: 'Suspicious activity detected from your IP address'
          });
        }

        // Attach user info to request
        req.user = decoded;
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.token = token;

        this.logger.logAuth('Token Verified', decoded.userId, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        next();

      } catch (error) {
        this.logger.error('Authentication Error', error.message, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          errorType: error.name
        });

        // Enhanced error handling for different JWT errors
        let errorMessage = 'Authentication failed';
        let statusCode = 401;

        if (error.name === 'TokenExpiredError') {
          errorMessage = 'Token has expired';
        } else if (error.name === 'JsonWebTokenError') {
          errorMessage = 'Invalid token format or signature';
        } else if (error.name === 'NotBeforeError') {
          errorMessage = 'Token not yet active';
        }

        return res.status(statusCode).json({
          error: 'Authentication failed',
          message: errorMessage
        });
      }
    };
  }

  // JWT token rotation and refresh mechanism
  async rotateToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token required',
          message: 'Refresh token is required for token rotation'
        });
      }

      // Verify refresh token
      const jwtConfig = this.config.getJWTConfig();
      const decoded = jwt.verify(refreshToken, jwtConfig.secret, {
        algorithms: [jwtConfig.algorithm],
        issuer: jwtConfig.issuer
      });

      // Generate new access token with shorter expiration
      const newAccessToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          tokenType: 'access',
          rotatedAt: new Date().toISOString()
        },
        jwtConfig.secret,
        { expiresIn: '15m' } // Shorter expiration for access tokens
      );

      // Generate new refresh token with longer expiration
      const newRefreshToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          tokenType: 'refresh',
          rotatedAt: new Date().toISOString()
        },
        jwtConfig.secret,
        { expiresIn: '7d' } // Longer expiration for refresh tokens
      );

      // Blacklist old refresh token
      await this.blacklistToken(refreshToken, 'Token rotation');

      this.logger.logSecurity('Token Rotation Completed', decoded.userId, {
        oldTokenExpiry: new Date(decoded.exp * 1000).toISOString(),
        newAccessTokenExpiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.originalUrl
      });

      return res.status(200).json({
        message: 'Token rotated successfully',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'rotated'
      });

    } catch (error) {
      this.logger.error('Token rotation error', error.message, {
        userId: decoded?.userId || 'unknown',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.originalUrl
      });

      return res.status(401).json({
        error: 'Token rotation failed',
        message: 'Failed to rotate authentication token'
      });
    }
  }

  // Enhanced token validation with rotation check
  async validateAndRotateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authorization header is missing'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Invalid token format',
        message: 'Authorization header must be in format "Bearer <token>"'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.isTokenBlacklisted(token);
    if (isBlacklisted) {
      this.logger.logSecurity('Blacklisted Token Access Attempt', null, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.originalUrl
      });
      
      return res.status(401).json({
        error: 'Token revoked',
        message: 'This token has been revoked and cannot be used'
      });
    }

    // Enhanced JWT verification with proper algorithm validation
    const jwtConfig = this.config.getJWTConfig();
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      clockTolerance: 30 // 30 seconds clock skew tolerance
    });
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is expired or invalid'
      });
    }

    // Validate token structure and required fields
    if (!decoded.userId || !decoded.role || !decoded.iat || !decoded.exp) {
      return res.status(401).json({
        error: 'Invalid token structure',
        message: 'Token is missing required claims'
      });
    }

    // Check token expiration with additional buffer and rotation check
    const now = Math.floor(Date.now() / 1000);
    const expirationBuffer = 300; // 5 minutes buffer before expiration
    const timeUntilExpiry = decoded.exp - now;
    
    if (decoded.exp <= now) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Authentication token has expired'
      });
    }

    // Check if token is close to expiration and needs rotation
    if (timeUntilExpiry <= expirationBuffer) {
      this.logger.logSecurity('Token Rotation Required', decoded.userId, {
        timeUntilExpiry,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.originalUrl,
        currentExpiry: new Date(decoded.exp * 1000).toISOString()
      });
      
      // Attempt automatic token rotation
      return await this.rotateToken(req, res);
    }

    // Attach user info to request
    req.user = decoded;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.token = token;

    this.logger.logAuth('Token Verified', decoded.userId, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  }

  // Role-based authorization middleware
  authorize(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to access this resource'
        });
      }

      const userRole = req.userRole;
      const hasRequiredRole = roles.some(role => userRole === role);

      if (!hasRequiredRole) {
        this.logger.logSecurity('Unauthorized Access Attempt', req.userId, {
          requiredRole: roles,
          userRole,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.originalUrl
        });

        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Access denied. Required roles: ${roles.join(', ')}`
        });
      }

      this.logger.logAuth('Access Granted', req.userId, {
        requiredRole: roles,
        userRole,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.originalUrl
      });

      next();
    };
  }

  // Admin only middleware
  adminOnly() {
    return this.authorize(['ADMIN']);
  }

  // Manager or Admin middleware
  managerOrAdmin() {
    return this.authorize(['MANAGER', 'ADMIN']);
  }

  // Customer or Admin middleware
  customerOrAdmin() {
    return this.authorize(['CUSTOMER', 'ADMIN']);
  }

  // Self or Admin middleware (users can access their own resources)
  selfOrAdmin(userId) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be authenticated to access this resource'
        });
      }

      // Allow access if user is admin or accessing their own resource
      const isOwner = req.userId === userId;
      const isAdmin = req.userRole === 'ADMIN';

      if (!isOwner && !isAdmin) {
        this.logger.logSecurity('Unauthorized Access Attempt', req.userId, {
          targetUserId: userId,
          userRole: req.userRole,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.originalUrl
        });

        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources or need admin privileges'
        });
      }

      this.logger.logAuth('Access Granted', req.userId, {
        targetUserId: userId,
        userRole: req.userRole,
        isOwner,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.originalUrl
      });

      next();
    };
  }

  // Optional authentication (guest access allowed)
  optional() {
    return async (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        // No authentication provided, continue as guest
        req.user = null;
        req.userId = null;
        req.userRole = null;
        return next();
      }

      try {
        const token = authHeader.replace('Bearer ', '');
        
        // Check if token is blacklisted
        const isBlacklisted = await this.isTokenBlacklisted(token);
        if (isBlacklisted) {
          req.user = null;
          req.userId = null;
          req.userRole = null;
          return next();
        }

        const jwtConfig = this.config.getJWTConfig();
        const decoded = jwt.verify(token, jwtConfig.secret, {
          algorithms: [jwtConfig.algorithm],
          issuer: jwtConfig.issuer
        });
        
        // Attach user info if token is valid
        req.user = decoded;
        req.userId = decoded.userId;
        req.userRole = decoded.role;

        this.logger.logAuth('Optional Authentication', decoded.userId, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

      } catch (error) {
        // Invalid token, continue as guest
        req.user = null;
        req.userId = null;
        req.userRole = null;
        
        this.logger.warn('Invalid Optional Token', error.message, {
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }

      next();
    };
  }

  // Redis-based rate limiting middleware
  rateLimit(options = {}) {
    return async (req, res, next) => {
      try {
        if (!this.redis) {
          if (this.logger && typeof this.logger.warn === 'function') {
            this.logger.warn('Rate limiting disabled - Redis not available');
          } else {
            console.warn('Rate limiting disabled - Redis not available');
          }
          // Allow request without rate limiting
          return next();
        }

        const config = {
          windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
          max: options.max || this.config.isProduction() ? 100 : 1000,
          message: options.message || 'Too many requests from this IP, please try again later.',
          standardHeaders: true
        };

        const key = `rate_limit:${req.ip}`;
        const now = Date.now();
        const windowStart = now - config.windowMs;
        
        // Use Redis pipeline for atomic operations
        const pipeline = this.redis.pipeline();
        
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
          this.logger.logSecurity('Rate Limit Exceeded', null, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl,
            count: currentCount,
            limit: config.max,
            windowMs: config.windowMs
          });

          return res.status(429).json({
            error: 'Too many requests',
            message: config.message,
            retryAfter: Math.ceil(config.windowMs / 1000)
          });
        }

        // Add rate limit headers
        res.set({
          'X-RateLimit-Limit': config.max,
          'X-RateLimit-Remaining': Math.max(0, config.max - currentCount),
          'X-RateLimit-Reset': new Date(now + config.windowMs).toISOString()
        });

        next();

      } catch (error) {
        this.logger.error('Rate limiting error', error.message, {
          ip: req.ip,
          path: req.originalUrl
        });
        
        // Fail open - allow request but log error
        next();
      }
    };
  }

  // Token blacklist management
  async blacklistToken(token, reason = 'User logout') {
    try {
      if (!this.redis) {
        if (this.logger && typeof this.logger.warn === 'function') {
          this.logger.warn('Token blacklisting disabled - Redis not available', { reason });
        } else {
          console.warn('Token blacklisting disabled - Redis not available', { reason });
        }
        return; // Skip blacklisting but continue
      }

      // Decode token to get expiration
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token for blacklisting');
      }

      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl <= 0) {
        return; // Token already expired
      }

      const key = `blacklist:${crypto.createHash('sha256').update(token).digest('hex')}`;
      await this.redis.setEx(key, ttl, JSON.stringify({
        reason,
        blacklistedAt: new Date().toISOString(),
        originalExp: new Date(decoded.exp * 1000).toISOString()
      }));

      this.logger.info('Token blacklisted successfully', {
        reason,
        ttl,
        userId: decoded.userId
      });

    } catch (error) {
      this.logger.error('Failed to blacklist token', error.message);
      throw error;
    }
  }

  async isTokenBlacklisted(token) {
    try {
      if (!this.redis) {
        if (this.logger && typeof this.logger.warn === 'function') {
          this.logger.warn('Token blacklist check disabled - Redis not available');
        } else {
          console.warn('Token blacklist check disabled - Redis not available');
        }
        return false;
      }

      const key = `blacklist:${crypto.createHash('sha256').update(token).digest('hex')}`;
      const result = await this.redis.get(key);
      return result !== null;
    } catch (error) {
      this.logger.error('Error checking token blacklist', error.message);
      return false;
    }
  }

  // IP reputation checking
  async checkIPReputation(ip) {
    try {
      if (!this.redis) {
        if (this.logger && typeof this.logger.warn === 'function') {
          this.logger.warn('IP reputation check disabled - Redis not available');
        } else {
          console.warn('IP reputation check disabled - Redis not available');
        }
        return { isSuspicious: false, score: 0 };
      }

      const key = `ip_reputation:${ip}`;
      const data = await this.redis.hGetAll(key);
      
      if (!data || Object.keys(data).length === 0) {
        return { isSuspicious: false, score: 0 };
      }

      const failedAttempts = parseInt(data.failedAttempts || '0');
      const lastAttempt = parseInt(data.lastAttempt || '0');
      const now = Date.now();
      
      // Calculate reputation score
      let score = 0;
      if (failedAttempts > 10) score += 3;
      if (failedAttempts > 5) score += 2;
      if (now - lastAttempt < 60000) score += 1; // Recent activity

      return {
        isSuspicious: score >= 3,
        score,
        failedAttempts,
        lastAttempt: new Date(lastAttempt).toISOString()
      };

    } catch (error) {
      this.logger.error('Error checking IP reputation', error.message);
      return { isSuspicious: false, score: 0 };
    }
  }

  async recordFailedAttempt(ip, reason = 'authentication') {
    try {
      if (!this.redis) {
        if (this.logger && typeof this.logger.warn === 'function') {
          this.logger.warn('Failed attempt recording disabled - Redis not available');
        } else {
          console.warn('Failed attempt recording disabled - Redis not available');
        }
        return;
      }

      const key = `ip_reputation:${ip}`;
      const now = Date.now();
      
      await this.redis.hIncrBy(key, 'failedAttempts', 1);
      await this.redis.hSet(key, 'lastAttempt', now.toString());
      await this.redis.expire(key, 24 * 60 * 60); // 24 hours

    } catch (error) {
      this.logger.error('Error recording failed attempt', error.message);
    }
  }

  // Request ID middleware
  requestId() {
    return (req, res, next) => {
      req.id = this.generateRequestId();
      res.setHeader('X-Request-ID', req.id);
      next();
    };
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Enhanced API key validation with rotation support
  validateApiKey(apiKeys = []) {
    return async (req, res, next) => {
      try {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
          return res.status(401).json({
            error: 'API key required',
            message: 'X-API-Key header is required'
          });
        }

        // Check if API key is in valid list
        const validKey = apiKeys.find(key => {
          if (typeof key === 'string') {
            return key === apiKey;
          } else if (typeof key === 'object') {
            return key.key === apiKey && this.isApiKeyValid(key);
          }
          return false;
        });

        if (!validKey) {
          await this.recordFailedAttempt(req.ip, 'api_key');
          
          this.logger.logSecurity('Invalid API Key', null, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl,
            apiKey: apiKey.substring(0, 8) + '...'
          });

          return res.status(401).json({
            error: 'Invalid API key',
            message: 'The provided API key is not valid'
          });
        }

        // Check for API key rotation if it's an object with expiration
        if (typeof validKey === 'object' && validKey.expiresAt) {
          const now = Date.now();
          if (now > validKey.expiresAt) {
            return res.status(401).json({
              error: 'API key expired',
              message: 'The provided API key has expired and needs rotation'
            });
          }

          // Add warning if key is close to expiration
          const timeUntilExpiry = validKey.expiresAt - now;
          const warningThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
          
          if (timeUntilExpiry < warningThreshold) {
            res.set('X-API-Key-Expires-Soon', 'true');
            res.set('X-API-Key-Expiry-Date', new Date(validKey.expiresAt).toISOString());
          }
        }

        this.logger.logSecurity('API Key Validated', null, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.originalUrl,
          keyId: typeof validKey === 'object' ? validKey.id : 'unknown'
        });

        req.apiKey = validKey;
        next();

      } catch (error) {
        this.logger.error('API key validation error', error.message, {
          ip: req.ip,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Internal server error',
          message: 'API key validation failed'
        });
      }
    };
  }

  isApiKeyValid(keyObject) {
    if (!keyObject.key || !keyObject.createdAt) {
      return false;
    }

    const now = Date.now();
    
    // Check if key has expired
    if (keyObject.expiresAt && now > keyObject.expiresAt) {
      return false;
    }

    // Check if key has been revoked
    if (keyObject.revokedAt && now > keyObject.revokedAt) {
      return false;
    }

    return true;
  }

  // Enhanced session validation with proper expiration
  validateSession() {
    return async (req, res, next) => {
      try {
        const sessionId = req.headers['x-session-id'];
        
        if (!sessionId) {
          return res.status(401).json({
            error: 'Session required',
            message: 'X-Session-ID header is required'
          });
        }

        if (!this.redis) {
          if (this.logger && typeof this.logger.warn === 'function') {
            this.logger.warn('Session validation disabled - Redis not available');
          } else {
            console.warn('Session validation disabled - Redis not available');
          }
          return res.status(503).json({
            error: 'Service unavailable',
            message: 'Session validation temporarily unavailable'
          });
        }

        const sessionKey = `session:${sessionId}`;
        const sessionData = await this.redis.get(sessionKey);

        if (!sessionData) {
          this.logger.logSecurity('Invalid Session', null, {
            sessionId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl
          });

          return res.status(401).json({
            error: 'Invalid session',
            message: 'Session not found or has expired'
          });
        }

        const session = JSON.parse(sessionData);
        
        // Check session expiration
        const now = Date.now();
        if (session.expiresAt && now > session.expiresAt) {
          await this.redis.del(sessionKey);
          
          return res.status(401).json({
            error: 'Session expired',
            message: 'Your session has expired, please login again'
          });
        }

        // Check if session is for same IP (optional security measure)
        if (session.ip && session.ip !== req.ip) {
          this.logger.logSecurity('Session IP Mismatch', session.userId, {
            sessionId,
            originalIp: session.ip,
            currentIp: req.ip,
            userAgent: req.get('User-Agent')
          });

          return res.status(401).json({
            error: 'Session invalid',
            message: 'Session IP address mismatch detected'
          });
        }

        // Update last activity
        session.lastActivity = now;
        await this.redis.setEx(sessionKey, 
          Math.ceil((session.expiresAt - now) / 1000), 
          JSON.stringify(session)
        );

        req.sessionId = sessionId;
        req.session = session;

        this.logger.logAuth('Session Validated', session.userId, {
          sessionId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.originalUrl
        });

        next();

      } catch (error) {
        this.logger.error('Session validation error', error.message, {
          ip: req.ip,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Internal server error',
          message: 'Session validation failed'
        });
      }
    };
  }

  // CORS middleware
  cors(options = {}) {
    return (req, res, next) => {
      const config = this.config.getCORSConfig();
      
      // Set CORS headers
      res.header('Access-Control-Allow-Origin', options.origin || config.origin);
      res.header('Access-Control-Allow-Methods', config.methods.join(', '));
      res.header('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
      res.header('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
      
      if (config.credentials) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      next();
    };
  }
}

// Error logging middleware
function errorLogger() {
  return (req, res, next) => {
    // Use console since loggerService might not be available in all contexts
    console.error('Request Error', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: req.error || 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  };
}

// Singleton instance
const authMiddleware = new AuthMiddleware();

module.exports = {
  AuthMiddleware,
  authMiddleware,
  errorLogger
};