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

// GET /api/v1/admin/orders/sharing - Get all shared orders with filters and pagination
router.get('/sharing', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('orderId').optional().isString(),
  query('shareType').optional().isIn(['public_link', 'protected_link', 'one_time_link']),
  query('isActive').optional().isBoolean(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      orderId, 
      shareType, 
      isActive, 
      startDate, 
      endDate 
    } = req.query;

    // Build where clause
    const where = {};

    // Filter by order ID
    if (orderId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(orderId)) {
        where.orderId = orderId;
      } else {
        // Search by order number - fetch matching orders first
        const matchingOrders = await prisma.orders.findMany({
          where: {
            orderNumber: {
              contains: orderId,
              mode: 'insensitive'
            }
          },
          select: { id: true }
        });
        
        if (matchingOrders.length > 0) {
          where.orderId = { in: matchingOrders.map(o => o.id) };
        } else {
          // No matching orders, return empty result
          where.orderId = '00000000-0000-0000-000000000000000000000000';
        }
      }
    }

    // Filter by share type
    if (shareType) {
      where.shareType = shareType;
    }

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get total count and shares in parallel
    const [shares, total] = await Promise.all([
      prisma.order_sharing.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order_sharing.count({ where })
    ]);

    // Fetch order details separately
    const orderIds = shares.map(share => share.orderId);
    const orders = await prisma.orders.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, orderNumber: true }
    });

    // Create a map for quick lookup
    const orderMap = new Map(orders.map(o => [o.id, o]));

    const totalPages = Math.ceil(total / parseInt(limit));

    // Map shares to response format
    const mappedShares = shares.map(share => ({
      id: share.id,
      shareToken: share.token,
      shareType: share.shareType,
      shareUrl: `/api/v1/orders/share/${share.token}`,
      viewCount: share.viewCount,
      isActive: share.isActive,
      createdAt: share.createdAt.toISOString(),
      lastAccessedAt: share.lastViewedAt?.toISOString() || null,
      orderId: share.orderId,
      orderNumber: orderMap.get(share.orderId)?.orderNumber || null,
      expiresAt: share.expiresAt?.toISOString() || null,
      maxViews: share.maxViews,
      createdBy: share.createdBy
    }));

    res.json({
      success: true,
      shares: mappedShares,
      total,
      page: parseInt(page),
      totalPages
    });

  } catch (error) {
    console.error('[Admin Orders Sharing] Get shares error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared orders',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/orders/sharing/stats - Get sharing statistics
router.get('/sharing/stats', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate);
      }
    }

    // Get total counts
    const [totalShared, activeShares, totalViews] = await Promise.all([
      prisma.order_sharing.count({ where: dateFilter }),
      prisma.order_sharing.count({ 
        where: { 
          ...dateFilter,
          isActive: true 
        } 
      }),
      prisma.order_sharing.aggregate({
        where: dateFilter,
        _sum: {
          viewCount: true
        }
      })
    ]);

    // Get by type statistics
    const byType = await prisma.order_sharing.groupBy({
      by: ['shareType'],
      where: dateFilter,
      _count: {
        shareType: true
      }
    });

    const byTypeMap = byType.reduce((acc, item) => {
      acc[item.shareType] = item._count.shareType;
      return acc;
    }, {
      public_link: 0,
      protected_link: 0,
      one_time_link: 0
    });

    // Generate overTime array with daily statistics for last 7 days
    const overTime = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Get shares created on this day
      const dayShares = await prisma.order_sharing.findMany({
        where: {
          createdAt: {
            gte: new Date(dateStr + 'T00:00:00.000Z'),
            lt: new Date(dateStr + 'T23:59:59.999Z')
          }
        }
      });

      const dayCreated = dayShares.length;
      const dayViews = dayShares.reduce((sum, share) => sum + share.viewCount, 0);

      overTime.push({
        date: dateStr,
        created: dayCreated,
        views: dayViews
      });
    }

    res.json({
      success: true,
      data: {
        totalShared,
        activeShares,
        totalViews: totalViews._sum.viewCount || 0,
        byType: byTypeMap,
        overTime
      }
    });

  } catch (error) {
    console.error('[Admin Orders Sharing] Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sharing statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/orders/sharing/:shareId/disable - Disable a specific share link
router.post('/sharing/:shareId/disable', [
  param('shareId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { shareId } = req.params;

    // Check if share exists
    const share = await prisma.order_sharing.findUnique({
      where: { id: shareId }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share link not found'
      });
    }

    // Disable the share
    const updatedShare = await prisma.order_sharing.update({
      where: { id: shareId },
      data: {
        isActive: false
      }
    });

    console.log(`[Admin Orders Sharing] Share disabled: ${shareId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Share link disabled successfully',
      share: {
        id: updatedShare.id,
        shareToken: updatedShare.token,
        isActive: updatedShare.isActive
      }
    });

  } catch (error) {
    console.error('[Admin Orders Sharing] Disable share error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable share link',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/admin/orders/sharing/:shareId - Delete a specific share link
router.delete('/sharing/:shareId', [
  param('shareId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { shareId } = req.params;

    // Check if share exists
    const share = await prisma.order_sharing.findUnique({
      where: { id: shareId }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share link not found'
      });
    }

    // Delete the share
    await prisma.order_sharing.delete({
      where: { id: shareId }
    });

    console.log(`[Admin Orders Sharing] Share deleted: ${shareId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Share link deleted successfully'
    });

  } catch (error) {
    console.error('[Admin Orders Sharing] Delete share error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete share link',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/orders/sharing/bulk-disable - Bulk disable multiple share links
router.post('/sharing/bulk-disable', [
  body('shareIds').isArray({ min: 1 }),
  body('shareIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { shareIds } = req.body;

    // Check which shares exist
    const shares = await prisma.order_sharing.findMany({
      where: {
        id: { in: shareIds }
      }
    });

    if (shares.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No share links found'
      });
    }

    const validIds = shares.map(s => s.id);
    const invalidIds = shareIds.filter(id => !validIds.includes(id));

    // Disable all valid shares
    await prisma.order_sharing.updateMany({
      where: {
        id: { in: validIds }
      },
      data: {
        isActive: false
      }
    });

    console.log(`[Admin Orders Sharing] Bulk disabled ${validIds.length} shares by ${req.user.email}`);

    res.json({
      success: true,
      message: `${validIds.length} share links disabled successfully`,
      disabledCount: validIds.length,
      invalidIds
    });

  } catch (error) {
    console.error('[Admin Orders Sharing] Bulk disable error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk disable share links',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/orders/sharing/bulk-delete - Bulk delete multiple share links
router.post('/sharing/bulk-delete', [
  body('shareIds').isArray({ min: 1 }),
  body('shareIds.*').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { shareIds } = req.body;

    // Check which shares exist
    const shares = await prisma.order_sharing.findMany({
      where: {
        id: { in: shareIds }
      }
    });

    if (shares.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No share links found'
      });
    }

    const validIds = shares.map(s => s.id);
    const invalidIds = shareIds.filter(id => !validIds.includes(id));

    // Delete all valid shares
    await prisma.order_sharing.deleteMany({
      where: {
        id: { in: validIds }
      }
    });

    console.log(`[Admin Orders Sharing] Bulk deleted ${validIds.length} shares by ${req.user.email}`);

    res.json({
      success: true,
      message: `${validIds.length} share links deleted successfully`,
      deletedCount: validIds.length,
      invalidIds
    });

  } catch (error) {
    console.error('[Admin Orders Sharing] Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk delete share links',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
