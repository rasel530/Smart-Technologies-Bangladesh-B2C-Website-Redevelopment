const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const courierTrackingService = require('../services/courierTrackingService');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Validation failed',
      messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
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

// Helper function to verify guest order access
const verifyGuestOrderAccess = async (orderNumber, email, phone) => {
  const order = await prisma.orders.findUnique({
    where: { orderNumber }
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  const paymentDetails = order.paymentDetails || {};
  const orderEmail = paymentDetails.email;
  const orderPhone = paymentDetails.phone || order.address?.phone;

  if (email && orderEmail !== email) {
    return { success: false, error: 'Order does not belong to this email' };
  }

  if (phone && orderPhone !== phone) {
    return { success: false, error: 'Order does not belong to this phone number' };
  }

  return { success: true, order };
};

// ============================================================================
// 1. Real-Time Status Update Endpoints
// ============================================================================

// GET /api/v1/orders/:id/status - Get current order status
router.get('/:id/status', [
  param('id').isUUID(),
  query('email').optional().isEmail(),
  query('phone').optional().isString()
], handleValidationErrors, authMiddleware.optional(), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone } = req.query;
    const userId = req.user?.id;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    // Get order
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        message: 'Order not found',
        messageBn: 'অর্ডার পাওয়া যায়নি'
      });
    }

    // Check access
    if (userId) {
      const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own orders',
          messageBn: 'আপনি শুধুমাত্র নিজের অর্ডার অ্যাক্সেস করতে পারেন'
        });
      }
    } else {
      // Guest access - verify email/phone
      const paymentDetails = order.paymentDetails || {};
      const orderEmail = paymentDetails.email;
      const orderPhone = paymentDetails.phone;
      
      if (email && orderEmail !== email) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Order does not belong to this email',
          messageBn: 'অর্ডারটি এই ইমেইলের নয়'
        });
      }
      
      if (phone && orderPhone !== phone) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Order does not belong to this phone number',
          messageBn: 'অর্ডারটি এই ফোন নম্বরের নয়'
        });
      }
    }

    // Get status history
    const statusHistory = await prisma.order_status_histories.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get fulfillment info
    const fulfillment = await prisma.order_fulfillments.findFirst({
      where: { order_id: id },
      include: { courier_services: true }
    });

    // Calculate current step and estimated completion
    const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentStepIndex = statusSteps.indexOf(order.status);
    const currentStep = currentStepIndex >= 0 ? statusSteps[currentStepIndex] : 'pending';
    const estimatedCompletion = fulfillment?.estimatedDelivery || null;

    res.json({
      success: true,
      data: {
        status: order.status,
        previousStatus: statusHistory.length > 0 ? statusHistory[0].previousStatus : null,
        statusHistory: statusHistory.map(h => ({
          status: h.newStatus,
          previousStatus: h.previousStatus,
          reason: h.reason,
          changedAt: h.createdAt
        })),
        currentStep,
        estimatedCompletion,
        fulfillment: fulfillment ? {
          trackingNumber: fulfillment.trackingNumber,
          courierService: fulfillment.courierService?.name,
          estimatedDelivery: fulfillment.estimatedDelivery
        } : null
      }
    });

  } catch (error) {
    console.error('Get order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order status',
      message: 'Failed to fetch order status',
      messageBn: 'অর্ডার স্ট্যাটাস পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
    });
  }
});

// POST /api/v1/orders/:id/status - Update order status (admin)
router.post('/:id/status', [
  param('id').isUUID(),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  body('reason').optional().isString(),
  body('notifyCustomer').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, notifyCustomer } = req.body;
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

    // Use transaction for status update
    await prisma.$transaction(async (tx) => {
      // Update order status
      const updateData = { status };
      if (status === 'confirmed') updateData.confirmedAt = new Date();
      if (status === 'shipped') updateData.shippedAt = new Date();
      if (status === 'delivered') updateData.deliveredAt = new Date();

      await tx.order.update({
        where: { id },
        data: updateData
      });

      // Create status history record
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: order.status,
          newStatus: status,
          changedBy: adminId,
          reason: reason || `Status changed to ${status}`
        }
      });

      // Create notification if requested
      if (notifyCustomer) {
        const notificationType = `order_${status}`;
        await tx.orderNotification.create({
          data: {
            orderId: id,
            userId: order.userId,
            notificationType: notificationType,
            channel: 'email',
            recipient: order.paymentDetails?.email || order.user?.email,
            subject: `Order ${order.orderNumber} Status Update`,
            message: `Your order status has been updated to ${status}`,
            status: 'pending'
          }
        });
      }
    });

    console.log(`[OrderTracking] Order ${id} status updated to ${status} by admin ${adminId}`);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      notificationSent: notifyCustomer || false
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/status/realtime - Get real-time order status (polling)
router.get('/:id/status/realtime', [
  param('id').isUUID(),
  query('email').optional().isEmail(),
  query('phone').optional().isString(),
  query('lastUpdated').optional().isISO8601()
], handleValidationErrors, authMiddleware.optional(), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, lastUpdated } = req.query;
    const userId = req.user?.id;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    // Get order
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check access
    if (userId) {
      const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    } else {
      // Guest access verification
      const paymentDetails = order.paymentDetails || {};
      const orderEmail = paymentDetails.email;
      const orderPhone = paymentDetails.phone;
      
      if (email && orderEmail !== email) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      if (phone && orderPhone !== phone) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Get latest tracking events
    const trackingEvents = await prisma.order_tracking_events.findMany({
      where: { order_id: id },
      orderBy: { event_time: 'desc' },
      take: 5
    });

    // Get fulfillment
    const fulfillment = await prisma.order_fulfillments.findFirst({
      where: { orderId: id },
      include: { courierService: true }
    });

    // Calculate next steps based on current status
    const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusSteps.indexOf(order.status);
    const nextSteps = currentIndex >= 0 && currentIndex < statusSteps.length - 1 
      ? statusSteps.slice(currentIndex + 1)
      : [];

    res.json({
      success: true,
      data: {
        status: order.status,
        lastUpdated: order.updatedAt,
        trackingEvents: trackingEvents.map(e => ({
          status: e.status,
          description: e.description,
          location: e.location,
          timestamp: e.event_time
        })),
        nextSteps,
        fulfillment: fulfillment ? {
          trackingNumber: fulfillment.trackingNumber,
          courierService: fulfillment.courierService?.name,
          estimatedDelivery: fulfillment.estimatedDelivery
        } : null
      }
    });

  } catch (error) {
    console.error('Get real-time status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time status'
    });
  }
});

