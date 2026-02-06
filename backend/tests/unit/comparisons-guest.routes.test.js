/**
 * Unit Tests for Guest Comparison Routes
 * 
 * Tests for all endpoints in backend/routes/comparisons-guest.js including:
 * - POST /comparisons/guest - Create guest comparison
 * - GET /comparisons/guest/:sessionId - Get guest comparison
 * - PUT /comparisons/guest/:sessionId - Update guest comparison
 * - POST /comparisons/guest/:sessionId/merge - Merge to user account
 */

const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// Mock dependencies
jest.mock('../../services/comparison.service', () => ({
  ComparisonService: jest.fn().mockImplementation(() => ({
    createHistoryEntry: jest.fn(),
  })),
}));

const { ComparisonService } = require('../../services/comparison.service');
const guestComparisonRouter = require('../../routes/comparisons-guest');

const app = express();
app.use(express.json());
app.use('/api/v1/comparisons', guestComparisonRouter);

describe('Guest Comparison Routes', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      productComparison: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      productComparisonItem: {
        findMany: jest.fn(),
      },
    };

    jest.clearAllMocks();
  });

  describe('POST /comparisons/guest - Create guest comparison', () => {
    test('should create guest comparison successfully with valid data', async () => {
      const mockComparison = {
        id: 'comparison-1',
        sessionId: expect.stringMatching(/^[a-f0-9]{64}$/),
        name: 'Guest Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'product-1', status: 'active', visibility: 'public' },
        { id: 'product-2', status: 'active', visibility: 'public' },
      ]);

      mockPrisma.productComparison.create.mockResolvedValue({
        ...mockComparison,
        items: [],
      });

      const response = await request(app)
        .post('/api/v1/comparisons/guest')
        .send({
          name: 'Guest Comparison',
          productIds: ['product-1', 'product-2'],
        })
        .expect(201);

      expect(response.body.message).toBe('Guest comparison created successfully');
      expect(response.body.comparison).toBeDefined();
      expect(response.body.sessionId).toBeDefined();
      expect(response.body.sessionId).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should return 404 if products not found', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'product-1', status: 'active', visibility: 'public' },
      ]);

      const response = await request(app)
        .post('/api/v1/comparisons/guest')
        .send({
          name: 'Guest Comparison',
          productIds: ['product-1', 'product-2'],
        })
        .expect(404);

      expect(response.body.error).toBe('One or more products not found');
    });

    test('should return 400 if products are not available', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'product-1', status: 'inactive', visibility: 'public' },
        { id: 'product-2', status: 'active', visibility: 'private' },
      ]);

      const response = await request(app)
        .post('/api/v1/comparisons/guest')
        .send({
          name: 'Guest Comparison',
          productIds: ['product-1', 'product-2'],
        })
        .expect(400);

      expect(response.body.error).toBe('Some products are not available for comparison');
    });

    test('should validate productIds is an array', async () => {
      const response = await request(app)
        .post('/api/v1/comparisons/guest')
        .send({
          name: 'Guest Comparison',
          productIds: 'not-an-array',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should validate productIds are valid UUIDs', async () => {
      const response = await request(app)
        .post('/api/v1/comparisons/guest')
        .send({
          name: 'Guest Comparison',
          productIds: ['not-a-uuid', 'also-not-a-uuid'],
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should generate default name if not provided', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'product-1', status: 'active', visibility: 'public' },
      ]);

      mockPrisma.productComparison.create.mockResolvedValue({
        id: 'comparison-1',
        sessionId: expect.stringMatching(/^[a-f0-9]{64}$/),
        name: expect.stringContaining('Guest Comparison'),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
        items: [],
      });

      await request(app)
        .post('/api/v1/comparisons/guest')
        .send({
          productIds: ['product-1'],
        })
        .expect(201);
    });

    test('should set 7 day expiration for guest comparisons', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'product-1', status: 'active', visibility: 'public' },
      ]);

      const now = Date.now();
      const expectedExpiration = new Date(now + 7 * 24 * 60 * 60 * 1000);

      mockPrisma.productComparison.create.mockImplementation((data) => {
        const expiresAt = data.data.expiresAt;
        expect(expiresAt.getTime()).toBeCloseTo(expectedExpiration.getTime(), 1000);
        return Promise.resolve({
          id: 'comparison-1',
          sessionId: 'test-session-id',
          name: 'Guest Comparison',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt,
          items: [],
        });
      });

      await request(app)
        .post('/api/v1/comparisons/guest')
        .send({
          productIds: ['product-1'],
        })
        .expect(201);
    });
  });

  describe('GET /comparisons/guest/:sessionId - Get guest comparison', () => {
    test('should return guest comparison if session exists', async () => {
      const mockComparison = {
        id: 'comparison-1',
        sessionId: 'test-session-id',
        name: 'Guest Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/guest/test-session-id')
        .expect(200);

      expect(response.body.comparison).toBeDefined();
      expect(response.body.comparison.sessionId).toBe('test-session-id');
    });

    test('should return 404 if guest comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/comparisons/guest/non-existent-session')
        .expect(404);

      expect(response.body.error).toBe('Guest comparison not found');
    });

    test('should return 410 if guest comparison has expired', async () => {
      const mockComparison = {
        id: 'comparison-1',
        sessionId: 'test-session-id',
        name: 'Guest Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date('2020-01-01'),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/guest/test-session-id')
        .expect(410);

      expect(response.body.error).toBe('Guest comparison has expired');
    });

    test('should validate sessionId is a string', async () => {
      const response = await request(app)
        .get('/api/v1/comparisons/guest/12345')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /comparisons/guest/:sessionId - Update guest comparison', () => {
    test('should update guest comparison name successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        sessionId: 'test-session-id',
        name: 'Old Name',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const updatedMockComparison = {
        ...mockComparison,
        name: 'New Name',
        updatedAt: new Date(),
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.productComparison.update.mockResolvedValue(updatedMockComparison);

      const response = await request(app)
        .put('/api/v1/comparisons/guest/test-session-id')
        .send({ name: 'New Name' })
        .expect(200);

      expect(response.body.message).toBe('Guest comparison updated successfully');
      expect(response.body.comparison.name).toBe('New Name');
    });

    test('should return 404 if guest comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/comparisons/guest/non-existent-session')
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.error).toBe('Guest comparison not found');
    });

    test('should return 410 if guest comparison has expired', async () => {
      const mockComparison = {
        id: 'comparison-1',
        sessionId: 'test-session-id',
        name: 'Guest Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date('2020-01-01'),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .put('/api/v1/comparisons/guest/test-session-id')
        .send({ name: 'New Name' })
        .expect(410);

      expect(response.body.error).toBe('Guest comparison has expired');
    });

    test('should validate name is a string', async () => {
      const response = await request(app)
        .put('/api/v1/comparisons/guest/test-session-id')
        .send({ name: 123 })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /comparisons/guest/:sessionId/merge - Merge to user account', () => {
    test('should merge guest comparison to user account successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        sessionId: 'test-session-id',
        userId: null,
        name: 'Guest Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mergedMockComparison = {
        ...mockComparison,
        userId: 'test-user-id',
        sessionId: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.productComparison.update.mockResolvedValue(mergedMockComparison);

      const response = await request(app)
        .post('/api/v1/comparisons/guest/test-session-id/merge')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(200);

      expect(response.body.message).toBe('Guest comparison merged successfully');
      expect(response.body.comparison.userId).toBe('test-user-id');
      expect(response.body.comparison.sessionId).toBeNull();
    });

    test('should return 401 if user is not authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/comparisons/guest/test-session-id/merge')
        .send({})
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    test('should return 404 if guest comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/comparisons/guest/non-existent-session/merge')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(404);

      expect(response.body.error).toBe('Guest comparison not found');
    });

    test('should return 410 if guest comparison has expired', async () => {
      const mockComparison = {
        id: 'comparison-1',
        sessionId: 'test-session-id',
        userId: null,
        name: 'Guest Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date('2020-01-01'),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .post('/api/v1/comparisons/guest/test-session-id/merge')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(410);

      expect(response.body.error).toBe('Guest comparison has expired');
    });

    test('should return 400 if comparison already belongs to a user', async () => {
      const mockComparison = {
        id: 'comparison-1',
        sessionId: 'test-session-id',
        userId: 'existing-user-id',
        name: 'Guest Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .post('/api/v1/comparisons/guest/test-session-id/merge')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Comparison already belongs to a user account');
    });

    test('should extend expiration to 30 days when merged', async () => {
      const mockComparison = {
        id: 'comparison-1',
        sessionId: 'test-session-id',
        userId: null,
        name: 'Guest Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const now = Date.now();
      const expectedExpiration = new Date(now + 30 * 24 * 60 * 60 * 1000);

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.productComparison.update.mockImplementation((data) => {
        const expiresAt = data.data.expiresAt;
        expect(expiresAt.getTime()).toBeCloseTo(expectedExpiration.getTime(), 1000);
        return Promise.resolve({
          id: 'comparison-1',
          userId: 'test-user-id',
          sessionId: null,
          name: 'Guest Comparison',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt,
          items: [],
        });
      });

      await request(app)
        .post('/api/v1/comparisons/guest/test-session-id/merge')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(200);
    });
  });
});
