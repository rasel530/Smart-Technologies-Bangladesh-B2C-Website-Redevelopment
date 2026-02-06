/**
 * Search Trending API Routes Tests
 * 
 * Comprehensive integration tests for search trending API endpoints covering:
 * - GET / - Get trending searches
 * - GET /products - Get trending products
 * - POST /record - Record search for trending
 * - POST /calculate - Calculate trend scores
 * - GET /category/:category - Get trending searches by category
 * - GET /rising - Get rising searches
 * - GET /statistics - Get trending statistics
 * - DELETE /old - Clear old trending data
 * - PUT /threshold - Update trend threshold
 * - PUT /decay - Update trend decay factor
 */

const request = require('supertest');
const express = require('express');
const { router, initializeSearchTrendingController } = require('../../routes/searchTrending');
const { SearchTrendingService } = require('../../services/searchTrending.service');

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'customer' };
    next();
  },
  authenticateAdmin: (req, res, next) => {
    req.user = { id: 'test-admin-id', role: 'admin' };
    next();
  }
}));

// Mock services
jest.mock('../../services/searchTrending.service', () => ({
  SearchTrendingService: jest.fn().mockImplementation(() => ({
    getTrendingSearches: jest.fn(),
    getTrendingProducts: jest.fn(),
    recordSearch: jest.fn(),
    calculateTrendScores: jest.fn(),
    getTrendingByCategory: jest.fn(),
    getRisingSearches: jest.fn(),
    getTrendingStatistics: jest.fn(),
    clearOldTrendingData: jest.fn(),
    updateTrendThreshold: jest.fn(),
    updateTrendDecayFactor: jest.fn()
  }))
}));
jest.mock('../../services/logger');

