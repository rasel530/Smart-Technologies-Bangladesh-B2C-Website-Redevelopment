const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { configService } = require('../services/config');
const { loggerService } = require('../services/logger');
const { rateLimitService } = require('../services/rateLimitService');

class AuthMiddleware {
  constructor() {
    this.prisma = new PrismaClient();
    this.config = configService;
    this.logger = loggerService;
    this.tokenBlacklist = new Set();
    this.initializeTokenCleanup();
  }

  // Initialize token cleanup interval
  initializeTokenCleanup() {
    // Clean up expired tokens every hour
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
  }

  // Clean up expired tokens from blacklist
  cleanupExpiredTokens() {
    const now = Date.now();
    const expiredTokens = [];
    
    for (const token of this.tokenBlacklist) {
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp * 1000 < now) {
          expiredTokens.push(token);
        }
      } catch (error) {
        expiredTokens.push(token);
      }
    }
    
    expiredTokens.forEach(token => {
      this.tokenBlacklist.delete(token);
    });
    
    if (expiredTokens.length > 0) {
      this.logger.info(`Cleaned up ${expiredTokens.length} expired tokens from blacklist`);
    }
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
  verifyToken(token) {
    try {
      const jwtSecret = this.config.get('JWT_SECRET');
      
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
      }
      
      // Check if token is blacklisted
      if (this.tokenBlacklist.has(token)) {
        throw new Error('Token has been revoked');
      }
      
      const decoded = jwt.verify(token, jwtSecret, {
        issuer: 'smart-ecommerce-api',
        audience: 'smart-ecommerce-clients'
      });
      
      return decoded;
      
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else {
        throw error;
      }
    }
  }

  // Add token to blacklist
  blacklistToken(token) {
    this.tokenBlacklist.add(token);
    this.logger.info('Token added to blacklist', { token: token.substring(0, 20) + '...' });
  }

  // Extract token from request
  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return null;
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  // Authentication middleware
  authenticate() {
    return async (req, res, next) => {
      try {
        const token = this.extractToken(req);
        
        if (!token) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'No token provided'
          });
        }
        
        const decoded = this.verifyToken(token);
        
        // Fetch user from database
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        if (!user) {
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'User not found'
          });
        }
        
        if (!user.isActive) {
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'Account is deactivated'
          });
        }
        
        // Attach user and token to request
        req.user = user;
        req.token = token;
        
        next();
        
      } catch (error) {
        this.logger.error('Authentication error', error.message);
        
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
        const token = this.extractToken(req);
        
        if (token) {
          const decoded = this.verifyToken(token);
          
          // Fetch user from database
          const user = await this.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              email: true,
              phone: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              createdAt: true,
              updatedAt: true
            }
          });
          
          if (user && user.isActive) {
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
            const order = await this.prisma.order.findUnique({
              where: { id: resourceId },
              select: { userId: true }
            });
            isOwner = order && order.userId === userId;
            break;
            
          case 'cart':
            const cart = await this.prisma.cart.findUnique({
              where: { id: resourceId },
              select: { userId: true }
            });
            isOwner = cart && cart.userId === userId;
            break;
            
          case 'wishlist':
            const wishlist = await this.prisma.wishlist.findUnique({
              where: { id: resourceId },
              select: { userId: true }
            });
            isOwner = wishlist && wishlist.userId === userId;
            break;
            
          case 'review':
            const review = await this.prisma.review.findUnique({
              where: { id: resourceId },
              select: { userId: true }
            });
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
      
      if (!req.user.isEmailVerified) {
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
      
      if (!req.user.isPhoneVerified) {
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
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
          return res.status(401).json({
            error: 'API key required',
            message: 'Please provide an API key'
          });
        }
        
        // Find API key in database
        const keyRecord = await this.prisma.apiKey.findUnique({
          where: { key: apiKey },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true
              }
            }
          }
        });
        
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
        
        if (!keyRecord.user.isActive) {
          return res.status(401).json({
            error: 'Account deactivated',
            message: 'The associated account has been deactivated'
          });
        }
        
        // Check rate limits for API key
        if (keyRecord.rateLimitPerHour) {
          const now = Date.now();
          const oneHourAgo = now - (60 * 60 * 1000);
          
          const requestCount = await this.prisma.apiRequest.count({
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
          await this.prisma.apiRequest.create({
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
      
      // Don't expose error details in production
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: 'Internal server error',
          errorId
        });
      } else {
        next(err);
      }
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
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }
      
      if (req.user.role !== 'ADMIN') {
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
      
      if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Manager or Admin access required'
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
  authMiddleware
};