// ============================================================================
// 2. Courier Integration Endpoints
// ============================================================================

// POST /api/v1/admin/courier-services - Register a new courier service
router.post('/admin/courier-services', [
  body('name').isString().trim().notEmpty(),
  body('code').isString().trim().notEmpty(),
  body('apiUrl').optional().isURL(),
  body('apiKey').optional().isString(),
  body('trackingUrlTemplate').optional().isString(),
  body('isActive').optional().isBoolean(),
  body('coverageAreas').optional().isArray(),
  body('pricing').optional().isObject()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { name, code, apiUrl, apiKey, trackingUrlTemplate, isActive, coverageAreas, pricing } = req.body;

    // Check if code already exists
    const existingCourier = await prisma.courier_services.findUnique({
      where: { code }
    });

    if (existingCourier) {
      return res.status(400).json({
        success: false,
        error: 'Courier service code already exists'
      });
    }

    const courierService = await prisma.courier_services.create({
      data: {
        name,
        code,
        apiEndpoint: apiUrl,
        trackingUrl: trackingUrlTemplate,
        isActive: isActive !== undefined ? isActive : true,
        coverageAreas: coverageAreas || [],
        baseRate: pricing?.baseRate,
        ratePerKg: pricing?.ratePerKg
      }
    });

    console.log(`[OrderTracking] Courier service created: ${courierService.id} - ${name}`);

    res.status(201).json({
      success: true,
      courierServiceId: courierService.id,
      message: 'Courier service registered successfully'
    });

  } catch (error) {
    console.error('Create courier service error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create courier service',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/courier-services - Get all registered courier services
router.get('/admin/courier-services', [
  query('isActive').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { isActive } = req.query;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const courierServices = await prisma.courier_services.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: courierServices
    });

  } catch (error) {
    console.error('Get courier services error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courier services'
    });
  }
});

// PUT /api/v1/admin/courier-services/:id - Update courier service configuration
router.put('/admin/courier-services/:id', [
  param('id').isUUID(),
  body('name').optional().isString().trim(),
  body('code').optional().isString().trim(),
  body('apiUrl').optional().isURL(),
  body('apiKey').optional().isString(),
  body('trackingUrlTemplate').optional().isString(),
  body('isActive').optional().isBoolean(),
  body('coverageAreas').optional().isArray(),
  body('pricing').optional().isObject()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, apiUrl, trackingUrlTemplate, isActive, coverageAreas, pricing } = req.body;

    // Check if courier service exists
    const existingCourier = await prisma.courier_services.findUnique({
      where: { id }
    });

    if (!existingCourier) {
      return res.status(404).json({
        success: false,
        error: 'Courier service not found'
      });
    }

    // Check if new code conflicts
    if (code && code !== existingCourier.code) {
      const codeConflict = await prisma.courier_services.findUnique({
        where: { code }
      });

      if (codeConflict) {
        return res.status(400).json({
          success: false,
          error: 'Courier service code already exists'
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (apiUrl !== undefined) updateData.apiEndpoint = apiUrl;
    if (trackingUrlTemplate !== undefined) updateData.trackingUrl = trackingUrlTemplate;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (coverageAreas !== undefined) updateData.coverageAreas = coverageAreas;
    if (pricing?.baseRate !== undefined) updateData.baseRate = pricing.baseRate;
    if (pricing?.ratePerKg !== undefined) updateData.ratePerKg = pricing.ratePerKg;

    await prisma.courier_services.update({
      where: { id },
      data: updateData
    });

    console.log(`[OrderTracking] Courier service updated: ${id}`);

    res.json({
      success: true,
      message: 'Courier service updated successfully'
    });

  } catch (error) {
    console.error('Update courier service error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update courier service'
    });
  }
});

// DELETE /api/v1/admin/courier-services/:id - Delete courier service (soft delete)
router.delete('/admin/courier-services/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if courier service exists
    const existingCourier = await prisma.courier_services.findUnique({
      where: { id }
    });

    if (!existingCourier) {
      return res.status(404).json({
        success: false,
        error: 'Courier service not found'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.courier_services.update({
      where: { id },
      data: { isActive: false }
    });

    console.log(`[OrderTracking] Courier service soft deleted: ${id}`);

    res.json({
      success: true,
      message: 'Courier service deleted successfully'
    });

  } catch (error) {
    console.error('Delete courier service error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete courier service'
    });
  }
});

// POST /api/v1/admin/courier-services/:id/test - Test courier service connection
router.post('/admin/courier-services/:id/test', [
  param('id').isUUID(),
  body('testTrackingNumber').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;
    const { testTrackingNumber } = req.body;

    const result = await courierTrackingService.testCourierConnection(id, testTrackingNumber);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Test courier connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test courier connection'
    });
  }
});

