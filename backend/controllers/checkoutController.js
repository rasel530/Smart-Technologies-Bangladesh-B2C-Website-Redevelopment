const { checkoutService } = require('../services/checkoutService');
const { cartService } = require('../services/cartService');
const { loggerService } = require('../services/logger');
const { PrismaClient } = require('@prisma/client');

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
 * Middleware for checkout session ID validation
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const validateCheckoutSessionId = (req, res, next) => {
  const { sessionId } = req.params;
  if (!validateUUID(sessionId)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid checkout session ID format',
        code: 400,
        details: { sessionId: 'Must be a valid UUID' }
      }
    });
  }
  next();
};

/**
 * Verify checkout session ownership
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const verifyCheckoutSessionOwnership = async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user?.id || null;
  const reqSessionId = req.headers['x-session-id'] || null;

  try {
    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { id: sessionId }
    });

    if (!checkoutSession) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Checkout session not found',
          code: 404,
          details: null
        }
      });
    }

    // Check ownership: session must belong to user or session
    const userMatch = userId && checkoutSession.userId === userId;
    const sessionMatch = reqSessionId && checkoutSession.sessionId === reqSessionId;

    if (!userMatch && !sessionMatch) {
      loggerService.warn('Checkout session ownership verification failed', {
        checkoutSessionId: sessionId,
        userId,
        reqSessionId,
        checkoutUserId: checkoutSession.userId,
        checkoutSessionId: checkoutSession.sessionId
      });
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to access this checkout session',
          code: 403,
          details: null
        }
      });
    }

    // Attach checkout session to request for use in controller
    req.checkoutSession = checkoutSession;
    next();
  } catch (error) {
    loggerService.error('Error in checkout session ownership verification', {
      checkoutSessionId: sessionId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error verifying checkout session ownership',
        code: 500,
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    });
  }
};

/**
 * Standardized error response format
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Object} Error response object
 */
const errorResponse = (message, statusCode = 400, details = null) => ({
  success: false,
  error: {
    message,
    code: statusCode,
    ...(details && { details })
  }
});

/**
 * Checkout Controller
 * Handles all checkout flow operations
 */
