/**
 * Search Optimization Service Tests
 * 
 * Comprehensive unit tests for SearchOptimizationService covering:
 * - Query pattern analysis
 * - Query optimization
 * - A/B testing experiments
 * - Experiment results
 * - Query suggestions
 * - Cache management
 * - Boost factor calculation
 */

const { SearchOptimizationService } = require('../../services/searchOptimization.service');

// Mock logger and elasticsearchQueryBuilder
jest.mock('../../services/logger');
jest.mock('../../services/elasticsearchQueryBuilder');

describe('SearchOptimizationService', () => {
  let searchOptimizationService;
  let mockPrisma;
  let mockElasticsearchClient;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      searchAnalytics: {
        findMany: jest.fn(),
      },
      searchOptimizationExperiments: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      userSearchPreferences: {
        findUnique: jest.fn(),
      },
      searchTrending: {
        findMany: jest.fn(),
      },
    };

    // Mock Elasticsearch client
    mockElasticsearchClient = {
      search: jest.fn(),
    };

    searchOptimizationService = new SearchOptimizationService(mockPrisma, mockElasticsearchClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeQueryPatterns', () => {
    it('should analyze query patterns for a time range', async () => {
      const searchAnalytics = [
        {
          id: 'search-1',
          query: 'laptop',
          resultsCount: 10,
          responseTime: 150,
          filtersApplied: { category: 'electronics', priceRange: [100, 1000] },
          sortBy: 'relevance',
          timestamp: new Date('2024-01-15'),
        },
        {
          id: 'search-2',
          query: 'phone',
          resultsCount: 5,
          responseTime: 100,
          filtersApplied: { brand: 'Apple' },
          sortBy: 'price_asc',
          timestamp: new Date('2024-01-16'),
        },
        {
          id: 'search-3',
          query: 'laptop gaming',
          resultsCount: 8,
          responseTime: 180,
          filtersApplied: {},
          sortBy: null,
          timestamp: new Date('2024-01-17'),
        },
      ];

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(searchAnalytics);

      const result = await searchOptimizationService.analyzeQueryPatterns('week');

      expect(mockPrisma.searchAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: expect.any(Date),
          },
        },
      });

      expect(result).toBeDefined();
      expect(result.totalQueries).toBe(3);
      expect(result.uniqueQueries).toBe(2);
      expect(result.avgQueryLength).toBeGreaterThan(0);
      expect(result.avgResultsCount).toBeGreaterThan(0);
      expect(result.topQueries).toBeDefined();
      expect(result.commonFilters).toBeDefined();
      expect(result.commonSortOptions).toBeDefined();
    });

    it('should handle empty analytics data', async () => {
      mockPrisma.searchAnalytics.findMany.mockResolvedValue([]);

      const result = await searchOptimizationService.analyzeQueryPatterns('week');

      expect(result.totalQueries).toBe(0);
      expect(result.uniqueQueries).toBe(0);
      expect(result.avgQueryLength).toBe(0);
      expect(result.avgResultsCount).toBe(0);
    });

    it('should calculate correct average query length', async () => {
      const searchAnalytics = [
        { query: 'laptop', resultsCount: 10, responseTime: 150, filtersApplied: {}, sortBy: null, timestamp: new Date() },
        { query: 'phone', resultsCount: 5, responseTime: 100, filtersApplied: {}, sortBy: null, timestamp: new Date() },
        { query: 'tablet', resultsCount: 8, responseTime: 120, filtersApplied: {}, sortBy: null, timestamp: new Date() },
      ];

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(searchAnalytics);

      const result = await searchOptimizationService.analyzeQueryPatterns('week');

      expect(result.avgQueryLength).toBe(5); // (6 + 5 + 6) / 3 = 5.67, but integer division
    });

    it('should calculate zero result rate', async () => {
      const searchAnalytics = [
        { query: 'laptop', resultsCount: 10, responseTime: 150, filtersApplied: {}, sortBy: null, timestamp: new Date() },
        { query: 'phone', resultsCount: 0, responseTime: 100, filtersApplied: {}, sortBy: null, timestamp: new Date() },
        { query: 'tablet', resultsCount: 5, responseTime: 120, filtersApplied: {}, sortBy: null, timestamp: new Date() },
      ];

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(searchAnalytics);

      const result = await searchOptimizationService.analyzeQueryPatterns('week');

      expect(result.zeroResultRate).toBeCloseTo(0.333, 2);
    });

    it('should handle different time ranges', async () => {
      const timeRanges = ['hour', 'day', 'week', 'month'];

      for (const range of timeRanges) {
        mockPrisma.searchAnalytics.findMany.mockResolvedValue([]);

        await searchOptimizationService.analyzeQueryPatterns(range);

        expect(mockPrisma.searchAnalytics.findMany).toHaveBeenCalled();
      }
    });
  });

  describe('optimizeQuery', () => {
    it('should optimize a query with user preferences', async () => {
      const userPreferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1'],
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(userPreferences);

      const result = await searchOptimizationService.optimizeQuery('laptop', 'user-123');

      expect(result).toBeDefined();
      expect(result.originalQuery).toBe('laptop');
      expect(result.boostFactors).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.queryType).toBeDefined();
    });

    it('should return cached query optimization', async () => {
      // First call
      const result1 = await searchOptimizationService.optimizeQuery('laptop', 'user-123');
      
      // Second call should use cache
      const result2 = await searchOptimizationService.optimizeQuery('laptop', 'user-123');

      expect(result1).toEqual(result2);
    });

    it('should handle query without user ID', async () => {
      const result = await searchOptimizationService.optimizeQuery('laptop', null);

      expect(result).toBeDefined();
      expect(result.originalQuery).toBe('laptop');
      expect(result.boostFactors).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.userSearchPreferences.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await searchOptimizationService.optimizeQuery('laptop', 'user-123');

      // Should return fallback optimization
      expect(result).toBeDefined();
      expect(result.originalQuery).toBe('laptop');
    });

    it('should determine correct query type', async () => {
      const booleanQuery = await searchOptimizationService.optimizeQuery('laptop AND phone', null);
      expect(booleanQuery.queryType).toBe('bool');

      const phraseQuery = await searchOptimizationService.optimizeQuery('"laptop gaming"', null);
      expect(phraseQuery.queryType).toBe('phrase');

      const wildcardQuery = await searchOptimizationService.optimizeQuery('lapt*', null);
      expect(wildcardQuery.queryType).toBe('wildcard');

      const fuzzyQuery = await searchOptimizationService.optimizeQuery('laptop~', null);
      expect(fuzzyQuery.queryType).toBe('fuzzy');
    });
  });

  describe('createExperiment', () => {
    it('should create an A/B testing experiment', async () => {
      const experimentData = {
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

      mockPrisma.searchOptimizationExperiments.create.mockResolvedValue(experimentData);

      const result = await searchOptimizationService.createExperiment(
        'Test ML-based ranking',
        'Test new ML ranking algorithm',
        'ml_based',
        new Date('2024-01-15'),
        new Date('2024-02-15')
      );

      expect(mockPrisma.searchOptimizationExperiments.create).toHaveBeenCalledWith({
        data: {
          name: 'Test ML-based ranking',
          description: 'Test new ML ranking algorithm',
          algorithmVariant: 'ml_based',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-02-15'),
          isActive: true,
          metrics: {},
          sampleSize: 0,
        },
      });

      expect(result).toEqual(experimentData);
    });

    it('should create experiment without end date', async () => {
      const experimentData = {
        id: 'exp-456',
        name: 'Test semantic search',
        description: 'Test semantic search',
        algorithmVariant: 'semantic',
        startDate: new Date('2024-01-15'),
        endDate: null,
        isActive: true,
        metrics: {},
        sampleSize: 0,
      };

      mockPrisma.searchOptimizationExperiments.create.mockResolvedValue(experimentData);

      const result = await searchOptimizationService.createExperiment(
        'Test semantic search',
        'Test semantic search',
        'semantic',
        new Date('2024-01-15'),
        null
      );

      expect(result.endDate).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchOptimizationExperiments.create.mockRejectedValue(error);

      await expect(
        searchOptimizationService.createExperiment(
          'Test experiment',
          'Description',
          'default',
          new Date()
        )
      ).rejects.toThrow('Database error');
    });
  });

  describe('getExperimentResults', () => {
    it('should retrieve experiment results', async () => {
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

      const analytics = [
        { id: 'search-1', query: 'laptop', resultsCount: 10, responseTime: 150, conversionType: 'purchase', clickedResults: [], timestamp: new Date() },
        { id: 'search-2', query: 'phone', resultsCount: 5, responseTime: 100, conversionType: null, clickedResults: [], timestamp: new Date() },
      ];

      mockPrisma.searchOptimizationExperiments.findUnique.mockResolvedValue(experiment);
      mockPrisma.searchAnalytics.findMany.mockResolvedValue(analytics);

      const result = await searchOptimizationService.getExperimentResults('exp-123');

      expect(mockPrisma.searchOptimizationExperiments.findUnique).toHaveBeenCalledWith({
        where: { id: 'exp-123' },
      });

      expect(result).toBeDefined();
      expect(result.experiment).toEqual(experiment);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalSearches).toBe(2);
    });

    it('should throw error for non-existent experiment', async () => {
      mockPrisma.searchOptimizationExperiments.findUnique.mockResolvedValue(null);

      await expect(
        searchOptimizationService.getExperimentResults('exp-999')
      ).rejects.toThrow('Experiment not found');
    });

    it('should calculate experiment metrics correctly', async () => {
      const experiment = {
        id: 'exp-123',
        name: 'Test',
        algorithmVariant: 'ml_based',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        isActive: true,
      };

      const analytics = [
        { resultsCount: 10, responseTime: 150, conversionType: 'purchase', clickedResults: [{}, {}], timestamp: new Date() },
        { resultsCount: 5, responseTime: 100, conversionType: null, clickedResults: [], timestamp: new Date() },
        { resultsCount: 0, responseTime: 80, conversionType: 'add_to_cart', clickedResults: [{}], timestamp: new Date() },
      ];

      mockPrisma.searchOptimizationExperiments.findUnique.mockResolvedValue(experiment);
      mockPrisma.searchAnalytics.findMany.mockResolvedValue(analytics);

      const result = await searchOptimizationService.getExperimentResults('exp-123');

      expect(result.metrics.avgResultsCount).toBe(5);
      expect(result.metrics.avgResponseTime).toBe(110);
      expect(result.metrics.conversionRate).toBeCloseTo(0.666, 2);
      expect(result.metrics.clickThroughRate).toBeCloseTo(0.666, 2);
    });
  });

  describe('assignUserToExperiment', () => {
    it('should assign user to experiment variant', async () => {
      const experiment = {
        id: 'exp-123',
        name: 'Test',
        algorithmVariant: 'ml_based',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        isActive: true,
      };

      mockPrisma.searchOptimizationExperiments.findUnique.mockResolvedValue(experiment);

      const variant = await searchOptimizationService.assignUserToExperiment('user-123', 'exp-123');

      expect(variant).toBeDefined();
      expect(['control', 'variant_a', 'variant_b']).toContain(variant);
    });

    it('should throw error for inactive experiment', async () => {
      const experiment = {
        id: 'exp-123',
        name: 'Test',
        algorithmVariant: 'ml_based',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        isActive: false,
      };

      mockPrisma.searchOptimizationExperiments.findUnique.mockResolvedValue(experiment);

      await expect(
        searchOptimizationService.assignUserToExperiment('user-123', 'exp-123')
      ).rejects.toThrow('Experiment not found or not active');
    });

    it('should throw error for non-existent experiment', async () => {
      mockPrisma.searchOptimizationExperiments.findUnique.mockResolvedValue(null);

      await expect(
        searchOptimizationService.assignUserToExperiment('user-123', 'exp-999')
      ).rejects.toThrow('Experiment not found or not active');
    });

    it('should assign consistent variant for same user and experiment', async () => {
      const experiment = {
        id: 'exp-123',
        name: 'Test',
        algorithmVariant: 'ml_based',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        isActive: true,
      };

      mockPrisma.searchOptimizationExperiments.findUnique.mockResolvedValue(experiment);

      const variant1 = await searchOptimizationService.assignUserToExperiment('user-123', 'exp-123');
      const variant2 = await searchOptimizationService.assignUserToExperiment('user-123', 'exp-123');

      expect(variant1).toBe(variant2);
    });
  });

  describe('listExperiments', () => {
    it('should list all experiments', async () => {
      const experiments = [
        { id: 'exp-1', name: 'Test 1', isActive: true },
        { id: 'exp-2', name: 'Test 2', isActive: false },
      ];

      mockPrisma.searchOptimizationExperiments.findMany.mockResolvedValue(experiments);

      const result = await searchOptimizationService.listExperiments(false);

      expect(mockPrisma.searchOptimizationExperiments.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { startDate: 'desc' },
      });

      expect(result).toHaveLength(2);
    });

    it('should list only active experiments', async () => {
      const experiments = [
        { id: 'exp-1', name: 'Test 1', isActive: true },
        { id: 'exp-2', name: 'Test 2', isActive: true },
        { id: 'exp-3', name: 'Test 3', isActive: false },
      ];

      mockPrisma.searchOptimizationExperiments.findMany.mockResolvedValue(experiments);

      const result = await searchOptimizationService.listExperiments(true);

      expect(mockPrisma.searchOptimizationExperiments.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { startDate: 'desc' },
      });

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no experiments', async () => {
      mockPrisma.searchOptimizationExperiments.findMany.mockResolvedValue([]);

      const result = await searchOptimizationService.listExperiments();

      expect(result).toEqual([]);
    });
  });

  describe('updateExperimentMetrics', () => {
    it('should update experiment metrics', async () => {
      const updatedExperiment = {
        id: 'exp-123',
        name: 'Test',
        metrics: { clickThroughRate: 0.5, conversionRate: 0.1 },
        sampleSize: 1000,
      };

      mockPrisma.searchOptimizationExperiments.update.mockResolvedValue(updatedExperiment);

      const result = await searchOptimizationService.updateExperimentMetrics('exp-123', {
        clickThroughRate: 0.5,
        conversionRate: 0.1,
      });

      expect(mockPrisma.searchOptimizationExperiments.update).toHaveBeenCalledWith({
        where: { id: 'exp-123' },
        data: {
          metrics: { clickThroughRate: 0.5, conversionRate: 0.1 },
          sampleSize: {
            increment: 1,
          },
        },
      });

      expect(result).toEqual(updatedExperiment);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchOptimizationExperiments.update.mockRejectedValue(error);

      await expect(
        searchOptimizationService.updateExperimentMetrics('exp-123', {})
      ).rejects.toThrow('Database error');
    });
  });

  describe('generateQuerySuggestions', () => {
    it('should generate query suggestions from trending searches', async () => {
      const trendingSearches = [
        { id: 'trend-1', query: 'laptop gaming', trendScore: 10, isTrending: true },
        { id: 'trend-2', query: 'phone case', trendScore: 8, isTrending: true },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(trendingSearches);

      const suggestions = await searchOptimizationService.generateQuerySuggestions('laptop');

      expect(mockPrisma.searchTrending.findMany).toHaveBeenCalledWith({
        where: {
          query: {
            contains: 'laptop',
          },
          isTrending: true,
        },
        orderBy: {
          trendScore: 'desc',
        },
        take: 5,
      });

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty array when no suggestions', async () => {
      mockPrisma.searchTrending.findMany.mockResolvedValue([]);

      const suggestions = await searchOptimizationService.generateQuerySuggestions('nonexistent');

      expect(suggestions).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.searchTrending.findMany.mockRejectedValue(new Error('Database error'));

      const suggestions = await searchOptimizationService.generateQuerySuggestions('laptop');

      expect(suggestions).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('should clear the query cache', () => {
      // Add some items to cache
      searchOptimizationService.queryCache.set('key1', { data: 'value1', timestamp: Date.now() });
      searchOptimizationService.queryCache.set('key2', { data: 'value2', timestamp: Date.now() });

      expect(searchOptimizationService.queryCache.size).toBe(2);

      searchOptimizationService.clearCache();

      expect(searchOptimizationService.queryCache.size).toBe(0);
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average of numbers', () => {
      const values = [100, 150, 200, 250, 300];
      const average = searchOptimizationService.calculateAverage(values);

      expect(average).toBe(200);
    });

    it('should return 0 for empty array', () => {
      const average = searchOptimizationService.calculateAverage([]);

      expect(average).toBe(0);
    });

    it('should handle decimal values', () => {
      const average = searchOptimizationService.calculateAverage([100.5, 200.5, 300]);

      expect(average).toBeCloseTo(200.33, 2);
    });
  });

  describe('calculateMedian', () => {
    it('should calculate median for odd number of values', () => {
      const median = searchOptimizationService.calculateMedian([100, 150, 200, 250, 300]);

      expect(median).toBe(200);
    });

    it('should calculate median for even number of values', () => {
      const median = searchOptimizationService.calculateMedian([100, 150, 200, 250]);

      expect(median).toBe(175);
    });

    it('should return 0 for empty array', () => {
      const median = searchOptimizationService.calculateMedian([]);

      expect(median).toBe(0);
    });

    it('should handle single value', () => {
      const median = searchOptimizationService.calculateMedian([150]);

      expect(median).toBe(150);
    });
  });

  describe('simpleHash', () => {
    it('should generate consistent hash for same input', () => {
      const hash1 = searchOptimizationService.simpleHash('test-string');
      const hash2 = searchOptimizationService.simpleHash('test-string');

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = searchOptimizationService.simpleHash('string1');
      const hash2 = searchOptimizationService.simpleHash('string2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return positive integer', () => {
      const hash = searchOptimizationService.simpleHash('test-string');

      expect(hash).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(hash)).toBe(true);
    });
  });
});
