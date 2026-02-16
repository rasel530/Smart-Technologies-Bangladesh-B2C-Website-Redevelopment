const { cartAuditService } = require('../services/cartAuditService');
const { cartService } = require('../services/cartService');
const { loggerService } = require('../services/logger');

class AdminCartAuditController {
  constructor() {
    this.logger = loggerService;
  }

  /**
   * GET /api/v1/admin/carts/:id/audit
   * Get audit logs for a specific cart
   */
  async getCartAuditLogs(req, res) {
    try {
      const { id: cartId } = req.params;
      const {
        action,
        entityType,
        performedBy,
        fromDate,
        toDate,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Validate cart exists
      const cart = await cartService.prisma.cart.findUnique({
        where: { id: cartId },
        select: { id: true, userId: true, status: true }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const options = {
        action,
        entityType,
        performedBy,
        fromDate,
        toDate,
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100), // Cap at 100
        sortBy,
        sortOrder
      };

      const result = await cartAuditService.getCartAuditLogs(cartId, options);

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
        cartId
      });
    } catch (error) {
      this.logger.error('Error getting cart audit logs', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve audit logs',
        message: 'Failed to retrieve audit logs',
        messageBn: 'অডিট লগ পুনরুদ্ধার করতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * GET /api/v1/admin/carts/:id/audit/summary
   * Get audit summary for a specific cart
   */
  async getAuditSummary(req, res) {
    try {
      const { id: cartId } = req.params;

      // Validate cart exists
      const cart = await cartService.prisma.cart.findUnique({
        where: { id: cartId },
        select: { id: true, userId: true, status: true }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const summary = await cartAuditService.getAuditSummary(cartId);

      res.json({
        success: true,
        data: summary,
        cartId
      });
    } catch (error) {
      this.logger.error('Error getting audit summary', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve audit summary',
        message: 'Failed to retrieve audit summary',
        messageBn: 'অডিট সারসংক্ষেপ পুনরুদ্ধার করতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * POST /api/v1/admin/carts/:id/notes
   * Add a note to a cart
   */
  async addNote(req, res) {
    try {
      const { id: cartId } = req.params;
      const { content, isPrivate = true } = req.body;
      const userId = req.user?.id || req.body?.adminId;

      // Validate required fields
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Content is required',
          message: 'Note content is required',
          messageBn: 'নোটের বিষয়বস্তু প্রয়োজন'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Admin user ID is required',
          messageBn: 'অ্যাডমিন ব্যবহারকারী আইডি প্রয়োজন'
        });
      }

      const note = await cartAuditService.addNote(cartId, userId, content, isPrivate);

      res.status(201).json({
        success: true,
        data: note,
        message: 'Note added successfully',
        messageBn: 'নোট সফলভাবে যোগ করা হয়েছে'
      });
    } catch (error) {
      this.logger.error('Error adding cart note', {
        error: error.message,
        stack: error.stack
      });

      if (error.message === 'Cart not found') {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      if (error.message.includes('cannot exceed')) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.message,
          messageBn: 'যাচাইকরণ ত্রুটি'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to add note',
        message: 'Failed to add note',
        messageBn: 'নোট যোগ করতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * GET /api/v1/admin/carts/:id/notes
   * Get notes for a cart
   */
  async getCartNotes(req, res) {
    try {
      const { id: cartId } = req.params;
      const { includePrivate = true } = req.query;
      const userId = req.user?.id || null;

      // Validate cart exists
      const cart = await cartService.prisma.cart.findUnique({
        where: { id: cartId },
        select: { id: true, userId: true, status: true }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const notes = await cartAuditService.getCartNotes(cartId, includePrivate === 'true', userId);

      res.json({
        success: true,
        data: notes,
        cartId
      });
    } catch (error) {
      this.logger.error('Error getting cart notes', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notes',
        message: 'Failed to retrieve notes',
        messageBn: 'নোট পুনরুদ্ধার করতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * PUT /api/v1/admin/carts/notes/:noteId
   * Update a cart note
   */
  async updateNote(req, res) {
    try {
      const { noteId } = req.params;
      const { content } = req.body;
      const userId = req.user?.id || req.body?.adminId;

      // Validate required fields
      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Content is required',
          message: 'Note content is required',
          messageBn: 'নোটের বিষয়বস্তু প্রয়োজন'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Admin user ID is required',
          messageBn: 'অ্যাডমিন ব্যবহারকারী আইডি প্রয়োজন'
        });
      }

      const note = await cartAuditService.updateNote(noteId, userId, content);

      res.json({
        success: true,
        data: note,
        message: 'Note updated successfully',
        messageBn: 'নোট সফলভাবে আপডেট হয়েছে'
      });
    } catch (error) {
      this.logger.error('Error updating cart note', {
        error: error.message,
        stack: error.stack
      });

      if (error.message === 'Note not found') {
        return res.status(404).json({
          success: false,
          error: 'Note not found',
          message: 'Note not found',
          messageBn: 'নোট পাওয়া যায়নি'
        });
      }

      if (error.message.includes('cannot exceed')) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.message,
          messageBn: 'যাচাইকরণ ত্রুটি'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update note',
        message: 'Failed to update note',
        messageBn: 'নোট আপডেট করতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * DELETE /api/v1/admin/carts/notes/:noteId
   * Delete a cart note
   */
  async deleteNote(req, res) {
    try {
      const { noteId } = req.params;
      const userId = req.user?.id || req.body?.adminId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Admin user ID is required',
          messageBn: 'অ্যাডমিন ব্যবহারকারী আইডি প্রয়োজন'
        });
      }

      const result = await cartAuditService.deleteNote(noteId, userId);

      res.json({
        success: true,
        data: result,
        message: 'Note deleted successfully',
        messageBn: 'নোট সফলভাবে মুছে ফেলা হয়েছে'
      });
    } catch (error) {
      this.logger.error('Error deleting cart note', {
        error: error.message,
        stack: error.stack
      });

      if (error.message === 'Note not found') {
        return res.status(404).json({
          success: false,
          error: 'Note not found',
          message: 'Note not found',
          messageBn: 'নোট পাওয়া যায়নি'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete note',
        message: 'Failed to delete note',
        messageBn: 'নোট মুছে ফেলতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * GET /api/v1/admin/audit/stats
   * Get audit statistics for admin dashboard
   */
  async getAuditStats(req, res) {
    try {
      const { fromDate, toDate, action } = req.query;

      const stats = await cartAuditService.getAuditStats({
        fromDate,
        toDate,
        action
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      this.logger.error('Error getting audit stats', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve audit statistics',
        message: 'Failed to retrieve audit statistics',
        messageBn: 'অডিট পরিসংখ্যান পুনরুদ্ধার করতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * POST /api/v1/admin/carts/:id/audit/rollback/:logId
   * Rollback a previous action
   */
  async rollbackAction(req, res) {
    try {
      const { id: cartId, logId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id || req.body?.adminId;

      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Admin user ID is required',
          messageBn: 'অ্যাডমিন ব্যবহারকারী আইডি প্রয়োজন'
        });
      }

      // Validate cart exists
      const cart = await cartService.prisma.cart.findUnique({
        where: { id: cartId },
        select: { id: true, userId: true, status: true }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const result = await cartAuditService.rollbackAction(logId, adminId, { reason });

      res.json({
        success: true,
        data: result,
        message: 'Action rolled back successfully',
        messageBn: 'কার্যক্রম সফলভাবে পূর্বাবস্থায় ফিরিয়ে আনা হয়েছে'
      });
    } catch (error) {
      this.logger.error('Error performing rollback', {
        error: error.message,
        stack: error.stack
      });

      if (error.message === 'Audit log not found') {
        return res.status(404).json({
          success: false,
          error: 'Audit log not found',
          message: 'Audit log not found',
          messageBn: 'অডিট লগ পাওয়া যায়নি'
        });
      }

      if (error.message.includes('not rollbackable')) {
        return res.status(400).json({
          success: false,
          error: 'Cannot rollback',
          message: error.message,
          messageBn: 'পূর্বাবস্থায় ফিরিয়ে আনতে অক্ষম'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to rollback action',
        message: 'Failed to rollback action',
        messageBn: 'কার্যক্রম পূর্বাবস্থায় ফিরিয়ে আনতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * GET /api/v1/admin/carts/:id/audit/export
   * Export audit logs for a cart
   */
  async exportAuditLogs(req, res) {
    try {
      const { id: cartId } = req.params;
      const { fromDate, toDate, actions, format = 'json' } = req.query;

      // Validate cart exists
      const cart = await cartService.prisma.cart.findUnique({
        where: { id: cartId },
        select: { id: true, userId: true, status: true }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const exportData = await cartAuditService.exportAuditLogs(cartId, {
        fromDate,
        toDate,
        actions: actions ? actions.split(',') : null,
        format
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="cart-audit-${cartId}.csv"`);
        return res.send(exportData);
      }

      res.json({
        success: true,
        data: exportData,
        cartId,
        exportedAt: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Error exporting audit logs', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to export audit logs',
        message: 'Failed to export audit logs',
        messageBn: 'অডিট লগ রপ্তানি করতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * GET /api/v1/admin/carts/:id/audit/:logId
   * Get a specific audit log entry
   */
  async getAuditLogById(req, res) {
    try {
      const { logId } = req.params;

      const auditLog = await cartAuditService.getAuditLogById(logId);

      res.json({
        success: true,
        data: auditLog
      });
    } catch (error) {
      this.logger.error('Error getting audit log', {
        error: error.message,
        stack: error.stack
      });

      if (error.message === 'Audit log not found') {
        return res.status(404).json({
          success: false,
          error: 'Audit log not found',
          message: 'Audit log not found',
          messageBn: 'অডিট লগ পাওয়া যায়নি'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve audit log',
        message: 'Failed to retrieve audit log',
        messageBn: 'অডিট লগ পুনরুদ্ধার করতে ব্যর্থ',
        details: error.message
      });
    }
  }

  /**
   * GET /api/v1/admin/carts/:id/audit/search
   * Search audit logs
   */
  async searchAuditLogs(req, res) {
    try {
      const { id: cartId } = req.params;
      const { q: searchTerm } = req.query;

      if (!searchTerm || searchTerm.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search term is required',
          message: 'Search term is required',
          messageBn: 'অনুসন্ধান শব্দ প্রয়োজন'
        });
      }

      // Validate cart exists
      const cart = await cartService.prisma.cart.findUnique({
        where: { id: cartId },
        select: { id: true, userId: true, status: true }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const results = await cartAuditService.searchAuditLogs(cartId, searchTerm);

      res.json({
        success: true,
        data: results,
        cartId,
        searchTerm,
        count: results.length
      });
    } catch (error) {
      this.logger.error('Error searching audit logs', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to search audit logs',
        message: 'Failed to search audit logs',
        messageBn: 'অডিট লগ অনুসন্ধান করতে ব্যর্থ',
        details: error.message
      });
    }
  }
}

// Singleton instance
const adminCartAuditController = new AdminCartAuditController();

module.exports = {
  AdminCartAuditController,
  adminCartAuditController
};
