/**
 * Payment Gateway Performance Tests
 * 
 * Comprehensive performance tests for payment gateway operations
 * including response times, concurrent handling, and throughput.
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const {
  createTestUser,
  createTestAdmin,
  createTestAddress,
  createTestOrderWithItems,
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

describe('Payment Gateway Performance Tests', () => {
  let testUser, testAdmin, testAddress, testOrder;
  let userToken, adminToken;

  beforeAll(async () => {
    testUser = await createTestUser();
    testAdmin = await createTestAdmin();
    testAddress = await createTestAddress(testUser.id);
    testOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

    userToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign(testAdmin, JWT_SECRET, { expiresIn: '1h' });

    // Setup mocks for performance tests
    SSLCommerzService.prototype.initiatePayment = jest.fn().mockResolvedValue({
      success: true,
      transactionId: `SSL-${Date.now()}`,
      paymentUrl: 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php'
    });

    BkashService.prototype.initiatePayment = jest.fn().mockResolvedValue({
      success: true,
      transactionId: `BKASH-${Date.now()}`,
      paymentID: `PAY-${Date.now()}`,
      bkashURL: 'https://sandbox.bka.sh/gateway'
    });

    NagadService.prototype.initiatePayment = jest.fn().mockResolvedValue({
      success: true,
      transactionId: `NAGAD-${Date.now()}`,
      paymentRefId: `REF-${Date.now()}`,
      nagadURL: 'https://sandbox.mynagad.com/gateway'
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('Payment Initiation Response Time', () => {
    it('should complete SSLCommerz payment initiation in < 3 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          paymentMethod: 'CREDIT_CARD'
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000);
    });

    it('should complete bKash payment initiation in < 3 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/payments/bkash/create')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          amount: 1050.00
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000);
    });

    it('should complete Nagad payment initiation in < 3 seconds', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/payments/nagad/initialize')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderId: testOrder.id,
          amount: 1050.00
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000);
    });
  });

  describe('Payment Status Query Response Time', () => {
    it('should complete payment status query in < 1 second', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/v1/payments/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${userToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000);
    });

    it('should maintain performance with multiple status queries', async () => {
      const responseTimes = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();

        await request(app)
          .get(`/api/v1/payments/${testOrder.id}/status`)
          .set('Authorization', `Bearer ${userToken}`);

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(1000);
      expect(maxResponseTime).toBeLessThan(1500);
    });
  });

  describe('Concurrent Payment Handling', () => {
    it('should handle 10 concurrent payment initiations', async () => {
      const startTime = Date.now();

      const requests = [];
      for (let i = 0; i < 10; i++) {
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
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
      expect(totalTime).toBeLessThan(10000); // 10 seconds for 10 requests
    });

    it('should handle 20 concurrent payment status queries', async () => {
      const startTime = Date.now();

      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get(`/api/v1/payments/${testOrder.id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 20 requests
    });

    it('should handle concurrent requests across different gateways', async () => {
      const startTime = Date.now();

      const requests = [
        request(app)
          .post('/api/v1/payments/initiate')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: testOrder.id,
            paymentMethod: 'CREDIT_CARD'
          }),
        request(app)
          .post('/api/v1/payments/bkash/create')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: testOrder.id,
            amount: 1050.00
          }),
        request(app)
          .post('/api/v1/payments/nagad/initialize')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: testOrder.id,
            amount: 1050.00
          })
      ];

      await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Database Query Performance', () => {
    it('should query payment transactions efficiently', async () => {
      const startTime = Date.now();

      await prisma.payment_transaction.findMany({
        where: {
          orderId: testOrder.id
        },
        take: 50
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(500);
    });

    it('should query payment logs efficiently', async () => {
      const startTime = Date.now();

      await prisma.payment_log.findMany({
        where: {
          orderId: testOrder.id
        },
        take: 100
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(500);
    });

    it('should query payment gateway settings efficiently', async () => {
      const startTime = Date.now();

      await prisma.payment_gateway_settings.findMany();

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(200);
    });

    it('should handle complex queries efficiently', async () => {
      const startTime = Date.now();

      await prisma.payment_transaction.findMany({
        where: {
          status: 'completed',
          paymentMethod: 'CREDIT_CARD',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(1000);
    });
  });

  describe('API Endpoint Throughput', () => {
    it('should handle 100 requests per minute for payment initiation', async () => {
      const startTime = Date.now();
      const requests = [];

      for (let i = 0; i < 100; i++) {
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
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200);
      const throughput = successfulResponses.length / (totalTime / 1000);

      expect(throughput).toBeGreaterThan(10); // At least 10 requests per second
    });

    it('should handle 200 requests per minute for payment status queries', async () => {
      const startTime = Date.now();
      const requests = [];

      for (let i = 0; i < 200; i++) {
        requests.push(
          request(app)
            .get(`/api/v1/payments/${testOrder.id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200);
      const throughput = successfulResponses.length / (totalTime / 1000);

      expect(throughput).toBeGreaterThan(20); // At least 20 requests per second
    });

    it('should handle admin payment analytics queries efficiently', async () => {
      const startTime = Date.now();
      const requests = [];

      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .get('/api/v1/admin/payments/analytics')
            .set('Authorization', `Bearer ${adminToken}`)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200);
      const throughput = successfulResponses.length / (totalTime / 1000);

      expect(throughput).toBeGreaterThan(5); // At least 5 requests per second
    });
  });

  describe('Frontend Page Load Time', () => {
    it('should load payment method selection page quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/payments/methods')
        .set('Authorization', `Bearer ${userToken}`);

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(1000);
    });

    it('should load payment analytics page quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/payments/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(2000);
    });

    it('should load payment logs page quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/payments/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(2000);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during multiple payment initiations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple payment initiations
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post('/api/v1/payments/initiate')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            orderId: testOrder.id,
            paymentMethod: 'CREDIT_CARD'
          });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should not leak memory during multiple status queries', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple status queries
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get(`/api/v1/payments/${testOrder.id}/status`)
          .set('Authorization', `Bearer ${userToken}`);
      }

      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Callback Processing Performance', () => {
    it('should process SSLCommerz callback quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/payments/sslcommerz/success')
        .send({
          tran_id: `SSL-${Date.now()}`,
          val_id: `VAL-${Date.now()}`,
          amount: '1050.00'
        });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000);
    });

    it('should process bKash callback quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/payments/bkash/callback')
        .send({
          paymentID: `PAY-${Date.now()}`,
          status: 'completed'
        });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000);
    });

    it('should process Nagad callback quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/payments/nagad/callback')
        .send({
          payment_ref_id: `REF-${Date.now()}`,
          status: 'Success'
        });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000);
    });
  });

  describe('Pagination Performance', () => {
    it('should paginate payment transactions efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/payments?page=1&limit=20')
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(1000);
    });

    it('should handle large page sizes efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/payments?page=1&limit=100')
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle pagination with filters efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/payments?page=1&limit=20&status=completed&paymentMethod=CREDIT_CARD')
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(loadTime).toBeLessThan(1500);
    });
  });

  describe('Search Performance', () => {
    it('should search payment transactions efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/payments?search=ORD')
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const searchTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(searchTime).toBeLessThan(1500);
    });

    it('should filter payment logs efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/payments/logs?eventType=PAYMENT_INITIATION')
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const filterTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(filterTime).toBeLessThan(1000);
    });
  });

  describe('Analytics Performance', () => {
    it('should calculate payment analytics quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/payments/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const calculationTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(calculationTime).toBeLessThan(3000);
    });

    it('should handle date range filtering efficiently', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const startTime = Date.now();

      const response = await request(app)
        .get(`/api/v1/admin/payments/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const calculationTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(calculationTime).toBeLessThan(4000);
    });

    it('should handle grouping efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/admin/payments/analytics?groupBy=day')
        .set('Authorization', `Bearer ${adminToken}`);

      const endTime = Date.now();
      const calculationTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(calculationTime).toBeLessThan(5000);
    });
  });

  describe('Refund Processing Performance', () => {
    it('should process refunds quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post(`/api/v1/payments/test-transaction-id/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 500.00,
          reason: 'Test refund'
        });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Refund processing should be fast (< 3 seconds)
      expect(processingTime).toBeLessThan(3000);
    });

    it('should handle concurrent refund requests', async () => {
      const startTime = Date.now();

      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post(`/api/v1/payments/test-transaction-id-${i}/refund`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              amount: 500.00,
              reason: 'Test refund'
            })
        );
      }

      await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance with sustained load', async () => {
      const responseTimes = [];

      // Sustained load test
      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();

        await request(app)
          .get(`/api/v1/payments/${testOrder.id}/status`)
          .set('Authorization', `Bearer ${userToken}`);

        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
      const p99ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)];

      expect(averageResponseTime).toBeLessThan(1000);
      expect(p95ResponseTime).toBeLessThan(1500);
      expect(p99ResponseTime).toBeLessThan(2000);
    });

    it('should handle burst traffic', async () => {
      const startTime = Date.now();

      // Burst of 50 requests
      const requests = [];
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .get(`/api/v1/payments/${testOrder.id}/status`)
            .set('Authorization', `Bearer ${userToken}`)
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(40);
      expect(totalTime).toBeLessThan(10000);
    });
  });
});
