const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { databaseService } = require('../services/database');
const { authMiddleware } = require('../middleware/auth');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Get Prisma client - will auto-connect if needed
let prisma;
try {
  prisma = databaseService.getClient();
} catch (error) {
  console.error('[Order Confirmation] Failed to get Prisma client:', error);
  throw new Error('Database initialization failed');
}

// Import notification services
const emailNotificationService = require('../services/emailNotificationService');
const smsNotificationService = require('../services/smsNotificationService');

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

// Helper function to check order ownership
const checkOrderOwnership = async (orderId, userId, isAdmin) => {
  if (isAdmin) return true;

  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: { userId: true }
  });

  return order && order.userId === userId;
};

// Helper function to generate unique share token
const generateShareToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to generate invoice number
const generateInvoiceNumber = (orderNumber) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV${year}${month}${random}-${orderNumber}`;
};

// ============================================================================
// 1. Order Confirmation Page Endpoints
// ============================================================================

// GET /api/v1/orders/:id/confirmation - Get order confirmation data
router.get('/:id/confirmation', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own orders'
      });
    }

    // Get order with all related data
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        addresses: true,
        order_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                sku: true,
                regularPrice: true,
                salePrice: true
              }
            },
            product_variants: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        },
        fulfillments: {
          include: {
            courierService: true
          },
          orderBy: { createdAt: 'desc' }
        },
        invoice: true,
        shares: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get payment information
    const transactions = await prisma.paymentTransaction.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' }
    });

    // Get tracking events
    const trackingEvents = await prisma.order_tracking_events.findMany({
      where: { order_id: id },
      orderBy: { event_time: 'desc' }
    });

    // Build response data
    const data = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        confirmedAt: order.confirmedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        discount: order.discount,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        internalNotes: order.internalNotes
      },
      items: order.order_items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.products.name,
        productSku: item.products.sku,
        variantId: item.variantId,
        variantName: item.product_variants?.name,
        variantSku: item.product_variants?.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      customer: order.user ? {
        id: order.user.id,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
        phone: order.user.phone
      } : {
        firstName: order.addresses.firstName,
        lastName: order.addresses.lastName,
        email: null,
        phone: order.addresses.phone
      },
      address: {
        id: order.addresses.id,
        firstName: order.addresses.firstName,
        lastName: order.addresses.lastName,
        phone: order.addresses.phone,
        address: order.addresses.address,
        addressLine2: order.addresses.addressLine2,
        city: order.addresses.city,
        district: order.addresses.district,
        division: order.addresses.division,
        upazila: order.addresses.upazila,
        postalCode: order.addresses.postalCode
      },
      payment: transactions.map(tx => ({
        id: tx.id,
        paymentMethod: tx.paymentMethod,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        transactionId: tx.transactionId,
        gatewayTransactionId: tx.gatewayTransactionId,
        createdAt: tx.createdAt
      })),
      tracking: order.fulfillments.length > 0 ? {
        fulfillmentId: order.fulfillments[0].id,
        trackingNumber: order.fulfillments[0].trackingNumber,
        courierService: order.fulfillments[0].courierService,
        estimatedDelivery: order.fulfillments[0].estimatedDelivery,
        shippedAt: order.fulfillments[0].shippedAt,
        deliveredAt: order.fulfillments[0].deliveredAt,
        events: trackingEvents
      } : null,
      invoice: order.invoice ? {
        id: order.invoice.id,
        invoiceNumber: order.invoice.invoiceNumber,
        generatedAt: order.invoice.generatedAt,
        downloadUrl: `/api/v1/orders/${id}/invoices/${order.invoice.id}/download`
      } : null,
      shareLink: order.shares.length > 0 ? `/api/v1/orders/share/${order.shares[0].token}` : null
    };

    console.log(`[Order Confirmation] Confirmation data retrieved for order: ${id}`);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get order confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order confirmation',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/orders/:id/confirmation/view - Track confirmation page view
router.post('/:id/confirmation/view', [
  param('id').isUUID(),
  body('ipAddress').optional().isIP(),
  body('userAgent').optional().isString()
], handleValidationErrors, authMiddleware.optional(), async (req, res) => {
  try {
    const { id } = req.params;
    const { ipAddress, userAgent } = req.body;

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Create confirmation view tracking record (could use analytics table)
    // For now, we'll just log it
    console.log(`[Order Confirmation] Page view tracked for order: ${id}`, {
      userId: req.user?.id,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Page view tracked successfully'
    });

  } catch (error) {
    console.error('Track confirmation view error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track page view',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 2. Notification Endpoints
// ============================================================================

// POST /api/v1/orders/:id/notifications/send - Send a notification for an order
router.post('/:id/notifications/send', [
  param('id').isUUID(),
  body('type').isIn(['order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled', 'payment_received', 'payment_failed', 'refund_initiated', 'refund_completed', 'invoice_generated', 'tracking_update', 'delivery_reminder', 'custom']),
  body('channel').isIn(['email', 'sms', 'whatsapp', 'push', 'in_app']),
  body('recipient').optional().isString(),
  body('customMessage').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, channel, recipient, customMessage } = req.body;
    const adminId = req.user.id;

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            phone: true
          }
        },
        addresses: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Determine recipient
    let finalRecipient = recipient;
    if (!finalRecipient) {
      if (channel === 'email') {
        finalRecipient = order.user?.email || `${order.addresses.firstName}@guest.com`;
      } else if (channel === 'sms') {
        finalRecipient = order.user?.phone || order.addresses.phone;
      }
    }

    if (!finalRecipient) {
      return res.status(400).json({
        success: false,
        error: 'No recipient found for this order'
      });
    }

    // Create notification record
    const notification = await prisma.order_notifications.create({
      data: {
        order_id: id,
        user_id: order.userId,
        notificationType: type,
        channel,
        recipient: finalRecipient,
        subject: `${type.replace(/_/g, ' ').toUpperCase()} - ${order.orderNumber}`,
        message: customMessage || `Order ${order.orderNumber} - ${type}`,
        status: 'pending',
        metadata: {
          orderNumber: order.orderNumber,
          sentBy: adminId
        }
      }
    });

    console.log(`[Order Confirmation] Notification created: ${notification.id} for order ${id}`);

    // Send notification based on channel (async)
    if (channel === 'email') {
      sendEmailNotificationAsync(notification.id, finalRecipient, notification.subject, notification.message)
        .catch(error => {
          console.error('[Order Confirmation] Failed to send email notification:', error);
          updateNotificationStatus(notification.id, 'failed', error.message);
        });
    } else if (channel === 'sms') {
      sendSMSNotificationAsync(notification.id, finalRecipient, notification.message)
        .catch(error => {
          console.error('[Order Confirmation] Failed to send SMS notification:', error);
          updateNotificationStatus(notification.id, 'failed', error.message);
        });
    } else {
      // For other channels (whatsapp, push, in_app), just mark as sent for now
      updateNotificationStatus(notification.id, 'sent');
    }

    res.status(201).json({
      success: true,
      notificationId: notification.id,
      status: notification.status
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/notifications - Get all notifications for an order
router.get('/:id/notifications', [
  param('id').isUUID(),
  query('type').optional().isIn(['order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled', 'payment_received', 'payment_failed', 'refund_initiated', 'refund_completed', 'invoice_generated', 'tracking_update', 'delivery_reminder', 'custom']),
  query('channel').optional().isIn(['email', 'sms', 'whatsapp', 'push', 'in_app']),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed', 'cancelled'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, channel, status } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own orders'
      });
    }

    // Build where clause
    const where = { order_id: id };
    if (type) where.notification_type = type;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const notifications = await prisma.order_notifications.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/notifications - Get all notifications (admin view)
router.get('/admin/notifications', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled', 'payment_received', 'payment_failed', 'refund_initiated', 'refund_completed', 'invoice_generated', 'tracking_update', 'delivery_reminder', 'custom']),
  query('channel').optional().isIn(['email', 'sms', 'whatsapp', 'push', 'in_app']),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed', 'cancelled']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('orderId').optional().isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, channel, status, startDate, endDate, orderId } = req.query;

    // Build where clause
    const where = {};
    if (type) where.notification_type = type;
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (orderId) where.order_id = orderId;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.order_notifications.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order_notifications.count({ where })
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/notifications/:id/resend - Resend a failed notification
router.post('/admin/notifications/:id/resend', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification exists
    const notification = await prisma.order_notifications.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Update notification status to pending
    await prisma.order_notifications.update({
      where: { id },
      data: {
        status: 'pending',
        sent_at: null,
        delivered_at: null,
        failed_at: null,
        failure_reason: null
      }
    });

    console.log(`[Order Confirmation] Notification ${id} queued for resend`);

    // Resend notification based on channel (async)
    if (notification.channel === 'email') {
      sendEmailNotificationAsync(id, notification.recipient, notification.subject, notification.message)
        .catch(error => {
          console.error('[Order Confirmation] Failed to resend email notification:', error);
          updateNotificationStatus(id, 'failed', error.message);
        });
    } else if (notification.channel === 'sms') {
      sendSMSNotificationAsync(id, notification.recipient, notification.message)
        .catch(error => {
          console.error('[Order Confirmation] Failed to resend SMS notification:', error);
          updateNotificationStatus(id, 'failed', error.message);
        });
    } else {
      updateNotificationStatus(id, 'sent');
    }

    res.json({
      success: true,
      message: 'Notification queued for resend'
    });

  } catch (error) {
    console.error('Resend notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend notification',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/notifications/stats - Get notification statistics
router.get('/admin/notifications/stats', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where clause
    const where = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    // Get all notifications
    const notifications = await prisma.order_notifications.findMany({
      where
    });

    // Calculate statistics
    const total = notifications.length;
    const sent = notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length;
    const delivered = notifications.filter(n => n.status === 'delivered').length;
    const failed = notifications.filter(n => n.status === 'failed').length;
    const successRate = total > 0 ? (delivered / total * 100).toFixed(2) : '0.00';
    const failureRate = total > 0 ? (failed / total * 100).toFixed(2) : '0.00';

    // By channel
    const byChannel = notifications.reduce((acc, n) => {
      acc[n.channel] = acc[n.channel] || { total: 0, sent: 0, delivered: 0, failed: 0 };
      acc[n.channel].total++;
      if (n.status === 'sent' || n.status === 'delivered') acc[n.channel].sent++;
      if (n.status === 'delivered') acc[n.channel].delivered++;
      if (n.status === 'failed') acc[n.channel].failed++;
      return acc;
    }, {});

    // By type
    const byType = notifications.reduce((acc, n) => {
      acc[n.notification_type] = acc[n.notification_type] || { total: 0, sent: 0, delivered: 0, failed: 0 };
      acc[n.notification_type].total++;
      if (n.status === 'sent' || n.status === 'delivered') acc[n.notification_type].sent++;
      if (n.status === 'delivered') acc[n.notification_type].delivered++;
      if (n.status === 'failed') acc[n.notification_type].failed++;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        total,
        sent,
        delivered,
        failed,
        successRate: parseFloat(successRate),
        failureRate: parseFloat(failureRate),
        byChannel,
        byType
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 3. PDF Invoice Generation
// ============================================================================

// POST /api/v1/orders/:id/invoices/generate - Generate PDF invoice for an order
router.post('/:id/invoices/generate', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';
    const isManager = req.user.role?.toUpperCase() === 'MANAGER';

    console.log(`[Order Confirmation] Generating invoice for order: ${id} by user: ${userId} (${req.user.role})`);

    // Check ownership or admin/manager access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin || isManager);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only generate invoices for your own orders'
      });
    }

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        addresses: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!order) {
      console.error(`[Order Confirmation] Order not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if invoice already exists
    const existingInvoice = await prisma.order_invoices.findUnique({
      where: { order_id: id }
    });

    if (existingInvoice) {
      console.log(`[Order Confirmation] Invoice already exists for order: ${id}, returning existing invoice`);
      // Return existing invoice instead of error
      return res.status(200).json({
        success: true,
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoiceNumber,
        downloadUrl: `/api/v1/orders/${id}/invoices/${existingInvoice.id}/download`,
        message: 'Invoice already exists, returning existing invoice'
      });
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(order.orderNumber);
    console.log(`[Order Confirmation] Generated invoice number: ${invoiceNumber}`);

    // Generate PDF
    console.log(`[Order Confirmation] Starting PDF generation for order: ${order.orderNumber}`);
    const pdfBuffer = await generateInvoicePDF(order, invoiceNumber);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('[Order Confirmation] PDF generation failed - empty buffer');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate PDF',
        message: 'PDF generation resulted in empty buffer'
      });
    }

    console.log(`[Order Confirmation] PDF generated successfully, size: ${pdfBuffer.length} bytes`);

    // Create invoice record
    const invoice = await prisma.order_invoices.create({
      data: {
        order_id: id,
        invoice_number: invoiceNumber,
        pdf_data: pdfBuffer,
        generated_at: new Date(),
        metadata: {
          generatedBy: userId,
          generatedByRole: req.user.role
        }
      }
    });

    console.log(`[Order Confirmation] Invoice created successfully: ${invoice.id} for order ${id}`);

    res.status(201).json({
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      downloadUrl: `/api/v1/orders/${id}/invoices/${invoice.id}/download`
    });

  } catch (error) {
    console.error('[Order Confirmation] Generate invoice error:', error);
    console.error('[Order Confirmation] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/invoices - Get all invoices for an order
router.get('/:id/invoices', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';
    const isManager = req.user.role?.toUpperCase() === 'MANAGER';

    // Check ownership or admin/manager access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin || isManager);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own orders'
      });
    }

    const invoices = await prisma.order_invoices.findMany({
      where: { order_id: id },
      orderBy: { generatedAt: 'desc' }
    });

    const invoicesWithUrls = invoices.map(invoice => ({
      ...invoice,
      downloadUrl: `/api/v1/orders/${id}/invoices/${invoice.id}/download`
    }));

    res.json({
      success: true,
      data: invoicesWithUrls
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/invoices/:invoiceId/download - Download invoice PDF
router.get('/:id/invoices/:invoiceId/download', [
  param('id').isUUID(),
  param('invoiceId').isUUID(),
  query('copyType').optional().isIn(['customer', 'admin'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, invoiceId } = req.params;
    const { copyType = 'customer' } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';
    const isManager = req.user.role?.toUpperCase() === 'MANAGER';

    // Check ownership or admin/manager access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin || isManager);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own orders'
      });
    }

    // Get invoice
    const invoice = await prisma.order_invoices.findFirst({
      where: {
        id: invoiceId,
        order_id: id
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Fetch related order separately using order_id
    const order = await prisma.orders.findUnique({
      where: { id: invoice.order_id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        addresses: true,
        order_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            },
            product_variants: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Generate PDF with copy type
    const pdfBuffer = await generateInvoicePDF(order, invoice.invoiceNumber, copyType);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error(`[Order Confirmation] PDF generation failed for invoice ${invoiceId}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate PDF'
      });
    }

    // Update download count
    await prisma.order_invoices.update({
      where: { id: invoiceId },
      data: {
        downloadedAt: new Date(),
        downloadCount: { increment: 1 }
      }
    });

    console.log(`[Order Confirmation] Invoice ${invoiceId} downloaded successfully (${copyType} copy)`);

    // Send PDF file with proper headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}-${copyType}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download invoice',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/invoices - Get all invoices (admin view)
router.get('/admin/invoices', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('orderId').optional().isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, orderId } = req.query;

    // Build where clause
    const where = {};
    if (orderId) where.order_id = orderId;
    if (startDate || endDate) {
      where.generated_at = {};
      if (startDate) where.generated_at.gte = new Date(startDate);
      if (endDate) where.generated_at.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.order_invoices.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { generatedAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true
            }
          }
        }
      }),
      prisma.order_invoices.count({ where })
    ]);

    const invoicesWithUrls = invoices.map(invoice => ({
      ...invoice,
      downloadUrl: `/api/v1/orders/${invoice.order_id}/invoices/${invoice.id}/download`
    }));

    res.json({
      success: true,
      data: invoicesWithUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get admin invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/invoices/:invoiceId/resend - Resend invoice email to customer
router.post('/admin/invoices/:invoiceId/resend', [
  param('invoiceId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Get invoice with order details
    const invoice = await prisma.order_invoices.findUnique({
      where: { id: invoiceId },
      include: {
        order: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            addresses: true
          }
        }
      }
    });

    if (!invoice || !invoice.order) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const order = invoice.order;
    const customer = order.user || {
      firstName: order.addresses[0].firstName,
      lastName: order.addresses[0].lastName,
      email: `${order.addresses[0].firstName}@guest.com`
    };

    // Create notification record
    const notification = await prisma.order_notifications.create({
      data: {
        order_id: order.id,
        user_id: order.userId,
        notification_type: 'invoice_generated',
        channel: 'email',
        recipient: customer.email,
        subject: `Invoice - ${invoice.invoice_number}`,
        message: `Please find attached invoice for order #${order.orderNumber}.`,
        status: 'pending',
        metadata: {
          invoiceNumber: invoice.invoice_number,
          invoiceId: invoiceId
        }
      }
    });

    console.log(`[Order Confirmation] Invoice resend notification created: ${notification.id}`);

    // Send email (async)
    sendEmailNotificationAsync(notification.id, customer.email, notification.subject, notification.message)
      .catch(error => {
        console.error('[Order Confirmation] Failed to send invoice email:', error);
        updateNotificationStatus(notification.id, 'failed', error.message);
      });

    res.json({
      success: true,
      message: 'Invoice email sent successfully'
    });

  } catch (error) {
    console.error('Resend invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend invoice',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 4. Order Sharing Endpoints
// ============================================================================

// POST /api/v1/orders/:id/share - Create a shareable link for an order
router.post('/:id/share', [
  param('id').isUUID(),
  body('type').optional().isIn(['public_link', 'protected_link', 'one_time_link']),
  body('password').optional().isString(),
  body('expiresAt').optional().isISO8601(),
  body('maxViews').optional().isInt({ min: 1 })
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'public_link', password, expiresAt, maxViews } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only share your own orders'
      });
    }

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Generate unique share token
    const token = generateShareToken();

    // Create share record
    const share = await prisma.order_sharing.create({
      data: {
        order_id: id,
        token,
        share_type: type,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        max_views: maxViews,
        password: password ? crypto.createHash('sha256').update(password).digest('hex') : null,
        created_by: userId,
        is_active: true
      }
    });

    const shareUrl = `/api/v1/orders/share/${token}`;

    console.log(`[Order Confirmation] Share link created: ${share.id} for order ${id}`);

    res.status(201).json({
      success: true,
      shareUrl,
      shareToken: token,
      expiresAt: share.expiresAt
    });

  } catch (error) {
    console.error('Create share link error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create share link',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/share/:token - Access shared order via share token
router.get('/share/:token', [
  param('token').isString()
], handleValidationErrors, authMiddleware.optional(), async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    // Get share record
    const share = await prisma.order_sharing.findUnique({
      where: { token }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share link not found'
      });
    }

    // Check if share is active
    if (!share.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Share link is no longer active'
      });
    }

    // Check expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(403).json({
        success: false,
        error: 'Share link has expired'
      });
    }

    // Check view limit
    if (share.maxViews && share.viewCount >= share.maxViews) {
      return res.status(403).json({
        success: false,
        error: 'Share link has reached maximum views'
      });
    }

    // Check password if protected
    if (share.password && !password) {
      return res.status(401).json({
        success: false,
        error: 'Password required',
        requiresPassword: true
      });
    }

    if (share.password && password) {
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      if (passwordHash !== share.password) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password'
        });
      }
    }

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id: share.order_id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        addresses: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        fulfillments: {
          include: {
            courierService: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Update view count
    await prisma.order_sharing.update({
      where: { id: share.id },
      data: {
        view_count: { increment: 1 },
        last_viewed_at: new Date()
      }
    });

    // Build response data (limited for shared view)
    const data = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        discount: order.discount,
        total: order.total,
        paymentMethod: order.paymentMethod
      },
      items: order.items.map(item => ({
        id: item.id,
        productName: item.product.name,
        productSku: item.product.sku,
        variantName: item.variant?.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      customer: {
        firstName: order.user?.firstName || order.addresses.firstName,
        lastName: order.user?.lastName || order.addresses.lastName,
        email: order.user?.email || null
      },
      address: {
        city: order.addresses.city,
        district: order.addresses.district,
        division: order.addresses.division
      },
      payment: {
        method: order.paymentMethod,
        status: order.paymentStatus
      },
      tracking: order.fulfillments.length > 0 ? {
        trackingNumber: order.fulfillments[0].trackingNumber,
        courierService: order.fulfillments[0].courierService?.name,
        estimatedDelivery: order.fulfillments[0].estimatedDelivery
      } : null
    };

    console.log(`[Order Confirmation] Shared order accessed via token: ${token}`);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Access shared order error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to access shared order',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/shares - Get all share links for an order
router.get('/:id/shares', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own orders'
      });
    }

    const shares = await prisma.order_sharing.findMany({
      where: { order_id: id },
      orderBy: { created_at: 'desc' }
    });

    const sharesWithUrls = shares.map(share => ({
      ...share,
      shareUrl: `/api/v1/orders/share/${share.token}`
    }));

    res.json({
      success: true,
      data: sharesWithUrls
    });

  } catch (error) {
    console.error('Get shares error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shares',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/orders/:id/shares/:shareId - Update share link settings
router.put('/:id/shares/:shareId', [
  param('id').isUUID(),
  param('shareId').isUUID(),
  body('password').optional().isString(),
  body('expiresAt').optional().isISO8601(),
  body('maxViews').optional().isInt({ min: 1 }),
  body('isActive').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, shareId } = req.params;
    const { password, expiresAt, maxViews, isActive } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only modify your own order shares'
      });
    }

    // Check if share exists and belongs to order
    const share = await prisma.order_sharing.findFirst({
      where: {
        id: shareId,
        order_id: id
      }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share link not found'
      });
    }

    // Build update data
    const updateData = {};
    if (password !== undefined) {
      updateData.password = password ? crypto.createHash('sha256').update(password).digest('hex') : null;
    }
    if (expiresAt !== undefined) {
      updateData.expires_at = expiresAt ? new Date(expiresAt) : null;
    }
    if (maxViews !== undefined) {
      updateData.max_views = maxViews;
    }
    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }

    await prisma.order_sharing.update({
      where: { id: shareId },
      data: updateData
    });

    console.log(`[Order Confirmation] Share ${shareId} updated for order ${id}`);

    res.json({
      success: true,
      message: 'Share link updated successfully'
    });

  } catch (error) {
    console.error('Update share link error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update share link',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/orders/:id/shares/:shareId - Delete/disable share link
router.delete('/:id/shares/:shareId', [
  param('id').isUUID(),
  param('shareId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, shareId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own order shares'
      });
    }

    // Check if share exists and belongs to order
    const share = await prisma.order_sharing.findFirst({
      where: {
        id: shareId,
        order_id: id
      }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share link not found'
      });
    }

    // Soft delete by setting is_active to false
    await prisma.order_sharing.update({
      where: { id: shareId },
      data: { is_active: false }
    });

    console.log(`[Order Confirmation] Share ${shareId} disabled for order ${id}`);

    res.json({
      success: true,
      message: 'Share link disabled successfully'
    });

  } catch (error) {
    console.error('Delete share link error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete share link',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 5. Tracking Integration Endpoints
// ============================================================================

// POST /api/v1/orders/:id/track - Update order tracking information
router.post('/:id/track', [
  param('id').isUUID(),
  body('courierServiceId').optional().isUUID(),
  body('trackingNumber').optional().isString(),
  body('estimatedDelivery').optional().isISO8601()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { courierServiceId, trackingNumber, estimatedDelivery } = req.body;
    const adminId = req.user.id;

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Validate courier service if provided
    if (courierServiceId) {
      const courier = await prisma.courier_services.findUnique({
        where: { id: courierServiceId }
      });

      if (!courier) {
        return res.status(400).json({
          success: false,
          error: 'Courier service not found'
        });
      }
    }

    // Check if fulfillment exists
    let fulfillment = await prisma.order_fulfillments.findFirst({
      where: { order_id: id }
    });

    if (fulfillment) {
      // Update existing fulfillment
      fulfillment = await prisma.order_fulfillments.update({
        where: { id: fulfillment.id },
        data: {
          courier_service_id: courierServiceId,
          tracking_number: trackingNumber,
          estimated_delivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined
        }
      });
    } else {
      // Create new fulfillment
      fulfillment = await prisma.order_fulfillments.create({
        data: {
          order_id: id,
          courier_service_id: courierServiceId,
          tracking_number: trackingNumber,
          estimated_delivery: estimatedDelivery ? new Date(estimatedDelivery) : null
        }
      });
    }

    // Create tracking event record
    await prisma.order_tracking_events.create({
      data: {
        order_id: id,
        fulfillment_id: fulfillment.id,
        status: 'tracking_updated',
        description: 'Tracking information updated',
        event_time: new Date(),
        is_public: true
      }
    });

    console.log(`[Order Confirmation] Tracking updated for order ${id}: ${trackingNumber}`);

    res.json({
      success: true,
      trackingNumber: fulfillment.trackingNumber,
      estimatedDelivery: fulfillment.estimatedDelivery
    });

  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tracking',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/track - Get current tracking status
router.get('/:id/track', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own orders'
      });
    }

    // Get fulfillment with tracking events
    const fulfillment = await prisma.order_fulfillments.findFirst({
      where: { order_id: id },
      include: {
        courierService: true
      },
      orderBy: { created_at: 'desc' }
    });

    if (!fulfillment) {
      return res.status(404).json({
        success: false,
        error: 'Tracking information not found for this order'
      });
    }

    // Get tracking events
    const trackingEvents = await prisma.order_tracking_events.findMany({
      where: { order_id: id },
      orderBy: { event_time: 'desc' }
    });

    // Determine current status
    const latestEvent = trackingEvents[0];
    const status = latestEvent ? latestEvent.status : 'pending';
    const location = latestEvent ? latestEvent.location : null;

    res.json({
      success: true,
      data: {
        status,
        location,
        estimatedDelivery: fulfillment.estimated_delivery,
        trackingNumber: fulfillment.tracking_number,
        courierInfo: fulfillment.courierService ? {
          id: fulfillment.courierService.id,
          name: fulfillment.courierService.name,
          code: fulfillment.courierService.code,
          trackingUrl: fulfillment.courierService.tracking_url
        } : null,
        trackingEvents: trackingEvents.map(e => ({
          status: e.status,
          description: e.description,
          location: e.location,
          eventTime: e.event_time
        }))
      }
    });

  } catch (error) {
    console.error('Get tracking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/courier/:courierServiceId/sync - Sync tracking from courier service
router.post('/admin/courier/:courierServiceId/sync', [
  param('courierServiceId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { courierServiceId } = req.params;

    // Get courier service
    const courier = await prisma.courier_services.findUnique({
      where: { id: courierServiceId }
    });

    if (!courier) {
      return res.status(404).json({
        success: false,
        error: 'Courier service not found'
      });
    }

    // Get all fulfillments for this courier
    const fulfillments = await prisma.order_fulfillments.findMany({
      where: {
        courier_service_id: courierServiceId,
        tracking_number: { not: null }
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true
          }
        }
      }
    });

    let syncedEventsCount = 0;

    // Sync each fulfillment
    for (const fulfillment of fulfillments) {
      try {
        // TODO: Call courier API to get latest tracking
        // This is a placeholder - in production, you would call the actual courier API
        console.log(`[Order Confirmation] Syncing tracking for order ${fulfillment.order.orderNumber}: ${fulfillment.tracking_number}`);

        // Simulate syncing by creating a tracking event
        await prisma.order_tracking_events.create({
          data: {
            order_id: fulfillment.order_id,
            fulfillment_id: fulfillment.id,
            status: 'in_transit',
            description: 'Tracking synced from courier',
            location: 'In transit',
            event_time: new Date(),
            is_public: true,
            raw_data: {
              syncedAt: new Date().toISOString(),
              courier: courier.code
            }
          }
        });

        syncedEventsCount++;
      } catch (error) {
        console.error(`[Order Confirmation] Failed to sync tracking for order ${fulfillment.order.orderNumber}:`, error);
      }
    }

    console.log(`[Order Confirmation] Synced ${syncedEventsCount} tracking events from courier ${courier.code}`);

    res.json({
      success: true,
      syncedEventsCount,
      message: `Synced ${syncedEventsCount} tracking events successfully`
    });

  } catch (error) {
    console.error('Sync courier tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync tracking',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate PDF invoice
 */
async function generateInvoicePDF(order, invoiceNumber, copyType = 'customer') {
  console.log(`[Invoice PDF] ============================================`);
  console.log(`[Invoice PDF] Starting PDF generation`);
  console.log(`[Invoice PDF] Invoice Number: ${invoiceNumber}`);
  console.log(`[Invoice PDF] Order Number: ${order.orderNumber}`);
  console.log(`[Invoice PDF] Order ID: ${order.id}`);
  console.log(`[Invoice PDF] Number of items: ${order.order_items ? order.order_items.length : 0}`);
  console.log(`[Invoice PDF] ============================================`);

  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with explicit font settings
      // IMPORTANT: Use subset option to ensure fonts are properly embedded
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        font: 'Helvetica',
        embedSubset: true  // Ensure fonts are embedded properly
      });

      // Log available fonts
      console.log(`[Invoice PDF] PDFKit version: ${PDFDocument.version || 'unknown'}`);
      console.log(`[Invoice PDF] Default font set to: Helvetica`);
      console.log(`[Invoice PDF] Font embedding enabled: embedSubset=true`);

      const chunks = [];

      // Event handlers for PDF generation
      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          console.log(`[Invoice PDF] Generated PDF buffer size: ${pdfBuffer.length} bytes`);
          console.log(`[Invoice PDF] PDF generation completed successfully`);
          console.log(`[Invoice PDF] ============================================`);
          resolve(pdfBuffer);
        } catch (error) {
          console.error('[Invoice PDF] Error concatenating PDF chunks:', error);
          reject(error);
        }
      });

      doc.on('error', (error) => {
        console.error('[Invoice PDF] PDF generation error:', error);
        reject(error);
      });

      // Define colors
      const primaryColor = '#2563eb';
      const secondaryColor = '#64748b';
      const borderColor = '#e2e8f0';

      console.log(`[Invoice PDF] PDFKit document created`);
      console.log(`[Invoice PDF] Colors defined: primary=${primaryColor}, secondary=${secondaryColor}, border=${borderColor}`);
      console.log(`[Invoice PDF] Copy type: ${copyType}`);

      // ========== WATERMARK SECTION ==========
      // Add watermark based on copy type
      doc.save();
      doc.rotate(45, { origin: [297.64, 421.89] });
      doc.fontSize(40);
      doc.fillColor('#E0E0E0');
      if (copyType === 'customer') {
        doc.text('CUSTOMER COPY', 297.64, 421.89, { align: 'center', width: 595.28 });
      } else {
        doc.text('ADMIN COPY', 297.64, 421.89, { align: 'center', width: 595.28 });
      }
      doc.restore();

      // ========== HEADER SECTION ==========
      // Draw header background
      doc.rect(0, 0, 595.28, 100).fill(primaryColor);

      // Company header (white text on blue background) - positioned at top of header
      doc.fillColor('#ffffff');
      doc.fontSize(24);
      doc.font('Helvetica-Bold');
      doc.text('Smart Technologies Bangladesh', 50, 25, { align: 'center', width: 495.28 });
      doc.fontSize(12);
      doc.font('Helvetica');
      doc.text('Your Trusted Technology Partner', 50, 52, { align: 'center', width: 495.28 });

      // Invoice info on header - Fixed positioning to prevent overlap
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.text(`Invoice #${invoiceNumber}`, 50, 70, { width: 280 });
      doc.fontSize(9);
      doc.font('Helvetica');
      doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 90, { width: 280 });

      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.text('PAID INVOICE', 345, 70, { width: 200, align: 'right' });
      doc.fontSize(9);
      doc.font('Helvetica');
      doc.text(`Order #${order.orderNumber}`, 345, 85, { width: 200, align: 'right' });

      // Reset fill color
      doc.fillColor('#000000');

      // ========== BILL TO & SHIP TO SECTION ==========
      doc.moveDown(2);
      
      // Draw section divider
      doc.strokeColor(borderColor);
      doc.lineWidth(1);
      doc.moveTo(50, doc.y);
      doc.lineTo(545.28, doc.y);
      doc.stroke();
      
      doc.moveDown();

      // Left column - Bill To
      doc.fontSize(11);
      doc.font('Helvetica-Bold');
      doc.fillColor(primaryColor);
      doc.text('BILL TO', 50, doc.y);

      doc.fontSize(10);
      doc.font('Helvetica');
      doc.fillColor('#000000');

      const billToY = doc.y + 15;
      if (order.user) {
        doc.text(`${order.user.firstName} ${order.user.lastName}`, 50, billToY);
        doc.text(order.user.email || '', 50, doc.y + 5);
        if (order.user.phone) {
          doc.text(order.user.phone, 50, doc.y + 5);
        }
      } else {
        doc.text(`${order.addresses.firstName} ${order.addresses.lastName}`, 50, billToY);
        if (order.addresses.email) {
          doc.text(order.addresses.email, 50, doc.y + 5);
        }
        if (order.addresses.phone) {
          doc.text(order.addresses.phone, 50, doc.y + 5);
        }
      }

      // Right column - Ship To
      const shipToY = billToY;
      doc.fontSize(11);
      doc.font('Helvetica-Bold');
      doc.fillColor(primaryColor);
      doc.text('SHIP TO', 320, shipToY - 15);

      doc.fontSize(10);
      doc.font('Helvetica');
      doc.fillColor('#000000');
      doc.text(`${order.addresses.firstName} ${order.addresses.lastName}`, 320, shipToY);

      const shipAddressY = doc.y + 5;
      doc.text(order.addresses.address, 320, shipAddressY);
      if (order.addresses.addressLine2) {
        doc.text(order.addresses.addressLine2, 320, doc.y + 5);
      }
      doc.text(`${order.addresses.city}, ${order.addresses.district}`, 320, doc.y + 5);
      if (order.addresses.postalCode) {
        doc.text(order.addresses.postalCode, 320, doc.y + 5);
      }
      doc.text(order.addresses.division, 320, doc.y + 5);

      // ========== ITEMS TABLE SECTION ==========
      console.log(`[Invoice PDF] Starting items table section`);
      doc.moveDown(3);

      // Draw table header background
      const tableY = doc.y;
      console.log(`[Invoice PDF] Table Y position: ${tableY}`);
      doc.rect(50, tableY, 495.28, 30).fill('#f1f5f9');

      // Table headers
      console.log(`[Invoice PDF] Writing table headers`);
      doc.fillColor('#1e293b');
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.text('DESCRIPTION', 55, tableY + 10, { width: 250 });
      doc.text('QTY', 310, tableY + 10, { width: 50 });
      doc.text('UNIT PRICE', 365, tableY + 10, { width: 70, align: 'right' });
      doc.text('TOTAL', 440, tableY + 10, { width: 100, align: 'right' });
      console.log(`[Invoice PDF] Table headers written successfully`);
      
      // Draw table header border
      doc.strokeColor(borderColor);
      doc.lineWidth(0.5);
      doc.rect(50, tableY, 495.28, 30);
      doc.stroke();

      // Items
      console.log(`[Invoice PDF] Starting to write ${order.order_items.length} items to table`);
      doc.fillColor('#000000');
      doc.fontSize(10);
      doc.font('Helvetica');

      let itemY = tableY + 40;
      order.order_items.forEach((item, index) => {
        console.log(`[Invoice PDF] Writing item ${index + 1}/${order.order_items.length}:`, {
          productName: item.products?.name,
          variant: item.product_variants?.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        });

        // Alternate row background
        if (index % 2 === 0) {
          doc.rect(50, itemY - 5, 495.28, 25).fill('#f8fafc');
        }

        const productName = item.products.name + (item.product_variants ? ` (${item.product_variants.name})` : '');
        const unitPrice = parseFloat(item.unitPrice).toFixed(2);
        const totalPrice = parseFloat(item.totalPrice).toFixed(2);

        console.log(`[Invoice PDF] Writing item data to PDF at Y=${itemY}:`, {
          description: productName,
          qty: item.quantity,
          unitPrice: `BDT ${unitPrice}`,
          total: `BDT ${totalPrice}`
        });

        // Ensure font and color are set before writing each text
        doc.fillColor('#000000');
        doc.fontSize(10);
        doc.font('Helvetica');
        doc.text(productName, 55, itemY, { width: 250 });
        doc.text(item.quantity.toString(), 310, itemY, { width: 50 });
        doc.text(`BDT ${unitPrice}`, 365, itemY, { width: 70, align: 'right' });
        doc.text(`BDT ${totalPrice}`, 440, itemY, { width: 100, align: 'right' });

        // Draw row border
        doc.strokeColor(borderColor);
        doc.lineWidth(0.5);
        doc.moveTo(50, itemY + 20);
        doc.lineTo(545.28, itemY + 20);
        doc.stroke();

        itemY += 25;
      });
      console.log(`[Invoice PDF] All ${order.order_items.length} items written to table successfully`);
      
      // Draw table border
      doc.strokeColor(borderColor);
      doc.lineWidth(1);
      doc.rect(50, tableY, 495.28, itemY - tableY);
      doc.stroke();

      // ========== TOTALS SECTION ==========
      doc.moveDown(2);

      const totalsStartY = doc.y;
      const totalsX = 320;
      const lineHeight = 22;

      const subtotal = parseFloat(order.subtotal).toFixed(2);
      const tax = parseFloat(order.tax).toFixed(2);
      const shipping = parseFloat(order.shippingCost).toFixed(2);
      const discount = parseFloat(order.discount).toFixed(2);
      const total = parseFloat(order.total).toFixed(2);

      // Subtotal
      doc.fontSize(10);
      doc.font('Helvetica');
      doc.fillColor('#64748b');
      doc.text('Subtotal', totalsX, totalsStartY);
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.fillColor('#000000');
      doc.text(`BDT ${subtotal}`, 440, totalsStartY, { width: 100, align: 'right' });

      // Tax
      doc.fontSize(10);
      doc.font('Helvetica');
      doc.fillColor('#64748b');
      doc.text('Tax', totalsX, totalsStartY + lineHeight);
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.fillColor('#000000');
      doc.text(`BDT ${tax}`, 440, totalsStartY + lineHeight, { width: 100, align: 'right' });

      // Shipping
      doc.fontSize(10);
      doc.font('Helvetica');
      doc.fillColor('#64748b');
      doc.text('Shipping', totalsX, totalsStartY + lineHeight * 2);
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.fillColor('#000000');
      doc.text(`BDT ${shipping}`, 440, totalsStartY + lineHeight * 2, { width: 100, align: 'right' });

      // Discount
      doc.fontSize(10);
      doc.font('Helvetica');
      doc.fillColor('#64748b');
      doc.text('Discount', totalsX, totalsStartY + lineHeight * 3);
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.fillColor('#16a34a');
      doc.text(`-BDT ${discount}`, 440, totalsStartY + lineHeight * 3, { width: 100, align: 'right' });

      // Total
      doc.moveDown();
      const totalY = doc.y;
      doc.rect(320, totalY - 5, 225.28, 35).fill(primaryColor);
      doc.fontSize(12);
      doc.font('Helvetica-Bold');
      doc.fillColor('#ffffff');
      doc.text('TOTAL', 335, totalY + 5);
      doc.fontSize(14);
      doc.font('Helvetica-Bold');
      doc.text(`BDT ${total}`, 440, totalY + 2, { width: 100, align: 'right' });

      // ========== PAYMENT INFO SECTION ==========
      doc.moveDown(2);

      doc.strokeColor(borderColor);
      doc.lineWidth(1);
      doc.moveTo(50, doc.y);
      doc.lineTo(545.28, doc.y);
      doc.stroke();

      doc.moveDown();

      doc.fontSize(11);
      doc.font('Helvetica-Bold');
      doc.fillColor(primaryColor);
      doc.text('PAYMENT INFORMATION', 50, doc.y);

      doc.moveDown(0.5);

      doc.fontSize(10);
      doc.font('Helvetica');
      doc.fillColor('#64748b');
      doc.text('Payment Method:', 50, doc.y);
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.fillColor('#000000');
      doc.text(order.paymentMethod.replace('_', ' ').toUpperCase(), 150, doc.y);

      doc.moveDown(0.5);

      doc.fontSize(10);
      doc.font('Helvetica');
      doc.fillColor('#64748b');
      doc.text('Payment Status:', 50, doc.y);
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.fillColor(order.paymentStatus === 'paid' ? '#16a34a' : '#dc2626');
      doc.text(order.paymentStatus.toUpperCase(), 150, doc.y);

      // ========== TERMS & CONDITIONS SECTION ==========
      doc.moveDown(2);

      doc.strokeColor(borderColor);
      doc.lineWidth(1);
      doc.moveTo(50, doc.y);
      doc.lineTo(545.28, doc.y);
      doc.stroke();

      doc.moveDown();

      doc.fontSize(11);
      doc.font('Helvetica-Bold');
      doc.fillColor(primaryColor);
      doc.text('TERMS & CONDITIONS', 50, doc.y);

      doc.moveDown(0.5);

      doc.fontSize(9);
      doc.font('Helvetica');
      doc.fillColor('#64748b');
      doc.text('1. All prices are in Bangladeshi Taka (BDT).', 50, doc.y);
      doc.text('2. Payment is due upon receipt of invoice.', 50, doc.y + 5);
      doc.text('3. Please quote invoice number in all correspondence.', 50, doc.y + 5);
      doc.text('4. Goods once sold will not be taken back.', 50, doc.y + 5);
      doc.text('5. For any queries, please contact our customer support.', 50, doc.y + 5);

      // ========== FOOTER SECTION ==========
      doc.moveDown(3);

      // Draw footer background
      const footerY = doc.y;
      doc.rect(0, footerY, 595.28, 60).fill('#f1f5f9');

      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.fillColor(primaryColor);
      doc.text('Thank you for your business!', { align: 'center' });
      doc.fontSize(8);
      doc.font('Helvetica');
      doc.fillColor('#64748b');
      doc.text('Smart Technologies Bangladesh', { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, { align: 'center' });
      doc.moveDown(0.5);
      doc.text('For support, contact us at support@smarttechbd.com', { align: 'center' });

      // Finalize the PDF document
      doc.end();
    } catch (error) {
      console.error('[Invoice PDF] Error during PDF creation:', error);
      reject(error);
    }
  });
}

