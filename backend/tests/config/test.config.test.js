/**
 * Test Configuration
 * 
 * This module provides test configuration for the search functionality tests
 * including database, Elasticsearch, and Redis configuration for testing.
 */

// Test environment configuration
const testConfig = {
  // Database configuration
  database: {
    url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smarttech_test',
    // Prisma configuration for testing
    prisma: {
      log: ['error', 'warn'],
      // Use a separate database for testing
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smarttech_test'
        }
      }
    }
  },

  // Elasticsearch configuration
  elasticsearch: {
    node: process.env.TEST_ELASTICSEARCH_URL || process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    indexPrefix: process.env.TEST_ELASTICSEARCH_INDEX_PREFIX || 'smarttech_test_',
    // Test indices
    indices: {
      products: 'smarttech_test_products',
      categories: 'smarttech_test_categories',
      brands: 'smarttech_test_brands'
    },
    // Request timeout
    requestTimeout: 30000,
    // Number of retries
    maxRetries: 3
  },

  // Redis configuration
  redis: {
    url: process.env.TEST_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
    // Cache key prefix for tests
    keyPrefix: 'search:test:',
    // Default TTL for test cache entries
    defaultTTL: 60,
    // Database number
    db: 1
  },

  // Test settings
  test: {
    // Default timeout for tests
    timeout: 30000,
    // Number of retries for flaky tests
    retries: 0,
    // Test environment
    environment: process.env.NODE_ENV || 'test',
    // Coverage threshold
    coverage: {
      branches: 75,
      functions: 80,
      lines: 75,
      statements: 75
    }
  },

  // Performance test settings
  performance: {
    // Target response times (in milliseconds)
    targets: {
      searchP95: 300,
      searchP99: 500,
      autocompleteP95: 100,
      filterP95: 100
    },
    // Cache hit rate target (percentage)
    cacheHitRateTarget: 80,
    // Concurrent requests for load testing
    concurrentRequests: 100,
    // Total requests for load testing
    totalRequests: 10000
  },

  // Pagination test settings
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    testPageSizes: [10, 20, 50, 100]
  },

  // Search test settings
  search: {
    // Test queries
    testQueries: [
      'smartphone',
      'laptop',
      'headphones',
      'iphone',
      'samsung',
      'wireless earbuds',
      'gaming mouse',
      'mechanical keyboard'
    ],
    // Empty query
    emptyQuery: '',
    // Long query for testing
    longQuery: 'This is a very long search query that tests the system\'s ability to handle lengthy input strings with multiple words and potential edge cases',
    // Special characters query
    specialCharsQuery: 'test@#$%^&*()query',
    // Unicode query (Bengali)
    unicodeQuery: 'স্মার্টফোন'
  },

  // Filter test settings
  filters: {
    // Test price ranges
    priceRanges: [
      { min: 0, max: 500 },
      { min: 500, max: 1000 },
      { min: 1000, max: 2000 },
      { min: 2000, max: 5000 },
      { min: 5000, max: undefined }
    ],
    // Test specifications
    specifications: [
      { name: 'Color', values: ['Black', 'White'] },
      { name: 'Storage', values: ['64GB', '128GB', '256GB'] },
      { name: 'RAM', values: ['4GB', '8GB', '16GB'] }
    ],
    // Test sort options
    sortOptions: ['relevance', 'price_asc', 'price_desc', 'rating', 'newest', 'name_asc', 'name_desc']
  },

  // Admin test settings
  admin: {
    // Test admin credentials
    adminUser: {
      id: 'test-admin-id',
      email: 'admin@test.com',
      role: 'ADMIN'
    },
    superAdminUser: {
      id: 'test-super-admin-id',
      email: 'superadmin@test.com',
      role: 'SUPER_ADMIN'
    },
    // Test periods
    periods: ['today', 'week', 'month', 'all']
  }
};