// ============================================================================
// 3. Status Notification Endpoints
// ============================================================================

// POST /api/v1/orders/:id/notifications/subscribe - Subscribe to order notifications
router.post('/:id/notifications/subscribe', [
  param('id').isUUID(),
  body('channels').isArray({ min: 1 }),
  body('channels.*').isIn(['email', 'sms', 'whatsapp', 'push', 'in_app']),
  body('phoneNumber').optional().isString(),
  body('email').optional().isEmail()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { channels, phoneNumber, email } = req.body;
    const userId = req.user.id;

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

    // Check ownership
    const hasAccess = await checkOrderOwnership(id, userId, false);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Create notification subscriptions for each channel
    const subscriptions = [];
    for (const channel of channels) {
      const recipient = channel === 'email' 
        ? email || order.paymentDetails?.email || req.user.email
        : phoneNumber || order.paymentDetails?.phone || req.user.phone;

      if (!recipient) {
        continue;
      }

      const notification = await prisma.order_notifications.create({
        data: {
          orderId: id,
          userId,
          notificationType: 'tracking_update',
          channel,
          recipient,
          subject: `Order ${order.orderNumber} Tracking Update`,
          message: 'You will receive notifications for this order',
          status: 'pending'
        }
      });

      subscriptions.push(notification);
    }

    console.log(`[OrderTracking] Created ${subscriptions.length} notification subscriptions for order ${id}`);

    res.status(201).json({
      success: true,
      subscriptionIds: subscriptions.map(s => s.id),
      message: 'Successfully subscribed to order notifications'
    });

  } catch (error) {
    console.error('Subscribe to notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to notifications'
    });
  }
});

// GET /api/v1/orders/:id/notifications/subscriptions - Get notification subscriptions
router.get('/:id/notifications/subscriptions', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    // Check ownership
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const subscriptions = await prisma.order_notifications.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: subscriptions
    });

  } catch (error) {
    console.error('Get notification subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification subscriptions'
    });
  }
});

// PUT /api/v1/orders/:id/notifications/subscriptions/:subscriptionId - Update subscription
router.put('/:id/notifications/subscriptions/:subscriptionId', [
  param('id').isUUID(),
  param('subscriptionId').isUUID(),
  body('channels').optional().isArray(),
  body('phoneNumber').optional().isString(),
  body('email').optional().isEmail(),
  body('isActive').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, subscriptionId } = req.params;
    const { channels, phoneNumber, email, isActive } = req.body;
    const userId = req.user.id;

    // Check if subscription exists and belongs to order
    const subscription = await prisma.order_notifications.findFirst({
      where: {
        id: subscriptionId,
        orderId: id
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Check ownership
    const hasAccess = await checkOrderOwnership(id, userId, false);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updateData = {};
    if (channels) updateData.channel = channels[0]; // Simplified for single channel
    if (phoneNumber) updateData.recipient = phoneNumber;
    if (email) updateData.recipient = email;
    if (isActive !== undefined) updateData.status = isActive ? 'pending' : 'cancelled';

    await prisma.order_notifications.update({
      where: { id: subscriptionId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Update notification subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subscription'
    });
  }
});

// DELETE /api/v1/orders/:id/notifications/subscriptions/:subscriptionId - Unsubscribe
router.delete('/:id/notifications/subscriptions/:subscriptionId', [
  param('id').isUUID(),
  param('subscriptionId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, subscriptionId } = req.params;
    const userId = req.user.id;

    // Check if subscription exists
    const subscription = await prisma.order_notifications.findFirst({
      where: {
        id: subscriptionId,
        orderId: id
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Check ownership
    const hasAccess = await checkOrderOwnership(id, userId, false);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Soft delete by setting status to cancelled
    await prisma.order_notifications.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled' }
    });

    res.json({
      success: true,
      message: 'Successfully unsubscribed from notifications'
    });

  } catch (error) {
    console.error('Unsubscribe from notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe'
    });
  }
});

// ============================================================================
// 4. Tracking Timeline Endpoints
// ============================================================================

// GET /api/v1/orders/:id/tracking/timeline - Get complete tracking timeline
router.get('/:id/tracking/timeline', [
  param('id').isUUID(),
  query('email').optional().isEmail(),
  query('phone').optional().isString()
], handleValidationErrors, authMiddleware.optional(), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone } = req.query;
    const userId = req.user?.id;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    // Get order
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check access
    if (userId) {
      const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    } else {
      // Guest access verification
      const paymentDetails = order.paymentDetails || {};
      const orderEmail = paymentDetails.email;
      const orderPhone = paymentDetails.phone;
      
      if (email && orderEmail !== email) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      if (phone && orderPhone !== phone) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Get tracking events
    const trackingEvents = await prisma.order_tracking_events.findMany({
      where: { order_id: id },
      orderBy: { event_time: 'asc' }
    });

    // Get fulfillment
    const fulfillment = await prisma.order_fulfillments.findFirst({
      where: { orderId: id },
      include: { courierService: true }
    });

    // Build timeline with icons
    const timeline = [
      // Order created
      {
        timestamp: order.createdAt,
        status: 'order_placed',
        description: 'Order placed',
        location: null,
        icon: 'shopping_cart'
      },
      // Tracking events
      ...trackingEvents.map(e => ({
        timestamp: e.event_time,
        status: e.status,
        description: e.description || e.status,
        location: e.location,
        icon: getTimelineIcon(e.status)
      }))
    ];

    res.json({
      success: true,
      data: {
        timeline,
        currentStatus: order.status,
        estimatedDelivery: fulfillment?.estimatedDelivery || null,
        trackingNumber: fulfillment?.trackingNumber || null,
        courierService: fulfillment?.courierService?.name || null
      }
    });

  } catch (error) {
    console.error('Get tracking timeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking timeline'
    });
  }
});

