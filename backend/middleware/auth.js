const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { configService } = require('../services/config');
const { loggerService } = require('../services/logger');
const { rateLimitService } = require('../services/rateLimitService');
const { redisConnectionPool } = require('../services/redisConnectionPool');
const { databaseService } = require('../services/database');

class AuthMiddleware {
  constructor() {
    // FIX: Don't store reference in constructor to avoid stale reference
    // this.prisma = databaseService.getClient();
    this.config = configService;
    this.logger = loggerService;
    // SECURITY FIX: Use Redis for token blacklist instead of in-memory Set
    // This provides persistence across server restarts and automatic TTL-based expiration
    this.tokenBlacklistPrefix = 'token_blacklist:';
    this.tokenBlacklistTTL = 24 * 60 * 60; // 24 hours in seconds
  }

  // Generate JWT token
  generateToken(payload) {
    const jwtSecret = this.config.get('JWT_SECRET');
    const jwtExpiry = this.config.get('JWT_EXPIRY') || '24h';
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    return jwt.sign(payload, jwtSecret, { 
      expiresIn: jwtExpiry,
      issuer: 'smart-ecommerce-api',
      audience: 'smart-ecommerce-clients'
    });
  }

  // Verify JWT token
  async verifyToken(token) {
    console.log('[AUTH MIDDLEWARE] Token verification attempt:', {
      tokenLength: token?.length,
      tokenPreview: token?.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });
    
    try {
      const jwtSecret = this.config.get('JWT_SECRET');
      
      if (!jwtSecret) {
        console.error('[AUTH MIDDLEWARE] JWT_SECRET is not configured');
        throw new Error('JWT_SECRET is not configured');
      }
      
      // SECURITY FIX: Check if token is blacklisted in Redis
      // Using Redis provides persistence and automatic expiration
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        console.error('[AUTH MIDDLEWARE] Token is blacklisted');
        throw new Error('Token has been revoked');
      }
      
      const decoded = jwt.verify(token, jwtSecret, {
        issuer: 'smart-ecommerce-api',
        audience: 'smart-ecommerce-clients'
      });
      
      console.log('[AUTH MIDDLEWARE] Token verified successfully:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        exp: decoded.exp,
        iat: decoded.iat
      });
      
