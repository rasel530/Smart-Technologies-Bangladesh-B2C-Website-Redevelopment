const { PrismaClient } = require('@prisma/client');
const configService = require('../services/config');
const loggerService = require('../services/logger');

class EmailVerificationMiddleware {
  constructor() {
    this.config = configService;
    this.logger = loggerService;
    this.prisma = new PrismaClient();
  }

  // Middleware to check if user's email is verified
  requireEmailVerification() {
    return async (req, res, next) => {
      try {
        // Skip verification if testing mode or email verification is disabled
        if (configService.isTestingMode() || configService.isEmailVerificationDisabled()) {
          req.emailVerified = true;
          return next();
        }

        // If no user is attached (not authenticated), skip verification
        if (!req.user || !req.userId) {
          return next();
        }

        // Get user from database to check email verification status
        const user = await this.prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            status: true
          }
        });

        if (!user) {
          return res.status(401).json({
            error: 'User not found',
            message: 'Authenticated user not found in database'
          });
        }

        // Check if email is verified
        if (!user.emailVerified || user.status === 'PENDING') {
          this.logger.logSecurity('Unverified Email Access Attempt', req.userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl,
            email: user.email
          });

          return res.status(403).json({
            error: 'Email not verified',
            message: 'Please verify your email address to access this resource',
            requiresEmailVerification: true
          });
        }

        // User is verified, proceed
        req.emailVerified = true;
        next();

      } catch (error) {
        this.logger.error('Email verification middleware error', error.message, {
          userId: req.userId,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Verification check failed',
          message: 'Unable to verify email status'
        });
      }
    };
  }

  // Middleware to check email verification for specific routes
  requireEmailVerificationFor(routes = []) {
    return async (req, res, next) => {
      try {
        // Check if current path requires email verification
        const currentPath = req.originalUrl;
        const requiresVerification = routes.some(route => 
          currentPath.includes(route) || currentPath.match(new RegExp(route))
        );

        if (!requiresVerification) {
          return next();
        }

        // If no user is attached (not authenticated), skip verification
        if (!req.user || !req.userId) {
          return next();
        }

        // Get user from database
        const user = await this.prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            status: true
          }
        });

        if (!user) {
          return res.status(401).json({
            error: 'User not found',
            message: 'Authenticated user not found in database'
          });
        }

        // Check if email is verified
        if (!user.emailVerified || user.status === 'PENDING') {
          this.logger.logSecurity('Protected Route Access - Unverified Email', req.userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: currentPath,
            email: user.email,
            requiredRoutes: routes
          });

          return res.status(403).json({
            error: 'Email verification required',
            message: 'Please verify your email address to access this resource',
            requiresEmailVerification: true,
            route: currentPath
          });
        }

        // User is verified, proceed
        req.emailVerified = true;
        next();

      } catch (error) {
        this.logger.error('Email verification middleware error', error.message, {
          userId: req.userId,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Verification check failed',
          message: 'Unable to verify email status'
        });
      }
    };
  }

  // Middleware to check email verification with optional bypass for admin users
  requireEmailVerificationOrAdmin() {
    return async (req, res, next) => {
      try {
        // If no user is attached (not authenticated), skip verification
        if (!req.user || !req.userId) {
          return next();
        }

        // Admin users can bypass email verification
        if (req.userRole === 'ADMIN') {
          req.emailVerified = true;
          return next();
        }

        // Get user from database
        const user = await this.prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            status: true,
            role: true
          }
        });

        if (!user) {
          return res.status(401).json({
            error: 'User not found',
            message: 'Authenticated user not found in database'
          });
        }

        // Check if email is verified for non-admin users
        if (!user.emailVerified || user.status === 'PENDING') {
          this.logger.logSecurity('Admin Bypass Attempt - Unverified Email', req.userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl,
            email: user.email,
            userRole: user.role
          });

          return res.status(403).json({
            error: 'Email not verified',
            message: 'Please verify your email address to access this resource',
            requiresEmailVerification: true
          });
        }

        // User is verified, proceed
        req.emailVerified = true;
        next();

      } catch (error) {
        this.logger.error('Email verification middleware error', error.message, {
          userId: req.userId,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Verification check failed',
          message: 'Unable to verify email status'
        });
      }
    };
  }

  // Helper method to check if user email is verified
  async isEmailVerified(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          emailVerified: true,
          status: true
        }
      });

      return user && user.emailVerified && user.status !== 'PENDING';
    } catch (error) {
      this.logger.error('Error checking email verification status', error.message, {
        userId
      });
      return false;
    }
  }

  // Helper method to get user verification status
  async getUserVerificationStatus(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          status: true,
          createdAt: true
        }
      });

      if (!user) {
        return {
          verified: false,
          status: 'NOT_FOUND',
          message: 'User not found'
        };
      }

      return {
        verified: !!user.emailVerified && user.status !== 'PENDING',
        status: user.status,
        emailVerified: user.emailVerified,
        email: user.email,
        createdAt: user.createdAt
      };

    } catch (error) {
      this.logger.error('Error getting user verification status', error.message, {
        userId
      });
      return {
        verified: false,
        status: 'ERROR',
        message: 'Unable to check verification status'
      };
    }
  }
}

// Singleton instance
const emailVerificationMiddleware = new EmailVerificationMiddleware();

module.exports = {
  EmailVerificationMiddleware,
  emailVerificationMiddleware
};