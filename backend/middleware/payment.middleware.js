/**
 * Payment Middleware
 * 
 * This module provides middleware functions for payment-related operations,
 * including ownership checks, refund eligibility, and client info extraction.
 */

const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');

class PaymentMiddleware {
  constructor() {
    this.prisma = databaseService.getClient();
    this.logger = loggerService;
  }

  /**
   * Check if order belongs to the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async checkOrderOwnership(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first',
          messageBn: 'অনুগ্রহ করে প্রথমে প্রমাণীকরণ করুন'
        });
      }

      const orderId = req.params.orderId || req.body.orderId;
      
      if (!orderId) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Order ID is required',
          messageBn: 'অর্ডার আইডি প্রয়োজন'
        });
      }

      // Fetch order from database
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          userId: true,
          orderNumber: true
        }
      });

      if (!order) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Order not found',
          messageBn: 'অর্ডার পাওয়া যায়নি'
        });
      }

      // Check if order belongs to user or user is admin
      const isAdmin = req.user.role?.toUpperCase() === 'ADMIN' || 
                     req.user.rbacRole?.toLowerCase() === 'admin';
      
      if (order.userId !== req.user.id && !isAdmin) {
        this.logger.warn('Unauthorized order access attempt', {
          userId: req.user.id,
          orderId: order.id,
          orderUserId: order.userId,
          isAdmin
        });

        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own orders',
          messageBn: 'আপনি শুধুমাত্র নিজের অর্ডার অ্যাক্সেস করতে পারবেন'
        });
      }

      // Attach order to request for use in controllers
      req.order = order;
      next();

    } catch (error) {
      this.logger.error('Order ownership check error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        orderId: req.params.orderId || req.body.orderId
      });

      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify order ownership',
        messageBn: 'অর্ডারের মালিকানা যাচাই করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Check if payment can be refunded
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async checkRefundEligibility(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please authenticate first',
          messageBn: 'অনুগ্রহ করে প্রথমে প্রমাণীকরণ করুন'
        });
      }

      const transactionId = req.params.id || req.params.transactionId;
      
      if (!transactionId) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Transaction ID is required',
          messageBn: 'লেনদেন আইডি প্রয়োজন'
        });
      }

      // Fetch payment transaction
      const transaction = await this.prisma.paymentTransaction.findUnique({
        where: { transactionId },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              orderNumber: true
            }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Payment transaction not found',
          messageBn: 'পেমেন্ট লেনদেন পাওয়া যায়নি'
        });
      }

      // Check if user owns the transaction or is admin
      const isAdmin = req.user.role?.toUpperCase() === 'ADMIN' || 
                     req.user.rbacRole?.toLowerCase() === 'admin';
      
      if (transaction.order.userId !== req.user.id && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only refund your own payments',
          messageBn: 'আপনি শুধুমাত্র নিজের পেমেন্ট রিফান্ড করতে পারবেন'
        });
      }

      // Check if payment is completed and refundable
      if (transaction.status !== 'completed') {
        return res.status(400).json({
          error: 'Invalid payment status',
          message: `Cannot refund payment with status: ${transaction.status}`,
          messageBn: `স্ট্যাটাস সহ পেমেন্ট রিফান্ড করা যাবে না: ${transaction.status}`
        });
      }

      // Check if already refunded
      if (transaction.refundAmount && transaction.refundAmount > 0) {
        return res.status(400).json({
          error: 'Already refunded',
          message: 'This payment has already been refunded',
          messageBn: 'এই পেমেন্টটি ইতিমধ্যে রিফান্ড করা হয়েছে'
        });
      }

      // Check refund time limit (e.g., 30 days)
      const refundTimeLimit = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      const timeSincePayment = Date.now() - new Date(transaction.createdAt).getTime();

      if (timeSincePayment > refundTimeLimit) {
        return res.status(400).json({
          error: 'Refund period expired',
          message: 'Refund period has expired (30 days)',
          messageBn: 'রিফান্ড সময়সীমা শেষ হয়ে গেছে (৩০ দিন)'
        });
      }

      // Attach transaction to request
      req.transaction = transaction;
      next();

    } catch (error) {
      this.logger.error('Refund eligibility check error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        transactionId: req.params.id || req.params.transactionId
      });

      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to verify refund eligibility',
        messageBn: 'রিফান্ডের যোগ্যতা যাচাই করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Extract client information for logging
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  extractClientInfo(req, res, next) {
    // Extract IP address
    const ip = req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress ||
               req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               'unknown';

    // Extract user agent
    const userAgent = req.get('user-agent') || 'unknown';

    // Attach client info to request
    req.clientInfo = {
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    };

    next();
  }

  /**
   * Validate payment gateway is active
   * @param {string} gateway - Gateway name (sslcommerz, bkash, nagad)
   */
  async validateGatewayActive(gateway) {
    try {
      const gatewaySettings = await this.prisma.paymentGatewaySettings.findUnique({
        where: { gateway }
      });

      if (!gatewaySettings) {
        return {
          isValid: false,
          error: 'Payment gateway not configured'
        };
      }

      if (!gatewaySettings.isActive) {
        return {
          isValid: false,
          error: 'Payment gateway is currently inactive'
        };
      }

      return { isValid: true, settings: gatewaySettings };

    } catch (error) {
      this.logger.error('Gateway validation error', {
        error: error.message,
        gateway
      });

      return {
        isValid: false,
        error: 'Failed to validate payment gateway'
      };
    }
  }

