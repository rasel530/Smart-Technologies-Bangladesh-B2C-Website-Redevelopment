const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class Role {
  constructor() {
    this.db = databaseService;
    this.logger = loggerService;
  }

  /**
   * Get all roles
   */
  async findAll() {
    try {
      // DIAGNOSTIC LOGGING - Log database query
      console.log('[Role Model] findAll - Executing query');
      console.log('[Role Model] findAll - Database client:', !!this.db.getClient());
      
      const roles = await this.db.getClient().$queryRaw`
        SELECT
          id,
          name,
          description,
          hierarchy_level,
          created_at,
          updated_at
        FROM roles
        ORDER BY hierarchy_level DESC, name ASC
      `;
      
      // DIAGNOSTIC LOGGING - Log query results
      console.log('[Role Model] findAll - Query completed');
      console.log('[Role Model] findAll - Roles returned:', roles);
      console.log('[Role Model] findAll - Roles count:', roles?.length);
      console.log('[Role Model] findAll - First role:', roles?.[0]);
      
      return roles;
    } catch (error) {
      console.error('[Role Model] findAll - Error:', error);
      this.logger.error('Error fetching all roles', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async findById(id) {
    try {
      const roles = await this.db.getClient().$queryRaw`
        SELECT 
          id,
          name,
          description,
          hierarchy_level,
          created_at,
          updated_at
        FROM roles
        WHERE id = ${id}
      `;
      return roles[0] || null;
    } catch (error) {
      this.logger.error('Error fetching role by ID', error);
      throw error;
    }
  }

  /**
   * Get role by name
   */
  async findByName(name) {
    try {
      const roles = await this.db.getClient().$queryRaw`
        SELECT 
          id,
          name,
          description,
          hierarchy_level,
          created_at,
          updated_at
        FROM roles
        WHERE name = ${name}
      `;
      return roles[0] || null;
    } catch (error) {
      this.logger.error('Error fetching role by name', error);
      throw error;
    }
  }

  /**
   * Create new role
   */
  async create(data) {
    try {
      const { name, description, hierarchy_level } = data;
      
      const roles = await this.db.getClient().$queryRaw`
        INSERT INTO roles (name, description, hierarchy_level)
        VALUES (${name}, ${description}, ${hierarchy_level})
        RETURNING 
          id,
          name,
          description,
          hierarchy_level,
          created_at,
          updated_at
      `;
      
      return roles[0];
    } catch (error) {
      this.logger.error('Error creating role', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async update(id, data) {
    try {
      const { name, description, hierarchy_level } = data;
      
      const roles = await this.db.getClient().$queryRaw`
        UPDATE roles
        SET 
          name = ${name},
          description = ${description},
          hierarchy_level = ${hierarchy_level}
        WHERE id = ${id}
        RETURNING 
          id,
          name,
          description,
          hierarchy_level,
          created_at,
          updated_at
      `;
      
      return roles[0] || null;
    } catch (error) {
      this.logger.error('Error updating role', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async delete(id) {
    try {
      const roles = await this.db.getClient().$queryRaw`
        DELETE FROM roles
        WHERE id = ${id}
        RETURNING id, name
      `;
      
      return roles[0] || null;
    } catch (error) {
      this.logger.error('Error deleting role', error);
      throw error;
    }
  }

  /**
   * Get role permissions
   */
  async getPermissions(roleId) {
    try {
      const permissions = await this.db.getClient().$queryRaw`
        SELECT 
          p.id,
          p.name,
          p.resource,
          p.action,
          p.description,
          rp.granted_at,
          rp.granted_by
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ${roleId}
        ORDER BY p.resource, p.action
      `;
      return permissions;
    } catch (error) {
      this.logger.error('Error fetching role permissions', error);
      throw error;
    }
  }

  /**
   * Get role hierarchy level
   */
  async getHierarchyLevel(roleName) {
    try {
      const roles = await this.db.getClient().$queryRaw`
        SELECT hierarchy_level
        FROM roles
        WHERE name = ${roleName}
      `;
      return roles[0] ? roles[0].hierarchy_level : null;
    } catch (error) {
      this.logger.error('Error fetching role hierarchy level', error);
      throw error;
    }
  }
}

module.exports = Role;
