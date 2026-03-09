const { roleService } = require('../services/roleService');
const { loggerService } = require('../services/logger');

class RoleBasedAccessMiddleware {
  constructor() {
    this.roleService = roleService;
    this.logger = loggerService;
  }

  /**
   * Check if user has required permission
   */
  requirePermission(permissionName) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        const hasPermission = await this.roleService.checkUserPermission(
          req.user.id,
          permissionName
        );

        if (!hasPermission) {
          this.logger.warn('Permission denied', {
            userId: req.user.id,
            role: req.user.role,
            requiredPermission: permissionName,
            path: req.path
          });

          return res.status(403).json({
            error: 'Permission denied',
            message: `You do not have permission to perform this action`,
            requiredPermission: permissionName
          });
        }

        req.requiredPermission = permissionName;
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
   */
  requireAnyPermission(...permissionNames) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        const userPermissions = await this.roleService.getUserPermissions(req.user.id);
        const userPermissionNames = new Set(userPermissions.map(p => p.name));

        const hasAnyPermission = permissionNames.some(perm => 
          userPermissionNames.has(perm)
        );

        if (!hasAnyPermission) {
          this.logger.warn('Permission denied', {
            userId: req.user.id,
            role: req.user.role,
            requiredPermissions: permissionNames,
            path: req.path
          });

          return res.status(403).json({
            error: 'Permission denied',
            message: `You do not have permission to perform this action`,
            requiredPermissions: permissionNames
          });
        }

        req.requiredPermissions = permissionNames;
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
   */
  requireAllPermissions(...permissionNames) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        const userPermissions = await this.roleService.getUserPermissions(req.user.id);
        const userPermissionNames = new Set(userPermissions.map(p => p.name));

        const hasAllPermissions = permissionNames.every(perm => 
          userPermissionNames.has(perm)
        );

        if (!hasAllPermissions) {
          const missingPermissions = permissionNames.filter(perm => 
            !userPermissionNames.has(perm)
          );

          this.logger.warn('Permission denied', {
            userId: req.user.id,
            role: req.user.role,
            requiredPermissions: permissionNames,
            missingPermissions,
            path: req.path
          });

          return res.status(403).json({
            error: 'Permission denied',
            message: `You do not have all required permissions`,
            requiredPermissions: permissionNames,
            missingPermissions
          });
        }

        req.requiredPermissions = permissionNames;
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
   * Check if user has required role
   */
  requireRole(...roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }

      const hasRole = roles.includes(req.user.role);

      if (!hasRole) {
        this.logger.warn('Role denied', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles,
          path: req.path
        });

        return res.status(403).json({
          error: 'Access denied',
          message: `This action requires one of the following roles: ${roles.join(', ')}`,
          requiredRoles: roles
        });
      }

      req.requiredRoles = roles;
      next();
    };
  }

  /**
   * Check if user's role is at least the minimum required role
   * Uses role hierarchy to determine level
   */
  requireMinimumRole(minimumRole) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        const hierarchy = await this.roleService.getRoleHierarchy();
        const roleLevel = this.getRoleLevel(hierarchy, req.user.role);
        const minimumLevel = this.getRoleLevel(hierarchy, minimumRole);

        if (roleLevel < minimumLevel) {
          this.logger.warn('Insufficient role level', {
            userId: req.user.id,
            userRole: req.user.role,
            userLevel: roleLevel,
            requiredRole: minimumRole,
            requiredLevel: minimumLevel,
            path: req.path
          });

          return res.status(403).json({
            error: 'Access denied',
            message: `This action requires at least ${minimumRole} role`,
            requiredRole: minimumRole
          });
        }

        req.minimumRole = minimumRole;
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
   * Get role level based on hierarchy
   * Higher level = more permissions
   */
  getRoleLevel(hierarchy, role) {
    const roleLevels = {
      'SUPER_ADMIN': 100,
      'ADMIN': 80,
      'MANAGER': 60,
      'SUPPORT': 50,
      'CORPORATE': 40,
      'CUSTOMER': 20
    };

    return roleLevels[role] || 0;
  }

  /**
   * Check if user is accessing their own resource or has admin privileges
   */
  requireOwnershipOrAdmin(resourceType) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first'
          });
        }

        // Admin users can access any resource
        if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
          return next();
        }

        const resourceId = req.params.id;
        const userId = req.user.id;
        let isOwner = false;

        switch (resourceType) {
          case 'user':
            isOwner = resourceId === userId;
            break;
          case 'order':
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            const order = await prisma.orders.findUnique({
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
   * This can be used to send permissions to frontend
   */
  attachUserPermissions() {
    return async (req, res, next) => {
      try {
        if (req.user) {
          const permissions = await this.roleService.getUserPermissions(req.user.id);
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
   * Corporate account access check
   */
  requireCorporateAccess() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }

      const corporateRoles = ['CORPORATE', 'ADMIN', 'SUPER_ADMIN'];

      if (!corporateRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'This feature is only available for corporate accounts'
        });
      }

      next();
    };
  }

  /**
   * Support staff access check
   */
  requireSupportAccess() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }

      const supportRoles = ['SUPPORT', 'ADMIN', 'SUPER_ADMIN'];

      if (!supportRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'This feature is only available for support staff'
        });
      }

      next();
    };
  }

  /**
   * Management access check
   */
  requireManagementAccess() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first'
        });
      }

      const managementRoles = ['MANAGER', 'ADMIN', 'SUPER_ADMIN'];

      if (!managementRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'This feature is only available for management staff'
        });
      }

      next();
    };
  }
}

// Singleton instance
const roleBasedAccessMiddleware = new RoleBasedAccessMiddleware();

module.exports = {
  RoleBasedAccessMiddleware,
  roleBasedAccessMiddleware
};