  /**
   * Check if payment method is available
   * @param {string} paymentMethod - Payment method
   */
  async isPaymentMethodAvailable(paymentMethod) {
    const gatewayMap = {
      'CREDIT_CARD': 'sslcommerz',
      'BKASH': 'bkash',
      'NAGAD': 'nagad'
    };

    const gateway = gatewayMap[paymentMethod];
    if (!gateway) {
      return {
        isValid: false,
        error: 'Invalid payment method'
      };
    }

    return await this.validateGatewayActive(gateway);
  }

  /**
   * Rate limit payment initiation
   * @param {number} maxRequests - Maximum requests per window
   * @param {number} windowMs - Window duration in milliseconds
   */
  rateLimitPaymentInitiation(maxRequests = 5, windowMs = 15 * 60 * 1000) {
    const requests = new Map();

    return (req, res, next) => {
      const key = req.user?.id || req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      for (const [k, v] of requests.entries()) {
        if (v.timestamp < windowStart) {
          requests.delete(k);
        }
      }

      // Get user's request history
      const userRequests = Array.from(requests.values())
        .filter(r => r.key === key && r.timestamp >= windowStart);

      if (userRequests.length >= maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Payment initiation rate limit exceeded. Please try again later.',
          messageBn: 'পেমেন্ট শুরুর হার সীমা অতিক্রম করেছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
          retryAfter: Math.ceil((userRequests[0].timestamp + windowMs - now) / 1000)
        });
      }

      // Record this request
      requests.set(`${key}_${now}`, { key, timestamp: now });

      next();
    };
  }

  /**
   * Validate webhook signature for payment gateways
   * @param {string} gateway - Gateway name
   */
  validateWebhookSignature(gateway) {
    return async (req, res, next) => {
      try {
        const gatewaySettings = await this.prisma.paymentGatewaySettings.findUnique({
          where: { gateway }
        });

        if (!gatewaySettings || !gatewaySettings.isActive) {
          return res.status(404).json({
            error: 'Gateway not found or inactive'
          });
        }

        // Gateway-specific signature validation
        let isValid = false;

        switch (gateway) {
          case 'sslcommerz':
            isValid = this.validateSSLCommerzSignature(req, gatewaySettings);
            break;
          case 'bkash':
            isValid = this.validateBkashSignature(req, gatewaySettings);
            break;
          case 'nagad':
            isValid = this.validateNagadSignature(req, gatewaySettings);
            break;
          default:
            isValid = true; // Allow if no validation implemented
        }

        if (!isValid) {
          this.logger.warn('Invalid webhook signature', {
            gateway,
            ip: req.ip
          });

          return res.status(401).json({
            error: 'Invalid signature',
            message: 'Webhook signature verification failed'
          });
        }

        next();

      } catch (error) {
        this.logger.error('Webhook signature validation error', {
          error: error.message,
          gateway
        });

        return res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to validate webhook signature'
        });
      }
    };
  }

  /**
   * Validate SSLCommerz webhook signature
   */
  validateSSLCommerzSignature(req, settings) {
    // SSLCommerz signature validation logic
    // This is a placeholder - implement actual signature verification
    return true;
  }

  /**
   * Validate bKash webhook signature
   */
  validateBkashSignature(req, settings) {
    // bKash signature validation logic
    // This is a placeholder - implement actual signature verification
    return true;
  }

  /**
   * Validate Nagad webhook signature
   */
  validateNagadSignature(req, settings) {
    // Nagad signature validation logic
    // This is a placeholder - implement actual signature verification
    return true;
  }
}

// Singleton instance
const paymentMiddleware = new PaymentMiddleware();

module.exports = {
  PaymentMiddleware,
  paymentMiddleware,
  checkOrderOwnership: paymentMiddleware.checkOrderOwnership.bind(paymentMiddleware),
  checkRefundEligibility: paymentMiddleware.checkRefundEligibility.bind(paymentMiddleware),
  extractClientInfo: paymentMiddleware.extractClientInfo.bind(paymentMiddleware),
  validateGatewayActive: paymentMiddleware.validateGatewayActive.bind(paymentMiddleware),
  isPaymentMethodAvailable: paymentMiddleware.isPaymentMethodAvailable.bind(paymentMiddleware),
  rateLimitPaymentInitiation: paymentMiddleware.rateLimitPaymentInitiation.bind(paymentMiddleware),
  validateWebhookSignature: paymentMiddleware.validateWebhookSignature.bind(paymentMiddleware)
};
