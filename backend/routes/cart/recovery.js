/**
 * Cart Recovery Routes
 * 
 * Routes for cart recovery functionality:
 * - GET /api/v1/cart/recover/:token - Validate and get cart by token
 * - POST /api/v1/cart/recover/:token - Recover cart via token
 * - POST /api/v1/cart/abandon - Mark cart as abandoned
 * - GET /api/v1/cart/recovery/stats - Get recovery statistics
 * - POST /api/v1/cart/recovery/schedule - Admin: Schedule recovery
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { cartRecoveryService } = require('../../services/cartRecoveryService');
const { cartReminderService } = require('../../services/cartReminderService');
const { authenticate, authorize } = require('../../middleware/auth');
const { loggerService } = require('../../services/logger');

const logger = loggerService;

/**
 * @route   GET /api/v1/cart/recover/:token
 * @desc    Validate recovery token and get cart details
 * @access  Public
 */
router.get('/recover/:token', [
  param('token').notEmpty().withMessage('Recovery token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.params;
    
    logger.info('Validating recovery token', { token });

    const validation = await cartRecoveryService.validateRecoveryToken(token);

    if (!validation.valid) {
      return res.status(404).json({
        success: false,
        error: validation.reason,
        errorCode: 'INVALID_TOKEN'
      });
    }

    // Track link click
    await cartRecoveryService.trackLinkClick(token, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    const { cart } = validation;

    // Format cart data for response
    const cartData = {
      id: cart.id,
      status: cart.status,
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productNameBn: item.product.nameBn,
        sku: item.product.sku,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.subtotal),
        image: item.product.images[0]?.thumbnailUrl || item.product.images[0]?.optimizedUrl || null,
        variant: item.variant ? {
          id: item.variant.id,
          name: item.variant.name
        } : null
      })),
      totals: {
        subtotal: parseFloat(cart.subtotal),
        tax: parseFloat(cart.tax),
        shipping: parseFloat(cart.shippingCost),
        discount: parseFloat(cart.discount),
        total: parseFloat(cart.total)
      },
      discountCode: cart.discountCode,
      discountAmount: cart.discountAmount ? parseFloat(cart.discountAmount) : null,
      abandonedAt: cart.abandonedAt,
      recoveryAttempts: cart.recoveryAttempts,
      expiryDate: cart.recoveryTokenExpires
    };

    res.json({
      success: true,
      data: cartData,
      message: 'Cart recovered successfully'
    });
  } catch (error) {
    logger.error('Error validating recovery token', {
      token: req.params.token,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to validate recovery token',
      errorCode: 'VALIDATION_ERROR'
    });
  }
});

/**
 * @route   POST /api/v1/cart/recover/:token
 * @desc    Recover cart via token
 * @access  Public
 */
router.post('/recover/:token', [
  param('token').notEmpty().withMessage('Recovery token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token } = req.params;
    const { sessionId, userId } = req.body;

    logger.info('Recovering cart via token', { token, userId });

    const result = await cartRecoveryService.recoverCartViaToken(token, {
      sessionId,
      userId
    });

    if (!result.success) {
      const statusCode = result.errorCode === 'INVALID_TOKEN' ? 404 :
                        result.errorCode === 'ALREADY_CONVERTED' ? 409 :
                        result.errorCode === 'ALREADY_ACTIVE' ? 200 : 400;

      return res.status(statusCode).json({
        success: false,
        error: result.error,
        errorCode: result.errorCode,
        cart: result.cart || null
      });
    }

    // Cancel any pending reminders
    await cartReminderService.cancelReminders(result.cart.id);

    res.json({
      success: true,
      data: {
        cartId: result.cart.id,
        status: result.cart.status,
        recoveredAt: result.cart.recoveredAt
      },
      message: result.message
    });
  } catch (error) {
    logger.error('Error recovering cart via token', {
      token: req.params.token,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to recover cart',
      errorCode: 'RECOVERY_ERROR'
    });
  }
});

/**
 * @route   POST /api/v1/cart/abandon
 * @desc    Mark cart as abandoned
 * @access  Private (authenticated users)
 */
router.post('/abandon', [
  authenticate,
  body('cartId').notEmpty().withMessage('Cart ID is required'),
  body('reason').optional().isString().isLength({ max: 255 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cartId, reason = 'user_action' } = req.body;
    const userId = req.user.id;

    logger.info('Marking cart as abandoned', { cartId, userId, reason });

    // Verify cart belongs to user
    const cart = await cartRecoveryService.prisma.cart.findFirst({
      where: {
        id: cartId,
        userId
      }
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found or does not belong to user'
      });
    }

    const updatedCart = await cartRecoveryService.markCartAsAbandoned(cartId, reason);

    // Schedule recovery reminders
    await cartRecoveryService.scheduleRecoveryReminders(cartId);

    res.json({
      success: true,
      data: {
        cartId: updatedCart.id,
        status: updatedCart.status,
        abandonedAt: updatedCart.abandonedAt
      },
      message: 'Cart marked as abandoned'
    });
  } catch (error) {
    logger.error('Error marking cart as abandoned', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to mark cart as abandoned'
    });
  }
});

