const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class RoleEscalationRequest {
  constructor() {
    this.db = databaseService;
    this.logger = loggerService;
  }

  /**
   * Get all escalation requests
   */
  async findAll(filters = {}) {
    try {
      const { status, userId } = filters;
      
      let query = `
        SELECT 
          r.id,
          r.user_id,
          u.email as user_email,
          u."firstName" as user_first_name,
          u."lastName" as user_last_name,
          r.current_role_id,
          cr.name as current_role_name,
          r.requested_role_id,
          rr.name as requested_role_name,
          r.requested_by,
          r.status,
          r.reason,
          r.reviewed_by,
          r.reviewed_at,
          r.review_notes,
          r.created_at
        FROM role_escalation_requests r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN roles cr ON r.current_role_id = cr.id
        LEFT JOIN roles rr ON r.requested_role_id = rr.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (status) {
        query += ` AND r.status = $${params.length + 1}`;
        params.push(status);
      }
      
      if (userId) {
        query += ` AND r.user_id = $${params.length + 1}`;
        params.push(userId);
      }
      
      query += ` ORDER BY r.created_at DESC`;
      
      console.log('[RoleEscalationRequest] findAll query:', query);
      console.log('[RoleEscalationRequest] findAll params:', params);
      
      let requests;
      if (params.length > 0) {
        // Use $queryRawUnsafe when there are parameters to bind
        requests = await this.db.getClient().$queryRawUnsafe(query, ...params);
      } else {
        // Use $queryRaw with template literal when no parameters exist
        // Note: We need to construct the query inline, not use a variable
        requests = await this.db.getClient().$queryRaw`
          SELECT 
            r.id,
            r.user_id,
            u.email as user_email,
            u."firstName" as user_first_name,
            u."lastName" as user_last_name,
            r.current_role_id,
            cr.name as current_role_name,
            r.requested_role_id,
            rr.name as requested_role_name,
            r.requested_by,
            r.status,
            r.reason,
            r.reviewed_by,
            r.reviewed_at,
            r.review_notes,
            r.created_at
          FROM role_escalation_requests r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN roles cr ON r.current_role_id = cr.id
          LEFT JOIN roles rr ON r.requested_role_id = rr.id
          WHERE 1=1
          ORDER BY r.created_at DESC
        `;
      }
      console.log('[RoleEscalationRequest] findAll result count:', requests.length);
      return requests;
    } catch (error) {
      console.error('[RoleEscalationRequest] findAll error:', {
        message: error.message,
        stack: error.stack,
        query: query,
        params: params
      });
      this.logger.error('Error fetching all escalation requests', error);
      throw error;
    }
  }

  /**
   * Get escalation request by ID
   */
  async findById(id) {
    try {
      const requests = await this.db.getClient().$queryRaw`
        SELECT 
          r.id,
          r.user_id,
          u.email as user_email,
          u."firstName" as user_first_name,
          u."lastName" as user_last_name,
          r.current_role_id,
          cr.name as current_role_name,
          cr.hierarchy_level as current_hierarchy_level,
          r.requested_role_id,
          rr.name as requested_role_name,
          rr.hierarchy_level as requested_hierarchy_level,
          r.requested_by,
          r.status,
          r.reason,
          r.reviewed_by,
          r.reviewed_at,
          r.review_notes,
          r.created_at
        FROM role_escalation_requests r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN roles cr ON r.current_role_id = cr.id
        LEFT JOIN roles rr ON r.requested_role_id = rr.id
        WHERE r.id = ${id}
      `;
      console.log('[RoleEscalationRequest] findById id:', id);
      console.log('[RoleEscalationRequest] findById result:', requests[0]);
      return requests[0] || null;
    } catch (error) {
      console.error('[RoleEscalationRequest] findById error:', {
        message: error.message,
        stack: error.stack,
        id: id
      });
      this.logger.error('Error fetching escalation request by ID', error);
      throw error;
    }
  }

  /**
   * Create escalation request
   */
  async create(data) {
    try {
      const { user_id, current_role_id, requested_role_id, requested_by, reason } = data;
      
      const requests = await this.db.getClient().$queryRaw`
        INSERT INTO role_escalation_requests (user_id, current_role_id, requested_role_id, requested_by, reason)
        VALUES (${user_id}, ${current_role_id}, ${requested_role_id}, ${requested_by}, ${reason})
        RETURNING 
          id,
          user_id,
          current_role_id,
          requested_role_id,
          requested_by,
          status,
          reason,
          created_at
      `;
      
      return requests[0];
    } catch (error) {
      this.logger.error('Error creating escalation request', error);
      throw error;
    }
  }

  /**
   * Update escalation request
   */
  async update(id, data) {
    try {
      const { status, reviewed_by, review_notes } = data;
      const reviewed_at = status !== 'pending' ? new Date() : null;
      
      const requests = await this.db.getClient().$queryRaw`
        UPDATE role_escalation_requests
        SET 
          status = ${status},
          reviewed_by = ${reviewed_by},
          reviewed_at = ${reviewed_at},
          review_notes = ${review_notes}
        WHERE id = ${id}
        RETURNING 
          id,
          user_id,
          current_role_id,
          requested_role_id,
          status,
          reviewed_by,
          reviewed_at,
          review_notes,
          created_at
      `;
      
      return requests[0] || null;
    } catch (error) {
      this.logger.error('Error updating escalation request', error);
      throw error;
    }
  }

  /**
   * Approve escalation request
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
      
      // Update request status
      const updatedRequest = await this.update(id, {
        status: 'approved',
        reviewed_by: reviewedBy,
        review_notes: reviewNotes
      });
      
      // Assign the new role to the user
      const UserRole = require('./UserRole');
      const userRoleModel = new UserRole();
      
      // Deactivate current roles
      const currentRoles = await userRoleModel.findByUserId(request.user_id);
      for (const currentRole of currentRoles) {
        await userRoleModel.deactivate(currentRole.id);
      }
      
      // Assign new role
      await userRoleModel.assign({
        user_id: request.user_id,
        role_id: request.requested_role_id,
        assigned_by: reviewedBy,
        expires_at: null
      });
      
      return updatedRequest;
    } catch (error) {
      this.logger.error('Error approving escalation request', error);
      throw error;
    }
  }

  /**
   * Reject escalation request
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
      
      const requests = await this.db.getClient().$queryRaw`
        UPDATE role_escalation_requests
        SET status = 'cancelled'
        WHERE id = ${id}
        RETURNING id, user_id, status
      `;
      
      return requests[0] || null;
    } catch (error) {
      this.logger.error('Error cancelling escalation request', error);
      throw error;
    }
  }

  /**
   * Get pending requests
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
