/**
 * Unit Tests for Comparison Routes (Authenticated Users)
 * 
 * Tests for all endpoints in backend/routes/comparisons.js including:
 * - POST /comparisons - Create comparison
 * - GET /comparisons - Get user comparisons
 * - GET /comparisons/:id - Get specific comparison
 * - PUT /comparisons/:id - Update comparison
 * - DELETE /comparisons/:id - Delete comparison
 * - POST /comparisons/:id/items - Add product to comparison
 * - DELETE /comparisons/:id/items/:itemId - Remove product from comparison
 * - GET /comparisons/:id/compare - Get comparison data
 * - POST /comparisons/:id/share - Share comparison
 * - POST /comparisons/:id/export - Export comparison
 * - GET /comparisons/:id/specifications - Get specification comparison
 * - GET /comparisons/:id/prices - Get price comparison
 * - GET /comparisons/:id/images - Get image comparison
 * - GET /comparisons/:id/differences - Highlight differences
 */

const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// Mock dependencies
jest.mock('../../middleware/auth', () => ({
  authMiddleware: {
    authenticate: jest.fn((req, res, next) => {
      req.user = { id: 'test-user-id', email: 'test@example.com' };
      next();
    }),
  },
}));

jest.mock('../../services/comparison.service', () => ({
  ComparisonService: jest.fn().mockImplementation(() => ({
    generateComparison: jest.fn(),
    getSpecificationComparison: jest.fn(),
    getPriceComparison: jest.fn(),
    getImageComparison: jest.fn(),
    getDifferencesHighlight: jest.fn(),
    createHistoryEntry: jest.fn(),
  })),
}));

const { ComparisonService } = require('../../services/comparison.service');
const comparisonRouter = require('../../routes/comparisons');

const app = express();
app.use(express.json());
app.use('/api/v1/comparisons', comparisonRouter);

