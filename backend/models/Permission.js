const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class Permission {
  constructor() {
    this.db = databaseService;
    this.logger = loggerService;
  }

  /**
   * Get all permissions
   */
  async findAll() {
    try {
      const permissions = await this.db.getClient().$queryRaw`
        SELECT 
          id,
          name,
          resource,
          action,
          description,
          created_at
        FROM permissions
        ORDER BY resource, action
      `;
      return permissions;
    } catch (error) {
      this.logger.error('Error fetching all permissions', error);
      throw error;
    }
  }

  /**
   * Get permission by ID
   */
  async findById(id) {
    try {
      const permissions = await this.db.getClient().$queryRaw`
        SELECT 
          id,
          name,
          resource,
          action,
          description,
          created_at
        FROM permissions
        WHERE id = ${id}
      `;
      return permissions[0] || null;
    } catch (error) {
      this.logger.error('Error fetching permission by ID', error);
      throw error;
    }
  }

  /**
   * Get permission by name
   */
  async findByName(name) {
    try {
      const permissions = await this.db.getClient().$queryRaw`
        SELECT 
          id,
          name,
          resource,
          action,
          description,
          created_at
        FROM permissions
        WHERE name = ${name}
      `;
      return permissions[0] || null;
    } catch (error) {
      this.logger.error('Error fetching permission by name', error);
      throw error;
    }
  }

  /**
   * Get permissions by resource
   */
  async findByResource(resource) {
    try {
      const permissions = await this.db.getClient().$queryRaw`
        SELECT 
          id,
          name,
          resource,
          action,
          description,
          created_at
        FROM permissions
        WHERE resource = ${resource}
        ORDER BY action
      `;
      return permissions;
    } catch (error) {
      this.logger.error('Error fetching permissions by resource', error);
      throw error;
    }
  }

  /**
   * Create new permission
   */
  async create(data) {
    try {
      const { name, resource, action, description } = data;
      
      const permissions = await this.db.getClient().$queryRaw`
        INSERT INTO permissions (name, resource, action, description)
        VALUES (${name}, ${resource}, ${action}, ${description})
        RETURNING 
          id,
          name,
          resource,
          action,
          description,
          created_at
      `;
      
      return permissions[0];
    } catch (error) {
      this.logger.error('Error creating permission', error);
      throw error;
    }
  }

  /**
   * Update permission
   */
  async update(id, data) {
    try {
      const { name, resource, action, description } = data;
      
      const permissions = await this.db.getClient().$queryRaw`
        UPDATE permissions
        SET 
          name = ${name},
          resource = ${resource},
          action = ${action},
          description = ${description}
        WHERE id = ${id}
        RETURNING 
          id,
          name,
          resource,
          action,
          description,
          created_at
      `;
      
      return permissions[0] || null;
    } catch (error) {
      this.logger.error('Error updating permission', error);
      throw error;
    }
  }

  /**
   * Delete permission
   */
  async delete(id) {
    try {
      const permissions = await this.db.getClient().$queryRaw`
        DELETE FROM permissions
        WHERE id = ${id}
        RETURNING id, name
      `;
      
      return permissions[0] || null;
    } catch (error) {
      this.logger.error('Error deleting permission', error);
      throw error;
    }
  }

  /**
   * Get all unique resources
   */
  async getResources() {
    try {
      const resources = await this.db.getClient().$queryRaw`
        SELECT DISTINCT resource
        FROM permissions
        ORDER BY resource
      `;
      return resources.map(r => r.resource);
    } catch (error) {
      this.logger.error('Error fetching resources', error);
      throw error;
    }
  }
}

module.exports = Permission;
