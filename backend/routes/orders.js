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
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get all orders (admin or user-specific)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('userId').optional().isUUID(),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // If user is not admin, only allow access to their own orders
  if (req.userRole !== 'ADMIN') {
    req.query.userId = req.userId;
  }
  try {
    const { page = 1, limit = 20, userId, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          address: true,
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true }
              }
            }
          },
          transactions: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get order by ID
router.get('/:id', [
  param('id').isUUID()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // Get order first to check ownership
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    select: { userId: true }
  });
  
  if (!order) {
    return res.status(404).json({
      error: 'Order not found'
    });
  }
  
  // Check if user is admin or order owner
  if (req.userRole !== 'ADMIN' && order.userId !== req.userId) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own orders'
    });
  }
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        address: true,
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { sortOrder: 0 },
                  take: 1,
                  select: { id: true, url: true, alt: true }
                }
              }
            },
            variant: true
          }
        },
        transactions: true
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: 'Failed to fetch order',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create order
router.post('/', [
  body('addressId').isUUID(),
  body('items').isArray({ min: 1 }),
  body('paymentMethod').isIn(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET']),
  body('notes').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // Use authenticated user's ID
  req.body.userId = req.userId;
  try {
    const { userId, addressId, items, paymentMethod, notes } = req.body;

    // Validate user and address
    const [user, address] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.address.findUnique({ where: { id: addressId } })
    ]);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (!address) {
      return res.status(404).json({
        error: 'Address not found'
      });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(400).json({
          error: `Product ${item.productId} not found`
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product ${product.name}`
        });
      }

      const itemTotal = parseFloat(product.regularPrice) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice: parseFloat(product.regularPrice),
        totalPrice: itemTotal
      });
    }

    // Calculate totals
    const tax = subtotal * 0.15; // 15% tax
    const shippingCost = 100; // Fixed shipping cost
    const discount = 0; // Can be calculated based on coupons
    const total = subtotal + tax + shippingCost - discount;

    // Generate order number
    const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        addressId,
        subtotal,
        tax,
        shippingCost,
        discount,
        total,
        paymentMethod,
        notes,
        status: 'PENDING',
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity
          }
        }
      });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update order status
router.put('/:id/status', [
  param('id').isUUID(),
  body('status').isIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  body('notes').optional().isString()
], handleValidationErrors, authMiddleware.managerOrAdmin(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    const updateData = { status };
    
    // Add timestamp based on status
    if (status === 'CONFIRMED') updateData.confirmedAt = new Date();
    if (status === 'SHIPPED') updateData.shippedAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();
    
    if (notes) updateData.notes = notes;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: 'Failed to update order status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;