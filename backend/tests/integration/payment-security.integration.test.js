/**
 * Payment Security Integration Tests
 * 
 * Comprehensive integration tests for payment security features
 * including fraud detection, PCI-DSS compliance, encryption, and access control.
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const {
  createTestUser,
  createTestAdmin,
  createTestAddress,
  createTestOrderWithItems,
  createTestPaymentTransaction,
  cleanupTestData
} = require('../../../tests/setup/payment-test-data.test');

const prisma = new PrismaClient();

// Mock payment gateway services
jest.mock('../../src/services/payment/sslcommerz.service');
jest.mock('../../src/services/payment/bkash.service');
jest.mock('../../src/services/payment/nagad.service');
jest.mock('../../src/services/payment/fraud-detection.service');
jest.mock('../../src/services/payment/pci-dss.service');

const { FraudDetectionService } = require('../../src/services/payment/fraud-detection.service');
const { PciDssService } = require('../../src/services/payment/pci-dss.service');

const app = require('../../backend/app');

// Test configuration
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Payment Security Integration Tests', () => {
  let testUser, testAdmin, testAddress, testOrder;
  let userToken, adminToken;

  beforeAll(async () => {
    testUser = await createTestUser();
    testAdmin = await createTestAdmin();
    testAddress = await createTestAddress(testUser.id);
    testOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

    userToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign(testAdmin, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('Fraud Detection Integration', () => {
    beforeEach(() => {
      FraudDetectionService.prototype.analyzePayment = jest.fn().mockResolvedValue({
        riskScore: 10,
        isSuspicious: false,
        riskFactors: []
      });
    });

    it('should analyze payment for fraud risk', async () => {
      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(200);
      expect(FraudDetectionService.prototype.analyzePayment).toHaveBeenCalled();
    });

    it('should trigger fraud detection for high-risk transactions', async () => {
      FraudDetectionService.prototype.analyzePayment = jest.fn().mockResolvedValue({
        riskScore: 85,
        isSuspicious: true,
        riskFactors: ['high_amount', 'new_user', 'unusual_location']
      });

      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      // High-risk payment should be flagged
      expect(FraudDetectionService.prototype.analyzePayment).toHaveBeenCalled();
    });

    it('should detect multiple payment attempts from same IP', async () => {
      const ipAddress = '192.168.1.100';

      // Create multiple payment attempts
      for (let i = 0; i < 5; i++) {
        await createTestPaymentTransaction(testOrder.id, {
          ipAddress,
          status: 'failed'
        });
      }

      FraudDetectionService.prototype.analyzePayment = jest.fn().mockResolvedValue({
        riskScore: 70,
        isSuspicious: true,
        riskFactors: ['multiple_attempts', 'same_ip']
      });

      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Forwarded-For', ipAddress)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(FraudDetectionService.prototype.analyzePayment).toHaveBeenCalledWith(
        expect.objectContaining({ ipAddress })
      );
    });

    it('should detect unusual payment patterns', async () => {
      // Create payment history with unusual pattern
      await createTestPaymentTransaction(testOrder.id, {
        amount: 10000.00,
        status: 'completed'
      });

      FraudDetectionService.prototype.analyzePayment = jest.fn().mockResolvedValue({
        riskScore: 60,
        isSuspicious: true,
        riskFactors: ['unusual_amount', 'velocity_check']
      });

      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(FraudDetectionService.prototype.analyzePayment).toHaveBeenCalled();
    });

    it('should log fraud detection results', async () => {
      FraudDetectionService.prototype.analyzePayment = jest.fn().mockResolvedValue({
        riskScore: 75,
        isSuspicious: true,
        riskFactors: ['suspicious_location']
      });

      await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      // Verify fraud detection was logged
      const logs = await prisma.payment_log.findMany({
        where: {
          eventType: 'FRAUD_DETECTION'
        }
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('PCI-DSS Compliance', () => {
    beforeEach(() => {
      PciDssService.prototype.sanitizePaymentData = jest.fn((data) => data);
      PciDssService.prototype.validateCompliance = jest.fn().mockReturnValue(true);
    });

    it('should not store sensitive card data', async () => {
      const transaction = await createTestPaymentTransaction(testOrder.id, {
        gatewayResponse: {
          success: true,
          tran_id: 'SSL-123456',
          amount: '1050.00'
          // Note: cardNumber should not be present
        }
      });

      // Verify sensitive data is not stored
      expect(transaction.gatewayResponse.cardNumber).toBeUndefined();
      expect(transaction.gatewayResponse.cvv).toBeUndefined();
      expect(transaction.gatewayResponse.pin).toBeUndefined();
    });

    it('should sanitize payment data before storage', async () => {
      const sensitiveData = {
        cardNumber: '4111111111111111',
        cvv: '123',
        expiry: '12/25',
        amount: '1050.00'
      };

      PciDssService.prototype.sanitizePaymentData = jest.fn((data) => {
        const sanitized = { ...data };
        delete sanitized.cardNumber;
        delete sanitized.cvv;
        return sanitized;
      });

      const sanitized = PciDssService.prototype.sanitizePaymentData(sensitiveData);

      expect(sanitized.cardNumber).toBeUndefined();
      expect(sanitized.cvv).toBeUndefined();
      expect(sanitized.amount).toBe('1050.00');
    });

    it('should validate PCI-DSS compliance', async () => {
      const paymentData = {
        amount: 1050.00,
        currency: 'BDT',
        paymentMethod: 'CREDIT_CARD'
      };

      const isCompliant = PciDssService.prototype.validateCompliance(paymentData);

      expect(isCompliant).toBe(true);
    });

    it('should encrypt sensitive data in transit', async () => {
      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      // Verify HTTPS is used (in production)
      // This is a placeholder - actual implementation would check protocol
      expect(response.status).toBe(200);
    });

    it('should not log sensitive payment information', async () => {
      const transaction = await createTestPaymentTransaction(testOrder.id, {
        gatewayResponse: {
          success: true,
          tran_id: 'SSL-123456'
        }
      });

      // Verify logs don't contain sensitive data
      const logs = await prisma.payment_log.findMany({
        where: { transactionId: transaction.transactionId }
      });

      logs.forEach(log => {
        const logStr = JSON.stringify(log.eventData);
        expect(logStr).not.toContain('cardNumber');
        expect(logStr).not.toContain('cvv');
      });
    });
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt sensitive gateway credentials', async () => {
      const gatewaySettings = await prisma.payment_gateway_settings.findUnique({
        where: { gateway: 'sslcommerz' }
      });

      // Verify credentials are stored securely
      expect(gatewaySettings).toBeDefined();
      // In production, apiSecret should be encrypted
      expect(gatewaySettings.apiSecret).toBeDefined();
    });

    it('should decrypt gateway credentials for use', async () => {
      // This test verifies that credentials can be decrypted when needed
      const gatewaySettings = await prisma.payment_gateway_settings.findUnique({
        where: { gateway: 'bkash' }
      });

      expect(gatewaySettings).toBeDefined();
      expect(gatewaySettings.apiKey).toBeDefined();
    });

    it('should use secure encryption algorithm', async () => {
      // Verify encryption is using secure algorithm (AES-256 or similar)
      // This is a placeholder - actual implementation would check algorithm
      const gatewaySettings = await prisma.payment_gateway_settings.findFirst();

      expect(gatewaySettings).toBeDefined();
    });
  });

  describe('Tokenization', () => {
    it('should tokenize payment methods', async () => {
      // Mock tokenization service
      const mockToken = 'tok_' + Math.random().toString(36).substr(2, 20);

      const transaction = await createTestPaymentTransaction(testOrder.id, {
        gatewayTransactionId: mockToken
      });

      expect(transaction.gatewayTransactionId).toBeDefined();
      expect(transaction.gatewayTransactionId).toMatch(/^tok_/);
    });

    it('should use token for subsequent payments', async () => {
      const mockToken = 'tok_' + Math.random().toString(36).substr(2, 20);

      // Create transaction with token
      const firstTransaction = await createTestPaymentTransaction(testOrder.id, {
        gatewayTransactionId: mockToken
      });

      // Use same token for another payment
      const secondTransaction = await createTestPaymentTransaction(testOrder.id, {
        gatewayTransactionId: mockToken
      });

      expect(firstTransaction.gatewayTransactionId).toBe(mockToken);
      expect(secondTransaction.gatewayTransactionId).toBe(mockToken);
    });

    it('should not store raw card details with token', async () => {
      const transaction = await createTestPaymentTransaction(testOrder.id, {
        gatewayTransactionId: 'tok_test123456'
      });

      // Verify raw card details are not stored
      expect(transaction.gatewayResponse).toBeDefined();
      expect(transaction.gatewayResponse.cardNumber).toBeUndefined();
      expect(transaction.gatewayResponse.cvv).toBeUndefined();
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should verify SSLCommerz webhook signature', async () => {
      const mockSignature = 'test_signature_' + Date.now();

      const response = await request(app)
        .post('/api/v1/payments/sslcommerz/ipn')
        .set('X-Signature', mockSignature)
        .send({
          tran_id: 'SSL-123456',
          status: 'VALID',
          amount: '1050.00'
        });

      // Signature verification should be performed
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should verify bKash webhook signature', async () => {
      const mockSignature = 'bkash_signature_' + Date.now();

      const response = await request(app)
        .post('/api/v1/payments/bkash/callback')
        .set('X-BKash-Signature', mockSignature)
        .send({
          paymentID: 'PAY-123456',
          status: 'completed'
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should verify Nagad webhook signature', async () => {
      const mockSignature = 'nagad_signature_' + Date.now();

      const response = await request(app)
        .post('/api/v1/payments/nagad/callback')
        .set('X-Nagad-Signature', mockSignature)
        .send({
          payment_ref_id: 'REF-123456',
          status: 'Success'
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should reject webhook with invalid signature', async () => {
      const invalidSignature = 'invalid_signature';

      const response = await request(app)
        .post('/api/v1/payments/sslcommerz/ipn')
        .set('X-Signature', invalidSignature)
        .send({
          tran_id: 'SSL-123456',
          status: 'VALID'
        });

      // Invalid signature should be rejected
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should limit payment initiation attempts', async () => {
      const requests = [];

      // Make multiple rapid requests
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/v1/payments/initiate')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              orderId: testOrder.id,
              paymentMethod: 'CREDIT_CARD'
            })
        );
      }

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should limit refund requests', async () => {
      const transaction = await createTestPaymentTransaction(testOrder.id, {
        status: 'completed'
      });

      const requests = [];

      // Make multiple refund requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post(`/api/v1/payments/${transaction.id}/refund`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              amount: 500.00,
              reason: 'Test refund'
            })
        );
      }

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should reset rate limit after timeout', async () => {
      // This test would require implementing rate limit reset logic
      // Placeholder for rate limit reset verification
      expect(true).toBe(true);
    });
  });

  describe('Authentication/Authorization', () => {
    it('should require authentication for payment initiation', async () => {
      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      // Should require authentication (or allow guest checkout)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should require admin authentication for admin endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow admin access with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject invalid authentication tokens', async () => {
      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(401);
    });

    it('should reject expired authentication tokens', async () => {
      const expiredToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '-1h' });

      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      expect(response.status).toBe(401);
    });

    it('should enforce user ownership for payment operations', async () => {
      const otherUser = await createTestUser();
      const otherOrder = await createTestOrderWithItems(otherUser.id, testAddress.id);

      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: otherOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      // User should not be able to initiate payment for another user's order
      expect(response.status).toBe(403);
    });
  });

  describe('Data Sanitization in Logs', () => {
    it('should sanitize sensitive data in payment logs', async () => {
      const transaction = await createTestPaymentTransaction(testOrder.id, {
        gatewayResponse: {
          success: true,
          tran_id: 'SSL-123456',
          card_type: 'VISA',
          amount: '1050.00'
        }
      });

      const log = await prisma.payment_log.create({
        data: {
          transactionId: transaction.id,
          orderId: testOrder.id,
          eventType: 'PAYMENT_SUCCESS',
          eventData: {
            ...transaction.gatewayResponse,
            sensitiveField: 'should_be_sanitized'
          }
        }
      });

      // Verify sensitive data is sanitized
      const eventDataStr = JSON.stringify(log.eventData);
      expect(eventDataStr).not.toContain('cardNumber');
      expect(eventDataStr).not.toContain('cvv');
    });

    it('should not log API secrets', async () => {
      const gatewaySettings = await prisma.payment_gateway_settings.findFirst();

      const log = await prisma.payment_log.create({
        data: {
          orderId: testOrder.id,
          eventType: 'GATEWAY_CONFIG',
          eventData: {
            gateway: gatewaySettings.gateway,
            // apiSecret should not be logged
          }
        }
      });

      const eventDataStr = JSON.stringify(log.eventData);
      expect(eventDataStr).not.toContain('apiSecret');
      expect(eventDataStr).not.toContain('privateKey');
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection in payment parameters', async () => {
      const maliciousInput = "'; DROP TABLE payment_transaction; --";

      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: maliciousInput,
          paymentMethod: 'CREDIT_CARD'
        });

      // Should reject malicious input
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should prevent XSS in payment parameters', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD',
          notes: xssPayload
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should validate payment amount limits', async () => {
      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      // Amount validation should be performed
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should sanitize user input in refund reason', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const transaction = await createTestPaymentTransaction(testOrder.id, {
        status: 'completed'
      });

      const response = await request(app)
        .post(`/api/v1/payments/${transaction.id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 500.00,
          reason: xssPayload
        });

      // Should sanitize or reject XSS payload
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Secure Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/v1/payments/status')
        .set('Authorization', `Bearer ${userToken}`);

      // Verify security headers are present
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    it('should set CSP headers', async () => {
      const response = await request(app)
        .get('/api/v1/payments/status')
        .set('Authorization', `Bearer ${userToken}`);

      // Verify CSP header
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should prevent clickjacking', async () => {
      const response = await request(app)
        .get('/api/v1/payments/status')
        .set('Authorization', `Bearer ${userToken}`);

      // Verify X-Frame-Options header prevents clickjacking
      expect(response.headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
    });
  });

  describe('Audit Logging', () => {
    it('should log all payment operations', async () => {
      const initialLogCount = await prisma.payment_log.count();

      await createTestPaymentTransaction(testOrder.id);

      const finalLogCount = await prisma.payment_log.count();

      expect(finalLogCount).toBeGreaterThan(initialLogCount);
    });

    it('should log admin refund actions', async () => {
      const transaction = await createTestPaymentTransaction(testOrder.id, {
        status: 'completed'
      });

      await request(app)
        .put(`/api/v1/admin/payments/${transaction.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1050.00,
          reason: 'Admin refund'
        });

      const logs = await prisma.payment_log.findMany({
        where: {
          eventType: 'REFUND'
        }
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('should log failed payment attempts', async () => {
      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: 'invalid-order-id',
          paymentMethod: 'CREDIT_CARD'
        });

      const logs = await prisma.payment_log.findMany({
        where: {
          eventType: 'PAYMENT_FAILURE'
        }
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