// GET /api/v1/orders/:id/tracking/events - Get all tracking events
router.get('/:id/tracking/events', [
  param('id').isUUID(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('status').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    // Check ownership
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const where = { order_id: id };
    if (startDate || endDate) {
      where.event_time = {};
      if (startDate) where.event_time.gte = new Date(startDate);
      if (endDate) where.event_time.lte = new Date(endDate);
    }
    if (status) where.status = status;

    const trackingEvents = await prisma.order_tracking_events.findMany({
      where,
      orderBy: { event_time: 'desc' }
    });

    res.json({
      success: true,
      data: trackingEvents
    });

  } catch (error) {
    console.error('Get tracking events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking events'
    });
  }
});

// POST /api/v1/orders/:id/tracking/events - Add tracking event
router.post('/:id/tracking/events', [
  param('id').isUUID(),
  body('status').isString().trim().notEmpty(),
  body('location').optional().isString(),
  body('description').optional().isString(),
  body('eventData').optional().isObject(),
  body('timestamp').optional().isISO8601()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, description, eventData, timestamp } = req.body;
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

    // Get fulfillment
    const fulfillment = await prisma.order_fulfillments.findFirst({
      where: { orderId: id }
    });

    if (!fulfillment) {
      return res.status(400).json({
        success: false,
        error: 'No fulfillment found for this order'
      });
    }

    // Create tracking event
    const trackingEvent = await prisma.order_tracking_events.create({
      data: {
        order_id: id,
        fulfillment_id: fulfillment.id,
        status,
        location,
        description,
        event_time: timestamp ? new Date(timestamp) : new Date(),
        raw_data: eventData
      }
    });

    // Update order status if needed
    let statusUpdated = false;
    const newStatus = mapTrackingStatusToOrderStatus(status);
    if (newStatus && order.status !== newStatus) {
      await prisma.$transaction(async (tx) => {
        const updateData = { status: newStatus };
        if (newStatus === 'shipped') updateData.shippedAt = new Date();
        if (newStatus === 'delivered') updateData.deliveredAt = new Date();

        await tx.order.update({
          where: { id },
          data: updateData
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            previousStatus: order.status,
            newStatus,
            changedBy: adminId,
            reason: `Tracking event: ${status}`,
            metadata: { trackingEventId: trackingEvent.id }
          }
        });
      });
      statusUpdated = true;
    }

    console.log(`[OrderTracking] Tracking event created: ${trackingEvent.id} for order ${id}`);

    res.status(201).json({
      success: true,
      eventId: trackingEvent.id,
      statusUpdated,
      message: 'Tracking event added successfully'
    });

  } catch (error) {
    console.error('Add tracking event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tracking event'
    });
  }
});

