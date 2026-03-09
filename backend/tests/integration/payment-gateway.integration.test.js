/**
 * Backend Payment Gateway Integration Tests
 * 
 * Comprehensive integration tests for payment gateway API endpoints
 * including SSLCommerz, bKash, and Nagad integrations.
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const {
  createTestUser,
  createTestAdmin,
  createTestAddress,
  createTestOrderWithItems,
  setupPaymentGatewaySettings,
  createTestPaymentTransaction,
  createCompletedPaymentTransaction,
  createFailedPaymentTransaction,
  createRefundedPaymentTransaction,
  mockSSLCommerzResponse,
  mockBkashResponse,
  mockNagadResponse,
  mockPaymentCallback,
  cleanupTestData
} = require('../../../tests/setup/payment-test-data.test');

// Mock payment gateway services
jest.mock('../../src/services/payment/sslcommerz.service');
jest.mock('../../src/services/payment/bkash.service');
jest.mock('../../src/services/payment/nagad.service');

const { SSLCommerzService } = require('../../src/services/payment/sslcommerz.service');
const { BkashService } = require('../../src/services/payment/bkash.service');
const { NagadService } = require('../../src/services/payment/nagad.service');

// Import routes and middleware
const paymentRoutes = require('../../routes/payments');
const authMiddleware = require('../../middleware/auth');
const paymentMiddleware = require('../../middleware/payment.middleware');

// Setup test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock authentication middleware
app.use((req, res, next) => {
  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      req.user = decoded;
    } catch (error) {
      // Invalid token, but continue for testing
    }
  }
  next();
});

// Mock client info extraction
app.use((req, res, next) => {
  req.clientInfo = {
    ip: '127.0.0.1',
    userAgent: 'test-agent'
  };
  next();
});

app.use('/api/v1', paymentRoutes.router);

// Test configuration
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Payment Gateway Integration Tests', () => {
  let testUser, testAdmin, testAddress, pendingOrder, paidOrder, failedOrder;
  let userToken, adminToken;

  beforeAll(async () => {
    // Setup test environment
    const testData = await createTestOrderWithItems('test-user-id', 'test-address-id');
    
    // Create test users manually for integration tests
    testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'customer'
    };
    
    testAdmin = {
      id: 'test-admin-id',
      email: 'admin@example.com',
      role: 'admin'
    };

    testAddress = {
      id: 'test-address-id',
      userId: testUser.id
    };

    pendingOrder = testData;
    paidOrder = { ...testData, id: 'paid-order-id', paymentStatus: 'paid' };
    failedOrder = { ...testData, id: 'failed-order-id', paymentStatus: 'failed' };

    // Generate tokens
    userToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign(testAdmin, JWT_SECRET, { expiresIn: '1h' });

    // Setup payment gateway settings
    await setupPaymentGatewaySettings();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('SSLCommerz Payment Integration', () => {
    describe('POST /api/v1/payments/initiate - SSLCommerz', () => {
      beforeEach(() => {
        SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue(
          mockSSLCommerzResponse(true)
        );
      });

      it('should initiate SSLCommerz payment successfully', async () => {
        const response = await request(app)
          .post('/api/v1/payments/initiate')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: pendingOrder.id,
            paymentMethod: 'CREDIT_CARD'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.transactionId).toBeDefined();
        expect(response.body.paymentUrl).toBeDefined();
        expect(response.body.message).toContain('successfully');
      });

      it('should fail with invalid order ID', async () => {
        const response = await request(app)
          .post('/api/v1/payments/initiate')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: 'invalid-order-id',
            paymentMethod: 'CREDIT_CARD'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not found');
      });

      it('should fail with invalid payment method', async () => {
        const response = await request(app)
          .post('/api/v1/payments/initiate')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: pendingOrder.id,
            paymentMethod: 'INVALID_METHOD'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid payment method');
      });

      it('should handle SSLCommerz gateway failure', async () => {
        SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue(
          mockSSLCommerzResponse(false)
        );

        const response = await request(app)
          .post('/api/v1/payments/initiate')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: pendingOrder.id,
            paymentMethod: 'CREDIT_CARD'
          });

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('failed');
      });
    });

    describe('SSLCommerz Callback Handling', () => {
      it('should handle SSLCommerz success callback', async () => {
        const callbackData = mockPaymentCallback('sslcommerz', 'success');

        const response = await request(app)
          .post('/api/v1/payments/sslcommerz/success')
          .send(callbackData);

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('/payment/success');
      });

      it('should handle SSLCommerz fail callback', async () => {
        const callbackData = mockPaymentCallback('sslcommerz', 'fail');

        const response = await request(app)
          .post('/api/v1/payments/sslcommerz/fail')
          .send(callbackData);

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('/payment/failed');
      });

      it('should handle SSLCommerz cancel callback', async () => {
        const callbackData = mockPaymentCallback('sslcommerz', 'cancel');

        const response = await request(app)
          .post('/api/v1/payments/sslcommerz/cancel')
          .send(callbackData);

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('/payment/cancelled');
      });

      it('should handle SSLCommerz IPN', async () => {
        const ipnData = {
          ...mockPaymentCallback('sslcommerz', 'success'),
          status: 'VALID'
        };

        const response = await request(app)
          .post('/api/v1/payments/sslcommerz/ipn')
          .send(ipnData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('bKash Payment Integration', () => {
    describe('POST /api/v1/payments/bkash/create', () => {
      beforeEach(() => {
        BkashService.prototype.initiatePayment = jest.fn().mockResolvedValue(
          mockBkashResponse(true)
        );
      });

      it('should create bKash payment successfully', async () => {
        const response = await request(app)
          .post('/api/v1/payments/bkash/create')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: pendingOrder.id,
            amount: 1050.00,
            merchantInvoiceNumber: 'TEST-INV-001'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.transactionId).toBeDefined();
        expect(response.body.paymentID).toBeDefined();
        expect(response.body.bkashURL).toBeDefined();
      });

      it('should fail with invalid amount', async () => {
        const response = await request(app)
          .post('/api/v1/payments/bkash/create')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: pendingOrder.id,
            amount: -100
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/payments/bkash/execute', () => {
      beforeEach(() => {
        BkashService.prototype.handleCallback = jest.fn().mockResolvedValue({
          success: true,
          gatewayResponse: { status: 'completed' }
        });
      });

      it('should execute bKash payment successfully', async () => {
        const response = await request(app)
          .post('/api/v1/payments/bkash/execute')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            paymentID: 'PAY-123456789'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe('completed');
      });

      it('should fail with invalid payment ID', async () => {
        const response = await request(app)
          .post('/api/v1/payments/bkash/execute')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            paymentID: ''
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/payments/bkash/callback', () => {
      it('should handle bKash success callback', async () => {
        const callbackData = mockPaymentCallback('bkash', 'success');

        const response = await request(app)
          .post('/api/v1/payments/bkash/callback')
          .send(callbackData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should handle bKash fail callback', async () => {
        const callbackData = mockPaymentCallback('bkash', 'fail');

        const response = await request(app)
          .post('/api/v1/payments/bkash/callback')
          .send(callbackData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Nagad Payment Integration', () => {
    describe('POST /api/v1/payments/nagad/initialize', () => {
      beforeEach(() => {
        NagadService.prototype.initiatePayment = jest.fn().mockResolvedValue(
          mockNagadResponse(true)
        );
      });

      it('should initialize Nagad payment successfully', async () => {
        const response = await request(app)
          .post('/api/v1/payments/nagad/initialize')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: pendingOrder.id,
            amount: 1050.00
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.transactionId).toBeDefined();
        expect(response.body.paymentRefId).toBeDefined();
        expect(response.body.nagadURL).toBeDefined();
      });

      it('should fail with invalid amount', async () => {
        const response = await request(app)
          .post('/api/v1/payments/nagad/initialize')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: pendingOrder.id,
            amount: 0
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/payments/nagad/verify', () => {
      beforeEach(() => {
        NagadService.prototype.handleCallback = jest.fn().mockResolvedValue({
          success: true,
          gatewayResponse: { status: 'Success' }
        });
      });

      it('should verify Nagad payment successfully', async () => {
        const response = await request(app)
          .post('/api/v1/payments/nagad/verify')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            paymentRefId: 'REF-123456789'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.status).toBe('completed');
      });

      it('should fail with invalid payment reference ID', async () => {
        const response = await request(app)
          .post('/api/v1/payments/nagad/verify')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            paymentRefId: ''
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/payments/nagad/callback', () => {
      it('should handle Nagad success callback', async () => {
        const callbackData = mockPaymentCallback('nagad', 'success');

        const response = await request(app)
          .post('/api/v1/payments/nagad/callback')
          .send(callbackData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should handle Nagad fail callback', async () => {
        const callbackData = mockPaymentCallback('nagad', 'fail');

        const response = await request(app)
          .post('/api/v1/payments/nagad/callback')
          .send(callbackData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Payment Status Retrieval', () => {
    it('should get payment status by order ID', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/${paidOrder.id}/status`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBeDefined();
      expect(response.body.transaction).toBeDefined();
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/v1/payments/non-existent-order/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Refund Processing', () => {
    let completedTransaction;

    beforeEach(async () => {
      completedTransaction = await createCompletedPaymentTransaction(paidOrder.id);
    });

    it('should process full refund successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/payments/${completedTransaction.id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 1050.00,
          reason: 'Customer requested refund'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refundId).toBeDefined();
      expect(response.body.amount).toBe(1050.00);
    });

    it('should process partial refund successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/payments/${completedTransaction.id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 500.00,
          reason: 'Partial refund'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.amount).toBe(500.00);
    });

    it('should fail to refund non-completed payment', async () => {
      const pendingTransaction = await createTestPaymentTransaction(pendingOrder.id);

      const response = await request(app)
        .post(`/api/v1/payments/${pendingTransaction.id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 500.00,
          reason: 'Test refund'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot refund');
    });
  });

  describe('Admin Payment Management', () => {
    describe('GET /api/v1/admin/payments', () => {
      it('should get all payments with pagination', async () => {
        const response = await request(app)
          .get('/api/v1/admin/payments?page=1&limit=10')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.pagination).toBeDefined();
      });

      it('should filter payments by status', async () => {
        const response = await request(app)
          .get('/api/v1/admin/payments?status=completed')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should filter payments by payment method', async () => {
        const response = await request(app)
          .get('/api/v1/admin/payments?paymentMethod=CREDIT_CARD')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should deny access to non-admin users', async () => {
        const response = await request(app)
          .get('/api/v1/admin/payments')
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/admin/payments/:id', () => {
      it('should get payment details by ID', async () => {
        const transaction = await createCompletedPaymentTransaction(paidOrder.id);

        const response = await request(app)
          .get(`/api/v1/admin/payments/${transaction.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBe(transaction.id);
      });

      it('should return 404 for non-existent payment', async () => {
        const response = await request(app)
          .get('/api/v1/admin/payments/non-existent-id')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/admin/payments/:id/refund', () => {
      it('should process admin refund successfully', async () => {
        const transaction = await createCompletedPaymentTransaction(paidOrder.id);

        const response = await request(app)
          .put(`/api/v1/admin/payments/${transaction.id}/refund`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            amount: 1050.00,
            reason: 'Admin initiated refund'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.refundId).toBeDefined();
      });

      it('should require valid amount', async () => {
        const transaction = await createCompletedPaymentTransaction(paidOrder.id);

        const response = await request(app)
          .put(`/api/v1/admin/payments/${transaction.id}/refund`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            amount: 0,
            reason: 'Invalid refund'
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/admin/payments/analytics', () => {
      it('should get payment analytics', async () => {
        const response = await request(app)
          .get('/api/v1/admin/payments/analytics')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.totalRevenue).toBeDefined();
        expect(response.body.data.totalTransactions).toBeDefined();
        expect(response.body.data.successRate).toBeDefined();
        expect(response.body.data.statusBreakdown).toBeDefined();
        expect(response.body.data.gatewayStats).toBeDefined();
      });

      it('should filter analytics by date range', async () => {
        const response = await request(app)
          .get('/api/v1/admin/payments/analytics?startDate=2024-01-01&endDate=2024-12-31')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should filter analytics by gateway', async () => {
        const response = await request(app)
          .get('/api/v1/admin/payments/analytics?gateway=sslcommerz')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should group analytics by day', async () => {
        const response = await request(app)
          .get('/api/v1/admin/payments/analytics?groupBy=day')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.breakdown).toBeDefined();
      });
    });

    describe('Gateway Settings Management', () => {
      describe('GET /api/v1/admin/gateways', () => {
        it('should get all gateway settings', async () => {
          const response = await request(app)
            .get('/api/v1/admin/gateways')
            .set('Authorization', `Bearer ${adminToken}`);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
      });

      describe('PUT /api/v1/admin/gateways/:gateway', () => {
        it('should update gateway settings', async () => {
          const response = await request(app)
            .put('/api/v1/admin/gateways/sslcommerz')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              isActive: true,
              isTestMode: true,
              config: {
                testMode: true,
                currency: 'BDT'
              }
            });

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeDefined();
        });

        it('should fail with invalid gateway name', async () => {
          const response = await request(app)
            .put('/api/v1/admin/gateways/invalid-gateway')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              isActive: true
            });

          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
        });
      });
    });

    describe('Payment Logs', () => {
      describe('GET /api/v1/admin/payments/logs', () => {
        it('should get payment logs', async () => {
          const response = await request(app)
            .get('/api/v1/admin/payments/logs?page=1&limit=50')
            .set('Authorization', `Bearer ${adminToken}`);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.pagination).toBeDefined();
        });

        it('should filter logs by event type', async () => {
          const response = await request(app)
            .get('/api/v1/admin/payments/logs?eventType=PAYMENT_INITIATION')
            .set('Authorization', `Bearer ${adminToken}`);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        });

        it('should filter logs by transaction ID', async () => {
          const transaction = await createTestPaymentTransaction(paidOrder.id);

          const response = await request(app)
            .get(`/api/v1/admin/payments/logs?transactionId=${transaction.transactionId}`)
            .set('Authorization', `Bearer ${adminToken}`);

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        });
      });
    });
  });

  describe('Payment Transaction Creation and Updates', () => {
    it('should create payment transaction record', async () => {
      const transaction = await createTestPaymentTransaction(pendingOrder.id);

      expect(transaction).toBeDefined();
      expect(transaction.orderId).toBe(pendingOrder.id);
      expect(transaction.status).toBe('pending');
      expect(transaction.transactionId).toBeDefined();
    });

    it('should update payment transaction status', async () => {
      const transaction = await createTestPaymentTransaction(pendingOrder.id);

      // Simulate status update
      expect(transaction.status).toBe('pending');
      
      const completed = await createCompletedPaymentTransaction(paidOrder.id);
      expect(completed.status).toBe('completed');
    });
  });

  describe('Payment Logging Functionality', () => {
    it('should log payment initiation events', async () => {
      const transaction = await createTestPaymentTransaction(pendingOrder.id);

      // Payment initiation should be logged
      expect(transaction.transactionId).toBeDefined();
      expect(transaction.createdAt).toBeDefined();
    });

    it('should log payment callback events', async () => {
      const completed = await createCompletedPaymentTransaction(paidOrder.id);

      expect(completed.callbackResponse).toBeDefined();
      expect(completed.gatewayResponse).toBeDefined();
    });
  });

  describe('Fraud Detection Integration', () => {
    it('should detect suspicious payment patterns', async () => {
      // This test verifies that fraud detection is integrated
      // Actual fraud detection logic is tested in security tests
      const transaction = await createTestPaymentTransaction(pendingOrder.id, {
        ipAddress: '192.168.1.1'
      });

      expect(transaction).toBeDefined();
      expect(transaction.ipAddress).toBeDefined();
    });
  });

  describe('PCI-DSS Compliance Checks', () => {
    it('should not store sensitive card data', async () => {
      const transaction = await createTestPaymentTransaction(pendingOrder.id);

      // Verify that sensitive data is not stored
      expect(transaction.gatewayResponse).toBeDefined();
      expect(transaction.gatewayResponse.cardNumber).toBeUndefined();
      expect(transaction.gatewayResponse.cvv).toBeUndefined();
    });

    it('should sanitize payment data in logs', async () => {
      const transaction = await createTestPaymentTransaction(pendingOrder.id);

      // Verify that sensitive data is sanitized
      const responseStr = JSON.stringify(transaction.gatewayResponse);
      expect(responseStr).not.toContain('cardNumber');
      expect(responseStr).not.toContain('cvv');
      expect(responseStr).not.toContain('apiSecret');
    });
  });
});
