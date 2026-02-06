/**
 * Search Personalization Service Tests
 * 
 * Comprehensive unit tests for SearchPersonalizationService covering:
 * - User preference management
 * - Personalized search results
 * - Personalized suggestions
 * - Recommendation generation
 * - Recommendation tracking
 * - Search history management
 * - Behavior learning
 */

const { SearchPersonalizationService } = require('../../services/searchPersonalization.service');

// Mock logger
jest.mock('../../services/logger');

describe('SearchPersonalizationService', () => {
  let searchPersonalizationService;
  let mockPrisma;
  let mockElasticsearchClient;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      userSearchPreferences: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      searchRecommendations: {
        create: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      searchAnalytics: {
        findMany: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    // Mock Elasticsearch client
    mockElasticsearchClient = {
      search: jest.fn(),
    };

    searchPersonalizationService = new SearchPersonalizationService(mockPrisma, mockElasticsearchClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserPreferences', () => {
    it('should create new user preferences', async () => {
      const newPreferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1'],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        searchHistory: [],
        lastUpdated: new Date(),
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.userSearchPreferences.create.mockResolvedValue(newPreferences);

      const result = await searchPersonalizationService.updateUserPreferences('user-123', {
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1'],
        priceRangeMin: 100,
        priceRangeMax: 1000,
      });

      expect(mockPrisma.userSearchPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });

      expect(mockPrisma.userSearchPreferences.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          preferredCategories: ['cat-1', 'cat-2'],
          preferredBrands: ['brand-1'],
          priceRangeMin: 100,
          priceRangeMax: 1000,
          searchHistory: [],
          lastUpdated: expect.any(Date),
        },
      });

      expect(result).toEqual(newPreferences);
    });

    it('should update existing user preferences', async () => {
      const existingPreferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1'],
        preferredBrands: ['brand-1'],
        priceRangeMin: 100,
        priceRangeMax: 500,
        searchHistory: [],
        lastUpdated: new Date('2024-01-01'),
      };

      const updatedPreferences = {
        ...existingPreferences,
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1', 'brand-2'],
        priceRangeMin: 50,
        priceRangeMax: 1000,
        lastUpdated: expect.any(Date),
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(existingPreferences);
      mockPrisma.userSearchPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await searchPersonalizationService.updateUserPreferences('user-123', {
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1', 'brand-2'],
        priceRangeMin: 50,
        priceRangeMax: 1000,
      });

      expect(mockPrisma.userSearchPreferences.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          preferredCategories: ['cat-1', 'cat-2'],
          preferredBrands: ['brand-1', 'brand-2'],
          priceRangeMin: 50,
          priceRangeMax: 1000,
          lastUpdated: expect.any(Date),
        },
      });

      expect(result).toEqual(updatedPreferences);
    });

    it('should handle partial preference updates', async () => {
      const existingPreferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1'],
        preferredBrands: ['brand-1'],
        priceRangeMin: 100,
        priceRangeMax: 500,
        searchHistory: [],
        lastUpdated: new Date(),
      };

      const updatedPreferences = {
        ...existingPreferences,
        preferredCategories: ['cat-1', 'cat-2'],
        lastUpdated: expect.any(Date),
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(existingPreferences);
      mockPrisma.userSearchPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await searchPersonalizationService.updateUserPreferences('user-123', {
        preferredCategories: ['cat-1', 'cat-2'],
      });

      expect(result.preferredCategories).toEqual(['cat-1', 'cat-2']);
      expect(result.preferredBrands).toEqual(['brand-1']);
      expect(result.priceRangeMin).toBe(100);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.userSearchPreferences.findUnique.mockRejectedValue(error);

      await expect(
        searchPersonalizationService.updateUserPreferences('user-123', {})
      ).rejects.toThrow('Database error');
    });
  });

  describe('getUserPreferences', () => {
    it('should retrieve user preferences', async () => {
      const preferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1'],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        searchHistory: ['laptop', 'phone'],
        lastUpdated: new Date(),
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);

      const result = await searchPersonalizationService.getUserPreferences('user-123');

      expect(mockPrisma.userSearchPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });

      expect(result).toEqual(preferences);
    });

    it('should return default preferences for new user', async () => {
      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(null);

      const result = await searchPersonalizationService.getUserPreferences('user-999');

      expect(result).toEqual({
        userId: 'user-999',
        preferredCategories: [],
        preferredBrands: [],
        priceRangeMin: null,
        priceRangeMax: null,
        searchHistory: [],
        lastUpdated: expect.any(Date),
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.userSearchPreferences.findUnique.mockRejectedValue(error);

      await expect(
        searchPersonalizationService.getUserPreferences('user-123')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getPersonalizedResults', () => {
    it('should get personalized search results', async () => {
      const preferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1'],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        searchHistory: [],
      };

      const esResponse = {
        hits: {
          total: { value: 10 },
          hits: [
            { _id: 'product-1', _score: 1.5, _source: { name: 'Laptop 1' } },
            { _id: 'product-2', _score: 1.3, _source: { name: 'Laptop 2' } },
          ],
        },
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockElasticsearchClient.search.mockResolvedValue(esResponse);

      const result = await searchPersonalizationService.getPersonalizedResults('laptop', 'user-123');

      expect(mockElasticsearchClient.search).toHaveBeenCalled();
      expect(result.total).toBe(10);
      expect(result.results).toHaveLength(2);
      expect(result.personalized).toBe(true);
      expect(result.preferencesApplied).toBeDefined();
    });

    it('should handle user with no preferences', async () => {
      const preferences = {
        userId: 'user-123',
        preferredCategories: [],
        preferredBrands: [],
        priceRangeMin: null,
        priceRangeMax: null,
        searchHistory: [],
      };

      const esResponse = {
        hits: {
          total: { value: 5 },
          hits: [{ _id: 'product-1', _score: 1.0, _source: { name: 'Product 1' } }],
        },
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockElasticsearchClient.search.mockResolvedValue(esResponse);

      const result = await searchPersonalizationService.getPersonalizedResults('laptop', 'user-123');

      expect(result.personalized).toBe(true);
      expect(result.preferencesApplied.categories).toEqual([]);
      expect(result.preferencesApplied.brands).toEqual([]);
    });

    it('should handle Elasticsearch errors', async () => {
      const preferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1'],
        preferredBrands: ['brand-1'],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        searchHistory: [],
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockElasticsearchClient.search.mockRejectedValue(new Error('Elasticsearch error'));

      await expect(
        searchPersonalizationService.getPersonalizedResults('laptop', 'user-123')
      ).rejects.toThrow('Elasticsearch error');
    });
  });

  describe('getPersonalizedSuggestions', () => {
    it('should get personalized suggestions', async () => {
      const preferences = {
        userId: 'user-123',
        searchHistory: ['laptop', 'phone'],
      };

      const recentSearches = [
        { id: 'search-1', userId: 'user-123', query: 'laptop', timestamp: new Date() },
        { id: 'search-2', userId: 'user-123', query: 'phone', timestamp: new Date() },
      ];

      const recommendations = [
        {
          id: 'rec-1',
          userId: 'user-123',
          productId: 'product-1',
          recommendationType: 'personalized',
          score: 0.9,
          reason: 'Based on your preferences',
          clicked: false,
          product: {
            id: 'product-1',
            name: 'Laptop 1',
            slug: 'laptop-1',
            regularPrice: 999,
            salePrice: 899,
            primaryImage: 'laptop-1.jpg',
          },
        },
      ];

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockPrisma.searchAnalytics.findMany.mockResolvedValue(recentSearches);
      mockPrisma.searchRecommendations.findMany.mockResolvedValue(recommendations);

      const result = await searchPersonalizationService.getPersonalizedSuggestions('user-123', 10);

      expect(mockPrisma.searchAnalytics.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { timestamp: 'desc' },
        take: 5,
        distinct: ['query'],
      });

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('recent_search');
      expect(result[2].type).toBe('recommendation');
    });

    it('should limit suggestions to requested limit', async () => {
      const preferences = {
        userId: 'user-123',
        searchHistory: Array.from({ length: 20 }, (_, i) => `query-${i}`),
      };

      const recentSearches = Array.from({ length: 5 }, (_, i) => ({
        id: `search-${i}`,
        userId: 'user-123',
        query: `query-${i}`,
        timestamp: new Date(),
      }));

      const recommendations = Array.from({ length: 10 }, (_, i) => ({
        id: `rec-${i}`,
        userId: 'user-123',
        productId: `product-${i}`,
        recommendationType: 'personalized',
        score: 0.9,
        clicked: false,
        product: {
          id: `product-${i}`,
          name: `Product ${i}`,
          slug: `product-${i}`,
          regularPrice: 100,
          salePrice: 90,
          primaryImage: `product-${i}.jpg`,
        },
      }));

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockPrisma.searchAnalytics.findMany.mockResolvedValue(recentSearches);
      mockPrisma.searchRecommendations.findMany.mockResolvedValue(recommendations);

      const result = await searchPersonalizationService.getPersonalizedSuggestions('user-123', 5);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.userSearchPreferences.findUnique.mockRejectedValue(error);

      await expect(
        searchPersonalizationService.getPersonalizedSuggestions('user-123', 10)
      ).rejects.toThrow('Database error');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate trending recommendations', async () => {
      const preferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1'],
        preferredBrands: ['brand-1'],
      };

      const trendingProducts = [
        { id: 'product-1', name: 'Laptop 1', brand: { id: 'brand-1' }, categories: [{ id: 'cat-1' }] },
      ];

      const savedRecommendations = [
        { id: 'rec-1', userId: 'user-123', productId: 'product-1', recommendationType: 'trending' },
      ];

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockPrisma.searchTrending.findMany.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue(trendingProducts);
      mockPrisma.searchRecommendations.create.mockImplementation((data) => Promise.resolve({ id: 'rec-1', ...data }));

      const result = await searchPersonalizationService.generateRecommendations('user-123', 'trending');

      expect(result).toHaveLength(1);
      expect(result[0].recommendationType).toBe('trending');
      expect(mockPrisma.searchRecommendations.create).toHaveBeenCalled();
    });

    it('should generate similar recommendations', async () => {
      const preferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1'],
      };

      const similarProducts = [
        { id: 'product-1', name: 'Laptop 1', brandId: 'brand-1', categories: [{ id: 'cat-1' }] },
        { id: 'product-2', name: 'Laptop 2', brandId: 'brand-1', categories: [{ id: 'cat-2' }] },
      ];

      const savedRecommendations = [
        { id: 'rec-1', userId: 'user-123', productId: 'product-1', recommendationType: 'similar' },
        { id: 'rec-2', userId: 'user-123', productId: 'product-2', recommendationType: 'similar' },
      ];

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockPrisma.product.findMany.mockResolvedValue(similarProducts);
      mockPrisma.searchRecommendations.create.mockImplementation((data) => Promise.resolve({ id: `rec-${data.productId}`, ...data }));

      const result = await searchPersonalizationService.generateRecommendations('user-123', 'similar');

      expect(result).toHaveLength(2);
      expect(result[0].recommendationType).toBe('similar');
    });

    it('should generate personalized recommendations', async () => {
      const preferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1'],
        preferredBrands: ['brand-1'],
      };

      const recentSearches = [
        { id: 'search-1', userId: 'user-123', query: 'laptop', filtersApplied: { categoryIds: ['cat-1'] }, timestamp: new Date() },
      ];

      const personalizedProducts = [
        { id: 'product-1', name: 'Laptop 1', brandId: 'brand-1', categories: [{ id: 'cat-1' }] },
      ];

      const savedRecommendations = [
        { id: 'rec-1', userId: 'user-123', productId: 'product-1', recommendationType: 'personalized' },
      ];

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockPrisma.searchAnalytics.findMany.mockResolvedValue(recentSearches);
      mockPrisma.product.findMany.mockResolvedValue(personalizedProducts);
      mockPrisma.searchRecommendations.create.mockImplementation((data) => Promise.resolve({ id: 'rec-1', ...data }));

      const result = await searchPersonalizationService.generateRecommendations('user-123', 'personalized');

      expect(result).toHaveLength(1);
      expect(result[0].recommendationType).toBe('personalized');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.userSearchPreferences.findUnique.mockRejectedValue(error);

      await expect(
        searchPersonalizationService.generateRecommendations('user-123', 'personalized')
      ).rejects.toThrow('Database error');
    });
  });

  describe('trackRecommendationClick', () => {
    it('should track recommendation click', async () => {
      const updateResult = { count: 1 };

      mockPrisma.searchRecommendations.updateMany.mockResolvedValue(updateResult);

      const result = await searchPersonalizationService.trackRecommendationClick(
        'user-123',
        'product-123',
        'rec-123'
      );

      expect(mockPrisma.searchRecommendations.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          productId: 'product-123',
          id: 'rec-123',
        },
        data: {
          clicked: true,
        },
      });

      expect(result).toEqual(updateResult);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchRecommendations.updateMany.mockRejectedValue(error);

      await expect(
        searchPersonalizationService.trackRecommendationClick('user-123', 'product-123', 'rec-123')
      ).rejects.toThrow('Database error');
    });
  });

  describe('trackRecommendationConversion', () => {
    it('should track recommendation conversion', async () => {
      const updateResult = { count: 1 };

      mockPrisma.searchRecommendations.updateMany.mockResolvedValue(updateResult);

      const result = await searchPersonalizationService.trackRecommendationConversion('user-123', 'product-123');

      expect(mockPrisma.searchRecommendations.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          productId: 'product-123',
        },
        data: {
          converted: true,
        },
      });

      expect(result).toEqual(updateResult);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchRecommendations.updateMany.mockRejectedValue(error);

      await expect(
        searchPersonalizationService.trackRecommendationConversion('user-123', 'product-123')
      ).rejects.toThrow('Database error');
    });
  });

  describe('addToSearchHistory', () => {
    it('should add search to history', async () => {
      const preferences = {
        userId: 'user-123',
        searchHistory: ['laptop', 'phone'],
        lastUpdated: new Date(),
      };

      const updatedPreferences = {
        ...preferences,
        searchHistory: ['tablet', 'laptop', 'phone'],
        lastUpdated: expect.any(Date),
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockPrisma.userSearchPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await searchPersonalizationService.addToSearchHistory('user-123', 'tablet');

      expect(mockPrisma.userSearchPreferences.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          searchHistory: ['tablet', 'laptop', 'phone'],
          lastUpdated: expect.any(Date),
        },
      });

      expect(result.searchHistory[0]).toBe('tablet');
    });

    it('should limit search history to 50 items', async () => {
      const preferences = {
        userId: 'user-123',
        searchHistory: Array.from({ length: 50 }, (_, i) => `query-${i}`),
        lastUpdated: new Date(),
      };

      const updatedPreferences = {
        ...preferences,
        searchHistory: expect.arrayContaining('new-query'),
        lastUpdated: expect.any(Date),
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);
      mockPrisma.userSearchPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await searchPersonalizationService.addToSearchHistory('user-123', 'new-query');

      expect(result.searchHistory.length).toBeLessThanOrEqual(50);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.userSearchPreferences.findUnique.mockRejectedValue(error);

      await expect(
        searchPersonalizationService.addToSearchHistory('user-123', 'laptop')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getSearchHistory', () => {
    it('should get search history', async () => {
      const preferences = {
        userId: 'user-123',
        searchHistory: ['laptop', 'phone', 'tablet'],
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);

      const result = await searchPersonalizationService.getSearchHistory('user-123', 20);

      expect(result).toEqual(['laptop', 'phone', 'tablet']);
    });

    it('should respect limit parameter', async () => {
      const preferences = {
        userId: 'user-123',
        searchHistory: Array.from({ length: 30 }, (_, i) => `query-${i}`),
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);

      const result = await searchPersonalizationService.getSearchHistory('user-123', 10);

      expect(result).toHaveLength(10);
    });

    it('should return empty array for new user', async () => {
      const preferences = {
        userId: 'user-123',
        searchHistory: [],
      };

      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(preferences);

      const result = await searchPersonalizationService.getSearchHistory('user-123', 20);

      expect(result).toEqual([]);
    });
  });

  describe('clearSearchHistory', () => {
    it('should clear search history', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        searchHistory: [],
        lastUpdated: expect.any(Date),
      };

      mockPrisma.userSearchPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await searchPersonalizationService.clearSearchHistory('user-123');

      expect(mockPrisma.userSearchPreferences.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          searchHistory: [],
          lastUpdated: expect.any(Date),
        },
      });

      expect(result.searchHistory).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.userSearchPreferences.update.mockRejectedValue(error);

      await expect(
        searchPersonalizationService.clearSearchHistory('user-123')
      ).rejects.toThrow('Database error');
    });
  });

  describe('learnFromBehavior', () => {
    it('should learn from purchase behavior', async () => {
      const product = {
        id: 'product-123',
        name: 'Laptop 1',
        categories: [{ id: 'cat-1' }, { id: 'cat-2' }],
        brand: { id: 'brand-1' },
      };

      const existingPreferences = {
        userId: 'user-123',
        preferredCategories: ['cat-3'],
        preferredBrands: ['brand-2'],
      };

      const updatedPreferences = {
        ...existingPreferences,
        preferredCategories: ['cat-1', 'cat-2', 'cat-3'],
        preferredBrands: ['brand-1', 'brand-2'],
      };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(existingPreferences);
      mockPrisma.userSearchPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await searchPersonalizationService.learnFromBehavior('user-123', 'product-123', 'purchase');

      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        include: {
          categories: true,
          brand: true,
        },
      });

      expect(mockPrisma.userSearchPreferences.update).toHaveBeenCalled();
      expect(result.preferredCategories).toContain('cat-1');
      expect(result.preferredCategories).toContain('cat-2');
      expect(result.preferredBrands).toContain('brand-1');
    });

    it('should learn from add_to_cart behavior', async () => {
      const product = {
        id: 'product-123',
        name: 'Laptop 1',
        categories: [{ id: 'cat-1' }],
        brand: { id: 'brand-1' },
      };

      const existingPreferences = {
        userId: 'user-123',
        preferredCategories: [],
        preferredBrands: [],
      };

      const updatedPreferences = {
        ...existingPreferences,
        preferredCategories: ['cat-1'],
        preferredBrands: ['brand-1'],
      };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(existingPreferences);
      mockPrisma.userSearchPreferences.update.mockResolvedValue(updatedPreferences);

      const result = await searchPersonalizationService.learnFromBehavior('user-123', 'product-123', 'add_to_cart');

      expect(result.preferredCategories).toContain('cat-1');
      expect(result.preferredBrands).toContain('brand-1');
    });

    it('should not learn from view behavior', async () => {
      const product = {
        id: 'product-123',
        name: 'Laptop 1',
        categories: [{ id: 'cat-1' }],
        brand: { id: 'brand-1' },
      };

      const existingPreferences = {
        userId: 'user-123',
        preferredCategories: [],
        preferredBrands: [],
      };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockPrisma.userSearchPreferences.findUnique.mockResolvedValue(existingPreferences);
      mockPrisma.userSearchPreferences.update.mockResolvedValue(existingPreferences);

      const result = await searchPersonalizationService.learnFromBehavior('user-123', 'product-123', 'view');

      expect(result.preferredCategories).toEqual([]);
      expect(result.preferredBrands).toEqual([]);
    });

    it('should handle product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        searchPersonalizationService.learnFromBehavior('user-123', 'product-999', 'purchase')
      ).rejects.toThrow('Product not found');
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.product.findUnique.mockRejectedValue(error);

      await expect(
        searchPersonalizationService.learnFromBehavior('user-123', 'product-123', 'purchase')
      ).rejects.toThrow('Database error');
    });
  });

  describe('calculateSimilarityScore', () => {
    it('should calculate similarity score with matching categories and brands', () => {
      const product = {
        id: 'product-123',
        categories: [{ id: 'cat-1' }, { id: 'cat-2' }],
        brandId: 'brand-1',
      };

      const preferences = {
        preferredCategories: ['cat-1', 'cat-2', 'cat-3'],
        preferredBrands: ['brand-1', 'brand-2'],
      };

      const score = searchPersonalizationService.calculateSimilarityScore(product, preferences);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should calculate similarity score with no matches', () => {
      const product = {
        id: 'product-123',
        categories: [{ id: 'cat-4' }],
        brandId: 'brand-3',
      };

      const preferences = {
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1', 'brand-2'],
      };

      const score = searchPersonalizationService.calculateSimilarityScore(product, preferences);

      expect(score).toBe(0);
    });

    it('should calculate similarity score with empty preferences', () => {
      const product = {
        id: 'product-123',
        categories: [{ id: 'cat-1' }],
        brandId: 'brand-1',
      };

      const preferences = {
        preferredCategories: [],
        preferredBrands: [],
      };

      const score = searchPersonalizationService.calculateSimilarityScore(product, preferences);

      expect(score).toBe(0);
    });
  });

  describe('calculatePersonalizationScore', () => {
    it('should calculate personalization score', () => {
      const product = {
        id: 'product-123',
        categories: [{ id: 'cat-1' }],
        brandId: 'brand-1',
      };

      const preferences = {
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1'],
      };

      const recentSearches = [
        {
          filtersApplied: {
            categoryIds: ['cat-1', 'cat-3'],
            brandIds: ['brand-1'],
          },
        },
      ];

      const score = searchPersonalizationService.calculatePersonalizationScore(
        product,
        preferences,
        recentSearches
      );

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should calculate personalization score with no recent searches', () => {
      const product = {
        id: 'product-123',
        categories: [{ id: 'cat-1' }],
        brandId: 'brand-1',
      };

      const preferences = {
        preferredCategories: ['cat-1'],
        preferredBrands: ['brand-1'],
      };

      const score = searchPersonalizationService.calculatePersonalizationScore(product, preferences, []);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(0.5); // Only preference score, no recent search score
    });
  });

  describe('buildIndexName', () => {
    it('should build index name with default prefix', () => {
      const indexName = searchPersonalizationService.buildIndexName('product');

      expect(indexName).toBe('smarttech_products');
    });

    it('should build index name with custom prefix', () => {
      process.env.ELASTICSEARCH_INDEX_PREFIX = 'custom_';

      const indexName = searchPersonalizationService.buildIndexName('product');

      expect(indexName).toBe('custom_products');

      delete process.env.ELASTICSEARCH_INDEX_PREFIX;
    });
  });
});