/**
 * @route   GET /api/v1/cart/recovery/stats
 * @desc    Get recovery statistics
 * @access  Admin
 */
router.get('/recovery/stats', [
  authenticate,
  authorize('admin'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { startDate, endDate } = req.query;

    logger.info('Getting recovery statistics', { startDate, endDate });

    const stats = await cartRecoveryService.getRecoveryStatistics(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting recovery statistics', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get recovery statistics'
    });
  }
});

/**
 * @route   POST /api/v1/cart/recovery/schedule
 * @desc    Admin: Schedule recovery for cart(s)
 * @access  Admin
 */
router.post('/recovery/schedule', [
  authenticate,
  authorize('admin'),
  body('cartId').optional().isString(),
  body('cartIds').optional().isArray(),
  body('template').optional().isIn(['recovery', 'reminder', 'final'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { cartId, cartIds, template = 'recovery', discountCode, discountAmount } = req.body;
    const adminId = req.user.id;

    const ids = cartIds || (cartId ? [cartId] : []);

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No cart IDs provided'
      });
    }

    logger.info('Admin scheduling recovery', { 
      adminId, 
      cartCount: ids.length, 
      template 
    });

    const results = {
      successful: [],
      failed: []
    };

    for (const id of ids) {
      try {
        const result = await cartRecoveryService.sendRecoveryEmail(id, template, {
          discountCode,
          discountAmount
        });

        results.successful.push({
          cartId: id,
          email: result.email,
          messageId: result.messageId
        });
      } catch (error) {
        results.failed.push({
          cartId: id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        total: ids.length,
        successful: results.successful.length,
        failed: results.failed.length,
        results
      },
      message: `Recovery emails sent: ${results.successful.length}/${ids.length}`
    });
  } catch (error) {
    logger.error('Error scheduling recovery', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to schedule recovery'
    });
  }
});

/**
 * @route   GET /api/v1/cart/recovery/email-track/:token
 * @desc    Track email open (pixel tracking)
 * @access  Public
 */
router.get('/recovery/email-track/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Track the email open
    await cartRecoveryService.trackEmailOpen(token, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });

    // Return 1x1 transparent pixel
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.send(pixel);
  } catch (error) {
    // Silently fail for tracking pixels
    res.set('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
});

/**
 * @route   POST /api/v1/cart/recovery/cancel/:cartId
 * @desc    Cancel recovery reminders for a cart
 * @access  Private (cart owner or admin)
 */
router.post('/recovery/cancel/:cartId', [
  authenticate,
  param('cartId').notEmpty().withMessage('Cart ID is required')
], async (req, res) => {
  try {
    const { cartId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    // Verify ownership
    const cart = await cartRecoveryService.prisma.cart.findFirst({
      where: isAdmin ? { id: cartId } : { id: cartId, userId }
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    await cartReminderService.cancelReminders(cartId);

    res.json({
      success: true,
      message: 'Recovery reminders cancelled'
    });
  } catch (error) {
    logger.error('Error cancelling reminders', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to cancel reminders'
    });
  }
});

/**
 * @route   GET /api/v1/cart/abandoned
 * @desc    Get abandoned carts (admin only)
 * @access  Admin
 */
router.get('/abandoned', [
  authenticate,
  authorize('admin'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['abandonedAt', 'total', 'reminderCount']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'abandonedAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const skip = (page - 1) * limit;

    const [carts, total] = await Promise.all([
      cartRecoveryService.prisma.cart.findMany({
        where: { status: 'abandoned' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, regularPrice: true, salePrice: true }
              }
            },
            take: 3
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      cartRecoveryService.prisma.cart.count({
        where: { status: 'abandoned' }
      })
    ]);

    const formattedCarts = carts.map(cart => ({
      id: cart.id,
      user: cart.user,
      itemCount: cart.items.length,
      total: parseFloat(cart.total),
      abandonedAt: cart.abandonedAt,
      reminderCount: cart.reminderCount,
      recoveryAttempts: cart.recoveryAttempts,
      preview: cart.items.map(item => ({
        productName: item.product.name,
        quantity: item.quantity
      }))
    }));

    res.json({
      success: true,
      data: {
        carts: formattedCarts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting abandoned carts', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get abandoned carts'
    });
  }
});

module.exports = router;
