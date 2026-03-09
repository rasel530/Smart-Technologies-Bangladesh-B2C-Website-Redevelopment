const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

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

// Helper function to check order ownership
const checkOrderOwnership = async (orderId, userId, isAdmin) => {
  if (isAdmin) return true;
  
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: { userId: true }
  });
  
  return order && order.userId === userId;
};

// Helper function to recalculate order totals after modifications
const recalculateOrderTotals = async (orderId) => {
  // Get all order items
  const orderItems = await prisma.order_items.findMany({
    where: { orderId }
  });

  // Calculate subtotal
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + (parseFloat(item.price) * item.quantity);
  }, 0);

  // Get order to get shipping and tax
  const order = await prisma.orders.findUnique({
    where: { id: orderId }
  });

  // Calculate total
  const total = subtotal + parseFloat(order?.shippingCost || 0) + parseFloat(order?.tax || 0);

  // Update order with new totals
  await prisma.orders.update({
    where: { id: orderId },
    data: {
      subtotal: subtotal.toString(),
      total: total.toString()
    }
  });

  console.log(`[Order Management] Recalculated totals for order ${orderId}: subtotal=${subtotal}, total=${total}`);
  
  return { subtotal, total };
};

// ============================================================================
// 0. Specific Routes (without parameters)
// ============================================================================