/**
 * Helper function to send email notification asynchronously
 */
async function sendEmailNotificationAsync(notificationId, to, subject, message) {
  try {
    const nodemailer = require('nodemailer');
    
    // Configure email transporter (use environment variables)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Smart Tech" <noreply@smarttech.com>',
      to: to,
      subject: subject,
      html: message
    });
    
    // Update notification status
    await updateNotificationStatus(notificationId, 'delivered');
    
    console.log('[Order Confirmation] Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('[Order Confirmation] Error sending email notification:', error);
    await updateNotificationStatus(notificationId, 'failed');
    throw error;
  }
}

/**
 * Helper function to send SMS notification asynchronously
 */
async function sendSMSNotificationAsync(notificationId, to, message) {
  try {
    await updateNotificationStatus(notificationId, 'sent');
    // TODO: Integrate with actual SMS service
    setTimeout(async () => {
      await updateNotificationStatus(notificationId, 'delivered');
    }, 2000);
  } catch (error) {
    console.error('[Order Confirmation] Error sending SMS notification:', error);
    throw error;
  }
}

/**
 * Helper function to update notification status
 */
async function updateNotificationStatus(notificationId, status, failureReason = null) {
  try {
    const updateData = { status };

    if (status === 'sent') {
      updateData.sent_at = new Date();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date();
    } else if (status === 'failed') {
      updateData.failed_at = new Date();
      updateData.failure_reason = failureReason;
    }

    await prisma.order_notifications.update({
      where: { id: notificationId },
      data: updateData
    });
  } catch (error) {
    console.error('[Order Confirmation] Error updating notification status:', error);
  }
}

module.exports = router;
