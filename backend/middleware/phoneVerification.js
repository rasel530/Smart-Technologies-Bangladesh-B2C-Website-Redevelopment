const { PrismaClient } = require('@prisma/client');
const configService = require('../services/config');
const loggerService = require('../services/logger');

class PhoneVerificationMiddleware {
  constructor() {
    this.config = configService;
    this.logger = loggerService;
    this.prisma = new PrismaClient();
  }

  // Middleware to check if user's phone is verified
  requirePhoneVerification() {
    return async (req, res, next) => {
      try {
        // If no user is attached (not authenticated), skip verification
        if (!req.user || !req.userId) {
          return next();
        }

        // Get user from database to check phone verification status
        const user = await this.prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            phone: true,
            phoneVerified: true,
            status: true
          }
        });

        if (!user) {
          return res.status(401).json({
            error: 'User not found',
            message: 'Authenticated user not found in database'
          });
        }

        // Check if phone is verified
        if (!user.phoneVerified || user.status === 'PENDING') {
          this.logger.logSecurity('Unverified Phone Access Attempt', req.userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl,
            phone: user.phone
          });

          return res.status(403).json({
            error: 'Phone not verified',
            message: 'Please verify your phone number to access this resource',
            requiresPhoneVerification: true
          });
        }

        // User is verified, proceed
        req.phoneVerified = true;
        next();

      } catch (error) {
        this.logger.error('Phone verification middleware error', error.message, {
          userId: req.userId,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Verification check failed',
          message: 'Unable to verify phone status'
        });
      }
    };
  }

  // Middleware to check phone verification for specific routes
  requirePhoneVerificationFor(routes = []) {
    return async (req, res, next) => {
      try {
        // Check if current path requires phone verification
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
            phone: true,
            phoneVerified: true,
            status: true
          }
        });

        if (!user) {
          return res.status(401).json({
            error: 'User not found',
            message: 'Authenticated user not found in database'
          });
        }

        // Check if phone is verified
        if (!user.phoneVerified || user.status === 'PENDING') {
          this.logger.logSecurity('Protected Route Access - Unverified Phone', req.userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: currentPath,
            phone: user.phone,
            requiredRoutes: routes
          });

          return res.status(403).json({
            error: 'Phone verification required',
            message: 'Please verify your phone number to access this resource',
            requiresPhoneVerification: true,
            route: currentPath
          });
        }

        // User is verified, proceed
        req.phoneVerified = true;
        next();

      } catch (error) {
        this.logger.error('Phone verification middleware error', error.message, {
          userId: req.userId,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Verification check failed',
          message: 'Unable to verify phone status'
        });
      }
    };
  }

  // Middleware to check phone verification with optional bypass for admin users
  requirePhoneVerificationOrAdmin() {
    return async (req, res, next) => {
      try {
        // If no user is attached (not authenticated), skip verification
        if (!req.user || !req.userId) {
          return next();
        }

        // Admin users can bypass phone verification
        if (req.userRole === 'ADMIN') {
          req.phoneVerified = true;
          return next();
        }

        // Get user from database
        const user = await this.prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            phone: true,
            phoneVerified: true,
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

        // Check if phone is verified for non-admin users
        if (!user.phoneVerified || user.status === 'PENDING') {
          this.logger.logSecurity('Admin Bypass Attempt - Unverified Phone', req.userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl,
            phone: user.phone,
            userRole: user.role
          });

          return res.status(403).json({
            error: 'Phone not verified',
            message: 'Please verify your phone number to access this resource',
            requiresPhoneVerification: true
          });
        }

        // User is verified, proceed
        req.phoneVerified = true;
        next();

      } catch (error) {
        this.logger.error('Phone verification middleware error', error.message, {
          userId: req.userId,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Verification check failed',
          message: 'Unable to verify phone status'
        });
      }
    };
  }

  // Middleware to check either email or phone verification
  requireAnyVerification() {
    return async (req, res, next) => {
      try {
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
            phone: true,
            emailVerified: true,
            phoneVerified: true,
            status: true
          }
        });

        if (!user) {
          return res.status(401).json({
            error: 'User not found',
            message: 'Authenticated user not found in database'
          });
        }

        // Check if either email or phone is verified
        const emailVerified = user.emailVerified && user.status !== 'PENDING';
        const phoneVerified = user.phoneVerified && user.status !== 'PENDING';

        if (!emailVerified && !phoneVerified) {
          this.logger.logSecurity('Unverified User Access Attempt', req.userId, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.originalUrl,
            email: user.email,
            phone: user.phone
          });

          return res.status(403).json({
            error: 'Account not verified',
            message: 'Please verify your email or phone number to access this resource',
            requiresEmailVerification: !emailVerified,
            requiresPhoneVerification: !phoneVerified
          });
        }

        // User is verified, proceed
        req.emailVerified = emailVerified;
        req.phoneVerified = phoneVerified;
        next();

      } catch (error) {
        this.logger.error('Verification middleware error', error.message, {
          userId: req.userId,
          path: req.originalUrl
        });

        return res.status(500).json({
          error: 'Verification check failed',
          message: 'Unable to verify account status'
        });
      }
    };
  }

  // Helper method to check if user phone is verified
  async isPhoneVerified(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phoneVerified: true,
          status: true
        }
      });

      return user && user.phoneVerified && user.status !== 'PENDING';
    } catch (error) {
      this.logger.error('Error checking phone verification status', error.message, {
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
          phone: true,
          emailVerified: true,
          phoneVerified: true,
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

      const emailVerified = !!user.emailVerified && user.status !== 'PENDING';
      const phoneVerified = !!user.phoneVerified && user.status !== 'PENDING';

      return {
        verified: emailVerified || phoneVerified,
        status: user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        email: user.email,
        phone: user.phone,
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
const phoneVerificationMiddleware = new PhoneVerificationMiddleware();

module.exports = {
  PhoneVerificationMiddleware,
  phoneVerificationMiddleware
};