// GET /api/v1/orders/:id/tracking/milestones - Get tracking milestones
router.get('/:id/tracking/milestones', [
  param('id').isUUID(),
  query('email').optional().isEmail(),
  query('phone').optional().isString()
], handleValidationErrors, authMiddleware.optional(), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone } = req.query;
    const userId = req.user?.id;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    // Get order
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check access
    if (userId) {
      const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    } else {
      // Guest access verification
      const paymentDetails = order.paymentDetails || {};
      const orderEmail = paymentDetails.email;
      const orderPhone = paymentDetails.phone;
      
      if (email && orderEmail !== email) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      if (phone && orderPhone !== phone) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    // Define milestones
    const milestones = [
      { name: 'Order Placed', key: 'pending' },
      { name: 'Order Confirmed', key: 'confirmed' },
      { name: 'Processing', key: 'processing' },
      { name: 'Shipped', key: 'shipped' },
      { name: 'Delivered', key: 'delivered' }
    ];

    // Get status history to determine completed milestones
    const statusHistory = await prisma.order_status_histories.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' }
    });

    const completedStatuses = new Set([order.status, ...statusHistory.map(h => h.newStatus)]);

    // Build milestones with completion status
    const milestoneData = milestones.map(m => ({
      name: m.name,
      status: completedStatuses.has(m.key) ? 'completed' : 'pending',
      completedAt: m.key === order.status ? order.updatedAt : 
                  statusHistory.find(h => h.newStatus === m.key)?.createdAt || null,
      estimatedAt: m.key === 'delivered' ? order.deliveredAt : null
    }));

    // Calculate progress
    const completedCount = milestoneData.filter(m => m.status === 'completed').length;
    const progress = Math.round((completedCount / milestones.length) * 100);

    res.json({
      success: true,
      data: {
        milestones: milestoneData,
        progress
      }
    });

  } catch (error) {
    console.error('Get tracking milestones error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking milestones'
    });
  }
});

// ============================================================================
// 5. Delivery Confirmation Endpoints
// ============================================================================

// POST /api/v1/orders/:id/delivery/confirm - Confirm delivery
router.post('/:id/delivery/confirm', [
  param('id').isUUID(),
  body('recipientName').isString().trim().notEmpty(),
  body('recipientPhone').optional().isString(),
  body('signature').optional().isString(),
  body('photo').optional().isString(),
  body('notes').optional().isString(),
  body('location').optional().isObject()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientName, recipientPhone, signature, photo, notes, location } = req.body;
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

    // Get fulfillment
    const fulfillment = await prisma.order_fulfillments.findFirst({
      where: { orderId: id }
    });

    if (!fulfillment) {
      return res.status(400).json({
        success: false,
        error: 'No fulfillment found for this order'
      });
    }

    // Use transaction for delivery confirmation
    await prisma.$transaction(async (tx) => {
      // Create delivery confirmation
      await tx.delivery_confirmations.create({
        data: {
          orderId: id,
          fulfillmentId: fulfillment.id,
          confirmedBy: adminId,
          recipientName,
          recipientPhone,
          signatureUrl: signature,
          photos: photo ? [photo] : [],
          deliveryNotes: notes,
          deliveryLocation: location ? JSON.stringify(location) : null
        }
      });

      // Update order status to delivered
      await tx.order.update({
        where: { id },
        data: {
          status: 'delivered',
          deliveredAt: new Date()
        }
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: order.status,
          newStatus: 'delivered',
          changedBy: adminId,
          reason: 'Delivery confirmed',
          metadata: { recipientName, recipientPhone }
        }
      });

      // Create notification
      await tx.orderNotification.create({
        data: {
          orderId: id,
          userId: order.userId,
          notificationType: 'order_delivered',
          channel: 'email',
          recipient: order.paymentDetails?.email || order.user?.email,
          subject: `Order ${order.orderNumber} Delivered`,
          message: `Your order has been delivered to ${recipientName}`,
          status: 'pending'
        }
      });
    });

    console.log(`[OrderTracking] Delivery confirmed for order ${id} by admin ${adminId}`);

    res.status(201).json({
      success: true,
      message: 'Delivery confirmed successfully'
    });

  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm delivery'
    });
  }
});

// GET /api/v1/orders/:id/delivery/confirmation - Get delivery confirmation details
router.get('/:id/delivery/confirmation', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user?.role?.toUpperCase() === 'ADMIN';

    // Check ownership
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const confirmation = await prisma.delivery_confirmations.findFirst({
      where: { orderId: id }
    });

    if (!confirmation) {
      return res.status(404).json({
        success: false,
        error: 'Delivery confirmation not found'
      });
    }

    res.json({
      success: true,
      data: {
        confirmationId: confirmation.id,
        recipientName: confirmation.recipientName,
        recipientPhone: confirmation.recipientPhone,
        confirmedAt: confirmation.confirmedAt,
        signature: confirmation.signatureUrl,
        photo: confirmation.photos,
        notes: confirmation.deliveryNotes,
        location: confirmation.deliveryLocation ? JSON.parse(confirmation.deliveryLocation) : null
      }
    });

  } catch (error) {
    console.error('Get delivery confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery confirmation'
    });
  }
});