      return decoded;
      
    } catch (error) {
      console.error('[AUTH MIDDLEWARE] Token verification failed:', {
        error: error.message,
        errorName: error.name,
        tokenLength: token?.length,
        timestamp: new Date().toISOString(),
        decodedPayload: error.name === 'JsonWebTokenError' ? null : jwt.decode(token),
        jwtSecretSet: !!this.config.get('JWT_SECRET')
      });
      
      // Re-throw the error to be handled by the calling middleware
      throw error;
    }
  }

  // Check if token is blacklisted in Redis
  async isTokenBlacklisted(token) {
    try {
      const redis = redisConnectionPool.getClient('tokenBlacklist');
      if (!redis) {
        // Fallback: Log warning if Redis is not available
        this.logger.warn('Redis not available for token blacklist check');
        return false;
      }
      const key = this.tokenBlacklistPrefix + this.getTokenHash(token);
      
      // Add timeout to prevent hanging - use Promise.race for 5-second timeout
      const result = await Promise.race([
        redis.get(key),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 5000)
        )
      ]);
      
      return result !== null;
    } catch (error) {
      this.logger.error('Error checking token blacklist', error);
      return false; // Allow request to proceed if Redis fails or times out
    }
  }

  // Add token to blacklist in Redis with TTL
  async blacklistToken(token) {
    try {
      const redis = redisConnectionPool.getClient('tokenBlacklist');
      if (!redis) {
        // Fallback: Log warning if Redis is not available
        this.logger.warn('Redis not available for token blacklist, token will not be blacklisted');
        return;
      }
      
      // Decode token to get expiration time
      let ttl = this.tokenBlacklistTTL;
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
          const now = Math.floor(Date.now() / 1000);
          ttl = decoded.exp - now;
          if (ttl <= 0) {
            ttl = this.tokenBlacklistTTL; // Token already expired, use default TTL
          }
        }
      } catch (error) {
        // Use default TTL if we can't decode the token
      }
      
      const key = this.tokenBlacklistPrefix + this.getTokenHash(token);
      await redis.setEx(key, ttl, '1');
      this.logger.info('Token added to blacklist', {
        token: token.substring(0, 20) + '...',
        ttl
      });
    } catch (error) {
      this.logger.error('Error adding token to blacklist', error);
    }
  }

  // Get hash of token for storage (to save space)
  getTokenHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Extract token from request
  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    this.logger.debug('Extracting token', {
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader ? authHeader.substring(0, 30) + '...' : 'none'
    });
    
    if (!authHeader) {
      return null;
    }
    
    const parts = authHeader.split(' ');
    
    this.logger.debug('Token parts', {
      partsCount: parts.length,
      prefix: parts[0],
      hasToken: parts.length > 1
    });
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger.warn('Invalid authorization header format', {
        partsCount: parts.length,
        prefix: parts[0]
      });
      return null;
    }
    
    this.logger.debug('Token extracted successfully', {
      tokenLength: parts[1].length,
      tokenPrefix: parts[1].substring(0, 20) + '...'
    });
    
    return parts[1];
  }

  // Authentication middleware
  authenticate() {
    return async (req, res, next) => {
      try {
        // FIX: Get fresh client on each request
        const prisma = databaseService.getClient();

        // FIX: Validate client before use
        if (!prisma) {
          this.logger.error('[AUTH] Prisma client is not available');
          return res.status(500).json({
            error: 'Database connection error',
            message: 'Authentication service unavailable'
          });
        }

        // Log incoming request
        this.logger.info('Authentication attempt', {
          method: req.method,
          path: req.path,
          hasAuthHeader: !!req.headers.authorization,
          authHeaderPrefix: req.headers.authorization ? req.headers.authorization.substring(0, 10) : 'none'
        });
        
        const token = this.extractToken(req);
        
        if (!token) {
          this.logger.warn('No token provided', {
            method: req.method,
            path: req.path,
            headers: Object.keys(req.headers)
          });
          return res.status(401).json({
            error: 'Authentication required',
            message: 'No token provided'
          });
        }
        
        this.logger.info('Token extracted', {
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...'
        });
        
        const decoded = await this.verifyToken(token);
        
        this.logger.info('Token verified', {
          userId: decoded.userId,
          exp: decoded.exp
        });
        
        // Fetch user from database
        let user;
        // DIAGNOSTIC LOGGING: Track user lookup start time (declare outside try block for error handling)
        const userLookupStartTime = Date.now();

        try {
          // FIX 1: Extract userId from multiple possible field names to handle different JWT payload structures
          // NextAuth and other auth providers may use different field names (sub, id, user_id, userId)
          const userId = decoded.userId || decoded.sub || decoded.id || decoded.user_id;

          if (!userId) {
            this.logger.error('JWT token missing user identifier', {
              availableFields: Object.keys(decoded),
              decoded: decoded
            });
            return res.status(401).json({
              success: false,
              error: 'Invalid token: missing user identifier'
            });
          }

          this.logger.info('[USER LOOKUP DIAGNOSTIC] Starting user lookup', {
            userId,
            method: req.method,
            path: req.path,
            timestamp: new Date().toISOString()
          });

          // FIX: Use fresh prisma variable instead of this.prisma
          user = await Promise.race([
            prisma.users.findUnique({
              where: { id: userId },
              select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true, // Changed from isActive to status
                emailVerified: true, // Changed from isEmailVerified to emailVerified
                phoneVerified: true, // Changed from isPhoneVerified to phoneVerified
                createdAt: true,
                updatedAt: true
              }
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('User lookup timeout after 5000ms')), 5000)
            )
          ]);

          // DIAGNOSTIC LOGGING: Track user lookup completion time
          const userLookupDuration = Date.now() - userLookupStartTime;
          this.logger.info('[USER LOOKUP DIAGNOSTIC] User lookup completed', {
            userId,
            userFound: !!user,
            duration: userLookupDuration,
            method: req.method,
            path: req.path,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          // DIAGNOSTIC LOGGING: Track user lookup failure
          const userLookupDuration = Date.now() - userLookupStartTime;
          this.logger.error('[USER LOOKUP DIAGNOSTIC] Database error during user lookup', {
            userId: decoded.userId,
            error: error.message,
            errorType: error.name,
            isTimeout: error.message.includes('timeout'),
            duration: userLookupDuration,
            method: req.method,
            path: req.path,
            timestamp: new Date().toISOString()
          });
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'User lookup failed',
            diagnostic: process.env.NODE_ENV === 'development' ? {
              error: error.message,
              duration: userLookupDuration
            } : undefined
          });
        }
        
        if (!user) {
          this.logger.warn('User not found', { userId: decoded.userId });
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'User not found'
          });
        }

        // DIAGNOSTIC: Log the actual status value from database
        this.logger.info('User status check', {
          userId: decoded.userId,
          email: user.email,
          status: user.status,
          statusType: typeof user.status,
          comparingWith: 'active',
          comparisonResult: user.status !== 'active'
        });

        if (user.status !== 'active') {
          this.logger.warn('Account deactivated', { userId: decoded.userId, status: user.status });
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'Account is deactivated'
          });
        }
        
        // Attach user and token to request
        req.user = user;
        req.token = token;
        
        // Fetch RBAC roles from user_roles table
        const { rbacUtils } = require('../utils/rbacUtils');
        try {
          const rbacRoles = await Promise.race([
            rbacUtils.getUserRoles(user.id),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('RBAC timeout after 5000ms')), 5000)
            )
          ]);
          req.user.rbacRoles = rbacRoles;
          
          // Set highest level role as primary RBAC role
          if (rbacRoles.length > 0) {
            const maxLevelRole = rbacRoles.reduce((max, role) =>
              role.hierarchy_level > max.hierarchy_level ? role : max
            , rbacRoles[0]);
            req.user.rbacRole = maxLevelRole.role_name;
            req.user.rbacRoleLevel = maxLevelRole.hierarchy_level;
          }
          
          this.logger.info('RBAC roles fetched', {
            userId: user.id,
            rbacRoles: rbacRoles.map(r => r.role_name),
            primaryRole: req.user.rbacRole,
            roleLevel: req.user.rbacRoleLevel
          });
        } catch (error) {
          this.logger.warn('RBAC role fetch timed out or failed, using empty roles:', error.message);
          req.user.rbacRoles = [];
          req.user.rbacRole = null;
          req.user.rbacRoleLevel = 0;
        }
        
        this.logger.info('Authentication successful', {
          userId: user.id,
          email: user.email,
          legacyRole: user.role,
          rbacRole: req.user.rbacRole
        });
        
        // Preserve req.body for downstream handlers
        const originalBody = req.body;

        // After authentication is successful, before calling next()
        console.log('[AUTH DEBUG] User authenticated successfully:', {
          userId: req.user?.id,
          email: req.user?.email,
          role: req.user?.role,
          timestamp: new Date().toISOString()
        });

        next();
        
      } catch (error) {
        console.error('[AUTH ERROR] Authentication failed:', {
          error: error.message,
          stack: error.stack
        });

        this.logger.error('Authentication error', {
          message: error.message,
          stack: error.stack,
          method: req.method,
          path: req.path
        });
        
        return res.status(401).json({
          error: 'Authentication failed',
          message: error.message
        });
      }
    };
  }

  // Optional authentication middleware
  optional() {
    return async (req, res, next) => {
      try {
        // FIX: Get fresh client on each request
        const prisma = databaseService.getClient();

        const token = this.extractToken(req);
    
    if (token) {
      const decoded = await this.verifyToken(token);
      
      // Fetch user from database
          let user;
          try {
            // FIX 1: Extract userId from multiple possible field names to handle different JWT payload structures
            // NextAuth and other auth providers may use different field names (sub, id, user_id, userId)
            const userId = decoded.userId || decoded.sub || decoded.id || decoded.user_id;

            if (!userId) {
              this.logger.warn('Optional auth - JWT token missing user identifier', {
                availableFields: Object.keys(decoded)
              });
              // For optional auth, continue without user
              user = null;
            } else {
              user = await prisma.users.findUnique({
                where: { id: userId },
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  status: true, // Changed from isActive to status
                  emailVerified: true, // Changed from isEmailVerified to emailVerified
                  phoneVerified: true, // Changed from isPhoneVerified to phoneVerified
                  createdAt: true,
                  updatedAt: true
                }
              });
            }
          } catch (error) {
            this.logger.warn('Optional auth - Database error during user lookup', {
              userId: decoded.userId,
              error: error.message
            });
            // For optional auth, continue without user on database error
            user = null;
          }
          
          // DIAGNOSTIC: Log the actual status value from database
          if (user) {
            this.logger.info('Optional auth - User status check', {
              userId: decoded.userId,
              email: user.email,
              status: user.status,
              statusType: typeof user.status,
              comparingWith: 'active',
              comparisonResult: user.status === 'active'
            });
          }

          if (user && user.status === 'active') {
            req.user = user;
            req.token = token;
          }
        }
        
        next();

      } catch (error) {
        // For optional auth, we don't return error, just continue without user
        this.logger.debug('Optional authentication failed', error.message);
        next();
      }
    };
  }

  // Role-based authorization middleware
  authorize(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }
      
      const userRole = req.user.role;
      const hasRole = roles.includes(userRole);
      
      if (!hasRole) {
        return res.status(403).json({
          error: 'Authorization failed',
          message: 'Insufficient permissions'
        });
      }
      
      next();
    };
  }

  // Resource ownership middleware
  requireOwnership(resourceType) {
    return async (req, res, next) => {
      try {
        // FIX: Get fresh client on each request
        const prisma = databaseService.getClient();

        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }
        
        const resourceId = req.params.id;
        const userId = req.user.id;
        
        let isOwner = false;
        
        switch (resourceType) {
          case 'user':
            isOwner = resourceId === userId;
            break;
            
          case 'order':
            let order;
            try {
              order = await prisma.orders.findUnique({
                where: { id: resourceId },
                select: { userId: true }
              });
            } catch (error) {
              this.logger.error('Database error during order ownership check', {
                resourceId,
                userId,
                error: error.message
              });
              return res.status(500).json({
                error: 'Authorization check failed',
                message: 'Failed to verify order ownership'
              });
            }
            isOwner = order && order.userId === userId;
            break;
            
          case 'cart':
            let cart;
            try {
              cart = await prisma.carts.findUnique({
                where: { id: resourceId },
                select: { userId: true }
              });
            } catch (error) {
              this.logger.error('Database error during cart ownership check', {
                resourceId,
                userId,
                error: error.message
              });
              return res.status(500).json({
                error: 'Authorization check failed',
                message: 'Failed to verify cart ownership'
              });
            }
            isOwner = cart && cart.userId === userId;
            break;
            
          case 'wishlist':
            let wishlist;
            try {
              wishlist = await prisma.wishlists.findUnique({
                where: { id: resourceId },
                select: { userId: true }
              });
            } catch (error) {
              this.logger.error('Database error during wishlist ownership check', {
                resourceId,
                userId,
                error: error.message
              });
              return res.status(500).json({
                error: 'Authorization check failed',
                message: 'Failed to verify wishlist ownership'
              });
            }
            isOwner = wishlist && wishlist.userId === userId;
            break;
            
          case 'review':
            let review;
            try {
              review = await prisma.reviews.findUnique({
                where: { id: resourceId },
                select: { userId: true }
              });
            } catch (error) {
              this.logger.error('Database error during review ownership check', {
                resourceId,
                userId,
                error: error.message
              });
              return res.status(500).json({
                error: 'Authorization check failed',
                message: 'Failed to verify review ownership'
              });
            }
            isOwner = review && review.userId === userId;
            break;
            
          default:
            return res.status(400).json({
              error: 'Invalid resource type',
              message: 'Resource type not supported'
            });
        }
        
        if (!isOwner) {
          return res.status(403).json({
            error: 'Authorization failed',
            message: 'You can only access your own resources'
          });
        }
        
        next();
        
      } catch (error) {
        this.logger.error('Ownership check error', error.message);
        
        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Failed to verify resource ownership'
        });
      }
    };
  }

  // Rate limiting middleware
  rateLimit(options = {}) {
    // Use the new rate limiting service with Redis fallback
    return rateLimitService.createRateLimit(options);
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

  // Validate email verification
  requireEmailVerification() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }
      
      if (!req.user.emailVerified) {
        return res.status(403).json({
          error: 'Email verification required',
          message: 'Please verify your email address'
        });
      }
      
      next();
    };
  }

  // Validate phone verification
  requirePhoneVerification() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }
      
      if (!req.user.phoneVerified) {
        return res.status(403).json({
          error: 'Phone verification required',
          message: 'Please verify your phone number'
        });
      }
      
      next();
    };
  }

  // API key authentication middleware
  authenticateApiKey() {
    return async (req, res, next) => {
      try {
        // FIX: Get fresh client on each request
        const prisma = databaseService.getClient();

        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
          return res.status(401).json({
            error: 'API key required',
            message: 'Please provide an API key'
          });
        }
        
        // Find API key in database
        let keyRecord;
        try {
          keyRecord = await prisma.api_keys.findUnique({
            where: { key: apiKey },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  status: true // Changed from isActive to status
                }
              }
            }
          });
        } catch (error) {
          this.logger.error('Database error during API key lookup', {
            apiKey: apiKey.substring(0, 10) + '...',
            error: error.message
          });
          return res.status(500).json({
            error: 'Authentication failed',
            message: 'Failed to verify API key'
          });
        }
        
        if (!keyRecord) {
          return res.status(401).json({
            error: 'Invalid API key',
            message: 'The provided API key is not valid'
          });
        }
        
        if (!keyRecord.isActive) {
          return res.status(401).json({
            error: 'API key deactivated',
            message: 'The provided API key has been deactivated'
          });
        }

        // DIAGNOSTIC: Log the actual status value from database
        this.logger.info('API key auth - User status check', {
          userId: keyRecord.user.id,
          email: keyRecord.user.email,
          status: keyRecord.user.status,
          statusType: typeof keyRecord.user.status,
          comparingWith: 'active',
          comparisonResult: keyRecord.user.status !== 'active'
        });

        if (keyRecord.user.status !== 'active') {
          return res.status(401).json({
            error: 'Account deactivated',
            message: 'The associated account has been deactivated'
          });
        }
        
        // Check rate limits for API key
        if (keyRecord.rateLimitPerHour) {
          const now = Date.now();
          const oneHourAgo = now - (60 * 60 * 1000);
          
          const requestCount = await prisma.api_requests.count({
            where: {
              apiKeyId: keyRecord.id,
              timestamp: {
                gte: new Date(oneHourAgo)
              }
            }
          });
          
          if (requestCount >= keyRecord.rateLimitPerHour) {
            return res.status(429).json({
              error: 'API rate limit exceeded',
              message: 'Too many requests with this API key'
            });
          }
          
          // Log API request
          await prisma.api_requests.create({
            data: {
              apiKeyId: keyRecord.id,
              endpoint: req.path,
              method: req.method,
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              timestamp: new Date()
            }
          });
        }
        
        // Attach user and API key info to request
        req.user = keyRecord.user;
        req.apiKey = keyRecord;
        
        next();
        
      } catch (error) {
        this.logger.error('API key authentication error', error.message);
        
        return res.status(500).json({
          error: 'Authentication failed',
          message: 'Failed to authenticate with API key'
        });
      }
    };
  }

  // CORS middleware helper
  cors(options = {}) {
    const defaults = {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://smarttechnologies-bd.com'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    };
    
    const config = { ...defaults, ...options };
    
    return (req, res, next) => {
      const origin = req.headers.origin;
      
      if (config.origin.includes(origin) || config.origin === '*') {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      res.setHeader('Access-Control-Allow-Methods', config.methods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
      res.setHeader('Access-Control-Allow-Credentials', config.credentials);
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      next();
    };
  }

  // Security headers middleware
  securityHeaders() {
    return (req, res, next) => {
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Enable XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Force HTTPS in production
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }
      
      // Content Security Policy
      res.setHeader('Content-Security-Policy', "default-src 'self'");
      
      next();
    };
  }

  // Error logger middleware
  errorLogger() {
    return (err, req, res, next) => {
      const errorId = this.generateErrorId();
      
      this.logger.error('Application Error', {
        errorId,
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
      
      // Always call next(err) to pass errors to global error handler
      // This ensures errors are logged and handled consistently
      next(err);
    };
  }

  // Generate unique error ID
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Admin-only middleware
  adminOnly() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }
      
      // Check both legacy role and RBAC role
      const hasLegacyAdminRole = req.user.role?.toUpperCase() === 'ADMIN';
      const hasRbacAdminRole = req.user.rbacRole?.toLowerCase() === 'admin';
      
      if (!hasLegacyAdminRole && !hasRbacAdminRole) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Admin access required'
        });
      }
      
      next();
    };
  }

  // Manager or Admin middleware
  managerOrAdmin() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }

      // Case-insensitive role check
      const userRole = req.user.role?.toUpperCase();
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Manager or Admin access required'
        });
      }

      next();
    };
  }

  // Self or Admin middleware
  // Allows access if the authenticated user is an admin or accessing their own resources
  selfOrAdmin(userId) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }

      // Case-insensitive role check
      const userRole = req.user.role?.toUpperCase();
      if (userRole !== 'ADMIN' && req.user.id !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources'
        });
      }

      next();
    };
  }
}

// Singleton instance
const authMiddleware = new AuthMiddleware();

module.exports = {
  AuthMiddleware,
  authMiddleware,
  authenticate: authMiddleware.authenticate.bind(authMiddleware),
  authorize: authMiddleware.authorize.bind(authMiddleware)
};