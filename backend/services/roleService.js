const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

class RoleService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
  }

  /**
   * Get all available roles
   */
  async getAllRoles() {
    try {
      const roles = [
        { value: 'CUSTOMER', label: 'Customer', description: 'Regular customer with basic permissions' },
        { value: 'ADMIN', label: 'Admin', description: 'System administrator' },
        { value: 'MANAGER', label: 'Manager', description: 'Store manager with elevated permissions' },
        { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Super administrator with full access' },
        { value: 'SUPPORT', label: 'Support', description: 'Customer service representative' },
        { value: 'CORPORATE', label: 'Corporate', description: 'Corporate account holder' }
      ];

      return roles;
    } catch (error) {
      this.logger.error('Error getting all roles', error);
      throw error;
    }
  }

  /**
   * Get role hierarchy
   */
  async getRoleHierarchy() {
    try {
      const hierarchy = await this.prisma.roleHierarchy.findMany({
        orderBy: { createdAt: 'asc' }
      });

      // Build hierarchy tree
      const hierarchyMap = {};
      hierarchy.forEach(rel => {
        if (!hierarchyMap[rel.parentRole]) {
          hierarchyMap[rel.parentRole] = [];
        }
        hierarchyMap[rel.parentRole].push(rel.childRole);
      });

      return hierarchyMap;
    } catch (error) {
      this.logger.error('Error getting role hierarchy', error);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions() {
    try {
      const permissions = await this.prisma.permission.findMany({
        orderBy: [
          { category: 'asc' },
          { resource: 'asc' },
          { action: 'asc' }
        ]
      });

      return permissions;
    } catch (error) {
      this.logger.error('Error getting all permissions', error);
      throw error;
    }
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(category) {
    try {
      const permissions = await this.prisma.permission.findMany({
        where: { category },
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' }
        ]
      });

      return permissions;
    } catch (error) {
      this.logger.error('Error getting permissions by category', error);
      throw error;
    }
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(role) {
    try {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId: role },
        include: {
          permission: true
        },
        orderBy: {
          permission: {
            category: 'asc'
          }
        }
      });

      return rolePermissions.map(rp => rp.permission);
    } catch (error) {
      this.logger.error('Error getting role permissions', error);
      throw error;
    }
  }

  /**
   * Check if a role has a specific permission
   */
  async hasPermission(role, permissionName) {
    try {
      const rolePermission = await this.prisma.rolePermission.findFirst({
        where: {
          roleId: role,
          permission: {
            name: permissionName
          }
        }
      });

      return !!rolePermission;
    } catch (error) {
      this.logger.error('Error checking permission', error);
      throw error;
    }
  }

  /**
   * Get all permissions for a user (including inherited permissions)
   */
  async getUserPermissions(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get direct permissions for the user's role
      const directPermissions = await this.getRolePermissions(user.role);

      // Get inherited permissions from role hierarchy
      const inheritedPermissions = await this.getInheritedPermissions(user.role);

      // Combine and deduplicate permissions
      const allPermissions = new Map();
      
      [...directPermissions, ...inheritedPermissions].forEach(permission => {
        allPermissions.set(permission.name, permission);
      });

      return Array.from(allPermissions.values());
    } catch (error) {
      this.logger.error('Error getting user permissions', error);
      throw error;
    }
  }

  /**
   * Get inherited permissions from parent roles
   */
  async getInheritedPermissions(role) {
    try {
      const hierarchy = await this.getRoleHierarchy();
      const inheritedPermissions = [];
      const visitedRoles = new Set();

      // BFS to find all parent roles
      const queue = [role];
      
      while (queue.length > 0) {
        const currentRole = queue.shift();
        
        if (visitedRoles.has(currentRole)) {
          continue;
        }
        
        visitedRoles.add(currentRole);

        // Find parent roles
        for (const [parentRole, childRoles] of Object.entries(hierarchy)) {
          if (childRoles.includes(currentRole)) {
            queue.push(parentRole);
            
            // Get permissions from parent role
            const parentPermissions = await this.getRolePermissions(parentRole);
            inheritedPermissions.push(...parentPermissions);
          }
        }
      }

      return inheritedPermissions;
    } catch (error) {
      this.logger.error('Error getting inherited permissions', error);
      throw error;
    }
  }

  /**
   * Check if a user has a specific permission
   */
  async checkUserPermission(userId, permissionName) {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      return userPermissions.some(p => p.name === permissionName);
    } catch (error) {
      this.logger.error('Error checking user permission', error);
      throw error;
    }
  }

  /**
   * Assign permission to a role
   */
  async assignPermissionToRole(roleId, permissionId, grantedBy) {
    try {
      const existingAssignment = await this.prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId
          }
        }
      });

      if (existingAssignment) {
        throw new Error('Permission already assigned to this role');
      }

      const rolePermission = await this.prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
          grantedBy
        }
      });

      this.logger.info('Permission assigned to role', {
        roleId,
        permissionId,
        grantedBy
      });

      return rolePermission;
    } catch (error) {
      this.logger.error('Error assigning permission to role', error);
      throw error;
    }
  }

  /**
   * Remove permission from a role
   */
  async removePermissionFromRole(roleId, permissionId) {
    try {
      await this.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId
          }
        }
      });

      this.logger.info('Permission removed from role', {
        roleId,
        permissionId
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error removing permission from role', error);
      throw error;
    }
  }

  /**
   * Assign multiple permissions to a role
   */
  async assignPermissionsToRole(roleId, permissionIds, grantedBy) {
    try {
      const assignments = await this.prisma.$transaction(
        permissionIds.map(permissionId =>
          this.prisma.rolePermission.create({
            data: {
              roleId,
              permissionId,
              grantedBy
            }
          })
        )
      );

      this.logger.info('Multiple permissions assigned to role', {
        roleId,
        count: assignments.length,
        grantedBy
      });

      return assignments;
    } catch (error) {
      this.logger.error('Error assigning permissions to role', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId, newRole, updatedBy) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });

      this.logger.info('User role updated', {
        userId,
        oldRole: user.role,
        newRole,
        updatedBy
      });

      return updatedUser;
    } catch (error) {
      this.logger.error('Error updating user role', error);
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStatistics() {
    try {
      const roleCounts = await this.prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      });

      const stats = {
        totalUsers: 0,
        roles: {}
      };

      roleCounts.forEach(({ role, _count }) => {
        stats.roles[role] = _count.id;
        stats.totalUsers += _count.id;
      });

      // Get permission counts per role
      for (const role of Object.keys(stats.roles)) {
        const permissionCount = await this.prisma.rolePermission.count({
          where: { roleId: role }
        });
        stats.roles[role] = {
          userCount: stats.roles[role],
          permissionCount
        };
      }

      return stats;
    } catch (error) {
      this.logger.error('Error getting role statistics', error);
      throw error;
    }
  }

  /**
   * Get all users with a specific role
   */
  async getUsersByRole(role, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: { role },
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            lastLoginAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.user.count({ where: { role } })
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting users by role', error);
      throw error;
    }
  }

  /**
   * Validate role hierarchy to prevent circular references
   */
  async validateRoleHierarchy(parentRole, childRole) {
    try {
      if (parentRole === childRole) {
        throw new Error('Parent and child roles cannot be the same');
      }

      // Check if this would create a circular reference
      const hierarchy = await this.getRoleHierarchy();
      const visited = new Set();
      let current = parentRole;

      while (current) {
        if (current === childRole) {
          throw new Error('This would create a circular reference in the role hierarchy');
        }

        visited.add(current);
        
        // Find parent of current role
        let foundParent = null;
        for (const [parent, children] of Object.entries(hierarchy)) {
          if (children.includes(current)) {
            foundParent = parent;
            break;
          }
        }

        current = foundParent;
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating role hierarchy', error);
      throw error;
    }
  }

  /**
   * Get permission categories
   */
  async getPermissionCategories() {
    try {
      const categories = await this.prisma.permission.groupBy({
        by: ['category'],
        _count: {
          id: true
        },
        orderBy: {
          category: 'asc'
        }
      });

      return categories.map(({ category, _count }) => ({
        name: category,
        count: _count.id
      }));
    } catch (error) {
      this.logger.error('Error getting permission categories', error);
      throw error;
    }
  }
}

// Singleton instance
const roleService = new RoleService();

module.exports = {
  RoleService,
  roleService
};
