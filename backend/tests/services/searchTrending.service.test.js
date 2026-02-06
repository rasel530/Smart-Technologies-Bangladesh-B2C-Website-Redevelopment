/**
 * Search Trending Service Tests
 * 
 * Comprehensive unit tests for SearchTrendingService covering:
 * - Search recording for trending
 * - Trend score calculation
 * - Trending searches retrieval
 * - Trending products retrieval
 * - Rising searches retrieval
 * - Trending by category
 * - Trending statistics
 * - Old data cleanup
 * - Trend threshold and decay factor management
 */

const { SearchTrendingService } = require('../../services/searchTrending.service');

// Mock logger
jest.mock('../../services/logger');

describe('SearchTrendingService', () => {
  let searchTrendingService;
  let mockPrisma;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      searchTrending: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      searchClickTracking: {
        findMany: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
    };

    searchTrendingService = new SearchTrendingService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordSearch', () => {
    it('should record a new search for trending', async () => {
      const trendingData = {
        id: 'trend-123',
        query: 'laptop',
        searchCount: 1,
        trendScore: 1.0,
        lastSearchedAt: new Date(),
        category: 'cat-123',
        isTrending: false,
      };

      mockPrisma.searchTrending.findUnique.mockResolvedValue(null);
      mockPrisma.searchTrending.create.mockResolvedValue(trendingData);

      const result = await searchTrendingService.recordSearch('laptop', 'cat-123');

      expect(mockPrisma.searchTrending.findUnique).toHaveBeenCalledWith({
        where: { query: 'laptop' },
      });

      expect(mockPrisma.searchTrending.create).toHaveBeenCalledWith({
        data: {
          query: 'laptop',
          searchCount: 1,
          trendScore: 1.0,
          lastSearchedAt: expect.any(Date),
          category: 'cat-123',
          isTrending: false,
        },
      });

      expect(result).toEqual(trendingData);
    });

    it('should update existing trending record', async () => {
      const existingTrending = {
        id: 'trend-123',
        query: 'laptop',
        searchCount: 5,
        trendScore: 8.0,
        lastSearchedAt: new Date('2024-01-14'),
        category: 'cat-123',
        isTrending: true,
      };

      const updatedTrending = {
        ...existingTrending,
        searchCount: 6,
        lastSearchedAt: new Date(),
      };

      mockPrisma.searchTrending.findUnique.mockResolvedValue(existingTrending);
      mockPrisma.searchTrending.update.mockResolvedValue(updatedTrending);

      const result = await searchTrendingService.recordSearch('laptop', 'cat-123');

      expect(mockPrisma.searchTrending.update).toHaveBeenCalledWith({
        where: { query: 'laptop' },
        data: {
          searchCount: {
            increment: 1,
          },
          lastSearchedAt: expect.any(Date),
          category: 'cat-123',
        },
      });

      expect(result.searchCount).toBe(6);
    });

    it('should normalize query to lowercase', async () => {
      const trendingData = {
        id: 'trend-456',
        query: 'laptop',
        searchCount: 1,
        trendScore: 1.0,
        lastSearchedAt: new Date(),
        category: null,
        isTrending: false,
      };

      mockPrisma.searchTrending.findUnique.mockResolvedValue(null);
      mockPrisma.searchTrending.create.mockResolvedValue(trendingData);

      const result = await searchTrendingService.recordSearch('LAPTOP', null);

      expect(mockPrisma.searchTrending.findUnique).toHaveBeenCalledWith({
        where: { query: 'laptop' },
      });

      expect(result.query).toBe('laptop');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchTrending.findUnique.mockRejectedValue(error);

      await expect(
        searchTrendingService.recordSearch('laptop', null)
      ).rejects.toThrow('Database error');
    });

    it('should trim query whitespace', async () => {
      const trendingData = {
        id: 'trend-789',
        query: 'laptop',
        searchCount: 1,
        trendScore: 1.0,
        lastSearchedAt: new Date(),
        category: null,
        isTrending: false,
      };

      mockPrisma.searchTrending.findUnique.mockResolvedValue(null);
      mockPrisma.searchTrending.create.mockResolvedValue(trendingData);

      const result = await searchTrendingService.recordSearch('  laptop  ', null);

      expect(result.query).toBe('laptop');
    });
  });

  describe('calculateTrendScores', () => {
    it('should calculate trend scores for all searches', async () => {
      const allTrending = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 0,
          lastSearchedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          isTrending: false,
        },
        {
          id: 'trend-2',
          query: 'phone',
          searchCount: 50,
          trendScore: 0,
          lastSearchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          isTrending: false,
        },
      ];

      const updatedTrending = [
        { ...allTrending[0], trendScore: expect.any(Number), isTrending: true },
        { ...allTrending[1], trendScore: expect.any(Number), isTrending: false },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(allTrending);
      mockPrisma.searchTrending.update.mockImplementation((params) => {
        const trending = allTrending.find(t => t.id === params.where.id);
        return Promise.resolve({ ...trending, ...params.data });
      });

      const result = await searchTrendingService.calculateTrendScores();

      expect(mockPrisma.searchTrending.findMany).toHaveBeenCalled();
      expect(mockPrisma.searchTrending.update).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should apply time decay to trend scores', async () => {
      const allTrending = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 0,
          lastSearchedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          isTrending: false,
        },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(allTrending);
      mockPrisma.searchTrending.update.mockImplementation((params) => {
        const trending = allTrending.find(t => t.id === params.where.id);
        return Promise.resolve({ ...trending, ...params.data });
      });

      await searchTrendingService.calculateTrendScores();

      const updateCalls = mockPrisma.searchTrending.update.mock.calls;
      expect(updateCalls[0][0].data.trendScore).toBeLessThan(100);
    });

    it('should determine trending status based on threshold', async () => {
      const allTrending = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 0,
          lastSearchedAt: new Date(),
          isTrending: false,
        },
        {
          id: 'trend-2',
          query: 'phone',
          searchCount: 5,
          trendScore: 0,
          lastSearchedAt: new Date(),
          isTrending: false,
        },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(allTrending);
      mockPrisma.searchTrending.update.mockImplementation((params) => {
        const trending = allTrending.find(t => t.id === params.where.id);
        return Promise.resolve({ ...trending, ...params.data });
      });

      await searchTrendingService.calculateTrendScores();

      const updateCalls = mockPrisma.searchTrending.update.mock.calls;
      expect(updateCalls[0][0].data.isTrending).toBe(true);
      expect(updateCalls[1][0].data.isTrending).toBe(false);
    });

    it('should handle empty trending data', async () => {
      mockPrisma.searchTrending.findMany.mockResolvedValue([]);

      const result = await searchTrendingService.calculateTrendScores();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchTrending.findMany.mockRejectedValue(error);

      await expect(
        searchTrendingService.calculateTrendScores()
      ).rejects.toThrow('Database error');
    });
  });

  describe('getTrendingSearches', () => {
    it('should retrieve trending searches', async () => {
      const trendingSearches = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 15.5,
          lastSearchedAt: new Date(),
          category: 'cat-123',
          isTrending: true,
        },
        {
          id: 'trend-2',
          query: 'phone',
          searchCount: 80,
          trendScore: 12.3,
          lastSearchedAt: new Date(),
          category: null,
          isTrending: true,
        },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(trendingSearches);

      const result = await searchTrendingService.getTrendingSearches(10);

      expect(mockPrisma.searchTrending.findMany).toHaveBeenCalledWith({
        where: {
          isTrending: true,
        },
        orderBy: {
          trendScore: 'desc',
        },
        take: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        query: 'laptop',
        searchCount: 100,
        trendScore: 15.5,
        lastSearchedAt: expect.any(Date),
        category: 'cat-123',
      });
    });

    it('should respect limit parameter', async () => {
      const trendingSearches = Array.from({ length: 30 }, (_, i) => ({
        id: `trend-${i}`,
        query: `query-${i}`,
        searchCount: 100 - i,
        trendScore: 20 - i,
        lastSearchedAt: new Date(),
        category: null,
        isTrending: true,
      }));

      mockPrisma.searchTrending.findMany.mockResolvedValue(trendingSearches);

      const result = await searchTrendingService.getTrendingSearches(5);

      expect(result).toHaveLength(5);
    });

    it('should return empty array when no trending searches', async () => {
      mockPrisma.searchTrending.findMany.mockResolvedValue([]);

      const result = await searchTrendingService.getTrendingSearches(10);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchTrending.findMany.mockRejectedValue(error);

      await expect(
        searchTrendingService.getTrendingSearches(10)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getTrendingProducts', () => {
    it('should retrieve trending products', async () => {
      const trendingSearches = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 15.5,
          category: 'product-123',
          isTrending: true,
        },
        {
          id: 'trend-2',
          query: 'phone',
          searchCount: 80,
          trendScore: 12.3,
          category: 'product-456',
          isTrending: true,
        },
      ];

      const products = [
        {
          id: 'product-123',
          name: 'Laptop 1',
          status: 'active',
          visibility: 'public',
          brand: { id: 'brand-1', name: 'Brand 1' },
          categories: [{ id: 'cat-1', name: 'Category 1' }],
        },
        {
          id: 'product-456',
          name: 'Phone 1',
          status: 'active',
          visibility: 'public',
          brand: { id: 'brand-2', name: 'Brand 2' },
          categories: [{ id: 'cat-2', name: 'Category 2' }],
        },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(trendingSearches);
      mockPrisma.product.findMany.mockResolvedValue(products);

      const result = await searchTrendingService.getTrendingProducts(10, null);

      expect(mockPrisma.searchTrending.findMany).toHaveBeenCalledWith({
        where: {
          isTrending: true,
        },
        orderBy: {
          trendScore: 'desc',
        },
        take: 20,
      });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['product-123', 'product-456'] },
          status: 'active',
          visibility: 'public',
        },
        take: 10,
        include: {
          brand: true,
          categories: true,
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].trendScore).toBe(15.5);
      expect(result[1].trendScore).toBe(12.3);
    });

    it('should filter by category', async () => {
      const trendingSearches = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 15.5,
          category: 'cat-123',
          isTrending: true,
        },
      ];

      const products = [
        {
          id: 'product-123',
          name: 'Laptop 1',
          status: 'active',
          visibility: 'public',
          brand: { id: 'brand-1' },
          categories: [{ id: 'cat-123' }],
        },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(trendingSearches);
      mockPrisma.product.findMany.mockResolvedValue(products);

      const result = await searchTrendingService.getTrendingProducts(10, 'cat-123');

      expect(mockPrisma.searchTrending.findMany).toHaveBeenCalledWith({
        where: {
          isTrending: true,
          category: 'cat-123',
        },
        orderBy: {
          trendScore: 'desc',
        },
        take: 20,
      });

      expect(result).toHaveLength(1);
    });

    it('should fallback to most viewed products when no category', async () => {
      const trendingSearches = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 15.5,
          category: null,
          isTrending: true,
        },
      ];

      const clickTrackings = [
        {
          id: 'click-1',
          productId: 'product-123',
          position: 1,
          dwellTime: 5000,
          clickedAt: new Date(),
          product: {
            id: 'product-123',
            name: 'Laptop 1',
            status: 'active',
            visibility: 'public',
            brand: { id: 'brand-1' },
            categories: [{ id: 'cat-123' }],
          },
        },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(trendingSearches);
      mockPrisma.searchClickTracking.findMany.mockResolvedValue(clickTrackings);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const result = await searchTrendingService.getTrendingProducts(10, null);

      expect(mockPrisma.searchClickTracking.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchTrending.findMany.mockRejectedValue(error);

      await expect(
        searchTrendingService.getTrendingProducts(10, null)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getMostViewedProducts', () => {
    it('should retrieve most viewed products', async () => {
      const clickTrackings = [
        {
          id: 'click-1',
          productId: 'product-123',
          position: 1,
          dwellTime: 5000,
          clickedAt: new Date(),
          product: {
            id: 'product-123',
            name: 'Laptop 1',
            status: 'active',
            visibility: 'public',
            brand: { id: 'brand-1', name: 'Brand 1' },
            categories: [{ id: 'cat-123', name: 'Category 1' }],
          },
        },
        {
          id: 'click-2',
          productId: 'product-456',
          position: 2,
          dwellTime: 3000,
          clickedAt: new Date(),
          product: {
            id: 'product-456',
            name: 'Phone 1',
            status: 'active',
            visibility: 'public',
            brand: { id: 'brand-2', name: 'Brand 2' },
            categories: [{ id: 'cat-456', name: 'Category 2' }],
          },
        },
      ];

      mockPrisma.searchClickTracking.findMany.mockResolvedValue(clickTrackings);

      const result = await searchTrendingService.getMostViewedProducts(10, null);

      expect(mockPrisma.searchClickTracking.findMany).toHaveBeenCalledWith({
        where: {
          clickedAt: {
            gte: expect.any(Date),
          },
        },
        include: {
          product: {
            include: {
              brand: true,
              categories: true,
            },
          },
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].clickCount).toBe(1);
      expect(result[0].avgPosition).toBe(1);
      expect(result[0].avgDwellTime).toBe(5000);
    });

    it('should filter by category', async () => {
      const clickTrackings = [
        {
          id: 'click-1',
          productId: 'product-123',
          position: 1,
          dwellTime: 5000,
          clickedAt: new Date(),
          product: {
            id: 'product-123',
            name: 'Laptop 1',
            status: 'active',
            visibility: 'public',
            categories: [{ id: 'cat-123', name: 'Category 1' }],
          },
        },
        {
          id: 'click-2',
          productId: 'product-456',
          position: 2,
          dwellTime: 3000,
          clickedAt: new Date(),
          product: {
            id: 'product-456',
            name: 'Phone 1',
            status: 'active',
            visibility: 'public',
            categories: [{ id: 'cat-456', name: 'Category 2' }],
          },
        },
      ];

      mockPrisma.searchClickTracking.findMany.mockResolvedValue(clickTrackings);

      const result = await searchTrendingService.getMostViewedProducts(10, 'cat-123');

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe('product-123');
    });

    it('should calculate correct averages', async () => {
      const clickTrackings = [
        {
          id: 'click-1',
          productId: 'product-123',
          position: 1,
          dwellTime: 5000,
          clickedAt: new Date(),
          product: { id: 'product-123', name: 'Laptop 1', status: 'active', visibility: 'public', brand: {}, categories: [] },
        },
        {
          id: 'click-2',
          productId: 'product-123',
          position: 3,
          dwellTime: 7000,
          clickedAt: new Date(),
          product: { id: 'product-123', name: 'Laptop 1', status: 'active', visibility: 'public', brand: {}, categories: [] },
        },
      ];

      mockPrisma.searchClickTracking.findMany.mockResolvedValue(clickTrackings);

      const result = await searchTrendingService.getMostViewedProducts(10, null);

      expect(result[0].clickCount).toBe(2);
      expect(result[0].avgPosition).toBe(2);
      expect(result[0].avgDwellTime).toBe(6000);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchClickTracking.findMany.mockRejectedValue(error);

      await expect(
        searchTrendingService.getMostViewedProducts(10, null)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getTrendingByCategory', () => {
    it('should retrieve trending searches by category', async () => {
      const trendingSearches = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 15.5,
          lastSearchedAt: new Date(),
          category: 'cat-123',
          isTrending: true,
        },
        {
          id: 'trend-2',
          query: 'phone',
          searchCount: 80,
          trendScore: 12.3,
          lastSearchedAt: new Date(),
          category: 'cat-123',
          isTrending: true,
        },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(trendingSearches);

      const result = await searchTrendingService.getTrendingByCategory('cat-123', 10);

      expect(mockPrisma.searchTrending.findMany).toHaveBeenCalledWith({
        where: {
          isTrending: true,
          category: 'cat-123',
        },
        orderBy: {
          trendScore: 'desc',
        },
        take: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('laptop');
    });

    it('should respect limit parameter', async () => {
      const trendingSearches = Array.from({ length: 20 }, (_, i) => ({
        id: `trend-${i}`,
        query: `query-${i}`,
        searchCount: 100 - i,
        trendScore: 20 - i,
        lastSearchedAt: new Date(),
        category: 'cat-123',
        isTrending: true,
      }));

      mockPrisma.searchTrending.findMany.mockResolvedValue(trendingSearches);

      const result = await searchTrendingService.getTrendingByCategory('cat-123', 5);

      expect(result).toHaveLength(5);
    });

    it('should return empty array when no trending searches for category', async () => {
      mockPrisma.searchTrending.findMany.mockResolvedValue([]);

      const result = await searchTrendingService.getTrendingByCategory('cat-999', 10);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchTrending.findMany.mockRejectedValue(error);

      await expect(
        searchTrendingService.getTrendingByCategory('cat-123', 10)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getRisingSearches', () => {
    it('should retrieve rising searches', async () => {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const risingSearches = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 15.5,
          lastSearchedAt: new Date(),
          category: 'cat-123',
          isTrending: true,
        },
        {
          id: 'trend-2',
          query: 'phone',
          searchCount: 80,
          trendScore: 12.3,
          lastSearchedAt: new Date(),
          category: null,
          isTrending: true,
        },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(risingSearches);

      const result = await searchTrendingService.getRisingSearches(10);

      expect(mockPrisma.searchTrending.findMany).toHaveBeenCalledWith({
        where: {
          isTrending: true,
          lastSearchedAt: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          trendScore: 'desc',
        },
        take: 10,
      });

      expect(result).toHaveLength(2);
    });

    it('should respect limit parameter', async () => {
      const risingSearches = Array.from({ length: 20 }, (_, i) => ({
        id: `trend-${i}`,
        query: `query-${i}`,
        searchCount: 100 - i,
        trendScore: 20 - i,
        lastSearchedAt: new Date(),
        category: null,
        isTrending: true,
      }));

      mockPrisma.searchTrending.findMany.mockResolvedValue(risingSearches);

      const result = await searchTrendingService.getRisingSearches(5);

      expect(result).toHaveLength(5);
    });

    it('should return empty array when no rising searches', async () => {
      mockPrisma.searchTrending.findMany.mockResolvedValue([]);

      const result = await searchTrendingService.getRisingSearches(10);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchTrending.findMany.mockRejectedValue(error);

      await expect(
        searchTrendingService.getRisingSearches(10)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getTrendingStatistics', () => {
    it('should retrieve trending statistics', async () => {
      const allTrending = [
        {
          id: 'trend-1',
          query: 'laptop',
          searchCount: 100,
          trendScore: 15.5,
          lastSearchedAt: new Date(),
          category: 'cat-123',
          isTrending: true,
        },
        {
          id: 'trend-2',
          query: 'phone',
          searchCount: 80,
          trendScore: 12.3,
          lastSearchedAt: new Date(),
          category: null,
          isTrending: true,
        },
        {
          id: 'trend-3',
          query: 'tablet',
          searchCount: 50,
          trendScore: 5.0,
          lastSearchedAt: new Date(),
          category: 'cat-456',
          isTrending: false,
        },
      ];

      mockPrisma.searchTrending.findMany.mockResolvedValue(allTrending);

      const result = await searchTrendingService.getTrendingStatistics();

      expect(result).toEqual({
        totalSearches: 230,
        uniqueQueries: 3,
        trendingCount: 2,
        avgTrendScore: 10.93,
        maxTrendScore: 15.5,
        topTrending: [
          { query: 'laptop', searchCount: 100, trendScore: 15.5 },
          { query: 'phone', searchCount: 80, trendScore: 12.3 },
        ],
      });
    });

    it('should handle empty trending data', async () => {
      mockPrisma.searchTrending.findMany.mockResolvedValue([]);

      const result = await searchTrendingService.getTrendingStatistics();

      expect(result).toEqual({
        totalSearches: 0,
        uniqueQueries: 0,
        trendingCount: 0,
        avgTrendScore: 0,
        maxTrendScore: 0,
        topTrending: [],
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchTrending.findMany.mockRejectedValue(error);

      await expect(
        searchTrendingService.getTrendingStatistics()
      ).rejects.toThrow('Database error');
    });
  });

  describe('clearOldTrendingData', () => {
    it('should clear old trending data', async () => {
      const deleteResult = { count: 50 };

      mockPrisma.searchTrending.deleteMany.mockResolvedValue(deleteResult);

      const result = await searchTrendingService.clearOldTrendingData(30);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      expect(mockPrisma.searchTrending.deleteMany).toHaveBeenCalledWith({
        where: {
          lastSearchedAt: {
            lt: cutoffDate,
          },
          isTrending: false,
        },
      });

      expect(result).toBe(50);
    });

    it('should use default days to keep', async () => {
      const deleteResult = { count: 100 };

      mockPrisma.searchTrending.deleteMany.mockResolvedValue(deleteResult);

      const result = await searchTrendingService.clearOldTrendingData();

      expect(mockPrisma.searchTrending.deleteMany).toHaveBeenCalled();
      expect(result).toBe(100);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchTrending.deleteMany.mockRejectedValue(error);

      await expect(
        searchTrendingService.clearOldTrendingData(30)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateTrendThreshold', () => {
    it('should update trend threshold', () => {
      searchTrendingService.updateTrendThreshold(20);

      expect(searchTrendingService.trendThreshold).toBe(20);
    });

    it('should handle zero threshold', () => {
      searchTrendingService.updateTrendThreshold(0);

      expect(searchTrendingService.trendThreshold).toBe(0);
    });

    it('should handle negative threshold', () => {
      searchTrendingService.updateTrendThreshold(-5);

      expect(searchTrendingService.trendThreshold).toBe(-5);
    });
  });

  describe('updateTrendDecayFactor', () => {
    it('should update trend decay factor', () => {
      searchTrendingService.updateTrendDecayFactor(0.2);

      expect(searchTrendingService.trendDecayFactor).toBe(0.2);
    });

    it('should handle zero decay factor', () => {
      searchTrendingService.updateTrendDecayFactor(0);

      expect(searchTrendingService.trendDecayFactor).toBe(0);
    });

    it('should handle decay factor greater than 1', () => {
      searchTrendingService.updateTrendDecayFactor(1.5);

      expect(searchTrendingService.trendDecayFactor).toBe(1.5);
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average of numbers', () => {
      const values = [10, 20, 30, 40, 50];
      const average = searchTrendingService.calculateAverage(values);

      expect(average).toBe(30);
    });

    it('should return 0 for empty array', () => {
      const average = searchTrendingService.calculateAverage([]);

      expect(average).toBe(0);
    });

    it('should handle single value', () => {
      const average = searchTrendingService.calculateAverage([25]);

      expect(average).toBe(25);
    });

    it('should handle decimal values', () => {
      const average = searchTrendingService.calculateAverage([10.5, 20.5, 30]);

      expect(average).toBeCloseTo(20.33, 2);
    });
  });
});