// POST /api/v1/orders/:id/delivery/otp/verify - Verify OTP for delivery
router.post('/:id/delivery/otp/verify', [
  param('id').isUUID(),
  body('otp').isString().trim().notEmpty()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const userId = req.user.id;

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id },
      include: { users: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check ownership
    if (order.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get delivery confirmation with OTP
    const confirmation = await prisma.delivery_confirmations.findFirst({
      where: { orderId: id }
    });

    if (!confirmation || !confirmation.otpCode) {
      return res.status(400).json({
        success: false,
        error: 'No OTP generated for this order'
      });
    }

    // Verify OTP (simplified - in production, use proper OTP verification)
    if (confirmation.otpCode !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    // Confirm delivery
    await prisma.$transaction(async (tx) => {
      await tx.delivery_confirmations.update({
        where: { id: confirmation.id },
        data: { confirmedAt: new Date() }
      });

      await tx.order.update({
        where: { id },
        data: {
          status: 'delivered',
          deliveredAt: new Date()
        }
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: order.status,
          newStatus: 'delivered',
          changedBy: userId,
          reason: 'Delivery confirmed via OTP'
        }
      });
    });

    res.json({
      success: true,
      message: 'Delivery confirmed successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

// POST /api/v1/orders/:id/delivery/otp/send - Send OTP for delivery confirmation
router.post('/:id/delivery/otp/send', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
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

    // Get fulfillment
    const fulfillment = await prisma.order_fulfillments.findFirst({
      where: { orderId: id }
    });

    if (!fulfillment) {
      return res.status(400).json({
        success: false,
        error: 'No fulfillment found for this order'
      });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create or update delivery confirmation with OTP
    await prisma.delivery_confirmations.upsert({
      where: { orderId: id },
      update: { otpCode },
      create: {
        orderId: id,
        fulfillmentId: fulfillment.id,
        confirmedBy: adminId,
        otpCode,
        confirmationMethod: 'otp'
      }
    });

    // Send OTP to customer (simplified - integrate with SMS service)
    console.log(`[OrderTracking] OTP ${otpCode} generated for order ${id}`);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
});

// ============================================================================
// 6. Webhook Endpoints
// ============================================================================

// POST /api/v1/webhooks/courier/:courierServiceId/tracking - Courier tracking webhook
router.post('/webhooks/courier/:courierServiceId/tracking', [
  param('courierServiceId').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { courierServiceId } = req.params;
    const webhookData = req.body;

    // Verify courier service exists
    const courierService = await prisma.courier_services.findUnique({
      where: { id: courierServiceId }
    });

    if (!courierService) {
      return res.status(404).json({
        success: false,
        error: 'Courier service not found'
      });
    }

    // Extract order ID and tracking number from webhook data
    // This depends on the courier's webhook format
    const orderId = webhookData.orderId || webhookData.order_id;
    const trackingNumber = webhookData.trackingNumber || webhookData.tracking_number;

    if (!orderId || !trackingNumber) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook data'
      });
    }

    // Sync tracking from courier
    const syncResult = await courierTrackingService.syncTrackingFromCourier(
      orderId,
      courierServiceId,
      trackingNumber
    );

    if (syncResult.success) {
      console.log(`[OrderTracking] Webhook processed for order ${orderId}, synced ${syncResult.syncedEventsCount} events`);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Courier tracking webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

// POST /api/v1/webhooks/courier/:courierServiceId/status - Courier status webhook
router.post('/webhooks/courier/:courierServiceId/status', [
  param('courierServiceId').isUUID()
], handleValidationErrors, async (req, res) => {
  try {
    const { courierServiceId } = req.params;
    const webhookData = req.body;

    // Verify courier service exists
    const courierService = await prisma.courier_services.findUnique({
      where: { id: courierServiceId }
    });

    if (!courierService) {
      return res.status(404).json({
        success: false,
        error: 'Courier service not found'
      });
    }

    // Extract order ID from webhook data
    const orderId = webhookData.orderId || webhookData.order_id;
    const status = webhookData.status;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook data'
      });
    }

    // Get order
    const order = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Map courier status to order status
    const newStatus = mapTrackingStatusToOrderStatus(status);

    if (newStatus && order.status !== newStatus) {
      await prisma.$transaction(async (tx) => {
        const updateData = { status: newStatus };
        if (newStatus === 'shipped') updateData.shippedAt = new Date();
        if (newStatus === 'delivered') updateData.deliveredAt = new Date();

        await tx.order.update({
          where: { id: orderId },
          data: updateData
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            previousStatus: order.status,
            newStatus,
            reason: `Status update from ${courierService.name} webhook`,
            metadata: { courierStatus: status, webhookData }
          }
        });
      });

      console.log(`[OrderTracking] Order ${orderId} status updated to ${newStatus} via webhook`);
    }

    res.json({
      success: true,
      message: 'Status webhook processed successfully'
    });

  } catch (error) {
    console.error('Courier status webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook'
    });
  }
});

// ============================================================================
// 7. Tracking Analytics Endpoints
// ============================================================================

