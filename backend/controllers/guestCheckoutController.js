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
   * FIX 3: Improved cart validation - if cartId is provided, validate strictly
   * and return clear errors instead of creating new empty cart
   */
  async initiateGuestCheckout(req, res) {
    try {
      let { cartId, deviceId, sessionId: cartSessionId } = req.body;

      loggerService.info('[initiateGuestCheckout] Initiating guest checkout', {
        cartId,
        deviceId,
        cartSessionId,
        timestamp: new Date().toISOString()
      });

      let validCartId = null;

      // FIX 2: If cartId is provided, validate it strictly - do NOT create new cart if invalid
      if (cartId) {
        loggerService.info('[initiateGuestCheckout] CartId provided, validating...', { cartId });
        
        // Validate cartId format if provided
        if (!validateUUID(cartId)) {
          loggerService.error('[initiateGuestCheckout] Invalid cartId format', { cartId });
          return res.status(400).json({
            success: false,
            error: 'Invalid cart ID format. Cart ID must be a valid UUID.',
            message: 'Invalid cart ID format. Cart ID must be a valid UUID.',
            messageBn: 'অবৈধ কার্ট আইডি ফরম্যাট। কার্ট আইডি একটি বৈধ UUID হতে হবে।'
          });
        }

        // FIX 2: Try multiple lookup strategies for cartId
        let cart = null;
        
        // Strategy 1: Lookup by id (original behavior)
        try {
          loggerService.info('[initiateGuestCheckout] Attempting cart lookup by id...', { cartId });
          cart = await prisma.carts.findUnique({
            where: { id: cartId },
            include: { items: true }
          });
          loggerService.info('[initiateGuestCheckout] Cart lookup by id result', {
            cartId,
            cartFound: !!cart,
            itemCount: cart ? cart.items.length : 0,
            cartStatus: cart?.status,
            cartSessionId: cart?.sessionId,
            cartExpiresAt: cart?.expiresAt
          });
        } catch (dbError) {
          loggerService.error('[initiateGuestCheckout] Database error during cart lookup by id', {
            cartId,
            error: dbError.message,
            errorCode: dbError.code,
            errorStack: dbError.stack
          });
        }

        // FIX 2: Strategy 2: If not found by id, try lookup by sessionId
        // This handles carts created via cart API which use sessionId field
        if (!cart) {
          try {
            loggerService.info('[initiateGuestCheckout] Cart not found by id, trying sessionId lookup...', { cartId });
            cart = await prisma.carts.findFirst({
              where: {
                sessionId: cartId,  // Treat cartId as sessionId
                status: 'active'
              },
              include: { items: true },
              orderBy: { updatedAt: 'desc' }
            });
            loggerService.info('[initiateGuestCheckout] Cart lookup by sessionId result', {
              cartId,
              cartFound: !!cart,
              itemCount: cart ? cart.items.length : 0,
              cartStatus: cart?.status,
              cartSessionId: cart?.sessionId,
              cartExpiresAt: cart?.expiresAt
            });
          } catch (dbError) {
            loggerService.error('[initiateGuestCheckout] Database error during cart lookup by sessionId', {
              cartId,
              error: dbError.message,
              errorCode: dbError.code,
              errorStack: dbError.stack
            });
          }
        }

        // FIX 2: If cart is found but empty, return clear error
        if (cart && cart.items.length === 0) {
          loggerService.error('[initiateGuestCheckout] Cart is empty', { cartId });
          return res.status(400).json({
            success: false,
            error: 'Cart is empty. Cannot initiate checkout with an empty cart.',
            message: 'Your cart is empty. Please add items to your cart before checkout.',
            messageBn: 'আপনার কার্ট খালি। চেকআউট করার আগে অনুগ্রহ করে পণ্য যোগ করুন।'
          });
        }

        // FIX 2: If still not found after all strategies, return clear error
        if (!cart) {
          loggerService.error('[initiateGuestCheckout] Cart not found after all lookup strategies', { 
            cartId,
            deviceId,
            cartSessionId,
            timestamp: new Date().toISOString()
          });
          
          // Try one more fallback: check if cartId exists as sessionId in database
          // This handles case where frontend sends sessionId instead of cart.id
          loggerService.info('[initiateGuestCheckout] Trying final fallback - check if cartId exists as sessionId', { cartId });
          const fallbackCart = await prisma.carts.findFirst({
            where: {
              sessionId: cartId,
              status: 'active'
            },
            include: { items: true },
            orderBy: { updatedAt: 'desc' }
          });
          
          if (fallbackCart) {
            loggerService.info('[initiateGuestCheckout] Cart found via sessionId fallback', {
              cartId,
              foundCartId: fallbackCart.id,
              itemCount: fallbackCart.items.length
            });
            
            // Use the found cart
            cart = fallbackCart;
          } else {
            loggerService.warn('[initiateGuestCheckout] Cart not found even with sessionId fallback', {
              cartId,
              deviceId,
              cartSessionId
            });
          }
        }

        // Use provided cart if it exists and has items
        // CRITICAL FIX: Use cart.id (actual database ID) instead of cartId (request parameter)
        // This handles case where cart was found via sessionId lookup, where cartId != cart.id
        validCartId = cart.id;
        loggerService.info('[initiateGuestCheckout] Using provided cart with items', { 
          originalCartId: cartId,
          actualCartId: cart.id,
          itemCount: cart.items.length
        });
      } else {
        // FIX 3: No cartId provided - try to find existing cart with items
        loggerService.info('[initiateGuestCheckout] No cartId provided, searching for existing cart...', {
          deviceId,
          cartSessionId
        });

        // Try to find cart by sessionId (for carts created via /cart/guest endpoint)
        if (cartSessionId) {
          loggerService.info('[initiateGuestCheckout] Searching for cart by sessionId', { cartSessionId });
          
          const existingCartBySession = await prisma.carts.findFirst({
            where: {
              sessionId: cartSessionId,
              status: 'active'
            },
            include: {
              items: true
            },
            orderBy: {
              updatedAt: 'desc'
            }
          });

          if (existingCartBySession) {
            loggerService.info('[initiateGuestCheckout] Found cart by sessionId', {
              sessionId: cartSessionId,
              cartId: existingCartBySession.id,
              itemCount: existingCartBySession.items.length
            });

            if (existingCartBySession.items.length > 0) {
              validCartId = existingCartBySession.id;
              loggerService.info('[initiateGuestCheckout] Using cart found by sessionId', {
                cartId: validCartId,
                itemCount: existingCartBySession.items.length
              });
            } else {
              loggerService.warn('[initiateGuestCheckout] Cart found by sessionId but is empty', {
                sessionId: cartSessionId,
                cartId: existingCartBySession.id
              });
            }
          } else {
            loggerService.info('[initiateGuestCheckout] No cart found by sessionId', { cartSessionId });
          }
        }

        // Try to find cart by deviceId
        if (!validCartId && deviceId) {
          loggerService.info('[initiateGuestCheckout] Searching for cart by deviceId', { deviceId });
          
          const existingCart = await prisma.carts.findFirst({
            where: {
              deviceId: deviceId,
              status: 'active'
            },
            include: {
              items: true
            },
            orderBy: {
              updatedAt: 'desc'
            }
          });

          if (existingCart) {
            loggerService.info('[initiateGuestCheckout] Found cart by deviceId', {
              deviceId,
              cartId: existingCart.id,
              itemCount: existingCart.items.length
            });

            if (existingCart.items.length > 0) {
              validCartId = existingCart.id;
              loggerService.info('[initiateGuestCheckout] Using cart found by deviceId', {
                cartId: validCartId,
                itemCount: existingCart.items.length
              });
            } else {
              loggerService.warn('[initiateGuestCheckout] Cart found by deviceId but is empty', {
                deviceId,
                cartId: existingCart.id
              });
            }
          } else {
            loggerService.info('[initiateGuestCheckout] No cart found by deviceId', { deviceId });
          }
        }

        // FIX 3: Only create new cart if no cartId was provided at all AND no existing cart found
        if (!validCartId) {
          loggerService.info('[initiateGuestCheckout] No existing cart found, creating new guest cart', { deviceId });
          
          const newCart = await prisma.carts.create({
            data: {
              userId: null, // Guest cart
              deviceId: deviceId || null, // Store deviceId for guest cart identification
              status: 'active'
            }
          });
          
          validCartId = newCart.id;
          loggerService.info('[initiateGuestCheckout] Created new guest cart', { cartId: validCartId, deviceId });
        }
      }

      // Generate unique session ID
      const sessionId = crypto.randomUUID();

      // Create guest session with metadata for cart recovery
      let guestSession;
      try {
        guestSession = await guestCheckoutService.createGuestSession(sessionId, validCartId, {
          deviceId: deviceId,
          originalCartId: cartId
        });
        loggerService.info('[initiateGuestCheckout] Guest session created successfully', {
          sessionId,
          cartId: validCartId,
          deviceId
        });
      } catch (sessionError) {
        loggerService.error('[initiateGuestCheckout] Error creating guest session', {
          sessionId,
          cartId: validCartId,
          error: sessionError.message,
          errorStack: sessionError.stack
        });
        
        // Re-throw to let the outer catch block handle it
        throw sessionError;
      }

      // Calculate cart totals with error handling
      let totals;
      try {
        totals = await cartService.calculateCartTotals(validCartId);
        loggerService.info('[initiateGuestCheckout] Cart totals calculated successfully', {
          cartId: validCartId,
          totals
        });
      } catch (totalsError) {
        loggerService.error('[initiateGuestCheckout] Error calculating cart totals', {
          cartId: validCartId,
          error: totalsError.message,
          errorStack: totalsError.stack
        });
        
        // Return cart totals even if calculation fails
        totals = {
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: 0,
          itemCount: cart?.items?.length || 0
        };
      }

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
      loggerService.error('[initiateGuestCheckout] Error in initiateGuestCheckout controller', {
        error: error.message,
        errorName: error.name,
        errorCode: error.code,
        stack: error.stack,
        cartId: req.body?.cartId,
        deviceId: req.body?.deviceId,
        cartSessionId: req.body?.sessionId,
        timestamp: new Date().toISOString()
      });

      // Log if this is a Prisma/database error
      if (error.code && error.code.startsWith('P')) {
        loggerService.error('[initiateGuestCheckout] Prisma database error detected', {
          prismaErrorCode: error.code,
          prismaErrorMeta: error.meta,
          cartId: req.body?.cartId
        });
      }

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
        errorMessageBn: 'অতিথি সেশন ব্যবহারকারীতে রূপান্তরিত হয়েছে';
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
   * FIX 4: Enhanced fallback logging with detailed error messages
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
      // Convert division to lowercase enum value
      const divisionValue = shippingAddress.division ? shippingAddress.division.toLowerCase() : 'dhaka';
      const address = await prisma.addresses.create({
        data: {
          userId: null, // Guest order
          firstName: shippingAddress.firstName || guestSession.firstName,
          lastName: shippingAddress.lastName || guestSession.lastName,
          phone: shippingAddress.phone || guestSession.phone,
          address: shippingAddress.addressLine1 || shippingAddress.address || '',
          addressLine2: shippingAddress.addressLine2 || '',
          city: shippingAddress.city,
          district: shippingAddress.district,
          division: divisionValue,
          postalCode: shippingAddress.postalCode || '',
          upazila: shippingAddress.upazila || '',
          isDefault: false,
          type: 'shipping'
        }
      });

      // Get cart items - ALWAYS re-fetch cart from guestSession to ensure we have the latest
      // This prevents issues where cart association might have been updated after session creation
      let cart = await prisma.carts.findUnique({
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

      // CRITICAL: Log cart details for debugging
      loggerService.info('[completeGuestCheckout] Cart details for order creation', {
        sessionId,
        cartId: guestSession.cartId,
        cartItemsCount: cart?.items?.length || 0,
        cartTotal: cart?.total?.toString() || '0',
        cartSubtotal: cart?.subtotal?.toString() || '0'
      });

      // FIX 4: Enhanced fallback logging for empty cart
      // If cart is empty, search for existing cart with items
      // This handles the case where initiateGuestCheckout created a new empty cart
      // instead of using the existing cart that had items
      if (!cart || cart.items.length === 0) {
        loggerService.warn('[completeGuestCheckout] Linked cart is empty or not found, attempting fallback...', {
          sessionId,
          linkedCartId: guestSession.cartId,
          cartExists: !!cart,
          cartItems: cart?.items?.length || 0
        });

        // Try to find an active cart with items using deviceId from session metadata
        const deviceId = guestSession.metadata?.deviceId;
        
        // FIX 4: Enhanced logging for deviceId fallback
        if (deviceId) {
          loggerService.info('[completeGuestCheckout] Attempting fallback by deviceId', {
            sessionId,
            deviceId
          });
          
          const existingCart = await prisma.carts.findFirst({
            where: {
              deviceId: deviceId,
              status: 'active'
            },
            include: {
              items: {
                include: {
                  product: true,
                  variant: true
                }
              }
            },
            orderBy: {
              updatedAt: 'desc'
            }
          });

          if (existingCart) {
            loggerService.info('[completeGuestCheckout] DeviceId fallback: cart found', {
              sessionId,
              deviceId,
              cartId: existingCart.id,
              itemCount: existingCart.items.length,
              cartHasItems: existingCart.items.length > 0
            });

            if (existingCart.items.length > 0) {
              cart = existingCart;
              loggerService.info('[completeGuestCheckout] DeviceId fallback: using cart with items', {
                sessionId,
                cartId: cart.id,
                itemCount: cart.items.length
              });
            } else {
              loggerService.warn('[completeGuestCheckout] DeviceId fallback: cart found but empty', {
                sessionId,
                deviceId,
                cartId: existingCart.id
              });
            }
          } else {
            loggerService.warn('[completeGuestCheckout] DeviceId fallback: no cart found', {
              sessionId,
              deviceId
            });
          }
        } else {
          loggerService.warn('[completeGuestCheckout] No deviceId available for fallback', {
            sessionId
          });
        }

        // FIX 4: Enhanced logging for sessionId fallback
        // If still no cart with items, try to find by sessionId (for carts created via cart API)
        if (!cart || cart.items.length === 0) {
          loggerService.info('[completeGuestCheckout] Attempting fallback by sessionId', {
            sessionId
          });
          
          const sessionCart = await prisma.carts.findFirst({
            where: {
              sessionId: sessionId, // Use guest checkout sessionId
              status: 'active'
            },
            include: {
              items: {
                include: {
                  product: true,
                  variant: true
                }
              }
            },
            orderBy: {
              updatedAt: 'desc'
            }
          });

          if (sessionCart) {
            loggerService.info('[completeGuestCheckout] SessionId fallback: cart found', {
              sessionId,
              cartId: sessionCart.id,
              itemCount: sessionCart.items.length,
              cartHasItems: sessionCart.items.length > 0
            });

            if (sessionCart.items.length > 0) {
              cart = sessionCart;
              loggerService.info('[completeGuestCheckout] SessionId fallback: using cart with items', {
                sessionId,
                cartId: cart.id,
                itemCount: cart.items.length
              });
            } else {
              loggerService.warn('[completeGuestCheckout] SessionId fallback: cart found but empty', {
                sessionId,
                cartId: sessionCart.id
              });
            }
          } else {
            loggerService.warn('[completeGuestCheckout] SessionId fallback: no cart found', {
              sessionId
            });
          }
        }

        // FIX 4: Log final fallback result
        loggerService.info('[completeGuestCheckout] Fallback attempts completed', {
          sessionId,
          finalCartId: cart?.id || 'none',
          finalCartItemCount: cart?.items?.length || 0,
          fallbackSuccessful: !!(cart && cart.items.length > 0)
        });
      }

      // CRITICAL: Validate cart has items before creating order
      if (!cart || cart.items.length === 0) {
        loggerService.error('[completeGuestCheckout] Cart is empty after all fallback attempts - cannot create order', {
          sessionId,
          cartId: guestSession.cartId,
          cartItems: cart?.items?.length || 0,
          fallbackAttempts: 'deviceId and sessionId'
        });
        return res.status(400).json({
          success: false,
          error: 'Cart is empty after all recovery attempts. Cannot create order.',
          message: 'Your cart is empty. Please add items and try again.',
          messageBn: 'আপনার কার্ট খালি। অনুগ্রহ করে পণ্য যোগ করুন।'
        });
      }

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
            await tx.product_variants.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
          } else {
            await tx.products.update({
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
      const order = await prisma.orders.findUnique({
        where: { orderNumber },
        include: {
          addresses: true,
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

      // Validate guest owns order
      const paymentDetails = order.paymentDetails || {};
      const orderEmail = paymentDetails.email;
      const orderPhone = paymentDetails.phone || order.addresses[0]?.phone;

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
      const userCart = await prisma.carts.findFirst({
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
      const existingUser = await prisma.users.findUnique({
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
        const newUser = await tx.users.create({
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
        const guestCart = await tx.carts.findUnique({
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
          const guestCartItems = await tx.cart_items.findMany({
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
