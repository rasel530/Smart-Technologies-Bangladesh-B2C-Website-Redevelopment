const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

class CartAuditService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
    
    // Audit action types
    this.ACTION_TYPES = {
      // Cart item actions
      ITEM_ADDED: 'ITEM_ADDED',
      ITEM_REMOVED: 'ITEM_REMOVED',
      QUANTITY_UPDATED: 'QUANTITY_UPDATED',
      PRICE_OVERRIDE: 'PRICE_OVERRIDE',
      
      // Cart actions
      CART_CREATED: 'CART_CREATED',
      CART_CLEARED: 'CART_CLEARED',
      CART_STATUS_CHANGED: 'CART_STATUS_CHANGED',
      CART_MERGED: 'CART_MERGED',
      
      // Discount actions
      DISCOUNT_APPLIED: 'DISCOUNT_APPLIED',
      DISCOUNT_REMOVED: 'DISCOUNT_REMOVED',
      
      // Note actions
      NOTE_ADDED: 'NOTE_ADDED',
      NOTE_UPDATED: 'NOTE_UPDATED',
      NOTE_DELETED: 'NOTE_DELETED',
      
      // Recovery actions
      CART_RECOVERED: 'CART_RECOVERED',
      RECOVERY_TOKEN_GENERATED: 'RECOVERY_TOKEN_GENERATED',
      
      // Admin actions
      ADMIN_ITEM_ADDED: 'ADMIN_ITEM_ADDED',
      ADMIN_ITEM_REMOVED: 'ADMIN_ITEM_REMOVED',
      ADMIN_QUANTITY_ADJUSTED: 'ADMIN_QUANTITY_ADJUSTED',
      
      // Rollback actions
      ROLLBACK_PERFORMED: 'ROLLBACK_PERFORMED'
    };
    
    // Entity types
    this.ENTITY_TYPES = {
      CART: 'cart',
      CART_ITEM: 'cartItem',
      DISCOUNT: 'discount',
      NOTE: 'note',
      USER: 'user'
    };
  }

  /**
   * Create audit log entry
   * @param {Object} data - Audit log data
   * @returns {Promise<Object>} Created audit log entry
   */
  async logAction(data) {
    const {
      cartId,
      action,
      entityType,
      entityId = null,
      previousValue = null,
      newValue = null,
      performedBy,
      ipAddress = null,
      userAgent = null,
      metadata = null
    } = data;

    try {
      // Validate required fields
      if (!cartId || !action || !entityType || !performedBy) {
        throw new Error('Missing required fields: cartId, action, entityType, and performedBy are required');
      }

      const auditLog = await this.prisma.cartAuditLog.create({
        data: {
          cartId,
          action,
          entityType,
          entityId,
          previousValue: previousValue ? JSON.parse(JSON.stringify(previousValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          performedBy,
          ipAddress,
          userAgent,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
        },
        include: {
          cart: {
            select: {
              id: true,
              userId: true,
              sessionId: true
            }
          }
        }
      });

      this.logger.info('Cart audit log created', {
        auditLogId: auditLog.id,
        cartId,
        action,
        entityType,
        performedBy
      });

      return auditLog;
    } catch (error) {
      this.logger.error('Error creating cart audit log', {
        cartId,
        action,
        entityType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get audit logs for a cart with pagination and filtering
   * @param {string} cartId - Cart ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated audit logs
   */
  async getCartAuditLogs(cartId, options = {}) {
    const {
      action = null,
      entityType = null,
      performedBy = null,
      fromDate = null,
      toDate = null,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    try {
      const where = {
        cartId
      };

      // Apply filters
      if (action) {
        where.action = action;
      }
      if (entityType) {
        where.entityType = entityType;
      }
      if (performedBy) {
        where.performedBy = performedBy;
      }
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate);
        }
      }

      const [auditLogs, total] = await Promise.all([
        this.prisma.cartAuditLog.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            cart: {
              select: {
                id: true,
                userId: true,
                sessionId: true
              }
            }
          }
        }),
        this.prisma.cartAuditLog.count({ where })
      ]);

      return {
        logs: auditLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error fetching cart audit logs', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get a single audit log by ID
   * @param {string} auditLogId - Audit log ID
   * @returns {Promise<Object>} Audit log entry
   */
  async getAuditLogById(auditLogId) {
    try {
      const auditLog = await this.prisma.cartAuditLog.findUnique({
        where: { id: auditLogId },
        include: {
          cart: {
            select: {
              id: true,
              userId: true,
              sessionId: true
            }
          }
        }
      });

      if (!auditLog) {
        throw new Error('Audit log not found');
      }

      return auditLog;
    } catch (error) {
      this.logger.error('Error fetching audit log', {
        auditLogId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Add a note to a cart
   * @param {string} cartId - Cart ID
   * @param {string} userId - Admin user ID who added the note
   * @param {string} content - Note content
   * @param {boolean} isPrivate - Whether the note is private
   * @returns {Promise<Object>} Created note
   */
  async addNote(cartId, userId, content, isPrivate = true) {
    try {
      // Validate cart exists
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Note content cannot be empty');
      }

      if (content.length > 5000) {
        throw new Error('Note content cannot exceed 5000 characters');
      }

      // Create the note
      const note = await this.prisma.cartNote.create({
        data: {
          cartId,
          userId,
          content: content.trim(),
          isPrivate
        },
        include: {
          cart: {
            select: {
              id: true,
              userId: true
            }
          }
        }
      });

      // Log the action
      await this.logAction({
        cartId,
        action: this.ACTION_TYPES.NOTE_ADDED,
        entityType: this.ENTITY_TYPES.NOTE,
        entityId: note.id,
        newValue: { content: content.trim(), isPrivate },
        performedBy: userId
      });

      this.logger.info('Cart note added', {
        noteId: note.id,
        cartId,
        userId,
        isPrivate
      });

      return note;
    } catch (error) {
      this.logger.error('Error adding cart note', {
        cartId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update a cart note
   * @param {string} noteId - Note ID
   * @param {string} userId - Admin user ID who updated the note
   * @param {string} content - New note content
   * @returns {Promise<Object>} Updated note
   */
  async updateNote(noteId, userId, content) {
    try {
      // Get existing note
      const existingNote = await this.prisma.cartNote.findUnique({
        where: { id: noteId }
      });

      if (!existingNote) {
        throw new Error('Note not found');
      }

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Note content cannot be empty');
      }

      if (content.length > 5000) {
        throw new Error('Note content cannot exceed 5000 characters');
      }

      // Update the note
      const note = await this.prisma.cartNote.update({
        where: { id: noteId },
        data: {
          content: content.trim(),
          updatedAt: new Date()
        },
        include: {
          cart: {
            select: {
              id: true,
              userId: true
            }
          }
        }
      });

      // Log the action
      await this.logAction({
        cartId: note.cartId,
        action: this.ACTION_TYPES.NOTE_UPDATED,
        entityType: this.ENTITY_TYPES.NOTE,
        entityId: noteId,
        previousValue: { content: existingNote.content },
        newValue: { content: content.trim() },
        performedBy: userId
      });

      this.logger.info('Cart note updated', {
        noteId,
        cartId: note.cartId,
        userId
      });

      return note;
    } catch (error) {
      this.logger.error('Error updating cart note', {
        noteId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Soft delete a cart note
   * @param {string} noteId - Note ID
   * @param {string} userId - Admin user ID who deleted the note
   * @returns {Promise<Object>} Deletion result
   */
  async deleteNote(noteId, userId) {
    try {
      // Get existing note
      const existingNote = await this.prisma.cartNote.findUnique({
        where: { id: noteId }
      });

      if (!existingNote) {
        throw new Error('Note not found');
      }

      // Delete the note (soft delete via cascade)
      await this.prisma.cartNote.delete({
        where: { id: noteId }
      });

      // Log the action
      await this.logAction({
        cartId: existingNote.cartId,
        action: this.ACTION_TYPES.NOTE_DELETED,
        entityType: this.ENTITY_TYPES.NOTE,
        entityId: noteId,
        previousValue: { content: existingNote.content, isPrivate: existingNote.isPrivate },
        performedBy: userId
      });

      this.logger.info('Cart note deleted', {
        noteId,
        cartId: existingNote.cartId,
        userId
      });

      return { success: true, message: 'Note deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting cart note', {
        noteId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get notes for a cart
   * @param {string} cartId - Cart ID
   * @param {boolean} includePrivate - Whether to include private notes
   * @param {string} userId - User ID to check permissions (optional)
   * @returns {Promise<Array>} List of notes
   */
  async getCartNotes(cartId, includePrivate = true, userId = null) {
    try {
      const where = { cartId };

      // If not including private notes, filter them out
      // If userId is provided, only show private notes created by that user
      if (!includePrivate) {
        where.isPrivate = false;
      }

      const notes = await this.prisma.cartNote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          cart: {
            select: {
              id: true,
              userId: true
            }
          }
        }
      });

      // Filter private notes based on user permissions
      return notes.filter(note => {
        if (note.isPrivate && userId) {
          return note.userId === userId;
        }
        return true;
      });
    } catch (error) {
      this.logger.error('Error fetching cart notes', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Bulk create audit logs for batch operations
   * @param {Array} entries - Array of audit log entries
   * @returns {Promise<Array>} Created audit logs
   */
  async bulkLog(entries) {
    try {
      if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('Entries must be a non-empty array');
      }

      const auditLogs = await this.prisma.cartAuditLog.createMany({
        data: entries.map(entry => ({
          cartId: entry.cartId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId || null,
          previousValue: entry.previousValue ? JSON.parse(JSON.stringify(entry.previousValue)) : null,
          newValue: entry.newValue ? JSON.parse(JSON.stringify(entry.newValue)) : null,
          performedBy: entry.performedBy,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : null
        }))
      });

      this.logger.info('Bulk audit logs created', {
        count: auditLogs.count,
        cartId: entries[0]?.cartId
      });

      return auditLogs;
    } catch (error) {
      this.logger.error('Error creating bulk audit logs', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get audit summary for a cart
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Audit summary
   */
  async getAuditSummary(cartId) {
    try {
      const logs = await this.prisma.cartAuditLog.findMany({
        where: { cartId },
        orderBy: { createdAt: 'asc' }
      });

      // Count by action type
      const actionCounts = {};
      logs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      // Get timeline of changes
      const timeline = logs.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        timestamp: log.createdAt,
        performedBy: log.performedBy
      }));

      // Get unique performers
      const performers = [...new Set(logs.map(log => log.performedBy))];

      // Calculate time span
      const timestamps = logs.map(log => new Date(log.createdAt).getTime());
      const timeSpan = timestamps.length > 0 ? {
        start: new Date(Math.min(...timestamps)),
        end: new Date(Math.max(...timestamps)),
        duration: Math.max(...timestamps) - Math.min(...timestamps)
      } : null;

      return {
        totalActions: logs.length,
        actionCounts,
        timeline,
        performers,
        timeSpan,
        firstAction: logs[0] || null,
        lastAction: logs[logs.length - 1] || null
      };
    } catch (error) {
      this.logger.error('Error getting audit summary', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Rollback a previous action (limited to certain action types)
   * @param {string} auditLogId - Audit log ID to rollback
   * @param {string} adminId - Admin performing the rollback
   * @param {Object} options - Rollback options
   * @returns {Promise<Object>} Rollback result
   */
  async rollbackAction(auditLogId, adminId, options = {}) {
    try {
      const { reason = 'Admin initiated rollback' } = options;

      // Get the audit log to rollback
      const auditLog = await this.getAuditLogById(auditLogId);

      // Define rollbackable actions
      const rollbackableActions = [
        this.ACTION_TYPES.QUANTITY_UPDATED,
        this.ACTION_TYPES.PRICE_OVERRIDE,
        this.ACTION_TYPES.DISCOUNT_APPLIED,
        this.ACTION_TYPES.DISCOUNT_REMOVED
      ];

      if (!rollbackableActions.includes(auditLog.action)) {
        throw new Error(`Action '${auditLog.action}' is not rollbackable`);
      }

      let rollbackResult = null;

      // Perform rollback based on entity type
      switch (auditLog.entityType) {
        case this.ENTITY_TYPES.CART_ITEM:
          if (auditLog.action === this.ACTION_TYPES.QUANTITY_UPDATED && auditLog.previousValue) {
            // Restore previous quantity
            const { cartId, entityId } = auditLog;
            const previousQuantity = auditLog.previousValue.quantity;

            await this.prisma.cartItem.update({
              where: { id: entityId },
              data: { quantity: previousQuantity }
            });

            rollbackResult = { restored: true, entityId, previousQuantity };
          }
          break;

        case this.ENTITY_TYPES.DISCOUNT:
          // Handle discount rollbacks based on action
          if (auditLog.action === this.ACTION_TYPES.DISCOUNT_APPLIED && auditLog.previousValue) {
            // Remove the applied discount
            const { cartId } = auditLog;
            
            // Reset discount fields on cart
            await this.prisma.cart.update({
              where: { id: cartId },
              data: {
                discount: 0
              }
            });

            // Also reset on cart items
            await this.prisma.cartItem.updateMany({
              where: { cartId },
              data: {
                appliedDiscount: 0,
                discountType: null,
                discountReason: null,
                adminDiscountId: null
              }
            });

            rollbackResult = { restored: true, action: 'discount_removed' };
          } else if (auditLog.action === this.ACTION_TYPES.DISCOUNT_REMOVED && auditLog.previousValue) {
            // Restore the discount
            const { cartId } = auditLog;
            const { discount, discountType, discountReason, adminDiscountId } = auditLog.previousValue;

            await this.prisma.cart.update({
              where: { id: cartId },
              data: { discount }
            });

            if (adminDiscountId) {
              await this.prisma.cartItem.updateMany({
                where: { cartId },
                data: {
                  appliedDiscount: auditLog.previousValue.itemDiscount || 0,
                  discountType,
                  discountReason,
                  adminDiscountId
                }
              });
            }

            rollbackResult = { restored: true, action: 'discount_restored' };
          }
          break;

        default:
          throw new Error(`Rollback not supported for entity type '${auditLog.entityType}'`);
      }

      // Create rollback audit log
      const rollbackAuditLog = await this.logAction({
        cartId: auditLog.cartId,
        action: this.ACTION_TYPES.ROLLBACK_PERFORMED,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        previousValue: auditLog,
        newValue: { rollbackResult, reason, rolledBackBy: adminId },
        performedBy: adminId,
        metadata: { originalActionId: auditLogId, reason }
      });

      this.logger.info('Audit action rolled back', {
        auditLogId,
        rollbackAuditLogId: rollbackAuditLog.id,
        adminId,
        reason
      });

      return {
        success: true,
        originalAction: auditLog,
        rollbackResult,
        rollbackLog: rollbackAuditLog
      };
    } catch (error) {
      this.logger.error('Error performing rollback', {
        auditLogId,
        adminId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get audit statistics for admin dashboard
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Audit statistics
   */
  async getAuditStats(options = {}) {
    const { fromDate = null, toDate = null, action = null } = options;

    try {
      const where = {};

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate);
        }
      }

      if (action) {
        where.action = action;
      }

      const [logs, actionCounts, uniqueCarts, uniquePerformers] = await Promise.all([
        this.prisma.cartAuditLog.findMany({ where }),
        this.prisma.cartAuditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true }
        }),
        this.prisma.cartAuditLog.findMany({
          where,
          select: { cartId: true },
          distinct: ['cartId']
        }),
        this.prisma.cartAuditLog.findMany({
          where,
          select: { performedBy: true },
          distinct: ['performedBy']
        })
      ]);

      return {
        totalLogs: logs.length,
        actionBreakdown: actionCounts.reduce((acc, item) => {
          acc[item.action] = item._count.action;
          return acc;
        }, {}),
        uniqueCartsAffected: uniqueCarts.length,
        uniquePerformers: uniquePerformers.length,
        topActions: actionCounts
          .sort((a, b) => b._count.action - a._count.action)
          .slice(0, 10)
          .map(item => ({
            action: item.action,
            count: item._count.action
          }))
      };
    } catch (error) {
      this.logger.error('Error getting audit stats', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Search audit logs by content
   * @param {string} cartId - Cart ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching audit logs
   */
  async searchAuditLogs(cartId, searchTerm) {
    try {
      const logs = await this.prisma.cartAuditLog.findMany({
        where: {
          cartId,
          OR: [
            { action: { contains: searchTerm, mode: 'insensitive' } },
            { entityType: { contains: searchTerm, mode: 'insensitive' } },
            { performedBy: { contains: searchTerm, mode: 'insensitive' } },
            {
              previousValue: {
                path: [],
                string_contains: searchTerm
              }
            },
            {
              newValue: {
                path: [],
                string_contains: searchTerm
              }
            },
            {
              metadata: {
                path: [],
                string_contains: searchTerm
              }
            }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      return logs;
    } catch (error) {
      this.logger.error('Error searching audit logs', {
        cartId,
        searchTerm,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Export audit logs for a cart
   * @param {string} cartId - Cart ID
   * @param {Object} options - Export options
   * @returns {Promise<Array>} Export data
   */
  async exportAuditLogs(cartId, options = {}) {
    const {
      fromDate = null,
      toDate = null,
      format = 'json',
      actions = null
    } = options;

    try {
      const where = { cartId };

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate);
        }
      }

      if (actions && Array.isArray(actions) && actions.length > 0) {
        where.action = { in: actions };
      }

      const logs = await this.prisma.cartAuditLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          cart: {
            select: {
              id: true,
              userId: true,
              sessionId: true,
              status: true
            }
          }
        }
      });

      if (format === 'csv') {
        // Convert to CSV format
        const headers = [
          'ID',
          'Timestamp',
          'Action',
          'Entity Type',
          'Entity ID',
          'Performed By',
          'IP Address',
          'Previous Value',
          'New Value',
          'Metadata'
        ];

        const rows = logs.map(log => [
          log.id,
          log.createdAt.toISOString(),
          log.action,
          log.entityType,
          log.entityId || '',
          log.performedBy,
          log.ipAddress || '',
          JSON.stringify(log.previousValue || {}),
          JSON.stringify(log.newValue || {}),
          JSON.stringify(log.metadata || {})
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      }

      return logs;
    } catch (error) {
      this.logger.error('Error exporting audit logs', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const cartAuditService = new CartAuditService();

module.exports = {
  CartAuditService,
  cartAuditService
};
