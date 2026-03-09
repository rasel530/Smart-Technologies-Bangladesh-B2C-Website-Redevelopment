const { PrismaClient } = require('@prisma/client');
const { cartService } = require('./cartService');
const { loggerService } = require('./logger');
const crypto = require('crypto');

/**
 * Checkout Service
 * Handles checkout session management, step validation, and order creation
 */
class CheckoutService {
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
    });
    this.logger = loggerService;
    
    // Checkout session expiration (24 hours)
    this.sessionTTL = 24 * 60 * 60 * 1000;
    
    // Checkout steps in order (including info step for guest checkout)
    this.checkoutSteps = ['info', 'address', 'shipping', 'payment', 'review'];
    
    // Payment methods available in Bangladesh
    this.availablePaymentMethods = ['cash_on_delivery', 'emi', 'bkash', 'nagad', 'rocket', 'mcash', 'bank_transfer', 'credit_card'];
    
    // Shipping methods with costs
    this.shippingMethods = {
      STANDARD: { name: 'Standard Delivery', cost: 100, estimatedDays: '3-5' },
      EXPRESS: { name: 'Express Delivery', cost: 200, estimatedDays: '1-2' },
      INSIDE_DHAKA: { name: 'Inside Dhaka', cost: 60, estimatedDays: '1-2' },
      OUTSIDE_DHAKA: { name: 'Outside Dhaka', cost: 120, estimatedDays: '3-5' }
    };
    
    // Free shipping threshold
    this.freeShippingThreshold = 5000;
  }

  /**
   * Create new checkout session
   * @param {string} userId - User ID (null for guest)
   * @param {string} cartId - Cart ID
   * @param {string} sessionId - Session ID (for guest users)
   * @returns {Promise<Object>} Created checkout session
   */
  async createCheckoutSession(userId, cartId, sessionId) {
    try {
      this.logger.info('[createCheckoutSession] Creating checkout session', { userId, cartId, sessionId });

      // Validate cart exists and is not empty
      const cart = await this.prisma.carts.findUnique({
        where: { id: cartId },
        include: {
          items: true
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      if (cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Verify cart ownership
      if (userId && cart.userId !== userId) {
        throw new Error('Cart does not belong to user');
      }

      if (!userId && cart.sessionId !== sessionId) {
        throw new Error('Cart does not belong to session');
      }

      // Generate unique checkout session ID
      const checkoutSessionId = crypto.randomUUID();

      // Calculate initial totals
      const totals = await cartService.calculateCartTotals(cartId);

      // Create checkout session
      const checkoutSession = await this.prisma.checkout_sessions.create({
        data: {
          id: checkoutSessionId,
          userId,
          sessionId,
          cartId,
          currentStep: 'address',
          status: 'active',
          expiresAt: new Date(Date.now() + this.sessionTTL),
          metadata: {
            createdAt: new Date().toISOString(),
            ipAddress: null, // Will be set by controller
            userAgent: null
          },
          // Create initial progress tracking
          progress: {
            steps: {
              info: { completed: false, startedAt: null, completedAt: null },
              address: { completed: false, startedAt: null, completedAt: null },
              shipping: { completed: false, startedAt: null, completedAt: null },
              payment: { completed: false, startedAt: null, completedAt: null },
              review: { completed: false, startedAt: null, completedAt: null }
            },
            totalTime: 0,
            stepCount: 0
          }
        }
      });

      this.logger.info('[createCheckoutSession] Checkout session created', {
        checkoutSessionId,
        userId,
        cartId,
        currentStep: checkoutSession.currentStep
      });

      return {
        ...checkoutSession,
        totals
      };
    } catch (error) {
      this.logger.error('[createCheckoutSession] Error creating checkout session', {
        userId,
        cartId,
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Retrieve checkout session
   * @param {string} sessionId - Checkout session ID
   * @returns {Promise<Object>} Checkout session with full details
   */
  async getCheckoutSession(sessionId) {
    try {
      this.logger.info('[getCheckoutSession] Retrieving checkout session', { sessionId });

      const checkoutSession = await this.prisma.checkout_sessions.findUnique({
        where: { id: sessionId },
        include: {
          cart: {
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      nameEn: true,
                      nameBn: true,
                      regularPrice: true,
                      salePrice: true,
                      images: {
                        where: { displayOrder: 0 },
                        take: 1,
                        select: {
                          id: true,
                          originalUrl: true,
                          optimizedUrl: true,
                          thumbnailUrl: true,
                          altTextEn: true,
                          altTextBn: true
                        }
                      }
                    }
                  },
                  variant: true
                }
              }
            }
          },
          shippingAddress: true,
          billingAddress: true
        }
      });

      if (!checkoutSession) {
        throw new Error('Checkout session not found');
      }

      // Check if session is expired
      if (checkoutSession.expiresAt < new Date()) {
        await this.abandonCheckoutSession(sessionId, 'session_expired');
        throw new Error('Checkout session has expired');
      }

      // Calculate current totals
      const totals = await cartService.calculateCartTotals(checkoutSession.cartId);

      this.logger.info('[getCheckoutSession] Checkout session retrieved', {
        sessionId,
        currentStep: checkoutSession.currentStep,
        status: checkoutSession.status
      });

      return {
        ...checkoutSession,
        totals
      };
    } catch (error) {
      this.logger.error('[getCheckoutSession] Error retrieving checkout session', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update checkout step and data
   * @param {string} sessionId - Checkout session ID
   * @param {string} step - Current step
   * @param {Object} data - Step-specific data
   * @returns {Promise<Object>} Updated checkout session
   */
  async updateCheckoutStep(sessionId, step, data) {
    try {
      this.logger.info('[updateCheckoutStep] Updating checkout step', { sessionId, step });

      // Validate step exists
      if (!this.checkoutSteps.includes(step)) {
        throw new Error(`Invalid checkout step: ${step}`);
      }

      // Get current session
      const checkoutSession = await this.prisma.checkout_sessions.findUnique({
        where: { id: sessionId }
      });

      if (!checkoutSession) {
        throw new Error('Checkout session not found');
      }

      // Check if session is expired
      if (checkoutSession.expiresAt < new Date()) {
        await this.abandonCheckoutSession(sessionId, 'session_expired');
        throw new Error('Checkout session has expired');
      }

      // Validate step progression (can only move forward or stay on same step)
      const currentStepIndex = this.checkoutSteps.indexOf(checkoutSession.currentStep);
      const newStepIndex = this.checkoutSteps.indexOf(step);

      if (newStepIndex < currentStepIndex) {
        throw new Error('Cannot go back to previous step');
      }

      // Update progress tracking
      const progress = checkoutSession.progress || {};
      const steps = progress.steps || {};

      if (!steps[step]) {
        steps[step] = { completed: false, startedAt: null, completedAt: null };
      }

      steps[step].startedAt = steps[step].startedAt || new Date().toISOString();

      // Mark previous steps as completed if moving forward
      if (newStepIndex > currentStepIndex) {
        for (let i = 0; i < newStepIndex; i++) {
          const prevStep = this.checkoutSteps[i];
          if (steps[prevStep]) {
            steps[prevStep].completed = true;
            steps[prevStep].completedAt = steps[prevStep].completedAt || new Date().toISOString();
          }
        }
      }

      // DIAGNOSTIC: Log data being stored in updateCheckoutStep
      this.logger.info('[updateCheckoutStep] Storing step data', {
        sessionId,
        step,
        dataKeys: data ? Object.keys(data) : [],
        data,
        existingStepData: checkoutSession.stepData,
        newStepData: {
          ...(checkoutSession.stepData || {}),
          [step]: data
        }
      });
      
      // Update session
      const updatedSession = await this.prisma.checkout_sessions.update({
        where: { id: sessionId },
        data: {
          currentStep: step,
          stepData: {
            ...(checkoutSession.stepData || {}),
            [step]: data
          },
          progress: {
            ...progress,
            steps,
            stepCount: (progress.stepCount || 0) + 1,
            lastUpdated: new Date().toISOString()
          },
          updatedAt: new Date()
        }
      });
      
      // DIAGNOSTIC: Log what was actually stored
      this.logger.info('[updateCheckoutStep] Data stored successfully', {
        sessionId,
        step,
        updatedSessionStepData: updatedSession.stepData,
        updatedSessionStepDataKeys: updatedSession.stepData ? Object.keys(updatedSession.stepData) : []
      });

      this.logger.info('[updateCheckoutStep] Checkout step updated', {
        sessionId,
        currentStep: step,
        previousStep: checkoutSession.currentStep
      });

      return updatedSession;
    } catch (error) {
      this.logger.error('[updateCheckoutStep] Error updating checkout step', {
        sessionId,
        step,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate checkout step completion
   * @param {string} sessionId - Checkout session ID
   * @param {string} step - Step to validate
   * @param {Object} checkoutData - Checkout data from request body (optional)
   * @returns {Promise<Object>} Validation result
   */
  async validateCheckoutStep(sessionId, step, checkoutData = null) {
    try {
      this.logger.info('[validateCheckoutStep] Validating checkout step', { sessionId, step });

      const checkoutSession = await this.prisma.checkout_sessions.findUnique({
        where: { id: sessionId },
        include: {
          cart: {
            include: {
              items: {
                include: {
                  product: true,
                  variant: true
                }
              }
            }
          }
        }
      });

      if (!checkoutSession) {
        throw new Error('Checkout session not found');
      }

      const validation = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // Step-specific validation
      switch (step) {
        case 'address':
          // Validate address is set
          // DIAGNOSTIC: Log address validation details
          this.logger.info('[validateCheckoutStep] Address validation details', {
            sessionId,
            hasShippingAddressId: !!checkoutSession.shippingAddressId,
            shippingAddressId: checkoutSession.shippingAddressId,
            hasStepData: !!checkoutSession.stepData,
            stepDataKeys: checkoutSession.stepData ? Object.keys(checkoutSession.stepData) : [],
            hasAddressStepData: !!checkoutSession.stepData?.address,
            addressStepData: checkoutSession.stepData?.address,
            hasShippingAddressInStepData: !!checkoutSession.stepData?.address?.shippingAddress,
            shippingAddressInStepData: checkoutSession.stepData?.address?.shippingAddress,
            hasShippingAddressIdInAddressData: !!checkoutSession.stepData?.address?.shippingAddressId,
            shippingAddressIdInAddressData: checkoutSession.stepData?.address?.shippingAddressId
          });
          
          // Check multiple possible locations for address data
          const hasSavedAddress = !!checkoutSession.shippingAddressId;
          const hasAddressIdInStepData = !!checkoutSession.stepData?.address?.shippingAddressId;
          const hasAddressDataInStepData = !!checkoutSession.stepData?.address?.shippingAddress;
          
          if (!hasSavedAddress && !hasAddressIdInStepData && !hasAddressDataInStepData) {
            validation.isValid = false;
            validation.errors.push('Shipping address is required');
          }
          break;

        case 'shipping':
          // Validate shipping method is set
          if (!checkoutSession.stepData?.shipping?.method) {
            validation.isValid = false;
            validation.errors.push('Shipping method is required');
          }
          // Validate shipping method exists
          const shippingMethod = checkoutSession.stepData?.shipping?.method;
          if (shippingMethod && !this.shippingMethods[shippingMethod]) {
            validation.isValid = false;
            validation.errors.push('Invalid shipping method');
          }
          break;

        case 'payment':
          // Validate payment method is set
          if (!checkoutSession.stepData?.payment?.method) {
            validation.isValid = false;
            validation.errors.push('Payment method is required');
          }
          // Validate payment method exists (case-insensitive check)
          const paymentMethod = checkoutSession.stepData?.payment?.method;
          const availablePaymentMethodsLower = this.availablePaymentMethods.map(m => m.toLowerCase());
          if (paymentMethod && !availablePaymentMethodsLower.includes(paymentMethod.toLowerCase())) {
            validation.isValid = false;
            validation.errors.push('Invalid payment method');
          }
          break;

        case 'review':
          // Validate all previous steps are complete AND actual data exists
          const steps = checkoutSession.progress?.steps || {};
          
          // DIAGNOSTIC: Log checkoutData details for review validation
          this.logger.info('[validateCheckoutStep] Review validation - checkoutData details', {
            sessionId,
            hasCheckoutData: !!checkoutData,
            hasCheckoutDataAddress: !!checkoutData?.address,
            hasCheckoutDataShippingAddress: !!checkoutData?.address?.shippingAddress || !!checkoutData?.address?.address?.shippingAddress,
            hasCheckoutDataShipping: !!checkoutData?.shipping,
            hasCheckoutDataShippingMethod: !!checkoutData?.shipping?.method || !!checkoutData?.shipping?.shipping?.method,
            hasCheckoutDataPayment: !!checkoutData?.payment,
            hasCheckoutDataPaymentMethod: !!checkoutData?.payment?.method || !!checkoutData?.payment?.payment?.method,
            hasStepDataShippingMethod: !!checkoutSession.stepData?.shipping?.method,
            hasStepDataPaymentMethod: !!checkoutSession.stepData?.payment?.method
          });
          
          // Check address step completion AND data exists
          if (!steps.address?.completed) {
            validation.isValid = false;
            validation.errors.push('Address step not completed');
          }
          // Verify actual address data exists in stepData, as saved address, OR in checkoutData
          const reviewHasShippingAddressId = !!checkoutSession.shippingAddressId;
          const reviewHasAddressIdInStepData = !!checkoutSession.stepData?.address?.shippingAddressId;
          const reviewHasAddressDataInStepData = !!checkoutSession.stepData?.address?.shippingAddress;
          const reviewHasAddressDataInCheckoutData = !!checkoutData?.address?.shippingAddress || !!checkoutData?.address?.address?.shippingAddress;
          
          if (!reviewHasShippingAddressId && !reviewHasAddressIdInStepData && !reviewHasAddressDataInStepData && !reviewHasAddressDataInCheckoutData) {
            validation.isValid = false;
            validation.errors.push('Shipping address is required');
            this.logger.warn('[validateCheckoutStep] Review validation failed - no shipping address found', {
              sessionId,
              reviewHasShippingAddressId,
              reviewHasAddressIdInStepData,
              reviewHasAddressDataInStepData,
              reviewHasAddressDataInCheckoutData
            });
          }
          
          // Check shipping step completion
          if (!steps.shipping?.completed) {
            validation.isValid = false;
            validation.errors.push('Shipping step not completed');
          }
          // Verify shipping method is selected (check both stepData and checkoutData)
          const shippingMethodFromSession = checkoutSession.stepData?.shipping?.method;
          const shippingMethodFromCheckoutData = checkoutData?.shipping?.method || checkoutData?.shipping?.shipping?.method;
          const finalShippingMethod = shippingMethodFromCheckoutData || shippingMethodFromSession;
          
          if (!finalShippingMethod) {
            validation.isValid = false;
            validation.errors.push('Shipping method is required');
            this.logger.warn('[validateCheckoutStep] Review validation failed - no shipping method found', {
              sessionId,
              shippingMethodFromSession,
              shippingMethodFromCheckoutData
            });
          } else {
            // Validate shipping method exists
            if (!this.shippingMethods[finalShippingMethod]) {
              validation.isValid = false;
              validation.errors.push('Invalid shipping method');
              this.logger.warn('[validateCheckoutStep] Review validation failed - invalid shipping method', {
                sessionId,
                finalShippingMethod,
                availableMethods: Object.keys(this.shippingMethods)
              });
            }
          }
          
          // Check payment step completion
          if (!steps.payment?.completed) {
            validation.isValid = false;
            validation.errors.push('Payment step not completed');
          }
          // Verify payment method is selected (check both stepData and checkoutData)
          const paymentMethodFromSession = checkoutSession.stepData?.payment?.method;
          const paymentMethodFromCheckoutData = checkoutData?.payment?.method || checkoutData?.payment?.payment?.method;
          const finalPaymentMethod = paymentMethodFromCheckoutData || paymentMethodFromSession;
          
          if (!finalPaymentMethod) {
            validation.isValid = false;
            validation.errors.push('Payment method is required');
            this.logger.warn('[validateCheckoutStep] Review validation failed - no payment method found', {
              sessionId,
              paymentMethodFromSession,
              paymentMethodFromCheckoutData
            });
          } else {
            // Validate payment method exists (case-insensitive check)
            const availablePaymentMethodsLower = this.availablePaymentMethods.map(m => m.toLowerCase());
            if (!availablePaymentMethodsLower.includes(finalPaymentMethod.toLowerCase())) {
              validation.isValid = false;
              validation.errors.push('Invalid payment method');
              this.logger.warn('[validateCheckoutStep] Review validation failed - invalid payment method', {
                sessionId,
                finalPaymentMethod,
                availableMethods: this.availablePaymentMethods
              });
            }
          }
          break;
      }

      // Validate stock availability for all items
      for (const item of checkoutSession.cart.items) {
        let availableStock;
        if (item.variantId) {
          availableStock = item.variant?.stock || 0;
        } else {
          availableStock = item.product?.stockQuantity || 0;
        }

        if (availableStock < item.quantity) {
          validation.isValid = false;
          validation.errors.push(`Insufficient stock for ${item.product.name}`);
        }
      }

      this.logger.info('[validateCheckoutStep] Step validation completed', {
        sessionId,
        step,
        isValid: validation.isValid,
        errorCount: validation.errors.length
      });

      return validation;
    } catch (error) {
      this.logger.error('[validateCheckoutStep] Error validating checkout step', {
        sessionId,
        step,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calculate checkout totals
   * @param {string} sessionId - Checkout session ID
   * @returns {Promise<Object>} Calculated totals
   */
  async calculateCheckoutTotals(sessionId) {
    try {
      this.logger.info('[calculateCheckoutTotals] Calculating checkout totals', { sessionId });

      const checkoutSession = await this.prisma.checkout_sessions.findUnique({
        where: { id: sessionId }
      });

      if (!checkoutSession) {
        throw new Error('Checkout session not found');
      }

      // Get cart totals
      const cartTotals = await cartService.calculateCartTotals(checkoutSession.cartId);

      // Calculate shipping cost
      let shippingCost = 0;
      const shippingMethod = checkoutSession.stepData?.shipping?.method;
      
      if (shippingMethod) {
        const methodConfig = this.shippingMethods[shippingMethod];
        if (methodConfig) {
          // Free shipping for orders above threshold
          if (cartTotals.subtotal >= this.freeShippingThreshold) {
            shippingCost = 0;
          } else {
            shippingCost = methodConfig.cost;
          }
        }
      }

      // Calculate payment fees (for certain payment methods)
      let paymentFee = 0;
      const paymentMethod = checkoutSession.stepData?.payment?.method;
      
      if (paymentMethod === 'EMI') {
        // EMI processing fee: 2% of subtotal
        paymentFee = cartTotals.subtotal * 0.02;
      } else if (paymentMethod === 'CREDIT_CARD') {
        // Credit card processing fee: 1.5% of subtotal
        paymentFee = cartTotals.subtotal * 0.015;
      }

      // Calculate total
      const total = cartTotals.subtotal + cartTotals.tax + shippingCost + paymentFee;

      const totals = {
        subtotal: cartTotals.subtotal,
        tax: cartTotals.tax,
        shippingCost,
        paymentFee,
        discount: cartTotals.discount,
        total
      };

      this.logger.info('[calculateCheckoutTotals] Totals calculated', {
        sessionId,
        totals
      });

      return totals;
    } catch (error) {
      this.logger.error('[calculateCheckoutTotals] Error calculating checkout totals', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Complete checkout session and create order
   * @param {string} sessionId - Checkout session ID
   * @param {Object} checkoutData - Checkout data from request body (optional)
   * @returns {Promise<Object>} Created order
   */
  async completeCheckoutSession(sessionId, checkoutData = null) {
    try {
      this.logger.info('[completeCheckoutSession] Completing checkout session', { 
        sessionId,
        hasCheckoutData: !!checkoutData
      });

      // Get checkout session
      const checkoutSession = await this.prisma.checkout_sessions.findUnique({
        where: { id: sessionId },
        include: {
          cart: {
            include: {
              items: {
                include: {
                  product: true,
                  variant: true
                }
              }
            }
          },
          shippingAddress: true,
          billingAddress: true
        }
      });

      if (!checkoutSession) {
        throw new Error('Checkout session not found');
      }

      // CRITICAL: Validate cart has items before creating order
      if (!checkoutSession.cart || checkoutSession.cart.items.length === 0) {
        this.logger.error('[completeCheckoutSession] Cart is empty - cannot create order', {
          sessionId,
          cartId: checkoutSession.cartId,
          cartItems: checkoutSession.cart?.items?.length || 0
        });
        throw new Error('Cart is empty - cannot create order. Please add items to your cart and try again.');
      }

      // Validate session is not already completed
      if (checkoutSession.status === 'completed') {
        throw new Error('Checkout session already completed');
      }

      // Validate all steps are completed (pass checkoutData to validate request body data)
      const validation = await this.validateCheckoutStep(sessionId, 'review', checkoutData);
      if (!validation.isValid) {
        throw new Error('Checkout validation failed: ' + validation.errors.join(', '));
      }

      // Calculate final totals
      const totals = await this.calculateCheckoutTotals(sessionId);

      // Generate order number
      const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

      // Determine payment method
      const paymentMethod = checkoutSession.stepData?.payment?.method?.toLowerCase() || 'cash_on_delivery';

      // Use transaction to create order atomically
      const order = await this.prisma.$transaction(async (tx) => {
        // Handle guest user - create temporary guest user if needed
        let orderUserId = checkoutSession.userId;
        if (!orderUserId) {
          // Create a temporary guest user for the order
          // Priority: checkoutData.address > stepData.address
          const shippingAddressData = checkoutData?.address?.shippingAddress || checkoutSession.stepData?.address?.shippingAddress;
          const guestUser = await tx.users.create({
            data: {
              email: `guest_${Date.now()}@temp.local`, // Temporary email
              firstName: shippingAddressData?.firstName || shippingAddressData?.name?.split(' ')[0] || 'Guest',
              lastName: shippingAddressData?.lastName || shippingAddressData?.name?.split(' ').slice(1).join(' ') || 'User',
              role: 'customer',
              status: 'active',
              accountStatus: 'guest'
            }
          });
          orderUserId = guestUser.id;
        }

        // Prepare address data for order
        // DIAGNOSTIC: Log address data details before processing
        this.logger.info('[completeCheckoutSession] Address data details', {
          sessionId,
          hasCheckoutData: !!checkoutData,
          hasCheckoutDataAddress: !!checkoutData?.address,
          hasCheckoutDataShippingAddress: !!checkoutData?.address?.shippingAddress,
          hasShippingAddressId: !!checkoutSession.shippingAddressId,
          shippingAddressId: checkoutSession.shippingAddressId,
          hasStepData: !!checkoutSession.stepData,
          stepDataKeys: checkoutSession.stepData ? Object.keys(checkoutSession.stepData) : [],
          hasAddressStepData: !!checkoutSession.stepData?.address,
          addressStepData: checkoutSession.stepData?.address,
          hasShippingAddressInStepData: !!checkoutSession.stepData?.address?.shippingAddress,
          shippingAddressInStepData: checkoutSession.stepData?.address?.shippingAddress,
          hasShippingAddressIdInAddressData: !!checkoutSession.stepData?.address?.shippingAddressId,
          shippingAddressIdInAddressData: checkoutSession.stepData?.address?.shippingAddressId
        });
        
        let addressData;
        let shippingAddressData = null;
        let billingAddressData = null;
        
        // Determine address data source with priority:
        // Priority 1: checkoutData from request body (most recent user input)
        // Priority 2: checkoutSession.shippingAddressId (saved address)
        // Priority 3: checkoutSession.stepData.address.shippingAddressId (address ID in stepData)
        // Priority 4: checkoutSession.stepData.address.shippingAddress (full address object in stepData)
        
        if (checkoutData?.address?.shippingAddress) {
          // Priority 1: Use shipping address from checkoutData
          shippingAddressData = checkoutData.address.shippingAddress;
          this.logger.info('[completeCheckoutSession] Using shipping address from checkoutData');
        } else if (checkoutSession.shippingAddressId) {
          // Priority 2: Use existing saved address
          addressData = {
            address: {
              connect: { id: checkoutSession.shippingAddressId }
            }
          };
          this.logger.info('[completeCheckoutSession] Using saved shipping address');
        } else if (checkoutSession.stepData?.address?.shippingAddressId) {
          // Priority 3: Use address ID from stepData
          addressData = {
            address: {
              connect: { id: checkoutSession.stepData.address.shippingAddressId }
            }
          };
          this.logger.info('[completeCheckoutSession] Using shipping address ID from stepData');
        } else if (checkoutSession.stepData?.address?.shippingAddress) {
          // Priority 4: Use address object from stepData
          shippingAddressData = checkoutSession.stepData.address.shippingAddress;
          this.logger.info('[completeCheckoutSession] Using shipping address from stepData');
        } else {
          // No address data found anywhere
          throw new Error('Shipping address is required');
        }
        
        // Handle billing address separately
        let billingAddressId = null;
        
        // Determine billing address source
        if (checkoutData?.address?.billingAddress) {
          // Use billing address from checkoutData
          billingAddressData = checkoutData.address.billingAddress;
        } else if (checkoutSession.billingAddressId) {
          // Use existing saved billing address
          billingAddressId = checkoutSession.billingAddressId;
        } else if (checkoutData?.address?.useSameAddress) {
          // Use same address as shipping
          if (shippingAddressData) {
            billingAddressData = shippingAddressData;
          } else if (checkoutSession.shippingAddressId) {
            billingAddressId = checkoutSession.shippingAddressId;
          }
        } else if (checkoutSession.stepData?.address?.billingAddress) {
          // Use billing address from stepData
          billingAddressData = checkoutSession.stepData.address.billingAddress;
        }
        
        // If we have shippingAddressData (not just addressData with connect), create the address
        if (shippingAddressData && !addressData) {
          // Create or find shipping address
          const shippingAddress = await this.createOrUpdateAddress(
            tx,
            orderUserId,
            shippingAddressData,
            'shipping'
          );
          addressData = { address: { connect: { id: shippingAddress.id } } };
        }
        
        // Create billing address if we have billingAddressData
        if (billingAddressData) {
          const billingAddress = await this.createOrUpdateAddress(
            tx,
            orderUserId,
            billingAddressData,
            'billing'
          );
          billingAddressId = billingAddress.id;
        }
        
        // Add billing address to addressData if we have one
        if (billingAddressId) {
          addressData.billingAddressId = billingAddressId;
        }

        // Create order
        const newOrder = await tx.orders.create({
          data: {
            orderNumber,
            user: { connect: { id: orderUserId } },
            checkoutSessionId: sessionId,
            subtotal: totals.subtotal,
            tax: totals.tax,
            shippingCost: totals.shippingCost,
            discount: totals.discount,
            total: totals.total,
            paymentMethod,
            paymentDetails: checkoutSession.stepData?.payment?.details || null,
            notes: checkoutSession.stepData?.review?.notes || null,
            status: 'pending',
            // Handle shipping address
            address: addressData.address,
            items: {
              create: checkoutSession.cart.items.map(item => ({
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
        for (const item of checkoutSession.cart.items) {
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

        // Mark checkout session as completed
        await tx.checkout_sessions.update({
          where: { id: sessionId },
          data: {
            status: 'completed',
            orderId: newOrder.id,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Mark cart as converted
        await tx.carts.update({
          where: { id: checkoutSession.cartId },
          data: {
            status: 'converted'
          }
        });

        return newOrder;
      });

      // Invalidate cart cache
      await cartService.invalidateCartCache(checkoutSession.cartId);

      this.logger.info('[completeCheckoutSession] Checkout completed successfully', {
        sessionId,
        orderId: order.id,
        orderNumber: order.orderNumber
      });

      return order;
    } catch (error) {
      this.logger.error('[completeCheckoutSession] Error completing checkout session', {
        sessionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Abandon checkout session
   * @param {string} sessionId - Checkout session ID
   * @param {string} reason - Reason for abandonment
   * @returns {Promise<Object>} Abandonment result
   */
  async abandonCheckoutSession(sessionId, reason) {
    try {
      this.logger.info('[abandonCheckoutSession] Abandoning checkout session', { sessionId, reason });

      // Get checkout session
      const checkoutSession = await this.prisma.checkout_sessions.findUnique({
        where: { id: sessionId },
        include: {
          cart: true
        }
      });

      if (!checkoutSession) {
        throw new Error('Checkout session not found');
      }

      // Check if already abandoned or completed
      if (checkoutSession.status === 'abandoned' || checkoutSession.status === 'completed') {
        return {
          success: true,
          message: 'Checkout session already ' + checkoutSession.status
        };
      }

      // Create abandonment record
      const abandonment = await this.prisma.checkout_abandonments.create({
        data: {
          checkoutSessionId: sessionId,
          userId: checkoutSession.userId,
          sessionId: checkoutSession.sessionId,
          abandonmentStep: checkoutSession.currentStep,
          abandonmentReason: reason,
          cartValue: checkoutSession.cart?.total || 0,
          itemCount: checkoutSession.cart?.items?.length || 0
        }
      });

      // Mark checkout session as abandoned
      await this.prisma.checkout_sessions.update({
        where: { id: sessionId },
        data: {
          status: 'abandoned',
          abandonmentId: abandonment.id,
          updatedAt: new Date()
        }
      });

      this.logger.info('[abandonCheckoutSession] Checkout session abandoned', {
        sessionId,
        reason,
        abandonmentId: abandonment.id
      });

      return {
        success: true,
        abandonmentId: abandonment.id
      };
    } catch (error) {
      this.logger.error('[abandonCheckoutSession] Error abandoning checkout session', {
        sessionId,
        reason,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Track checkout progress
   * @param {string} sessionId - Checkout session ID
   * @param {string} step - Current step
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Progress tracking result
   */
  async trackCheckoutProgress(sessionId, step, metadata = {}) {
    try {
      this.logger.info('[trackCheckoutProgress] Tracking checkout progress', { sessionId, step });

      const checkoutSession = await this.prisma.checkout_sessions.findUnique({
        where: { id: sessionId }
      });

      if (!checkoutSession) {
        throw new Error('Checkout session not found');
      }

      // Update progress tracking
      const progress = checkoutSession.progress || {};
      const steps = progress.steps || {};

      // Update step metadata
      if (!steps[step]) {
        steps[step] = { completed: false, startedAt: null, completedAt: null };
      }

      steps[step] = {
        ...steps[step],
        ...metadata,
        lastUpdated: new Date().toISOString()
      };

      // Calculate total time spent
      const totalTime = (progress.totalTime || 0) + (metadata.timeSpent || 0);

      const updatedProgress = {
        ...progress,
        steps,
        totalTime,
        stepCount: (progress.stepCount || 0) + 1,
        lastUpdated: new Date().toISOString()
      };

      // Update checkout session
      await this.prisma.checkout_sessions.update({
        where: { id: sessionId },
        data: {
          progress: updatedProgress,
          updatedAt: new Date()
        }
      });

      this.logger.info('[trackCheckoutProgress] Progress tracked', {
        sessionId,
        step,
        totalTime
      });

      return {
        success: true,
        progress: updatedProgress
      };
    } catch (error) {
      this.logger.error('[trackCheckoutProgress] Error tracking checkout progress', {
        sessionId,
        step,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get available shipping methods
   * @returns {Object} Available shipping methods
   */
  getShippingMethods() {
    return this.shippingMethods;
  }

  /**
   * Get available payment methods
   * @returns {Array<Object>} Available payment methods with full details
   */
  getPaymentMethods() {
    // Payment method details for Bangladesh market
    const paymentMethodDetails = [
      {
        method: 'CREDIT_CARD',
        name: 'Credit/Debit Card',
        description: 'Pay securely with Visa, MasterCard, or American Express via SSLCommerz',
        icon: '/icons/credit-card.svg',
        isActive: true,
        isAvailable: true,
        fee: 0.015, // 1.5% processing fee
        processingTime: 'Instant',
        features: ['Secure SSL encryption', 'Instant confirmation', 'Multiple card types supported']
      },
      {
        method: 'BKASH',
        name: 'bKash',
        description: 'Pay with Bangladesh\'s leading mobile financial service',
        icon: '/icons/bkash.svg',
        isActive: true,
        isAvailable: true,
        fee: 0,
        processingTime: 'Instant',
        features: ['Instant payment', 'No additional fees', 'Widely accepted']
      },
      {
        method: 'NAGAD',
        name: 'Nagad',
        description: 'Pay with Nagad mobile financial service',
        icon: '/icons/nagad.svg',
        isActive: true,
        isAvailable: true,
        fee: 0,
        processingTime: 'Instant',
        features: ['Instant payment', 'No additional fees', 'Government-backed service']
      },
      {
        method: 'ROCKET',
        name: 'Rocket',
        description: 'Pay with Dutch-Bangla Bank Rocket service',
        icon: '/icons/rocket.svg',
        isActive: true,
        isAvailable: true,
        fee: 0,
        processingTime: 'Instant',
        features: ['Instant payment', 'No additional fees', 'Bank-backed service']
      },
      {
        method: 'MCASH',
        name: 'MCash',
        description: 'Pay with MCash mobile financial service',
        icon: '/icons/mcash.svg',
        isActive: true,
        isAvailable: true,
        fee: 0,
        processingTime: 'Instant',
        features: ['Instant payment', 'No additional fees']
      },
      {
        method: 'CASH_ON_DELIVERY',
        name: 'Cash on Delivery',
        description: 'Pay cash when your order is delivered',
        icon: '/icons/cod.svg',
        isActive: true,
        isAvailable: true,
        fee: 0,
        processingTime: 'Upon delivery',
        features: ['Pay when you receive', 'No advance payment required', 'Available nationwide']
      },
      {
        method: 'BANK_TRANSFER',
        name: 'Bank Transfer',
        description: 'Transfer payment directly to our bank account',
        icon: '/icons/bank-transfer.svg',
        isActive: true,
        isAvailable: true,
        fee: 0,
        processingTime: '1-2 business days',
        features: ['Secure bank transfer', 'No additional fees', 'Order confirmation after verification']
      },
      {
        method: 'EMI',
        name: 'EMI (Easy Monthly Installments)',
        description: 'Pay in easy monthly installments with 0% interest',
        icon: '/icons/emi.svg',
        isActive: true,
        isAvailable: true,
        fee: 0.02, // 2% processing fee
        processingTime: 'Instant',
        features: ['0% interest', 'Flexible tenure', 'Available on orders above 10,000 BDT']
      }
    ];

    return paymentMethodDetails;
  }

  /**
   * Validate address data (Bangladesh-specific validation)
   * @param {Object} address - Address data
   * @returns {Object} Validation result
   */
  validateAddress(address) {
    const errors = [];

    // Required fields
    if (!address.firstName || address.firstName.trim() === '') {
      errors.push('First name is required');
    }

    if (!address.lastName || address.lastName.trim() === '') {
      errors.push('Last name is required');
    }

    if (!address.phone || address.phone.trim() === '') {
      errors.push('Phone number is required');
    } else {
      // Validate Bangladesh phone number format
      const phoneRegex = /^(?:\+880|0)?1[3-9]\d{8}$/;
      if (!phoneRegex.test(address.phone.replace(/[\s-]/g, ''))) {
        errors.push('Invalid phone number format. Must be a valid Bangladesh phone number');
      }
    }

    if (!address.address || address.address.trim() === '') {
      errors.push('Address is required');
    }

    if (!address.city || address.city.trim() === '') {
      errors.push('City is required');
    }

    if (!address.district || address.district.trim() === '') {
      errors.push('District is required');
    }

    if (!address.division || address.division.trim() === '') {
      errors.push('Division is required');
    }

    if (!address.postalCode || address.postalCode.trim() === '') {
      errors.push('Postal code is required');
    } else {
      // Validate Bangladesh postal code format (4 digits)
      const postalCodeRegex = /^\d{4}$/;
      if (!postalCodeRegex.test(address.postalCode)) {
        errors.push('Invalid postal code format. Must be 4 digits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create or update an address for a user
   * @param {Object} tx - Prisma transaction object
   * @param {string} userId - User ID
   * @param {Object} addressData - Address data
   * @param {string} type - Address type ('shipping' or 'billing')
   * @returns {Promise<Object>} Created or updated address
   */
  async createOrUpdateAddress(tx, userId, addressData, type = 'shipping') {
    try {
      // Normalize address data
      const normalizedAddress = {
        userId,
        type,
        firstName: addressData.firstName || addressData.name?.split(' ')[0] || '',
        lastName: addressData.lastName || addressData.name?.split(' ').slice(1).join(' ') || '',
        phone: addressData.phone || '',
        address: addressData.address || addressData.street || '',
        addressLine2: addressData.addressLine2 || addressData.apartment || '',
        city: addressData.city || '',
        district: addressData.district || '',
        division: addressData.division || 'dhaka',
        upazila: addressData.upazila || '',
        postalCode: addressData.postalCode || '',
        isDefault: false
      };

      // Check if address already exists for this user
      const existingAddress = await tx.addresses.findFirst({
        where: {
          userId,
          type,
          phone: normalizedAddress.phone,
          address: normalizedAddress.address,
          city: normalizedAddress.city,
          district: normalizedAddress.district
        }
      });

      if (existingAddress) {
        this.logger.info('[createOrUpdateAddress] Using existing address', {
          addressId: existingAddress.id,
          userId,
          type
        });
        return existingAddress;
      }

      // Create new address
      const newAddress = await tx.addresses.create({
        data: normalizedAddress
      });

      this.logger.info('[createOrUpdateAddress] Created new address', {
        addressId: newAddress.id,
        userId,
        type
      });

      return newAddress;
    } catch (error) {
      this.logger.error('[createOrUpdateAddress] Error creating/updating address', {
        userId,
        type,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

// Singleton instance
const checkoutService = new CheckoutService();

module.exports = {
  CheckoutService,
  checkoutService
};
