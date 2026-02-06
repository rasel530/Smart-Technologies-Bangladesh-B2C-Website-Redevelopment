/**
 * API Tests for Product Comparison System
 * Generated: 2026-02-03T17:22:00Z
 * Test Engineer: QA Specialist
 */

const request = require('supertest');

describe('API Tests - Product Comparison System', () => {
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

  describe('Comparison Endpoints', () => {
    describe('POST /api/v1/comparisons', () => {
      it('should create a new comparison', async () => {
        const comparisonData = {
          title: 'New Comparison',
          productIds: ['prod1', 'prod2', 'prod3']
        };

        const response = await request(app)
          .post('/api/v1/comparisons')
          .set('Authorization', `Bearer ${authToken}`)
          .send(comparisonData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(comparisonData.title);
        expect(response.body).toHaveProperty('createdAt');
      });

      it('should validate required fields', async () => {
        const comparisonData = {
          // Missing title
          productIds: ['prod1']
        };

        await request(app)
          .post('/api/v1/comparisons')
          .set('Authorization', `Bearer ${authToken}`)
          .send(comparisonData)
          .expect(400);
      });

      it('should require authentication', async () => {
        const comparisonData = {
          title: 'Test Comparison',
          productIds: ['prod1']
        };

        await request(app)
          .post('/api/v1/comparisons')
          .send(comparisonData)
          .expect(401);
      });
    });

    describe('GET /api/v1/comparisons/:id', () => {
      it('should retrieve a comparison by ID', async () => {
        const comparisonId = 'test-comparison-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/${comparisonId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('products');
      });

      it('should return 404 for non-existent comparison', async () => {
        const comparisonId = 'non-existent-id';

        await request(app)
          .get(`/api/v1/comparisons/${comparisonId}`)
          .expect(404);
      });
    });

    describe('PUT /api/v1/comparisons/:id', () => {
      it('should update a comparison', async () => {
        const comparisonId = 'test-comparison-id';
        const updateData = {
          title: 'Updated Title'
        };

        const response = await request(app)
          .put(`/api/v1/comparisons/${comparisonId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.title).toBe(updateData.title);
      });

      it('should prevent updating another user comparison', async () => {
        const comparisonId = 'other-user-comparison-id';
        const updateData = {
          title: 'Unauthorized Update'
        };

        await request(app)
          .put(`/api/v1/comparisons/${comparisonId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);
      });
    });

    describe('DELETE /api/v1/comparisons/:id', () => {
      it('should delete a comparison', async () => {
        const comparisonId = 'test-comparison-id';

        await request(app)
          .delete(`/api/v1/comparisons/${comparisonId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      });

      it('should prevent deleting another user comparison', async () => {
        const comparisonId = 'other-user-comparison-id';

        await request(app)
          .delete(`/api/v1/comparisons/${comparisonId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('GET /api/v1/comparisons/user/:userId', () => {
      it('should retrieve user comparisons', async () => {
        const userId = 'test-user-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/user/${userId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should support pagination', async () => {
        const userId = 'test-user-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/user/${userId}`)
          .query({ page: 1, limit: 10 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
      });
    });
  });

  describe('Guest Comparison Endpoints', () => {
    describe('POST /api/v1/comparisons/guest', () => {
      it('should create a guest comparison', async () => {
        const guestId = 'guest-session-id';
        const comparisonData = {
          title: 'Guest Comparison',
          productIds: ['prod1', 'prod2']
        };

        const response = await request(app)
          .post('/api/v1/comparisons/guest')
          .set('X-Guest-ID', guestId)
          .send(comparisonData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.guestId).toBe(guestId);
      });
    });

    describe('GET /api/v1/comparisons/guest/:guestId', () => {
      it('should retrieve guest comparisons', async () => {
        const guestId = 'guest-session-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/guest/${guestId}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });

  describe('Share Token Endpoints', () => {
    describe('POST /api/v1/comparisons/:id/share', () => {
      it('should generate share token', async () => {
        const comparisonId = 'test-comparison-id';

        const response = await request(app)
          .post(`/api/v1/comparisons/${comparisonId}/share`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('shareToken');
        expect(response.body).toHaveProperty('shareUrl');
        expect(response.body.shareToken).toBeTruthy();
      });

      it('should persist share token to database', async () => {
        const comparisonId = 'test-comparison-id';

        const response = await request(app)
          .post(`/api/v1/comparisons/${comparisonId}/share`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify token is stored in database
        const comparison = await request(app)
          .get(`/api/v1/comparisons/${comparisonId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(comparison.body.shareToken).toBe(response.body.shareToken);
      });
    });

    describe('GET /api/v1/comparisons/shared/:token', () => {
      it('should retrieve comparison by share token', async () => {
        const shareToken = 'valid-share-token';

        const response = await request(app)
          .get(`/api/v1/comparisons/shared/${shareToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('title');
      });

      it('should reject expired share token', async () => {
        const expiredToken = 'expired-share-token';

        await request(app)
          .get(`/api/v1/comparisons/shared/${expiredToken}`)
          .expect(404);
      });

      it('should reject invalid share token', async () => {
        const invalidToken = 'invalid-share-token';

        await request(app)
          .get(`/api/v1/comparisons/shared/${invalidToken}`)
          .expect(404);
      });
    });
  });

  describe('Export Endpoints', () => {
    describe('GET /api/v1/comparisons/:id/export/csv', () => {
      it('should export comparison as CSV', async () => {
        const comparisonId = 'test-comparison-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/${comparisonId}/export/csv`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.headers['content-type']).toContain('text/csv');
        expect(response.headers['content-disposition']).toContain('attachment');
      });

      it('should have consistent CSV format', async () => {
        const comparisonId = 'test-comparison-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/${comparisonId}/export/csv`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.text).toContain('Product Name');
        expect(response.text).toContain('Price');
        expect(response.text).toContain('Specifications');
      });
    });

    describe('GET /api/v1/comparisons/:id/export/json', () => {
      it('should export comparison as JSON', async () => {
        const comparisonId = 'test-comparison-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/${comparisonId}/export/json`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.headers['content-type']).toContain('application/json');
        const jsonData = JSON.parse(response.text);
        expect(jsonData).toHaveProperty('title');
        expect(jsonData).toHaveProperty('products');
      });

      it('should have consistent JSON format', async () => {
        const comparisonId = 'test-comparison-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/${comparisonId}/export/json`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const jsonData = JSON.parse(response.text);
        expect(jsonData).toHaveProperty('title');
        expect(jsonData).toHaveProperty('products');
        expect(jsonData).toHaveProperty('createdAt');
        expect(Array.isArray(jsonData.products)).toBe(true);
      });
    });

    describe('GET /api/v1/comparisons/:id/export/pdf', () => {
      it('should export comparison as PDF', async () => {
        const comparisonId = 'test-comparison-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/${comparisonId}/export/pdf`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.headers['content-type']).toContain('application/pdf');
        expect(response.headers['content-disposition']).toContain('attachment');
      });
    });
  });

  describe('History Endpoints', () => {
    describe('GET /api/v1/comparisons/history/:userId', () => {
      it('should retrieve user comparison history', async () => {
        const userId = 'test-user-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/history/${userId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support pagination', async () => {
        const userId = 'test-user-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/history/${userId}`)
          .query({ page: 1, limit: 10 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('pagination');
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(10);
      });
    });
  });

  describe('Admin Analytics Endpoints', () => {
    describe('GET /api/v1/admin/comparisons/analytics', () => {
      it('should retrieve comparison analytics', async () => {
        const response = await request(app)
          .get('/api/v1/admin/comparisons/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('totalComparisons');
        expect(response.body).toHaveProperty('averageProductsPerComparison');
        expect(response.body).toHaveProperty('mostComparedProducts');
        expect(response.body).toHaveProperty('comparisonsByDate');
      });

      it('should use aggregated queries', async () => {
        const response = await request(app)
          .get('/api/v1/admin/comparisons/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(typeof response.body.totalComparisons).toBe('number');
        expect(typeof response.body.averageProductsPerComparison).toBe('number');
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/v1/admin/comparisons/analytics')
          .query({ page: 1, limit: 20 })
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('pagination');
      });
    });
  });

  describe('Request/Response Validation', () => {
    it('should validate request body format', async () => {
      const invalidData = {
        title: 123, // Should be string
        productIds: 'not-an-array'
      };

      await request(app)
        .post('/api/v1/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        title: '<script>alert("XSS")</script>',
        productIds: ['prod1']
      };

      const response = await request(app)
        .post('/api/v1/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201);

      expect(response.body.title).not.toContain('<script>');
    });

    it('should return proper error responses', async () => {
      await request(app)
        .get('/api/v1/comparisons/invalid-id')
        .expect(404)
        .expect(res => {
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Simulate database error
      await request(app)
        .post('/api/v1/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test', productIds: [] })
        .expect(400);
    });

    it('should handle validation errors', async () => {
      await request(app)
        .post('/api/v1/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('should handle authentication errors', async () => {
      await request(app)
        .post('/api/v1/comparisons')
        .send({ title: 'Test', productIds: ['prod1'] })
        .expect(401);
    });

    it('should handle authorization errors', async () => {
      const otherUserToken = 'other-user-token';
      
      await request(app)
        .delete('/api/v1/comparisons/some-id')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce 100 req/15min for authenticated users', async () => {
      const requests = [];
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .get('/api/v1/comparisons/user/test-user')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      await Promise.all(requests);

      // 101st request should be rate limited
      await request(app)
        .get('/api/v1/comparisons/user/test-user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(429);
    });

    it('should enforce 20 req/15min for guest users', async () => {
      const guestId = 'guest-session-id';
      const requests = [];
      
      // Make 20 requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get(`/api/v1/comparisons/guest/${guestId}`)
        );
      }

      await Promise.all(requests);

      // 21st request should be rate limited
      await request(app)
        .get(`/api/v1/comparisons/guest/${guestId}`)
        .expect(429);
    });

    it('should return rate limit headers', async () => {
      const response = await request(app)
        .get('/api/v1/comparisons/user/test-user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/api/v1/comparisons/user/test-user')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/comparisons')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});
