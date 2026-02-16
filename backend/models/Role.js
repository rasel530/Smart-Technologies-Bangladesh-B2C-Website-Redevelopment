const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class Role {
  constructor() {
    this.db = databaseService;
    this.logger = loggerService;
  }

  /**
   * Get all roles
   * SECURITY: Uses Prisma ORM findMany() instead of raw SQL to prevent SQL injection
   */
  async findAll() {
    try {
      const roles = await this.db.getClient().roles.findMany({
        orderBy: [
          { hierarchy_level: 'desc' },
          { name: 'asc' }
        ]
      });
      
      return roles;
    } catch (error) {
      this.logger.error('Error fetching all roles', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   * SECURITY: Uses Prisma ORM findFirst() instead of raw SQL to prevent SQL injection
   */
  async findById(id) {
    try {
      const role = await this.db.getClient().roles.findFirst({
        where: { id }
      });
      
      return role;
    } catch (error) {
      this.logger.error('Error fetching role by ID', error);
      throw error;
    }
  }

  /**
   * Get role by name
   * SECURITY: Uses Prisma ORM findFirst() instead of raw SQL to prevent SQL injection
   */
  async findByName(name) {
    try {
      const role = await this.db.getClient().roles.findFirst({
        where: { name }
      });
      
      return role;
    } catch (error) {
      this.logger.error('Error fetching role by name', error);
      throw error;
    }
  }

  /**
   * Create new role
   * SECURITY: Uses Prisma ORM create() instead of raw SQL to prevent SQL injection
   */
  async create(data) {
    try {
      const { name, description, hierarchy_level } = data;
      
      const role = await this.db.getClient().roles.create({
        data: {
          name,
          description,
          hierarchy_level
        }
      });
      
      return role;
    } catch (error) {
      this.logger.error('Error creating role', error);
      throw error;
    }
  }

  /**
   * Update role
   * SECURITY: Uses Prisma ORM update() instead of raw SQL to prevent SQL injection
   */
  async update(id, data) {
    try {
      const { name, description, hierarchy_level } = data;
      
      const role = await this.db.getClient().roles.update({
        where: { id },
        data: {
          name,
          description,
          hierarchy_level
        }
      });
      
      return role;
    } catch (error) {
      this.logger.error('Error updating role', error);
      throw error;
    }
  }

  /**
   * Delete role
   * SECURITY: Uses Prisma ORM delete() instead of raw SQL to prevent SQL injection
   */
  async delete(id) {
    try {
      const role = await this.db.getClient().roles.delete({
        where: { id },
        select: {
          id: true,
          name: true
        }
      });
      
      return role;
    } catch (error) {
      this.logger.error('Error deleting role', error);
      throw error;
    }
  }

  /**
   * Get role permissions
   * SECURITY: Uses Prisma ORM findMany() with include instead of raw SQL to prevent SQL injection
   */
  async getPermissions(roleId) {
    try {
      const rolePermissions = await this.db.getClient().role_permissions.findMany({
        where: { role_id: roleId },
        include: {
          permissions: {
            select: {
              id: true,
              name: true,
              resource: true,
              action: true,
              description: true
            }
          }
        }
      });

      // Transform the result to match expected format
      const permissions = rolePermissions.map(rp => ({
        id: rp.permissions.id,
        name: rp.permissions.name,
        resource: rp.permissions.resource,
        action: rp.permissions.action,
        description: rp.permissions.description,
        granted_at: rp.granted_at,
        granted_by: rp.granted_by
      }));

      // Sort by resource first, then action (in JavaScript since Prisma doesn't support multi-field sorting on relations)
      return permissions.sort((a, b) => {
        if (a.resource !== b.resource) {
          return a.resource.localeCompare(b.resource);
        }
        return a.action.localeCompare(b.action);
      });
    } catch (error) {
      this.logger.error('Error fetching role permissions', error);
      throw error;
    }
  }

  /**
   * Get role hierarchy level
   * SECURITY: Uses Prisma ORM findFirst() instead of raw SQL to prevent SQL injection
   */
  async getHierarchyLevel(roleName) {
    try {
      const role = await this.db.getClient().roles.findFirst({
        where: { name: roleName },
        select: {
          hierarchy_level: true
        }
      });
      
      return role ? role.hierarchy_level : null;
    } catch (error) {
      this.logger.error('Error fetching role hierarchy level', error);
      throw error;
    }
  }
}

module.exports = Role;
