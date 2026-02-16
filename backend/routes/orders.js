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
  query('status').optional().isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'processing', 'refunded'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  // If user is not admin, only allow access to their own orders
  if (req.user.role?.toUpperCase() !== 'ADMIN') {
    req.query.userId = req.user.id;
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
  try {
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
    const isAdmin = req.user.role?.toUpperCase() === 'ADMIN';
    if (!isAdmin && order.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own orders'
      });
    }

    const { id } = req.params;

    const orderDetails = await prisma.order.findUnique({
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
                  where: { displayOrder: 0 },
                  take: 1,
                  select: {
                    id: true,
                    originalUrl: true,  // FIXED: was 'url'
                    altTextEn: true    // FIXED: was 'alt'
                  }
                }
              }
            },
            variant: true  // FIXED: Moved to correct level (OrderItem has variant relation)
          }
        },
        transactions: true
      }
    });

    if (!orderDetails) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    res.json({ order: orderDetails });

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
  body('addressId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid address ID'),
  body('shippingAddress').optional().isObject().withMessage('Invalid shipping address'),
  body('billingAddress').optional().isObject().withMessage('Invalid billing address'),
  body('items').optional().isArray({ min: 1 }),
  body('items.*.productId').optional().isUUID(),
  body('items.*.quantity').optional().isInt({ min: 1 }),
  body('items.*.unitPrice').optional().isNumeric().withMessage('Unit price is required'),
  body('items.*.variantId').optional().custom((value, { req }) => {
    // Allow null or valid UUID
    if (value === null || value === undefined) {
      return true;
    }
    // Check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }).withMessage('Variant ID must be a valid UUID or null'),
  body('paymentMethod').isIn(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'BKASH', 'NAGAD', 'ROCKET']),
  body('notes').optional().isString()
], handleValidationErrors, authMiddleware.optional(), async (req, res) => {
  // Use authenticated user's ID if available, otherwise null for guest
  req.body.userId = req.user?.id || null;
  try {
    const { userId, addressId, shippingAddress, billingAddress, items, paymentMethod, notes } = req.body;

    // Validate user if provided (authenticated users)
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
    }

    // Handle address - either use saved addressId or create from address objects
    let finalAddressId = addressId;
    if (!addressId && (shippingAddress || billingAddress)) {
      // For guest users with address objects, create temporary address records
      // Use shipping address for both if billing address not provided
      const addressToUse = billingAddress || shippingAddress;

      // Handle both fullName and firstName/lastName formats
      let firstName, lastName;
      if (addressToUse.fullName) {
        // Split fullName into firstName and lastName
        const nameParts = addressToUse.fullName.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else {
        firstName = addressToUse.firstName || '';
        lastName = addressToUse.lastName || '';
      }

      const newAddress = await prisma.address.create({
        data: {
          userId: userId || null, // null for guest orders
          firstName,
          lastName,
          phone: addressToUse.phone,
          address: addressToUse.addressLine1 || addressToUse.address || '',
          addressLine2: addressToUse.addressLine2 || '',
          city: addressToUse.city,
          district: addressToUse.state || addressToUse.district || '',
          division: addressToUse.country || addressToUse.division || 'Dhaka',
          postalCode: addressToUse.postalCode || addressToUse.zip || '',
          upazila: addressToUse.upazila || '',
          isDefault: false,
          addressType: 'shipping'
        }
      });
      finalAddressId = newAddress.id;
    } else if (addressId) {
      // Validate that the saved address exists
      const address = await prisma.address.findUnique({ where: { id: addressId } });
      if (!address) {
        return res.status(404).json({
          error: 'Address not found'
        });
      }
    } else {
      return res.status(400).json({
        error: 'Either addressId or shippingAddress is required'
      });
    }

    // Fetch items from cart if not provided in request body
    let cartItems = items;
    if (!cartItems || cartItems.length === 0) {
      const sessionId = req.headers['x-session-id'] || null;
      
      // Get cart based on user type
      let cart = null;
      if (userId) {
        // Authenticated user - get their cart
        cart = await prisma.cart.findFirst({
          where: { userId },
          include: {
            items: {
              include: {
                product: true,
                variant: true
              }
            }
          }
        });
      } else if (sessionId) {
        // Guest user - get their cart by session ID
        cart = await prisma.cart.findFirst({
          where: { sessionId },
          include: {
            items: {
              include: {
                product: true,
                variant: true
              }
            }
          }
        });
      }

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          error: 'Cart is empty or not found'
        });
      }

      // Transform cart items to order items format
      cartItems = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        variantId: item.variantId
      }));
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(400).json({
          error: `Product ${item.productId} not found`
        });
      }

      // Check if item has a variant and use variant price if available
      let unitPrice;
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId }
        });
        if (!variant) {
          return res.status(400).json({
            error: `Variant ${item.variantId} not found`
          });
        }
        unitPrice = parseFloat(variant.price);
      } else {
        // Use unitPrice from request if provided, otherwise fall back to regularPrice
        unitPrice = item.unitPrice ? parseFloat(item.unitPrice) : parseFloat(product.regularPrice);
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product ${product.name}`
        });
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice,  // Use actual price from cart (may include discounts)
        totalPrice: itemTotal,
        ...(item.variantId && { variantId: item.variantId })
      });
    }

    // Calculate totals
    // Discount is already applied at the cart level (item.unitPrice reflects the discounted price)
    // No additional discount is applied at the order level
    const discount = 0;

    // Calculate tax based on product-specific tax rates
    let tax = 0;
    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      const productTaxRate = parseFloat(product.taxRate || 0);
      const itemTax = parseFloat(item.unitPrice) * item.quantity * (productTaxRate / 100);
      tax += itemTax;
    }

    // Free shipping for orders with subtotal >= 5000
    const shippingCost = subtotal >= 5000 ? 0 : 100;
    const total = subtotal + tax + shippingCost - discount;

    // Generate order number
    const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

    // Convert paymentMethod to lowercase for Prisma
    const paymentMethodLower = paymentMethod.toLowerCase();

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        addressId: finalAddressId,
        subtotal,
        tax,
        shippingCost,
        discount,
        total,
        paymentMethod: paymentMethodLower,
        notes,
        status: 'pending',
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
    for (const item of cartItems) {
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
  body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'processing', 'refunded']),
  body('notes').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.managerOrAdmin(), async (req, res) => {
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
    if (status === 'confirmed') updateData.confirmedAt = new Date();
    if (status === 'shipped') updateData.shippedAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();
    
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