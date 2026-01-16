const Role = require('../models/Role');
const Permission = require('../models/Permission');
const UserRole = require('../models/UserRole');
const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class RBACUtils {
  constructor() {
    this.roleModel = new Role();
    this.permissionModel = new Permission();
    this.userRoleModel = new UserRole();
    this.db = databaseService;
    this.logger = loggerService;
  }

  /**
   * Get all roles for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user roles
   */
  async getUserRoles(userId) {
    try {
      const roles = await this.userRoleModel.findActiveByUserId(userId);
      return roles;
    } catch (error) {
      this.logger.error('Error getting user roles', error);
      throw error;
    }
  }

  /**
   * Get all permissions for a user
   * Uses the database function get_user_permissions
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user permissions
   */
  async getUserPermissions(userId) {
    try {
      // Use the database function for efficient permission retrieval
      const permissions = await this.db.getClient().$queryRaw`
        SELECT * FROM get_user_permissions(${userId})
      `;
      return permissions;
    } catch (error) {
      this.logger.error('Error getting user permissions', error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   * Uses the database function user_has_permission
   * @param {string} userId - User ID
   * @param {string} permissionName - Permission name (e.g., 'user:read')
   * @returns {Promise<boolean>} True if user has permission
   */
  async userHasPermission(userId, permissionName) {
    try {
      // Use the database function for efficient permission checking
      const result = await this.db.getClient().$queryRaw`
        SELECT user_has_permission(${userId}, ${permissionName}) as has_permission
      `;
      return result[0].has_permission;
    } catch (error) {
      this.logger.error('Error checking user permission', error);
      throw error;
    }
  }

  /**
   * Check if user has any of the specified permissions
   * @param {string} userId - User ID
   * @param {Array<string>} permissionNames - Array of permission names
   * @returns {Promise<boolean>} True if user has any of the permissions
   */
  async userHasAnyPermission(userId, permissionNames) {
    try {
      for (const permissionName of permissionNames) {
        const hasPermission = await this.userHasPermission(userId, permissionName);
        if (hasPermission) {
          return true;
        }
      }
      return false;
    } catch (error) {
      this.logger.error('Error checking user permissions', error);
      throw error;
    }
  }

  /**
   * Check if user has all of the specified permissions
   * @param {string} userId - User ID
   * @param {Array<string>} permissionNames - Array of permission names
   * @returns {Promise<boolean>} True if user has all permissions
   */
  async userHasAllPermissions(userId, permissionNames) {
    try {
      for (const permissionName of permissionNames) {
        const hasPermission = await this.userHasPermission(userId, permissionName);
        if (!hasPermission) {
          return false;
        }
      }
      return true;
    } catch (error) {
      this.logger.error('Error checking user permissions', error);
      throw error;
    }
  }

  /**
   * Check if user has specific role
   * @param {string} userId - User ID
   * @param {string} roleName - Role name
   * @returns {Promise<boolean>} True if user has role
   */
  async userHasRole(userId, roleName) {
    try {
      return await this.userRoleModel.hasRole(userId, roleName);
    } catch (error) {
      this.logger.error('Error checking user role', error);
      throw error;
    }
  }

  /**
   * Check if assigner can assign target role
   * Based on role hierarchy - assigner must have higher hierarchy level
   * @param {string} assignerId - User ID of the person assigning the role
   * @param {string} targetRoleName - Name of role to be assigned
   * @returns {Promise<boolean>} True if assigner can assign the role
   */
  async canAssignRole(assignerId, targetRoleName) {
    try {
      // Get assigner's highest role level
      const assignerRoles = await this.getUserRoles(assignerId);
      if (assignerRoles.length === 0) {
        return false;
      }
      
      const assignerMaxLevel = Math.max(...assignerRoles.map(r => r.hierarchy_level));
      
      // Get target role level
      const targetRole = await this.roleModel.findByName(targetRoleName);
      if (!targetRole) {
        return false;
      }
      
      // Assigner must have higher hierarchy level than target role
      return assignerMaxLevel > targetRole.hierarchy_level;
    } catch (error) {
      this.logger.error('Error checking role assignment permission', error);
      throw error;
    }
  }

  /**
   * Check if assigner can assign any of the target roles
   * @param {string} assignerId - User ID of the person assigning the role
   * @param {Array<string>} targetRoleNames - Array of role names
   * @returns {Promise<boolean>} True if assigner can assign any of the roles
   */
  async canAssignAnyRole(assignerId, targetRoleNames) {
    try {
      for (const roleName of targetRoleNames) {
        const canAssign = await this.canAssignRole(assignerId, roleName);
        if (canAssign) {
          return true;
        }
      }
      return false;
    } catch (error) {
      this.logger.error('Error checking role assignment permissions', error);
      throw error;
    }
  }

  /**
   * Check if user meets minimum role hierarchy level
   * Uses the database function user_has_minimum_role_level
   * @param {string} userId - User ID
   * @param {number} minLevel - Minimum hierarchy level required
   * @returns {Promise<boolean>} True if user meets minimum level
   */
  async userHasMinimumRoleLevel(userId, minLevel) {
    try {
      // Use the database function for efficient level checking
      const result = await this.db.getClient().$queryRaw`
        SELECT user_has_minimum_role_level(${userId}, ${minLevel}) as has_level
      `;
      return result[0].has_level;
    } catch (error) {
      this.logger.error('Error checking user role level', error);
      throw error;
    }
  }

  /**
   * Get user's maximum role hierarchy level
   * @param {string} userId - User ID
   * @returns {Promise<number>} Maximum hierarchy level
   */
  async getUserMaxRoleLevel(userId) {
    try {
      const roles = await this.getUserRoles(userId);
      if (roles.length === 0) {
        return 0;
      }
      return Math.max(...roles.map(r => r.hierarchy_level));
    } catch (error) {
      this.logger.error('Error getting user max role level', error);
      throw error;
    }
  }

  /**
   * Log role change for audit purposes
   * @param {string} userId - User ID whose role changed
   * @param {string} action - Action performed (assign, remove, update, escalate)
   * @param {Object} details - Additional details about the change
   * @returns {Promise<Object>} Audit log entry
   */
  async logRoleChange(userId, action, details) {
    try {
      const auditLog = {
        user_id: userId,
        action: action,
        details: JSON.stringify(details),
        timestamp: new Date(),
        ip_address: details.ip || null,
        performed_by: details.performedBy || null
      };
      
      // Insert audit log (assuming audit_logs table exists or will be created)
      try {
        await this.db.getClient().$queryRaw`
          INSERT INTO audit_logs (user_id, action, details, timestamp, ip_address, performed_by)
          VALUES (
            ${auditLog.user_id},
            ${auditLog.action},
            ${auditLog.details},
            ${auditLog.timestamp},
            ${auditLog.ip_address},
            ${auditLog.performed_by}
          )
        `;
      } catch (error) {
        // If audit_logs table doesn't exist, log to logger instead
        this.logger.info('Role change audit log', auditLog);
      }
      
      return auditLog;
    } catch (error) {
      this.logger.error('Error logging role change', error);
      throw error;
    }
  }

  /**
   * Get role hierarchy for reference
   * @returns {Promise<Array>} Array of roles with hierarchy levels
   */
  async getRoleHierarchy() {
    try {
      const roles = await this.roleModel.findAll();
      return roles.sort((a, b) => b.hierarchy_level - a.hierarchy_level);
    } catch (error) {
      this.logger.error('Error getting role hierarchy', error);
      throw error;
    }
  }

  /**
   * Validate permission name format
   * @param {string} permissionName - Permission name to validate
   * @returns {boolean} True if format is valid
   */
  isValidPermissionName(permissionName) {
    const pattern = /^[a-z_]+:[a-z_]+$/;
    return pattern.test(permissionName);
  }

  /**
   * Validate role name
   * @param {string} roleName - Role name to validate
   * @returns {boolean} True if format is valid
   */
  isValidRoleName(roleName) {
    const validRoles = ['CUSTOMER', 'SUPPORT', 'CORPORATE', 'ADMIN', 'SUPER_ADMIN'];
    return validRoles.includes(roleName);
  }

  /**
   * Get permission categories
   * @returns {Promise<Array>} Array of unique resource categories
   */
  async getPermissionCategories() {
    try {
      const resources = await this.permissionModel.getResources();
      return resources;
    } catch (error) {
      this.logger.error('Error getting permission categories', error);
      throw error;
    }
  }

  /**
   * Get all available permissions grouped by resource
   * @returns {Promise<Object>} Permissions grouped by resource
   */
  async getPermissionsByResource() {
    try {
      const permissions = await this.permissionModel.findAll();
      const grouped = {};
      
      permissions.forEach(permission => {
        if (!grouped[permission.resource]) {
          grouped[permission.resource] = [];
        }
        grouped[permission.resource].push(permission);
      });
      
      return grouped;
    } catch (error) {
      this.logger.error('Error getting permissions by resource', error);
      throw error;
    }
  }
}

// Singleton instance
const rbacUtils = new RBACUtils();

module.exports = {
  RBACUtils,
  rbacUtils
};
