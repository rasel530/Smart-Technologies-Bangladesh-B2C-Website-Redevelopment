/**
 * Integration Tests for Product Comparison System
 * Generated: 2026-02-03T17:18:00Z
 * Test Engineer: QA Specialist
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

describe('Integration Tests - Product Comparison System', () => {
  let prisma;
  let app;

  beforeAll(async () => {
    prisma = new PrismaClient();
    // Initialize Express app
    app = require('../../app');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Database Integration Tests', () => {
    describe('Comparison Creation with Database', () => {
      it('should create comparison and persist to database', async () => {
        const comparisonData = {
          title: 'Test Comparison',
          userId: 'test-user-id',
          productIds: ['prod1', 'prod2', 'prod3']
        };

        const response = await request(app)
          .post('/api/v1/comparisons')
          .send(comparisonData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(comparisonData.title);

        // Verify in database
        const dbComparison = await prisma.comparison.findUnique({
          where: { id: response.body.id }
        });
        expect(dbComparison).toBeTruthy();
        expect(dbComparison.title).toBe(comparisonData.title);
      });

      it('should create guest comparison and persist to database', async () => {
        const guestId = 'guest-session-id';
        const comparisonData = {
          title: 'Guest Test Comparison',
          guestId: guestId,
          productIds: ['prod1', 'prod2']
        };

        const response = await request(app)
          .post('/api/v1/comparisons/guest')
          .send(comparisonData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.guestId).toBe(guestId);

        // Verify in database
        const dbComparison = await prisma.comparison.findUnique({
          where: { id: response.body.id }
        });
        expect(dbComparison).toBeTruthy();
        expect(dbComparison.guestId).toBe(guestId);
      });
    });

    describe('Comparison Retrieval with Database', () => {
      it('should retrieve comparison by ID from database', async () => {
        // Create test comparison
        const comparison = await prisma.comparison.create({
          data: {
            title: 'Test Comparison for Retrieval',
            userId: 'test-user-id'
          }
        });

        const response = await request(app)
          .get(`/api/v1/comparisons/${comparison.id}`)
          .expect(200);

        expect(response.body.id).toBe(comparison.id);
        expect(response.body.title).toBe(comparison.title);
      });

      it('should retrieve user comparisons from database', async () => {
        const userId = 'test-user-id';
        
        const response = await request(app)
          .get(`/api/v1/comparisons/user/${userId}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should retrieve guest comparisons from database', async () => {
        const guestId = 'guest-session-id';
        
        const response = await request(app)
          .get(`/api/v1/comparisons/guest/${guestId}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('Comparison Update with Database', () => {
      it('should update comparison and persist to database', async () => {
        const comparison = await prisma.comparison.create({
          data: {
            title: 'Original Title',
            userId: 'test-user-id'
          }
        });

        const updateData = {
          title: 'Updated Title'
        };

        const response = await request(app)
          .put(`/api/v1/comparisons/${comparison.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.title).toBe(updateData.title);

        // Verify in database
        const dbComparison = await prisma.comparison.findUnique({
          where: { id: comparison.id }
        });
        expect(dbComparison.title).toBe(updateData.title);
      });
    });

    describe('Comparison Deletion with Database', () => {
      it('should delete comparison from database', async () => {
        const comparison = await prisma.comparison.create({
          data: {
            title: 'Comparison to Delete',
            userId: 'test-user-id'
          }
        });

        await request(app)
          .delete(`/api/v1/comparisons/${comparison.id}`)
          .expect(200);

        // Verify deletion in database
        const dbComparison = await prisma.comparison.findUnique({
          where: { id: comparison.id }
        });
        expect(dbComparison).toBeNull();
      });
    });

    describe('Share Token Management with Database', () => {
      it('should generate and persist share token to database', async () => {
        const comparison = await prisma.comparison.create({
          data: {
            title: 'Comparison to Share',
            userId: 'test-user-id'
          }
        });

        const response = await request(app)
          .post(`/api/v1/comparisons/${comparison.id}/share`)
          .expect(200);

        expect(response.body).toHaveProperty('shareToken');
        expect(response.body.shareToken).toBeTruthy();

        // Verify share token in database
        const dbComparison = await prisma.comparison.findUnique({
          where: { id: comparison.id }
        });
        expect(dbComparison.shareToken).toBe(response.body.shareToken);
        expect(dbComparison.shareTokenExpiresAt).toBeTruthy();
      });

      it('should validate share token from database', async () => {
        const comparison = await prisma.comparison.create({
          data: {
            title: 'Comparison with Share Token',
            userId: 'test-user-id',
            shareToken: 'test-share-token',
            shareTokenExpiresAt: new Date(Date.now() + 86400000) // 24 hours from now
          }
        });

        const response = await request(app)
          .get(`/api/v1/comparisons/shared/${comparison.shareToken}`)
          .expect(200);

        expect(response.body.id).toBe(comparison.id);
      });

      it('should reject expired share token', async () => {
        const comparison = await prisma.comparison.create({
          data: {
            title: 'Comparison with Expired Token',
            userId: 'test-user-id',
            shareToken: 'expired-share-token',
            shareTokenExpiresAt: new Date(Date.now() - 86400000) // 24 hours ago
          }
        });

        await request(app)
          .get(`/api/v1/comparisons/shared/${comparison.shareToken}`)
          .expect(404);
      });
    });

    describe('Guest Comparison Expiration with Database', () => {
      it('should automatically expire guest comparisons after 30 days', async () => {
        const expiredDate = new Date(Date.now() - (31 * 24 * 60 * 60 * 1000)); // 31 days ago

        await prisma.comparison.create({
          data: {
            title: 'Expired Guest Comparison',
            guestId: 'guest-session-id',
            createdAt: expiredDate
          }
        });

        // Run cleanup job
        await request(app)
          .post('/api/v1/comparisons/cleanup-expired')
          .expect(200);

        // Verify expired comparison is deleted
        const expiredComparisons = await prisma.comparison.findMany({
          where: {
            guestId: 'guest-session-id',
            createdAt: { lt: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)) }
          }
        });
        expect(expiredComparisons.length).toBe(0);
      });
    });

    describe('History API with Database', () => {
      it('should retrieve user comparison history from database', async () => {
        const userId = 'test-user-id';

        // Create test comparisons
        await prisma.comparison.createMany({
          data: [
            { title: 'History Comparison 1', userId },
            { title: 'History Comparison 2', userId },
            { title: 'History Comparison 3', userId }
          ]
        });

        const response = await request(app)
          .get(`/api/v1/comparisons/history/${userId}`)
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.pagination).toBeDefined();
      });
    });

    describe('Admin Analytics with Database', () => {
      it('should retrieve comparison analytics using aggregated queries', async () => {
        const response = await request(app)
          .get('/api/v1/admin/comparisons/analytics')
          .expect(200);

        expect(response.body).toHaveProperty('totalComparisons');
        expect(response.body).toHaveProperty('averageProductsPerComparison');
        expect(response.body).toHaveProperty('mostComparedProducts');
        expect(response.body).toHaveProperty('comparisonsByDate');
      });

      it('should support pagination on analytics', async () => {
        const response = await request(app)
          .get('/api/v1/admin/comparisons/analytics')
          .query({ page: 1, limit: 20 })
          .expect(200);

        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(20);
      });
    });
  });

  describe('Service Layer Integration Tests', () => {
    describe('ComparisonService with Database', () => {
      it('should create comparison using service layer', async () => {
        const ComparisonService = require('../../services/comparison.service');
        const comparisonData = {
          title: 'Service Layer Test',
          userId: 'test-user-id',
          productIds: ['prod1', 'prod2']
        };

        const comparison = await ComparisonService.createComparison(comparisonData);

        expect(comparison).toHaveProperty('id');
        expect(comparison.title).toBe(comparisonData.title);

        // Verify in database
        const dbComparison = await prisma.comparison.findUnique({
          where: { id: comparison.id }
        });
        expect(dbComparison).toBeTruthy();
      });

      it('should normalize specifications using service layer', async () => {
        const ComparisonService = require('../../services/comparison.service');
        const specName = 'RAM';
        const normalized = ComparisonService.normalizeSpecName(specName);

        expect(normalized).toBe('ram');
      });

      it('should compare spec values using service layer', async () => {
        const ComparisonService = require('../../services/comparison.service');
        const result = ComparisonService.compareSpecValues(8, 16, 'ram');

        expect(result).toBeLessThan(0);
      });

      it('should calculate product score using service layer', async () => {
        const ComparisonService = require('../../services/comparison.service');
        const product = {
          specifications: [
            { name: 'ram', value: '16 GB' },
            { name: 'storage', value: '512 GB' },
            { name: 'processor', value: 'Intel i7' }
          ]
        };

        const score = ComparisonService.calculateProductScore(product);

        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThan(0);
      });
    });

    describe('History Service with Database', () => {
      it('should create history entry using service layer', async () => {
        const ComparisonService = require('../../services/comparison.service');
        const historyData = {
          comparisonId: 'test-comparison-id',
          action: 'created',
          userId: 'test-user-id'
        };

        const history = await ComparisonService.createHistoryEntry(historyData);

        expect(history).toHaveProperty('id');
        expect(history.action).toBe(historyData.action);
      });
    });

    describe('Cleanup Service with Database', () => {
      it('should cleanup expired comparisons using service layer', async () => {
        const ComparisonService = require('../../services/comparison.service');
        
        // Create expired comparison
        await prisma.comparison.create({
          data: {
            title: 'Expired Comparison',
            guestId: 'guest-id',
            createdAt: new Date(Date.now() - (31 * 24 * 60 * 60 * 1000))
          }
        });

        const result = await ComparisonService.cleanupExpiredComparisons();

        expect(result.deletedCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Authentication Integration Tests', () => {
    describe('Authenticated User Comparisons', () => {
      it('should create comparison for authenticated user', async () => {
        const token = 'valid-auth-token';
        const comparisonData = {
          title: 'Auth User Comparison',
          productIds: ['prod1', 'prod2']
        };

        const response = await request(app)
          .post('/api/v1/comparisons')
          .set('Authorization', `Bearer ${token}`)
          .send(comparisonData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.userId).toBeTruthy();
      });

      it('should retrieve user comparisons with authentication', async () => {
        const token = 'valid-auth-token';
        const userId = 'test-user-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/user/${userId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('Guest User Comparisons', () => {
      it('should create comparison for guest user', async () => {
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

      it('should retrieve guest comparisons', async () => {
        const guestId = 'guest-session-id';

        const response = await request(app)
          .get(`/api/v1/comparisons/guest/${guestId}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('Authorization Tests', () => {
      it('should prevent user from accessing another user comparisons', async () => {
        const token = 'user1-token';
        const otherUserId = 'user2-id';

        await request(app)
          .get(`/api/v1/comparisons/user/${otherUserId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });

      it('should prevent guest from accessing user comparisons', async () => {
        const guestId = 'guest-session-id';
        const userId = 'user-id';

        await request(app)
          .get(`/api/v1/comparisons/user/${userId}`)
          .set('X-Guest-ID', guestId)
          .expect(403);
      });
    });
  });

  describe('Rate Limiting Integration Tests', () => {
    it('should enforce rate limit for authenticated users', async () => {
      const token = 'valid-auth-token';
      const comparisonData = {
        title: 'Rate Limit Test',
        productIds: ['prod1']
      };

      // Make 100 requests (should hit rate limit)
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/v1/comparisons')
          .set('Authorization', `Bearer ${token}`)
          .send(comparisonData);
      }

      // 101st request should be rate limited
      await request(app)
        .post('/api/v1/comparisons')
        .set('Authorization', `Bearer ${token}`)
        .send(comparisonData)
        .expect(429);
    });

    it('should enforce rate limit for guest users', async () => {
      const guestId = 'guest-session-id';
      const comparisonData = {
        title: 'Guest Rate Limit Test',
        productIds: ['prod1']
      };

      // Make 20 requests (should hit rate limit)
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post('/api/v1/comparisons/guest')
          .set('X-Guest-ID', guestId)
          .send(comparisonData);
      }

      // 21st request should be rate limited
      await request(app)
        .post('/api/v1/comparisons/guest')
        .set('X-Guest-ID', guestId)
        .send(comparisonData)
        .expect(429);
    });
  });

  describe('CSRF Protection Integration Tests', () => {
    it('should require CSRF token for POST requests', async () => {
      const comparisonData = {
        title: 'CSRF Test',
        productIds: ['prod1']
      };

      await request(app)
        .post('/api/v1/comparisons')
        .send(comparisonData)
        .expect(403); // Forbidden - missing CSRF token
    });

    it('should validate CSRF token for POST requests', async () => {
      const csrfToken = 'valid-csrf-token';
      const comparisonData = {
        title: 'CSRF Valid Test',
        productIds: ['prod1']
      };

      await request(app)
        .post('/api/v1/comparisons')
        .set('X-CSRF-Token', csrfToken)
        .send(comparisonData)
        .expect(201);
    });
  });

  describe('Export Integration Tests', () => {
    it('should export comparison as CSV', async () => {
      const comparison = await prisma.comparison.create({
        data: {
          title: 'Export Test Comparison',
          userId: 'test-user-id'
        }
      });

      const response = await request(app)
        .get(`/api/v1/comparisons/${comparison.id}/export/csv`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should export comparison as JSON', async () => {
      const comparison = await prisma.comparison.create({
        data: {
          title: 'Export JSON Test',
          userId: 'test-user-id'
        }
      });

      const response = await request(app)
        .get(`/api/v1/comparisons/${comparison.id}/export/json`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should export comparison as PDF', async () => {
      const comparison = await prisma.comparison.create({
        data: {
          title: 'Export PDF Test',
          userId: 'test-user-id'
        }
      });

      const response = await request(app)
        .get(`/api/v1/comparisons/${comparison.id}/export/pdf`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
    });
  });
});
