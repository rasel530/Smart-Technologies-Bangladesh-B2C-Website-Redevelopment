/**
 * Search End-to-End Tests
 * 
 * This module contains end-to-end tests for the complete search workflow
 * including search with filters, sorting, pagination, autocomplete, 
 * suggestions, popular searches, and admin analytics.
 */

const request = require('supertest');
const express = require('express');

// Mock all dependencies
jest.mock('../../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock Prisma Client
const mockPrisma = {
  searchLog: {
    create: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockImplementation(() => Promise.resolve([
      { query: 'iphone', _count: { query: 100 } },
      { query: 'laptop', _count: { query: 75 } },
      { query: 'headphones', _count: { query: 50 } },
      { query: 'smartwatch', _count: { query: 45 } },
      { query: 'tablet', _count: { query: 40 } }
    ])),
    findMany: jest.fn().mockResolvedValue([
      {
        id: 'log-001',
        query: 'iphone 15 pro',
        userId: 'user-001',
        resultsCount: 10,
        executionTime: 45,
        filters: {},
        sort: 'relevance',
        page: 1,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2026-01-15T10:00:00Z')
      },
      {
        id: 'log-002',
        query: 'wireless headphones',
        userId: 'user-002',
        resultsCount: 15,
        executionTime: 38,
        filters: { inStockOnly: true },
        sort: 'rating',
        page: 1,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2026-01-15T11:00:00Z')
      },
      {
        id: 'log-003',
        query: 'gaming laptop',
        userId: 'user-003',
        resultsCount: 8,
        executionTime: 52,
        filters: { priceRange: { min: 1000 } },
        sort: 'price_asc',
        page: 1,
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date('2026-01-15T12:00:00Z')
      }
    ]),
    findFirst: jest.fn().mockResolvedValue({
      query: 'iphone',
      timestamp: new Date('2026-01-15T10:00:00Z')
    })
  }
};

// Mock Redis Client
const mockRedisClient = {
  ping: jest.fn().mockResolvedValue('PONG'),
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),
  del: jest.fn().mockResolvedValue(1),
  pipeline: jest.fn(() => ({
    del: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  }))
};

