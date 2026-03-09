/**
 * Payment Controller
 * 
 * This module provides controller methods for payment-related API endpoints,
 * including payment initiation, verification, refunds, and admin operations.
 */

const { databaseService } = require('../services/database');
const { loggerService } = require('../services/logger');
const { paymentGatewayFactory } = require('../dist/src/services/payment/payment-gateway.factory');
const { paymentTransactionService } = require('../dist/src/services/payment/payment-transaction.service');
const { PaymentEventType } = require('../dist/src/services/payment/payment-gateway.interface');
const { sanitizePaymentData } = require('../validators/payment.validator');
const { paymentAnalyticsService } = require('../dist/src/services/payment/payment-analytics.service');
const { paymentMetricsService } = require('../dist/src/services/payment/payment-metrics.service');

class PaymentController {
  constructor() {
    this.prisma = databaseService.getClient();
    this.logger = loggerService;
  }

  /**
   * Initialize payment for an order
   * POST /api/v1/payments/initiate
   */
  async initiatePayment(req, res) {
    try {
      const { orderId, paymentMethod } = req.body;
      const userId = req.user?.id;

      this.logger.info('Payment initiation request', {
        orderId,
        paymentMethod,
        userId,
        ip: req.clientInfo?.ip
      });

      // Fetch order details
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              firstName: true,
              lastName: true
            }
          },
          address: {
            select: {
              id: true,
              addressLine1: true,
              addressLine2: true,
              city: true,
              district: true,
              postalCode: true,
              country: true
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          message: 'The specified order does not exist',
          messageBn: 'নির্দিষ্ট অর্ডারটি বিদ্যমান নেই'
        });
      }

      // Check if user owns the order (if authenticated)
      if (userId && order.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only initiate payment for your own orders',
          messageBn: 'আপনি শুধুমাত্র নিজের অর্ডারের জন্য পেমেন্ট শুরু করতে পারবেন'
        });
      }

      // Check if order already has a completed payment
      const existingPayment = await this.prisma.payment_transaction.findFirst({
        where: {
          orderId,
          status: 'completed'
        }
      });

      if (existingPayment) {
        return res.status(400).json({
          success: false,
          error: 'Payment already completed',
          message: 'This order has already been paid for',
          messageBn: 'এই অর্ডারটির জন্য ইতিমধ্যে পেমেন্ট করা হয়েছে'
        });
      }

      // Get payment gateway
      const gateway = paymentGatewayFactory.getGateway(paymentMethod);

      if (!gateway) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment method',
          message: 'The selected payment method is not available',
          messageBn: 'নির্বাচিত পেমেন্ট পদ্ধতিটি উপলব্ধ নেই'
        });
      }

      // Prepare order object for gateway
      const orderForGateway = {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        currency: order.currency || 'BDT',
        userId: order.userId,
        addressId: order.addressId,
        shippingMethod: order.shippingMethod,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        internalNotes: order.internalNotes,
        paymentDetails: order.paymentDetails,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };

      // Initiate payment with gateway
      const initiationResult = await gateway.initiatePayment(orderForGateway);

      if (!initiationResult.success) {
        this.logger.error('Payment initiation failed', {
          orderId,
          paymentMethod,
          error: initiationResult.error
        });

        return res.status(500).json({
          success: false,
          error: 'Payment initiation failed',
          message: initiationResult.error || 'Failed to initiate payment',
          messageBn: 'পেমেন্ট শুরু করতে ব্যর্থ হয়েছে'
        });
      }

      // Create payment transaction record
      const transaction = await paymentTransactionService.createPaymentTransaction({
        orderId: order.id,
        paymentMethod,
        amount: order.total,
        currency: order.currency || 'BDT',
        transactionId: initiationResult.transactionId,
        gatewayTransactionId: initiationResult.gatewayResponse?.tran_id || initiationResult.gatewayResponse?.paymentID,
        paymentId: initiationResult.gatewayResponse?.paymentID,
        merchantInvoiceNumber: initiationResult.gatewayResponse?.merchantInvoiceNumber,
        customerMsisdn: initiationResult.gatewayResponse?.customerMsisdn,
        gatewayResponse: sanitizePaymentData(initiationResult.gatewayResponse),
        ipAddress: req.clientInfo?.ip,
        userAgent: req.clientInfo?.userAgent
      });

      this.logger.info('Payment initiated successfully', {
        orderId,
        transactionId: initiationResult.transactionId,
        paymentMethod
      });

      return res.status(200).json({
        success: true,
        transactionId: initiationResult.transactionId,
        paymentUrl: initiationResult.paymentUrl,
        message: 'Payment initiated successfully',
        messageBn: 'পেমেন্ট সফলভাবে শুরু হয়েছে'
      });

    } catch (error) {
      this.logger.error('Payment initiation error', {
        error: error.message,
        stack: error.stack,
        orderId: req.body.orderId,
        paymentMethod: req.body.paymentMethod,
        userId: req.user?.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to initiate payment',
        messageBn: 'পেমেন্ট শুরু করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get payment status by order ID
   * GET /api/v1/payments/:orderId/status
   */
  async getPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      this.logger.info('Payment status request', {
        orderId,
        userId
      });

      // Fetch payment transactions for order
      const transactions = await this.prisma.payment_transaction.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
        take: 1
      });

      if (transactions.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
          message: 'No payment found for this order',
          messageBn: 'এই অর্ডারের জন্য কোনো পেমেন্ট পাওয়া যায়নি'
        });
      }

      const transaction = transactions[0];

      // Check if user owns the order (if authenticated)
      if (userId) {
        const order = await this.prisma.orders.findUnique({
          where: { id: orderId },
          select: { userId: true }
        });

        if (order && order.userId !== userId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'You can only view your own payment status',
            messageBn: 'আপনি শুধুমাত্র নিজের পেমেন্ট স্ট্যাটাস দেখতে পারবেন'
          });
        }
      }

      this.logger.info('Payment status retrieved', {
        orderId,
        transactionId: transaction.transactionId,
        status: transaction.status
      });

      return res.status(200).json({
        success: true,
        status: transaction.status,
        transaction: {
          id: transaction.id,
          transactionId: transaction.transactionId,
          orderId: transaction.orderId,
          paymentMethod: transaction.paymentMethod,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        },
        message: 'Payment status retrieved successfully',
        messageBn: 'পেমেন্ট স্ট্যাটাস সফলভাবে পুনরুদ্ধার করা হয়েছে'
      });

    } catch (error) {
      this.logger.error('Payment status retrieval error', {
        error: error.message,
        stack: error.stack,
        orderId: req.params.orderId
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve payment status',
        messageBn: 'পেমেন্ট স্ট্যাটাস পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Handle SSLCommerz success callback
   * POST /api/v1/payments/sslcommerz/success
   */
  async handleSSLCommerzSuccess(req, res) {
    try {
      const { tran_id, val_id, amount, card_type, card_issuer, card_brand } = req.body;

      this.logger.info('SSLCommerz success callback', {
        transactionId: tran_id,
        validationId: val_id,
        amount,
        ip: req.clientInfo?.ip
      });

      // Find transaction by transaction ID
      const transaction = await this.prisma.payment_transaction.findUnique({
        where: { transactionId: tran_id },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              orderNumber: true,
              total: true
            }
          }
        }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      // Get SSLCommerz gateway
      const gateway = paymentGatewayFactory.getGateway('CREDIT_CARD');

      // Handle callback
      const callbackResult = await gateway.handleCallback(req.body);

      if (callbackResult.success) {
        // Update payment status
        await paymentTransactionService.updatePaymentStatus({
          transactionId: tran_id,
          status: 'completed',
          gatewayTransactionId: val_id,
          callbackResponse: sanitizePaymentData(req.body)
        });

        // Update order payment status
        await this.prisma.orders.update({
          where: { id: transaction.orderId },
          data: {
            paymentStatus: 'paid',
            paymentDetails: {
              ...transaction.order.paymentDetails,
              gateway: 'sslcommerz',
              cardType: card_type,
              cardIssuer: card_issuer,
              cardBrand: card_brand
            }
          }
        });

        this.logger.info('SSLCommerz payment completed', {
          transactionId: tran_id,
          orderId: transaction.orderId
        });

        // Redirect to frontend success page
        return res.redirect(302, `${process.env.FRONTEND_URL}/checkout/payment/success?orderId=${transaction.orderId}`);
      } else {
        // Update payment status to failed
        await paymentTransactionService.updatePaymentStatus({
          transactionId: tran_id,
          status: 'failed',
          callbackResponse: sanitizePaymentData(req.body),
          failureReason: callbackResult.error
        });

        return res.redirect(302, `${process.env.FRONTEND_URL}/checkout/payment/cancel?orderId=${transaction.orderId}`);
      }

    } catch (error) {
      this.logger.error('SSLCommerz success callback error', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Handle SSLCommerz fail callback
   * POST /api/v1/payments/sslcommerz/fail
   */
  async handleSSLCommerzFail(req, res) {
    try {
      const { tran_id } = req.body;

      this.logger.info('SSLCommerz fail callback', {
        transactionId: tran_id,
        ip: req.clientInfo?.ip
      });

      // Find transaction
      const transaction = await this.prisma.payment_transaction.findUnique({
        where: { transactionId: tran_id }
      });

      if (transaction) {
        // Update payment status
        await paymentTransactionService.updatePaymentStatus({
          transactionId: tran_id,
          status: 'failed',
          callbackResponse: sanitizePaymentData(req.body),
          failureReason: 'Payment failed at gateway'
        });
      }

      // Redirect to frontend fail page
      const orderId = transaction?.orderId || 'unknown';
      return res.redirect(302, `${process.env.FRONTEND_URL}/checkout/payment/cancel?orderId=${orderId}`);

    } catch (error) {
      this.logger.error('SSLCommerz fail callback error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Handle SSLCommerz cancel callback
   * POST /api/v1/payments/sslcommerz/cancel
   */
  async handleSSLCommerzCancel(req, res) {
    try {
      const { tran_id } = req.body;

      this.logger.info('SSLCommerz cancel callback', {
        transactionId: tran_id,
        ip: req.clientInfo?.ip
      });

      // Find transaction
      const transaction = await this.prisma.payment_transaction.findUnique({
        where: { transactionId: tran_id }
      });

      if (transaction) {
        // Update payment status
        await paymentTransactionService.updatePaymentStatus({
          transactionId: tran_id,
          status: 'cancelled',
          callbackResponse: sanitizePaymentData(req.body),
          failureReason: 'Payment cancelled by user'
        });
      }

      // Redirect to frontend cancel page
      const orderId = transaction?.orderId || 'unknown';
      return res.redirect(302, `${process.env.FRONTEND_URL}/checkout/payment/cancel?orderId=${orderId}`);

    } catch (error) {
      this.logger.error('SSLCommerz cancel callback error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Handle SSLCommerz IPN (Instant Payment Notification)
   * POST /api/v1/payments/sslcommerz/ipn
   */
  async handleSSLCommerzIPN(req, res) {
    try {
      const { tran_id, val_id, status, amount, store_amount, bank_tran_id } = req.body;

      this.logger.info('SSLCommerz IPN received', {
        transactionId: tran_id,
        status,
        amount,
        ip: req.clientInfo?.ip
      });

      // Find transaction
      const transaction = await this.prisma.payment_transaction.findUnique({
        where: { transactionId: tran_id }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      // Process based on status
      let paymentStatus;
      if (status === 'VALID' || status === 'VALIDATED') {
        paymentStatus = 'completed';
      } else if (status === 'FAILED') {
        paymentStatus = 'failed';
      } else {
        paymentStatus = 'pending';
      }

      // Update payment status
      await paymentTransactionService.updatePaymentStatus({
        transactionId: tran_id,
        status: paymentStatus,
        gatewayTransactionId: val_id,
        callbackResponse: sanitizePaymentData(req.body)
      });

      // If payment completed, update order
      if (paymentStatus === 'completed') {
        await this.prisma.orders.update({
          where: { id: transaction.orderId },
          data: { paymentStatus: 'paid' }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'IPN processed successfully'
      });

    } catch (error) {
      this.logger.error('SSLCommerz IPN error', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Create bKash payment
   * POST /api/v1/payments/bkash/create
   */
  async createBkashPayment(req, res) {
    try {
      const { orderId, amount, merchantInvoiceNumber } = req.body;
      const userId = req.user?.id;

      this.logger.info('bKash payment creation request', {
        orderId,
        amount,
        userId,
        ip: req.clientInfo?.ip
      });

      // Fetch order
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              phone: true
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Check ownership
      if (userId && order.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Get bKash gateway
      const gateway = paymentGatewayFactory.getGateway('BKASH');

      // Initiate payment
      const initiationResult = await gateway.initiatePayment({
        id: order.id,
        orderNumber: order.orderNumber,
        total: amount || order.total,
        currency: order.currency || 'BDT',
        userId: order.userId,
        addressId: order.addressId,
        shippingMethod: order.shippingMethod,
        paymentMethod: 'BKASH',
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      });

      if (!initiationResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Payment initiation failed',
          message: initiationResult.error
        });
      }

      // Create transaction record
      const transaction = await paymentTransactionService.createPaymentTransaction({
        orderId: order.id,
        paymentMethod: 'BKASH',
        amount: amount || order.total,
        currency: order.currency || 'BDT',
        transactionId: initiationResult.transactionId,
        paymentId: initiationResult.gatewayResponse?.paymentID,
        merchantInvoiceNumber,
        gatewayResponse: sanitizePaymentData(initiationResult.gatewayResponse),
        ipAddress: req.clientInfo?.ip,
        userAgent: req.clientInfo?.userAgent
      });

      return res.status(200).json({
        success: true,
        transactionId: initiationResult.transactionId,
        paymentID: initiationResult.gatewayResponse?.paymentID,
        bkashURL: initiationResult.paymentUrl,
        message: 'bKash payment created successfully'
      });

    } catch (error) {
      this.logger.error('bKash payment creation error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Execute bKash payment
   * POST /api/v1/payments/bkash/execute
   */
  async executeBkashPayment(req, res) {
    try {
      const { paymentID } = req.body;

      this.logger.info('bKash payment execution request', {
        paymentID,
        ip: req.clientInfo?.ip
      });

      // Find transaction
      const transaction = await this.prisma.payment_transaction.findFirst({
        where: { paymentId: paymentID }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      // Get bKash gateway
      const gateway = paymentGatewayFactory.getGateway('BKASH');

      // Execute payment
      const result = await gateway.handleCallback({ paymentID });

      if (result.success) {
        // Update payment status
        await paymentTransactionService.updatePaymentStatus({
          transactionId: transaction.transactionId,
          status: 'completed',
          callbackResponse: sanitizePaymentData(result.gatewayResponse)
        });

        // Update order
        await this.prisma.orders.update({
          where: { id: transaction.orderId },
          data: { paymentStatus: 'paid' }
        });

        return res.status(200).json({
          success: true,
          status: 'completed',
          transaction: result,
          message: 'bKash payment executed successfully'
        });
      } else {
        // Update payment status to failed
        await paymentTransactionService.updatePaymentStatus({
          transactionId: transaction.transactionId,
          status: 'failed',
          callbackResponse: sanitizePaymentData(result.gatewayResponse),
          failureReason: result.error
        });

        return res.status(400).json({
          success: false,
          error: result.error,
          message: 'bKash payment execution failed'
        });
      }

    } catch (error) {
      this.logger.error('bKash payment execution error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Handle bKash callback
   * POST /api/v1/payments/bkash/callback
   */
  async handleBkashCallback(req, res) {
    try {
      const { paymentID, status, transactionId, amount } = req.body;

      this.logger.info('bKash callback received', {
        paymentID,
        status,
        transactionId,
        ip: req.clientInfo?.ip
      });

      // Find transaction
      const transaction = await this.prisma.payment_transaction.findFirst({
        where: { paymentId: paymentID }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      // Determine payment status
      let paymentStatus;
      if (status === 'completed' || status === 'success') {
        paymentStatus = 'completed';
      } else if (status === 'failed' || status === 'cancelled') {
        paymentStatus = status === 'cancelled' ? 'cancelled' : 'failed';
      } else {
        paymentStatus = 'processing';
      }

      // Update payment status
      await paymentTransactionService.updatePaymentStatus({
        transactionId: transaction.transactionId,
        status: paymentStatus,
        callbackResponse: sanitizePaymentData(req.body)
      });

      // Update order if completed
      if (paymentStatus === 'completed') {
        await this.prisma.orders.update({
          where: { id: transaction.orderId },
          data: { paymentStatus: 'paid' }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'bKash callback processed successfully'
      });

    } catch (error) {
      this.logger.error('bKash callback error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Initialize Nagad payment
   * POST /api/v1/payments/nagad/initialize
   */
  async initializeNagadPayment(req, res) {
    try {
      const { orderId, amount, merchantId } = req.body;
      const userId = req.user?.id;

      this.logger.info('Nagad payment initialization request', {
        orderId,
        amount,
        userId,
        ip: req.clientInfo?.ip
      });

      // Fetch order
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Check ownership
      if (userId && order.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Get Nagad gateway
      const gateway = paymentGatewayFactory.getGateway('NAGAD');

      // Initiate payment
      const initiationResult = await gateway.initiatePayment({
        id: order.id,
        orderNumber: order.orderNumber,
        total: amount || order.total,
        currency: order.currency || 'BDT',
        userId: order.userId,
        addressId: order.addressId,
        shippingMethod: order.shippingMethod,
        paymentMethod: 'NAGAD',
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      });

      if (!initiationResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Payment initiation failed',
          message: initiationResult.error
        });
      }

      // Create transaction record
      const transaction = await paymentTransactionService.createPaymentTransaction({
        orderId: order.id,
        paymentMethod: 'NAGAD',
        amount: amount || order.total,
        currency: order.currency || 'BDT',
        transactionId: initiationResult.transactionId,
        gatewayTransactionId: initiationResult.gatewayResponse?.paymentRefId,
        gatewayResponse: sanitizePaymentData(initiationResult.gatewayResponse),
        ipAddress: req.clientInfo?.ip,
        userAgent: req.clientInfo?.userAgent
      });

      return res.status(200).json({
        success: true,
        transactionId: initiationResult.transactionId,
        paymentRefId: initiationResult.gatewayResponse?.paymentRefId,
        nagadURL: initiationResult.paymentUrl,
        message: 'Nagad payment initialized successfully'
      });

    } catch (error) {
      this.logger.error('Nagad payment initialization error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Verify Nagad payment
   * POST /api/v1/payments/nagad/verify
   */
  async verifyNagadPayment(req, res) {
    try {
      const { paymentRefId } = req.body;

      this.logger.info('Nagad payment verification request', {
        paymentRefId,
        ip: req.clientInfo?.ip
      });

      // Find transaction
      const transaction = await this.prisma.payment_transaction.findFirst({
        where: { gatewayTransactionId: paymentRefId }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      // Get Nagad gateway
      const gateway = paymentGatewayFactory.getGateway('NAGAD');

      // Verify payment
      const result = await gateway.handleCallback({ paymentRefId });

      if (result.success) {
        // Update payment status
        await paymentTransactionService.updatePaymentStatus({
          transactionId: transaction.transactionId,
          status: 'completed',
          callbackResponse: sanitizePaymentData(result.gatewayResponse)
        });

        // Update order
        await this.prisma.orders.update({
          where: { id: transaction.orderId },
          data: { paymentStatus: 'paid' }
        });

        return res.status(200).json({
          success: true,
          status: 'completed',
          transaction: result,
          message: 'Nagad payment verified successfully'
        });
      } else {
        // Update payment status to failed
        await paymentTransactionService.updatePaymentStatus({
          transactionId: transaction.transactionId,
          status: 'failed',
          callbackResponse: sanitizePaymentData(result.gatewayResponse),
          failureReason: result.error
        });

        return res.status(400).json({
          success: false,
          error: result.error,
          message: 'Nagad payment verification failed'
        });
      }

    } catch (error) {
      this.logger.error('Nagad payment verification error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Handle Nagad callback
   * POST /api/v1/payments/nagad/callback
   */
  async handleNagadCallback(req, res) {
    try {
      const { payment_ref_id, status, amount, invoice_no } = req.body;

      this.logger.info('Nagad callback received', {
        paymentRefId: payment_ref_id,
        status,
        amount,
        ip: req.clientInfo?.ip
      });

      // Find transaction
      const transaction = await this.prisma.payment_transaction.findFirst({
        where: { gatewayTransactionId: payment_ref_id }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      // Determine payment status
      let paymentStatus;
      if (status === 'Success') {
        paymentStatus = 'completed';
      } else if (status === 'Failed') {
        paymentStatus = 'failed';
      } else if (status === 'Cancelled') {
        paymentStatus = 'cancelled';
      } else {
        paymentStatus = 'processing';
      }

      // Update payment status
      await paymentTransactionService.updatePaymentStatus({
        transactionId: transaction.transactionId,
        status: paymentStatus,
        callbackResponse: sanitizePaymentData(req.body)
      });

      // Update order if completed
      if (paymentStatus === 'completed') {
        await this.prisma.orders.update({
          where: { id: transaction.orderId },
          data: { paymentStatus: 'paid' }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Nagad callback processed successfully'
      });

    } catch (error) {
      this.logger.error('Nagad callback error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Request refund (customer-initiated)
   * POST /api/v1/payments/:id/refund
   */
  async requestRefund(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      const userId = req.user?.id;

      this.logger.info('Refund request', {
        transactionId: id,
        amount,
        reason,
        userId,
        ip: req.clientInfo?.ip
      });

      // Find transaction
      const transaction = await this.prisma.payment_transaction.findUnique({
        where: { id },
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
          success: false,
          error: 'Transaction not found'
        });
      }

      // Check ownership
      if (transaction.order.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Check if payment is completed
      if (transaction.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Cannot refund incomplete payment'
        });
      }

      // Get gateway
      const gateway = paymentGatewayFactory.getGateway(transaction.paymentMethod);

      // Process refund
      const refundAmount = amount || transaction.amount;
      const refundResult = await gateway.refundPayment(
        transaction.transactionId,
        refundAmount
      );

      if (!refundResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Refund failed',
          message: refundResult.error || 'Failed to process refund'
        });
      }

      // Update transaction
      await paymentTransactionService.updatePaymentStatus({
        transactionId: transaction.transactionId,
        status: 'refunded',
        refundAmount: refundAmount,
        callbackResponse: sanitizePaymentData(refundResult.gatewayResponse)
      });

      this.logger.info('Refund processed successfully', {
        transactionId: transaction.transactionId,
        refundAmount,
        refundId: refundResult.refundId
      });

      return res.status(200).json({
        success: true,
        refundId: refundResult.refundId,
        amount: refundAmount,
        currency: transaction.currency,
        message: 'Refund processed successfully',
        messageBn: 'রিফান্ড সফলভাবে প্রক্রিয়া করা হয়েছে'
      });

    } catch (error) {
      this.logger.error('Refund request error', {
        error: error.message,
        stack: error.stack,
        transactionId: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process refund'
      });
    }
  }

  /**
   * Get all payments (admin)
   * GET /api/v1/admin/payments
   */
  async getAllPayments(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentMethod,
        startDate,
        endDate
      } = req.query;

      this.logger.info('Admin payments list request', {
        page,
        limit,
        status,
        paymentMethod,
        startDate,
        endDate
      });

      // Build where clause
      const where = {};

      if (status) {
        where.status = status;
      }

      if (paymentMethod) {
        where.paymentMethod = paymentMethod;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get total count
      const total = await this.prisma.payment_transaction.count({ where });

      // Get payments with pagination
      const payments = await this.prisma.payment_transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        message: 'Payments retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Admin payments list error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve payments'
      });
    }
  }

  /**
   * Get payment by ID (admin)
   * GET /api/v1/admin/payments/:id
   */
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;

      this.logger.info('Admin payment details request', {
        paymentId: id
      });

      const payment = await this.prisma.payment_transaction.findUnique({
        where: { id },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              userId: true,
              total: true,
              currency: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Admin payment details error', {
        error: error.message,
        stack: error.stack,
        paymentId: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve payment'
      });
    }
  }

  /**
   * Admin refund
   * PUT /api/v1/admin/payments/:id/refund
   */
  async adminRefund(req, res) {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      const adminId = req.user?.id;

      this.logger.info('Admin refund request', {
        transactionId: id,
        amount,
        reason,
        adminId,
        ip: req.clientInfo?.ip
      });

      // Find transaction
      const transaction = await this.prisma.payment_transaction.findUnique({
        where: { id }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      // Get gateway
      const gateway = paymentGatewayFactory.getGateway(transaction.paymentMethod);

      // Process refund
      const refundResult = await gateway.refundPayment(
        transaction.transactionId,
        amount
      );

      if (!refundResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Refund failed',
          message: refundResult.error || 'Failed to process refund'
        });
      }

      // Update transaction
      await paymentTransactionService.updatePaymentStatus({
        transactionId: transaction.transactionId,
        status: 'refunded',
        refundAmount: amount,
        callbackResponse: sanitizePaymentData(refundResult.gatewayResponse)
      });

      // Log admin action
      await paymentTransactionService.logPaymentEvent({
        transactionId: transaction.id,
        orderId: transaction.orderId,
        eventType: PaymentEventType.REFUND,
        eventData: {
          action: 'ADMIN_REFUND',
          adminId,
          amount,
          reason,
          refundId: refundResult.refundId
        },
        ipAddress: req.clientInfo?.ip,
        userAgent: req.clientInfo?.userAgent
      });

      this.logger.info('Admin refund processed successfully', {
        transactionId: transaction.transactionId,
        refundAmount: amount,
        refundId: refundResult.refundId,
        adminId
      });

      return res.status(200).json({
        success: true,
        refundId: refundResult.refundId,
        amount,
        currency: transaction.currency,
        message: 'Refund processed successfully'
      });

    } catch (error) {
      this.logger.error('Admin refund error', {
        error: error.message,
        stack: error.stack,
        transactionId: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process refund'
      });
    }
  }

  /**
   * Get payment analytics (admin)
   * GET /api/v1/admin/payments/analytics
   */
  async getPaymentAnalytics(req, res) {
    try {
      const { startDate, endDate, gateway, groupBy } = req.query;

      this.logger.info('Payment analytics request', {
        startDate,
        endDate,
        gateway,
        groupBy
      });

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      // Use analytics service for comprehensive analytics
      const analytics = await paymentAnalyticsService.getAnalyticsByDateRange(
        parsedStartDate,
        parsedEndDate,
        'daily'
      );

      // Calculate summary from analytics
      const totalRevenue = analytics.reduce((sum, a) => sum + Number(a.total_revenue), 0);
      const totalTransactions = analytics.reduce((sum, a) => sum + a.total_transactions, 0);
      const totalCompleted = analytics.reduce((sum, a) => sum + Math.round(a.success_rate * a.total_transactions / 100), 0);
      const successRate = totalTransactions > 0 ? (totalCompleted / totalTransactions) * 100 : 0;

      // Get gateway breakdown
      const gatewayBreakdown = {};
      analytics.forEach(a => {
        if (a.gateway_breakdown) {
          Object.entries(a.gateway_breakdown).forEach(([gateway, data]) => {
            if (!gatewayBreakdown[gateway]) {
              gatewayBreakdown[gateway] = { revenue: 0, transactions: 0 };
            }
            gatewayBreakdown[gateway].revenue += data.revenue || 0;
            gatewayBreakdown[gateway].transactions += data.transactions || 0;
          });
        }
      });

      // Get method breakdown
      const methodBreakdown = {};
      analytics.forEach(a => {
        if (a.method_breakdown) {
          Object.entries(a.method_breakdown).forEach(([method, data]) => {
            if (!methodBreakdown[method]) {
              methodBreakdown[method] = { revenue: 0, transactions: 0 };
            }
            methodBreakdown[method].revenue += data.revenue || 0;
            methodBreakdown[method].transactions += data.transactions || 0;
          });
        }
      });

      // Get daily/hourly breakdown if groupBy specified
      let breakdown = null;
      if (groupBy) {
        breakdown = await this.getPaymentBreakdown({ gte: parsedStartDate, lte: parsedEndDate }, gateway, groupBy);
      }

      return res.status(200).json({
        success: true,
        data: {
          totalRevenue,
          totalTransactions,
          successRate: parseFloat(successRate.toFixed(2)),
          statusBreakdown: analytics.map(a => ({
            period: a.period,
            totalRevenue: Number(a.total_revenue),
            totalTransactions: a.total_transactions,
            successRate: Number(a.success_rate),
            failedTransactions: a.failed_transactions,
            refundedAmount: Number(a.refunded_amount)
          })),
          gatewayStats: Object.entries(gatewayBreakdown).map(([gateway, data]) => ({
            paymentMethod: gateway,
            totalAmount: data.revenue,
            transactionCount: data.transactions,
            successRate: data.transactions > 0 ? parseFloat(((data.revenue / data.transactions) / data.transactions * 100).toFixed(2)) : 0
          })),
          methodStats: Object.entries(methodBreakdown).map(([method, data]) => ({
            paymentMethod: method,
            totalAmount: data.revenue,
            transactionCount: data.transactions,
            successRate: data.transactions > 0 ? parseFloat(((data.revenue / data.transactions) / data.transactions * 100).toFixed(2)) : 0
          })),
          breakdown
        },
        message: 'Analytics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Payment analytics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve analytics'
      });
    }
  }

  /**
   * Get daily analytics (admin)
   * GET /api/v1/admin/payments/analytics/daily
   */
  async getDailyAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      this.logger.info('Daily analytics request', {
        startDate,
        endDate
      });

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      // Get daily analytics
      const analytics = await paymentAnalyticsService.getAnalyticsByDateRange(
        parsedStartDate,
        parsedEndDate,
        'daily'
      );

      return res.status(200).json({
        success: true,
        data: analytics,
        message: 'Daily analytics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Daily analytics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve daily analytics'
      });
    }
  }

  /**
   * Get monthly analytics (admin)
   * GET /api/v1/admin/payments/analytics/monthly
   */
  async getMonthlyAnalytics(req, res) {
    try {
      const { year, month } = req.query;

      this.logger.info('Monthly analytics request', {
        year,
        month
      });

      // Validate parameters
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : currentYear;
      const targetMonth = month ? parseInt(month) : currentMonth;

      // Get monthly analytics
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      const analytics = await paymentAnalyticsService.getAnalyticsByDateRange(
        startDate,
        endDate,
        'monthly'
      );

      return res.status(200).json({
        success: true,
        data: analytics,
        message: 'Monthly analytics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Monthly analytics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve monthly analytics'
      });
    }
  }

  /**
   * Get gateway-specific analytics (admin)
   * GET /api/v1/admin/payments/analytics/gateway
   */
  async getGatewayAnalytics(req, res) {
    try {
      const { gateway, startDate, endDate } = req.query;

      this.logger.info('Gateway analytics request', {
        gateway,
        startDate,
        endDate
      });

      // Validate parameters
      if (!gateway) {
        return res.status(400).json({
          success: false,
          error: 'Gateway parameter is required',
          message: 'Gateway parameter is required'
        });
      }

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      // Get gateway analytics
      const analytics = await paymentAnalyticsService.getGatewayAnalytics(
        gateway,
        parsedStartDate,
        parsedEndDate
      );

      return res.status(200).json({
        success: true,
        data: analytics,
        message: 'Gateway analytics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Gateway analytics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve gateway analytics'
      });
    }
  }

  /**
   * Get payment method analytics (admin)
   * GET /api/v1/admin/payments/analytics/method
   */
  async getMethodAnalytics(req, res) {
    try {
      const { method, startDate, endDate } = req.query;

      this.logger.info('Payment method analytics request', {
        method,
        startDate,
        endDate
      });

      // Validate parameters
      if (!method) {
        return res.status(400).json({
          success: false,
          error: 'Method parameter is required',
          message: 'Method parameter is required'
        });
      }

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      // Get method analytics
      const analytics = await paymentAnalyticsService.getMethodAnalytics(
        method,
        parsedStartDate,
        parsedEndDate
      );

      return res.status(200).json({
        success: true,
        data: analytics,
        message: 'Payment method analytics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Payment method analytics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve payment method analytics'
      });
    }
  }

  /**
   * Get payment conversion rate (admin)
   * GET /api/v1/admin/payments/analytics/conversion
   */
  async getConversionRate(req, res) {
    try {
      const { startDate, endDate } = req.query;

      this.logger.info('Conversion rate request', {
        startDate,
        endDate
      });

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      // Get conversion rate
      const analytics = await paymentAnalyticsService.getConversionRate(
        parsedStartDate,
        parsedEndDate
      );

      return res.status(200).json({
        success: true,
        data: analytics,
        message: 'Conversion rate retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Conversion rate error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve conversion rate'
      });
    }
  }

  /**
   * Get payment failure analysis (admin)
   * GET /api/v1/admin/payments/analytics/failures
   */
  async getFailureAnalysis(req, res) {
    try {
      const { startDate, endDate } = req.query;

      this.logger.info('Failure analysis request', {
        startDate,
        endDate
      });

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      // Get failure analysis
      const analytics = await paymentAnalyticsService.getFailureAnalysis(
        parsedStartDate,
        parsedEndDate
      );

      return res.status(200).json({
        success: true,
        data: analytics,
        message: 'Failure analysis retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Failure analysis error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve failure analysis'
      });
    }
  }

  /**
   * Get revenue tracking (admin)
   * GET /api/v1/admin/payments/analytics/revenue
   */
  async getRevenueTracking(req, res) {
    try {
      const { startDate, endDate } = req.query;

      this.logger.info('Revenue tracking request', {
        startDate,
        endDate
      });

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      // Get revenue tracking
      const analytics = await paymentAnalyticsService.getRevenueTracking(
        parsedStartDate,
        parsedEndDate
      );

      return res.status(200).json({
        success: true,
        data: analytics,
        message: 'Revenue tracking retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Revenue tracking error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve revenue tracking'
      });
    }
  }

  /**
   * Get payment performance metrics (admin)
   * GET /api/v1/admin/payments/analytics/performance
   */
  async getPerformanceMetrics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      this.logger.info('Performance metrics request', {
        startDate,
        endDate
      });

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      // Get performance metrics
      const analytics = await paymentAnalyticsService.getPerformanceMetrics(
        parsedStartDate,
        parsedEndDate
      );

      return res.status(200).json({
        success: true,
        data: analytics,
        message: 'Performance metrics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Performance metrics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve performance metrics'
      });
    }
  }

  /**
   * Get KPI metrics (admin)
   * GET /api/v1/admin/payments/metrics
   */
  async getMetrics(req, res) {
    try {
      const { metricName, period, startDate, endDate, gateway, paymentMethod } = req.query;

      this.logger.info('Metrics request', {
        metricName,
        period,
        startDate,
        endDate,
        gateway,
        paymentMethod
      });

      // Parse date parameters
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      // Get metrics
      const metrics = await paymentMetricsService.getMetrics(
        metricName,
        period || 'daily',
        parsedStartDate,
        parsedEndDate,
        gateway,
        paymentMethod
      );

      return res.status(200).json({
        success: true,
        data: metrics,
        message: 'Metrics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Metrics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve metrics'
      });
    }
  }

  /**
   * Get payment breakdown by time period
   */
  async getPaymentBreakdown(dateFilter, gateway, groupBy) {
    // This is a simplified implementation
    // In production, you might want to use raw SQL queries for better performance
    const payments = await this.prisma.payment_transaction.findMany({
      where: {
        status: 'completed',
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
        ...(gateway ? { paymentMethod: this.getPaymentMethodForGateway(gateway) } : {})
      },
      select: {
        amount: true,
        createdAt: true,
        paymentMethod: true
      }
    });

    // Group by time period
    const breakdown = {};
    payments.forEach(payment => {
      let key;
      const date = new Date(payment.createdAt);

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = date.toISOString().substring(0, 7);
      }

      if (!breakdown[key]) {
        breakdown[key] = {
          date: key,
          totalAmount: 0,
          transactionCount: 0
        };
      }

      breakdown[key].totalAmount += payment.amount;
      breakdown[key].transactionCount += 1;
    });

    return Object.values(breakdown).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get payment method for gateway
   */
  getPaymentMethodForGateway(gateway) {
    const gatewayMap = {
      'sslcommerz': 'CREDIT_CARD',
      'bkash': 'BKASH',
      'nagad': 'NAGAD'
    };
    return gatewayMap[gateway];
  }

  /**
   * Get all gateway settings (admin)
   * GET /api/v1/admin/gateways
   */
  async getGatewaySettings(req, res) {
    try {
      this.logger.info('Gateway settings request');

      const gateways = await this.prisma.payment_gateway_settings.findMany({
        orderBy: { gateway: 'asc' }
      });

      return res.status(200).json({
        success: true,
        data: gateways,
        message: 'Gateway settings retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Gateway settings error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve gateway settings'
      });
    }
  }

  /**
   * Update gateway settings (admin)
   * PUT /api/v1/admin/gateways/:gateway
   */
  async updateGatewaySettings(req, res) {
    try {
      const { gateway } = req.params;
      const { isActive, isTestMode, config, webhookUrl } = req.body;
      const adminId = req.user?.id;

      this.logger.info('Gateway settings update request', {
        gateway,
        isActive,
        isTestMode,
        webhookUrl,
        adminId
      });

      // Prepare update data
      const updateData = {};
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }
      if (isTestMode !== undefined) {
        updateData.isTestMode = isTestMode;
      }
      if (config) {
        updateData.config = config;
      }
      // Handle webhookUrl - extract from request body and add to update data
      if (webhookUrl !== undefined) {
        updateData.webhookUrl = webhookUrl;
      }

      // Update gateway settings
      const updatedSettings = await this.prisma.payment_gateway_settings.update({
        where: { gateway },
        data: updateData
      });

      this.logger.info('Gateway settings updated successfully', {
        gateway,
        updatedBy: adminId
      });

      return res.status(200).json({
        success: true,
        data: updatedSettings,
        message: 'Gateway settings updated successfully'
      });

    } catch (error) {
      this.logger.error('Gateway settings update error', {
        error: error.message,
        stack: error.stack,
        gateway: req.params.gateway
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update gateway settings'
      });
    }
  }

  /**
   * Get payment logs (admin)
   * GET /api/v1/admin/payments/logs
   */
  async getPaymentLogs(req, res) {
    try {
      const {
        transactionId,
        orderId,
        eventType,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = req.query;

      this.logger.info('Payment logs request', {
        transactionId,
        orderId,
        eventType,
        startDate,
        endDate,
        page,
        limit
      });

      // Build where clause
      const where = {};

      if (transactionId) {
        where.transactionId = transactionId;
      }

      if (orderId) {
        where.orderId = orderId;
      }

      if (eventType) {
        where.eventType = eventType;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      // Get total count
      const total = await this.prisma.payment_log.count({ where });

      // Get logs with pagination
      const logs = await this.prisma.payment_log.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      });

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        message: 'Payment logs retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Payment logs error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve payment logs'
      });
    }
  }

  // ==================== SECURITY ENDPOINTS ====================

  /**
   * Get all fraud detection records (admin)
   * GET /api/v1/admin/payments/fraud-detection
   */
  async getFraudDetection(req, res) {
    try {
      const {
        riskLevel,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      this.logger.info('Fraud detection list request', {
        riskLevel,
        startDate,
        endDate,
        page,
        limit
      });

      const { fraudDetectionService } = require('../dist/src/services/payment/fraud-detection.service');

      // Build where clause
      const where = {};

      if (riskLevel) {
        where.risk_level = riskLevel;
      }

      if (startDate || endDate) {
        where.detected_at = {};
        if (startDate) {
          where.detected_at.gte = new Date(startDate);
        }
        if (endDate) {
          where.detected_at.lte = new Date(endDate);
        }
      }

      // Get total count
      const total = await this.prisma.fraud_detection.count({ where });

      // Get fraud detection records with pagination
      const fraudDetections = await this.prisma.fraud_detection.findMany({
        where,
        orderBy: { detected_at: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      });

      return res.status(200).json({
        success: true,
        data: fraudDetections,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        message: 'Fraud detection records retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Fraud detection list error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve fraud detection records'
      });
    }
  }

  /**
   * Get fraud detection by ID (admin)
   * GET /api/v1/admin/payments/fraud-detection/:id
   */
  async getFraudDetectionById(req, res) {
    try {
      const { id } = req.params;

      this.logger.info('Fraud detection details request', { id });

      const fraudDetection = await this.prisma.fraud_detection.findUnique({
        where: { id }
      });

      if (!fraudDetection) {
        return res.status(404).json({
          success: false,
          error: 'Fraud detection not found',
          message: 'The specified fraud detection record does not exist'
        });
      }

      return res.status(200).json({
        success: true,
        data: fraudDetection,
        message: 'Fraud detection retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Fraud detection details error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve fraud detection'
      });
    }
  }

  /**
   * Create new fraud rule (admin)
   * POST /api/v1/admin/payments/fraud-detection/rules
   */
  async createFraudRule(req, res) {
    try {
      const { name, description, ruleType, priority, weight, isActive, conditions, actions } = req.body;
      const adminId = req.user?.id;

      this.logger.info('Create fraud rule request', {
        name,
        ruleType,
        priority,
        adminId
      });

      const { fraudDetectionRulesService } = require('../dist/src/services/payment/fraud-detection-rules.service');

      const fraudRule = await fraudDetectionRulesService.createFraudRule({
        name,
        description,
        ruleType,
        priority,
        weight,
        isActive,
        conditions,
        actions
      });

      return res.status(201).json({
        success: true,
        data: fraudRule,
        message: 'Fraud rule created successfully'
      });

    } catch (error) {
      this.logger.error('Create fraud rule error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create fraud rule'
      });
    }
  }

  /**
   * Update fraud rule (admin)
   * PUT /api/v1/admin/payments/fraud-detection/rules/:id
   */
  async updateFraudRule(req, res) {
    try {
      const { id } = req.params;
      const { name, description, ruleType, priority, weight, isActive, conditions, actions } = req.body;
      const adminId = req.user?.id;

      this.logger.info('Update fraud rule request', {
        id,
        name,
        ruleType,
        adminId
      });

      const { fraudDetectionRulesService } = require('../dist/src/services/payment/fraud-detection-rules.service');

      const fraudRule = await fraudDetectionRulesService.updateFraudRule(id, {
        name,
        description,
        ruleType,
        priority,
        weight,
        isActive,
        conditions,
        actions
      });

      return res.status(200).json({
        success: true,
        data: fraudRule,
        message: 'Fraud rule updated successfully'
      });

    } catch (error) {
      this.logger.error('Update fraud rule error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update fraud rule'
      });
    }
  }

  /**
   * Delete fraud rule (admin)
   * DELETE /api/v1/admin/payments/fraud-detection/rules/:id
   */
  async deleteFraudRule(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      this.logger.info('Delete fraud rule request', { id, adminId });

      const { fraudDetectionRulesService } = require('../dist/src/services/payment/fraud-detection-rules.service');

      await fraudDetectionRulesService.deleteFraudRule(id);

      return res.status(200).json({
        success: true,
        message: 'Fraud rule deleted successfully'
      });

    } catch (error) {
      this.logger.error('Delete fraud rule error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete fraud rule'
      });
    }
  }

  /**
   * Activate fraud rule (admin)
   * POST /api/v1/admin/payments/fraud-detection/rules/:id/activate
   */
  async activateFraudRule(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      this.logger.info('Activate fraud rule request', { id, adminId });

      const { fraudDetectionRulesService } = require('../dist/src/services/payment/fraud-detection-rules.service');

      const fraudRule = await fraudDetectionRulesService.activateFraudRule(id);

      return res.status(200).json({
        success: true,
        data: fraudRule,
        message: 'Fraud rule activated successfully'
      });

    } catch (error) {
      this.logger.error('Activate fraud rule error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to activate fraud rule'
      });
    }
  }

  /**
   * Deactivate fraud rule (admin)
   * POST /api/v1/admin/payments/fraud-detection/rules/:id/deactivate
   */
  async deactivateFraudRule(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      this.logger.info('Deactivate fraud rule request', { id, adminId });

      const { fraudDetectionRulesService } = require('../dist/src/services/payment/fraud-detection-rules.service');

      const fraudRule = await fraudDetectionRulesService.deactivateFraudRule(id);

      return res.status(200).json({
        success: true,
        data: fraudRule,
        message: 'Fraud rule deactivated successfully'
      });

    } catch (error) {
      this.logger.error('Deactivate fraud rule error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to deactivate fraud rule'
      });
    }
  }

  /**
   * Get security audit logs (admin)
   * GET /api/v1/admin/payments/security-audit
   */
  async getSecurityAuditLogs(req, res) {
    try {
      const {
        eventType,
        severity,
        startDate,
        endDate,
        affectedUserId,
        affectedTransactionId,
        ipAddress,
        isResolved,
        page = 1,
        limit = 20
      } = req.query;

      this.logger.info('Security audit logs request', {
        eventType,
        severity,
        startDate,
        endDate,
        page,
        limit
      });

      const { securityAuditService } = require('../dist/src/services/payment/security-audit.service');

      const auditLogs = await securityAuditService.getSecurityAuditLogs({
        eventType,
        severity,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        affectedUserId,
        affectedTransactionId,
        ipAddress,
        isResolved: isResolved !== undefined ? isResolved === 'true' : undefined,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      return res.status(200).json({
        success: true,
        data: auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        },
        message: 'Security audit logs retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Security audit logs error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve security audit logs'
      });
    }
  }

  /**
   * Get security audit by ID (admin)
   * GET /api/v1/admin/payments/security-audit/:id
   */
  async getSecurityAuditById(req, res) {
    try {
      const { id } = req.params;

      this.logger.info('Security audit details request', { id });

      const { securityAuditService } = require('../dist/src/services/payment/security-audit.service');

      const audit = await securityAuditService.getSecurityAuditById(id);

      return res.status(200).json({
        success: true,
        data: audit,
        message: 'Security audit retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Security audit details error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve security audit'
      });
    }
  }

  /**
   * Resolve security event (admin)
   * PUT /api/v1/admin/payments/security-audit/:id/resolve
   */
  async resolveSecurityEvent(req, res) {
    try {
      const { id } = req.params;
      const { resolutionNotes } = req.body;
      const resolvedBy = req.user?.id;

      this.logger.info('Resolve security event request', {
        id,
        resolutionNotes,
        resolvedBy
      });

      const { securityAuditService } = require('../dist/src/services/payment/security-audit.service');

      const audit = await securityAuditService.resolveSecurityEvent(id, resolutionNotes, resolvedBy);

      return res.status(200).json({
        success: true,
        data: audit,
        message: 'Security event resolved successfully'
      });

    } catch (error) {
      this.logger.error('Resolve security event error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to resolve security event'
      });
    }
  }

  /**
   * Get security statistics (admin)
   * GET /api/v1/admin/payments/security-audit/statistics
   */
  async getSecurityStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      this.logger.info('Security statistics request', {
        startDate,
        endDate
      });

      const { securityAuditService } = require('../dist/src/services/payment/security-audit.service');

      const stats = await securityAuditService.getSecurityStatistics(
        startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate ? new Date(endDate) : new Date()
      );

      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Security statistics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Security statistics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve security statistics'
      });
    }
  }

  /**
   * Get critical security events (admin)
   * GET /api/v1/admin/payments/security-audit/critical
   */
  async getCriticalSecurityEvents(req, res) {
    try {
      const { startDate, endDate } = req.query;

      this.logger.info('Critical security events request', {
        startDate,
        endDate
      });

      const { securityAuditService } = require('../dist/src/services/payment/security-audit.service');

      const events = await securityAuditService.getCriticalSecurityEvents(
        startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate ? new Date(endDate) : new Date()
      );

      return res.status(200).json({
        success: true,
        data: events,
        message: 'Critical security events retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Critical security events error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve critical security events'
      });
    }
  }

  /**
   * Get security trends (admin)
   * GET /api/v1/admin/payments/security-audit/trends
   */
  async getSecurityTrends(req, res) {
    try {
      const { period = 'daily' } = req.query;

      this.logger.info('Security trends request', { period });

      const { securityAuditService } = require('../dist/src/services/payment/security-audit.service');

      const trends = await securityAuditService.getSecurityTrends(period);

      return res.status(200).json({
        success: true,
        data: trends,
        message: 'Security trends retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Security trends error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve security trends'
      });
    }
  }

  /**
   * Evaluate fraud rules for a transaction (admin)
   * GET /api/v1/admin/payments/fraud-detection/evaluate
   */
  async evaluateFraudRules(req, res) {
    try {
      const { transactionId } = req.query;

      this.logger.info('Evaluate fraud rules request', { transactionId });

      const { fraudDetectionRulesService } = require('../dist/src/services/payment/fraud-detection-rules.service');

      // Get transaction
      const transaction = await this.prisma.payment_transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
          message: 'The specified transaction does not exist'
        });
      }

      const evaluation = await fraudDetectionRulesService.evaluateFraudRules(transaction);

      return res.status(200).json({
        success: true,
        data: evaluation,
        message: 'Fraud rules evaluated successfully'
      });

    } catch (error) {
      this.logger.error('Evaluate fraud rules error', {
        error: error.message,
        stack: error.stack,
        transactionId: req.query.transactionId
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to evaluate fraud rules'
      });
    }
  }

  /**
   * Resolve fraud detection (admin)
   * POST /api/v1/admin/payments/fraud-detection/:id/resolve
   */
  async resolveFraudDetection(req, res) {
    try {
      const { id } = req.params;
      const { resolutionNotes } = req.body;
      const resolvedBy = req.user?.id;

      this.logger.info('Resolve fraud detection request', {
        id,
        resolutionNotes,
        resolvedBy
      });

      // Update fraud detection
      const fraudDetection = await this.prisma.fraud_detection.update({
        where: { id },
        data: {
          resolved_at: new Date(),
          resolved_by: resolvedBy,
          detection_rules: {
            resolutionNotes,
            resolvedAt: new Date().toISOString()
          }
        }
      });

      return res.status(200).json({
        success: true,
        data: fraudDetection,
        message: 'Fraud detection resolved successfully'
      });

    } catch (error) {
      this.logger.error('Resolve fraud detection error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to resolve fraud detection'
      });
    }
  }

  // ==================== PAYMENT OPTIMIZATION ENDPOINTS ====================

  /**
   * Get payment queue status (admin)
   * GET /api/v1/admin/payments/queue/status
   */
  async getQueueStatus(req, res) {
    try {
      this.logger.info('Queue status request');

      const { paymentQueueService } = require('../dist/src/services/payment/payment-queue.service');

      const status = await paymentQueueService.getQueueStatus();

      return res.status(200).json({
        success: true,
        data: status,
        message: 'Queue status retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Queue status error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve queue status'
      });
    }
  }

  /**
   * Get queue items with filters (admin)
   * GET /api/v1/admin/payments/queue/items
   */
  async getQueueItems(req, res) {
    try {
      const {
        status,
        priority,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      this.logger.info('Queue items request', {
        status,
        priority,
        startDate,
        endDate,
        page,
        limit
      });

      const { paymentQueueService } = require('../dist/src/services/payment/payment-queue.service');

      const filters = {
        status,
        priority: priority ? parseInt(priority) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      const items = await paymentQueueService.getQueueItems(filters);

      return res.status(200).json({
        success: true,
        data: items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        },
        message: 'Queue items retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Queue items error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve queue items'
      });
    }
  }

  /**
   * Retry a queued payment (admin)
   * POST /api/v1/admin/payments/queue/:id/retry
   */
  async retryQueuePayment(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      this.logger.info('Retry queue payment request', { id, adminId });

      const { paymentQueueService } = require('../dist/src/services/payment/payment-queue.service');

      const item = await paymentQueueService.retryPayment(id);

      return res.status(200).json({
        success: true,
        data: item,
        message: 'Queue payment retry initiated successfully'
      });

    } catch (error) {
      this.logger.error('Retry queue payment error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retry queue payment'
      });
    }
  }

  /**
   * Cancel a queued payment (admin)
   * POST /api/v1/admin/payments/queue/:id/cancel
   */
  async cancelQueuePayment(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;

      this.logger.info('Cancel queue payment request', { id, adminId });

      const { paymentQueueService } = require('../dist/src/services/payment/payment-queue.service');

      const item = await paymentQueueService.cancelPayment(id);

      return res.status(200).json({
        success: true,
        data: item,
        message: 'Queue payment cancelled successfully'
      });

    } catch (error) {
      this.logger.error('Cancel queue payment error', {
        error: error.message,
        stack: error.stack,
        id: req.params.id
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to cancel queue payment'
      });
    }
  }

  /**
   * Manually trigger queue processing (admin)
   * POST /api/v1/admin/payments/queue/process
   */
  async processQueue(req, res) {
    try {
      const adminId = req.user?.id;

      this.logger.info('Process queue request', { adminId });

      const { paymentQueueService } = require('../dist/src/services/payment/payment-queue.service');

      await paymentQueueService.processQueue();

      return res.status(200).json({
        success: true,
        message: 'Queue processing triggered successfully'
      });

    } catch (error) {
      this.logger.error('Process queue error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process queue'
      });
    }
  }

  /**
   * Get queue statistics (admin)
   * GET /api/v1/admin/payments/queue/statistics
   */
  async getQueueStatistics(req, res) {
    try {
      this.logger.info('Queue statistics request');

      const { paymentQueueService } = require('../dist/src/services/payment/payment-queue.service');

      const statistics = await paymentQueueService.getQueueStatistics();

      return res.status(200).json({
        success: true,
        data: statistics,
        message: 'Queue statistics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Queue statistics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve queue statistics'
      });
    }
  }

  /**
   * Retry a failed payment (admin)
   * POST /api/v1/admin/payments/retry/:transactionId
   */
  async retryPayment(req, res) {
    try {
      const { transactionId } = req.params;
      const { maxAttempts, baseDelay } = req.body;
      const adminId = req.user?.id;

      this.logger.info('Retry payment request', {
        transactionId,
        maxAttempts,
        baseDelay,
        adminId
      });

      const { paymentRetryService } = require('../dist/src/services/payment/payment-retry.service');

      const options = {
        maxAttempts: maxAttempts ? parseInt(maxAttempts) : undefined,
        baseDelay: baseDelay ? parseInt(baseDelay) : undefined
      };

      const result = await paymentRetryService.retryPayment(transactionId, options);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Payment retry initiated successfully'
      });

    } catch (error) {
      this.logger.error('Retry payment error', {
        error: error.message,
        stack: error.stack,
        transactionId: req.params.transactionId
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retry payment'
      });
    }
  }

  /**
   * Get retry history for a transaction (admin)
   * GET /api/v1/admin/payments/retry/history/:transactionId
   */
  async getRetryHistory(req, res) {
    try {
      const { transactionId } = req.params;

      this.logger.info('Retry history request', { transactionId });

      const { paymentRetryService } = require('../dist/src/services/payment/payment-retry.service');

      const history = await paymentRetryService.getRetryHistory(transactionId);

      return res.status(200).json({
        success: true,
        data: history,
        message: 'Retry history retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Retry history error', {
        error: error.message,
        stack: error.stack,
        transactionId: req.params.transactionId
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve retry history'
      });
    }
  }

  /**
   * Get retry statistics (admin)
   * GET /api/v1/admin/payments/retry/statistics
   */
  async getRetryStatistics(req, res) {
    try {
      this.logger.info('Retry statistics request');

      const { paymentRetryService } = require('../dist/src/services/payment/payment-retry.service');

      const statistics = await paymentRetryService.getRetryStatistics();

      return res.status(200).json({
        success: true,
        data: statistics,
        message: 'Retry statistics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Retry statistics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve retry statistics'
      });
    }
  }

  /**
   * Get retry rules (admin)
   * GET /api/v1/admin/payments/retry/rules
   */
  async getRetryRules(req, res) {
    try {
      this.logger.info('Retry rules request');

      const { paymentRetryService } = require('../dist/src/services/payment/payment-retry.service');

      const rules = await paymentRetryService.getRetryRules();

      return res.status(200).json({
        success: true,
        data: rules,
        message: 'Retry rules retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Retry rules error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve retry rules'
      });
    }
  }

  /**
   * Configure retry rules (admin)
   * PUT /api/v1/admin/payments/retry/rules
   */
  async configureRetryRules(req, res) {
    try {
      const { rules } = req.body;
      const adminId = req.user?.id;

      this.logger.info('Configure retry rules request', { rules, adminId });

      const { paymentRetryService } = require('../dist/src/services/payment/payment-retry.service');

      await paymentRetryService.configureRetryRules(rules);

      return res.status(200).json({
        success: true,
        message: 'Retry rules configured successfully'
      });

    } catch (error) {
      this.logger.error('Configure retry rules error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to configure retry rules'
      });
    }
  }

  /**
   * Cancel retry for a transaction (admin)
   * POST /api/v1/admin/payments/retry/:transactionId/cancel
   */
  async cancelRetry(req, res) {
    try {
      const { transactionId } = req.params;
      const adminId = req.user?.id;

      this.logger.info('Cancel retry request', { transactionId, adminId });

      const { paymentRetryService } = require('../dist/src/services/payment/payment-retry.service');

      await paymentRetryService.cancelRetry(transactionId);

      return res.status(200).json({
        success: true,
        message: 'Retry cancelled successfully'
      });

    } catch (error) {
      this.logger.error('Cancel retry error', {
        error: error.message,
        stack: error.stack,
        transactionId: req.params.transactionId
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to cancel retry'
      });
    }
  }

  /**
   * Get cache statistics (admin)
   * GET /api/v1/admin/payments/cache/statistics
   */
  async getCacheStatistics(req, res) {
    try {
      this.logger.info('Cache statistics request');

      const { paymentCacheService } = require('../dist/src/services/payment/payment-cache.service');

      const statistics = await paymentCacheService.getCacheStatistics();

      return res.status(200).json({
        success: true,
        data: statistics,
        message: 'Cache statistics retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Cache statistics error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve cache statistics'
      });
    }
  }

  /**
   * Invalidate cache entry (admin)
   * DELETE /api/v1/admin/payments/cache/:cacheKey
   */
  async invalidateCache(req, res) {
    try {
      const { cacheKey } = req.params;
      const adminId = req.user?.id;

      this.logger.info('Invalidate cache request', { cacheKey, adminId });

      const { paymentCacheService } = require('../dist/src/services/payment/payment-cache.service');

      await paymentCacheService.invalidateCache(cacheKey);

      return res.status(200).json({
        success: true,
        message: 'Cache entry invalidated successfully'
      });

    } catch (error) {
      this.logger.error('Invalidate cache error', {
        error: error.message,
        stack: error.stack,
        cacheKey: req.params.cacheKey
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to invalidate cache entry'
      });
    }
  }

  /**
   * Invalidate cache entries by pattern (admin)
   * DELETE /api/v1/admin/payments/cache/pattern/:pattern
   */
  async invalidateCacheByPattern(req, res) {
    try {
      const { pattern } = req.params;
      const adminId = req.user?.id;

      this.logger.info('Invalidate cache by pattern request', { pattern, adminId });

      const { paymentCacheService } = require('../dist/src/services/payment/payment-cache.service');

      const count = await paymentCacheService.invalidateCacheByPattern(pattern);

      return res.status(200).json({
        success: true,
        count,
        message: `${count} cache entries invalidated successfully`
      });

    } catch (error) {
      this.logger.error('Invalidate cache by pattern error', {
        error: error.message,
        stack: error.stack,
        pattern: req.params.pattern
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to invalidate cache entries'
      });
    }
  }

  /**
   * Clear expired cache entries (admin)
   * POST /api/v1/admin/payments/cache/clear-expired
   */
  async clearExpiredCache(req, res) {
    try {
      const adminId = req.user?.id;

      this.logger.info('Clear expired cache request', { adminId });

      const { paymentCacheService } = require('../dist/src/services/payment/payment-cache.service');

      const count = await paymentCacheService.clearExpiredCache();

      return res.status(200).json({
        success: true,
        count,
        message: `${count} expired cache entries cleared successfully`
      });

    } catch (error) {
      this.logger.error('Clear expired cache error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to clear expired cache entries'
      });
    }
  }

  /**
   * Warm cache with frequently accessed data (admin)
   * POST /api/v1/admin/payments/cache/warm
   */
  async warmCache(req, res) {
    try {
      const { keys } = req.body;
      const adminId = req.user?.id;

      this.logger.info('Warm cache request', { keys, adminId });

      const { paymentCacheService } = require('../dist/src/services/payment/payment-cache.service');

      await paymentCacheService.warmCache(keys);

      return res.status(200).json({
        success: true,
        message: 'Cache warmed successfully'
      });

    } catch (error) {
      this.logger.error('Warm cache error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to warm cache'
      });
    }
  }

  /**
   * Get gateway performance (admin)
   * GET /api/v1/admin/payments/performance/gateway/:gateway
   */
  async getGatewayPerformance(req, res) {
    try {
      const { gateway } = req.params;
      const { startDate, endDate } = req.query;

      this.logger.info('Gateway performance request', {
        gateway,
        startDate,
        endDate
      });

      const { paymentPerformanceService } = require('../dist/src/services/payment/payment-performance.service');

      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      const performance = await paymentPerformanceService.getGatewayPerformance(
        gateway,
        parsedStartDate,
        parsedEndDate
      );

      return res.status(200).json({
        success: true,
        data: performance,
        message: 'Gateway performance retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Gateway performance error', {
        error: error.message,
        stack: error.stack,
        gateway: req.params.gateway
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve gateway performance'
      });
    }
  }

  /**
   * Get slow payments (admin)
   * GET /api/v1/admin/payments/performance/slow
   */
  async getSlowPayments(req, res) {
    try {
      const { threshold, startDate, endDate } = req.query;

      this.logger.info('Slow payments request', {
        threshold,
        startDate,
        endDate
      });

      const { paymentPerformanceService } = require('../dist/src/services/payment/payment-performance.service');

      const parsedThreshold = threshold ? parseInt(threshold) : 2000; // Default 2 seconds
      const parsedStartDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const parsedEndDate = endDate ? new Date(endDate) : new Date();

      const slowPayments = await paymentPerformanceService.getSlowPayments(
        parsedThreshold,
        parsedStartDate,
        parsedEndDate
      );

      return res.status(200).json({
        success: true,
        data: slowPayments,
        message: 'Slow payments retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Slow payments error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve slow payments'
      });
    }
  }

  /**
   * Get average processing time (admin)
   * GET /api/v1/admin/payments/performance/average
   */
  async getAverageProcessingTime(req, res) {
    try {
      const { gateway } = req.query;

      this.logger.info('Average processing time request', { gateway });

      const { paymentPerformanceService } = require('../dist/src/services/payment/payment-performance.service');

      const averageTime = await paymentPerformanceService.getAverageProcessingTime(gateway);

      return res.status(200).json({
        success: true,
        data: {
          averageProcessingTime: averageTime,
          gateway: gateway || 'all'
        },
        message: 'Average processing time retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Average processing time error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve average processing time'
      });
    }
  }

  /**
   * Get performance percentile (admin)
   * GET /api/v1/admin/payments/performance/percentile
   */
  async getPerformancePercentile(req, res) {
    try {
      const { percentile, gateway } = req.query;

      this.logger.info('Performance percentile request', {
        percentile,
        gateway
      });

      const { paymentPerformanceService } = require('../dist/src/services/payment/payment-performance.service');

      const parsedPercentile = percentile ? parseInt(percentile) : 95; // Default P95

      const value = await paymentPerformanceService.getPerformancePercentile(
        parsedPercentile,
        gateway
      );

      return res.status(200).json({
        success: true,
        data: {
          percentile: `P${parsedPercentile}`,
          value,
          gateway: gateway || 'all'
        },
        message: 'Performance percentile retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Performance percentile error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve performance percentile'
      });
    }
  }

  /**
   * Get performance alerts (admin)
   * GET /api/v1/admin/payments/performance/alerts
   */
  async getPerformanceAlerts(req, res) {
    try {
      this.logger.info('Performance alerts request');

      const { paymentPerformanceService } = require('../dist/src/services/payment/payment-performance.service');

      const alerts = await paymentPerformanceService.getPerformanceAlerts();

      return res.status(200).json({
        success: true,
        data: alerts,
        message: 'Performance alerts retrieved successfully'
      });

    } catch (error) {
      this.logger.error('Performance alerts error', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve performance alerts'
      });
    }
  }
}

// Singleton instance
const paymentController = new PaymentController();

module.exports = {
  PaymentController,
  paymentController,
  initiatePayment: paymentController.initiatePayment.bind(paymentController),
  getPaymentStatus: paymentController.getPaymentStatus.bind(paymentController),
  handleSSLCommerzSuccess: paymentController.handleSSLCommerzSuccess.bind(paymentController),
  handleSSLCommerzFail: paymentController.handleSSLCommerzFail.bind(paymentController),
  handleSSLCommerzCancel: paymentController.handleSSLCommerzCancel.bind(paymentController),
  handleSSLCommerzIPN: paymentController.handleSSLCommerzIPN.bind(paymentController),
  createBkashPayment: paymentController.createBkashPayment.bind(paymentController),
  executeBkashPayment: paymentController.executeBkashPayment.bind(paymentController),
  handleBkashCallback: paymentController.handleBkashCallback.bind(paymentController),
  initializeNagadPayment: paymentController.initializeNagadPayment.bind(paymentController),
  verifyNagadPayment: paymentController.verifyNagadPayment.bind(paymentController),
  handleNagadCallback: paymentController.handleNagadCallback.bind(paymentController),
  requestRefund: paymentController.requestRefund.bind(paymentController),
  getAllPayments: paymentController.getAllPayments.bind(paymentController),
  getPaymentById: paymentController.getPaymentById.bind(paymentController),
  adminRefund: paymentController.adminRefund.bind(paymentController),
  getPaymentAnalytics: paymentController.getPaymentAnalytics.bind(paymentController),
  getDailyAnalytics: paymentController.getDailyAnalytics.bind(paymentController),
  getMonthlyAnalytics: paymentController.getMonthlyAnalytics.bind(paymentController),
  getGatewayAnalytics: paymentController.getGatewayAnalytics.bind(paymentController),
  getMethodAnalytics: paymentController.getMethodAnalytics.bind(paymentController),
  getConversionRate: paymentController.getConversionRate.bind(paymentController),
  getFailureAnalysis: paymentController.getFailureAnalysis.bind(paymentController),
  getRevenueTracking: paymentController.getRevenueTracking.bind(paymentController),
  getPerformanceMetrics: paymentController.getPerformanceMetrics.bind(paymentController),
  getMetrics: paymentController.getMetrics.bind(paymentController),
  getGatewaySettings: paymentController.getGatewaySettings.bind(paymentController),
  updateGatewaySettings: paymentController.updateGatewaySettings.bind(paymentController),
  getPaymentLogs: paymentController.getPaymentLogs.bind(paymentController),
  // Security endpoints
  getFraudDetection: paymentController.getFraudDetection.bind(paymentController),
  getFraudDetectionById: paymentController.getFraudDetectionById.bind(paymentController),
  createFraudRule: paymentController.createFraudRule.bind(paymentController),
  updateFraudRule: paymentController.updateFraudRule.bind(paymentController),
  deleteFraudRule: paymentController.deleteFraudRule.bind(paymentController),
  activateFraudRule: paymentController.activateFraudRule.bind(paymentController),
  deactivateFraudRule: paymentController.deactivateFraudRule.bind(paymentController),
  getSecurityAuditLogs: paymentController.getSecurityAuditLogs.bind(paymentController),
  getSecurityAuditById: paymentController.getSecurityAuditById.bind(paymentController),
  resolveSecurityEvent: paymentController.resolveSecurityEvent.bind(paymentController),
  getSecurityStatistics: paymentController.getSecurityStatistics.bind(paymentController),
  getCriticalSecurityEvents: paymentController.getCriticalSecurityEvents.bind(paymentController),
  getSecurityTrends: paymentController.getSecurityTrends.bind(paymentController),
  evaluateFraudRules: paymentController.evaluateFraudRules.bind(paymentController),
  resolveFraudDetection: paymentController.resolveFraudDetection.bind(paymentController),
  // Payment optimization endpoints
  getQueueStatus: paymentController.getQueueStatus.bind(paymentController),
  getQueueItems: paymentController.getQueueItems.bind(paymentController),
  retryQueuePayment: paymentController.retryQueuePayment.bind(paymentController),
  cancelQueuePayment: paymentController.cancelQueuePayment.bind(paymentController),
  processQueue: paymentController.processQueue.bind(paymentController),
  getQueueStatistics: paymentController.getQueueStatistics.bind(paymentController),
  retryPayment: paymentController.retryPayment.bind(paymentController),
  getRetryHistory: paymentController.getRetryHistory.bind(paymentController),
  getRetryStatistics: paymentController.getRetryStatistics.bind(paymentController),
  getRetryRules: paymentController.getRetryRules.bind(paymentController),
  configureRetryRules: paymentController.configureRetryRules.bind(paymentController),
  cancelRetry: paymentController.cancelRetry.bind(paymentController),
  getCacheStatistics: paymentController.getCacheStatistics.bind(paymentController),
  invalidateCache: paymentController.invalidateCache.bind(paymentController),
  invalidateCacheByPattern: paymentController.invalidateCacheByPattern.bind(paymentController),
  clearExpiredCache: paymentController.clearExpiredCache.bind(paymentController),
  warmCache: paymentController.warmCache.bind(paymentController),
  getGatewayPerformance: paymentController.getGatewayPerformance.bind(paymentController),
  getSlowPayments: paymentController.getSlowPayments.bind(paymentController),
  getAverageProcessingTime: paymentController.getAverageProcessingTime.bind(paymentController),
  getPerformancePercentile: paymentController.getPerformancePercentile.bind(paymentController),
  getPerformanceAlerts: paymentController.getPerformanceAlerts.bind(paymentController)
};
