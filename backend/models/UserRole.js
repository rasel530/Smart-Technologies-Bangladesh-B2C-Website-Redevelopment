const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class UserRole {
  constructor() {
    this.db = databaseService;
    this.logger = loggerService;
  }

  /**
   * Get all user roles
   */
  async findAll() {
    try {
      const userRoles = await this.db.getClient().$queryRaw`
        SELECT 
          ur.id,
          ur.user_id,
          ur.role_id,
          r.name as role_name,
          r.hierarchy_level,
          ur.assigned_by,
          ur.assigned_at,
          ur.expires_at,
          ur.is_active
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        ORDER BY ur.assigned_at DESC
      `;
      return userRoles;
    } catch (error) {
      this.logger.error('Error fetching all user roles', error);
      throw error;
    }
  }

  /**
   * Get user roles by user ID
   */
  async findByUserId(userId) {
    try {
      const userRoles = await this.db.getClient().$queryRaw`
        SELECT 
          ur.id,
          ur.user_id,
          ur.role_id,
          r.name as role_name,
          r.description as role_description,
          r.hierarchy_level,
          ur.assigned_by,
          ur.assigned_at,
          ur.expires_at,
          ur.is_active
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${userId}
        ORDER BY r.hierarchy_level DESC, ur.assigned_at DESC
      `;
      return userRoles;
    } catch (error) {
      this.logger.error('Error fetching user roles by user ID', error);
      throw error;
    }
  }

  /**
   * Get active user roles by user ID
   */
  async findActiveByUserId(userId) {
    try {
      const userRoles = await this.db.getClient().$queryRaw`
        SELECT 
          ur.id,
          ur.user_id,
          ur.role_id,
          r.name as role_name,
          r.description as role_description,
          r.hierarchy_level,
          ur.assigned_by,
          ur.assigned_at,
          ur.expires_at,
          ur.is_active
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${userId}
          AND ur.is_active = true
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ORDER BY r.hierarchy_level DESC, ur.assigned_at DESC
      `;
      return userRoles;
    } catch (error) {
      this.logger.error('Error fetching active user roles', error);
      throw error;
    }
  }

  /**
   * Get user role by ID
   */
  async findById(id) {
    try {
      const userRoles = await this.db.getClient().$queryRaw`
        SELECT 
          ur.id,
          ur.user_id,
          ur.role_id,
          r.name as role_name,
          r.hierarchy_level,
          ur.assigned_by,
          ur.assigned_at,
          ur.expires_at,
          ur.is_active
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.id = ${id}
      `;
      return userRoles[0] || null;
    } catch (error) {
      this.logger.error('Error fetching user role by ID', error);
      throw error;
    }
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId, roleName) {
    try {
      const result = await this.db.getClient().$queryRaw`
        SELECT EXISTS (
          SELECT 1
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ${userId}
            AND r.name = ${roleName}
            AND ur.is_active = true
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ) as has_role
      `;
      return result[0].has_role;
    } catch (error) {
      this.logger.error('Error checking user role', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assign(data) {
    try {
      const { user_id, role_id, assigned_by, expires_at } = data;
      
      const userRoles = await this.db.getClient().$queryRaw`
        INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
        VALUES (${user_id}, ${role_id}, ${assigned_by}, ${expires_at})
        RETURNING 
          id,
          user_id,
          role_id,
          assigned_by,
          assigned_at,
          expires_at,
          is_active
      `;
      
      return userRoles[0];
    } catch (error) {
      this.logger.error('Error assigning role to user', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async update(id, data) {
    try {
      const { role_id, assigned_by, expires_at, is_active } = data;
      
      const userRoles = await this.db.getClient().$queryRaw`
        UPDATE user_roles
        SET 
          role_id = ${role_id},
          assigned_by = ${assigned_by},
          expires_at = ${expires_at},
          is_active = ${is_active}
        WHERE id = ${id}
        RETURNING 
          id,
          user_id,
          role_id,
          assigned_by,
          assigned_at,
          expires_at,
          is_active
      `;
      
      return userRoles[0] || null;
    } catch (error) {
      this.logger.error('Error updating user role', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async remove(id) {
    try {
      const userRoles = await this.db.getClient().$queryRaw`
        DELETE FROM user_roles
        WHERE id = ${id}
        RETURNING id, user_id, role_id
      `;
      
      return userRoles[0] || null;
    } catch (error) {
      this.logger.error('Error removing user role', error);
      throw error;
    }
  }

  /**
   * Deactivate user role
   */
  async deactivate(id) {
    try {
      const userRoles = await this.db.getClient().$queryRaw`
        UPDATE user_roles
        SET is_active = false
        WHERE id = ${id}
        RETURNING id, user_id, role_id
      `;
      
      return userRoles[0] || null;
    } catch (error) {
      this.logger.error('Error deactivating user role', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const [users, countResult] = await Promise.all([
        this.db.getClient().$queryRaw`
          SELECT 
            ur.id as user_role_id,
            ur.user_id,
            u.email,
            u.first_name,
            u.last_name,
            ur.assigned_by,
            ur.assigned_at,
            ur.expires_at,
            ur.is_active
          FROM user_roles ur
          JOIN users u ON ur.user_id = u.id
          WHERE ur.role_id = ${roleId}
            AND ur.is_active = true
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          ORDER BY ur.assigned_at DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `,
        this.db.getClient().$queryRaw`
          SELECT COUNT(*) as total
          FROM user_roles
          WHERE role_id = ${roleId}
            AND is_active = true
            AND (expires_at IS NULL OR expires_at > NOW())
        `
      ]);
      
      return {
        users,
        pagination: {
          page,
          limit,
          total: parseInt(countResult[0].total),
          pages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error fetching users by role', error);
      throw error;
    }
  }
}

module.exports = UserRole;
