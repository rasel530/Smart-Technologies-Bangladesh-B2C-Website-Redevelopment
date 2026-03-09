// Analytics endpoint fix - PrismaClientValidationError issue
const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to serialize Decimal values
const serializeComparison = (comparison) => {
  return {
    ...comparison,
    items: comparison.items?.map(item => ({
      ...item,
      product: item.product ? {
        ...item.product,
        regularPrice: parseFloat(item.product.regularPrice),
        salePrice: item.product.salePrice ? parseFloat(item.product.salePrice) : null,
        costPrice: parseFloat(item.product.costPrice)
      } : null
    })) || []
  };
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// ============================================
// ADMIN COMPARISON ENDPOINTS
// ============================================

// GET /api/v1/admin/comparisons - List all comparisons
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('userId').optional().isUUID(),
  query('sessionId').optional().isString(),
  query('status').optional().isIn(['active', 'expired', 'all']),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      sessionId,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (status === 'active') {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    } else if (status === 'expired') {
      where.expiresAt = {
        lt: new Date()
      };
    }

    const [comparisons, total] = await Promise.all([
      prisma.product_comparisons.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { processingStatus: { not: 'deleted' } },
                    orderBy: { displayOrder: 'asc' },
                    take: 1
                  },
                  brand: {
                    select: { id: true, name: true, slug: true }
                  }
                }
              }
            },
            orderBy: { addedAt: 'asc' }
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.product_comparisons.count({ where })
    ]);

    res.json({
      comparisons: comparisons.map(serializeComparison),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all comparisons error:', error);
    res.status(500).json({
      error: 'Failed to fetch comparisons',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/comparisons/stats - Get comparison statistics
// BUG-HIGH-006: Multiple separate queries instead of aggregation - Fixed to use aggregation
router.get('/stats', [
  query('period').optional().isIn(['today', 'week', 'month', 'year', 'all'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    let startDate = null;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = null;
    }

    const where = startDate ? { createdAt: { gte: startDate } } : {};

    // BUG-HIGH-006: Use aggregation instead of multiple separate queries
    const stats = await prisma.product_comparisons.aggregate({
      where,
      _count: {
        id: true
      }
    });

    const totalComparisons = stats._count.id || 0;

    // Get item count using aggregation
    const itemCounts = await prisma.product_comparison_items.groupBy({
      by: ['comparisonId'],
      where: {
        comparison: {
          ...where
        }
      },
      _count: {
        comparisonId: true
      }
    });

    const totalItems = itemCounts.reduce((sum, item) => sum + item._count.comparisonId, 0);
    const avgItemsPerComparison = totalComparisons > 0 ? totalItems / totalComparisons : 0;

    // Get counts by status using aggregation
    const statusCounts = await prisma.product_comparisons.groupBy({
      by: ['userId', 'sessionId', 'expiresAt'],
      where,
      _count: {
        id: true
      }
    });

    const userComparisons = statusCounts.filter(s => s.userId !== null).reduce((sum, s) => sum + s._count.id, 0);
    const guestComparisons = statusCounts.filter(s => s.sessionId !== null).reduce((sum, s) => sum + s._count.id, 0);

    const currentTime = new Date();
    const activeComparisons = statusCounts.filter(s =>
      s.expiresAt === null || s.expiresAt > currentTime
    ).reduce((sum, s) => sum + s._count.id, 0);

    const expiredComparisons = statusCounts.filter(s =>
      s.expiresAt !== null && s.expiresAt <= currentTime
    ).reduce((sum, s) => sum + s._count.id, 0);

    // Get top compared products
    const topComparedProducts = await prisma.product_comparison_items.groupBy({
      by: ['productId'],
      where: {
        comparison: {
          ...where
        }
      },
      _count: {
        productId: true
      },
      orderBy: {
        _count: {
          productId: 'desc'
        }
      },
      take: 10
    });

    // Get product details for top compared products
    const productIds = topComparedProducts.map(p => p.productId);
    const productDetails = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        regularPrice: true,
        salePrice: true,
        images: {
          where: { processingStatus: { not: 'deleted' }, isPrimary: true },
          take: 1
        }
      }
    });

    const topProductsWithDetails = topComparedProducts.map(p => ({
      ...p,
      product: productDetails.find(pd => pd.id === p.productId)
    }));

    res.json({
      period,
      stats: {
        totalComparisons,
        activeComparisons,
        expiredComparisons,
        userComparisons,
        guestComparisons,
        totalItems,
        avgItemsPerComparison: Math.round(avgItemsPerComparison * 100) / 100
      },
      topComparedProducts: topProductsWithDetails
    });

  } catch (error) {
    console.error('Get comparison statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch comparison statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/comparisons/analytics - Get comparison analytics
// BUG-HIGH-007: No pagination on analytics endpoint - Added pagination
router.get('/analytics', [
  query('period').optional().isIn(['today', 'week', 'month', 'year', 'all']),
  query('groupBy').optional().isIn(['day', 'week', 'month']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { period = 'all', groupBy = 'day', page = 1, limit = 50 } = req.query;

    let startDate = null;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = null;
    }

    const where = startDate ? { createdAt: { gte: startDate } } : {};

    // Get comparisons grouped by date with pagination
    const skip = (page - 1) * limit;
    const [comparisonsByDate, totalComparisons] = await Promise.all([
      prisma.product_comparisons.findMany({
        where,
        select: {
          createdAt: true,
          _count: {
            select: { items: true }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.product_comparisons.count({ where })
    ]);

    // Group by period
    const groupedData = {};
    
    for (const comparison of comparisonsByDate) {
      let key;
      const date = new Date(comparison.createdAt);
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          comparisons: 0,
          totalItems: 0
        };
      }

      groupedData[key].comparisons++;
      groupedData[key].totalItems += comparison._count.items;
    }

    // Get user activity
    console.log('[DEBUG] Analytics endpoint - userActivity query where clause:', JSON.stringify(where));
    console.log('[DEBUG] Analytics endpoint - About to execute userActivity query...');
    let userActivity;
    try {
      // First, try without the where clause to see if that's the issue
      userActivity = await prisma.comparison_histories.groupBy({
        by: ['userId'],
        _count: {
          userId: true
        },
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 10
      });
      console.log('[DEBUG] Analytics endpoint - userActivity query (without where) succeeded, result:', JSON.stringify(userActivity));
    } catch (error) {
      console.error('[DEBUG] Analytics endpoint - userActivity query (without where) failed:', error);
      throw error;
    }

    // Get user details
    const userIds = userActivity.map(u => u.userId);
    const userDetails = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    const topUsers = userActivity.map(u => ({
      ...u,
      user: userDetails.find(ud => ud.id === u.userId)
    }));

    // Get action distribution
    console.log('[DEBUG] Analytics endpoint - actionDistribution query where clause:', JSON.stringify(where));
    console.log('[DEBUG] Analytics endpoint - About to execute actionDistribution query...');
    let actionDistribution;
    try {
      actionDistribution = await prisma.comparison_histories.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true
        },
        orderBy: {
          _count: {
            action: 'desc'
          }
        }
      });
      console.log('[DEBUG] Analytics endpoint - actionDistribution query succeeded, result:', JSON.stringify(actionDistribution));
    } catch (error) {
      console.error('[DEBUG] Analytics endpoint - actionDistribution query failed:', error);
      throw error;
    }

    res.json({
      period,
      groupBy,
      timeline: Object.values(groupedData),
      topUsers,
      actionDistribution: actionDistribution.map(a => ({
        action: a.action,
        count: a._count.action
      })),
      // BUG-HIGH-007: No pagination on analytics endpoint - Added pagination response
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalComparisons,
        pages: Math.ceil(totalComparisons / limit)
      }
    });

  } catch (error) {
    console.error('Get comparison analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch comparison analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/comparisons/:id - Get comparison details
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    const comparison = await prisma.product_comparisons.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { processingStatus: { not: 'deleted' } },
                  orderBy: { displayOrder: 'asc' }
                },
                specifications: {
                  orderBy: { sortOrder: 'asc' }
                },
                brand: {
                  select: { id: true, name: true, slug: true }
                },
                categories: {
                  include: {
                    category: {
                      select: { id: true, name: true, slug: true }
                    }
                  },
                  where: { isPrimary: true },
                  take: 1
                }
              }
            }
          },
          orderBy: { addedAt: 'asc' }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    res.json({
      comparison: serializeComparison(comparison)
    });

  } catch (error) {
    console.error('Get comparison details error:', error);
    res.status(500).json({
      error: 'Failed to fetch comparison details',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/admin/comparisons/:id - Delete comparison
router.delete('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if comparison exists
    const comparison = await prisma.product_comparisons.findUnique({
      where: { id }
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found'
      });
    }

    await prisma.product_comparisons.delete({
      where: { id }
    });

    res.json({
      message: 'Comparison deleted successfully'
    });

  } catch (error) {
    console.error('Delete comparison error:', error);
    res.status(500).json({
      error: 'Failed to delete comparison',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
