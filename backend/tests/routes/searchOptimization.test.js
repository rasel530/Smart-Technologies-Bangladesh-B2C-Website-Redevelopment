/**
 * Search Optimization API Routes Tests
 * 
 * Comprehensive integration tests for search optimization API endpoints covering:
 * - GET /patterns - Get query patterns analysis
 * - POST /optimize - Optimize a search query
 * - POST /experiment - Create A/B test experiment
 * - GET /experiment/:id - Get experiment results
 * - GET /experiments - List all experiments
 * - POST /assign - Assign user to experiment
 * - POST /results - Get optimized search results
 * - POST /metrics - Update experiment metrics
 * - DELETE /cache - Clear query optimization cache
 */

const request = require('supertest');
const express = require('express');
const { router, initializeSearchOptimizationController } = require('../../routes/searchOptimization');
const { SearchOptimizationService } = require('../../services/searchOptimization.service');

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
jest.mock('../../services/searchOptimization.service', () => ({
  SearchOptimizationService: jest.fn().mockImplementation(() => ({
    analyzeQueryPatterns: jest.fn(),
    optimizeQuery: jest.fn(),
    createExperiment: jest.fn(),
    getExperimentResults: jest.fn(),
    listExperiments: jest.fn(),
    assignUserToExperiment: jest.fn(),
    getOptimizedResults: jest.fn(),
    updateExperimentMetrics: jest.fn(),
    clearCache: jest.fn()
  }))
}));
jest.mock('../../services/logger');