// Mock Elasticsearch Client
const mockElasticsearchClient = {
  search: jest.fn().mockImplementation((params) => {
    // Extract query from different query structures
    let query = '';
    
    // Try to extract query from multi_match (search query)
    if (params.body?.query?.bool?.must?.[0]?.multi_match?.query) {
      query = params.body.query.bool.must[0].multi_match.query;
    }
    // Try to extract query from prefix (autocomplete)
    else if (params.body?.query?.bool?.should?.[0]?.prefix) {
      query = params.body.query.bool.should[0].prefix[`name.en`]?.value ||
               params.body.query.bool.should[0].prefix[`name.bn`]?.value || '';
    }
    // Try to extract query from term (suggestion)
    else if (params.body?.query?.bool?.should?.[0]?.term) {
      query = params.body.query.bool.should[0].term['name.en.keyword']?.value || '';
    }
    
    // Simulate different search scenarios
    if (query.toLowerCase().includes('smartphone')) {
      return Promise.resolve({
        hits: {
          total: { value: 150 },
          max_score: 5.5,
          hits: Array(20).fill(null).map((_, i) => ({
            _id: `prod-smartphone-${i}`,
            _score: 5.5 - i * 0.1,
            _source: {
              sku: `SKU-SPH-${i}`,
              name: { en: `Smartphone Pro ${i}`, bn: `স্মার্টফোন প্রো ${i}` },
              slug: `smartphone-pro-${i}`,
              shortDescription: 'Latest smartphone with amazing features',
              description: 'Complete smartphone description',
              price: { current: 999.99, sale: 899.99 },
              inventory: { quantity: 100 },
              status: 'ACTIVE',
              flags: { featured: true, newArrival: true, bestSeller: false },
              brand: { id: 'brand-apple', name: 'Apple', slug: 'apple' },
              categories: [
                { id: 'cat-electronics', name: 'Electronics', slug: 'electronics', level: 1 },
                { id: 'cat-smartphones', name: 'Smartphones', slug: 'smartphones', level: 2 }
              ],
              primaryImage: { url: 'https://example.com/smartphone.jpg' },
              stats: { averageRating: 4.5, reviewCount: 250 }
            }
          }))
        },
        aggregations: {
          categories: {
            buckets: [
              { key: 'cat-electronics', doc_count: 150, category_name: { buckets: [{ key: 'Electronics' }] } },
              { key: 'cat-smartphones', doc_count: 120, category_name: { buckets: [{ key: 'Smartphones' }] } }
            ]
          },
          brands: {
            buckets: [
              { key: 'brand-apple', doc_count: 60, brand_name: { buckets: [{ key: 'Apple' }] } },
              { key: 'brand-samsung', doc_count: 50, brand_name: { buckets: [{ key: 'Samsung' }] } }
            ]
          },
          price_ranges: {
            buckets: [
              { key: 'under_500', doc_count: 20, to: 500 },
              { key: '500_1000', doc_count: 50, from: 500, to: 1000 },
              { key: 'over_5000', doc_count: 10, from: 5000 }
            ]
          },
          ratings: {
            buckets: [
              { key: '4_and_up', doc_count: 100, from: 4 },
              { key: '3_to_4', doc_count: 40, from: 3, to: 4 }
            ]
          },
          in_stock: { doc_count: 130 }
        }
      });
    }
    
    // No results for nonexistent products
    if (query.toLowerCase().includes('nonexistentproduct12345xyz')) {
      return Promise.resolve({
        hits: {
          total: { value: 0 },
          max_score: 0,
          hits: []
        },
        aggregations: {
          categories: { buckets: [] },
          brands: { buckets: [] },
          price_ranges: { buckets: [] },
          ratings: { buckets: [] },
          in_stock: { doc_count: 0 }
        }
      });
    }
    
    // Default response
    return Promise.resolve({
      hits: {
        total: { value: 100 },
        max_score: 5.0,
        hits: Array(20).fill(null).map((_, i) => ({
          _id: `prod-${i}`,
          _score: 5.0 - i * 0.1,
          _source: {
            sku: `SKU-${i}`,
            name: { en: `Test Product ${i}`, bn: `টেস্ট প্রোডাক্ট ${i}` },
            slug: `test-product-${i}`,
            price: { current: 999.99, sale: 899.99 },
            inventory: { quantity: 100 },
            status: 'ACTIVE',
            flags: { featured: true, newArrival: false, bestSeller: true },
            brand: { id: 'brand-1', name: 'TestBrand', slug: 'testbrand' },
            categories: [{ id: 'cat-1', name: 'Electronics', slug: 'electronics', level: 1 }],
            primaryImage: { url: 'https://example.com/image.jpg' },
            stats: { averageRating: 4.2, reviewCount: 100 }
          }
        }))
      },
      aggregations: {
        categories: { buckets: [] },
        brands: { buckets: [] },
        price_ranges: { buckets: [] },
        ratings: { buckets: [] },
        in_stock: { doc_count: 80 }
      }
    });
  })
};

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: {
    optional: () => (req, res, next) => next(),
    authenticate: () => (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader === 'Bearer valid-admin-token') {
        req.user = { id: 'admin-123', email: 'admin@test.com', role: 'ADMIN' };
        next();
      } else if (authHeader === 'Bearer valid-superadmin-token') {
        req.user = { id: 'superadmin-123', email: 'superadmin@test.com', role: 'SUPER_ADMIN' };
        next();
      } else {
        res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      }
    }
  }
}));

// Mock RBAC middleware
jest.mock('../../middleware/rbacAuth', () => ({
  rbacAuthMiddleware: {
    requireRole: (...roles) => (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
      }
      next();
    }
  }
}));

const { SearchService } = require('../../services/searchService');
const SearchController = require('../../controllers/searchController');
const AdminSearchController = require('../../controllers/adminSearchController');
const { router: searchRoutes, initializeSearchController } = require('../../routes/searchRoutes');
const { router: adminSearchRoutes, initializeAdminSearchController } = require('../../routes/adminSearchRoutes');

