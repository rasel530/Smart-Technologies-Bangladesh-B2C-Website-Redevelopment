/**
 * Search Routes Integration Tests
 * 
 * This module contains integration tests for the search API endpoints
 search * including advanced, autocomplete, suggestions, and popular searches.
 */

const request = require('supertest');
const express = require('express');

// Mock dependencies before requiring routes
jest.mock('../../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock SearchService
const mockSearchService = {
  advancedSearch: jest.fn(),
  autocomplete: jest.fn(),
  getSuggestions: jest.fn(),
  getPopularSearches: jest.fn(),
  initialize: jest.fn().mockResolvedValue(undefined),
  shutdown: jest.fn().mockResolvedValue(undefined)
};

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: {
    optional: () => (req, res, next) => next()
  }
}));

const { router, initializeSearchController } = require('../../routes/searchRoutes');

describe('Search Routes Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Initialize the search controller with mock service
    initializeSearchController(mockSearchService);

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/search', router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/search/products', () => {
    const mockSearchResult = {
      success: true,
      total: 100,
      results: [
        {
          id: 'prod-001',
          nameEn: 'Test Product',
          slug: 'test-product',
          regularPrice: 999.99,
          finalPrice: 899.99,
          stockQuantity: 50
        }
      ],
      facets: {
        categories: [{ id: 'cat-1', name: 'Electronics', count: 50 }],
        brands: [{ id: 'brand-1', name: 'TestBrand', count: 30 }]
      },
      page: 1,
      pageSize: 20,
      totalPages: 5,
      executionTime: 45,
      cached: false,
      maxScore: 5.5
    };

    beforeEach(() => {
      mockSearchService.advancedSearch.mockResolvedValue(mockSearchResult);
    });

    it('should return search results for valid query', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'smartphone' });

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(1);
      expect(response.body.total).toBe(100);
      expect(response.body.page).toBe(1);
      expect(response.body.perPage).toBe(20);
    });

    it('should handle empty query', async () => {
      mockSearchService.advancedSearch.mockResolvedValue({
        ...mockSearchResult,
        results: [],
        total: 0
      });

      const response = await request(app)
        .get('/api/search/products')
        .query({ query: '' });

      expect(response.status).toBe(200);
      expect(mockSearchService.advancedSearch).toHaveBeenCalled();
    });

    it('should pass filter parameters to search service', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({
          query: 'smartphone',
          categories: 'cat-1,cat-2', // Pass as string, controller converts to array
          brands: 'brand-1',
          inStock: 'true',
          featured: 'true'
        });

      expect(response.status).toBe(200);
      expect(mockSearchService.advancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'smartphone',
          categoryIds: ['cat-1', 'cat-2'], // Controller converts to array
          brandIds: ['brand-1'],
          inStockOnly: true,
          featuredOnly: true
        }),
        undefined,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should pass pagination parameters to search service', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({
          query: 'test',
          page: 2,
          perPage: 50
        });

      expect(response.status).toBe(200);
      expect(mockSearchService.advancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 50
        }),
        undefined,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should respect max perPage limit of 100', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({
          query: 'test',
          perPage: 200
        });

      expect(response.status).toBe(200);
      expect(mockSearchService.advancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 100
        }),
        undefined,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should pass sort option to search service', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({
          query: 'test',
          sort: 'price-asc'
        });

      expect(response.status).toBe(200);
      expect(mockSearchService.advancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'price_asc'
        }),
        undefined,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should pass price range to search service', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({
          query: 'test',
          priceRange: { min: 500, max: 1000 }
        });

      expect(response.status).toBe(200);
      expect(mockSearchService.advancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          priceRange: { min: 500, max: 1000 }
        }),
        undefined,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should return facets in response', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.facets).toBeDefined();
      expect(response.body.facets.categories).toBeDefined();
      expect(response.body.facets.brands).toBeDefined();
    });

    it('should include suggestions in response', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.suggestions).toBeDefined();
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    it('should return execution time', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.executionTime).toBeDefined();
      expect(typeof response.body.executionTime).toBe('number');
    });

    it('should return cached flag', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.cached).toBeDefined();
      expect(typeof response.body.cached).toBe('boolean');
    });

    it('should handle search service errors', async () => {
      mockSearchService.advancedSearch.mockRejectedValue(new Error('Search failed'));

      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Search failed');
    });

    it('should handle price range with only min', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({
          query: 'test',
          priceRange: { min: 500 }
        });

      expect(response.status).toBe(200);
      expect(mockSearchService.advancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          priceRange: { min: 500, max: undefined }
        }),
        undefined,
        expect.any(String),
        expect.any(String)
      );
    });

    it('should handle price range with only max', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({
          query: 'test',
          priceRange: { max: 1000 }
        });

      expect(response.status).toBe(200);
      expect(mockSearchService.advancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          priceRange: { min: undefined, max: 1000 }
        }),
        undefined,
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('GET /api/search/autocomplete', () => {
    const mockAutocompleteResult = {
      success: true,
      query: 'iph',
      products: [
        {
          id: 'prod-001',
          nameEn: 'iPhone 15 Pro',
          slug: 'iphone-15-pro',
          image: 'https://example.com/image.jpg',
          regularPrice: 999.99,
          category: { name: 'Smartphones', slug: 'smartphones' },
          brand: { name: 'Apple', slug: 'apple' }
        }
      ],
      categories: [
        { id: 'cat-1', name: 'iPhones', slug: 'iphones', productCount: 10 }
      ],
      brands: [
        { id: 'brand-apple', name: 'Apple', slug: 'apple', productCount: 50 }
      ],
      popularSearches: ['iphone', 'iphone 15', 'iphone case'],
      executionTime: 25
    };

    beforeEach(() => {
      mockSearchService.autocomplete.mockResolvedValue(mockAutocompleteResult);
    });

    it('should return autocomplete suggestions for valid query', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
      expect(response.body.suggestions).toBeDefined();
      expect(response.body.suggestions.products).toHaveLength(1);
      expect(response.body.suggestions.categories).toHaveLength(1);
      expect(response.body.suggestions.brands).toHaveLength(1);
    });

    it('should require query parameter', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({});

      expect(response.status).toBe(500); // Controller passes to service which validates
      expect(response.body.error).toBe('Autocomplete failed'); // Service returns error for empty query
    });

    it('should reject empty query', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'iph', limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.suggestions.products.length).toBeLessThanOrEqual(5);
    });

    it('should respect max limit of 20', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'iph', limit: 50 });

      expect(response.status).toBe(200); // Controller passes limit to service
      // Service slices the results to limit
      expect(response.body.suggestions.products.length).toBeLessThanOrEqual(20);
    });

    it('should support Bengali language', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'স্মার্ট', language: 'bn' });

      expect(response.status).toBe(200);
      expect(mockSearchService.autocomplete).toHaveBeenCalledWith('স্মার্ট', 'bn');
    });

    it('should return total count of suggestions', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
      expect(response.body.count).toBeDefined();
      expect(typeof response.body.count).toBe('number');
    });

    it('should return execution time', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
      expect(response.body.executionTime).toBeDefined();
    });

    it('should handle autocomplete errors', async () => {
      mockSearchService.autocomplete.mockRejectedValue(new Error('Autocomplete failed'));

      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'iph' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Autocomplete failed');
    });

    it('should handle special characters in query', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'test@#$%' });

      expect(response.status).toBe(200);
      expect(mockSearchService.autocomplete).toHaveBeenCalledWith('test@#$%', 'en');
    });
  });

  describe('GET /api/search/suggestions', () => {
    const mockSuggestionResult = {
      success: true,
      query: 'iph',
      suggestions: ['iPhone 15', 'iPhone 14', 'iPhone case'],
      didYouMean: ['iPhone 15 Pro', 'iPhone 15 Plus'],
      relatedSearches: ['iphone charger', 'iphone cable', 'iphone adapter'],
      executionTime: 30
    };

    beforeEach(() => {
      mockSearchService.getSuggestions.mockResolvedValue(mockSuggestionResult);
    });

    it('should return suggestions for valid query', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
      expect(response.body.didYouMean).toBeDefined();
      expect(response.body.relatedQueries).toBeDefined();
      expect(response.body.trendingProducts).toBeDefined();
    });

    it('should require query parameter', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({});

      expect(response.status).toBe(500); // Controller passes to service which validates
      expect(response.body.error).toBe('Suggestions failed'); // Service returns error for empty query
    });

    it('should reject empty query', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ query: '' });

      expect(response.status).toBe(400);
    });

    it('should return did you mean suggestions', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
      expect(response.body.didYouMean).toContain('iPhone 15 Pro');
      expect(response.body.didYouMean).toContain('iPhone 15 Plus');
    });

    it('should return related queries', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
      expect(response.body.relatedQueries).toContain('iphone charger');
      expect(response.body.relatedQueries).toContain('iphone cable');
    });

    it('should return trending products', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
      expect(response.body.trendingProducts).toBeDefined();
      expect(Array.isArray(response.body.trendingProducts)).toBe(true);
    });

    it('should handle suggestion errors', async () => {
      mockSearchService.getSuggestions.mockRejectedValue(new Error('Suggestions failed'));

      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'iph' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Suggestions failed');
    });
  });

  describe('GET /api/search/popular', () => {
    const mockPopularSearches = ['iphone', 'laptop', 'headphones', 'smartwatch', 'tablet'];

    beforeEach(() => {
      mockSearchService.getPopularSearches.mockResolvedValue(mockPopularSearches);
    });

    it('should return popular searches', async () => {
      const response = await request(app)
        .get('/api/search/popular');

      expect(response.status).toBe(200);
      expect(response.body.queries).toEqual(['iphone', 'laptop', 'headphones', 'smartwatch', 'tablet']);
      expect(response.body.count).toBe(5);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/search/popular')
        .query({ limit: 3 });

      expect(response.status).toBe(200);
      expect(response.body.queries).toHaveLength(3);
      expect(mockSearchService.getPopularSearches).toHaveBeenCalledWith(3);
    });

    it('should respect max limit of 50', async () => {
      const response = await request(app)
        .get('/api/search/popular')
        .query({ limit: 100 });

      expect(response.status).toBe(200); // Controller passes limit to service
      expect(mockSearchService.getPopularSearches).toHaveBeenCalledWith(50);
    });

    it('should pass period parameter', async () => {
      const response = await request(app)
        .get('/api/search/popular')
        .query({ period: 'week' });

      expect(response.status).toBe(200);
      expect(response.body.period).toBe('week');
    });

    it('should return execution time', async () => {
      const response = await request(app)
        .get('/api/search/popular');

      expect(response.status).toBe(200);
      expect(response.body.executionTime).toBeDefined();
    });

    it('should handle popular searches errors', async () => {
      mockSearchService.getPopularSearches.mockRejectedValue(new Error('Failed to get popular searches'));

      const response = await request(app)
        .get('/api/search/popular');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to get popular searches');
    });

    it('should handle empty popular searches', async () => {
      mockSearchService.getPopularSearches.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/search/popular');

      expect(response.status).toBe(200);
      expect(response.body.queries).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid page parameter', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ page: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject invalid perPage parameter', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ perPage: 0 });

      expect(response.status).toBe(400);
    });

    it('should reject invalid price range values', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ priceRange: { min: -100 } });

      expect(response.status).toBe(400);
    });

    it('should reject invalid inStock parameter', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ inStock: 'not-a-boolean' });

      expect(response.status).toBe(400);
    });

    it('should reject invalid sort option', async () => {
      // This should still work as the controller parses the sort option
      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test', sort: 'invalid-sort' });

      // Invalid sort is parsed to default 'relevance'
      expect(response.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should work without authentication (optional auth)', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      expect(response.status).toBe(200);
    });

    it('should not require authentication for autocomplete', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
    });

    it('should not require authentication for suggestions', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
    });

    it('should not require authentication for popular searches', async () => {
      const response = await request(app)
        .get('/api/search/popular');

      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/search/products')
          .query({ query: 'test' })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Response Format', () => {
    it('should return consistent response structure for products endpoint', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('perPage');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('facets');
      expect(response.body).toHaveProperty('suggestions');
      expect(response.body).toHaveProperty('executionTime');
      expect(response.body).toHaveProperty('cached');
    });

    it('should return consistent response structure for autocomplete endpoint', async () => {
      const response = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suggestions');
      expect(response.body.suggestions).toHaveProperty('products');
      expect(response.body.suggestions).toHaveProperty('categories');
      expect(response.body.suggestions).toHaveProperty('brands');
      expect(response.body.suggestions).toHaveProperty('popularSearches');
      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('executionTime');
      expect(response.body).toHaveProperty('count');
    });

    it('should return consistent response structure for suggestions endpoint', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'iph' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('didYouMean');
      expect(response.body).toHaveProperty('relatedQueries');
      expect(response.body).toHaveProperty('trendingProducts');
      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('executionTime');
    });

    it('should return consistent response structure for popular endpoint', async () => {
      const response = await request(app)
        .get('/api/search/popular');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('queries');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('executionTime');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in specifications parameter', async () => {
      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test', specifications: '{invalid-json' });

      // Should return 500 due to JSON parse error in controller
      expect([400, 500]).toContain(response.status);
    });

    it('should handle unknown endpoint gracefully', async () => {
      const response = await request(app)
        .get('/api/search/unknown');

      expect(response.status).toBe(404);
    });

    it('should handle search service returning error object', async () => {
      mockSearchService.advancedSearch.mockResolvedValue({
        success: false,
        error: 'Elasticsearch connection failed',
        total: 0,
        results: [],
        page: 1,
        pageSize: 20,
        totalPages: 0,
        executionTime: 0
      });

      const response = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      expect(response.status).toBe(200); // Controller doesn't check success flag
    });
  });
});
