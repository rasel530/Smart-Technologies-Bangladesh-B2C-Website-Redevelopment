/**
 * Admin Delivery Routes
 * 
 * API endpoints for managing delivery performance metrics
 * and delivery-related operations.
 * 
 * @module routes/admin/delivery
 */

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

/**
 * GET /api/v1/admin/delivery/performance
 * Get delivery performance metrics
 * 
 * NOTE: This endpoint is deprecated and redirects to /api/v1/admin/tracking/performance
 * The tracking endpoint has full filter support and uses real database data.
 */
router.get('/performance',
  authMiddleware.authenticate(),
  authMiddleware.adminOnly(),
  async (req, res) => {
    try {
      // Redirect to working tracking endpoint with all query parameters
      const queryParams = new URLSearchParams(req.query).toString();
      const redirectUrl = `/api/v1/admin/tracking/performance${queryParams ? '?' + queryParams : ''}`;
      
      // For backward compatibility, we'll proxy request to tracking endpoint
      // instead of using HTTP redirect (which would change the URL in the client)
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const { startDate, endDate, courierServiceId } = req.query;
      
      const where = {};
      if (startDate || endDate) {
        where.deliveredAt = {};
        if (startDate) where.deliveredAt.gte = new Date(startDate);
        if (endDate) where.deliveredAt.lte = new Date(endDate);
      }
      
      if (courierServiceId) {
        where.courier_service_id = courierServiceId;
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
      
      // Calculate metrics
      const totalDeliveries = deliveredOrders.length;
      
      // Get fulfillments for these orders
      const orderIds = deliveredOrders.map(o => o.id);
      const fulfillmentsMap = new Map();
      if (orderIds.length > 0) {
        const fulfillments = await prisma.order_fulfillments.findMany({
          where: { order_id: { in: orderIds } },
          include: { courier_services: true }
        });
        fulfillments.forEach(f => fulfillmentsMap.set(f.order_id, f));
      }
      
      const onTimeDeliveries = deliveredOrders.filter(order => {
        const fulfillment = fulfillmentsMap.get(order.id);
        if (!order.deliveredAt || !fulfillment?.estimated_delivery) return false;
        return new Date(order.deliveredAt) <= new Date(fulfillment.estimated_delivery);
      }).length;
      const lateDeliveries = totalDeliveries - onTimeDeliveries;
      const failedDeliveries = 0;
      
      // Calculate average delivery time
      const deliveryTimes = deliveredOrders
        .filter(order => order.deliveredAt && order.createdAt)
        .map(order => {
          const deliveredAt = new Date(order.deliveredAt);
          const createdAt = new Date(order.createdAt);
          return (deliveredAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // hours
        });
      
      const averageDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
        : 0;
      
      // Group by courier
      const byCourier = {};
      deliveredOrders.forEach(order => {
        const fulfillment = fulfillmentsMap.get(order.id);
        if (fulfillment?.courier_services) {
          const courierId = fulfillment.courier_services.id;
          const courierName = fulfillment.courier_services.name;
          if (!byCourier[courierId]) {
            byCourier[courierId] = { name: courierName, total: 0, onTime: 0 };
          }
          byCourier[courierId].total++;
          
          if (order.deliveredAt && fulfillment?.estimated_delivery) {
            if (new Date(order.deliveredAt) <= new Date(fulfillment.estimated_delivery)) {
              byCourier[courierId].onTime++;
            }
          }
        }
      });
      
      // Group by region
      const byRegion = {};
      deliveredOrders.forEach(order => {
        if (order.addresses?.city) {
          const city = order.addresses.city;
          byRegion[city] = (byRegion[city] || 0) + 1;
        }
      });
      
      res.json({
        success: true,
        data: {
          totalDeliveries,
          onTimeDeliveries,
          lateDeliveries,
          failedDeliveries,
          averageDeliveryTime,
          byCourier,
          byRegion
        }
      });
    } catch (error) {
      console.error('Get delivery performance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch delivery performance data',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// ============================================================================
// Delivery Confirmations Endpoints
// ============================================================================

/**
 * GET /api/v1/admin/delivery/confirmations
 * Get paginated list of delivery confirmations with filters
 * 
 * Query parameters:
 * - startDate: ISO8601 date string (optional) - Filter by confirmation date
 * - endDate: ISO8601 date string (optional) - Filter by confirmation date
 * - courierServiceId: UUID (optional) - Filter by courier service
 * - search: string (optional) - Search in recipient name, phone, or notes
 * - page: number (optional, default: 1) - Page number for pagination
 * - limit: number (optional, default: 20) - Items per page
 * - sortBy: string (optional, default: confirmed_at) - Field to sort by
 * - sortOrder: string (optional, default: desc) - Sort direction (asc/desc)
 */
router.get('/confirmations', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('courierServiceId').optional().isUUID(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['confirmed_at', 'confirmedAt', 'created_at', 'createdAt', 'recipient_name', 'recipientName']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    // Map camelCase to snake_case for database queries
    let {
      startDate,
      endDate,
      courierServiceId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'confirmed_at',
      sortOrder = 'desc'
    } = req.query;
    
    // Convert sortBy to snake_case for database
    if (sortBy === 'confirmedAt') sortBy = 'confirmed_at';
    else if (sortBy === 'createdAt') sortBy = 'created_at';
    else if (sortBy === 'recipientName') sortBy = 'recipient_name';

    // Build where clause
    const where = {};

    // Date range filter
    if (startDate || endDate) {
      where.confirmed_at = {};
      if (startDate) where.confirmed_at.gte = new Date(startDate);
      if (endDate) where.confirmed_at.lte = new Date(endDate);
    }

    // Search filter - search in recipient name, phone, or notes
    if (search) {
      where.OR = [
        { recipient_name: { contains: search, mode: 'insensitive' } },
        { recipient_phone: { contains: search, mode: 'insensitive' } },
        { delivery_notes: { contains: search, mode: 'insensitive' } },
        { delivery_location: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get confirmations with related data
    const [confirmations, totalCount] = await Promise.all([
      prisma.delivery_confirmations.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.delivery_confirmations.count({ where })
    ]);

    // Manually fetch related data since relations are not defined in schema
    const orderIds = confirmations.map(c => c.order_id).filter(Boolean);
    const fulfillmentIds = confirmations.map(c => c.fulfillment_id).filter(Boolean);

    // Fetch related orders
    const orders = orderIds.length > 0
      ? await prisma.orders.findMany({
          where: { id: { in: orderIds } },
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        })
      : [];

    // Fetch related fulfillments with courier service
    const fulfillments = fulfillmentIds.length > 0
      ? await prisma.order_fulfillments.findMany({
          where: { id: { in: fulfillmentIds } },
          include: {
            courier_services: {
              select: {
                id: true,
                name: true,
                code: true,
                contact_phone: true
              }
            }
          }
        })
      : [];

    // Create lookup maps
    const orderMap = new Map(orders.map(o => [o.id, o]));
    const fulfillmentMap = new Map(fulfillments.map(f => [f.id, f]));

    // Combine data
    const confirmationsWithRelations = confirmations.map(c => ({
      ...c,
      order: orderMap.get(c.order_id) || null,
      fulfillment: fulfillmentMap.get(c.fulfillment_id) || null
    }));

    // Filter by courier service if specified (after fetching due to nested relation)
    let filteredConfirmations = confirmationsWithRelations;
    if (courierServiceId) {
      filteredConfirmations = confirmationsWithRelations.filter(
        c => c.fulfillment?.courier_services?.id === courierServiceId
      );

      // Recalculate total count for filtered results
      const filteredCount = await prisma.delivery_confirmations.count({
        where: {
          ...where
        }
      });

      // Get fulfillment IDs to check courier service
      const fulfillmentIdsForCourier = fulfillmentIds.length > 0
        ? await prisma.order_fulfillments.findMany({
            where: {
              id: { in: fulfillmentIds },
              courier_service_id: courierServiceId
            },
            select: { id: true }
          })
        : [];

      const fulfillmentIdSet = new Set(fulfillmentIdsForCourier.map(f => f.id));
      const courierFilteredCount = confirmations.filter(c => fulfillmentIdSet.has(c.fulfillment_id)).length;

      return res.json({
        success: true,
        data: {
          confirmations: filteredConfirmations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: courierFilteredCount,
            totalPages: Math.ceil(courierFilteredCount / parseInt(limit))
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        confirmations: confirmationsWithRelations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get delivery confirmations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery confirmations',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/admin/delivery/confirmations/stats
 * Get delivery confirmation statistics
 * 
 * Query parameters:
 * - startDate: ISO8601 date string (optional) - Filter by confirmation date
 * - endDate: ISO8601 date string (optional) - Filter by confirmation date
 */
router.get('/confirmations/stats', [
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

    // Get all confirmations for date range
    const confirmations = await prisma.delivery_confirmations.findMany({
      where
    });

    // Manually fetch related fulfillments with courier service
    const fulfillmentIds = confirmations.map(c => c.fulfillment_id).filter(Boolean);
    const fulfillments = fulfillmentIds.length > 0
      ? await prisma.order_fulfillments.findMany({
          where: { id: { in: fulfillmentIds } },
          include: {
            courier_services: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      : [];

    // Create fulfillment map
    const fulfillmentMap = new Map(fulfillments.map(f => [f.id, f]));

    // Combine data
    const confirmationsWithFulfillment = confirmations.map(c => ({
      ...c,
      fulfillment: fulfillmentMap.get(c.fulfillment_id) || null
    }));

    // Calculate statistics
    const total = confirmationsWithFulfillment.length;

    // Count confirmations with signature
    const withSignature = confirmationsWithFulfillment.filter(
      c => c.confirmation_method === 'signature' && c.signature_url
    ).length;

    // Count confirmations with photos
    const withPhoto = confirmationsWithFulfillment.filter(
      c => c.photos && Array.isArray(c.photos) && c.photos.length > 0
    ).length;

    // Count confirmations with OTP
    const withOtp = confirmationsWithFulfillment.filter(
      c => c.confirmation_method === 'otp' && c.otp_code
    ).length;

    // Group by courier service
    const byCourier = {};
    confirmationsWithFulfillment.forEach(c => {
      const courier = c.fulfillment?.courier_services;
      if (courier) {
        const courierId = courier.id;
        const courierName = courier.name;

        if (!byCourier[courierId]) {
          byCourier[courierId] = {
            name: courierName,
            total: 0,
            withSignature: 0,
            withPhoto: 0,
            withOtp: 0
          };
        }

        byCourier[courierId].total++;
        if (c.confirmation_method === 'signature' && c.signature_url) {
          byCourier[courierId].withSignature++;
        }
        if (c.photos && Array.isArray(c.photos) && c.photos.length > 0) {
          byCourier[courierId].withPhoto++;
        }
        if (c.confirmation_method === 'otp' && c.otp_code) {
          byCourier[courierId].withOtp++;
        }
      }
    });

    // Group by date (YYYY-MM-DD format)
    const byDate = {};
    confirmationsWithFulfillment.forEach(c => {
      const dateKey = c.confirmed_at.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = {
          total: 0,
          withSignature: 0,
          withPhoto: 0,
          withOtp: 0
        };
      }

      byDate[dateKey].total++;
      if (c.confirmation_method === 'signature' && c.signature_url) {
        byDate[dateKey].withSignature++;
      }
      if (c.photos && Array.isArray(c.photos) && c.photos.length > 0) {
        byDate[dateKey].withPhoto++;
      }
      if (c.confirmation_method === 'otp' && c.otp_code) {
        byDate[dateKey].withOtp++;
      }
    });

    // Group by confirmation method
    const byMethod = {};
    confirmationsWithFulfillment.forEach(c => {
      const method = c.confirmation_method || 'unknown';
      if (!byMethod[method]) {
        byMethod[method] = 0;
      }
      byMethod[method]++;
    });

    res.json({
      success: true,
      data: {
        total,
        withSignature,
        withPhoto,
        withOtp,
        byCourier: Object.values(byCourier),
        byDate,
        byMethod
      }
    });

  } catch (error) {
    console.error('Get delivery confirmation stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery confirmation statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