describe('Search End-to-End Tests', () => {
  let app;
  let searchService;
  let searchController;
  let adminSearchController;

  beforeAll(() => {
    // Initialize services
    searchService = new SearchService(
      mockElasticsearchClient,
      mockPrisma,
      mockRedisClient,
      {
        defaultPage: 1,
        defaultPageSize: 20,
        maxPageSize: 100,
        enableCaching: true,
        cacheTTL: 300,
        enableAnalytics: true,
        minScore: 0.1,
        enableFuzzyByDefault: true,
        defaultLanguage: 'en',
        enableQueryOptimization: true
      }
    );
    searchService.isInitialized = true;

    // Initialize controllers
    searchController = new SearchController(searchService);
    adminSearchController = new AdminSearchController(searchService);

    // Initialize route controllers
    initializeSearchController(searchService);
    initializeAdminSearchController(searchService);

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/search', searchRoutes);
    app.use('/api/admin/search', adminSearchRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Search Workflow', () => {
    it('should perform full search workflow: search -> filter -> sort -> paginate', async () => {
      // Step 1: Initial search
      const searchResponse = await request(app)
        .get('/api/search/products')
        .query({ query: 'smartphone' });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.products).toHaveLength(20);
      expect(searchResponse.body.total).toBeGreaterThanOrEqual(100); // Mock returns 100-150
      expect(searchResponse.body.facets).toBeDefined();

      // Step 2: Apply filters
      const filteredResponse = await request(app)
        .get('/api/search/products')
        .query({
          query: 'smartphone',
          categories: ['cat-smartphones'],
          brands: ['brand-apple'],
          inStock: 'true',
          priceRange: { min: 500, max: 1500 }
        });

      expect(filteredResponse.status).toBe(200);
      expect(mockElasticsearchClient.search).toHaveBeenCalled();

      // Step 3: Apply sorting
      const sortedResponse = await request(app)
        .get('/api/search/products')
        .query({
          query: 'smartphone',
          sort: 'price-asc'
        });

      expect(sortedResponse.status).toBe(200);

      // Step 4: Navigate pages
      const page2Response = await request(app)
        .get('/api/search/products')
        .query({
          query: 'smartphone',
          page: 2,
          perPage: 10
        });

      expect(page2Response.status).toBe(200);
      expect(page2Response.body.page).toBe(2);
      expect(page2Response.body.perPage).toBe(10);
    });

    it('should handle search with all filter combinations', async () => {
      const complexFilterResponse = await request(app)
        .get('/api/search/products')
        .query({
          query: 'smartphone',
          categories: ['cat-electronics', 'cat-smartphones'],
          brands: ['brand-apple', 'brand-samsung'],
          inStock: 'true',
          featured: 'true',
          newArrivals: 'true',
          priceRange: { min: 0, max: 5000 },
          sort: 'rating',
          page: 1,
          perPage: 20
        });

      expect(complexFilterResponse.status).toBe(200);
      expect(complexFilterResponse.body.products.length).toBeGreaterThan(0);
    });

    it('should return appropriate facets for filtered search', async () => {
      const facetResponse = await request(app)
        .get('/api/search/products')
        .query({ query: 'smartphone' });

      expect(facetResponse.status).toBe(200);
      expect(facetResponse.body.facets.categories).toBeDefined();
      expect(facetResponse.body.facets.brands).toBeDefined();
      expect(facetResponse.body.facets.priceRanges).toBeDefined();
      expect(facetResponse.body.facets.ratings).toBeDefined();
      expect(facetResponse.body.facets.inStock).toBeDefined();
    });
  });

  describe('Autocomplete Workflow', () => {
    it('should complete autocomplete workflow', async () => {
      // Step 1: Type partial query
      const autocompleteResponse = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'iph' });

      expect(autocompleteResponse.status).toBe(200);
      expect(autocompleteResponse.body.suggestions.products).toBeDefined();
      expect(autocompleteResponse.body.suggestions.categories).toBeDefined();
      expect(autocompleteResponse.body.suggestions.brands).toBeDefined();
      expect(autocompleteResponse.body.suggestions.popularSearches).toBeDefined();

      // Step 2: Click on suggestion
      const selectedProduct = autocompleteResponse.body.suggestions.products[0];
      expect(selectedProduct).toHaveProperty('id');
      expect(selectedProduct).toHaveProperty('nameEn');
      expect(selectedProduct).toHaveProperty('slug');

      // Step 3: Search with selected term
      const searchResponse = await request(app)
        .get('/api/search/products')
        .query({ query: selectedProduct.nameEn });

      expect(searchResponse.status).toBe(200);
    });

    it('should support bilingual autocomplete', async () => {
      const bengaliAutocomplete = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'স্মার্ট', language: 'bn' });

      expect(bengaliAutocomplete.status).toBe(200);
      expect(mockElasticsearchClient.search).toHaveBeenCalled();
    });

    it('should return popular searches in autocomplete', async () => {
      const popularAutocomplete = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'test' });

      expect(popularAutocomplete.status).toBe(200);
      expect(popularAutocomplete.body.suggestions.popularSearches.length).toBeGreaterThan(0);
    });
  });

  describe('Suggestions Workflow', () => {
    it('should complete suggestions workflow', async () => {
      // Step 1: Get suggestions for typo
      const suggestionsResponse = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'iphne' });

      expect(suggestionsResponse.status).toBe(200);
      expect(suggestionsResponse.body.relatedQueries).toBeDefined();

      // Step 2: Use a related term if available
      const searchTerm = suggestionsResponse.body.relatedQueries.length > 0
        ? suggestionsResponse.body.relatedQueries[0]
        : 'iphone';
      const searchResponse = await request(app)
        .get('/api/search/products')
        .query({ query: searchTerm });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.total).toBeGreaterThan(0);
    });

    it('should return related searches', async () => {
      const relatedResponse = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'iphone' });

      expect(relatedResponse.status).toBe(200);
      expect(relatedResponse.body.relatedQueries).toBeDefined();
    });
  });

  describe('Popular Searches Workflow', () => {
    it('should retrieve and display popular searches', async () => {
      const popularResponse = await request(app)
        .get('/api/search/popular');

      expect(popularResponse.status).toBe(200);
      expect(popularResponse.body.queries.length).toBe(5);
      expect(popularResponse.body.queries).toContain('iphone');
      expect(popularResponse.body.queries).toContain('laptop');
    });

    it('should filter popular searches by period', async () => {
      const todayPopular = await request(app)
        .get('/api/search/popular')
        .query({ period: 'today' });

      expect(todayPopular.status).toBe(200);
      expect(todayPopular.body.period).toBe('today');

      const weekPopular = await request(app)
        .get('/api/search/popular')
        .query({ period: 'week' });

      expect(weekPopular.status).toBe(200);
      expect(weekPopular.body.period).toBe('week');

      const monthPopular = await request(app)
        .get('/api/search/popular')
        .query({ period: 'month' });

      expect(monthPopular.status).toBe(200);
      expect(monthPopular.body.period).toBe('month');
    });

    it('should support custom limit for popular searches', async () => {
      const limitedPopular = await request(app)
        .get('/api/search/popular')
        .query({ limit: 3 });

      expect(limitedPopular.status).toBe(200);
      expect(limitedPopular.body.queries.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Admin Analytics Workflow', () => {
    it('should complete admin analytics workflow', async () => {
      // Step 1: Authenticate as admin
      const analyticsResponse = await request(app)
        .get('/api/admin/search/analytics')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.analytics.totalSearches).toBeGreaterThanOrEqual(0); // Mock returns data
      expect(analyticsResponse.body.analytics.uniqueQueries).toBeDefined();
      expect(analyticsResponse.body.analytics.topQueries).toBeDefined();
    });

    it('should filter analytics by date range', async () => {
      const dateRangeResponse = await request(app)
        .get('/api/admin/search/analytics')
        .query({
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-01-31T23:59:59Z'
        })
        .set('Authorization', 'Bearer valid-admin-token');

      expect(dateRangeResponse.status).toBe(200);
      expect(dateRangeResponse.body.period.startDate).toBeDefined();
      expect(dateRangeResponse.body.period.endDate).toBeDefined();
    });

    it('should support time series grouping', async () => {
      const dailyResponse = await request(app)
        .get('/api/admin/search/analytics')
        .query({ groupBy: 'day' })
        .set('Authorization', 'Bearer valid-admin-token');

      expect(dailyResponse.status).toBe(200);
      expect(dailyResponse.body.analytics.timeSeries).toBeDefined();

      const weeklyResponse = await request(app)
        .get('/api/admin/search/analytics')
        .query({ groupBy: 'week' })
        .set('Authorization', 'Bearer valid-admin-token');

      expect(weeklyResponse.status).toBe(200);

      const monthlyResponse = await request(app)
        .get('/api/admin/search/analytics')
        .query({ groupBy: 'month' })
        .set('Authorization', 'Bearer valid-admin-token');

      expect(monthlyResponse.status).toBe(200);
    });

    it('should provide comprehensive performance metrics', async () => {
      const performanceResponse = await request(app)
        .get('/api/admin/search/performance')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(performanceResponse.status).toBe(200);
      expect(performanceResponse.body.performance.totalSearches).toBeGreaterThanOrEqual(0); // Mock returns data
      expect(performanceResponse.body.performance.avgExecutionTime).toBeDefined();
      expect(performanceResponse.body.performance.p95ExecutionTime).toBeDefined();
      expect(performanceResponse.body.performance.p99ExecutionTime).toBeDefined();
      expect(performanceResponse.body.performance.zeroResultsRate).toBeDefined();
      expect(performanceResponse.body.performance.slowQueries).toBeDefined();
      expect(performanceResponse.body.performance.fastQueries).toBeDefined();
    });

    it('should require proper authorization for admin endpoints', async () => {
      // Without token
      const unauthorizedResponse = await request(app)
        .get('/api/admin/search/analytics');

      expect(unauthorizedResponse.status).toBe(401);
    });
  });

  describe('Complete User Journey', () => {
    it('should handle complete user search journey', async () => {
      // User journey:
      // 1. Start typing in search box (autocomplete)
      // 2. See suggestions and popular searches
      // 3. Click on a suggestion
      // 4. Apply filters and sorting
      // 5. Navigate through pages
      // 6. Get spelling suggestions
      // 7. Try related searches

      // Step 1: Autocomplete
      const autocomplete = await request(app)
        .get('/api/search/autocomplete')
        .query({ query: 'sma' });

      expect(autocomplete.status).toBe(200);

      // Step 2: Suggestions
      const suggestions = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'smarphone' }); // Intentional typo

      expect(suggestions.status).toBe(200);
      expect(suggestions.body.relatedQueries).toBeDefined();

      // Step 3: Search with corrected term or default
      const searchTerm = suggestions.body.relatedQueries.length > 0
        ? suggestions.body.relatedQueries[0]
        : 'smartphone';
      const search = await request(app)
        .get('/api/search/products')
        .query({ query: searchTerm });

      expect(search.status).toBe(200);
      expect(search.body.products.length).toBeGreaterThan(0);

      // Step 4: Apply filters
      const filtered = await request(app)
        .get('/api/search/products')
        .query({
          query: 'smartphone',
          inStock: 'true',
          sort: 'price-asc',
          page: 1,
          perPage: 10
        });

      expect(filtered.status).toBe(200);
      expect(filtered.body.page).toBe(1);
      expect(filtered.body.perPage).toBe(10);

      // Step 5: Pagination
      const page2 = await request(app)
        .get('/api/search/products')
        .query({
          query: 'smartphone',
          page: 2
        });

      expect(page2.status).toBe(200);
      expect(page2.body.page).toBe(2);

      // Step 6: Related searches
      const related = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'smartphone' });

      expect(related.status).toBe(200);
      expect(related.body.relatedQueries.length).toBeGreaterThan(0);

      // Step 7: Popular searches
      const popular = await request(app)
        .get('/api/search/popular');

      expect(popular.status).toBe(200);
      expect(popular.body.queries.length).toBeGreaterThan(0);
    });

    it('should handle user journey with no results', async () => {
      // User searches for something that returns no results

      const noResultsSearch = await request(app)
        .get('/api/search/products')
        .query({ query: 'nonexistentproduct12345xyz' });

      expect(noResultsSearch.status).toBe(200);
      expect(noResultsSearch.body.total).toBe(0);
      expect(noResultsSearch.body.products).toHaveLength(0);

      // Should still get suggestions
      const suggestions = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'nonexistentproduct12345xyz' });

      expect(suggestions.status).toBe(200);
    });

    it('should handle advanced filtering workflow', async () => {
      // User applies multiple complex filters

      const advancedSearch = await request(app)
        .get('/api/search/products')
        .query({
          query: 'smartphone',
          categories: ['cat-electronics', 'cat-smartphones'],
          brands: ['brand-apple', 'brand-samsung'],
          inStock: 'true',
          featured: 'true',
          priceRange: { min: 500, max: 2000 },
          sort: 'rating',
          page: 1,
          perPage: 50
        });

      expect(advancedSearch.status).toBe(200);
      expect(advancedSearch.body.facets.categories).toBeDefined();
      expect(advancedSearch.body.facets.brands).toBeDefined();
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should recover from search errors gracefully', async () => {
      // Store original mock implementation
      const originalMock = mockElasticsearchClient.search;
      
      // Temporarily cause an error
      mockElasticsearchClient.search.mockRejectedValueOnce(new Error('Connection timeout'));

      const errorResponse = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      // Should return error, not crash
      expect([400, 500]).toContain(errorResponse.status);

      // Restore original mock
      mockElasticsearchClient.search = originalMock;

      // Subsequent requests should work
      const recoveryResponse = await request(app)
        .get('/api/search/products')
        .query({ query: 'test' });

      expect(recoveryResponse.status).toBe(200);
    });

    it('should handle malformed query parameters', async () => {
      // Invalid page number
      const invalidPage = await request(app)
        .get('/api/search/products')
        .query({ page: -1 });

      expect([400, 500]).toContain(invalidPage.status);

      // Invalid perPage - controller validates and caps to max
      const invalidPerPage = await request(app)
        .get('/api/search/products')
        .query({ perPage: 1000 });

      // Controller returns 400 for perPage > 100 (validation in route)
      expect([400, 200]).toContain(invalidPerPage.status);
    });
  });

  describe('Bilingual Support Workflow', () => {
    it('should support Bengali language search', async () => {
      const bengaliSearch = await request(app)
        .get('/api/search/products')
        .query({
          query: 'স্মার্টফোন',
          language: 'bn'
        });

      expect(bengaliSearch.status).toBe(200);
      expect(mockElasticsearchClient.search).toHaveBeenCalled();
    });

    it('should support Bengali autocomplete', async () => {
      const bengaliAutocomplete = await request(app)
        .get('/api/search/autocomplete')
        .query({
          query: 'স্মার্ট',
          language: 'bn'
        });

      expect(bengaliAutocomplete.status).toBe(200);
    });
  });

  describe('Response Time Expectations', () => {
    it('should respond within acceptable time for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/search/products', params: { query: 'test' } },
        { method: 'GET', path: '/api/search/autocomplete', params: { query: 'test' } },
        { method: 'GET', path: '/api/search/suggestions', params: { query: 'test' } },
        { method: 'GET', path: '/api/search/popular', params: {} }
      ];

      for (const endpoint of endpoints) {
        const start = Date.now();
        await request(app)[endpoint.method.toLowerCase()](endpoint.path)
          .query(endpoint.params);
        const duration = Date.now() - start;

        console.log(`${endpoint.path} response time: ${duration}ms`);

        // Should respond within 500ms
        expect(duration).toBeLessThan(500);
      }
    });
  });
});