// GET /api/v1/admin/tracking/analytics - Get tracking analytics
router.get('/admin/tracking/analytics', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('courierServiceId').optional().isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { startDate, endDate, courierServiceId } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }
    if (courierServiceId) {
      where.courierServiceId = courierServiceId;
    }

    // Get tracking events
    const trackingEvents = await prisma.order_tracking_events.findMany({
      where,
      include: {
        order: {
          select: { status: true, createdAt: true, deliveredAt: true }
        }
      }
    });

    // Calculate analytics
    const totalTracked = trackingEvents.length;
    const deliveredOrders = trackingEvents.filter(e => e.order.status === 'delivered');
    const onTimeDeliveries = deliveredOrders.filter(e => {
      if (!e.order.estimatedDelivery) return true;
      return e.order.deliveredAt <= e.order.estimatedDelivery;
    });

    const onTimeRate = deliveredOrders.length > 0 
      ? (onTimeDeliveries.length / deliveredOrders.length) * 100 
      : 0;
    const delayedRate = 100 - onTimeRate;

    // Calculate average delivery time
    const deliveryTimes = deliveredOrders
      .map(e => {
        if (e.order.deliveredAt && e.order.createdAt) {
          return (e.order.deliveredAt - e.order.createdAt) / (1000 * 60 * 60); // hours
        }
        return null;
      })
      .filter(t => t !== null);
    
    const averageDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length
      : 0;

    // Group by courier
    const byCourier = {};
    trackingEvents.forEach(e => {
      if (!byCourier[e.order_id]) {
        byCourier[e.order_id] = 0;
      }
      byCourier[e.order_id]++;
    });

    // Group by status
    const byStatus = {};
    trackingEvents.forEach(e => {
      if (!byStatus[e.status]) {
        byStatus[e.status] = 0;
      }
      byStatus[e.status]++;
    });

    res.json({
      success: true,
      data: {
        totalTracked,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
        delayedRate: Math.round(delayedRate * 100) / 100,
        averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
        byCourier,
        byStatus
      }
    });

  } catch (error) {
    console.error('Get tracking analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking analytics'
    });
  }
});

// GET /api/v1/admin/tracking/issues - Get tracking issues
router.get('/admin/tracking/issues', [
  query('status').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('courierServiceId').optional().isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { status, startDate, endDate, courierServiceId } = req.query;

    const where = {
      status: { in: ['pending', 'processing', 'shipped'] } // Not delivered
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (status) where.status = status;

    const orders = await prisma.orders.findMany({
      where,
      include: {
        fulfillments: {
          where: courierServiceId ? { courierServiceId } : undefined,
          include: { courierService: true }
        },
        trackingEvents: {
          orderBy: { eventTime: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Identify issues
    const issues = orders.filter(order => {
      const daysSinceCreated = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      // Orders pending for more than 7 days
      if (order.status === 'pending' && daysSinceCreated > 7) {
        return true;
      }
      
      // Orders in transit for more than 14 days
      if (order.status === 'shipped' && daysSinceCreated > 14) {
        return true;
      }
      
      // Orders with no tracking events
      if (order.fulfillments.length > 0 && order.trackingEvents.length === 0) {
        return true;
      }
      
      return false;
    });

    res.json({
      success: true,
      data: issues.map(order => ({
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        trackingNumber: order.fulfillments[0]?.trackingNumber,
        courierService: order.fulfillments[0]?.courierService?.name,
        issue: identifyOrderIssue(order)
      }))
    });

  } catch (error) {
    console.error('Get tracking issues error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking issues'
    });
  }
});

// GET /api/v1/admin/delivery/performance - Get delivery performance metrics
router.get('/admin/delivery/performance', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('courierServiceId').optional().isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { startDate, endDate, courierServiceId } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.deliveredAt = {};
      if (startDate) where.deliveredAt.gte = new Date(startDate);
      if (endDate) where.deliveredAt.lte = new Date(endDate);
    }
    if (courierServiceId) {
      where.fulfillments = {
        some: { courierServiceId }
      };
    }

    // Get delivered orders
    const deliveredOrders = await prisma.orders.findMany({
      where: {
        status: 'delivered',
        ...where
      },
      include: {
        fulfillments: {
          include: { courierService: true }
        }
      }
    });

    // Calculate performance metrics
    const totalDeliveries = deliveredOrders.length;
    
    const onTimeDeliveries = deliveredOrders.filter(order => {
      const fulfillment = order.fulfillments[0];
      if (!fulfillment || !fulfillment.estimatedDelivery) return true;
      return order.deliveredAt <= fulfillment.estimatedDelivery;
    });

    const lateDeliveries = totalDeliveries - onTimeDeliveries.length;
    const failedDeliveries = 0; // Would need separate tracking for failed deliveries

    // Calculate average delivery time
    const deliveryTimes = deliveredOrders
      .map(order => {
        if (order.deliveredAt && order.createdAt) {
          return (order.deliveredAt - order.createdAt) / (1000 * 60 * 60); // hours
        }
        return null;
      })
      .filter(t => t !== null);

    const averageDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length
      : 0;

    // Group by courier
    const byCourier = {};
    deliveredOrders.forEach(order => {
      const courier = order.fulfillments[0]?.courierService;
      if (courier) {
        if (!byCourier[courier.name]) {
          byCourier[courier.name] = { total: 0, onTime: 0 };
        }
        byCourier[courier.name].total++;
        
        if (courier.estimatedDelivery && order.deliveredAt <= courier.estimatedDelivery) {
          byCourier[courier.name].onTime++;
        }
      }
    });

    // Group by region (simplified - using division from address)
    const byRegion = {};
    deliveredOrders.forEach(order => {
      const region = order.address?.division || 'Unknown';
      if (!byRegion[region]) {
        byRegion[region] = 0;
      }
      byRegion[region]++;
    });

    res.json({
      success: true,
      data: {
        totalDeliveries,
        onTimeDeliveries: onTimeDeliveries.length,
        lateDeliveries,
        failedDeliveries,
        averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
        byCourier,
        byRegion
      }
    });

  } catch (error) {
    console.error('Get delivery performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery performance'
    });
  }
});

