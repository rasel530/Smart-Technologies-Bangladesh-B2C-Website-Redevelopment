const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class RoleEscalationRequest {
  constructor() {
    this.db = databaseService;
    this.logger = loggerService;
  }

  /**
   * Get all escalation requests
   * SECURITY: Uses Prisma ORM findMany() with include instead of raw SQL to prevent SQL injection
   */
  async findAll(filters = {}) {
    try {
      const { status, userId } = filters;
      
      const where = {};
      if (status) {
        where.status = status;
      }
      if (userId) {
        where.user_id = userId;
      }

      const requests = await this.db.getClient().role_escalation_requests.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          roles_role_escalation_requests_current_role_idToroles: {
            select: {
              name: true,
              hierarchy_level: true
            }
          },
          roles_role_escalation_requests_requested_role_idToroles: {
            select: {
              name: true,
              hierarchy_level: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Transform to match expected format
      return requests.map(r => ({
        id: r.id,
        user_id: r.user_id,
        user_email: r.users.email,
        user_first_name: r.users.firstName,
        user_last_name: r.users.lastName,
        current_role_id: r.current_role_id,
        current_role_name: r.roles_role_escalation_requests_current_role_idToroles?.name,
        current_hierarchy_level: r.roles_role_escalation_requests_current_role_idToroles?.hierarchy_level,
        requested_role_id: r.requested_role_id,
        requested_role_name: r.roles_role_escalation_requests_requested_role_idToroles?.name,
        requested_hierarchy_level: r.roles_role_escalation_requests_requested_role_idToroles?.hierarchy_level,
        requested_by: r.requested_by,
        status: r.status,
        reason: r.reason,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        review_notes: r.review_notes,
        created_at: r.created_at
      }));
    } catch (error) {
      this.logger.error('Error fetching all escalation requests', error);
      throw error;
    }
  }

  /**
   * Get escalation request by ID
   * SECURITY: Uses Prisma ORM findFirst() with include instead of raw SQL to prevent SQL injection
   */
  async findById(id) {
    try {
      const request = await this.db.getClient().role_escalation_requests.findFirst({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          roles_role_escalation_requests_current_role_idToroles: {
            select: {
              name: true,
              hierarchy_level: true
            }
          },
          roles_role_escalation_requests_requested_role_idToroles: {
            select: {
              name: true,
              hierarchy_level: true
            }
          }
        }
      });

      if (!request) return null;

      // Transform to match expected format
      return {
        id: request.id,
        user_id: request.user_id,
        user_email: request.users.email,
        user_first_name: request.users.firstName,
        user_last_name: request.users.lastName,
        current_role_id: request.current_role_id,
        current_role_name: request.roles_role_escalation_requests_current_role_idToroles?.name,
        current_hierarchy_level: request.roles_role_escalation_requests_current_role_idToroles?.hierarchy_level,
        requested_role_id: request.requested_role_id,
        requested_role_name: request.roles_role_escalation_requests_requested_role_idToroles?.name,
        requested_hierarchy_level: request.roles_role_escalation_requests_requested_role_idToroles?.hierarchy_level,
        requested_by: request.requested_by,
        status: request.status,
        reason: request.reason,
        reviewed_by: request.reviewed_by,
        reviewed_at: request.reviewed_at,
        review_notes: request.review_notes,
        created_at: request.created_at
      };
    } catch (error) {
      this.logger.error('Error fetching escalation request by ID', error);
      throw error;
    }
  }

  /**
   * Create escalation request
   * SECURITY: Uses Prisma ORM create() instead of raw SQL to prevent SQL injection
   */
  async create(data) {
    try {
      const { user_id, current_role_id, requested_role_id, requested_by, reason } = data;
      
      const request = await this.db.getClient().role_escalation_requests.create({
        data: {
          user_id,
          current_role_id,
          requested_role_id,
          requested_by,
          reason,
          status: 'pending'
        }
      });
      
      return request;
    } catch (error) {
      this.logger.error('Error creating escalation request', error);
      throw error;
    }
  }

  /**
   * Update escalation request
   * SECURITY: Uses Prisma ORM update() instead of raw SQL to prevent SQL injection
   */
  async update(id, data) {
    try {
      const { status, reviewed_by, review_notes } = data;
      const reviewed_at = status !== 'pending' ? new Date() : null;
      
      const request = await this.db.getClient().role_escalation_requests.update({
        where: { id },
        data: {
          status,
          reviewed_by,
          reviewed_at,
          review_notes
        }
      });
      
      return request;
    } catch (error) {
      this.logger.error('Error updating escalation request', error);
      throw error;
    }
  }

  /**
   * Approve escalation request
   * SECURITY: Uses Prisma ORM update() instead of raw SQL to prevent SQL injection
   * SECURITY FIX: Wraps role assignment in transaction to prevent race conditions
   */
  async approve(id, reviewedBy, reviewNotes) {
    try {
      const request = await this.findById(id);
      
      if (!request) {
        throw new Error('Escalation request not found');
      }
      
      if (request.status !== 'pending') {
        throw new Error('Request has already been processed');
      }
      
      // SECURITY: Use database transaction to ensure atomicity
      const UserRole = require('./UserRole');
      const userRoleModel = new UserRole();
      
      // Execute role assignment in transaction
      await this.db.getClient().$transaction(async (tx) => {
        // Update request status
        await tx.role_escalation_requests.update({
          where: { id },
          data: {
            status: 'approved',
            reviewed_by: reviewedBy,
            reviewed_at: new Date(),
            review_notes
          }
        });
        
        // Deactivate current roles
        await tx.user_roles.updateMany({
          where: {
            user_id: request.user_id,
            is_active: true
          },
          data: {
            is_active: false
          }
        });
        
        // Assign new role
        await tx.user_roles.create({
          data: {
            user_id: request.user_id,
            role_id: request.requested_role_id,
            assigned_by: reviewedBy,
            expires_at: null,
            is_active: true
          }
        });
      });
      
      return await this.findById(id);
    } catch (error) {
      this.logger.error('Error approving escalation request', error);
      throw error;
    }
  }

  /**
   * Reject escalation request
   * SECURITY: Uses Prisma ORM update() instead of raw SQL to prevent SQL injection
   */
  async reject(id, reviewedBy, reviewNotes) {
    try {
      const request = await this.findById(id);
      
      if (!request) {
        throw new Error('Escalation request not found');
      }
      
      if (request.status !== 'pending') {
        throw new Error('Request has already been processed');
      }
      
      return await this.update(id, {
        status: 'rejected',
        reviewed_by: reviewedBy,
        review_notes: reviewNotes
      });
    } catch (error) {
      this.logger.error('Error rejecting escalation request', error);
      throw error;
    }
  }

  /**
   * Cancel escalation request
   * SECURITY: Uses Prisma ORM update() instead of raw SQL to prevent SQL injection
   */
  async cancel(id) {
    try {
      const request = await this.findById(id);
      
      if (!request) {
        throw new Error('Escalation request not found');
      }
      
      if (request.status !== 'pending') {
        throw new Error('Can only cancel pending requests');
      }
      
      const updatedRequest = await this.db.getClient().role_escalation_requests.update({
        where: { id },
        data: { status: 'cancelled' },
        select: {
          id: true,
          user_id: true,
          status: true
        }
      });
      
      return updatedRequest;
    } catch (error) {
      this.logger.error('Error cancelling escalation request', error);
      throw error;
    }
  }

  /**
   * Get pending requests
   * SECURITY: Uses Prisma ORM findMany() with include instead of raw SQL to prevent SQL injection
   */
  async getPendingRequests() {
    try {
      const requests = await this.findAll({ status: 'pending' });
      return requests;
    } catch (error) {
      this.logger.error('Error fetching pending requests', error);
      throw error;
    }
  }

  /**
   * Get requests by user
   * SECURITY: Uses Prisma ORM findMany() with include instead of raw SQL to prevent SQL injection
   */
  async findByUserId(userId) {
    try {
      const requests = await this.findAll({ userId });
      return requests;
    } catch (error) {
      this.logger.error('Error fetching requests by user', error);
      throw error;
    }
  }
}

module.exports = RoleEscalationRequest;
