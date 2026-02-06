/**
 * Unit Tests for Admin Comparison Routes
 * 
 * Tests for all endpoints in backend/routes/admin/comparisons.js including:
 * - GET /admin/comparisons - List all comparisons
 * - GET /admin/comparisons/:id - Get comparison details
 * - DELETE /admin/comparisons/:id - Delete comparison
 * - GET /admin/comparisons/stats - Get comparison statistics
 * - GET /admin/comparisons/analytics - Get comparison analytics
 */

const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// Mock dependencies
jest.mock('../../middleware/auth', () => ({
  authMiddleware: {
    authenticate: jest.fn((req, res, next) => {
      req.user = { id: 'admin-user-id', email: 'admin@smarttech.com', role: 'admin' };
      next();
    }),
    adminOnly: jest.fn((req, res, next) => {
      if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    }),
  },
}));

const adminComparisonRouter = require('../../routes/admin/comparisons');

const app = express();
app.use(express.json());
app.use('/api/v1/admin/comparisons', adminComparisonRouter);

describe('Admin Comparison Routes', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      productComparison: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      productComparisonItem: {
        groupBy: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
      comparisonHistory: {
        groupBy: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    jest.clearAllMocks();
  });

  describe('GET /admin/comparisons - List all comparisons', () => {
    test('should return all comparisons with pagination', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          userId: 'user-1',
          sessionId: null,
          name: 'Comparison 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: [],
          _count: { items: 2 },
          user: {
            id: 'user-1',
            email: 'user1@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        {
          id: 'comparison-2',
          userId: null,
          sessionId: 'session-1',
          name: 'Guest Comparison',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          items: [],
          _count: { items: 3 },
          user: null,
        },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.productComparison.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/v1/admin/comparisons?page=1&limit=20')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.total).toBe(2);
    });

    test('should filter by userId', async () => {
      mockPrisma.productComparison.findMany.mockResolvedValue([]);
      mockPrisma.productComparison.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/admin/comparisons?userId=user-1')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(0);
    });

    test('should filter by sessionId', async () => {
      mockPrisma.productComparison.findMany.mockResolvedValue([]);
      mockPrisma.productComparison.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/admin/comparisons?sessionId=session-1')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(0);
    });

    test('should filter by status (active)', async () => {
      mockPrisma.productComparison.findMany.mockResolvedValue([]);
      mockPrisma.productComparison.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/admin/comparisons?status=active')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(0);
    });

    test('should filter by status (expired)', async () => {
      mockPrisma.productComparison.findMany.mockResolvedValue([]);
      mockPrisma.productComparison.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/admin/comparisons?status=expired')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(0);
    });

    test('should sort by createdAt', async () => {
      mockPrisma.productComparison.findMany.mockResolvedValue([]);
      mockPrisma.productComparison.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/admin/comparisons?sortBy=createdAt&sortOrder=desc')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(0);
    });

    test('should sort by name', async () => {
      mockPrisma.productComparison.findMany.mockResolvedValue([]);
      mockPrisma.productComparison.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/admin/comparisons?sortBy=name&sortOrder=asc')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(0);
    });

    test('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/admin/comparisons?page=invalid&limit=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should validate status parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admin/comparisons?status=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should validate sortBy parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admin/comparisons?sortBy=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should validate sortOrder parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admin/comparisons?sortOrder=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /admin/comparisons/:id - Get comparison details', () => {
    test('should return comparison details successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'user-1',
        sessionId: null,
        name: 'Comparison 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
        user: {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer',
        },
        _count: { items: 2 },
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/comparison-1')
        .expect(200);

      expect(response.body.comparison).toBeDefined();
      expect(response.body.comparison.id).toBe('comparison-1');
      expect(response.body.comparison.user).toBeDefined();
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should validate comparison ID is valid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/admin/comparisons/not-a-uuid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /admin/comparisons/:id - Delete comparison', () => {
    test('should delete comparison successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'user-1',
        sessionId: null,
        name: 'Comparison 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.productComparison.delete.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/v1/admin/comparisons/comparison-1')
        .expect(200);

      expect(response.body.message).toBe('Comparison deleted successfully');
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/admin/comparisons/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should validate comparison ID is valid UUID', async () => {
      const response = await request(app)
        .delete('/api/v1/admin/comparisons/not-a-uuid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /admin/comparisons/stats - Get comparison statistics', () => {
    test('should return comparison statistics for all time', async () => {
      const mockStats = {
        totalComparisons: 100,
        activeComparisons: 80,
        expiredComparisons: 20,
        userComparisons: 70,
        guestComparisons: 30,
        totalItems: 250,
        avgItemsPerComparison: 2.5,
      };

      mockPrisma.productComparison.count.mockResolvedValueOnce(100);
      mockPrisma.productComparison.count.mockResolvedValueOnce(80);
      mockPrisma.productComparison.count.mockResolvedValueOnce(20);
      mockPrisma.productComparison.count.mockResolvedValueOnce(70);
      mockPrisma.productComparison.count.mockResolvedValueOnce(30);
      mockPrisma.productComparisonItem.count.mockResolvedValue(250);
      mockPrisma.productComparison.aggregate.mockResolvedValue({ _avg: { items: 2.5 } });

      const mockTopComparedProducts = [
        { productId: 'product-1', _count: { productId: 10 } },
        { productId: 'product-2', _count: { productId: 8 } },
      ];

      mockPrisma.productComparisonItem.groupBy.mockResolvedValue(mockTopComparedProducts);
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'product-1', name: 'Product 1', nameEn: 'Product 1', regularPrice: 1000, salePrice: 900, images: [] },
        { id: 'product-2', name: 'Product 2', nameEn: 'Product 2', regularPrice: 1200, salePrice: null, images: [] },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/stats?period=all')
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalComparisons).toBe(100);
      expect(response.body.stats.activeComparisons).toBe(80);
      expect(response.body.stats.expiredComparisons).toBe(20);
      expect(response.body.stats.userComparisons).toBe(70);
      expect(response.body.stats.guestComparisons).toBe(30);
      expect(response.body.stats.totalItems).toBe(250);
      expect(response.body.stats.avgItemsPerComparison).toBe(2.5);
      expect(response.body.topComparedProducts).toBeDefined();
      expect(response.body.topComparedProducts).toHaveLength(2);
    });

    test('should return comparison statistics for today', async () => {
      mockPrisma.productComparison.count.mockResolvedValueOnce(10);
      mockPrisma.productComparison.count.mockResolvedValueOnce(8);
      mockPrisma.productComparison.count.mockResolvedValueOnce(2);
      mockPrisma.productComparison.count.mockResolvedValueOnce(7);
      mockPrisma.productComparison.count.mockResolvedValueOnce(3);
      mockPrisma.productComparisonItem.count.mockResolvedValue(25);
      mockPrisma.productComparison.aggregate.mockResolvedValue({ _avg: { items: 2.5 } });
      mockPrisma.productComparisonItem.groupBy.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/stats?period=today')
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.period).toBe('today');
    });

    test('should return comparison statistics for week', async () => {
      mockPrisma.productComparison.count.mockResolvedValueOnce(50);
      mockPrisma.productComparison.count.mockResolvedValueOnce(40);
      mockPrisma.productComparison.count.mockResolvedValueOnce(10);
      mockPrisma.productComparison.count.mockResolvedValueOnce(35);
      mockPrisma.productComparison.count.mockResolvedValueOnce(15);
      mockPrisma.productComparisonItem.count.mockResolvedValue(125);
      mockPrisma.productComparison.aggregate.mockResolvedValue({ _avg: { items: 2.5 } });
      mockPrisma.productComparisonItem.groupBy.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/stats?period=week')
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.period).toBe('week');
    });

    test('should return comparison statistics for month', async () => {
      mockPrisma.productComparison.count.mockResolvedValueOnce(200);
      mockPrisma.productComparison.count.mockResolvedValueOnce(160);
      mockPrisma.productComparison.count.mockResolvedValueOnce(40);
      mockPrisma.productComparison.count.mockResolvedValueOnce(140);
      mockPrisma.productComparison.count.mockResolvedValueOnce(60);
      mockPrisma.productComparisonItem.count.mockResolvedValue(500);
      mockPrisma.productComparison.aggregate.mockResolvedValue({ _avg: { items: 2.5 } });
      mockPrisma.productComparisonItem.groupBy.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/stats?period=month')
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.period).toBe('month');
    });

    test('should return comparison statistics for year', async () => {
      mockPrisma.productComparison.count.mockResolvedValueOnce(1000);
      mockPrisma.productComparison.count.mockResolvedValueOnce(800);
      mockPrisma.productComparison.count.mockResolvedValueOnce(200);
      mockPrisma.productComparison.count.mockResolvedValueOnce(700);
      mockPrisma.productComparison.count.mockResolvedValueOnce(300);
      mockPrisma.productComparisonItem.count.mockResolvedValue(2500);
      mockPrisma.productComparison.aggregate.mockResolvedValue({ _avg: { items: 2.5 } });
      mockPrisma.productComparisonItem.groupBy.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/stats?period=year')
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(response.body.period).toBe('year');
    });

    test('should validate period parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admin/comparisons/stats?period=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /admin/comparisons/analytics - Get comparison analytics', () => {
    test('should return comparison analytics for all time', async () => {
      const mockComparisons = [
        {
          createdAt: new Date('2026-01-01'),
          _count: { items: 2 },
        },
        {
          createdAt: new Date('2026-01-02'),
          _count: { items: 3 },
        },
      ];

      const mockUserActivity = [
        { userId: 'user-1', _count: { userId: 5 } },
        { userId: 'user-2', _count: { userId: 3 } },
      ];

      const mockActionDistribution = [
        { action: 'created', _count: { action: 10 } },
        { action: 'viewed', _count: { action: 20 } },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce(mockUserActivity);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce(mockActionDistribution);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'user1@example.com', firstName: 'John', lastName: 'Doe' },
        { id: 'user-2', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith' },
      ]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics?period=all&groupBy=day')
        .expect(200);

      expect(response.body.timeline).toBeDefined();
      expect(response.body.topUsers).toBeDefined();
      expect(response.body.actionDistribution).toBeDefined();
      expect(response.body.period).toBe('all');
      expect(response.body.groupBy).toBe('day');
    });

    test('should return comparison analytics for today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockComparisons = [
        {
          createdAt: today,
          _count: { items: 2 },
        },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics?period=today&groupBy=day')
        .expect(200);

      expect(response.body.timeline).toBeDefined();
      expect(response.body.period).toBe('today');
    });

    test('should return comparison analytics for week', async () => {
      const mockComparisons = [
        {
          createdAt: new Date('2026-01-27'),
          _count: { items: 2 },
        },
        {
          createdAt: new Date('2026-01-28'),
          _count: { items: 3 },
        },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics?period=week&groupBy=day')
        .expect(200);

      expect(response.body.timeline).toBeDefined();
      expect(response.body.period).toBe('week');
    });

    test('should return comparison analytics for month', async () => {
      const mockComparisons = [
        {
          createdAt: new Date('2026-01-01'),
          _count: { items: 2 },
        },
        {
          createdAt: new Date('2026-01-15'),
          _count: { items: 3 },
        },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics?period=month&groupBy=day')
        .expect(200);

      expect(response.body.timeline).toBeDefined();
      expect(response.body.period).toBe('month');
    });

    test('should return comparison analytics for year', async () => {
      const mockComparisons = [
        {
          createdAt: new Date('2025-02-01'),
          _count: { items: 2 },
        },
        {
          createdAt: new Date('2025-08-01'),
          _count: { items: 3 },
        },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics?period=year&groupBy=month')
        .expect(200);

      expect(response.body.timeline).toBeDefined();
      expect(response.body.period).toBe('year');
    });

    test('should group by week', async () => {
      const mockComparisons = [
        {
          createdAt: new Date('2026-01-01'),
          _count: { items: 2 },
        },
        {
          createdAt: new Date('2026-01-08'),
          _count: { items: 3 },
        },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics?period=all&groupBy=week')
        .expect(200);

      expect(response.body.timeline).toBeDefined();
      expect(response.body.groupBy).toBe('week');
    });

    test('should group by month', async () => {
      const mockComparisons = [
        {
          createdAt: new Date('2026-01-01'),
          _count: { items: 2 },
        },
        {
          createdAt: new Date('2026-02-01'),
          _count: { items: 3 },
        },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.comparisonHistory.groupBy.mockResolvedValueOnce([]);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics?period=all&groupBy=month')
        .expect(200);

      expect(response.body.timeline).toBeDefined();
      expect(response.body.groupBy).toBe('month');
    });

    test('should validate period parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics?period=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should validate groupBy parameter', async () => {
      const response = await request(app)
        .get('/api/v1/admin/comparisons/analytics?groupBy=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});