class CheckoutController {
  /**
   * Initialize checkout session
   * @route POST /api/v1/checkout/initiate
   */
  async initiateCheckout(req, res) {
    try {
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;
      const { cartId } = req.body;

      loggerService.info('[initiateCheckout] Initiating checkout', {
        userId,
        sessionId,
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

      // Validate user or session is provided
      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Authentication required',
          message: 'Either user authentication or session ID is required',
          messageBn: 'ব্যবহারকারী প্রমাণীকরণ বা সেশন আইডি প্রয়োজন'
        });
      }

      // Create checkout session
      const checkoutSession = await checkoutService.createCheckoutSession(userId, cartId, sessionId);

      res.status(201).json({
        success: true,
        message: 'Checkout session initiated successfully',
        messageBn: 'চেকআউট সেশন সফলভাবে শুরু হয়েছে',
        data: {
          sessionId: checkoutSession.id,
          currentStep: checkoutSession.currentStep,
          status: checkoutSession.status,
          expiresAt: checkoutSession.expiresAt,
          totals: checkoutSession.totals
        }
      });
    } catch (error) {
      loggerService.error('Error in initiateCheckout controller', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        cartId: req.body?.cartId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to initiate checkout';
      let errorMessageBn = 'চেকআউট শুরু করতে ব্যর্থ হয়েছে';

      if (error.message === 'Cart not found') {
        statusCode = 404;
        errorMessage = 'Cart not found';
        errorMessageBn = 'কার্ট পাওয়া যায়নি';
      } else if (error.message === 'Cart is empty') {
        statusCode = 400;
        errorMessage = 'Cart is empty';
        errorMessageBn = 'কার্ট খালি';
      } else if (error.message === 'Cart does not belong to user' || error.message === 'Cart does not belong to session') {
        statusCode = 403;
        errorMessage = 'Cart does not belong to you';
        errorMessageBn = 'কার্টটি আপনার নয়';
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
   * Get checkout session details
   * @route GET /api/v1/checkout/session/:sessionId
   */
  async getCheckoutSession(req, res) {
    try {
      const { sessionId } = req.params;

      loggerService.info('[getCheckoutSession] Getting checkout session', {
        sessionId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      const checkoutSession = await checkoutService.getCheckoutSession(sessionId);

      res.json({
        success: true,
        message: 'Checkout session retrieved successfully',
        messageBn: 'চেকআউট সেশন সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: checkoutSession
      });
    } catch (error) {
      loggerService.error('Error in getCheckoutSession controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to retrieve checkout session';
      let errorMessageBn = 'চেকআউট সেশন পুনরুদ্ধার করতে ব্যর্থ হয়েছে';

      if (error.message === 'Checkout session not found') {
        statusCode = 404;
        errorMessage = 'Checkout session not found';
        errorMessageBn = 'চেকআউট সেশন পাওয়া যায়নি';
      } else if (error.message === 'Checkout session has expired') {
        statusCode = 410;
        errorMessage = 'Checkout session has expired';
        errorMessageBn = 'চেকআউট সেশন মেয়াদোত্তীর্ণ হয়েছে';
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
   * Update checkout step
   * @route PUT /api/v1/checkout/session/:sessionId/step
   */
  async updateCheckoutStep(req, res) {
    try {
      const { sessionId } = req.params;
      const { step, data } = req.body;

      loggerService.info('[updateCheckoutStep] Updating checkout step', {
        sessionId,
        step,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Validate step is provided
      if (!step) {
        return res.status(400).json({
          success: false,
          error: 'Step is required',
          message: 'Step is required',
          messageBn: 'ধাপ প্রয়োজন'
        });
      }

      // Update checkout step
      const checkoutSession = await checkoutService.updateCheckoutStep(sessionId, step, data);

      res.json({
        success: true,
        message: 'Checkout step updated successfully',
        messageBn: 'চেকআউট ধাপ সফলভাবে আপডেট করা হয়েছে',
        data: checkoutSession
      });
    } catch (error) {
      loggerService.error('Error in updateCheckoutStep controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId,
        step: req.body.step
      });

      let statusCode = 500;
      let errorMessage = 'Failed to update checkout step';
      let errorMessageBn = 'চেকআউট ধাপ আপডেট করতে ব্যর্থ হয়েছে';

      if (error.message === 'Checkout session not found') {
        statusCode = 404;
        errorMessage = 'Checkout session not found';
        errorMessageBn = 'চেকআউট সেশন পাওয়া যায়নি';
      } else if (error.message === 'Checkout session has expired') {
        statusCode = 410;
        errorMessage = 'Checkout session has expired';
        errorMessageBn = 'চেকআউট সেশন মেয়াদোত্তীর্ণ হয়েছে';
      } else if (error.message === 'Invalid checkout step') {
        statusCode = 400;
        errorMessage = 'Invalid checkout step';
        errorMessageBn = 'অবৈধ চেকআউট ধাপ';
      } else if (error.message === 'Cannot go back to previous step') {
        statusCode = 400;
        errorMessage = 'Cannot go back to previous step';
        errorMessageBn = 'পূর্ববর্তী ধাপে ফিরে যাওয়া যাবে না';
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
   * Save address step
   * @route POST /api/v1/checkout/session/:sessionId/address
   */
  async saveAddressStep(req, res) {
    try {
      const { sessionId } = req.params;
      const { shippingAddress, billingAddress, savedAddressId } = req.body;

      loggerService.info('[saveAddressStep] Saving address step', {
        sessionId,
        hasShippingAddress: !!shippingAddress,
        hasBillingAddress: !!billingAddress,
        savedAddressId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Validate at least one address is provided
      if (!shippingAddress && !billingAddress && !savedAddressId) {
        return res.status(400).json({
          success: false,
          error: 'At least one address is required',
          message: 'At least one address is required',
          messageBn: 'অন্তত একটি ঠিকানা প্রয়োজন'
        });
      }

      let addressData = {};

      // If saved address is selected, use it
      if (savedAddressId) {
        const savedAddress = await prisma.address.findUnique({
          where: { id: savedAddressId }
        });

        if (!savedAddress) {
          return res.status(404).json({
            success: false,
            error: 'Saved address not found',
            message: 'Saved address not found',
            messageBn: 'সংরক্ষিত ঠিকানা পাওয়া যায়নি'
          });
        }

        // Verify address ownership
        if (req.user?.id && savedAddress.userId !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Address does not belong to you',
            message: 'Address does not belong to you',
            messageBn: 'ঠিকানাটি আপনার নয়'
          });
        }

        addressData.shippingAddressId = savedAddressId;
        addressData.billingAddressId = savedAddressId;
      } else {
        // Validate new address
        const addressToValidate = shippingAddress || billingAddress;
        const validation = checkoutService.validateAddress(addressToValidate);

        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'Address validation failed',
            message: 'Address validation failed',
            messageBn: 'ঠিকানা যাচাইকরণ ব্যর্থ হয়েছে',
            details: validation.errors
          });
        }

        addressData.shippingAddress = shippingAddress;
        addressData.billingAddress = billingAddress || shippingAddress;
      }

      // Update checkout step with address data
      const checkoutSession = await checkoutService.updateCheckoutStep(sessionId, 'address', addressData);

      // Update checkout session with address IDs if new addresses were created
      if (addressData.shippingAddressId) {
        await prisma.checkoutSession.update({
          where: { id: sessionId },
          data: {
            shippingAddressId: addressData.shippingAddressId,
            billingAddressId: addressData.billingAddressId
          }
        });
      }

      res.json({
        success: true,
        message: 'Address saved successfully',
        messageBn: 'ঠিকানা সফলভাবে সংরক্ষিত হয়েছে',
        data: checkoutSession
      });
    } catch (error) {
      loggerService.error('Error in saveAddressStep controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to save address';
      let errorMessageBn = 'ঠিকানা সংরক্ষণ করতে ব্যর্থ হয়েছে';

      if (error.message === 'Checkout session not found') {
        statusCode = 404;
        errorMessage = 'Checkout session not found';
        errorMessageBn = 'চেকআউট সেশন পাওয়া যায়নি';
      } else if (error.message === 'Checkout session has expired') {
        statusCode = 410;
        errorMessage = 'Checkout session has expired';
        errorMessageBn = 'চেকআউট সেশন মেয়াদোত্তীর্ণ হয়েছে';
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
   * Save shipping step
   * @route POST /api/v1/checkout/session/:sessionId/shipping
   */
  async saveShippingStep(req, res) {
    try {
      const { sessionId } = req.params;
      const { method } = req.body;

      loggerService.info('[saveShippingStep] Saving shipping step', {
        sessionId,
        method,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Validate shipping method is provided
      if (!method) {
        return res.status(400).json({
          success: false,
          error: 'Shipping method is required',
          message: 'Shipping method is required',
          messageBn: 'শিপিং পদ্ধতি প্রয়োজন'
        });
      }

      // Validate shipping method exists
      const shippingMethods = checkoutService.getShippingMethods();
      if (!shippingMethods[method]) {
        return res.status(400).json({
          success: false,
          error: 'Invalid shipping method',
          message: 'Invalid shipping method',
          messageBn: 'অবৈধ শিপিং পদ্ধতি',
          details: {
            availableMethods: Object.keys(shippingMethods)
          }
        });
      }

      // Calculate shipping cost
      const shippingCost = shippingMethods[method].cost;

      // Update checkout step with shipping data
      const checkoutSession = await checkoutService.updateCheckoutStep(sessionId, 'shipping', {
        method,
        cost: shippingCost,
        estimatedDays: shippingMethods[method].estimatedDays
      });

      res.json({
        success: true,
        message: 'Shipping method saved successfully',
        messageBn: 'শিপিং পদ্ধতি সফলভাবে সংরক্ষিত হয়েছে',
        data: {
          ...checkoutSession,
          shippingCost
        }
      });
    } catch (error) {
      loggerService.error('Error in saveShippingStep controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId,
        method: req.body.method
      });

      let statusCode = 500;
      let errorMessage = 'Failed to save shipping method';
      let errorMessageBn = 'শিপিং পদ্ধতি সংরক্ষণ করতে ব্যর্থ হয়েছে';

      if (error.message === 'Checkout session not found') {
        statusCode = 404;
        errorMessage = 'Checkout session not found';
        errorMessageBn = 'চেকআউট সেশন পাওয়া যায়নি';
      } else if (error.message === 'Checkout session has expired') {
        statusCode = 410;
        errorMessage = 'Checkout session has expired';
        errorMessageBn = 'চেকআউট সেশন মেয়াদোত্তীর্ণ হয়েছে';
      } else if (error.message === 'Invalid checkout step') {
        statusCode = 400;
        errorMessage = 'Invalid checkout step';
        errorMessageBn = 'অবৈধ চেকআউট ধাপ';
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
   * Save payment step
   * @route POST /api/v1/checkout/session/:sessionId/payment
   */
  async savePaymentStep(req, res) {
    try {
      const { sessionId } = req.params;
      const { method, details } = req.body;

      loggerService.info('[savePaymentStep] Saving payment step', {
        sessionId,
        method,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Validate payment method is provided
      if (!method) {
        return res.status(400).json({
          success: false,
          error: 'Payment method is required',
          message: 'Payment method is required',
          messageBn: 'পেমেন্ট পদ্ধতি প্রয়োজন'
        });
      }

      // Validate payment method exists
      const paymentMethods = checkoutService.getPaymentMethods();
      if (!paymentMethods.includes(method)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment method',
          message: 'Invalid payment method',
          messageBn: 'অবৈধ পেমেন্ট পদ্ধতি',
          details: {
            availableMethods: paymentMethods
          }
        });
      }

      // Validate payment details based on method
      if (method === 'EMI') {
        if (!details || !details.bankName || !details.tenure) {
          return res.status(400).json({
            success: false,
            error: 'EMI details are required',
            message: 'Bank name and tenure are required for EMI',
            messageBn: 'ইএমআই-এর জন্য ব্যাংকের নাম এবং মেয়াদ প্রয়োজন'
          });
        }
      } else if (method === 'CREDIT_CARD') {
        if (!details || !details.cardNumber || !details.expiryDate || !details.cvv) {
          return res.status(400).json({
            success: false,
            error: 'Card details are required',
            message: 'Card number, expiry date, and CVV are required',
            messageBn: 'কার্ড নম্বর, মেয়াদোত্তীর্ণ তারিখ এবং সিভিভি প্রয়োজন'
          });
        }
      }

      // Calculate payment fee
      let paymentFee = 0;
      const checkoutSession = await prisma.checkoutSession.findUnique({
        where: { id: sessionId },
        include: {
          cart: true
        }
      });

      if (checkoutSession && checkoutSession.cart) {
        const cartTotals = await cartService.calculateCartTotals(checkoutSession.cartId);
        
        if (method === 'EMI') {
          paymentFee = cartTotals.subtotal * 0.02; // 2% EMI fee
        } else if (method === 'CREDIT_CARD') {
          paymentFee = cartTotals.subtotal * 0.015; // 1.5% card fee
        }
      }

      // Update checkout step with payment data
      const updatedSession = await checkoutService.updateCheckoutStep(sessionId, 'payment', {
        method,
        details,
        fee: paymentFee
      });

      res.json({
        success: true,
        message: 'Payment method saved successfully',
        messageBn: 'পেমেন্ট পদ্ধতি সফলভাবে সংরক্ষিত হয়েছে',
        data: {
          ...updatedSession,
          paymentFee
        }
      });
    } catch (error) {
      loggerService.error('Error in savePaymentStep controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId,
        method: req.body.method
      });

      let statusCode = 500;
      let errorMessage = 'Failed to save payment method';
      let errorMessageBn = 'পেমেন্ট পদ্ধতি সংরক্ষণ করতে ব্যর্থ হয়েছে';

      if (error.message === 'Checkout session not found') {
        statusCode = 404;
        errorMessage = 'Checkout session not found';
        errorMessageBn = 'চেকআউট সেশন পাওয়া যায়নি';
      } else if (error.message === 'Checkout session has expired') {
        statusCode = 410;
        errorMessage = 'Checkout session has expired';
        errorMessageBn = 'চেকআউট সেশন মেয়াদোত্তীর্ণ হয়েছে';
      } else if (error.message === 'Invalid checkout step') {
        statusCode = 400;
        errorMessage = 'Invalid checkout step';
        errorMessageBn = 'অবৈধ চেকআউট ধাপ';
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
   * Complete checkout and create order
   * @route POST /api/v1/checkout/session/:sessionId/complete
   */
  async completeCheckout(req, res) {
    try {
      const { sessionId } = req.params;

      loggerService.info('[completeCheckout] Completing checkout', {
        sessionId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Complete checkout session and create order
      const order = await checkoutService.completeCheckoutSession(sessionId);

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        messageBn: 'অর্ডার সফলভাবে তৈরি করা হয়েছে',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total
        }
      });
    } catch (error) {
      loggerService.error('Error in completeCheckout controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to complete checkout';
      let errorMessageBn = 'চেকআউট সম্পূর্ণ করতে ব্যর্থ হয়েছে';

      if (error.message === 'Checkout session not found') {
        statusCode = 404;
        errorMessage = 'Checkout session not found';
        errorMessageBn = 'চেকআউট সেশন পাওয়া যায়নি';
      } else if (error.message === 'Checkout session already completed') {
        statusCode = 400;
        errorMessage = 'Checkout session already completed';
        errorMessageBn = 'চেকআউট সেশন ইতিমধ্যেই সম্পূর্ণ হয়েছে';
      } else if (error.message === 'Checkout session has expired') {
        statusCode = 410;
        errorMessage = 'Checkout session has expired';
        errorMessageBn = 'চেকআউট সেশন মেয়াদোত্তীর্ণ হয়েছে';
      } else if (error.message.includes('Checkout validation failed')) {
        statusCode = 400;
        errorMessage = 'Checkout validation failed';
        errorMessageBn = 'চেকআউট যাচাইকরণ ব্যর্থ হয়েছে';
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
   * Cancel checkout session
   * @route DELETE /api/v1/checkout/session/:sessionId
   */
  async cancelCheckout(req, res) {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;

      loggerService.info('[cancelCheckout] Canceling checkout session', {
        sessionId,
        reason,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Abandon checkout session
      const result = await checkoutService.abandonCheckoutSession(sessionId, reason || 'user_cancelled');

      res.json({
        success: true,
        message: 'Checkout session cancelled successfully',
        messageBn: 'চেকআউট সেশন সফলভাবে বাতিল করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in cancelCheckout controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to cancel checkout session';
      let errorMessageBn = 'চেকআউট সেশন বাতিল করতে ব্যর্থ হয়েছে';

      if (error.message === 'Checkout session not found') {
        statusCode = 404;
        errorMessage = 'Checkout session not found';
        errorMessageBn = 'চেকআউট সেশন পাওয়া যায়নি';
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
const checkoutController = new CheckoutController();

module.exports = {
  CheckoutController,
  checkoutController,
  validateCheckoutSessionId,
  verifyCheckoutSessionOwnership
};
