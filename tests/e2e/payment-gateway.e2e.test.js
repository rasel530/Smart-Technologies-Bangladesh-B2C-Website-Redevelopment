/**
 * End-to-End Payment Gateway Tests
 * 
 * Comprehensive E2E tests for complete payment flows across all gateways
 * including SSLCommerz, bKash, and Nagad payment scenarios.
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const {
  createTestUser,
  createTestAdmin,
  createTestAddress,
  createTestOrderWithItems,
  setupPaymentGatewaySettings,
  mockSSLCommerzResponse,
  mockBkashResponse,
  mockNagadResponse,
  mockPaymentCallback,
  cleanupTestData
} = require('../setup/payment-test-data.test');

const prisma = new PrismaClient();

// Mock payment gateway services
jest.mock('../../backend/src/services/payment/sslcommerz.service');
jest.mock('../../backend/src/services/payment/bkash.service');
jest.mock('../../backend/src/services/payment/nagad.service');

const { SSLCommerzService } = require('../../backend/src/services/payment/sslcommerz.service');
const { BkashService } = require('../../backend/src/services/payment/bkash.service');
const { NagadService } = require('../../backend/src/services/payment/nagad.service');

const app = require('../../backend/app');

// Test configuration
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('End-to-End Payment Gateway Tests', () => {
  let testUser, testAdmin, testAddress, testOrder;
  let userToken, adminToken;

  beforeAll(async () => {
    // Setup test environment
    testUser = await createTestUser();
    testAdmin = await createTestAdmin();
    testAddress = await createTestAddress(testUser.id);
    testOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

    // Generate tokens
    userToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign(testAdmin, JWT_SECRET, { expiresIn: '1h' });

    // Setup payment gateway settings
    await setupPaymentGatewaySettings();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('Complete SSLCommerz Payment Flow', () => {
    let transactionId, paymentUrl;

    it('should complete full SSLCommerz payment flow', async () => {
      // Step 1: Initiate payment
      SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockSSLCommerzResponse(true)
      );

      const initiateResponse = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(initiateResponse.status).toBe(200);
      expect(initiateResponse.body.success).toBe(true);
      expect(initiateResponse.body.transactionId).toBeDefined();
      expect(initiateResponse.body.paymentUrl).toBeDefined();

      transactionId = initiateResponse.body.transactionId;
      paymentUrl = initiateResponse.body.paymentUrl;

      // Step 2: Verify transaction was created
      const transaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });

      expect(transaction).toBeDefined();
      expect(transaction.status).toBe('pending');
      expect(transaction.paymentMethod).toBe('CREDIT_CARD');

      // Step 3: Simulate user redirect to payment gateway
      expect(paymentUrl).toContain('sslcommerz');

      // Step 4: Handle success callback
      const callbackData = mockPaymentCallback('sslcommerz', 'success');
      callbackData.tran_id = transactionId;

      SSLCommerzService.prototype.handleCallback = jest.fn().mockResolvedValue({
        success: true,
        gatewayResponse: callbackData
      });

      const callbackResponse = await request(app)
        .post('/api/v1/payments/sslcommerz/success')
        .send(callbackData);

      expect(callbackResponse.status).toBe(302);
      expect(callbackResponse.headers.location).toContain('/payment/success');

      // Step 5: Verify payment status is completed
      const updatedTransaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });

      expect(updatedTransaction.status).toBe('completed');

      // Step 6: Verify order payment status
      const updatedOrder = await prisma.order.findUnique({
        where: { id: testOrder.id }
      });

      expect(updatedOrder.paymentStatus).toBe('paid');
    });

    it('should handle SSLCommerz payment failure', async () => {
      // Create a new order for failed payment test
      const failedOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      // Initiate payment
      SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockSSLCommerzResponse(true)
      );

      const initiateResponse = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: failedOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      const failedTransactionId = initiateResponse.body.transactionId;

      // Handle fail callback
      const callbackData = mockPaymentCallback('sslcommerz', 'fail');
      callbackData.tran_id = failedTransactionId;

      SSLCommerzService.prototype.handleCallback = jest.fn().mockResolvedValue({
        success: false,
        error: 'Payment declined'
      });

      const callbackResponse = await request(app)
        .post('/api/v1/payments/sslcommerz/fail')
        .send(callbackData);

      expect(callbackResponse.status).toBe(302);
      expect(callbackResponse.headers.location).toContain('/payment/failed');

      // Verify payment status is failed
      const failedTransaction = await prisma.payment_transaction.findUnique({
        where: { transactionId: failedTransactionId }
      });

      expect(failedTransaction.status).toBe('failed');
      expect(failedTransaction.failureReason).toBeDefined();
    });

    it('should handle SSLCommerz payment cancellation', async () => {
      // Create a new order for cancelled payment test
      const cancelledOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      // Initiate payment
      SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockSSLCommerzResponse(true)
      );

      const initiateResponse = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: cancelledOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      const cancelledTransactionId = initiateResponse.body.transactionId;

      // Handle cancel callback
      const callbackData = mockPaymentCallback('sslcommerz', 'cancel');
      callbackData.tran_id = cancelledTransactionId;

      const callbackResponse = await request(app)
        .post('/api/v1/payments/sslcommerz/cancel')
        .send(callbackData);

      expect(callbackResponse.status).toBe(302);
      expect(callbackResponse.headers.location).toContain('/payment/cancelled');

      // Verify payment status is cancelled
      const cancelledTransaction = await prisma.payment_transaction.findUnique({
        where: { transactionId: cancelledTransactionId }
      });

      expect(cancelledTransaction.status).toBe('cancelled');
    });
  });

  describe('Complete bKash Payment Flow', () => {
    let transactionId, paymentID;

    it('should complete full bKash payment flow', async () => {
      // Create a new order for bKash test
      const bkashOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      // Step 1: Create bKash payment
      BkashService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockBkashResponse(true)
      );

      const createResponse = await request(app)
        .post('/api/v1/payments/bkash/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: bkashOrder.id,
          amount: 1050.00,
          merchantInvoiceNumber: 'TEST-INV-001'
        });

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.transactionId).toBeDefined();
      expect(createResponse.body.paymentID).toBeDefined();
      expect(createResponse.body.bkashURL).toBeDefined();

      transactionId = createResponse.body.transactionId;
      paymentID = createResponse.body.paymentID;

      // Step 2: Verify transaction was created
      const transaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });

      expect(transaction).toBeDefined();
      expect(transaction.status).toBe('pending');
      expect(transaction.paymentMethod).toBe('BKASH');
      expect(transaction.paymentId).toBe(paymentID);

      // Step 3: Simulate user redirect to bKash gateway
      expect(createResponse.body.bkashURL).toContain('bka.sh');

      // Step 4: Execute payment
      BkashService.prototype.handleCallback = jest.fn().mockResolvedValue({
        success: true,
        gatewayResponse: { status: 'completed' }
      });

      const executeResponse = await request(app)
        .post('/api/v1/payments/bkash/execute')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentID
        });

      expect(executeResponse.status).toBe(200);
      expect(executeResponse.body.success).toBe(true);
      expect(executeResponse.body.status).toBe('completed');

      // Step 5: Verify payment status is completed
      const updatedTransaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });

      expect(updatedTransaction.status).toBe('completed');

      // Step 6: Verify order payment status
      const updatedOrder = await prisma.order.findUnique({
        where: { id: bkashOrder.id }
      });

      expect(updatedOrder.paymentStatus).toBe('paid');
    });

    it('should handle bKash payment failure', async () => {
      // Create a new order for failed bKash test
      const failedOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      // Create bKash payment
      BkashService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockBkashResponse(true)
      );

      const createResponse = await request(app)
        .post('/api/v1/payments/bkash/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: failedOrder.id,
          amount: 1050.00
        });

      const failedPaymentID = createResponse.body.paymentID;

      // Handle fail callback
      const callbackData = mockPaymentCallback('bkash', 'fail');
      callbackData.paymentID = failedPaymentID;

      BkashService.prototype.handleCallback = jest.fn().mockResolvedValue({
        success: false,
        error: 'Payment failed'
      });

      const callbackResponse = await request(app)
        .post('/api/v1/payments/bkash/callback')
        .send(callbackData);

      expect(callbackResponse.status).toBe(200);
      expect(callbackResponse.body.success).toBe(true);

      // Verify payment status is failed
      const failedTransaction = await prisma.payment_transaction.findFirst({
        where: { paymentId: failedPaymentID }
      });

      expect(failedTransaction.status).toBe('failed');
    });
  });

  describe('Complete Nagad Payment Flow', () => {
    let transactionId, paymentRefId;

    it('should complete full Nagad payment flow', async () => {
      // Create a new order for Nagad test
      const nagadOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      // Step 1: Initialize Nagad payment
      NagadService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockNagadResponse(true)
      );

      const initializeResponse = await request(app)
        .post('/api/v1/payments/nagad/initialize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: nagadOrder.id,
          amount: 1050.00
        });

      expect(initializeResponse.status).toBe(200);
      expect(initializeResponse.body.success).toBe(true);
      expect(initializeResponse.body.transactionId).toBeDefined();
      expect(initializeResponse.body.paymentRefId).toBeDefined();
      expect(initializeResponse.body.nagadURL).toBeDefined();

      transactionId = initializeResponse.body.transactionId;
      paymentRefId = initializeResponse.body.paymentRefId;

      // Step 2: Verify transaction was created
      const transaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });

      expect(transaction).toBeDefined();
      expect(transaction.status).toBe('pending');
      expect(transaction.paymentMethod).toBe('NAGAD');
      expect(transaction.gatewayTransactionId).toBe(paymentRefId);

      // Step 3: Simulate user redirect to Nagad gateway
      expect(initializeResponse.body.nagadURL).toContain('nagad');

      // Step 4: Verify payment
      NagadService.prototype.handleCallback = jest.fn().mockResolvedValue({
        success: true,
        gatewayResponse: { status: 'Success' }
      });

      const verifyResponse = await request(app)
        .post('/api/v1/payments/nagad/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentRefId
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.status).toBe('completed');

      // Step 5: Verify payment status is completed
      const updatedTransaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });

      expect(updatedTransaction.status).toBe('completed');

      // Step 6: Verify order payment status
      const updatedOrder = await prisma.order.findUnique({
        where: { id: nagadOrder.id }
      });

      expect(updatedOrder.paymentStatus).toBe('paid');
    });

    it('should handle Nagad payment failure', async () => {
      // Create a new order for failed Nagad test
      const failedOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      // Initialize Nagad payment
      NagadService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockNagadResponse(true)
      );

      const initializeResponse = await request(app)
        .post('/api/v1/payments/nagad/initialize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: failedOrder.id,
          amount: 1050.00
        });

      const failedPaymentRefId = initializeResponse.body.paymentRefId;

      // Handle fail callback
      const callbackData = mockPaymentCallback('nagad', 'fail');
      callbackData.payment_ref_id = failedPaymentRefId;

      NagadService.prototype.handleCallback = jest.fn().mockResolvedValue({
        success: false,
        error: 'Payment failed'
      });

      const callbackResponse = await request(app)
        .post('/api/v1/payments/nagad/callback')
        .send(callbackData);

      expect(callbackResponse.status).toBe(200);
      expect(callbackResponse.body.success).toBe(true);

      // Verify payment status is failed
      const failedTransaction = await prisma.payment_transaction.findFirst({
        where: { gatewayTransactionId: failedPaymentRefId }
      });

      expect(failedTransaction.status).toBe('failed');
    });
  });

  describe('Refund Flow', () => {
    let completedOrder, completedTransaction;

    beforeEach(async () => {
      // Create a completed payment for refund testing
      completedOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockSSLCommerzResponse(true)
      );

      const initiateResponse = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: completedOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      const transactionId = initiateResponse.body.transactionId;

      // Simulate successful payment
      const callbackData = mockPaymentCallback('sslcommerz', 'success');
      callbackData.tran_id = transactionId;

      SSLCommerzService.prototype.handleCallback = jest.fn().mockResolvedValue({
        success: true,
        gatewayResponse: callbackData
      });

      await request(app)
        .post('/api/v1/payments/sslcommerz/success')
        .send(callbackData);

      completedTransaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });
    });

    it('should complete full refund flow', async () => {
      // Step 1: Request refund
      SSLCommerzService.prototype.refundPayment = jest.fn().mockResolvedValue({
        success: true,
        refundId: 'REFUND-123',
        gatewayResponse: { status: 'refunded' }
      });

      const refundResponse = await request(app)
        .post(`/api/v1/payments/${completedTransaction.id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 1050.00,
          reason: 'Customer requested refund'
        });

      expect(refundResponse.status).toBe(200);
      expect(refundResponse.body.success).toBe(true);
      expect(refundResponse.body.refundId).toBeDefined();
      expect(refundResponse.body.amount).toBe(1050.00);

      // Step 2: Verify transaction status is refunded
      const refundedTransaction = await prisma.payment_transaction.findUnique({
        where: { id: completedTransaction.id }
      });

      expect(refundedTransaction.status).toBe('refunded');
      expect(refundedTransaction.refundAmount).toBe(1050.00);
      expect(refundedTransaction.refundedAt).toBeDefined();
    });

    it('should process partial refund', async () => {
      SSLCommerzService.prototype.refundPayment = jest.fn().mockResolvedValue({
        success: true,
        refundId: 'REFUND-456',
        gatewayResponse: { status: 'partially_refunded' }
      });

      const refundResponse = await request(app)
        .post(`/api/v1/payments/${completedTransaction.id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 500.00,
          reason: 'Partial refund for damaged item'
        });

      expect(refundResponse.status).toBe(200);
      expect(refundResponse.body.amount).toBe(500.00);
    });
  });

  describe('Admin Refund Processing', () => {
    let completedOrder, completedTransaction;

    beforeEach(async () => {
      // Create a completed payment for admin refund testing
      completedOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockSSLCommerzResponse(true)
      );

      const initiateResponse = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: completedOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      const transactionId = initiateResponse.body.transactionId;

      const callbackData = mockPaymentCallback('sslcommerz', 'success');
      callbackData.tran_id = transactionId;

      SSLCommerzService.prototype.handleCallback = jest.fn().mockResolvedValue({
        success: true,
        gatewayResponse: callbackData
      });

      await request(app)
        .post('/api/v1/payments/sslcommerz/success')
        .send(callbackData);

      completedTransaction = await prisma.payment_transaction.findUnique({
        where: { transactionId }
      });
    });

    it('should process admin-initiated refund', async () => {
      SSLCommerzService.prototype.refundPayment = jest.fn().mockResolvedValue({
        success: true,
        refundId: 'ADMIN-REFUND-123',
        gatewayResponse: { status: 'refunded' }
      });

      const refundResponse = await request(app)
        .put(`/api/v1/admin/payments/${completedTransaction.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1050.00,
          reason: 'Admin approved refund due to product defect'
        });

      expect(refundResponse.status).toBe(200);
      expect(refundResponse.body.success).toBe(true);
      expect(refundResponse.body.refundId).toBeDefined();
    });

    it('should log admin refund action', async () => {
      SSLCommerzService.prototype.refundPayment = jest.fn().mockResolvedValue({
        success: true,
        refundId: 'ADMIN-REFUND-456',
        gatewayResponse: { status: 'refunded' }
      });

      await request(app)
        .put(`/api/v1/admin/payments/${completedTransaction.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1050.00,
          reason: 'Admin approved refund'
        });

      // Verify payment log was created
      const paymentLogs = await prisma.payment_log.findMany({
        where: { transactionId: completedTransaction.id }
      });

      expect(paymentLogs.length).toBeGreaterThan(0);
      const refundLog = paymentLogs.find(log => log.eventType === 'REFUND');
      expect(refundLog).toBeDefined();
    });
  });

  describe('Cross-Gateway Payment Scenarios', () => {
    it('should handle multiple payment methods for same user', async () => {
      // Create orders for different payment methods
      const sslcommerzOrder = await createTestOrderWithItems(testUser.id, testAddress.id);
      const bkashOrder = await createTestOrderWithItems(testUser.id, testAddress.id);
      const nagadOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      // Initiate SSLCommerz payment
      SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockSSLCommerzResponse(true)
      );

      const sslResponse = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: sslcommerzOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(sslResponse.body.success).toBe(true);

      // Initiate bKash payment
      BkashService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockBkashResponse(true)
      );

      const bkashResponse = await request(app)
        .post('/api/v1/payments/bkash/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: bkashOrder.id,
          amount: 1050.00
        });

      expect(bkashResponse.body.success).toBe(true);

      // Initiate Nagad payment
      NagadService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockNagadResponse(true)
      );

      const nagadResponse = await request(app)
        .post('/api/v1/payments/nagad/initialize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: nagadOrder.id,
          amount: 1050.00
        });

      expect(nagadResponse.body.success).toBe(true);

      // Verify all transactions were created
      const transactions = await prisma.payment_transaction.findMany({
        where: { orderId: { in: [sslcommerzOrder.id, bkashOrder.id, nagadOrder.id] } }
      });

      expect(transactions.length).toBe(3);
      expect(transactions.some(t => t.paymentMethod === 'CREDIT_CARD')).toBe(true);
      expect(transactions.some(t => t.paymentMethod === 'BKASH')).toBe(true);
      expect(transactions.some(t => t.paymentMethod === 'NAGAD')).toBe(true);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should retry failed payment initiation', async () => {
      const retryOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      // First attempt fails
      SSLCommerzService.prototype.initiatePayment = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSSLCommerzResponse(true));

      const firstResponse = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: retryOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(firstResponse.status).toBe(500);

      // Retry should succeed
      const secondResponse = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: retryOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.success).toBe(true);
    });

    it('should handle callback timeout', async () => {
      const timeoutOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

      SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue(
        mockSSLCommerzResponse(true)
      );

      const initiateResponse = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: timeoutOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      const transactionId = initiateResponse.body.transactionId;

      // Simulate timeout - check status after delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const statusResponse = await request(app)
        .get(`/api/v1/payments/${timeoutOrder.id}/status`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.status).toBeDefined();
    });
  });
});
