const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../../middleware/auth');
const courierTrackingService = require('../../services/courierTrackingService');

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

// ============================================================================
// 1. Tracking Analytics Endpoints
// ============================================================================

// GET /api/v1/admin/tracking/analytics - Get tracking analytics
router.get('/analytics', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('courierServiceId').optional().isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { startDate, endDate, courierServiceId } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.event_time = {};
      if (startDate) where.event_time.gte = new Date(startDate);
      if (endDate) where.event_time.lte = new Date(endDate);
    }
    if (courierServiceId) {
      where.order_fulfillments = {
        courier_service_id: courierServiceId
      };
    }

    // Get tracking events
    const trackingEvents = await prisma.order_tracking_events.findMany({
      where,
      include: {
        orders: {
          select: { status: true, createdAt: true, deliveredAt: true }
        },
        order_fulfillments: {
          include: {
            courier_services: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Calculate analytics
    const totalTracked = trackingEvents.length;
    const deliveredOrders = trackingEvents.filter(e => e.orders?.status === 'delivered');
    const onTimeDeliveries = deliveredOrders.filter(e => {
      // estimatedDelivery is on fulfillment, not order
      if (!e.order_fulfillments || !e.order_fulfillments.estimated_delivery) return true;
      return e.orders?.deliveredAt <= e.order_fulfillments.estimated_delivery;
    });

    const onTimeRate = deliveredOrders.length > 0 
      ? (onTimeDeliveries.length / deliveredOrders.length) * 100 
      : 0;
    const delayedRate = 100 - onTimeRate;

    // Calculate average delivery time
    const deliveryTimes = deliveredOrders
      .map(e => {
        if (e.orders?.deliveredAt && e.orders?.createdAt) {
          return (e.orders.deliveredAt - e.orders.createdAt) / (1000 * 60 * 60); // hours
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
      const courierName = e.order_fulfillments?.courier_services?.name || 'Unknown';
      if (!byCourier[courierName]) {
        byCourier[courierName] = 0;
      }
      byCourier[courierName]++;
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
router.get('/issues', [
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
    
    // Get orders
    const orders = await prisma.orders.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Get order IDs for filtering
    const orderIds = orders.map(o => o.id);
    
    // Get fulfillments separately
    const fulfillmentsMap = new Map();
    if (orderIds.length > 0) {
      const fulfillmentWhere = { order_id: { in: orderIds } };
      if (courierServiceId) {
        fulfillmentWhere.courier_service_id = courierServiceId;
      }
      
      const fulfillments = await prisma.order_fulfillments.findMany({
        where: fulfillmentWhere,
        include: { courier_services: true }
      });
      
      // Group by order_id
      fulfillments.forEach(fulfillment => {
        if (!fulfillmentsMap.has(fulfillment.order_id)) {
          fulfillmentsMap.set(fulfillment.order_id, []);
        }
        fulfillmentsMap.get(fulfillment.order_id).push(fulfillment);
      });
    }

    // Get tracking events for these orders separately
    const trackingEventsMap = new Map();
    if (orderIds.length > 0) {
      const trackingEvents = await prisma.order_tracking_events.findMany({
        where: { order_id: { in: orderIds } },
        orderBy: { event_time: 'desc' }
      });
      
      // Group by order_id and get the most recent event
      trackingEvents.forEach(event => {
        if (!trackingEventsMap.has(event.order_id)) {
          trackingEventsMap.set(event.order_id, event);
        }
      });
    }

    // Identify issues
    const issues = orders.filter(order => {
      const daysSinceCreated = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const orderFulfillments = fulfillmentsMap.get(order.id) || [];
      
      // Orders pending for more than 7 days
      if (order.status === 'pending' && daysSinceCreated > 7) {
        return true;
      }
      
      // Orders in transit for more than 14 days
      if (order.status === 'shipped' && daysSinceCreated > 14) {
        return true;
      }
      
      // Orders with no tracking events
      if (orderFulfillments.length > 0 && !trackingEventsMap.has(order.id)) {
        return true;
      }
      
      return false;
    });

    res.json({
      success: true,
      data: issues.map(order => {
        const orderFulfillments = fulfillmentsMap.get(order.id) || [];
        return {
          order_id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
          trackingNumber: orderFulfillments[0]?.tracking_number,
          courierService: orderFulfillments[0]?.courier_services?.name,
          issue: identifyOrderIssue(order, orderFulfillments, trackingEventsMap.has(order.id))
        };
      })
    });

  } catch (error) {
    console.error('Get tracking issues error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking issues',
      details: error.message
    });
  }
});

// GET /api/v1/admin/tracking/performance - Get delivery performance metrics
router.get('/performance', [
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

    // Get delivered orders
    const deliveredOrders = await prisma.orders.findMany({
      where: {
        status: 'delivered',
        ...where
      },
      include: {
        addresses: true
      }
    });

    // Get fulfillments for these orders
    const orderIds = deliveredOrders.map(o => o.id);
    const fulfillmentsMap = new Map();
    if (orderIds.length > 0) {
      const fulfillmentWhere = { order_id: { in: orderIds } };
      if (courierServiceId) {
        fulfillmentWhere.courier_service_id = courierServiceId;
      }
      
      const fulfillments = await prisma.order_fulfillments.findMany({
        where: fulfillmentWhere,
        include: {
          courier_services: {
            select: { name: true }
          }
        }
      });
      
      // Group by orderId
      fulfillments.forEach(fulfillment => {
        fulfillmentsMap.set(fulfillment.order_id, fulfillment);
      });
    }

    // Filter orders by courier service if specified
    const filteredOrders = courierServiceId 
      ? deliveredOrders.filter(order => {
          const fulfillment = fulfillmentsMap.get(order.id);
          return fulfillment && fulfillment.courier_service_id === courierServiceId;
        })
      : deliveredOrders;

    // Calculate performance metrics
    const totalDeliveries = filteredOrders.length;
    
    const onTimeDeliveries = filteredOrders.filter(order => {
      const fulfillment = fulfillmentsMap.get(order.id);
      if (!fulfillment || !fulfillment.estimated_delivery) return true;
      return order.deliveredAt <= fulfillment.estimated_delivery;
    });

    const lateDeliveries = totalDeliveries - onTimeDeliveries.length;
    const failedDeliveries = 0; // Would need separate tracking for failed deliveries

    // Calculate average delivery time
    const deliveryTimes = filteredOrders
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
    filteredOrders.forEach(order => {
      const fulfillment = fulfillmentsMap.get(order.id);
      const courier = fulfillment?.courier_services;
      if (courier) {
        if (!byCourier[courier.name]) {
          byCourier[courier.name] = { total: 0, onTime: 0 };
        }
        byCourier[courier.name].total++;
        
        // estimated_delivery is on fulfillment, not courier
        if (fulfillment?.estimated_delivery && order.deliveredAt <= fulfillment.estimated_delivery) {
          byCourier[courier.name].onTime++;
        }
      }
    });

    // Group by region (simplified - using division from address)
    const byRegion = {};
    filteredOrders.forEach(order => {
      const region = order.addresses?.division || 'Unknown';
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
// 2. Issue Management Operations
// ============================================================================

// POST /api/v1/admin/tracking/issues/investigate - Investigate tracking issues
router.post('/issues/investigate', [
  body('orderIds').isArray({ min: 1 }),
  body('orderIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { orderIds } = req.body;

    let investigatedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Mark orders as under investigation
    for (const orderId of orderIds) {
      try {
        // Add a tracking event to indicate investigation started
        await prisma.order_tracking_events.create({
          data: {
            order_id: orderId,
            fulfillment_id: null,
            status: 'investigation_started',
            description: 'Admin started investigation for tracking issue',
            event_time: new Date()
          }
        });

        investigatedCount++;
      } catch (error) {
        failedCount++;
        errors.push({
          orderId,
          error: error.message
        });
      }
    }

    console.log(`[OrderTracking] Bulk investigate completed: ${investigatedCount} investigated, ${failedCount} failed`);

    res.json({
      success: true,
      investigatedCount,
      failedCount,
      errors
    });

  } catch (error) {
    console.error('Bulk investigate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to investigate issues'
    });
  }
});

// POST /api/v1/admin/tracking/issues/resolve - Resolve tracking issues
router.post('/issues/resolve', [
  body('orderIds').isArray({ min: 1 }),
  body('orderIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { orderIds } = req.body;

    let resolvedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Mark orders as resolved
    for (const orderId of orderIds) {
      try {
        // Add a tracking event to indicate issue resolved
        await prisma.order_tracking_events.create({
          data: {
            order_id: orderId,
            fulfillment_id: null,
            status: 'issue_resolved',
            description: 'Admin resolved tracking issue',
            event_time: new Date()
          }
        });

        resolvedCount++;
      } catch (error) {
        failedCount++;
        errors.push({
          orderId,
          error: error.message
        });
      }
    }

    console.log(`[OrderTracking] Bulk resolve completed: ${resolvedCount} resolved, ${failedCount} failed`);

    res.json({
      success: true,
      resolvedCount,
      failedCount,
      errors
    });

  } catch (error) {
    console.error('Bulk resolve error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve issues'
    });
  }
});

// ============================================================================
// 3. Bulk Tracking Operations
// ============================================================================

// POST /api/v1/admin/tracking/sync-all - Sync tracking for all active orders
router.post('/sync-all', [
  body('courierServiceId').optional().isUUID(),
  body('orderStatus').optional().isIn(['confirmed', 'processing', 'shipped'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { courierServiceId, orderStatus } = req.body;

    // Get active orders
    const where = {
      status: { in: orderStatus ? [orderStatus] : ['confirmed', 'processing', 'shipped'] }
    };
    
    const orders = await prisma.orders.findMany({
      where
    });

    // Get fulfillments for these orders
    const orderIds = orders.map(o => o.id);
    const fulfillmentsMap = new Map();
    if (orderIds.length > 0) {
      const fulfillmentWhere = { order_id: { in: orderIds } };
      if (courierServiceId) {
        fulfillmentWhere.courier_service_id = courierServiceId;
      }
      
      const fulfillments = await prisma.order_fulfillments.findMany({
        where: fulfillmentWhere,
        include: { courier_services: true }
      });
      
      // Group by order_id
      fulfillments.forEach(fulfillment => {
        fulfillmentsMap.set(fulfillment.order_id, fulfillment);
      });
    }

    let syncedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Sync tracking for each order
    for (const order of orders) {
      const fulfillment = fulfillmentsMap.get(order.id);
      
      if (!fulfillment || !fulfillment.tracking_number || !fulfillment.courier_service_id) {
        continue;
      }

      // Filter by courier service if specified
      if (courierServiceId && fulfillment.courier_service_id !== courierServiceId) {
        continue;
      }

      try {
        const result = await courierTrackingService.syncTrackingFromCourier(
          order.id,
          fulfillment.courier_service_id,
          fulfillment.tracking_number
        );

        if (result.success) {
          syncedCount++;
        } else {
          failedCount++;
          errors.push({
            order_id: order.id,
            orderNumber: order.orderNumber,
            error: result.error
          });
        }
      } catch (error) {
        failedCount++;
        errors.push({
          order_id: order.id,
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
router.post('/bulk-update', [
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
          where: { order_id: orderId }
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
            tracking_number: trackingData.trackingNumber,
            courier_service_id: trackingData.courierServiceId
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
 * Identify order issue
 */
function identifyOrderIssue(order, fulfillments, hasTrackingEvents) {
  const daysSinceCreated = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  
  if (order.status === 'pending' && daysSinceCreated > 7) {
    return 'Order pending for too long';
  }
  
  if (order.status === 'shipped' && daysSinceCreated > 14) {
    return 'Order in transit for too long';
  }
  
  if (fulfillments.length > 0 && !hasTrackingEvents) {
    return 'No tracking events available';
  }
  
  return 'Unknown issue';
}

module.exports = router;