// Helper functions for test configuration
const testConfigHelpers = {
  /**
   * Get full index name with test prefix
   * @param {string} baseName - Base index name
   * @returns {string} Full index name with prefix
   */
  getIndexName: (baseName) => {
    return `${testConfig.elasticsearch.indexPrefix}${baseName}`;
  },

  /**
   * Get full cache key with test prefix
   * @param {string} key - Base cache key
   * @returns {string} Full cache key with prefix
   */
  getCacheKey: (key) => {
    return `${testConfig.redis.keyPrefix}${key}`;
  },

  /**
   * Create test search query
   * @param {Object} overrides - Query overrides
   * @returns {Object} Test search query
   */
  createTestQuery: (overrides = {}) => {
    return {
      query: testConfig.search.testQueries[0],
      page: 1,
      pageSize: testConfig.pagination.defaultPageSize,
      sort: 'relevance',
      language: 'en',
      enableFuzzy: true,
      ...overrides
    };
  },

  /**
   * Create test product
   * @param {Object} overrides - Product overrides
   * @returns {Object} Test product
   */
  createTestProduct: (overrides = {}) => {
    return {
      id: `test-product-${Date.now()}`,
      sku: `SKU-${Date.now()}`,
      name: {
        en: 'Test Smartphone Pro',
        bn: 'টেস্ট স্মার্টফোন প্রো'
      },
      slug: 'test-smartphone-pro',
      shortDescription: 'A test smartphone for unit testing',
      description: 'This is a comprehensive test product description for search functionality testing.',
      price: {
        current: 999.99,
        sale: 899.99
      },
      inventory: {
        quantity: 100,
        lowStockThreshold: 10
      },
      status: 'ACTIVE',
      flags: {
        featured: true,
        newArrival: true,
        bestSeller: false
      },
      brand: {
        id: 'test-brand-1',
        name: 'TestBrand',
        slug: 'testbrand'
      },
      categories: [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          level: 1
        },
        {
          id: 'cat-2',
          name: 'Smartphones',
          slug: 'smartphones',
          parentId: 'cat-1',
          level: 2
        }
      ],
      primaryImage: {
        url: 'https://example.com/images/test-product.jpg',
        thumbnailUrl: 'https://example.com/images/test-product-thumb.jpg',
        altText: 'Test Product Image'
      },
      stats: {
        averageRating: 4.5,
        reviewCount: 150,
        viewCount: 5000
      },
      specifications: [
        { name: 'Color', value: 'Black' },
        { name: 'Storage', value: '128GB' },
        { name: 'RAM', value: '8GB' }
      ],
      ...overrides
    };
  },

  /**
   * Create test category
   * @param {Object} overrides - Category overrides
   * @returns {Object} Test category
   */
  createTestCategory: (overrides = {}) => {
    return {
      id: `test-cat-${Date.now()}`,
      name: {
        en: 'Test Category',
        bn: 'টেস্ট ক্যাটাগরি'
      },
      slug: 'test-category',
      description: 'A test category for search testing',
      productCount: 50,
      level: 1,
      parentId: null,
      ...overrides
    };
  },

  /**
   * Create test brand
   * @param {Object} overrides - Brand overrides
   * @returns {Object} Test brand
   */
  createTestBrand: (overrides = {}) => {
    return {
      id: `test-brand-${Date.now()}`,
      name: 'TestBrand',
      slug: 'testbrand',
      description: 'A test brand for search testing',
      logoUrl: 'https://example.com/logos/testbrand.png',
      productCount: 100,
      isFeatured: true,
      ...overrides
    };
  },

  /**
   * Create test search log
   * @param {Object} overrides - Search log overrides
   * @returns {Object} Test search log
   */
  createTestSearchLog: (overrides = {}) => {
    return {
      id: `test-log-${Date.now()}`,
      query: testConfig.search.testQueries[0],
      userId: 'test-user-id',
      resultsCount: 10,
      executionTime: 50,
      filters: {
        categoryIds: ['cat-1'],
        brandIds: ['brand-1']
      },
      sort: 'relevance',
      page: 1,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      timestamp: new Date(),
      ...overrides
    };
  }
};

// Export configuration and helpers
module.exports = {
  testConfig,
  testConfigHelpers
};