// ============================================================================
// 8. Bulk Tracking Operations
// ============================================================================

// POST /api/v1/admin/tracking/sync-all - Sync tracking for all active orders
router.post('/admin/tracking/sync-all', [
  body('courierServiceId').optional().isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { courierServiceId } = req.body;

    // Get active orders with fulfillment
    const where = {
      status: { in: ['confirmed', 'processing', 'shipped'] }
    };

    const orders = await prisma.orders.findMany({
      where,
      include: {
        fulfillments: {
          where: courierServiceId ? { courierServiceId } : undefined,
          include: { courierService: true }
        }
      }
    });

    let syncedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Sync tracking for each order
    for (const order of orders) {
      const fulfillment = order.fulfillments[0];
      
      if (!fulfillment || !fulfillment.trackingNumber || !fulfillment.courierServiceId) {
        continue;
      }

      try {
        const result = await courierTrackingService.syncTrackingFromCourier(
          order.id,
          fulfillment.courierServiceId,
          fulfillment.trackingNumber
        );

        if (result.success) {
          syncedCount++;
        } else {
          failedCount++;
          errors.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            error: result.error
          });
        }
      } catch (error) {
        failedCount++;
        errors.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          error: error.message
        });
      }
    }

    console.log(`[OrderTracking] Bulk sync completed: ${syncedCount} synced, ${failedCount} failed`);

    res.json({
      success: true,
      syncedCount,
      failedCount,
      errors
    });

  } catch (error) {
    console.error('Bulk sync tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync tracking'
    });
  }
});

// POST /api/v1/admin/tracking/bulk-update - Bulk update tracking information
router.post('/admin/tracking/bulk-update', [
  body('orderIds').isArray({ min: 1 }),
  body('orderIds.*').isUUID(),
  body('trackingNumbers').isArray()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { orderIds, trackingNumbers } = req.body;

    let updatedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Update tracking for each order
    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      const trackingData = trackingNumbers[i];

      try {
        const fulfillment = await prisma.order_fulfillments.findFirst({
          where: { orderId }
        });

        if (!fulfillment) {
          failedCount++;
          errors.push({
            orderId,
            error: 'No fulfillment found'
          });
          continue;
        }

        await prisma.order_fulfillments.update({
          where: { id: fulfillment.id },
          data: {
            trackingNumber: trackingData.trackingNumber,
            courierServiceId: trackingData.courierServiceId
          }
        });

        updatedCount++;
      } catch (error) {
        failedCount++;
        errors.push({
          orderId,
          error: error.message
        });
      }
    }

    console.log(`[OrderTracking] Bulk update completed: ${updatedCount} updated, ${failedCount} failed`);

    res.json({
      success: true,
      updatedCount,
      failedCount,
      errors
    });

  } catch (error) {
    console.error('Bulk update tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update tracking'
    });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get timeline icon based on status
 */
function getTimelineIcon(status) {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('pending') || statusLower.includes('placed')) {
    return 'clock';
  } else if (statusLower.includes('confirmed')) {
    return 'check_circle';
  } else if (statusLower.includes('processing') || statusLower.includes('picked')) {
    return 'inventory';
  } else if (statusLower.includes('shipped') || statusLower.includes('transit')) {
    return 'local_shipping';
  } else if (statusLower.includes('delivered')) {
    return 'done_all';
  } else if (statusLower.includes('out for delivery')) {
    return 'delivery_dining';
  }
  
  return 'info';
}

/**
 * Map tracking status to order status
 */
function mapTrackingStatusToOrderStatus(trackingStatus) {
  const status = trackingStatus.toLowerCase();
  
  if (status.includes('delivered')) {
    return 'delivered';
  } else if (status.includes('shipped') || status.includes('out for delivery') || 
             status.includes('in transit') || status.includes('on the way')) {
    return 'shipped';
  } else if (status.includes('processing') || status.includes('picked')) {
    return 'processing';
  } else if (status.includes('confirmed')) {
    return 'confirmed';
  }
  
  return null;
}

/**
 * Identify order issue
 */
function identifyOrderIssue(order) {
  const daysSinceCreated = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  if (order.status === 'pending' && daysSinceCreated > 7) {
    return 'Order pending for too long';
  }
  
  if (order.status === 'shipped' && daysSinceCreated > 14) {
    return 'Order in transit for too long';
  }
  
  if (order.fulfillments.length > 0 && order.trackingEvents.length === 0) {
    return 'No tracking events available';
  }
  
  return 'Unknown issue';
}

module.exports = router;
