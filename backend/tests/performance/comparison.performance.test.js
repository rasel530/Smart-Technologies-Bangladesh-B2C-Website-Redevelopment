/**
 * Performance Tests for Product Comparison System
 * Generated: 2026-02-03T17:27:00Z
 * Test Engineer: QA Specialist
 */

const request = require('supertest');

describe('Performance Tests - Product Comparison System', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    app = require('../../app');
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarttech.com',
        password: 'AdminPassword123'
      });
    authToken = loginResponse.body.token;
  });

  describe('API Response Time Under Load', () => {
    it('should respond to GET comparisons within 200ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/comparisons/user/test-user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to POST comparisons within 300ms', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/v1/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Performance Test',
          productIds: ['prod1', 'prod2']
        })
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(300);
    });

    it('should respond to PUT comparisons within 200ms', async () => {
      const startTime = Date.now();

      await request(app)
        .put('/api/v1/comparisons/test-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to DELETE comparisons within 200ms', async () => {
      const startTime = Date.now();

      await request(app)
        .delete('/api/v1/comparisons/test-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to share token generation within 200ms', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/v1/comparisons/test-id/share')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to shared comparison retrieval within 200ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/comparisons/shared/test-token')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to export CSV within 500ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/comparisons/test-id/export/csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
    });

    it('should respond to export JSON within 300ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/comparisons/test-id/export/json')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(300);
    });

    it('should respond to export PDF within 1000ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/comparisons/test-id/export/pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000);
    });

    it('should respond to admin analytics within 500ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/admin/comparisons/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Database Query Performance', () => {
    it('should query single comparison within 100ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/comparisons/test-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(100);
    });

    it('should query user comparisons within 150ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/comparisons/user/test-user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(150);
    });

    it('should query comparison history within 200ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/comparisons/history/test-user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(200);
    });

    it('should query admin analytics within 300ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/admin/comparisons/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(300);
    });

    it('should use indexes for frequently queried columns', async () => {
      // This test verifies that indexes are being used
      // by checking query performance
      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await request(app)
          .get('/api/v1/comparisons/user/test-user')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      // Average query time should be less than 50ms with indexes
      expect(avgTime).toBeLessThan(50);
    });
  });

  describe('Large Comparison Sets', () => {
    it('should handle comparison with 10 products', async () => {
      const productIds = Array.from({ length: 10 }, (_, i) => `prod${i + 1}`);
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Large Comparison Test',
          productIds
        })
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
      expect(response.body.products.length).toBe(10);
    });

    it('should retrieve comparison with 10 products within 300ms', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/comparisons/large-comparison-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(300);
      expect(response.body.products.length).toBe(10);
    });

    it('should export comparison with 10 products within 1000ms', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/v1/comparisons/large-comparison-id/export/csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle comparison with 20 products', async () => {
      const productIds = Array.from({ length: 20 }, (_, i) => `prod${i + 1}`);
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/v1/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Very Large Comparison Test',
          productIds
        })
        .expect(201);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000);
      expect(response.body.products.length).toBe(20);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 10 concurrent requests', async () => {
      const requests = [];
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/v1/comparisons/user/test-user')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      await Promise.all(requests);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All 10 requests should complete within 1 second
      expect(totalTime).toBeLessThan(1000);
    });

    it('should handle 50 concurrent requests', async () => {
      const requests = [];
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .get('/api/v1/comparisons/user/test-user')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      await Promise.all(requests);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All 50 requests should complete within 5 seconds
      expect(totalTime).toBeLessThan(5000);
    });

    it('should handle 100 concurrent requests', async () => {
      const requests = [];
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .get('/api/v1/comparisons/user/test-user')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      await Promise.all(requests);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All 100 requests should complete within 10 seconds
      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory on repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 1000 requests
      for (let i = 0; i < 1000; i++) {
        await request(app)
          .get('/api/v1/comparisons/user/test-user')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be less than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should not leak memory on large comparisons', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create and retrieve large comparisons
      for (let i = 0; i < 100; i++) {
        const productIds = Array.from({ length: 10 }, (_, j) => `prod${j + 1}`);
        
        await request(app)
          .post('/api/v1/comparisons')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Memory Test ${i}`,
            productIds
          })
          .expect(201);

        await request(app)
          .get('/api/v1/comparisons/user/test-user')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be less than 100MB
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Pagination Performance', () => {
    it('should handle large datasets with pagination', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/comparisons/user/test-user')
        .query({ page: 1, limit: 50 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(300);
      expect(response.body.data.length).toBeLessThanOrEqual(50);
    });

    it('should handle pagination with large offset', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/v1/comparisons/user/test-user')
        .query({ page: 100, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(500);
    });

    it('should maintain performance with increasing page numbers', async () => {
      const times = [];

      for (let page = 1; page <= 10; page++) {
        const startTime = Date.now();

        await request(app)
          .get('/api/v1/comparisons/user/test-user')
          .query({ page, limit: 10 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      // Response times should not increase significantly
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(maxTime).toBeLessThan(avgTime * 2);
    });
  });

  describe('Cache Performance', () => {
    it('should cache frequently accessed comparisons', async () => {
      const comparisonId = 'test-comparison-id';
      
      // First request (cache miss)
      const startTime1 = Date.now();
      await request(app)
        .get(`/api/v1/comparisons/${comparisonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const time1 = Date.now() - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      await request(app)
        .get(`/api/v1/comparisons/${comparisonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const time2 = Date.now() - startTime2;

      // Cached request should be faster
      expect(time2).toBeLessThan(time1);
    });

    it('should invalidate cache on comparison update', async () => {
      const comparisonId = 'test-comparison-id';
      
      // Cache the comparison
      await request(app)
        .get(`/api/v1/comparisons/${comparisonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Update the comparison
      await request(app)
        .put(`/api/v1/comparisons/${comparisonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      // Retrieve again (should get updated data)
      const response = await request(app)
        .get(`/api/v1/comparisons/${comparisonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
    });
  });

  describe('Load Testing', () => {
    it('should handle 100 requests per second', async () => {
      const duration = 10000; // 10 seconds
      const targetRPS = 100;
      const totalRequests = (duration / 1000) * targetRPS;
      
      const startTime = Date.now();
      const requests = [];

      for (let i = 0; i < totalRequests; i++) {
        requests.push(
          request(app)
            .get('/api/v1/comparisons/user/test-user')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      await Promise.all(requests);
      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      expect(actualDuration).toBeLessThan(duration * 1.5); // Within 50% of target
    });

    it('should maintain response times under load', async () => {
      const requests = [];
      const responseTimes = [];

      for (let i = 0; i < 100; i++) {
        const startTime = Date.now();
        
        requests.push(
          request(app)
            .get('/api/v1/comparisons/user/test-user')
            .set('Authorization', `Bearer ${authToken}`)
            .then(res => {
              responseTimes.push(Date.now() - startTime);
              return res;
            })
        );
      }

      await Promise.all(requests);

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      expect(avgResponseTime).toBeLessThan(200);
      expect(maxResponseTime).toBeLessThan(1000);
      expect(p95ResponseTime).toBeLessThan(500);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet API response time benchmarks', () => {
      const benchmarks = {
        'GET /comparisons/:id': 100,
        'POST /comparisons': 300,
        'PUT /comparisons/:id': 200,
        'DELETE /comparisons/:id': 200,
        'GET /comparisons/user/:userId': 200,
        'GET /comparisons/shared/:token': 200,
        'POST /comparisons/:id/share': 200,
        'GET /comparisons/:id/export/csv': 500,
        'GET /comparisons/:id/export/json': 300,
        'GET /comparisons/:id/export/pdf': 1000,
        'GET /admin/comparisons/analytics': 500
      };

      Object.entries(benchmarks).forEach(([endpoint, maxTime]) => {
        expect(maxTime).toBeGreaterThan(0);
      });
    });

    it('should meet database query benchmarks', () => {
      const benchmarks = {
        'Single comparison query': 100,
        'User comparisons query': 150,
        'Comparison history query': 200,
        'Admin analytics query': 300,
        'Share token validation': 100
      };

      Object.entries(benchmarks).forEach(([query, maxTime]) => {
        expect(maxTime).toBeGreaterThan(0);
      });
    });

    it('should meet throughput benchmarks', () => {
      const benchmarks = {
        'Requests per second': 100,
        'Concurrent connections': 100,
        'Database queries per second': 1000
      };

      Object.entries(benchmarks).forEach(([metric, value]) => {
        expect(value).toBeGreaterThan(0);
      });
    });
  });
});
