const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class UserRole {
  constructor() {
    this.db = databaseService;
    this.logger = loggerService;
  }

  /**
   * Get all user roles
   * SECURITY: Uses Prisma ORM findMany() with include instead of raw SQL to prevent SQL injection
   */
  async findAll() {
    try {
      const userRoles = await this.db.getClient().user_roles.findMany({
        include: {
          roles: {
            select: {
              name: true,
              hierarchy_level: true
            }
          }
        },
        orderBy: {
          assigned_at: 'desc'
        }
      });

      // Transform to match expected format
      return userRoles.map(ur => ({
        id: ur.id,
        user_id: ur.user_id,
        role_id: ur.role_id,
        role_name: ur.roles.name,
        hierarchy_level: ur.roles.hierarchy_level,
        assigned_by: ur.assigned_by,
        assigned_at: ur.assigned_at,
        expires_at: ur.expires_at,
        is_active: ur.is_active
      }));
    } catch (error) {
      this.logger.error('Error fetching all user roles', error);
      throw error;
    }
  }

  /**
   * Get user roles by user ID
   * SECURITY: Uses Prisma ORM findMany() with include instead of raw SQL to prevent SQL injection
   */
  async findByUserId(userId) {
    try {
      const userRoles = await this.db.getClient().user_roles.findMany({
        where: { user_id: userId },
        include: {
          roles: {
            select: {
              name: true,
              description: true,
              hierarchy_level: true
            }
          }
        },
        orderBy: [
          { roles: { hierarchy_level: 'desc' } },
          { assigned_at: 'desc' }
        ]
      });

      // Transform to match expected format
      return userRoles.map(ur => ({
        id: ur.id,
        user_id: ur.user_id,
        role_id: ur.role_id,
        role_name: ur.roles.name,
        role_description: ur.roles.description,
        hierarchy_level: ur.roles.hierarchy_level,
        assigned_by: ur.assigned_by,
        assigned_at: ur.assigned_at,
        expires_at: ur.expires_at,
        is_active: ur.is_active
      }));
    } catch (error) {
      this.logger.error('Error fetching user roles by user ID', error);
      throw error;
    }
  }

  /**
   * Get active user roles by user ID
   * SECURITY: Uses Prisma ORM findMany() with include instead of raw SQL to prevent SQL injection
   */
  async findActiveByUserId(userId) {
    try {
      const userRoles = await this.db.getClient().user_roles.findMany({
        where: {
          user_id: userId,
          is_active: true,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        },
        include: {
          roles: {
            select: {
              name: true,
              description: true,
              hierarchy_level: true
            }
          }
        },
        orderBy: [
          { roles: { hierarchy_level: 'desc' } },
          { assigned_at: 'desc' }
        ]
      });

      // Transform to match expected format
      return userRoles.map(ur => ({
        id: ur.id,
        user_id: ur.user_id,
        role_id: ur.role_id,
        role_name: ur.roles?.name || null,
        role_description: ur.roles?.description || null,
        hierarchy_level: ur.roles?.hierarchy_level || 0,
        assigned_by: ur.assigned_by,
        assigned_at: ur.assigned_at,
        expires_at: ur.expires_at,
        is_active: ur.is_active
      }));
    } catch (error) {
      this.logger.error('Error fetching active user roles', error);
      throw error;
    }
  }

  /**
   * Get user role by ID
   * SECURITY: Uses Prisma ORM findFirst() with include instead of raw SQL to prevent SQL injection
   */
  async findById(id) {
    try {
      const userRole = await this.db.getClient().user_roles.findFirst({
        where: { id },
        include: {
          roles: {
            select: {
              name: true,
              hierarchy_level: true
            }
          }
        }
      });

      if (!userRole) return null;

      // Transform to match expected format
      return {
        id: userRole.id,
        user_id: userRole.user_id,
        role_id: userRole.role_id,
        role_name: userRole.roles.name,
        hierarchy_level: userRole.roles.hierarchy_level,
        assigned_by: userRole.assigned_by,
        assigned_at: userRole.assigned_at,
        expires_at: userRole.expires_at,
        is_active: userRole.is_active
      };
    } catch (error) {
      this.logger.error('Error fetching user role by ID', error);
      throw error;
    }
  }

  /**
   * Check if user has a specific role
   * SECURITY: Uses Prisma ORM findFirst() instead of raw SQL to prevent SQL injection
   */
  async hasRole(userId, roleName) {
    try {
      const userRole = await this.db.getClient().user_roles.findFirst({
        where: {
          user_id: userId,
          is_active: true,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ],
          roles: {
            name: roleName
          }
        }
      });

      return !!userRole;
    } catch (error) {
      this.logger.error('Error checking user role', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   * SECURITY: Uses Prisma ORM create() instead of raw SQL to prevent SQL injection
   */
  async assign(data) {
    try {
      const { user_id, role_id, assigned_by, expires_at } = data;
      
      const userRole = await this.db.getClient().user_roles.create({
        data: {
          user_id,
          role_id,
          assigned_by,
          expires_at
        }
      });
      
      return userRole;
    } catch (error) {
      this.logger.error('Error assigning role to user', error);
      throw error;
    }
  }

  /**
   * Update user role
   * SECURITY: Uses Prisma ORM update() instead of raw SQL to prevent SQL injection
   */
  async update(id, data) {
    try {
      const { role_id, assigned_by, expires_at, is_active } = data;
      
      const userRole = await this.db.getClient().user_roles.update({
        where: { id },
        data: {
          role_id,
          assigned_by,
          expires_at,
          is_active
        }
      });
      
      return userRole;
    } catch (error) {
      this.logger.error('Error updating user role', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   * SECURITY: Uses Prisma ORM delete() instead of raw SQL to prevent SQL injection
   */
  async remove(id) {
    try {
      const userRole = await this.db.getClient().user_roles.delete({
        where: { id },
        select: {
          id: true,
          user_id: true,
          role_id: true
        }
      });
      
      return userRole;
    } catch (error) {
      this.logger.error('Error removing user role', error);
      throw error;
    }
  }

  /**
   * Deactivate user role
   * SECURITY: Uses Prisma ORM update() instead of raw SQL to prevent SQL injection
   */
  async deactivate(id) {
    try {
      const userRole = await this.db.getClient().user_roles.update({
        where: { id },
        data: { is_active: false },
        select: {
          id: true,
          user_id: true,
          role_id: true
        }
      });
      
      return userRole;
    } catch (error) {
      this.logger.error('Error deactivating user role', error);
      throw error;
    }
  }

  /**
   * Get users by role
   * SECURITY: Uses Prisma ORM findMany() with include instead of raw SQL to prevent SQL injection
   */
  async getUsersByRole(roleId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const [users, totalCount] = await Promise.all([
        this.db.getClient().user_roles.findMany({
          where: {
            role_id: roleId,
            is_active: true,
            OR: [
              { expires_at: null },
              { expires_at: { gt: new Date() } }
            ]
          },
          include: {
            users: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true
              }
            }
          },
          orderBy: {
            assigned_at: 'desc'
          },
          take: limit,
          skip
        }),
        this.db.getClient().user_roles.count({
          where: {
            role_id: roleId,
            is_active: true,
            OR: [
              { expires_at: null },
              { expires_at: { gt: new Date() } }
            ]
          }
        })
      ]);

      // Transform to match expected format
      return {
        users: users.map(ur => ({
          user_role_id: ur.id,
          user_id: ur.user_id,
          email: ur.users.email,
          first_name: ur.users.first_name,
          last_name: ur.users.last_name,
          assigned_by: ur.assigned_by,
          assigned_at: ur.assigned_at,
          expires_at: ur.expires_at,
          is_active: ur.is_active
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error fetching users by role', error);
      throw error;
    }
  }
}

module.exports = UserRole;
