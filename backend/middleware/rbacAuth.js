const { rbacUtils } = require('../utils/rbacUtils');
const { authMiddleware } = require('./auth');
const { loggerService } = require('../services/logger');

class RBACAuthMiddleware {
  constructor() {
    this.rbacUtils = rbacUtils;
    this.logger = loggerService;
  }

  /**
   * Verify JWT token and attach user to request
   * Uses existing auth middleware for consistency
   */
  authenticate() {
    return authMiddleware.authenticate();
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  optional() {
    return authMiddleware.optional();
  }

  /**
   * Check if user has required role(s)
   * @param {...string} allowedRoles - One or more role names
   * @returns {Function} Express middleware
   */
  requireRole(...allowedRoles) {
    return async (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        // Check if user has any of the required roles (case-insensitive comparison)
        const userRoles = await this.rbacUtils.getUserRoles(req.user.id);
        const userRoleNames = userRoles.map(r => r.role_name.toUpperCase());

        const hasRole = allowedRoles.some(role => userRoleNames.includes(role.toUpperCase()));

        if (!hasRole) {
          this.logger.warn('Role denied', {
            userId: req.user.id,
            userRoles: userRoleNames,
            requiredRoles: allowedRoles,
            path: req.path
          });

          return res.status(403).json({
            error: 'Access denied',
            message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
            requiredRoles: allowedRoles
          });
        }

        req.requiredRoles = allowedRoles;
        next();
      } catch (error) {
        this.logger.error('Role check error', error);
        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Failed to verify roles'
        });
      }
    };
  }

  /**
   * Check if user has required permission
   * @param {string} permission - Permission name (e.g., 'user:read')
   * @returns {Function} Express middleware
   */
  requirePermission(permission) {
    return async (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        // Check if user has the required permission
        const hasPermission = await this.rbacUtils.userHasPermission(req.user.id, permission);

        if (!hasPermission) {
          this.logger.warn('Permission denied', {
            userId: req.user.id,
            requiredPermission: permission,
            path: req.path
          });

          return res.status(403).json({
            error: 'Permission denied',
            message: `You do not have permission to perform this action`,
            requiredPermission: permission
          });
        }

        req.requiredPermission = permission;
        next();
      } catch (error) {
        this.logger.error('Permission check error', error);
        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Failed to verify permissions'
        });
      }
    };
  }

  /**
   * Check if user has any of the required permissions
   * @param {...string} permissions - Array of permission names
   * @returns {Function} Express middleware
   */
  requireAnyPermission(...permissions) {
    return async (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        // Check if user has any of the required permissions
        const hasAnyPermission = await this.rbacUtils.userHasAnyPermission(req.user.id, permissions);

        if (!hasAnyPermission) {
          this.logger.warn('Permission denied', {
            userId: req.user.id,
            requiredPermissions: permissions,
            path: req.path
          });

          return res.status(403).json({
            error: 'Permission denied',
            message: `You do not have permission to perform this action`,
            requiredPermissions: permissions
          });
        }

        req.requiredPermissions = permissions;
        next();
      } catch (error) {
        this.logger.error('Permission check error', error);
        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Failed to verify permissions'
        });
      }
    };
  }

  /**
   * Check if user has all of the required permissions
   * @param {...string} permissions - Array of permission names
   * @returns {Function} Express middleware
   */
  requireAllPermissions(...permissions) {
    return async (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        // Check if user has all of the required permissions
        const hasAllPermissions = await this.rbacUtils.userHasAllPermissions(req.user.id, permissions);

        if (!hasAllPermissions) {
          // Find which permissions are missing
          const missingPermissions = [];
          for (const permission of permissions) {
            const hasPermission = await this.rbacUtils.userHasPermission(req.user.id, permission);
            if (!hasPermission) {
              missingPermissions.push(permission);
            }
          }

          this.logger.warn('Permission denied', {
            userId: req.user.id,
            requiredPermissions: permissions,
            missingPermissions,
            path: req.path
          });

          return res.status(403).json({
            error: 'Permission denied',
            message: `You do not have all required permissions`,
            requiredPermissions: permissions,
            missingPermissions
          });
        }

        req.requiredPermissions = permissions;
        next();
      } catch (error) {
        this.logger.error('Permission check error', error);
        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Failed to verify permissions'
        });
      }
    };
  }

  /**
   * Check if user meets minimum role hierarchy level
   * @param {number} level - Minimum hierarchy level required
   * @returns {Function} Express middleware
   */
  requireMinimumRoleLevel(level) {
    return async (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        // Check if user meets minimum level
        const hasLevel = await this.rbacUtils.userHasMinimumRoleLevel(req.user.id, level);

        if (!hasLevel) {
          const userMaxLevel = await this.rbacUtils.getUserMaxRoleLevel(req.user.id);

          this.logger.warn('Insufficient role level', {
            userId: req.user.id,
            userLevel: userMaxLevel,
            requiredLevel: level,
            path: req.path
          });

          return res.status(403).json({
            error: 'Access denied',
            message: `This action requires a higher role level`,
            requiredLevel: level,
            currentLevel: userMaxLevel
          });
        }

        req.minimumRoleLevel = level;
        next();
      } catch (error) {
        this.logger.error('Role level check error', error);
        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Failed to verify role level'
        });
      }
    };
  }

  /**
   * Check if user can assign target role
   * Based on role hierarchy - assigner must have higher level
   * @param {string} targetRole - Name of role to be assigned
   * @returns {Function} Express middleware
   */
  requireCanAssignRole(targetRole) {
    return async (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        // Check if assigner can assign target role
        const canAssign = await this.rbacUtils.canAssignRole(req.user.id, targetRole);

        if (!canAssign) {
          this.logger.warn('Role assignment denied', {
            assignerId: req.user.id,
            targetRole,
            path: req.path
          });

          return res.status(403).json({
            error: 'Access denied',
            message: `You do not have permission to assign the ${targetRole} role`,
            targetRole
          });
        }

        next();
      } catch (error) {
        this.logger.error('Role assignment check error', error);
        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Failed to verify role assignment permission'
        });
      }
    };
  }

  /**
   * Check if user is accessing their own resource or has admin privileges
   * @param {string} resourceType - Type of resource (user, order, etc.)
   * @returns {Function} Express middleware
   */
  requireOwnershipOrAdmin(resourceType) {
    return async (req, res, next) => {
      try {
        // Ensure user is authenticated
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        // Check if user has admin role
        const hasAdminRole = await this.rbacUtils.userHasRole(req.user.id, 'ADMIN') ||
                            await this.rbacUtils.userHasRole(req.user.id, 'SUPER_ADMIN');

        if (hasAdminRole) {
          return next();
        }

        // Check resource ownership
        const resourceId = req.params.id || req.params.userId;
        const userId = req.user.id;

        let isOwner = false;

        switch (resourceType) {
          case 'user':
            isOwner = resourceId === userId;
            break;
          case 'order':
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            const order = await prisma.order.findUnique({
              where: { id: resourceId },
              select: { userId: true }
            });
            isOwner = order && order.userId === userId;
            break;
          case 'cart':
            const prisma2 = new PrismaClient();
            const cart = await prisma2.cart.findUnique({
              where: { id: resourceId },
              select: { userId: true }
            });
            isOwner = cart && cart.userId === userId;
            break;
          case 'wishlist':
            const prisma3 = new PrismaClient();
            const wishlist = await prisma3.wishlist.findUnique({
              where: { id: resourceId },
              select: { userId: true }
            });
            isOwner = wishlist && wishlist.userId === userId;
            break;
          case 'review':
            const prisma4 = new PrismaClient();
            const review = await prisma4.review.findUnique({
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
            error: 'Access denied',
            message: 'You can only access your own resources'
          });
        }

        next();
      } catch (error) {
        this.logger.error('Ownership check error', error);
        return res.status(500).json({
          error: 'Authorization check failed',
          message: 'Failed to verify resource ownership'
        });
      }
    };
  }

  /**
   * Attach user permissions to request object
   * Useful for sending permissions to frontend
   */
  attachUserPermissions() {
    return async (req, res, next) => {
      try {
        if (req.user) {
          const permissions = await this.rbacUtils.getUserPermissions(req.user.id);
          req.userPermissions = permissions;
        }
        next();
      } catch (error) {
        this.logger.error('Error attaching user permissions', error);
        // Don't fail the request, just log the error
        next();
      }
    };
  }

  /**
   * Admin or Super Admin only
   */
  requireAdmin() {
    return this.requireRole('ADMIN', 'SUPER_ADMIN');
  }

  /**
   * Super Admin only
   */
  requireSuperAdmin() {
    return this.requireRole('SUPER_ADMIN');
  }

  /**
   * Support staff access (SUPPORT, ADMIN, SUPER_ADMIN)
   */
  requireSupportAccess() {
    return this.requireRole('SUPPORT', 'ADMIN', 'SUPER_ADMIN');
  }

  /**
   * Corporate account access (CORPORATE, ADMIN, SUPER_ADMIN)
   */
  requireCorporateAccess() {
    return this.requireRole('CORPORATE', 'ADMIN', 'SUPER_ADMIN');
  }
}

// Singleton instance
const rbacAuthMiddleware = new RBACAuthMiddleware();

module.exports = {
  RBACAuthMiddleware,
  rbacAuthMiddleware
};
