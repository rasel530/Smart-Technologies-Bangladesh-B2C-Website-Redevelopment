const { guestCheckoutService } = require('../services/guestCheckoutService');
const { cartService } = require('../services/cartService');
const { loggerService } = require('../services/logger');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Validate UUID format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid UUID
 */
const validateUUID = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Middleware for guest session ID validation
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const validateGuestSessionId = (req, res, next) => {
  const { sessionId } = req.params;
  if (!validateUUID(sessionId)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid guest session ID format',
        code: 400,
        details: { sessionId: 'Must be a valid UUID' }
      }
    });
  }
  next();
};

/**
 * Guest Checkout Controller
 * Handles all guest checkout flow operations
 */
class GuestCheckoutController {
  /**
   * Initiate guest checkout
   * @route POST /api/v1/guest/checkout/initiate
   */
  async initiateGuestCheckout(req, res) {
    try {
      const { cartId } = req.body;

      loggerService.info('[initiateGuestCheckout] Initiating guest checkout', {
        cartId,
        timestamp: new Date().toISOString()
      });

      // Validate cartId is provided
      if (!cartId) {
        return res.status(400).json({
          success: false,
          error: 'Cart ID is required',
          message: 'Cart ID is required',
          messageBn: 'কার্ট আইডি প্রয়োজন'
        });
      }

      // Validate cartId format
      if (!validateUUID(cartId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cart ID format',
          message: 'Invalid cart ID format',
          messageBn: 'অবৈধ কার্ট আইডি ফরম্যাট'
        });
      }

      // Validate cart exists and is not empty
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: true }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      if (cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart is empty',
          message: 'Cart is empty',
          messageBn: 'কার্ট খালি'
        });
      }

      // Generate unique session ID
      const sessionId = crypto.randomUUID();

      // Create guest session
      const guestSession = await guestCheckoutService.createGuestSession(sessionId, cartId);

      // Calculate cart totals
      const totals = await cartService.calculateCartTotals(cartId);

      res.status(201).json({
        success: true,
        message: 'Guest checkout initiated successfully',
        messageBn: 'অতিথি চেকআউট সফলভাবে শুরু হয়েছে',
        data: {
          sessionId: guestSession.sessionId,
          cartId: guestSession.cartId,
          expiresAt: guestSession.expiresAt,
          totals
        }
      });
    } catch (error) {
      loggerService.error('Error in initiateGuestCheckout controller', {
        error: error.message,
        stack: error.stack,
        cartId: req.body?.cartId
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to initiate guest checkout',
        message: 'Failed to initiate guest checkout',
        messageBn: 'অতিথি চেকআউট শুরু করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get guest checkout session
   * @route GET /api/v1/guest/checkout/session/:sessionId
   */
  async getGuestCheckoutSession(req, res) {
    try {
      const { sessionId } = req.params;

      loggerService.info('[getGuestCheckoutSession] Getting guest checkout session', {
        sessionId,
        timestamp: new Date().toISOString()
      });

      // Track guest activity
      await guestCheckoutService.trackGuestActivity(sessionId);

      // Get guest session
      const guestSession = await guestCheckoutService.getGuestSession(sessionId);

      res.json({
        success: true,
        message: 'Guest checkout session retrieved successfully',
        messageBn: 'অতিথি চেকআউট সেশন সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: guestSession
      });
    } catch (error) {
      loggerService.error('Error in getGuestCheckoutSession controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to retrieve guest checkout session';
      let errorMessageBn = 'অতিথি চেকআউট সেশন পুনরুদ্ধার করতে ব্যর্থ হয়েছে';

      if (error.message === 'Guest session not found') {
        statusCode = 404;
        errorMessage = 'Guest session not found';
        errorMessageBn = 'অতিথি সেশন পাওয়া যায়নি';
      } else if (error.message === 'Guest session has expired') {
        statusCode = 410;
        errorMessage = 'Guest session has expired';
        errorMessageBn = 'অতিথি সেশন মেয়াদোত্তীর্ণ হয়েছে';
      } else if (error.message === 'Guest session has been converted to user') {
        statusCode = 400;
        errorMessage = 'Guest session has been converted to user';
        errorMessageBn = 'অতিথি সেশন ব্যবহারকারীতে রূপান্তরিত হয়েছে';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Save guest information
   * @route POST /api/v1/guest/checkout/session/:sessionId/info
   */
  async saveGuestInfo(req, res) {
    try {
      const { sessionId } = req.params;
      const { firstName, lastName, email, phone } = req.body;

      loggerService.info('[saveGuestInfo] Saving guest information', {
        sessionId,
        firstName,
        lastName,
        email,
        phone,
        timestamp: new Date().toISOString()
      });

      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'First name and last name are required',
          message: 'First name and last name are required',
          messageBn: 'নামের প্রথম অংশ এবং শেষ অংশ প্রয়োজন'
        });
      }

      // Validate email format if provided
      if (email && !guestCheckoutService.validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          message: 'Invalid email format',
          messageBn: 'অবৈধ ইমেইল ফরম্যাট'
        });
      }

      // Validate phone format if provided
      if (phone && !guestCheckoutService.validatePhone(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Must be a valid Bangladesh phone number',
          message: 'Invalid phone number format',
          messageBn: 'অবৈধ ফোন নম্বর ফরম্যাট'
        });
      }

      // Update guest session
      const updatedSession = await guestCheckoutService.updateGuestSession(sessionId, {
        firstName,
        lastName,
        email,
        phone
      });

      res.json({
        success: true,
        message: 'Guest information saved successfully',
        messageBn: 'অতিথি তথ্য সফলভাবে সংরক্ষিত হয়েছে',
        data: updatedSession
      });
    } catch (error) {
      loggerService.error('Error in saveGuestInfo controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to save guest information';
      let errorMessageBn = 'অতিথি তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে';

      if (error.message === 'Guest session not found') {
        statusCode = 404;
        errorMessage = 'Guest session not found';
        errorMessageBn = 'অতিথি সেশন পাওয়া যায়নি';
      } else if (error.message === 'Guest session has expired') {
        statusCode = 410;
        errorMessage = 'Guest session has expired';
        errorMessageBn = 'অতিথি সেশন মেয়াদোত্তীর্ণ হয়েছে';
      } else if (error.message === 'Guest session has been converted to user') {
        statusCode = 400;
        errorMessage = 'Guest session has been converted to user';
        errorMessageBn = 'অতিথি সেশন ব্যবহারকারীতে রূপান্তরিত হয়েছে';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Complete guest checkout
   * @route POST /api/v1/guest/checkout/session/:sessionId/complete
   */
  async completeGuestCheckout(req, res) {
    try {
      const { sessionId } = req.params;
      const { shippingAddress, billingAddress, paymentMethod, paymentDetails, notes } = req.body;

      loggerService.info('[completeGuestCheckout] Completing guest checkout', {
        sessionId,
        paymentMethod,
        timestamp: new Date().toISOString()
      });

      // Get guest session
      const guestSession = await guestCheckoutService.getGuestSession(sessionId);

      // Validate guest information is complete
      if (!guestSession.firstName || !guestSession.lastName) {
        return res.status(400).json({
          success: false,
          error: 'Guest name is required',
          message: 'Guest name is required',
          messageBn: 'অতিথির নাম প্রয়োজন'
        });
      }

      if (!guestSession.email && !guestSession.phone) {
        return res.status(400).json({
          success: false,
          error: 'Email or phone is required',
          message: 'Email or phone is required',
          messageBn: 'ইমেইল বা ফোন প্রয়োজন'
        });
      }

      // Validate shipping address
      if (!shippingAddress) {
        return res.status(400).json({
          success: false,
          error: 'Shipping address is required',
          message: 'Shipping address is required',
          messageBn: 'শিপিং ঠিকানা প্রয়োজন'
        });
      }

      // Validate payment method
      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          error: 'Payment method is required',
          message: 'Payment method is required',
          messageBn: 'পেমেন্ট পদ্ধতি প্রয়োজন'
        });
      }

      // Create address for guest order
      const address = await prisma.address.create({
        data: {
          userId: null, // Guest order
          firstName: shippingAddress.firstName || guestSession.firstName,
          lastName: shippingAddress.lastName || guestSession.lastName,
          phone: shippingAddress.phone || guestSession.phone,
          address: shippingAddress.addressLine1 || shippingAddress.address || '',
          addressLine2: shippingAddress.addressLine2 || '',
          city: shippingAddress.city,
          district: shippingAddress.district,
          division: shippingAddress.division || 'Dhaka',
          postalCode: shippingAddress.postalCode || '',
          upazila: shippingAddress.upazila || '',
          isDefault: false,
          type: 'shipping'
        }
      });

      // Get cart items
      const cart = await prisma.cart.findUnique({
        where: { id: guestSession.cartId },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });

      // Calculate totals
      const totals = await cartService.calculateCartTotals(guestSession.cartId);

      // Generate order number
      const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

      // Create order using transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: null, // Guest order
            addressId: address.id,
            subtotal: totals.subtotal,
            tax: totals.tax,
            shippingCost: totals.shippingCost,
            discount: totals.discount,
            total: totals.total,
            paymentMethod: paymentMethod.toLowerCase(),
            paymentDetails: {
              ...paymentDetails,
              email: guestSession.email,
              phone: guestSession.phone,
              firstName: guestSession.firstName,
              lastName: guestSession.lastName
            },
            notes: notes || `Guest order - Email: ${guestSession.email}, Phone: ${guestSession.phone}`,
            status: 'pending',
            items: {
              create: cart.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: parseFloat(item.price),
                totalPrice: parseFloat(item.price) * item.quantity,
                ...(item.variantId && { variantId: item.variantId })
              }))
            }
          }
        });

        // Update product stock
        for (const item of cart.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity
                }
              }
            });
          }
        }

        // Mark cart as converted
        await tx.cart.update({
          where: { id: guestSession.cartId },
          data: {
            status: 'converted'
          }
        });

        // Mark guest session as completed
        await tx.guestSession.update({
          where: { id: guestSession.id },
          data: {
            metadata: {
              ...guestSession.metadata,
              orderId: newOrder.id,
              orderNumber: newOrder.orderNumber,
              completedAt: new Date().toISOString()
            }
          }
        });

        return newOrder;
      });

      res.status(201).json({
        success: true,
        message: 'Guest order created successfully',
        messageBn: 'অতিথি অর্ডার সফলভাবে তৈরি করা হয়েছে',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          email: guestSession.email,
          phone: guestSession.phone
        }
      });
    } catch (error) {
      loggerService.error('Error in completeGuestCheckout controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to complete guest checkout';
      let errorMessageBn = 'অতিথি চেকআউট সম্পূর্ণ করতে ব্যর্থ হয়েছে';

      if (error.message === 'Guest session not found') {
        statusCode = 404;
        errorMessage = 'Guest session not found';
        errorMessageBn = 'অতিথি সেশন পাওয়া যায়নি';
      } else if (error.message === 'Guest session has expired') {
        statusCode = 410;
        errorMessage = 'Guest session has expired';
        errorMessageBn = 'অতিথি সেশন মেয়াদোত্তীর্ণ হয়েছে';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Get guest orders
   * @route GET /api/v1/guest/orders
   */
  async getGuestOrders(req, res) {
    try {
      const { email, phone, page = 1, limit = 20 } = req.query;

      loggerService.info('[getGuestOrders] Getting guest orders', {
        email,
        phone,
        page,
        limit,
        timestamp: new Date().toISOString()
      });

      // Validate email or phone is provided
      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          error: 'Email or phone is required',
          message: 'Email or phone is required',
          messageBn: 'ইমেইল বা ফোন প্রয়োজন'
        });
      }

      // Get guest orders
      const orders = await guestCheckoutService.getGuestOrders(email, phone);

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedOrders = orders.slice(skip, skip + parseInt(limit));

      res.json({
        success: true,
        message: 'Guest orders retrieved successfully',
        messageBn: 'অতিথি অর্ডার সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          orders: paginatedOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: orders.length,
            pages: Math.ceil(orders.length / parseInt(limit))
          }
        }
      });
    } catch (error) {
      loggerService.error('Error in getGuestOrders controller', {
        error: error.message,
        stack: error.stack,
        email: req.query.email,
        phone: req.query.phone
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve guest orders',
        message: 'Failed to retrieve guest orders',
        messageBn: 'অতিথি অর্ডার পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get guest order details
   * @route GET /api/v1/guest/orders/:orderNumber
   */
  async getGuestOrderDetails(req, res) {
    try {
      const { orderNumber } = req.params;
      const { email, phone } = req.query;

      loggerService.info('[getGuestOrderDetails] Getting guest order details', {
        orderNumber,
        email,
        phone,
        timestamp: new Date().toISOString()
      });

      // Validate email or phone is provided
      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          error: 'Email or phone is required',
          message: 'Email or phone is required',
          messageBn: 'ইমেইল বা ফোন প্রয়োজন'
        });
      }

      // Get order by order number
      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
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
                      originalUrl: true,
                      thumbnailUrl: true,
                      altTextEn: true,
                      altTextBn: true
                    }
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
          success: false,
          error: 'Order not found',
          message: 'Order not found',
          messageBn: 'অর্ডার পাওয়া যায়নি'
        });
      }

      // Validate guest owns the order
      const paymentDetails = order.paymentDetails || {};
      const orderEmail = paymentDetails.email;
      const orderPhone = paymentDetails.phone || order.address?.phone;

      if (email && orderEmail !== email) {
        return res.status(403).json({
          success: false,
          error: 'Order does not belong to this email',
          message: 'Order does not belong to this email',
          messageBn: 'অর্ডারটি এই ইমেইলের নয়'
        });
      }

      if (phone && orderPhone !== phone) {
        return res.status(403).json({
          success: false,
          error: 'Order does not belong to this phone number',
          message: 'Order does not belong to this phone number',
          messageBn: 'অর্ডারটি এই ফোন নম্বরের নয়'
        });
      }

      res.json({
        success: true,
        message: 'Guest order details retrieved successfully',
        messageBn: 'অতিথি অর্ডার বিবরণ সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: order
      });
    } catch (error) {
      loggerService.error('Error in getGuestOrderDetails controller', {
        error: error.message,
        stack: error.stack,
        orderNumber: req.params.orderNumber
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve guest order details',
        message: 'Failed to retrieve guest order details',
        messageBn: 'অতিথি অর্ডার বিবরণ পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Merge guest cart on login
   * @route POST /api/v1/guest/merge-cart
   */
  async mergeGuestCart(req, res) {
    try {
      const userId = req.user?.id;
      const { guestSessionId } = req.body;

      loggerService.info('[mergeGuestCart] Merging guest cart', {
        userId,
        guestSessionId,
        timestamp: new Date().toISOString()
      });

      // Validate user is authenticated
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Authentication required',
          messageBn: 'প্রমাণীকরণ প্রয়োজন'
        });
      }

      // Validate guest session ID is provided
      if (!guestSessionId) {
        return res.status(400).json({
          success: false,
          error: 'Guest session ID is required',
          message: 'Guest session ID is required',
          messageBn: 'অতিথি সেশন আইডি প্রয়োজন'
        });
      }

      // Get guest session
      const guestSession = await guestCheckoutService.getGuestSession(guestSessionId);

      // Get user cart
      const userCart = await prisma.cart.findFirst({
        where: { userId }
      });

      if (!userCart) {
        return res.status(404).json({
          success: false,
          error: 'User cart not found',
          message: 'User cart not found',
          messageBn: 'ব্যবহারকারীর কার্ট পাওয়া যায়নি'
        });
      }

      // Merge guest cart with user cart
      const result = await guestCheckoutService.mergeGuestCart(
        guestSession.cartId,
        userCart.id
      );

      // Convert guest session to user
      await guestCheckoutService.convertGuestToUser(guestSessionId, userId);

      res.json({
        success: true,
        message: 'Guest cart merged successfully',
        messageBn: 'অতিথি কার্ট সফলভাবে মার্জ করা হয়েছে',
        data: {
          userCartId: result.userCartId,
          mergedItemCount: result.mergedItemCount,
          totals: result.totals
        }
      });
    } catch (error) {
      loggerService.error('Error in mergeGuestCart controller', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        guestSessionId: req.body?.guestSessionId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to merge guest cart';
      let errorMessageBn = 'অতিথি কার্ট মার্জ করতে ব্যর্থ হয়েছে';

      if (error.message === 'Guest session not found') {
        statusCode = 404;
        errorMessage = 'Guest session not found';
        errorMessageBn = 'অতিথি সেশন পাওয়া যায়নি';
      } else if (error.message === 'Guest session has expired') {
        statusCode = 410;
        errorMessage = 'Guest session has expired';
        errorMessageBn = 'অতিথি সেশন মেয়াদোত্তীর্ণ হয়েছে';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Convert guest to user
   * @route POST /api/v1/guest/convert-to-user
   */
  async convertGuestToUser(req, res) {
    try {
      const { guestSessionId, email, password, firstName, lastName, phone } = req.body;

      loggerService.info('[convertGuestToUser] Converting guest to user', {
        guestSessionId,
        email,
        firstName,
        lastName,
        timestamp: new Date().toISOString()
      });

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, first name, and last name are required',
          message: 'Email, password, first name, and last name are required',
          messageBn: 'ইমেইল, পাসওয়ার্ড, নামের প্রথম অংশ এবং শেষ অংশ প্রয়োজন'
        });
      }

      // Validate email format
      if (!guestCheckoutService.validateEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          message: 'Invalid email format',
          messageBn: 'অবৈধ ইমেইল ফরম্যাট'
        });
      }

      // Validate phone format if provided
      if (phone && !guestCheckoutService.validatePhone(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Must be a valid Bangladesh phone number',
          message: 'Invalid phone number format',
          messageBn: 'অবৈধ ফোন নম্বর ফরম্যাট'
        });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already registered',
          message: 'Email already registered',
          messageBn: 'ইমেইল ইতিমধ্যেই নিবন্ধিত'
        });
      }

      // Get guest session
      const guestSession = await guestCheckoutService.getGuestSession(guestSessionId);

      // Hash password (simple implementation - in production use bcrypt)
      const hashedPassword = password; // TODO: Use bcrypt in production

      // Create user account
      const user = await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || guestSession.phone,
            role: 'customer',
            status: 'active'
          }
        });

        // Get guest cart
        const guestCart = await tx.cart.findUnique({
          where: { id: guestSession.cartId }
        });

        // Create user cart
        const userCart = await tx.cart.create({
          data: {
            userId: newUser.id,
            status: 'active'
          }
        });

        // Merge guest cart items to user cart
        if (guestCart) {
          const guestCartItems = await tx.cartItem.findMany({
            where: { cartId: guestCart.id }
          });

          for (const item of guestCartItems) {
            await tx.cartItem.create({
              data: {
                cartId: userCart.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
              }
            });
          }

          // Mark guest cart as converted
          await tx.cart.update({
            where: { id: guestCart.id },
            data: { status: 'converted' }
          });
        }

        // Convert guest session to user
        await tx.guestSession.update({
          where: { id: guestSession.id },
          data: {
            convertedToUserId: newUser.id,
            convertedAt: new Date()
          }
        });

        return newUser;
      });

      res.status(201).json({
        success: true,
        message: 'Guest converted to user successfully',
        messageBn: 'অতিথি সফলভাবে ব্যবহারকারীতে রূপান্তরিত হয়েছে',
        data: {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        }
      });
    } catch (error) {
      loggerService.error('Error in convertGuestToUser controller', {
        error: error.message,
        stack: error.stack,
        guestSessionId: req.body?.guestSessionId,
        email: req.body?.email
      });

      let statusCode = 500;
      let errorMessage = 'Failed to convert guest to user';
      let errorMessageBn = 'অতিথিকে ব্যবহারকারীতে রূপান্তর করতে ব্যর্থ হয়েছে';

      if (error.message === 'Guest session not found') {
        statusCode = 404;
        errorMessage = 'Guest session not found';
        errorMessageBn = 'অতিথি সেশন পাওয়া যায়নি';
      } else if (error.message === 'Guest session has expired') {
        statusCode = 410;
        errorMessage = 'Guest session has expired';
        errorMessageBn = 'অতিথি সেশন মেয়াদোত্তীর্ণ হয়েছে';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }
}

// Singleton instance
const guestCheckoutController = new GuestCheckoutController();

module.exports = {
  GuestCheckoutController,
  guestCheckoutController,
  validateGuestSessionId
};