describe('Comparison Routes (Authenticated)', () => {
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
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      productComparisonItem: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    jest.clearAllMocks();
  });

  describe('POST /comparisons - Create comparison', () => {
    test('should create comparison successfully with valid data', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
        .post('/api/v1/comparisons')
        .send({
          name: 'Test Comparison',
          productIds: ['product-1', 'product-2'],
        })
        .expect(201);

      expect(response.body.message).toBe('Comparison created successfully');
      expect(response.body.comparison).toBeDefined();
    });

    test('should return 404 if products not found', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'product-1', status: 'active', visibility: 'public' },
      ]);

      const response = await request(app)
        .post('/api/v1/comparisons')
        .send({
          name: 'Test Comparison',
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
        .post('/api/v1/comparisons')
        .send({
          name: 'Test Comparison',
          productIds: ['product-1', 'product-2'],
        })
        .expect(400);

      expect(response.body.error).toBe('Some products are not available for comparison');
    });

    test('should validate productIds is an array', async () => {
      const response = await request(app)
        .post('/api/v1/comparisons')
        .send({
          name: 'Test Comparison',
          productIds: 'not-an-array',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should validate productIds are valid UUIDs', async () => {
      const response = await request(app)
        .post('/api/v1/comparisons')
        .send({
          name: 'Test Comparison',
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
        userId: 'test-user-id',
        name: expect.stringContaining('Comparison'),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
        items: [],
      });

      await request(app)
        .post('/api/v1/comparisons')
        .send({
          productIds: ['product-1'],
        })
        .expect(201);
    });
  });

  describe('GET /comparisons - Get user comparisons', () => {
    test('should return user comparisons with pagination', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          userId: 'test-user-id',
          name: 'Comparison 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: [],
          _count: { items: 2 },
        },
        {
          id: 'comparison-2',
          userId: 'test-user-id',
          name: 'Comparison 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: [],
          _count: { items: 3 },
        },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.productComparison.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/v1/comparisons?page=1&limit=20')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.total).toBe(2);
    });

    test('should filter out expired comparisons by default', async () => {
      mockPrisma.productComparison.findMany.mockResolvedValue([]);
      mockPrisma.productComparison.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/v1/comparisons')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(0);
    });

    test('should include expired comparisons when requested', async () => {
      const mockComparisons = [
        {
          id: 'comparison-1',
          userId: 'test-user-id',
          name: 'Comparison 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date('2020-01-01'),
          items: [],
          _count: { items: 2 },
        },
      ];

      mockPrisma.productComparison.findMany.mockResolvedValue(mockComparisons);
      mockPrisma.productComparison.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/comparisons?includeExpired=true')
        .expect(200);

      expect(response.body.comparisons).toHaveLength(1);
    });

    test('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/comparisons?page=invalid&limit=invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /comparisons/:id - Get specific comparison', () => {
    test('should return comparison if user owns it', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1')
        .expect(200);

      expect(response.body.comparison).toBeDefined();
      expect(response.body.comparison.id).toBe('comparison-1');
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/comparisons/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    test('should validate comparison ID is valid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/comparisons/not-a-uuid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /comparisons/:id - Update comparison', () => {
    test('should update comparison name successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Old Name',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
        .put('/api/v1/comparisons/comparison-1')
        .send({ name: 'New Name' })
        .expect(200);

      expect(response.body.message).toBe('Comparison updated successfully');
      expect(response.body.comparison.name).toBe('New Name');
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/comparisons/non-existent-id')
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .put('/api/v1/comparisons/comparison-1')
        .send({ name: 'New Name' })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    test('should validate name is a string', async () => {
      const response = await request(app)
        .put('/api/v1/comparisons/comparison-1')
        .send({ name: 123 })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /comparisons/:id - Delete comparison', () => {
    test('should delete comparison successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.productComparison.delete.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/v1/comparisons/comparison-1')
        .expect(200);

      expect(response.body.message).toBe('Comparison deleted successfully');
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/comparisons/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .delete('/api/v1/comparisons/comparison-1')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /comparisons/:id/items - Add product to comparison', () => {
    test('should add product to comparison successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockProduct = {
        id: 'product-1',
        status: 'active',
        visibility: 'public',
      };

      const mockItem = {
        id: 'item-1',
        comparisonId: 'comparison-1',
        productId: 'product-1',
        addedAt: new Date(),
        notes: null,
        product: {
          id: 'product-1',
          name: 'Product 1',
          images: [],
          brand: { id: 'brand-1', name: 'Brand 1', slug: 'brand-1' },
        },
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.productComparisonItem.create.mockResolvedValue(mockItem);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/items')
        .send({ productId: 'product-1' })
        .expect(201);

      expect(response.body.message).toBe('Product added to comparison successfully');
      expect(response.body.item).toBeDefined();
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/comparisons/non-existent-id/items')
        .send({ productId: 'product-1' })
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/items')
        .send({ productId: 'product-1' })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });

    test('should return 409 if product already in comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [{ productId: 'product-1' }],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/items')
        .send({ productId: 'product-1' })
        .expect(409);

      expect(response.body.error).toBe('Product already in comparison');
    });

    test('should return 404 if product not found', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/items')
        .send({ productId: 'product-1' })
        .expect(404);

      expect(response.body.error).toBe('Product not found');
    });

    test('should return 400 if product is not available', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockProduct = {
        id: 'product-1',
        status: 'inactive',
        visibility: 'public',
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/items')
        .send({ productId: 'product-1' })
        .expect(400);

      expect(response.body.error).toBe('Product is not available for comparison');
    });
  });

  describe('DELETE /comparisons/:id/items/:itemId - Remove product from comparison', () => {
    test('should remove product from comparison successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockItem = {
        id: 'item-1',
        comparisonId: 'comparison-1',
        productId: 'product-1',
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.productComparisonItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.productComparisonItem.delete.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/v1/comparisons/comparison-1/items/item-1')
        .expect(200);

      expect(response.body.message).toBe('Product removed from comparison successfully');
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/comparisons/non-existent-id/items/item-1')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 404 if item not found', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.productComparisonItem.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/comparisons/comparison-1/items/non-existent-item')
        .expect(404);

      expect(response.body.error).toBe('Comparison item not found');
    });

    test('should return 403 if item does not belong to comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockItem = {
        id: 'item-1',
        comparisonId: 'comparison-2',
        productId: 'product-1',
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      mockPrisma.productComparisonItem.findUnique.mockResolvedValue(mockItem);

      const response = await request(app)
        .delete('/api/v1/comparisons/comparison-1/items/item-1')
        .expect(403);

      expect(response.body.error).toBe('Item does not belong to this comparison');
    });
  });

  describe('GET /comparisons/:id/compare - Get comparison data', () => {
    test('should return comparison data successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockComparisonData = {
        comparisonId: 'comparison-1',
        products: [],
        specifications: [],
        priceComparison: [],
        imageComparison: [],
        summary: {
          totalProducts: 0,
          priceRange: { min: 0, max: 0 },
          commonSpecs: [],
          differentSpecs: [],
          bestValueProduct: null,
        },
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      const comparisonServiceInstance = new ComparisonService();
      comparisonServiceInstance.generateComparison.mockResolvedValue(mockComparisonData);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/compare')
        .expect(200);

      expect(response.body).toEqual(mockComparisonData);
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/comparisons/non-existent-id/compare')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/compare')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /comparisons/:id/share - Share comparison', () => {
    test('should generate share link successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/share')
        .expect(200);

      expect(response.body.message).toBe('Comparison share link generated successfully');
      expect(response.body.shareUrl).toBeDefined();
      expect(response.body.shareToken).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/comparisons/non-existent-id/share')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/share')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /comparisons/:id/export - Export comparison', () => {
    test('should export comparison as JSON successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockComparisonData = {
        comparisonId: 'comparison-1',
        products: [],
        specifications: [],
        priceComparison: [],
        imageComparison: [],
        summary: {
          totalProducts: 0,
          priceRange: { min: 0, max: 0 },
          commonSpecs: [],
          differentSpecs: [],
          bestValueProduct: null,
        },
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      const comparisonServiceInstance = new ComparisonService();
      comparisonServiceInstance.generateComparison.mockResolvedValue(mockComparisonData);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/export')
        .send({ format: 'json' })
        .expect(200);

      expect(response.body.message).toBe('Comparison exported successfully');
      expect(response.body.data).toEqual(mockComparisonData);
    });

    test('should export comparison as CSV successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockComparisonData = {
        comparisonId: 'comparison-1',
        products: [
          {
            id: 'product-1',
            nameEn: 'Product 1',
            name: 'Product 1',
            regularPrice: 1000,
            salePrice: 900,
            brand: { name: 'Brand 1' },
          },
        ],
        specifications: [],
        priceComparison: [],
        imageComparison: [],
        summary: {
          totalProducts: 1,
          priceRange: { min: 900, max: 1000 },
          commonSpecs: [],
          differentSpecs: [],
          bestValueProduct: null,
        },
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      const comparisonServiceInstance = new ComparisonService();
      comparisonServiceInstance.generateComparison.mockResolvedValue(mockComparisonData);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/export')
        .send({ format: 'csv' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    test('should validate format parameter', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .post('/api/v1/comparisons/comparison-1/export')
        .send({ format: 'invalid-format' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /comparisons/:id/specifications - Get specification comparison', () => {
    test('should return specification comparison successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockSpecComparison = {
        comparisonId: 'comparison-1',
        specifications: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      const comparisonServiceInstance = new ComparisonService();
      comparisonServiceInstance.getSpecificationComparison.mockResolvedValue(mockSpecComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/specifications')
        .expect(200);

      expect(response.body).toEqual(mockSpecComparison);
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/comparisons/non-existent-id/specifications')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/specifications')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /comparisons/:id/prices - Get price comparison', () => {
    test('should return price comparison successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockPriceComparison = {
        comparisonId: 'comparison-1',
        priceComparison: [],
        priceRange: { min: 0, max: 0 },
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      const comparisonServiceInstance = new ComparisonService();
      comparisonServiceInstance.getPriceComparison.mockResolvedValue(mockPriceComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/prices')
        .expect(200);

      expect(response.body).toEqual(mockPriceComparison);
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/comparisons/non-existent-id/prices')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/prices')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /comparisons/:id/images - Get image comparison', () => {
    test('should return image comparison successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockImageComparison = {
        comparisonId: 'comparison-1',
        imageComparison: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      const comparisonServiceInstance = new ComparisonService();
      comparisonServiceInstance.getImageComparison.mockResolvedValue(mockImageComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/images')
        .expect(200);

      expect(response.body).toEqual(mockImageComparison);
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/comparisons/non-existent-id/images')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/images')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /comparisons/:id/differences - Highlight differences', () => {
    test('should return differences highlight successfully', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'test-user-id',
        name: 'Test Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      const mockDifferences = {
        comparisonId: 'comparison-1',
        differences: [],
        summary: {
          totalProducts: 0,
          priceRange: { min: 0, max: 0 },
          commonSpecs: [],
          differentSpecs: [],
          bestValueProduct: null,
        },
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);
      const comparisonServiceInstance = new ComparisonService();
      comparisonServiceInstance.getDifferencesHighlight.mockResolvedValue(mockDifferences);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/differences')
        .expect(200);

      expect(response.body).toEqual(mockDifferences);
    });

    test('should return 404 if comparison not found', async () => {
      mockPrisma.productComparison.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/comparisons/non-existent-id/differences')
        .expect(404);

      expect(response.body.error).toBe('Comparison not found');
    });

    test('should return 403 if user does not own comparison', async () => {
      const mockComparison = {
        id: 'comparison-1',
        userId: 'other-user-id',
        name: 'Other Comparison',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [],
      };

      mockPrisma.productComparison.findUnique.mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/v1/comparisons/comparison-1/differences')
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });
});