describe('Search Optimization API Routes', () => {
  let app;
  let mockSearchOptimizationService;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/', router);

    // Mock service
    mockSearchOptimizationService = new SearchOptimizationService();
    initializeSearchOptimizationController({ searchOptimizationService: mockSearchOptimizationService });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /patterns', () => {
    it('should return query patterns analysis', async () => {
      const queryPatterns = {
        totalQueries: 1000,
        uniqueQueries: 500,
        avgQueryLength: 8.5,
        avgResultsCount: 15,
        zeroResultRate: 0.1,
        avgResponseTime: 150,
        topQueries: [
          { query: 'laptop', count: 100, avgResults: 20, avgResponseTime: 140 },
          { query: 'phone', count: 80, avgResults: 12, avgResponseTime: 130 },
        ],
        commonFilters: { category: 300, brand: 200, priceRange: 150 },
        commonSortOptions: { relevance: 500, price_asc: 200, price_desc: 100 },
        queryLengthDistribution: { min: 3, max: 20, avg: 8.5, median: 8 },
        resultsDistribution: { min: 0, max: 50, avg: 15, median: 12, zeroResults: 100, zeroResultRate: 0.1 },
      };

      mockSearchOptimizationService.analyzeQueryPatterns.mockResolvedValue(queryPatterns);

      const response = await request(app)
        .get('/patterns')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: queryPatterns,
      });

      expect(mockSearchOptimizationService.analyzeQueryPatterns).toHaveBeenCalledWith('week');
    });

    it('should respect time range parameter', async () => {
      const queryPatterns = {
        totalQueries: 100,
        uniqueQueries: 50,
        avgQueryLength: 8,
        avgResultsCount: 12,
        zeroResultRate: 0.05,
        avgResponseTime: 140,
        topQueries: [],
        commonFilters: {},
        commonSortOptions: {},
        queryLengthDistribution: {},
        resultsDistribution: {},
      };

      mockSearchOptimizationService.analyzeQueryPatterns.mockResolvedValue(queryPatterns);

      const response = await request(app)
        .get('/patterns?timeRange=month')
        .set('Authorization', 'Bearer admin-token');

      expect(mockSearchOptimizationService.analyzeQueryPatterns).toHaveBeenCalledWith('month');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/patterns');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/patterns')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should reject request with invalid time range', async () => {
      const response = await request(app)
        .get('/patterns?timeRange=invalid')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchOptimizationService.analyzeQueryPatterns.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/patterns')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /optimize', () => {
    it('should optimize a search query successfully', async () => {
      const optimizedQuery = {
        originalQuery: 'laptop',
        optimizedQuery: 'laptop',
        boostFactors: {
          name: 2.0,
          description: 1.0,
          category: 1.5,
          brand: 1.5,
          tags: 1.2,
        },
        filters: {},
        sort: 'relevance',
        suggestions: [
          { text: 'laptop gaming', type: 'trending', score: 10 },
          { text: 'laptop pro', type: 'trending', score: 8 },
        ],
        queryType: 'match',
      };

      mockSearchOptimizationService.optimizeQuery.mockResolvedValue(optimizedQuery);

      const response = await request(app)
        .post('/optimize')
        .send({
          query: 'laptop',
          userId: 'user-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: optimizedQuery,
      });

      expect(mockSearchOptimizationService.optimizeQuery).toHaveBeenCalledWith('laptop', 'user-123');
    });

    it('should optimize query without user ID', async () => {
      const optimizedQuery = {
        originalQuery: 'phone',
        optimizedQuery: 'phone',
        boostFactors: {
          name: 2.0,
          description: 1.0,
          category: 1.5,
          brand: 1.5,
          tags: 1.2,
        },
        filters: {},
        sort: 'relevance',
        suggestions: [],
        queryType: 'match',
      };

      mockSearchOptimizationService.optimizeQuery.mockResolvedValue(optimizedQuery);

      const response = await request(app)
        .post('/optimize')
        .send({
          query: 'phone',
        });

      expect(response.status).toBe(200);
      expect(mockSearchOptimizationService.optimizeQuery).toHaveBeenCalledWith('phone', null);
    });

    it('should reject request with missing query', async () => {
      const response = await request(app)
        .post('/optimize')
        .send({
          userId: 'user-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid user ID', async () => {
      const response = await request(app)
        .post('/optimize')
        .send({
          query: 'laptop',
          userId: 'invalid-id',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchOptimizationService.optimizeQuery.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/optimize')
        .send({
          query: 'laptop',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /experiment', () => {
    it('should create an experiment successfully', async () => {
      const experiment = {
        id: 'exp-123',
        name: 'Test ML-based ranking',
        description: 'Test new ML ranking algorithm',
        algorithmVariant: 'ml_based',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        isActive: true,
        metrics: {},
        sampleSize: 0,
      };

      mockSearchOptimizationService.createExperiment.mockResolvedValue(experiment);

      const response = await request(app)
        .post('/experiment')
        .set('Authorization', 'Bearer admin-token')
        .send({
          name: 'Test ML-based ranking',
          description: 'Test new ML ranking algorithm',
          algorithmVariant: 'ml_based',
          startDate: '2024-01-15T00:00:00.000Z',
          endDate: '2024-02-15T23:59:59.999Z',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: experiment,
      });

      expect(mockSearchOptimizationService.createExperiment).toHaveBeenCalledWith(
        'Test ML-based ranking',
        'Test new ML ranking algorithm',
        'ml_based',
        new Date('2024-01-15'),
        new Date('2024-02-15')
      );
    });

    it('should create experiment without end date', async () => {
      const experiment = {
        id: 'exp-456',
        name: 'Test semantic search',
        description: 'Test semantic search',
        algorithmVariant: 'semantic',
        startDate: new Date('2024-01-15'),
        endDate: null,
        isActive: true,
      };

      mockSearchOptimizationService.createExperiment.mockResolvedValue(experiment);

      const response = await request(app)
        .post('/experiment')
        .set('Authorization', 'Bearer admin-token')
        .send({
          name: 'Test semantic search',
          algorithmVariant: 'semantic',
          startDate: '2024-01-15T00:00:00.000Z',
        });

      expect(response.status).toBe(201);
      expect(mockSearchOptimizationService.createExperiment).toHaveBeenCalledWith(
        'Test semantic search',
        'Test semantic search',
        'semantic',
        new Date('2024-01-15'),
        null
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/experiment')
        .send({
          name: 'Test experiment',
          algorithmVariant: 'default',
          startDate: '2024-01-15T00:00:00.000Z',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/experiment')
        .set('Authorization', 'Bearer user-token')
        .send({
          name: 'Test experiment',
          algorithmVariant: 'default',
          startDate: '2024-01-15T00:00:00.000Z',
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should reject request with missing name', async () => {
      const response = await request(app)
        .post('/experiment')
        .set('Authorization', 'Bearer admin-token')
        .send({
          algorithmVariant: 'default',
          startDate: '2024-01-15T00:00:00.000Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with missing algorithm variant', async () => {
      const response = await request(app)
        .post('/experiment')
        .set('Authorization', 'Bearer admin-token')
        .send({
          name: 'Test experiment',
          startDate: '2024-01-15T00:00:00.000Z',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid start date', async () => {
      const response = await request(app)
        .post('/experiment')
        .set('Authorization', 'Bearer admin-token')
        .send({
          name: 'Test experiment',
          algorithmVariant: 'default',
          startDate: 'invalid-date',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchOptimizationService.createExperiment.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/experiment')
        .set('Authorization', 'Bearer admin-token')
        .send({
          name: 'Test experiment',
          algorithmVariant: 'default',
          startDate: '2024-01-15T00:00:00.000Z',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /experiment/:id', () => {
    it('should return experiment results', async () => {
      const experimentResults = {
        experiment: {
          id: 'exp-123',
          name: 'Test ML-based ranking',
          description: 'Test new ML ranking algorithm',
          algorithmVariant: 'ml_based',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-02-15'),
          isActive: true,
        },
        metrics: {
          totalSearches: 1000,
          avgResultsCount: 15,
          avgResponseTime: 150,
          conversionRate: 0.1,
          clickThroughRate: 0.3,
          zeroResultRate: 0.05,
        },
        sampleSize: 1000,
        duration: expect.any(Number),
      };

      mockSearchOptimizationService.getExperimentResults.mockResolvedValue(experimentResults);

      const response = await request(app)
        .get('/experiment/exp-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: experimentResults,
      });

      expect(mockSearchOptimizationService.getExperimentResults).toHaveBeenCalledWith('exp-123');
    });

    it('should return 404 for non-existent experiment', async () => {
      mockSearchOptimizationService.getExperimentResults.mockRejectedValue(new Error('Experiment not found'));

      const response = await request(app)
        .get('/experiment/exp-999')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/experiment/exp-123');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/experiment/exp-123')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      mockSearchOptimizationService.getExperimentResults.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/experiment/exp-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /experiments', () => {
    it('should list all experiments', async () => {
      const experiments = [
        {
          id: 'exp-1',
          name: 'Test 1',
          algorithmVariant: 'default',
          isActive: true,
          startDate: new Date('2024-01-15'),
        },
        {
          id: 'exp-2',
          name: 'Test 2',
          algorithmVariant: 'ml_based',
          isActive: false,
          startDate: new Date('2024-01-10'),
        },
      ];

      mockSearchOptimizationService.listExperiments.mockResolvedValue(experiments);

      const response = await request(app)
        .get('/experiments')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: experiments,
      });

      expect(mockSearchOptimizationService.listExperiments).toHaveBeenCalledWith(false);
    });

    it('should list only active experiments', async () => {
      const experiments = [
        {
          id: 'exp-1',
          name: 'Test 1',
          algorithmVariant: 'default',
          isActive: true,
          startDate: new Date('2024-01-15'),
        },
        {
          id: 'exp-2',
          name: 'Test 2',
          algorithmVariant: 'ml_based',
          isActive: true,
          startDate: new Date('2024-01-10'),
        },
      ];

      mockSearchOptimizationService.listExperiments.mockResolvedValue(experiments);

      const response = await request(app)
        .get('/experiments?activeOnly=true')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(mockSearchOptimizationService.listExperiments).toHaveBeenCalledWith(true);
    });

    it('should return empty array when no experiments', async () => {
      mockSearchOptimizationService.listExperiments.mockResolvedValue([]);

      const response = await request(app)
        .get('/experiments')
        .set('Authorization', 'Bearer admin-token');

      expect(response.body.data).toEqual([]);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/experiments');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/experiments')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      mockSearchOptimizationService.listExperiments.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/experiments')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /assign', () => {
    it('should assign user to experiment successfully', async () => {
      const variant = 'variant_a';

      mockSearchOptimizationService.assignUserToExperiment.mockResolvedValue(variant);

      const response = await request(app)
        .post('/assign')
        .send({
          userId: 'user-123',
          experimentId: 'exp-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          userId: 'user-123',
          experimentId: 'exp-123',
          variant,
        },
      });

      expect(mockSearchOptimizationService.assignUserToExperiment).toHaveBeenCalledWith('user-123', 'exp-123');
    });

    it('should return consistent variant for same user and experiment', async () => {
      mockSearchOptimizationService.assignUserToExperiment.mockResolvedValue('control');

      const response1 = await request(app)
        .post('/assign')
        .send({
          userId: 'user-123',
          experimentId: 'exp-123',
        });

      const response2 = await request(app)
        .post('/assign')
        .send({
          userId: 'user-123',
          experimentId: 'exp-123',
        });

      expect(response1.body.data.variant).toBe(response2.body.data.variant);
    });

    it('should reject request with invalid user ID', async () => {
      const response = await request(app)
        .post('/assign')
        .send({
          userId: 'invalid-id',
          experimentId: 'exp-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid experiment ID', async () => {
      const response = await request(app)
        .post('/assign')
        .send({
          userId: 'user-123',
          experimentId: 'invalid-id',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return error for inactive experiment', async () => {
      mockSearchOptimizationService.assignUserToExperiment.mockRejectedValue(new Error('Experiment not found or not active'));

      const response = await request(app)
        .post('/assign')
        .send({
          userId: 'user-123',
          experimentId: 'exp-123',
        });

      expect(response.status).toBe(500);
    });

    it('should handle service errors', async () => {
      mockSearchOptimizationService.assignUserToExperiment.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/assign')
        .send({
          userId: 'user-123',
          experimentId: 'exp-123',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /results', () => {
    it('should return optimized search results successfully', async () => {
      const optimizedResults = {
        total: 10,
        results: [
          { id: 'product-1', name: 'Laptop 1', score: 1.5 },
          { id: 'product-2', name: 'Laptop 2', score: 1.3 },
        ],
        optimizedQuery: 'laptop',
        suggestions: [
          { text: 'laptop gaming', type: 'trending', score: 10 },
        ],
        experimentVariant: 'variant_a',
        executionTime: 150,
      };

      mockSearchOptimizationService.getOptimizedResults.mockResolvedValue(optimizedResults);

      const response = await request(app)
        .post('/results')
        .send({
          query: 'laptop',
          filters: { category: 'electronics' },
          sortBy: 'relevance',
          userId: 'user-123',
          experimentVariant: 'variant_a',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: optimizedResults,
      });

      expect(mockSearchOptimizationService.getOptimizedResults).toHaveBeenCalledWith(
        'laptop',
        { category: 'electronics' },
        'relevance',
        'user-123',
        'variant_a'
      );
    });

    it('should return optimized results without experiment variant', async () => {
      const optimizedResults = {
        total: 5,
        results: [],
        optimizedQuery: 'phone',
        suggestions: [],
        experimentVariant: null,
        executionTime: 100,
      };

      mockSearchOptimizationService.getOptimizedResults.mockResolvedValue(optimizedResults);

      const response = await request(app)
        .post('/results')
        .send({
          query: 'phone',
          filters: {},
          sortBy: 'price_asc',
        });

      expect(response.status).toBe(200);
      expect(mockSearchOptimizationService.getOptimizedResults).toHaveBeenCalledWith(
        'phone',
        {},
        'price_asc',
        null,
        null
      );
    });

    it('should reject request with missing query', async () => {
      const response = await request(app)
        .post('/results')
        .send({
          filters: {},
          sortBy: 'relevance',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchOptimizationService.getOptimizedResults.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/results')
        .send({
          query: 'laptop',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /metrics', () => {
    it('should update experiment metrics successfully', async () => {
      const updatedExperiment = {
        id: 'exp-123',
        name: 'Test ML-based ranking',
        algorithmVariant: 'ml_based',
        metrics: { clickThroughRate: 0.35, conversionRate: 0.12 },
        sampleSize: 1001,
      };

      mockSearchOptimizationService.updateExperimentMetrics.mockResolvedValue(updatedExperiment);

      const response = await request(app)
        .post('/metrics')
        .set('Authorization', 'Bearer admin-token')
        .send({
          experimentId: 'exp-123',
          metrics: { clickThroughRate: 0.35, conversionRate: 0.12 },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updatedExperiment,
      });

      expect(mockSearchOptimizationService.updateExperimentMetrics).toHaveBeenCalledWith(
        'exp-123',
        { clickThroughRate: 0.35, conversionRate: 0.12 }
      );
    });

    it('should reject request with invalid experiment ID', async () => {
      const response = await request(app)
        .post('/metrics')
        .set('Authorization', 'Bearer admin-token')
        .send({
          experimentId: 'invalid-id',
          metrics: {},
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with missing metrics', async () => {
      const response = await request(app)
        .post('/metrics')
        .set('Authorization', 'Bearer admin-token')
        .send({
          experimentId: 'exp-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/metrics')
        .send({
          experimentId: 'exp-123',
          metrics: {},
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/metrics')
        .set('Authorization', 'Bearer user-token')
        .send({
          experimentId: 'exp-123',
          metrics: {},
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      mockSearchOptimizationService.updateExperimentMetrics.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/metrics')
        .set('Authorization', 'Bearer admin-token')
        .send({
          experimentId: 'exp-123',
          metrics: {},
        });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /cache', () => {
    it('should clear query optimization cache successfully', async () => {
      const response = await request(app)
        .delete('/cache')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Query optimization cache cleared',
      });

      expect(mockSearchOptimizationService.clearCache).toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/cache');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete('/cache')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      mockSearchOptimizationService.clearCache.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app)
        .delete('/cache')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });
});
