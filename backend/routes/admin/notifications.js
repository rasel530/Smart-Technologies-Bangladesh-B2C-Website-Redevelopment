const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /api/v1/admin/notifications - Get paginated list of notifications with filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isString(),
  query('channel').optional().isIn(['email', 'sms', 'whatsapp', 'push', 'in_app']),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed', 'cancelled']),
  query('orderId').optional().isUUID(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      channel, 
      status, 
      orderId, 
      startDate, 
      endDate 
    } = req.query;

    const where = {};

    // Filter by notification type
    if (type) {
      where.notification_type = type;
    }

    // Filter by channel
    if (channel) {
      where.channel = channel;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by order ID
    if (orderId) {
      where.order_id = orderId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.order_notifications.count({ where });

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Fetch notifications
    const notifications = await prisma.order_notifications.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        // Include order details if needed
      }
    });

    const totalPages = Math.ceil(total / parseInt(limit));

    // Map backend field names to frontend expectations
    const mappedNotifications = notifications.map(n => ({
      ...n,
      type: n.notification_type,      // Map notificationType → type
      content: n.message,           // Map message → content
      errorMessage: n.failure_reason  // Map failureReason → errorMessage
    }));

    res.json({
      success: true,
      notifications: mappedNotifications,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages
    });

  } catch (error) {
    console.error('[Admin Notifications] Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/notifications/stats - Get notification statistics
router.get('/stats', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    // Get total counts by status
    const [
      totalSent,
      sent,
      failed,
      pending,
      delivered,
      cancelled
    ] = await Promise.all([
      prisma.order_notifications.count(),
      prisma.order_notifications.count({ where: { status: 'sent' } }),
      prisma.order_notifications.count({ where: { status: 'failed' } }),
      prisma.order_notifications.count({ where: { status: 'pending' } }),
      prisma.order_notifications.count({ where: { status: 'delivered' } }),
      prisma.order_notifications.count({ where: { status: 'cancelled' } })
    ]);

    // Calculate success rate as percentage (delivered / totalSent * 100)
    const successRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;

    // Get counts by type
    const typeCounts = await prisma.order_notifications.groupBy({
      by: ['notification_type'],
      _count: true
    });

    const byType = typeCounts.reduce((acc, item) => {
      acc[item.notification_type] = item._count;
      return acc;
    }, {});

    // Get counts by channel
    const channelCounts = await prisma.order_notifications.groupBy({
      by: ['channel'],
      _count: true
    });

    const byChannel = channelCounts.reduce((acc, item) => {
      acc[item.channel] = item._count;
      return acc;
    }, {});

    // Generate overTime array with daily statistics for the last 7 days
    const overTime = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Get notifications for this day
      const dayNotifications = await prisma.order_notifications.findMany({
        where: {
          created_at: {
            gte: new Date(dateStr + 'T00:00:00.000Z'),
            lt: new Date(dateStr + 'T23:59:59.999Z')
          }
        }
      });

      // Count by status for this day
      const daySent = dayNotifications.filter(n => n.status === 'sent').length;
      const dayDelivered = dayNotifications.filter(n => n.status === 'delivered').length;
      const dayFailed = dayNotifications.filter(n => n.status === 'failed').length;

      overTime.push({
        date: dateStr,
        sent: daySent,
        delivered: dayDelivered,
        failed: dayFailed
      });
    }

    res.json({
      success: true,
      data: {
        totalSent,
        sent,
        failed,
        pending,
        delivered,
        cancelled,
        successRate,
        byType,
        byChannel,
        overTime
      }
    });

  } catch (error) {
    console.error('[Admin Notifications] Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/notifications/:notificationId/resend - Resend a notification
router.post('/:notificationId/resend', [
  param('notificationId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Check if notification exists
    const notification = await prisma.order_notifications.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Only allow resending failed or cancelled notifications
    if (notification.status !== 'failed' && notification.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Only failed or cancelled notifications can be resent'
      });
    }

    // Reset notification status to pending
    const updatedNotification = await prisma.order_notifications.update({
      where: { id: notificationId },
      data: {
        status: 'pending',
        sent_at: null,
        delivered_at: null,
        failed_at: null,
        failure_reason: null,
        metadata: {
          ...notification.metadata,
          resent_at: new Date().toISOString(),
          resent_by: req.user.id
        }
      }
    });

    console.log(`[Admin Notifications] Notification resent: ${notificationId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Notification queued for resend',
      notificationId
    });

  } catch (error) {
    console.error('[Admin Notifications] Resend notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend notification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/admin/notifications/:notificationId - Delete a notification (soft delete)
router.delete('/:notificationId', [
  param('notificationId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Check if notification exists
    const notification = await prisma.order_notifications.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Soft delete by setting status to cancelled
    await prisma.order_notifications.update({
      where: { id: notificationId },
      data: {
        status: 'cancelled',
        metadata: {
          ...notification.metadata,
          deleted_at: new Date().toISOString(),
          deleted_by: req.user.id
        }
      }
    });

    console.log(`[Admin Notifications] Notification deleted: ${notificationId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('[Admin Notifications] Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/notifications/bulk-resend - Bulk resend notifications
router.post('/bulk-resend', [
  body('notificationIds').isArray({ min: 1 }),
  body('notificationIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { notificationIds } = req.body;

    // Check which notifications exist and can be resent
    const notifications = await prisma.order_notifications.findMany({
      where: {
        id: { in: notificationIds },
        status: { in: ['failed', 'cancelled'] }
      }
    });

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid notifications found to resend'
      });
    }

    const validIds = notifications.map(n => n.id);
    const invalidIds = notificationIds.filter(id => !validIds.includes(id));

    // Update all valid notifications to pending
    await prisma.order_notifications.updateMany({
      where: {
        id: { in: validIds }
      },
      data: {
        status: 'pending',
        sent_at: null,
        delivered_at: null,
        failed_at: null,
        failure_reason: null
      }
    });

    console.log(`[Admin Notifications] Bulk resent ${validIds.length} notifications by ${req.user.email}`);

    res.json({
      success: true,
      message: `${validIds.length} notifications queued for resend`,
      resentCount: validIds.length,
      invalidIds
    });

  } catch (error) {
    console.error('[Admin Notifications] Bulk resend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk resend notifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/admin/notifications/bulk-delete - Bulk delete notifications (soft delete)
router.delete('/bulk-delete', [
  body('notificationIds').isArray({ min: 1 }),
  body('notificationIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { notificationIds } = req.body;

    // Check which notifications exist
    const notifications = await prisma.order_notifications.findMany({
      where: {
        id: { in: notificationIds }
      }
    });

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No notifications found'
      });
    }

    const validIds = notifications.map(n => n.id);
    const invalidIds = notificationIds.filter(id => !validIds.includes(id));

    // Soft delete all valid notifications
    await prisma.order_notifications.updateMany({
      where: {
        id: { in: validIds }
      },
      data: {
        status: 'cancelled'
      }
    });

    console.log(`[Admin Notifications] Bulk deleted ${validIds.length} notifications by ${req.user.email}`);

    res.json({
      success: true,
      message: `${validIds.length} notifications deleted successfully`,
      deletedCount: validIds.length,
      invalidIds
    });

  } catch (error) {
    console.error('[Admin Notifications] Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk delete notifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