// GET /api/v1/admin/orders/reports - Get order reports
router.get('/admin/orders/reports', [
  query('reportType').isIn(['sales', 'cancellations', 'modifications', 'fulfillments', 'status_distribution']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('groupBy').optional().isIn(['day', 'week', 'month', 'year'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { reportType, startDate, endDate, groupBy } = req.query;
 
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
 
    let reportData = {};
 
    switch (reportType) {
      case 'sales':
        const salesOrders = await prisma.orders.findMany({
          where: {
            ...where,
            status: { in: ['confirmed', 'shipped', 'delivered'] }
          },
          select: {
            total: true,
            createdAt: true,
            status: true
          }
        });

        reportData = {
          totalRevenue: salesOrders.reduce((sum, o) => sum + parseFloat(o.total), 0),
          totalOrders: salesOrders.length,
          averageOrderValue: salesOrders.length > 0 ? salesOrders.reduce((sum, o) => sum + parseFloat(o.total), 0) / salesOrders.length : 0,
          ordersByStatus: salesOrders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
          }, {})
        };
        break;

      case 'cancellations':
        const cancellations = await prisma.order_cancellations.findMany({
          where: {
            ...where,
            status: { in: ['approved', 'processed'] }
          },
          include: {
            order: {
              select: { total: true }
            }
          }
        });

        reportData = {
          totalCancellations: cancellations.length,
          totalRefundedAmount: cancellations.reduce((sum, c) => sum + parseFloat(c.refundAmount || 0), 0),
          cancellationsByType: cancellations.reduce((acc, c) => {
            acc[c.cancellation_type] = (acc[c.cancellation_type] || 0) + 1;
            return acc;
          }, {})
        };
        break;

      case 'modifications':
        const modifications = await prisma.order_modifications.findMany({
          where,
          select: {
            modification_type: true,
            status: true,
            created_at: true
          }
        });

        reportData = {
          totalModifications: modifications.length,
          modificationsByType: modifications.reduce((acc, m) => {
            acc[m.modification_type] = (acc[m.modification_type] || 0) + 1;
            return acc;
          }, {}),
          modificationsByStatus: modifications.reduce((acc, m) => {
            acc[m.status] = (acc[m.status] || 0) + 1;
            return acc;
          }, {})
        };
        break;

      case 'fulfillments':
        const fulfillments = await prisma.order_fulfillments.findMany({
          where,
          include: {
            order: {
              select: { total: true, created_at: true }
            }
          }
        });

        reportData = {
          totalFulfillments: fulfillments.length,
          fulfillmentRate: fulfillments.length > 0 ? (fulfillments.length / (await prisma.orders.count({ where }))) * 100 : 0,
          averageFulfillmentTime: 0 // Would need more complex calculation
        };
        break;

      case 'status_distribution':
        const allOrders = await prisma.orders.findMany({
          where,
          select: { status: true }
        });

        reportData = {
          totalOrders: allOrders.length,
          statusDistribution: allOrders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
          }, {})
        };
        break;
    }

    res.json({
      success: true,
      reportType,
      data: reportData
    });

  } catch (error) {
    console.error('Get order reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate order reports',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/orders/analytics - Get order analytics
router.get('/admin/orders/analytics', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
 
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
 
    // Get all orders in date range
    const orders = await prisma.orders.findMany({
      where,
      include: { order_items: {
          include: { products: true
          }
        }
      }
    });

    // Calculate analytics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const ordersByStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const cancellations = await prisma.order_cancellations.findMany({
      where: {
        status: { in: ['approved', 'processed'] },
        createdAt: where.created_at
      }
    });
    const cancellationRate = totalOrders > 0 ? (cancellations.length / totalOrders) * 100 : 0;

    const modifications = await prisma.order_modifications.findMany({
      where: {
        createdAt: where.created_at
      }
    });
    const modificationRate = totalOrders > 0 ? (modifications.length / totalOrders) * 100 : 0;

    // Calculate average fulfillment time
    const shippedOrders = orders.filter(o => o.shipped_at && o.createdAt);
    const avgFulfillmentTime = shippedOrders.length > 0
      ? shippedOrders.reduce((sum, o) => sum + (new Date(o.shipped_at) - new Date(o.createdAt)), 0) / shippedOrders.length / (1000 * 60 * 60) // hours
      : 0;

    // Get top products
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productName = item.product.name;
        productSales[productName] = (productSales[productName] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, quantity]) => ({ name, quantity }));

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        ordersByStatus,
        cancellationRate: parseFloat(cancellationRate.toFixed(2)),
        modificationRate: parseFloat(modificationRate.toFixed(2)),
        averageFulfillmentTime: parseFloat(avgFulfillmentTime.toFixed(2)),
        topProducts
      }
    });

  } catch (error) {
    console.error('Get order analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/orders/bulk/status - Bulk update order status
router.post('/admin/orders/bulk/status', [
  body('orderIds').isArray({ min: 1 }),
  body('orderIds.*').isUUID(),
  body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'processing', 'refunded']),
  body('notes').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { orderIds, status, notes } = req.body;
    const adminId = req.user.id;

    const updateData = { status };
    if (status === 'confirmed') updateData.confirmedAt = new Date();
    if (status === 'shipped') updateData.shipped_at = new Date();
    if (status === 'delivered') updateData.delivered_at = new Date();
    if (notes) updateData.internalNotes = notes;

    let updatedCount = 0;
    const failedOrders = [];

    // Process orders in transaction
    for (const orderId of orderIds) {
      try {
        const order = await prisma.orders.findUnique({
          where: { id: orderId }
        });

        if (!order) {
          failedOrders.push({ orderId, error: 'Order not found' });
          continue;
        }

        await prisma.$transaction(async (tx) => {
          // Update order status
          await tx.orders.update({
            where: { id: orderId },
            data: updateData
          });

          // Create status history record
          await tx.order_status_histories.create({
            data: {
              orderId,
              previousStatus: order.status,
              newStatus: status,
              changed_by: adminId,
              reason: notes || 'Bulk status update',
              metadata: {
                bulkAction: true
              }
            }
          });
        });

        updatedCount++;
      } catch (error) {
        failedOrders.push({ orderId, error: error.message });
      }
    }

    console.log(`[Order Management] Bulk status update: ${updatedCount}/${orderIds.length} orders updated by admin ${adminId}`);

    res.json({
      success: true,
      updatedCount,
      failedOrders,
      message: `Updated ${updatedCount} orders successfully`
    });

  } catch (error) {
    console.error('Bulk update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk update order status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/orders/bulk/cancel - Bulk cancel orders
router.post('/admin/orders/bulk/cancel', [
  body('orderIds').isArray({ min: 1 }),
  body('orderIds.*').isUUID(),
  body('type').isIn(['customer_request', 'fraud', 'out_of_stock', 'payment_failed', 'duplicate', 'other']),
  body('reason').isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { orderIds, type, reason } = req.body;
    const adminId = req.user.id;

    let cancelledCount = 0;
    const failedOrders = [];

    // Process orders in transaction
    for (const orderId of orderIds) {
      try {
        const order = await prisma.orders.findUnique({
          where: { id: orderId }
        });

        if (!order) {
          failedOrders.push({ orderId, error: 'Order not found' });
          continue;
        }

        if (order.status === 'cancelled' || order.status === 'delivered') {
          failedOrders.push({ orderId, error: 'Order cannot be cancelled in its current status' });
          continue;
        }

        await prisma.$transaction(async (tx) => {
          // Create cancellation record
          await tx.order_cancellations.create({
            data: {
              orderId,
              cancellation_type: type,
              reason,
              requested_by: adminId,
              approved_by: adminId,
              refundAmount: order.total,
              refundMethod: order.paymentMethod,
              status: 'processed',
              processedAt: new Date()
            }
          });

          // Update order status to cancelled
          await tx.orders.update({
            where: { id: orderId },
            data: { status: 'cancelled' }
          });

          // Create status history record
          await tx.order_status_histories.create({
            data: {
              orderId,
              previousStatus: order.status,
              newStatus: 'cancelled',
              changed_by: adminId,
              reason: `Bulk cancellation: ${type}`,
              metadata: {
                bulkAction: true,
                cancellation_type: type
              }
            }
          });
        });

        cancelledCount++;
      } catch (error) {
        failedOrders.push({ orderId, error: error.message });
      }
    }

    console.log(`[Order Management] Bulk cancellation: ${cancelledCount}/${orderIds.length} orders cancelled by admin ${adminId}`);

    res.json({
      success: true,
      cancelledCount,
      failedOrders,
      message: `Cancelled ${cancelledCount} orders successfully`
    });

  } catch (error) {
    console.error('Bulk cancel orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk cancel orders',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/v1/admin/orders/bulk/export - Bulk export orders
router.post('/admin/orders/bulk/export', [
  body('orderIds').isArray({ min: 1 }),
  body('orderIds.*').isUUID(),
  body('format').isIn(['csv', 'excel', 'pdf'])
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { orderIds, format } = req.body;

    // Get orders
    const orders = await prisma.orders.findMany({
      where: {
        id: { in: orderIds }
      },
      include: { users: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        address: true,
        items: {
          include: { products: {
              select: { id: true, name: true, sku: true }
            }
          }
        }
      }
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No orders found'
      });
    }

    // Generate export URL (in production, this would create actual files)
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const downloadUrl = `/api/v1/admin/orders/exports/${exportId}.${format}`;

    console.log(`[Order Management] Bulk export: ${orders.length} orders exported in ${format} format`);

    res.json({
      success: true,
      downloadUrl,
      exportId,
      format,
      orderCount: orders.length,
      message: 'Export created successfully'
    });

  } catch (error) {
    console.error('Bulk export orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk export orders',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/modifications - Get all modification requests for admin dashboard
router.get('/admin/modifications', [
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'processed', 'cancelled', 'completed']),
  query('type').optional().isIn(['item_add', 'item_remove', 'quantity_change', 'price_change', 'address_change', 'shipping_method_change', 'payment_method_change', 'custom']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.modification_type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get modifications with order details
    const [modifications, totalCount] = await Promise.all([
      prisma.order_modifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order_modifications.count({ where })
    ]);

    res.json({
      success: true,
      data: modifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get all modifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modifications',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/cancellations - Get all cancellation requests for admin dashboard
router.get('/admin/cancellations', [
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'processed']),
  query('type').optional().isIn(['customer_request', 'fraud', 'out_of_stock', 'payment_failed', 'duplicate', 'other']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.cancellation_type = type;
    }

    // If searching by order number, we need to find matching orders first
    let searchOrderIds = [];
    if (search) {
      const matchingOrders = await prisma.orders.findMany({
        where: {
          orderNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        select: { id: true }
      });
      searchOrderIds = matchingOrders.map(o => o.id);
      where.order_id = { in: searchOrderIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get cancellations with order details
    const [cancellations, totalCount] = await Promise.all([
      prisma.order_cancellations.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order_cancellations.count({ where })
    ]);

    // Get order details for all cancellations
    const orderIds = cancellations.map(c => c.order_id);
    const orders = await prisma.orders.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentMethod: true
      }
    });

    // Transform the data to include order details
    const transformedCancellations = cancellations.map(cancellation => {
      const order = orders.find(o => o.id === cancellation.order_id);
      return {
        ...cancellation,
        order: order || null
      };
    });

    res.json({
      success: true,
      data: transformedCancellations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get all cancellations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cancellations',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 1. Order Modification Endpoints
// ============================================================================

// POST /api/v1/orders/:id/modifications - Request a modification to an order
router.post('/:id/modifications', [
  param('id').isUUID(),
  body('type').isIn(['item_add', 'item_remove', 'quantity_change', 'price_change', 'address_change', 'shipping_method_change', 'payment_method_change', 'custom']),
  body('reason').optional().isString(),
  body('changes').optional().isObject(),
  body('items').optional().isArray()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, reason, changes, items } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

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

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only modify your own orders'
      });
    }

    // Validate order status - cannot modify shipped or delivered orders
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify orders that have been shipped or delivered'
      });
    }

    // Validate order status - cannot modify cancelled orders
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify cancelled orders'
      });
    }

    // Validate modification-specific requirements
    switch (type) {
      case 'item_add':
        if (!changes || !changes.items || !Array.isArray(changes.items) || changes.items.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Item addition requires items array in changes'
          });
        }
        
        // Validate each item
        for (const item of changes.items) {
          if (!item.productId) {
            return res.status(400).json({
              success: false,
              error: 'Each item must have a productId'
            });
          }
          if (!item.quantity || item.quantity < 1) {
            return res.status(400).json({
              success: false,
              error: 'Each item must have a valid quantity'
            });
          }
          if (!item.price && !item.unitPrice) {
            return res.status(400).json({
              success: false,
              error: 'Each item must have a price'
            });
          }
        }
        break;

      case 'item_remove':
        if (!changes || !changes.itemIds || !Array.isArray(changes.itemIds) || changes.itemIds.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Item removal requires itemIds array in changes'
          });
        }
        break;

      case 'quantity_change':
        if (!changes || !changes.items || !Array.isArray(changes.items) || changes.items.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Quantity change requires items array in changes'
          });
        }
        
        for (const item of changes.items) {
          if (!item.orderItemId) {
            return res.status(400).json({
              success: false,
              error: 'Each item must have an orderItemId'
            });
          }
          if (item.newQuantity === undefined || item.newQuantity < 0) {
            return res.status(400).json({
              success: false,
              error: 'Each item must have a valid newQuantity'
            });
          }
        }
        break;

      case 'price_change':
        if (!changes || !changes.items || !Array.isArray(changes.items) || changes.items.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Price change requires items array in changes'
          });
        }
        
        for (const item of changes.items) {
          if (!item.orderItemId) {
            return res.status(400).json({
              success: false,
              error: 'Each item must have an orderItemId'
            });
          }
          if (item.newPrice === undefined || item.newPrice < 0) {
            return res.status(400).json({
              success: false,
              error: 'Each item must have a valid newPrice'
            });
          }
        }
        break;

      case 'address_change':
        if (!changes || !changes.address) {
          return res.status(400).json({
            success: false,
            error: 'Address change requires address object in changes'
          });
        }
        
        const address = changes.address;
        if (!address.street || !address.city || !address.state || !address.zipCode || !address.country) {
          return res.status(400).json({
            success: false,
            error: 'Address must include street, city, state, zipCode, and country'
          });
        }
        break;

      case 'shipping_method_change':
        if (!changes || !changes.shippingMethod) {
          return res.status(400).json({
            success: false,
            error: 'Shipping method change requires shippingMethod in changes'
          });
        }
        break;

      case 'payment_method_change':
        if (!changes || !changes.paymentMethod) {
          return res.status(400).json({
            success: false,
            error: 'Payment method change requires paymentMethod in changes'
          });
        }
        break;

      case 'custom':
        // Custom modifications don't require specific validation
        break;
    }

    // Create modification request
    const modification = await prisma.order_modifications.create({
      data: {
        order_id: id,
        modification_type: type,
        description: reason,
        changes: changes || {},
        requested_by: userId,
        status: 'pending'
      }
    });

    console.log(`[Order Management] Modification request created: ${modification.id} for order ${id} by user ${userId}`);

    res.status(201).json({
      success: true,
      modificationId: modification.id,
      status: modification.status,
      message: 'Modification request submitted successfully'
    });

  } catch (error) {
    console.error('Create order modification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create modification request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/orders/:id/modifications/:modificationId/approve - Approve a modification request
router.put('/:id/modifications/:modificationId/approve', [
  param('id').isUUID(),
  param('modificationId').isUUID(),
  body('adminNotes').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id, modificationId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    // Check if modification exists and belongs to order
    const modification = await prisma.order_modifications.findFirst({
      where: {
        id: modificationId,
        order_id: id
      }
    });

    if (!modification) {
      return res.status(404).json({
        success: false,
        error: 'Modification request not found'
      });
    }

    if (modification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Modification request has already been processed'
      });
    }

    // Update modification status
    const updatedModification = await prisma.order_modifications.update({
      where: { id: modificationId },
      data: {
        status: 'approved',
        approved_by: adminId,
        processed_at: new Date()
      }
    });

    // Get order details for validation
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Validate order status - cannot modify shipped or delivered orders
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify orders that have been shipped or delivered'
      });
    }

    // Apply changes based on modification type
    await prisma.$transaction(async (tx) => {
      switch (modification.modification_type) {
        case 'item_add':
          // Add items to order
          if (modification.changes && modification.changes.items) {
            const itemsToAdd = modification.changes.items;
            
            // Validate inventory for each item
            for (const item of itemsToAdd) {
              const product = await tx.products.findUnique({
                where: { id: item.productId }
              });
              
              if (!product) {
                throw new Error(`Product with ID ${item.productId} not found`);
              }
              
              if (product.stockQuantity < item.quantity) {
                throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
              }
            }
            
            // Add items to order
            await tx.order_items.createMany({
              data: itemsToAdd.map(item => ({
                orderId: id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price || item.unitPrice,
                name: item.name || item.productName
              }))
            });
            
            // Update product inventory
            for (const item of itemsToAdd) {
              await tx.products.update({
                where: { id: item.productId },
                data: {
                  stockQuantity: {
                    decrement: item.quantity
                  }
                }
              });
            }
            
            console.log(`[Order Management] Added ${itemsToAdd.length} items to order ${id}`);
          }
          break;

        case 'item_remove':
          // Remove items from order
          if (modification.changes && modification.changes.itemIds) {
            const itemIdsToRemove = modification.changes.itemIds;
            
            // Get items to restore inventory
            const itemsToRemove = await tx.order_items.findMany({
              where: {
                id: { in: itemIdsToRemove },
                orderId: id
              }
            });
            
            // Remove items from order
            await tx.order_items.deleteMany({
              where: {
                id: { in: itemIdsToRemove },
                orderId: id
              }
            });
            
            // Restore inventory
            for (const item of itemsToRemove) {
              await tx.products.update({
                where: { id: item.productId },
                data: {
                  stockQuantity: {
                    increment: item.quantity
                  }
                }
              });
            }
            
            console.log(`[Order Management] Removed ${itemsToRemove.length} items from order ${id}`);
          }
          break;

        case 'quantity_change':
          // Update item quantities
          if (modification.changes && modification.changes.items) {
            const quantityChanges = modification.changes.items;
            
            for (const change of quantityChanges) {
              const orderItem = await tx.order_items.findFirst({
                where: {
                  id: change.orderItemId,
                  orderId: id
                },
                include: { products: true
                }
              });
              
              if (!orderItem) {
                throw new Error(`Order item with ID ${change.orderItemId} not found`);
              }
              
              const quantityDiff = change.newQuantity - orderItem.quantity;
              
              // Validate inventory if increasing quantity
              if (quantityDiff > 0) {
                if (orderItem.product.stockQuantity < quantityDiff) {
                  throw new Error(`Insufficient stock for product ${orderItem.product.name}. Available: ${orderItem.product.stockQuantity}, Additional needed: ${quantityDiff}`);
                }
                
                // Decrease inventory
                await tx.products.update({
                  where: { id: orderItem.productId },
                  data: {
                    stockQuantity: {
                      decrement: quantityDiff
                    }
                  }
                });
              } else if (quantityDiff < 0) {
                // Increase inventory (restoring stock)
                await tx.products.update({
                  where: { id: orderItem.productId },
                  data: {
                    stockQuantity: {
                      increment: Math.abs(quantityDiff)
                    }
                  }
                });
              }
              
              // Update order item quantity
              await tx.order_items.update({
                where: { id: change.orderItemId },
                data: {
                  quantity: change.newQuantity
                }
              });
            }
            
            console.log(`[Order Management] Updated quantities for ${quantityChanges.length} items in order ${id}`);
          }
          break;

        case 'price_change':
          // Update item prices
          if (modification.changes && modification.changes.items) {
            const priceChanges = modification.changes.items;
            
            await tx.order_items.updateMany({
              where: {
                id: { in: priceChanges.map(p => p.orderItemId) },
                orderId: id
              },
              data: {
                price: priceChanges[0].newPrice // Note: updateMany doesn't support dynamic values per row
              }
            });
            
            // For individual price updates, loop through each item
            for (const change of priceChanges) {
              await tx.order_items.update({
                where: { id: change.orderItemId },
                data: {
                  price: change.newPrice
                }
              });
            }
            
            console.log(`[Order Management] Updated prices for ${priceChanges.length} items in order ${id}`);
          }
          break;

        case 'address_change':
          // Update shipping address
          if (modification.changes && modification.changes.address) {
            const newAddress = modification.changes.address;
            
            // Update or create address
            if (order.addressId) {
              await tx.addresses.update({
                where: { id: order.addressId },
                data: {
                  street: newAddress.street,
                  city: newAddress.city,
                  state: newAddress.state,
                  zipCode: newAddress.zipCode,
                  country: newAddress.country,
                  phone: newAddress.phone
                }
              });
            } else {
              const newAddressRecord = await tx.addresses.create({
                data: {
                  userId: order.userId,
                  street: newAddress.street,
                  city: newAddress.city,
                  state: newAddress.state,
                  zipCode: newAddress.zipCode,
                  country: newAddress.country,
                  phone: newAddress.phone,
                  isDefault: false
                }
              });
              
              await tx.orders.update({
                where: { id },
                data: {
                  addressId: newAddressRecord.id
                }
              });
            }
            
            console.log(`[Order Management] Updated shipping address for order ${id}`);
          }
          break;

        case 'shipping_method_change':
          // Update shipping method and recalculate totals
          if (modification.changes && modification.changes.shippingMethod) {
            const { shippingMethod, shippingCost } = modification.changes;
            
            await tx.orders.update({
              where: { id },
              data: {
                shippingMethod,
                shippingCost: shippingCost || '0'
              }
            });
            
            console.log(`[Order Management] Updated shipping method to ${shippingMethod} for order ${id}`);
          }
          break;

        case 'payment_method_change':
          // Update payment method
          if (modification.changes && modification.changes.paymentMethod) {
            await tx.orders.update({
              where: { id },
              data: {
                paymentMethod: modification.changes.paymentMethod
              }
            });
            
            console.log(`[Order Management] Updated payment method to ${modification.changes.paymentMethod} for order ${id}`);
          }
          break;

        case 'custom':
          // Log for manual intervention
          console.log(`[Order Management] Custom modification ${modificationId} for order ${id} requires manual intervention. Changes:`, modification.changes);
          break;

        default:
          console.log(`[Order Management] Unknown modification type: ${modification.modification_type}`);
          break;
      }
      
      // Recalculate order totals after modifications
      await recalculateOrderTotals(id);
    });

    // Create status history record
    await prisma.order_status_histories.create({
      data: {
        order_id: id,
        previous_status: null,
        new_status: 'processing',
        changed_by: adminId,
        reason: `Modification approved: ${modification.modification_type}`,
        metadata: {
          modificationId,
          modificationType: modification.modification_type,
          changes: modification.changes
        }
      }
    });

    console.log(`[Order Management] Modification ${modificationId} approved for order ${id} by admin ${adminId}`);

    res.json({
      success: true,
      message: 'Modification request approved successfully'
    });

  } catch (error) {
    console.error('Approve order modification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve modification request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/orders/:id/modifications/:modificationId/reject - Reject a modification request
router.put('/:id/modifications/:modificationId/reject', [
  param('id').isUUID(),
  param('modificationId').isUUID(),
  body('reason').isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id, modificationId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Check if modification exists and belongs to order
    const modification = await prisma.order_modifications.findFirst({
      where: {
        id: modificationId,
        order_id: id
      }
    });

    if (!modification) {
      return res.status(404).json({
        success: false,
        error: 'Modification request not found'
      });
    }

    if (modification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Modification request has already been processed'
      });
    }

    // Update modification status
    await prisma.order_modifications.update({
      where: { id: modificationId },
      data: {
        status: 'rejected',
        approved_by: adminId,
        processed_at: new Date()
      }
    });

    console.log(`[Order Management] Modification ${modificationId} rejected for order ${id} by admin ${adminId}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Modification request rejected successfully'
    });

  } catch (error) {
    console.error('Reject order modification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject modification request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/modifications - Get all modification requests for an order
router.get('/:id/modifications', [
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

    const modifications = await prisma.order_modifications.findMany({
      where: { order_id: id },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: modifications
    });

  } catch (error) {
    console.error('Get order modifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modification requests',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 2. Order Cancellation Endpoints
// ============================================================================

// POST /api/v1/orders/:id/cancellations - Request order cancellation
router.post('/:id/cancellations', [
  param('id').isUUID(),
  body('type').isIn(['customer_request', 'fraud', 'out_of_stock', 'payment_failed', 'duplicate', 'other']),
  body('reason').isString()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, reason } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

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

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only cancel your own orders'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled in its current status'
      });
    }

    // Use transaction for multiple operations
    await prisma.$transaction(async (tx) => {
      // Create cancellation request
      const cancellation = await tx.order_cancellations.create({
        data: { order_id: id,
          cancellation_type: type,
          reason,
          requested_by: userId,
          approved_by: isAdmin ? userId : null, // Admin can approve immediately, customer requests are auto-approved
          refundAmount: order.total,
          refundMethod: order.paymentMethod,
          status: isAdmin ? 'processed' : 'approved', // Admin cancellations are processed, customer cancellations are approved
          processedAt: new Date()
        }
      });

      // Store cancellation ID for response
      cancellationId = cancellation.id;

      // Update order status to cancelled
      await tx.orders.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      // Create status history record
      await tx.order_status_histories.create({
        data: { order_id: id,
          previousStatus: order.status,
          newStatus: 'cancelled',
          changed_by: userId,
          reason: `Cancellation: ${type}`,
          metadata: {
            cancellationId: cancellation.id,
            cancellation_type: type,
            refundAmount: order.total,
            refundMethod: order.paymentMethod
          }
        }
      });

      console.log(`[Order Management] Order ${id} cancelled by user ${userId} (${isAdmin ? 'admin' : 'customer'}), cancellation ID: ${cancellation.id}`);
    });

    res.status(201).json({
      success: true,
      cancellationId,
      status: 'cancelled',
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Create order cancellation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/orders/:id/cancellations/:cancellationId/approve - Approve a cancellation request
router.put('/:id/cancellations/:cancellationId/approve', [
  param('id').isUUID(),
  param('cancellationId').isUUID(),
  body('refundAmount').optional().isNumeric(),
  body('refundMethod').optional().isString(),
  body('adminNotes').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id, cancellationId } = req.params;
    const { refundAmount, refundMethod, adminNotes } = req.body;
    const adminId = req.user.id;

    // Check if cancellation exists and belongs to order
    const cancellation = await prisma.order_cancellations.findFirst({
      where: {
        id: cancellationId,
        order_id: id
      }
    });

    if (!cancellation) {
      return res.status(404).json({
        success: false,
        error: 'Cancellation request not found'
      });
    }

    if (cancellation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cancellation request has already been processed'
      });
    }

    // Get order details
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Use transaction for multiple operations
    await prisma.$transaction(async (tx) => {
      // Update cancellation status
      await tx.order_cancellations.update({
        where: { id: cancellationId },
        data: {
          status: 'approved',
          approved_by: adminId,
          refundAmount: refundAmount || order.total,
          refundMethod: refundMethod || order.paymentMethod,
          adminNotes
        }
      });

      // Update order status to cancelled
      await tx.orders.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      // Create status history record
      await tx.order_status_histories.create({
        data: { order_id: id,
          previousStatus: order.status,
          newStatus: 'cancelled',
          changed_by: adminId,
          reason: `Cancellation approved: ${cancellation.cancellationType}`,
          metadata: {
            cancellationId,
            cancellationType: cancellation.cancellationType,
            refundAmount: refundAmount || order.total,
            refundMethod
          }
        }
      });

      // Mark cancellation as processed
      await tx.order_cancellations.update({
        where: { id: cancellationId },
        data: {
          status: 'processed',
          processedAt: new Date()
        }
      });
    });

    console.log(`[Order Management] Cancellation ${cancellationId} approved for order ${id} by admin ${adminId}`);

    res.json({
      success: true,
      message: 'Cancellation request approved and processed successfully',
      refundDetails: {
        amount: refundAmount || order.total,
        method: refundMethod || order.paymentMethod
      }
    });

  } catch (error) {
    console.error('Approve order cancellation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve cancellation request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/orders/:id/cancellations/:cancellationId/reject - Reject a cancellation request
router.put('/:id/cancellations/:cancellationId/reject', [
  param('id').isUUID(),
  param('cancellationId').isUUID(),
  body('reason').isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id, cancellationId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Check if cancellation exists and belongs to order
    const cancellation = await prisma.order_cancellations.findFirst({
      where: {
        id: cancellationId,
        order_id: id
      }
    });

    if (!cancellation) {
      return res.status(404).json({
        success: false,
        error: 'Cancellation request not found'
      });
    }

    if (cancellation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cancellation request has already been processed'
      });
    }

    // Update cancellation status
    await prisma.order_cancellations.update({
      where: { id: cancellationId },
      data: {
        status: 'rejected',
        approved_by: adminId,
        adminNotes: reason
      }
    });

    console.log(`[Order Management] Cancellation ${cancellationId} rejected for order ${id} by admin ${adminId}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Cancellation request rejected successfully'
    });

  } catch (error) {
    console.error('Reject order cancellation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject cancellation request',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/cancellations - Get all cancellation requests for an order
router.get('/:id/cancellations', [
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

    const cancellations = await prisma.order_cancellations.findMany({
      where: { order_id: id },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: cancellations
    });

  } catch (error) {
    console.error('Get order cancellations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cancellation requests',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 3. Order Fulfillment Endpoints
// ============================================================================

// POST /api/v1/orders/:id/fulfillments - Create fulfillment record for an order
router.post('/:id/fulfillments', [
  param('id').isUUID(),
  body('courier_service_id').optional().isUUID(),
  body('tracking_number').optional().isString(),
  body('estimated_delivery').optional().isISO8601(),
  body('packaging_details').optional().isObject()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { courier_service_id, tracking_number, estimated_delivery, packaging_details } = req.body;
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
    if (courier_service_id) {
      const courier = await prisma.courier_services.findUnique({
        where: { id: courier_service_id }
      });

      if (!courier) {
        return res.status(400).json({
          success: false,
          error: 'Courier service not found'
        });
      }
    }

    // Create fulfillment record
    const fulfillment = await prisma.order_fulfillments.create({
      data: {
        order_id: id,
        courier_service_id,
        tracking_number,
        estimated_delivery: estimated_delivery ? new Date(estimated_delivery) : null,
        packaging_details,
        shipped_at: new Date()
      }
    });

    // Update order status to shipped if not already
    if (order.status !== 'shipped' && order.status !== 'delivered') {
      await prisma.orders.update({
        where: { id },
        data: {
          status: 'shipped',
          shipped_at: new Date()
        }
      });

      // Create status history record
      await prisma.order_status_histories.create({
        data: {
          order_id: id,
          previous_status: order.status,
          new_status: 'shipped',
          changed_by: adminId,
          reason: 'Order shipped',
          metadata: {
            fulfillment_id: fulfillment.id,
            tracking_number,
            courier_service_id
          }
        }
      });
    }

    console.log(`[Order Management] Fulfillment created: ${fulfillment.id} for order ${id}`);

    res.status(201).json({
      success: true,
      fulfillment_id: fulfillment.id,
      tracking_number: fulfillment.tracking_number,
      message: 'Fulfillment record created successfully'
    });

  } catch (error) {
    console.error('Create order fulfillment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create fulfillment record',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/orders/:id/fulfillments/:fulfillment_id - Update fulfillment details
router.put('/:id/fulfillments/:fulfillment_id', [
  param('id').isUUID(),
  param('fulfillment_id').isUUID(),
  body('tracking_number').optional().isString(),
  body('estimated_delivery').optional().isISO8601(),
  body('packaging_details').optional().isObject(),
  body('actualDeliveryDate').optional().isISO8601(),
  body('notes').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id, fulfillment_id } = req.params;
    const { tracking_number, estimated_delivery, packaging_details, actualDeliveryDate, notes } = req.body;

    // Check if fulfillment exists and belongs to order
    const fulfillment = await prisma.order_fulfillments.findFirst({
      where: {
        id: fulfillment_id,
        order_id: id
      }
    });

    if (!fulfillment) {
      return res.status(404).json({
        success: false,
        error: 'Fulfillment record not found'
      });
    }

    // Update fulfillment
    const updatedFulfillment = await prisma.order_fulfillments.update({
      where: { id: fulfillment_id },
      data: {
        tracking_number,
        estimated_delivery: estimated_delivery ? new Date(estimated_delivery) : undefined,
        packaging_details,
        delivered_at: actualDeliveryDate ? new Date(actualDeliveryDate) : undefined
      }
    });

    // If actual delivery date is provided, update order status to delivered
    if (actualDeliveryDate) {
      const order = await prisma.orders.findUnique({
        where: { id }
      });

      if (order && order.status !== 'delivered') {
        await prisma.orders.update({
          where: { id },
          data: {
            status: 'delivered',
            delivered_at: new Date(actualDeliveryDate)
          }
        });

        // Create status history record
        await prisma.order_status_histories.create({
          data: {
            order_id: id,
            previous_status: order.status,
            new_status: 'delivered',
            changed_by: req.user.id,
            reason: 'Order delivered',
            metadata: {
              fulfillment_id,
              deliveryDate: actualDeliveryDate
            }
          }
        });
      }
    }

    console.log(`[Order Management] Fulfillment ${fulfillment_id} updated for order ${id}`);

    res.json({
      success: true,
      message: 'Fulfillment details updated successfully'
    });

  } catch (error) {
    console.error('Update order fulfillment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update fulfillment details',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/fulfillments - Get fulfillment details for an order
router.get('/:id/fulfillments', [
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

    const fulfillments = await prisma.order_fulfillments.findMany({
      where: { order_id: id },
      include: { courier_services: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: fulfillments
    });

  } catch (error) {
    console.error('Get order fulfillments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fulfillment details',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 5. Order Tracking Events Endpoints
// ============================================================================

// POST /api/v1/orders/:id/tracking-events - Add tracking event from courier
router.post('/:id/tracking-events', [
  param('id').isUUID(),
  body('status').isString(),
  body('location').optional().isString(),
  body('description').optional().isString(),
  body('eventData').optional().isObject()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, description, eventData } = req.body;

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

    // Get fulfillment for this order
    const fulfillment = await prisma.order_fulfillments.findFirst({
      where: { order_id: id }
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
        event_time: new Date(),
        rawData: eventData
      }
    });

    // Update order status based on event
    let newStatus = null;
    if (status.toLowerCase().includes('delivered')) {
      newStatus = 'delivered';
    } else if (status.toLowerCase().includes('shipped') || status.toLowerCase().includes('picked up')) {
      newStatus = 'shipped';
    } else if (status.toLowerCase().includes('out for delivery')) {
      newStatus = 'shipped'; // Keep as shipped until delivered
    }

    if (newStatus && order.status !== newStatus) {
      await prisma.orders.update({
        where: { id },
        data: { status: newStatus }
      });

      // Create status history record
      await prisma.order_status_histories.create({
        data: {
          order_id: id,
          previous_status: order.status,
          new_status,
          changed_by: req.user.id,
          reason: `Tracking event: ${status}`,
          metadata: {
            trackingEventId: trackingEvent.id,
            status,
            location
          }
        }
      });
    }

    console.log(`[Order Management] Tracking event created: ${trackingEvent.id} for order ${id} - ${status}`);

    res.status(201).json({
      success: true,
      eventId: trackingEvent.id,
      message: 'Tracking event added successfully'
    });

  } catch (error) {
    console.error('Create tracking event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tracking event',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/tracking-events - Get all tracking events for an order
router.get('/:id/tracking-events', [
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

    const trackingEvents = await prisma.order_tracking_events.findMany({
      where: { order_id: id },
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
      error: 'Failed to fetch tracking events',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/tracking-timeline - Get tracking timeline for an order
router.get('/:id/tracking-timeline', [
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

    // Get order with details
    const order = await prisma.orders.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Get fulfillments separately since Order model doesn't have a relation
    const fulfillments = await prisma.order_fulfillments.findMany({
      where: { order_id: id },
      include: { courier_services: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Get status history
    const statusHistory = await prisma.order_status_histories.findMany({
      where: { order_id: id },
      orderBy: { created_at: 'asc' }
    });

    // Get tracking events
    const trackingEvents = await prisma.order_tracking_events.findMany({
      where: { order_id: id },
      orderBy: { event_time: 'asc' }
    });

    // Build timeline
    const timeline = [
      // Order creation
      {
        type: 'order_created',
        timestamp: order.createdAt,
        status: 'pending',
        description: 'Order placed'
      },
      // Status changes
      ...statusHistory.map(h => ({
        type: 'status_change',
        timestamp: h.createdAt,
        status: h.newStatus,
        previousStatus: h.previousStatus,
        description: h.reason || `Status changed to ${h.newStatus}`,
        changedBy: h.changedBy
      })),
      // Tracking events
      ...trackingEvents.map(e => ({
        type: 'tracking_event',
        timestamp: e.event_time,
        status: e.status,
        description: e.description || e.status,
        location: e.location
      }))
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt
        },
        fulfillment: fulfillments[0] || null,
        timeline
      }
    });

  } catch (error) {
    console.error('Get tracking timeline error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking timeline',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 6. Order Notes Endpoints
// ============================================================================

// POST /api/v1/orders/:id/notes - Add a note to an order
router.post('/:id/notes', [
  param('id').isUUID(),
  body('content').isString().trim(),
  body('type').isIn(['internal', 'customer', 'system', 'fulfillment']),
  body('isPinned').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { content, type, isPinned } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

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

    // Check ownership or admin access
    const hasAccess = await checkOrderOwnership(id, userId, isAdmin);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only add notes to your own orders'
      });
    }

    // Create note
    const note = await prisma.order_notes.create({
      data: {
        order_id: id,
        userId: userId,
        note_type: type,
        content,
        isPinned: is_pinned || false,
        created_by: userId
      }
    });

    console.log(`[Order Management] Note created: ${note.id} for order ${id} by user ${userId}`);

    res.status(201).json({
      success: true,
      noteId: note.id,
      message: 'Note added successfully'
    });

  } catch (error) {
    console.error('Create order note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add note',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/orders/:id/notes - Get all notes for an order
router.get('/:id/notes', [
  param('id').isUUID(),
  query('type').optional().isIn(['internal', 'customer', 'system', 'fulfillment'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
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

    const where = { order_id: id };
    if (type) {
      where.note_type = type;
    }

    const notes = await prisma.order_notes.findMany({
      where,
      orderBy: [
        { is_pinned: 'desc' },
        { created_at: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: notes
    });

  } catch (error) {
    console.error('Get order notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notes',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/v1/orders/:id/notes/:noteId - Update a note
router.put('/:id/notes/:noteId', [
  param('id').isUUID(),
  param('noteId').isUUID(),
  body('content').optional().isString().trim(),
  body('isPinned').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { content, isPinned } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

    // Check if note exists and belongs to order
    const note = await prisma.order_notes.findFirst({
      where: {
        id: noteId,
        order_id: id
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Check if user is creator or admin
    if (note.created_by !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only update your own notes'
      });
    }

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (isPinned !== undefined) updateData.is_pinned = isPinned;
    updateData.updated_by = userId;

    await prisma.order_notes.update({
      where: { id: noteId },
      data: updateData
    });

    console.log(`[Order Management] Note ${noteId} updated for order ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('Update order note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update note',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/v1/orders/:id/notes/:noteId - Delete a note (soft delete)
router.delete('/:id/notes/:noteId', [
  param('id').isUUID(),
  param('noteId').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';

    // Check if note exists and belongs to order
    const note = await prisma.order_notes.findFirst({
      where: {
        id: noteId,
        order_id: id
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Check if user is creator or admin
    if (note.created_by !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own notes'
      });
    }

    // Soft delete by setting deletedAt (Note: OrderNote model doesn't have deletedAt, so we'll actually delete)
    // Since the schema doesn't have deletedAt, we'll do a hard delete
    await prisma.order_notes.delete({
      where: { id: noteId }
    });

    console.log(`[Order Management] Note ${noteId} deleted for order ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Delete order note error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// 7. Order Status History Endpoint
// ============================================================================

// GET /api/v1/orders/:id/status-history - Get complete status change history for an order
router.get('/:id/status-history', [
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

    const statusHistory = await prisma.order_status_histories.findMany({
      where: { order_id: id },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: statusHistory
    });

  } catch (error) {
    console.error('Get order status history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status history',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