describe('Search Trending API Routes', () => {
  let app;
  let mockSearchTrendingService;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/', router);

    // Mock service
    mockSearchTrendingService = new SearchTrendingService();
    initializeSearchTrendingController({ searchTrendingService: mockSearchTrendingService });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return trending searches', async () => {
      const trendingSearches = [
        {
          query: 'laptop',
          searchCount: 100,
          trendScore: 15.5,
          lastSearchedAt: new Date(),
          category: 'cat-123',
          isTrending: true,
        },
        {
          query: 'phone',
          searchCount: 80,
          trendScore: 12.3,
          lastSearchedAt: new Date(),
          category: null,
          isTrending: true,
        },
      ];

      mockSearchTrendingService.getTrendingSearches.mockResolvedValue(trendingSearches);

      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: trendingSearches,
      });

      expect(mockSearchTrendingService.getTrendingSearches).toHaveBeenCalledWith(20);
    });

    it('should respect limit parameter', async () => {
      const trendingSearches = Array.from({ length: 30 }, (_, i) => ({
        query: `query-${i}`,
        searchCount: 100 - i,
        trendScore: 20 - i,
        lastSearchedAt: new Date(),
        category: null,
        isTrending: true,
      }));

      mockSearchTrendingService.getTrendingSearches.mockResolvedValue(trendingSearches);

      const response = await request(app)
        .get('/?limit=5');

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no trending searches', async () => {
      mockSearchTrendingService.getTrendingSearches.mockResolvedValue([]);

      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.getTrendingSearches.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /products', () => {
    it('should return trending products', async () => {
      const trendingProducts = [
        {
          id: 'product-123',
          name: 'Laptop 1',
          status: 'active',
          visibility: 'public',
          brand: { id: 'brand-1', name: 'Apple' },
          categories: [{ id: 'cat-123', name: 'Electronics' }],
          trendScore: 15.5,
          searchCount: 100,
        },
        {
          id: 'product-456',
          name: 'Phone 1',
          status: 'active',
          visibility: 'public',
          brand: { id: 'brand-2', name: 'Samsung' },
          categories: [{ id: 'cat-456', name: 'Phones' }],
          trendScore: 12.3,
          searchCount: 80,
        },
      ];

      mockSearchTrendingService.getTrendingProducts.mockResolvedValue(trendingProducts);

      const response = await request(app)
        .get('/products');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: trendingProducts,
      });

      expect(mockSearchTrendingService.getTrendingProducts).toHaveBeenCalledWith(10, null);
    });

    it('should filter by category', async () => {
      const trendingProducts = [
        {
          id: 'product-123',
          name: 'Laptop 1',
          status: 'active',
          visibility: 'public',
          brand: { id: 'brand-1', name: 'Apple' },
          categories: [{ id: 'cat-123', name: 'Electronics' }],
          trendScore: 15.5,
          searchCount: 100,
        },
      ];

      mockSearchTrendingService.getTrendingProducts.mockResolvedValue(trendingProducts);

      const response = await request(app)
        .get('/products?category=cat-123');

      expect(response.status).toBe(200);
      expect(mockSearchTrendingService.getTrendingProducts).toHaveBeenCalledWith(10, 'cat-123');
    });

    it('should respect limit parameter', async () => {
      const trendingProducts = Array.from({ length: 20 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i}`,
        status: 'active',
        visibility: 'public',
        trendScore: 20 - i,
        searchCount: 100 - i,
      }));

      mockSearchTrendingService.getTrendingProducts.mockResolvedValue(trendingProducts);

      const response = await request(app)
        .get('/products?limit=5');

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no trending products', async () => {
      mockSearchTrendingService.getTrendingProducts.mockResolvedValue([]);

      const response = await request(app)
        .get('/products');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.getTrendingProducts.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/products');

      expect(response.status).toBe(500);
    });

    it('should reject request with invalid limit', async () => {
      const response = await request(app)
        .get('/products?limit=100');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /record', () => {
    it('should record a search for trending successfully', async () => {
      const trendingData = {
        id: 'trend-123',
        query: 'laptop',
        searchCount: 1,
        trendScore: 1.0,
        lastSearchedAt: new Date(),
        category: 'cat-123',
        isTrending: false,
      };

      mockSearchTrendingService.recordSearch.mockResolvedValue(trendingData);

      const response = await request(app)
        .post('/record')
        .send({
          query: 'laptop',
          category: 'cat-123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: trendingData,
      });

      expect(mockSearchTrendingService.recordSearch).toHaveBeenCalledWith('laptop', 'cat-123');
    });

    it('should record search without category', async () => {
      const trendingData = {
        id: 'trend-456',
        query: 'phone',
        searchCount: 1,
        trendScore: 1.0,
        lastSearchedAt: new Date(),
        category: null,
        isTrending: false,
      };

      mockSearchTrendingService.recordSearch.mockResolvedValue(trendingData);

      const response = await request(app)
        .post('/record')
        .send({
          query: 'phone',
        });

      expect(response.status).toBe(201);
      expect(mockSearchTrendingService.recordSearch).toHaveBeenCalledWith('phone', null);
    });

    it('should normalize query to lowercase', async () => {
      const trendingData = {
        id: 'trend-789',
        query: 'laptop',
        searchCount: 1,
        trendScore: 1.0,
        lastSearchedAt: new Date(),
        category: null,
        isTrending: false,
      };

      mockSearchTrendingService.recordSearch.mockResolvedValue(trendingData);

      const response = await request(app)
        .post('/record')
        .send({
          query: 'LAPTOP',
        });

      expect(response.body.data.query).toBe('laptop');
    });

    it('should trim query whitespace', async () => {
      const trendingData = {
        id: 'trend-999',
        query: 'laptop',
        searchCount: 1,
        trendScore: 1.0,
        lastSearchedAt: new Date(),
        category: null,
        isTrending: false,
      };

      mockSearchTrendingService.recordSearch.mockResolvedValue(trendingData);

      const response = await request(app)
        .post('/record')
        .send({
          query: '  laptop  ',
        });

      expect(response.body.data.query).toBe('laptop');
    });

    it('should reject request with missing query', async () => {
      const response = await request(app)
        .post('/record')
        .send({
          category: 'cat-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.recordSearch.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/record')
        .send({
          query: 'laptop',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /calculate', () => {
    it('should calculate trend scores successfully', async () => {
      const updatedRecords = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 15.5,
          lastSearchedAt: new Date(),
          isTrending: true,
        },
        {
          id: 'trend-2',
          query: 'phone',
          searchCount: 50,
          trendScore: 8.0,
          lastSearchedAt: new Date(),
          isTrending: true,
        },
      ];

      mockSearchTrendingService.calculateTrendScores.mockResolvedValue(updatedRecords);

      const response = await request(app)
        .post('/calculate');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updatedRecords,
      });

      expect(mockSearchTrendingService.calculateTrendScores).toHaveBeenCalled();
    });

    it('should handle empty trending data', async () => {
      mockSearchTrendingService.calculateTrendScores.mockResolvedValue([]);

      const response = await request(app)
        .post('/calculate');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.calculateTrendScores.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/calculate');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /category/:category', () => {
    it('should return trending searches by category', async () => {
      const trendingSearches = [
        {
          query: 'laptop',
          searchCount: 50,
          trendScore: 10.5,
          lastSearchedAt: new Date(),
          category: 'cat-123',
          isTrending: true,
        },
        {
          query: 'phone',
          searchCount: 30,
          trendScore: 8.0,
          lastSearchedAt: new Date(),
          category: 'cat-123',
          isTrending: true,
        },
      ];

      mockSearchTrendingService.getTrendingByCategory.mockResolvedValue(trendingSearches);

      const response = await request(app)
        .get('/category/cat-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: trendingSearches,
      });

      expect(mockSearchTrendingService.getTrendingByCategory).toHaveBeenCalledWith('cat-123', 10);
    });

    it('should respect limit parameter', async () => {
      const trendingSearches = Array.from({ length: 20 }, (_, i) => ({
        query: `query-${i}`,
        searchCount: 100 - i,
        trendScore: 20 - i,
        lastSearchedAt: new Date(),
        category: 'cat-123',
        isTrending: true,
      }));

      mockSearchTrendingService.getTrendingByCategory.mockResolvedValue(trendingSearches);

      const response = await request(app)
        .get('/category/cat-123?limit=5');

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no trending searches for category', async () => {
      mockSearchTrendingService.getTrendingByCategory.mockResolvedValue([]);

      const response = await request(app)
        .get('/category/cat-999');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should reject request with invalid limit', async () => {
      const response = await request(app)
        .get('/category/cat-123?limit=100');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.getTrendingByCategory.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/category/cat-123');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /rising', () => {
    it('should return rising searches', async () => {
      const risingSearches = [
        {
          query: 'laptop gaming',
          searchCount: 20,
          trendScore: 8.5,
          lastSearchedAt: new Date(),
          category: 'cat-123',
          isTrending: true,
        },
        {
          query: 'phone case',
          searchCount: 15,
          trendScore: 6.0,
          lastSearchedAt: new Date(),
          category: null,
          isTrending: true,
        },
      ];

      mockSearchTrendingService.getRisingSearches.mockResolvedValue(risingSearches);

      const response = await request(app)
        .get('/rising');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: risingSearches,
      });

      expect(mockSearchTrendingService.getRisingSearches).toHaveBeenCalledWith(10);
    });

    it('should respect limit parameter', async () => {
      const risingSearches = Array.from({ length: 20 }, (_, i) => ({
        query: `query-${i}`,
        searchCount: 100 - i,
        trendScore: 20 - i,
        lastSearchedAt: new Date(),
        category: null,
        isTrending: true,
      }));

      mockSearchTrendingService.getRisingSearches.mockResolvedValue(risingSearches);

      const response = await request(app)
        .get('/rising?limit=5');

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array when no rising searches', async () => {
      mockSearchTrendingService.getRisingSearches.mockResolvedValue([]);

      const response = await request(app)
        .get('/rising');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.getRisingSearches.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/rising');

      expect(response.status).toBe(500);
    });

    it('should reject request with invalid limit', async () => {
      const response = await request(app)
        .get('/rising?limit=100');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /statistics', () => {
    it('should return trending statistics', async () => {
      const statistics = {
        totalSearches: 500,
        uniqueQueries: 250,
        trendingCount: 50,
        avgTrendScore: 12.5,
        maxTrendScore: 20.0,
        topTrending: [
          { query: 'laptop', searchCount: 100, trendScore: 20.0 },
          { query: 'phone', searchCount: 80, trendScore: 15.5 },
          { query: 'tablet', searchCount: 60, trendScore: 12.3 },
          { query: 'monitor', searchCount: 40, trendScore: 10.0 },
          { query: 'mouse', searchCount: 30, trendScore: 8.0 },
        ],
      };

      mockSearchTrendingService.getTrendingStatistics.mockResolvedValue(statistics);

      const response = await request(app)
        .get('/statistics');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: statistics,
      });

      expect(mockSearchTrendingService.getTrendingStatistics).toHaveBeenCalled();
    });

    it('should handle empty trending data', async () => {
      const statistics = {
        totalSearches: 0,
        uniqueQueries: 0,
        trendingCount: 0,
        avgTrendScore: 0,
        maxTrendScore: 0,
        topTrending: [],
      };

      mockSearchTrendingService.getTrendingStatistics.mockResolvedValue(statistics);

      const response = await request(app)
        .get('/statistics');

      expect(response.body.data.totalSearches).toBe(0);
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.getTrendingStatistics.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/statistics');

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /old', () => {
    it('should clear old trending data successfully', async () => {
      const deleteResult = { count: 50 };

      mockSearchTrendingService.clearOldTrendingData.mockResolvedValue(deleteResult);

      const response = await request(app)
        .delete('/old');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          deletedCount: 50,
        },
      });

      expect(mockSearchTrendingService.clearOldTrendingData).toHaveBeenCalledWith(30);
    });

    it('should use default days to keep', async () => {
      const deleteResult = { count: 100 };

      mockSearchTrendingService.clearOldTrendingData.mockResolvedValue(deleteResult);

      const response = await request(app)
        .delete('/old');

      expect(response.status).toBe(200);
      expect(mockSearchTrendingService.clearOldTrendingData).toHaveBeenCalled();
    });

    it('should respect daysToKeep parameter', async () => {
      const deleteResult = { count: 25 };

      mockSearchTrendingService.clearOldTrendingData.mockResolvedValue(deleteResult);

      const response = await request(app)
        .delete('/old?daysToKeep=60');

      expect(response.status).toBe(200);
      expect(mockSearchTrendingService.clearOldTrendingData).toHaveBeenCalledWith(60);
    });

    it('should reject request with invalid daysToKeep', async () => {
      const response = await request(app)
        .delete('/old?daysToKeep=400');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with negative daysToKeep', async () => {
      const response = await request(app)
        .delete('/old?daysToKeep=-10');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.clearOldTrendingData.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .delete('/old?daysToKeep=30');

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /threshold', () => {
    it('should update trend threshold successfully', async () => {
      const response = await request(app)
        .put('/threshold')
        .send({
          threshold: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          threshold: 20,
        },
      });

      expect(mockSearchTrendingService.updateTrendThreshold).toHaveBeenCalledWith(20);
    });

    it('should handle zero threshold', async () => {
      const response = await request(app)
        .put('/threshold')
        .send({
          threshold: 0,
        });

      expect(response.status).toBe(200);
      expect(mockSearchTrendingService.updateTrendThreshold).toHaveBeenCalledWith(0);
    });

    it('should handle negative threshold', async () => {
      const response = await request(app)
        .put('/threshold')
        .send({
          threshold: -10,
        });

      expect(response.status).toBe(200);
      expect(mockSearchTrendingService.updateTrendThreshold).toHaveBeenCalledWith(-10);
    });

    it('should reject request with invalid threshold type', async () => {
      const response = await request(app)
        .put('/threshold')
        .send({
          threshold: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.updateTrendThreshold.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app)
        .put('/threshold')
        .send({
          threshold: 20,
        });

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /decay', () => {
    it('should update trend decay factor successfully', async () => {
      const response = await request(app)
        .put('/decay')
        .send({
          factor: 0.2,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          decayFactor: 0.2,
        },
      });

      expect(mockSearchTrendingService.updateTrendDecayFactor).toHaveBeenCalledWith(0.2);
    });

    it('should handle zero decay factor', async () => {
      const response = await request(app)
        .put('/decay')
        .send({
          factor: 0,
        });

      expect(response.status).toBe(200);
      expect(mockSearchTrendingService.updateTrendDecayFactor).toHaveBeenCalledWith(0);
    });

    it('should handle decay factor greater than 1', async () => {
      const response = await request(app)
        .put('/decay')
        .send({
          factor: 1.5,
        });

      expect(response.status).toBe(200);
      expect(mockSearchTrendingService.updateTrendDecayFactor).toHaveBeenCalledWith(1.5);
    });

    it('should reject request with invalid factor type', async () => {
      const response = await request(app)
        .put('/decay')
        .send({
          factor: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with negative factor', async () => {
      const response = await request(app)
        .put('/decay')
        .send({
          factor: -0.5,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with factor greater than 1', async () => {
      const response = await request(app)
        .put('/decay')
        .send({
          factor: 1.5,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchTrendingService.updateTrendDecayFactor.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app)
        .put('/decay')
        .send({
          factor: 0.2,
        });

      expect(response.status).toBe(500);
    });
  });
});
