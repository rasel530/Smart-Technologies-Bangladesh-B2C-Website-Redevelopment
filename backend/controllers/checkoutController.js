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
 * Now supports both CheckoutSession and GuestSession
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const verifyCheckoutSessionOwnership = async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user?.id || null;
  const reqSessionId = req.headers['x-session-id'] || null;

  try {
    // First, try to find a CheckoutSession (for authenticated users or main checkout)
    let checkoutSession = await prisma.checkout_sessions.findUnique({
      where: { id: sessionId }
    });

    // If not found, try to find a GuestSession (for guest checkout)
    if (!checkoutSession) {
      const guestSession = await prisma.guest_sessions.findUnique({
        where: { sessionId }
      });

      if (guestSession) {
        // Check if guest session is expired
        if (guestSession.expiresAt && new Date(guestSession.expiresAt) < new Date()) {
          return res.status(410).json({
            success: false,
            error: {
              message: 'Guest session has expired',
              code: 410,
              details: null
            }
          });
        }

        // Check if guest session was converted to user
        if (guestSession.convertedToUserId) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Guest session has been converted to user',
              code: 400,
              details: null
            }
          });
        }

        // Attach guest session to request for use in controller
        req.guestSession = guestSession;
        req.isGuestSession = true;
        loggerService.info('[verifyCheckoutSessionOwnership] Using GuestSession for checkout', {
          sessionId,
          guestSessionId: guestSession.id
        });
        return next();
      }
    }

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
    req.isGuestSession = false;
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
          id: checkoutSession.id,
          userId: checkoutSession.userId,
          sessionId: checkoutSession.sessionId,
          cartId: checkoutSession.cartId,
          currentStep: checkoutSession.currentStep,
          status: checkoutSession.status,
          createdAt: checkoutSession.createdAt,
          updatedAt: checkoutSession.updatedAt,
          expiresAt: checkoutSession.expiresAt,
          isGuest: !checkoutSession.userId,
          data: {},
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
   * Now supports both CheckoutSession and GuestSession
   * @route PUT /api/v1/checkout/session/:sessionId/step
   */
  async updateCheckoutStep(req, res) {
    try {
      const { sessionId } = req.params;
      const { step, data } = req.body;

      loggerService.info('[updateCheckoutStep] Updating checkout step', {
        sessionId,
        step,
        isGuestSession: req.isGuestSession,
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

      let result;

      // Check if this is a guest session
      if (req.isGuestSession && req.guestSession) {
        // Handle guest session update
        const { guestCheckoutService } = require('../services/guestCheckoutService');
        
        // For 'info' step, update guest info
        if (step === 'info' && data) {
          result = await guestCheckoutService.updateGuestSession(sessionId, {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone
          });
        } else {
          // For other steps, store in metadata
          const currentMetadata = req.guestSession.metadata || {};
          result = await guestCheckoutService.updateGuestSession(sessionId, {
            metadata: {
              ...currentMetadata,
              [step]: data,
              lastStepUpdate: new Date().toISOString()
            }
          });
        }

        // Get updated session with cart
        const updatedSession = await guestCheckoutService.getGuestSession(sessionId);
        
        return res.json({
          success: true,
          message: 'Guest checkout step updated successfully',
          messageBn: 'অতিথি চেকআউট ধাপ সফলভাবে আপডেট করা হয়েছে',
          data: {
            sessionId: updatedSession.sessionId,
            cartId: updatedSession.cartId,
            currentStep: step,
            status: 'active',
            firstName: updatedSession.firstName,
            lastName: updatedSession.lastName,
            email: updatedSession.email,
            phone: updatedSession.phone,
            metadata: updatedSession.metadata,
            totals: updatedSession.totals,
            isGuest: true
          }
        });
      }

      // Regular checkout session update
      result = await checkoutService.updateCheckoutStep(sessionId, step, data);

      res.json({
        success: true,
        message: 'Checkout step updated successfully',
        messageBn: 'চেকআউট ধাপ সফলভাবে আপডেট করা হয়েছে',
        data: result
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
      } else if (error.message === 'Guest session not found') {
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
   * Save address step
   * @route POST /api/v1/checkout/session/:sessionId/address
   */
  async saveAddressStep(req, res) {
    try {
      const { sessionId } = req.params;
      const { shippingAddress, billingAddress, savedAddressId } = req.body;

      // DIAGNOSTIC: Log incoming address data
      loggerService.info('[saveAddressStep] Incoming address data', {
        sessionId,
        hasShippingAddress: !!shippingAddress,
        shippingAddress,
        hasBillingAddress: !!billingAddress,
        billingAddress,
        savedAddressId,
        reqBodyKeys: Object.keys(req.body)
      });

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
        const savedAddress = await prisma.addresses.findUnique({
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

        // For guest users (no req.user), we need to create a temporary user first
        let userId = req.user?.id;
        if (!userId) {
          // This is a guest checkout - create temporary user
          const tempUser = await prisma.users.create({
            data: {
              email: addressToValidate.email || `guest_${Date.now()}@temp.com`,
              firstName: addressToValidate.firstName || addressToValidate.name?.split(' ')[0] || 'Guest',
              lastName: addressToValidate.lastName || addressToValidate.name?.split(' ').slice(1).join(' ') || 'User',
              phone: addressToValidate.phone || '',
              role: 'customer',
              status: 'guest',
              password: null
            }
          });
          userId = tempUser.id;
          loggerService.info('[saveAddressStep] Created temporary user for guest checkout', {
            userId: tempUser.id,
            email: tempUser.email
          });
        }

        // Create new address record in database
        const newAddress = await prisma.addresses.create({
          data: {
            userId: userId,
            type: 'shipping',
            firstName: addressToValidate.firstName || addressToValidate.name?.split(' ')[0] || '',
            lastName: addressToValidate.lastName || addressToValidate.name?.split(' ').slice(1).join(' ') || '',
            phone: addressToValidate.phone || '',
            address: addressToValidate.address || addressToValidate.street || '',
            addressLine2: addressToValidate.addressLine2 || addressToValidate.apartment || '',
            city: addressToValidate.city || '',
            district: addressToValidate.district || '',
            division: addressToValidate.division || 'dhaka',
            upazila: addressToValidate.upazila || '',
            postalCode: addressToValidate.postalCode || '',
            isDefault: false
          }
        });

        // DIAGNOSTIC: Log created address
        loggerService.info('[saveAddressStep] New address created', {
          sessionId,
          newAddress,
          newAddressId: newAddress?.id,
          hasNewAddressId: !!newAddress?.id
        });

        if (!newAddress || !newAddress.id) {
          return res.status(500).json({
            success: false,
            error: 'Failed to create address record',
            message: 'Failed to create address record',
            messageBn: 'ঠিকানা সংরক্ষিত হয়েছে'
          });
        }

        addressData.shippingAddressId = newAddress.id;
        addressData.billingAddressId = newAddress.id;
        addressData.shippingAddress = shippingAddress;
        addressData.billingAddress = billingAddress || shippingAddress;
      }

      // Update checkout step with address data
      const checkoutSession = await checkoutService.updateCheckoutStep(sessionId, 'address', addressData);

      // DIAGNOSTIC: Log data after updateCheckoutStep
      loggerService.info('[saveAddressStep] Data after updateCheckoutStep', {
        sessionId,
        addressData,
        checkoutSessionStepData: checkoutSession.stepData,
        checkoutSessionStepDataKeys: checkoutSession.stepData ? Object.keys(checkoutSession.stepData) : [],
        checkoutSessionAddressStepData: checkoutSession.stepData?.address,
        checkoutSessionShippingAddressId: checkoutSession.shippingAddressId
      });

      // Update checkout session with address IDs if new addresses were created
      if (addressData.shippingAddressId) {
        await prisma.checkout_sessions.update({
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
   * Now supports both CheckoutSession and GuestSession
   * @route POST /api/v1/checkout/session/:sessionId/shipping
   */
  async saveShippingStep(req, res) {
    try {
      const { sessionId } = req.params;
      const { method } = req.body;

      loggerService.info('[saveShippingStep] Saving shipping step', {
        sessionId,
        method,
        isGuestSession: req.isGuestSession,
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

      let result;

      // Check if this is a guest session
      if (req.isGuestSession && req.guestSession) {
        const { guestCheckoutService } = require('../services/guestCheckoutService');
        
        const currentMetadata = req.guestSession.metadata || {};
        result = await guestCheckoutService.updateGuestSession(sessionId, {
          metadata: {
            ...currentMetadata,
            shipping: {
              method,
              cost: shippingCost,
              estimatedDays: shippingMethods[method].estimatedDays
            },
            lastStepUpdate: new Date().toISOString()
          }
        });

        const updatedSession = await guestCheckoutService.getGuestSession(sessionId);

        return res.json({
          success: true,
          message: 'Guest shipping method saved successfully',
          messageBn: 'অতিথি শিপিং পদ্ধতি সফলভাবে সংরক্ষিত হয়েছে',
          data: {
            ...updatedSession,
            shippingMethod: method,
            shippingCost,
            isGuest: true
          }
        });
      }

      // Regular checkout session update
      result = await checkoutService.updateCheckoutStep(sessionId, 'shipping', {
        method,
        cost: shippingCost,
        estimatedDays: shippingMethods[method].estimatedDays
      });

      res.json({
        success: true,
        message: 'Shipping method saved successfully',
        messageBn: 'শিপিং পদ্ধতি সফলভাবে সংরক্ষিত হয়েছে',
        data: {
          ...result,
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
      } else if (error.message === 'Guest session not found') {
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
      const checkoutSession = await prisma.checkout_sessions.findUnique({
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
   * Now supports both CheckoutSession and GuestSession
   * @route POST /api/v1/checkout/session/:sessionId/complete
   */
  async completeCheckout(req, res) {
    try {
      const { sessionId } = req.params;
      const { data, address } = req.body;  // Extract checkout data and address from request body

      // DIAGNOSTIC: Log raw request body
      loggerService.info('[completeCheckout] RAW REQUEST BODY', {
        sessionId,
        userId: req.user?.id,
        isGuestSession: req.isGuestSession,
        reqBodyKeys: Object.keys(req.body),
        hasData: !!data,
        hasAddress: !!address,
        dataKeys: data ? Object.keys(data) : [],
        addressKeys: address ? Object.keys(address) : [],
        rawData: JSON.stringify(data),
        rawAddress: JSON.stringify(address),
        rawDataLength: data ? JSON.stringify(data).length : 0,
        rawAddressLength: address ? JSON.stringify(address).length : 0,
        timestamp: new Date().toISOString()
      });

      loggerService.info('[completeCheckout] Completing checkout', {
        sessionId,
        userId: req.user?.id,
        isGuestSession: req.isGuestSession,
        hasData: !!data,
        hasAddress: !!address,
        timestamp: new Date().toISOString()
      });

      // Validate sessionId
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
          message: 'Session ID is required',
          messageBn: 'সেশন আইডি প্রয়োজন'
        });
      }

      // Check if this is a guest session - redirect to guestCheckoutController
      if (req.isGuestSession && req.guestSession) {
        const { guestCheckoutController } = require('./guestCheckoutController');
        
        // Map the data to guest checkout format
        const guestData = data || {};
        
        // Call the guest checkout complete method
        return await guestCheckoutController.completeGuestCheckout(req, res);
      }

      // Merge address data into the data object for the service
      const checkoutData = data || {};
      if (address) {
        checkoutData.address = address;
      }

      // DIAGNOSTIC: Log merged checkout data
      loggerService.info('[completeCheckout] MERGED CHECKOUT DATA', {
        sessionId,
        checkoutDataKeys: Object.keys(checkoutData),
        checkoutData: JSON.stringify(checkoutData),
        checkoutDataLength: JSON.stringify(checkoutData).length,
        hasCheckoutDataAddress: !!checkoutData.address,
        checkoutDataAddressKeys: checkoutData.address ? Object.keys(checkoutData.address) : [],
        hasShippingAddress: !!checkoutData.address?.shippingAddress,
        hasBillingAddress: !!checkoutData.address?.billingAddress
      });

      // Complete checkout session with data from request body
      // The data parameter contains address, shipping, payment, and review information
      const order = await checkoutService.completeCheckoutSession(sessionId, checkoutData);

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
      } else if (error.message === 'Guest session not found') {
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

  /**
   * Save checkout progress (alias for updateCheckoutStep)
   * Now supports both CheckoutSession and GuestSession
   * @route POST /api/v1/checkout/save
   */
  async saveProgress(req, res) {
    try {
      const { sessionId, step, data } = req.body;
      const currentStep = step || req.checkoutSession?.currentStep || 'address';

      loggerService.info('[saveProgress] Saving checkout progress', {
        sessionId,
        step: currentStep,
        isGuestSession: req.isGuestSession,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Check if this is a guest session
      if (req.isGuestSession && req.guestSession) {
        const { guestCheckoutService } = require('../services/guestCheckoutService');
        
        const currentMetadata = req.guestSession.metadata || {};
        const result = await guestCheckoutService.updateGuestSession(sessionId, {
          metadata: {
            ...currentMetadata,
            progress: currentStep,
            data: { ...currentMetadata.data, ...data },
            lastSave: new Date().toISOString()
          }
        });

        const updatedSession = await guestCheckoutService.getGuestSession(sessionId);

        return res.json({
          success: true,
          message: 'Guest checkout progress saved successfully',
          messageBn: 'অতিথি চেকআউট অগ্রগতি সফলভাবে সংরক্ষিত হয়েছে',
          data: {
            sessionId: updatedSession.sessionId,
            cartId: updatedSession.cartId,
            currentStep: currentStep,
            status: 'active',
            firstName: updatedSession.firstName,
            lastName: updatedSession.lastName,
            email: updatedSession.email,
            phone: updatedSession.phone,
            metadata: updatedSession.metadata,
            totals: updatedSession.totals,
            isGuest: true
          }
        });
      }

      // Regular checkout session update
      const checkoutSession = await checkoutService.updateCheckoutStep(sessionId, currentStep, data);

      res.json({
        success: true,
        message: 'Checkout progress saved successfully',
        messageBn: 'চেকআউট অগ্রগতি সফলভাবে সংরক্ষিত হয়েছে',
        data: checkoutSession
      });
    } catch (error) {
      loggerService.error('Error in saveProgress controller', {
        error: error.message,
        stack: error.stack,
        sessionId: req.body.sessionId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to save checkout progress';
      let errorMessageBn = 'চেকআউট অগ্রগতি সংরক্ষণ করতে ব্যর্থ হয়েছে';

      if (error.message === 'Checkout session not found') {
        statusCode = 404;
        errorMessage = 'Checkout session not found';
        errorMessageBn = 'চেকআউট সেশন পাওয়া যায়নি';
      } else if (error.message === 'Checkout session has expired') {
        statusCode = 410;
        errorMessage = 'Checkout session has expired';
        errorMessageBn = 'চেকআউট সেশন মেয়াদোত্তীর্ণ হয়েছে';
      } else if (error.message === 'Guest session not found') {
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
const checkoutController = new CheckoutController();

module.exports = {
  CheckoutController,
  checkoutController,
  validateCheckoutSessionId,
  verifyCheckoutSessionOwnership
};
