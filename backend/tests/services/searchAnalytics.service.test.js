/**
 * Search Analytics Service Tests
 * 
 * Comprehensive unit tests for SearchAnalyticsService covering:
 * - Search tracking
 * - Click tracking
 * - Conversion tracking
 * - Search history retrieval
 * - Popular searches
 * - Analytics metrics
 * - Dwell time updates
 * - Session-based searches
 */

const { SearchAnalyticsService } = require('../../services/searchAnalytics.service');

// Mock logger
jest.mock('../../services/logger');

describe('SearchAnalyticsService', () => {
  let searchAnalyticsService;
  let mockPrisma;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      searchAnalytics: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        groupBy: jest.fn(),
      },
      searchClickTracking: {
        create: jest.fn(),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
    };

    searchAnalyticsService = new SearchAnalyticsService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackSearch', () => {
    it('should track a search event with valid parameters', async () => {
      const searchAnalyticsData = {
        id: 'search-123',
        userId: 'user-123',
        sessionId: 'session-123',
        query: 'laptop',
        resultsCount: 10,
        responseTime: 150,
        filtersApplied: { category: 'electronics' },
        sortBy: 'relevance',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        deviceType: 'desktop',
        timestamp: new Date(),
      };

      mockPrisma.searchAnalytics.create.mockResolvedValue(searchAnalyticsData);

      const result = await searchAnalyticsService.trackSearch(
        'user-123',
        'session-123',
        'laptop',
        10,
        150,
        { category: 'electronics' },
        'relevance',
        { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', deviceType: 'desktop' }
      );

      expect(mockPrisma.searchAnalytics.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          sessionId: 'session-123',
          query: 'laptop',
          resultsCount: 10,
          responseTime: 150,
          filtersApplied: { category: 'electronics' },
          sortBy: 'relevance',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          deviceType: 'desktop',
        },
      });

      expect(result).toEqual(searchAnalyticsData);
    });

    it('should track an anonymous search (userId null)', async () => {
      const searchAnalyticsData = {
        id: 'search-456',
        userId: null,
        sessionId: 'session-456',
        query: 'phone',
        resultsCount: 5,
        responseTime: 100,
        filtersApplied: {},
        sortBy: null,
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0',
        deviceType: 'mobile',
        timestamp: new Date(),
      };

      mockPrisma.searchAnalytics.create.mockResolvedValue(searchAnalyticsData);

      const result = await searchAnalyticsService.trackSearch(
        null,
        'session-456',
        'phone',
        5,
        100,
        {},
        null,
        { ipAddress: '192.168.1.2', userAgent: 'Mozilla/5.0', deviceType: 'mobile' }
      );

      expect(mockPrisma.searchAnalytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          query: 'phone',
        }),
      });

      expect(result).toEqual(searchAnalyticsData);
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockPrisma.searchAnalytics.create.mockRejectedValue(error);

      await expect(
        searchAnalyticsService.trackSearch(
          'user-123',
          'session-123',
          'laptop',
          10,
          150
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle zero result searches', async () => {
      const searchAnalyticsData = {
        id: 'search-789',
        userId: 'user-123',
        sessionId: 'session-123',
        query: 'nonexistent-product',
        resultsCount: 0,
        responseTime: 50,
        filtersApplied: {},
        sortBy: null,
        timestamp: new Date(),
      };

      mockPrisma.searchAnalytics.create.mockResolvedValue(searchAnalyticsData);

      const result = await searchAnalyticsService.trackSearch(
        'user-123',
        'session-123',
        'nonexistent-product',
        0,
        50
      );

      expect(result.resultsCount).toBe(0);
    });

    it('should handle empty filters', async () => {
      const searchAnalyticsData = {
        id: 'search-999',
        userId: 'user-123',
        sessionId: 'session-123',
        query: 'tablet',
        resultsCount: 8,
        responseTime: 120,
        filtersApplied: {},
        sortBy: 'price_asc',
        timestamp: new Date(),
      };

      mockPrisma.searchAnalytics.create.mockResolvedValue(searchAnalyticsData);

      const result = await searchAnalyticsService.trackSearch(
        'user-123',
        'session-123',
        'tablet',
        8,
        120,
        {},
        'price_asc'
      );

      expect(result.filtersApplied).toEqual({});
    });
  });

  describe('trackClick', () => {
    it('should track a click on a search result', async () => {
      const clickTrackingData = {
        id: 'click-123',
        searchAnalyticsId: 'search-123',
        productId: 'product-123',
        position: 3,
        dwellTime: null,
        clickedAt: new Date(),
      };

      const updatedSearchAnalytics = {
        id: 'search-123',
        clickedResults: [
          { productId: 'product-123', position: 3, clickedAt: new Date() },
        ],
      };

      mockPrisma.searchClickTracking.create.mockResolvedValue(clickTrackingData);
      mockPrisma.searchAnalytics.update.mockResolvedValue(updatedSearchAnalytics);

      const result = await searchAnalyticsService.trackClick(
        'search-123',
        'product-123',
        3
      );

      expect(mockPrisma.searchClickTracking.create).toHaveBeenCalledWith({
        data: {
          searchAnalyticsId: 'search-123',
          productId: 'product-123',
          position: 3,
        },
      });

      expect(result).toEqual(clickTrackingData);
    });

    it('should update clicked results in search analytics', async () => {
      const clickTrackingData = {
        id: 'click-456',
        searchAnalyticsId: 'search-456',
        productId: 'product-456',
        position: 1,
        clickedAt: new Date(),
      };

      mockPrisma.searchClickTracking.create.mockResolvedValue(clickTrackingData);
      mockPrisma.searchAnalytics.update.mockResolvedValue({});

      await searchAnalyticsService.trackClick('search-456', 'product-456', 1);

      expect(mockPrisma.searchAnalytics.update).toHaveBeenCalledWith({
        where: { id: 'search-456' },
        data: {
          clickedResults: {
            push: { productId: 'product-456', position: 1, clickedAt: expect.any(Date) },
          },
        },
      });
    });

    it('should handle invalid position values', async () => {
      const error = new Error('Invalid position value');
      mockPrisma.searchClickTracking.create.mockRejectedValue(error);

      await expect(
        searchAnalyticsService.trackClick('search-123', 'product-123', -1)
      ).rejects.toThrow();
    });

    it('should handle database errors during click tracking', async () => {
      const error = new Error('Click tracking failed');
      mockPrisma.searchClickTracking.create.mockRejectedValue(error);

      await expect(
        searchAnalyticsService.trackClick('search-123', 'product-123', 1)
      ).rejects.toThrow('Click tracking failed');
    });
  });

  describe('trackConversion', () => {
    it('should track a conversion with product ID', async () => {
      const conversionData = {
        id: 'search-123',
        conversionType: 'purchase',
        productId: 'product-123',
        userId: 'user-123',
      };

      mockPrisma.searchAnalytics.update.mockResolvedValue(conversionData);

      const result = await searchAnalyticsService.trackConversion(
        'search-123',
        'purchase',
        'product-123'
      );

      expect(mockPrisma.searchAnalytics.update).toHaveBeenCalledWith({
        where: { id: 'search-123' },
        data: {
          conversionType: 'purchase',
          productId: 'product-123',
        },
      });

      expect(result).toEqual(conversionData);
    });

    it('should track a conversion without product ID', async () => {
      const conversionData = {
        id: 'search-456',
        conversionType: 'add_to_cart',
        productId: null,
        userId: 'user-456',
      };

      mockPrisma.searchAnalytics.update.mockResolvedValue(conversionData);

      const result = await searchAnalyticsService.trackConversion(
        'search-456',
        'add_to_cart',
        null
      );

      expect(mockPrisma.searchAnalytics.update).toHaveBeenCalledWith({
        where: { id: 'search-456' },
        data: {
          conversionType: 'add_to_cart',
          productId: null,
        },
      });

      expect(result.productId).toBeNull();
    });

    it('should handle different conversion types', async () => {
      const conversionTypes = ['click', 'add_to_cart', 'purchase'];

      for (const type of conversionTypes) {
        mockPrisma.searchAnalytics.update.mockResolvedValue({
          id: 'search-123',
          conversionType: type,
          productId: 'product-123',
        });

        const result = await searchAnalyticsService.trackConversion(
          'search-123',
          type,
          'product-123'
        );

        expect(result.conversionType).toBe(type);
      }
    });

    it('should handle invalid conversion type', async () => {
      const error = new Error('Invalid conversion type');
      mockPrisma.searchAnalytics.update.mockRejectedValue(error);

      await expect(
        searchAnalyticsService.trackConversion('search-123', 'invalid_type', 'product-123')
      ).rejects.toThrow();
    });
  });

  describe('getSearchHistory', () => {
    it('should retrieve search history for a user', async () => {
      const searchHistory = [
        {
          id: 'search-1',
          userId: 'user-123',
          query: 'laptop',
          resultsCount: 10,
          timestamp: new Date('2024-01-15'),
          clickTrackings: [],
        },
        {
          id: 'search-2',
          userId: 'user-123',
          query: 'phone',
          resultsCount: 5,
          timestamp: new Date('2024-01-14'),
          clickTrackings: [
            {
              id: 'click-1',
              productId: 'product-123',
              position: 1,
              dwellTime: 5000,
              product: {
                id: 'product-123',
                name: 'iPhone 15',
                slug: 'iphone-15',
                regularPrice: 999,
                salePrice: 899,
                primaryImage: 'iphone-15.jpg',
              },
            },
          ],
        },
      ];

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(searchHistory);

      const result = await searchAnalyticsService.getSearchHistory('user-123', 20);

      expect(mockPrisma.searchAnalytics.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { timestamp: 'desc' },
        take: 20,
        include: {
          clickTrackings: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  regularPrice: true,
                  salePrice: true,
                  primaryImage: true,
                },
              },
            },
          },
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('laptop');
    });

    it('should respect the limit parameter', async () => {
      const searchHistory = Array.from({ length: 30 }, (_, i) => ({
        id: `search-${i}`,
        userId: 'user-123',
        query: `query-${i}`,
        resultsCount: 10,
        timestamp: new Date(),
        clickTrackings: [],
      }));

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(searchHistory);

      const result = await searchAnalyticsService.getSearchHistory('user-123', 10);

      expect(mockPrisma.searchAnalytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });

    it('should return empty array for user with no history', async () => {
      mockPrisma.searchAnalytics.findMany.mockResolvedValue([]);

      const result = await searchAnalyticsService.getSearchHistory('user-999', 20);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchAnalytics.findMany.mockRejectedValue(error);

      await expect(
        searchAnalyticsService.getSearchHistory('user-123', 20)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getPopularSearches', () => {
    it('should retrieve popular searches for a time range', async () => {
      const groupByResult = [
        { query: 'laptop', _count: { query: 150 } },
        { query: 'phone', _count: { query: 120 } },
        { query: 'tablet', _count: { query: 80 } },
      ];

      mockPrisma.searchAnalytics.groupBy.mockResolvedValue(groupByResult);

      const result = await searchAnalyticsService.getPopularSearches(10, 'week');

      expect(mockPrisma.searchAnalytics.groupBy).toHaveBeenCalledWith({
        by: ['query'],
        where: {
          timestamp: {
            gte: expect.any(Date),
          },
        },
        _count: {
          query: true,
        },
        orderBy: {
          _count: {
            query: 'desc',
          },
        },
        take: 10,
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        query: 'laptop',
        searchCount: 150,
      });
    });

    it('should handle different time ranges', async () => {
      const timeRanges = ['today', 'week', 'month', 'all'];

      for (const range of timeRanges) {
        mockPrisma.searchAnalytics.groupBy.mockResolvedValue([]);

        await searchAnalyticsService.getPopularSearches(10, range);

        expect(mockPrisma.searchAnalytics.groupBy).toHaveBeenCalled();
      }
    });

    it('should return empty array when no searches found', async () => {
      mockPrisma.searchAnalytics.groupBy.mockResolvedValue([]);

      const result = await searchAnalyticsService.getPopularSearches(10, 'week');

      expect(result).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      const groupByResult = Array.from({ length: 20 }, (_, i) => ({
        query: `query-${i}`,
        _count: { query: 100 - i },
      }));

      mockPrisma.searchAnalytics.groupBy.mockResolvedValue(groupByResult);

      const result = await searchAnalyticsService.getPopularSearches(5, 'week');

      expect(result).toHaveLength(5);
    });
  });

  describe('getAnalyticsMetrics', () => {
    it('should calculate analytics metrics for a date range', async () => {
      const analytics = [
        {
          id: 'search-1',
          query: 'laptop',
          resultsCount: 10,
          responseTime: 150,
          conversionType: 'purchase',
          clickedResults: [],
          timestamp: new Date('2024-01-15'),
        },
        {
          id: 'search-2',
          query: 'phone',
          resultsCount: 0,
          responseTime: 100,
          conversionType: null,
          clickedResults: [],
          timestamp: new Date('2024-01-16'),
        },
      ];

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(analytics);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await searchAnalyticsService.getAnalyticsMetrics(startDate, endDate);

      expect(result).toEqual({
        totalSearches: 2,
        totalResults: 10,
        avgResponseTime: 125,
        conversions: 1,
        conversionRate: 50,
        zeroResultSearches: 1,
        uniqueQueries: 2,
      });
    });

    it('should handle empty analytics data', async () => {
      mockPrisma.searchAnalytics.findMany.mockResolvedValue([]);

      const result = await searchAnalyticsService.getAnalyticsMetrics(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual({
        totalSearches: 0,
        totalResults: 0,
        avgResponseTime: 0,
        conversions: 0,
        conversionRate: 0,
        zeroResultSearches: 0,
        uniqueQueries: 0,
      });
    });

    it('should calculate correct conversion rate', async () => {
      const analytics = Array.from({ length: 10 }, (_, i) => ({
        id: `search-${i}`,
        query: `query-${i}`,
        resultsCount: 10,
        responseTime: 100,
        conversionType: i < 3 ? 'purchase' : null,
        clickedResults: [],
        timestamp: new Date(),
      }));

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(analytics);

      const result = await searchAnalyticsService.getAnalyticsMetrics(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.conversionRate).toBe(30);
    });

    it('should count unique queries correctly', async () => {
      const analytics = [
        { id: 'search-1', query: 'laptop', resultsCount: 10, responseTime: 100, conversionType: null, clickedResults: [], timestamp: new Date() },
        { id: 'search-2', query: 'laptop', resultsCount: 10, responseTime: 110, conversionType: null, clickedResults: [], timestamp: new Date() },
        { id: 'search-3', query: 'phone', resultsCount: 5, responseTime: 90, conversionType: null, clickedResults: [], timestamp: new Date() },
      ];

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(analytics);

      const result = await searchAnalyticsService.getAnalyticsMetrics(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.uniqueQueries).toBe(2);
    });
  });

  describe('updateDwellTime', () => {
    it('should update dwell time for a click', async () => {
      const updatedClickTracking = {
        id: 'click-123',
        searchAnalyticsId: 'search-123',
        productId: 'product-123',
        position: 1,
        dwellTime: 5000,
        clickedAt: new Date(),
      };

      mockPrisma.searchClickTracking.update.mockResolvedValue(updatedClickTracking);

      const result = await searchAnalyticsService.updateDwellTime('click-123', 5000);

      expect(mockPrisma.searchClickTracking.update).toHaveBeenCalledWith({
        where: { id: 'click-123' },
        data: { dwellTime: 5000 },
      });

      expect(result.dwellTime).toBe(5000);
    });

    it('should handle zero dwell time', async () => {
      const updatedClickTracking = {
        id: 'click-456',
        dwellTime: 0,
      };

      mockPrisma.searchClickTracking.update.mockResolvedValue(updatedClickTracking);

      const result = await searchAnalyticsService.updateDwellTime('click-456', 0);

      expect(result.dwellTime).toBe(0);
    });

    it('should handle database errors', async () => {
      const error = new Error('Update failed');
      mockPrisma.searchClickTracking.update.mockRejectedValue(error);

      await expect(
        searchAnalyticsService.updateDwellTime('click-123', 5000)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('getSearchBySession', () => {
    it('should retrieve searches for a session', async () => {
      const sessionSearches = [
        {
          id: 'search-1',
          sessionId: 'session-123',
          query: 'laptop',
          resultsCount: 10,
          timestamp: new Date(),
          clickTrackings: [
            {
              id: 'click-1',
              productId: 'product-123',
              position: 1,
              dwellTime: 5000,
            },
          ],
        },
        {
          id: 'search-2',
          sessionId: 'session-123',
          query: 'phone',
          resultsCount: 5,
          timestamp: new Date(),
          clickTrackings: [],
        },
      ];

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(sessionSearches);

      const result = await searchAnalyticsService.getSearchBySession('session-123');

      expect(mockPrisma.searchAnalytics.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
        orderBy: { timestamp: 'desc' },
        include: {
          clickTrackings: true,
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].sessionId).toBe('session-123');
    });

    it('should return empty array for session with no searches', async () => {
      mockPrisma.searchAnalytics.findMany.mockResolvedValue([]);

      const result = await searchAnalyticsService.getSearchBySession('session-999');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchAnalytics.findMany.mockRejectedValue(error);

      await expect(
        searchAnalyticsService.getSearchBySession('session-123')
      ).rejects.toThrow('Database error');
    });
  });
});
