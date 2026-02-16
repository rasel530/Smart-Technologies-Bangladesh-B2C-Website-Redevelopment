const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class Permission {
  constructor() {
    this.db = databaseService;
    this.logger = loggerService;
  }

  /**
   * Get all permissions
   * SECURITY: Uses Prisma ORM findMany() instead of raw SQL to prevent SQL injection
   */
  async findAll() {
    try {
      const permissions = await this.db.getClient().permissions.findMany({
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' }
        ]
      });
      
      return permissions;
    } catch (error) {
      this.logger.error('Error fetching all permissions', error);
      throw error;
    }
  }

  /**
   * Get permission by ID
   * SECURITY: Uses Prisma ORM findFirst() instead of raw SQL to prevent SQL injection
   */
  async findById(id) {
    try {
      const permission = await this.db.getClient().permissions.findFirst({
        where: { id }
      });
      
      return permission;
    } catch (error) {
      this.logger.error('Error fetching permission by ID', error);
      throw error;
    }
  }

  /**
   * Get permission by name
   * SECURITY: Uses Prisma ORM findFirst() instead of raw SQL to prevent SQL injection
   */
  async findByName(name) {
    try {
      const permission = await this.db.getClient().permissions.findFirst({
        where: { name }
      });
      
      return permission;
    } catch (error) {
      this.logger.error('Error fetching permission by name', error);
      throw error;
    }
  }

  /**
   * Get permissions by resource
   * SECURITY: Uses Prisma ORM findMany() instead of raw SQL to prevent SQL injection
   */
  async findByResource(resource) {
    try {
      const permissions = await this.db.getClient().permissions.findMany({
        where: { resource },
        orderBy: { action: 'asc' }
      });
      
      return permissions;
    } catch (error) {
      this.logger.error('Error fetching permissions by resource', error);
      throw error;
    }
  }

  /**
   * Create new permission
   * SECURITY: Uses Prisma ORM create() instead of raw SQL to prevent SQL injection
   */
  async create(data) {
    try {
      const { name, resource, action, description } = data;
      
      const permission = await this.db.getClient().permissions.create({
        data: {
          name,
          resource,
          action,
          description
        }
      });
      
      return permission;
    } catch (error) {
      this.logger.error('Error creating permission', error);
      throw error;
    }
  }

  /**
   * Update permission
   * SECURITY: Uses Prisma ORM update() instead of raw SQL to prevent SQL injection
   */
  async update(id, data) {
    try {
      const { name, resource, action, description } = data;
      
      const permission = await this.db.getClient().permissions.update({
        where: { id },
        data: {
          name,
          resource,
          action,
          description
        }
      });
      
      return permission;
    } catch (error) {
      this.logger.error('Error updating permission', error);
      throw error;
    }
  }

  /**
   * Delete permission
   * SECURITY: Uses Prisma ORM delete() instead of raw SQL to prevent SQL injection
   */
  async delete(id) {
    try {
      const permission = await this.db.getClient().permissions.delete({
        where: { id },
        select: {
          id: true,
          name: true
        }
      });
      
      return permission;
    } catch (error) {
      this.logger.error('Error deleting permission', error);
      throw error;
    }
  }

  /**
   * Get all unique resources
   * SECURITY: Uses Prisma ORM findMany() instead of raw SQL to prevent SQL injection
   */
  async getResources() {
    try {
      const permissions = await this.db.getClient().permissions.findMany({
        select: {
          resource: true
        },
        distinct: ['resource'],
        orderBy: {
          resource: 'asc'
        }
      });
      
      return permissions.map(p => p.resource);
    } catch (error) {
      this.logger.error('Error fetching resources', error);
      throw error;
    }
  }
}

module.exports = Permission;
