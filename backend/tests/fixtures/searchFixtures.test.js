/**
 * Search Test Fixtures
 * 
 * This module provides sample test data for search functionality tests
 * including products, categories, brands, search queries, and search logs.
 */

// Sample product data
const sampleProducts = [
  {
    id: 'prod-001',
    sku: 'SKU-SPH-001',
    name: {
      en: 'iPhone 15 Pro Max',
      bn: 'আইফোন ১৫ প্রো ম্যাক্স'
    },
    slug: 'iphone-15-pro-max',
    shortDescription: 'The most advanced iPhone ever with A17 Pro chip',
    description: 'The iPhone 15 Pro Max features the revolutionary A17 Pro chip, a titanium design, and the most powerful camera system ever on an iPhone.',
    regularPrice: 1199.99,
    salePrice: 1099.99,
    stockQuantity: 50,
    lowStockThreshold: 10,
    status: 'ACTIVE',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    brand: {
      id: 'brand-apple',
      name: 'Apple',
      slug: 'apple'
    },
    categories: [
      {
        id: 'cat-electronics',
        name: 'Electronics',
        slug: 'electronics',
        level: 1
      },
      {
        id: 'cat-smartphones',
        name: 'Smartphones',
        slug: 'smartphones',
        parentId: 'cat-electronics',
        level: 2
      },
      {
        id: 'cat-iphone',
        name: 'iPhone',
        slug: 'iphone',
        parentId: 'cat-smartphones',
        level: 3
      }
    ],
    primaryImage: {
      url: 'https://example.com/images/iphone-15-pro-max.jpg',
      thumbnailUrl: 'https://example.com/images/iphone-15-pro-max-thumb.jpg',
      altText: 'iPhone 15 Pro Max'
    },
    averageRating: 4.8,
    reviewCount: 250,
    specifications: [
      { name: 'Color', value: 'Natural Titanium' },
      { name: 'Storage', value: '256GB' },
      { name: 'Display', value: '6.7-inch Super Retina XDR' },
      { name: 'Processor', value: 'A17 Pro' }
    ]
  },
  {
    id: 'prod-002',
    sku: 'SKU-SPH-002',
    name: {
      en: 'Samsung Galaxy S24 Ultra',
      bn: 'স্যামসাং গ্যালাক্সি এস২৪ আল্ট্রা'
    },
    slug: 'samsung-galaxy-s24-ultra',
    shortDescription: 'The ultimate Galaxy with S Pen included',
    description: 'Experience the new Samsung Galaxy S24 Ultra with its titanium frame, 200MP camera, and built-in S Pen.',
    regularPrice: 1299.99,
    salePrice: 1199.99,
    stockQuantity: 75,
    lowStockThreshold: 10,
    status: 'ACTIVE',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    brand: {
      id: 'brand-samsung',
      name: 'Samsung',
      slug: 'samsung'
    },
    categories: [
      {
        id: 'cat-electronics',
        name: 'Electronics',
        slug: 'electronics',
        level: 1
      },
      {
        id: 'cat-smartphones',
        name: 'Smartphones',
        slug: 'smartphones',
        parentId: 'cat-electronics',
        level: 2
      }
    ],
    primaryImage: {
      url: 'https://example.com/images/samsung-s24-ultra.jpg',
      thumbnailUrl: 'https://example.com/images/samsung-s24-ultra-thumb.jpg',
      altText: 'Samsung Galaxy S24 Ultra'
    },
    averageRating: 4.7,
    reviewCount: 180,
    specifications: [
      { name: 'Color', value: 'Titanium Gray' },
      { name: 'Storage', value: '512GB' },
      { name: 'Display', value: '6.8-inch QHD+' },
      { name: 'Processor', value: 'Snapdragon 8 Gen 3' }
    ]
  },
  {
    id: 'prod-003',
    sku: 'SKU-LPT-001',
    name: {
      en: 'MacBook Pro 16-inch M3 Max',
      bn: 'ম্যাকবুক প্রো ১৬-ইঞ্চি এম৩ ম্যাক্স'
    },
    slug: 'macbook-pro-16-inch-m3-max',
    shortDescription: 'The ultimate pro laptop for professionals',
    description: 'The MacBook Pro 16-inch with M3 Max chip delivers extraordinary performance for professional workflows.',
    regularPrice: 3499.99,
    salePrice: 3299.99,
    stockQuantity: 25,
    lowStockThreshold: 5,
    status: 'ACTIVE',
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    brand: {
      id: 'brand-apple',
      name: 'Apple',
      slug: 'apple'
    },
    categories: [
      {
        id: 'cat-electronics',
        name: 'Electronics',
        slug: 'electronics',
        level: 1
      },
      {
        id: 'cat-laptops',
        name: 'Laptops',
        slug: 'laptops',
        parentId: 'cat-electronics',
        level: 2
      },
      {
        id: 'cat-macbook',
        name: 'MacBook',
        slug: 'macbook',
        parentId: 'cat-laptops',
        level: 3
      }
    ],
    primaryImage: {
      url: 'https://example.com/images/macbook-pro-16.jpg',
      thumbnailUrl: 'https://example.com/images/macbook-pro-16-thumb.jpg',
      altText: 'MacBook Pro 16-inch'
    },
    averageRating: 4.9,
    reviewCount: 120,
    specifications: [
      { name: 'Color', value: 'Space Black' },
      { name: 'Storage', value: '1TB SSD' },
      { name: 'RAM', value: '36GB' },
      { name: 'Display', value: '16.2-inch Liquid Retina XDR' }
    ]
  },
  {
    id: 'prod-004',
    sku: 'SKU-HDP-001',
    name: {
      en: 'Sony WH-1000XM5 Wireless Headphones',
      bn: 'সনি WH-1000XM5 ওয়্যারলেস হেডফোন'
    },
    slug: 'sony-wh-1000xm5-wireless-headphones',
    shortDescription: 'Industry-leading noise cancellation',
    description: 'The Sony WH-1000XM5 headphones redefine noise cancellation with two processors controlling 8 microphones.',
    regularPrice: 399.99,
    salePrice: 349.99,
    stockQuantity: 100,
    lowStockThreshold: 15,
    status: 'ACTIVE',
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    brand: {
      id: 'brand-sony',
      name: 'Sony',
      slug: 'sony'
    },
    categories: [
      {
        id: 'cat-electronics',
        name: 'Electronics',
        slug: 'electronics',
        level: 1
      },
      {
        id: 'cat-audio',
        name: 'Audio',
        slug: 'audio',
        parentId: 'cat-electronics',
        level: 2
      },
      {
        id: 'cat-headphones',
        name: 'Headphones',
        slug: 'headphones',
        parentId: 'cat-audio',
        level: 3
      }
    ],
    primaryImage: {
      url: 'https://example.com/images/sony-wh1000xm5.jpg',
      thumbnailUrl: 'https://example.com/images/sony-wh1000xm5-thumb.jpg',
      altText: 'Sony WH-1000XM5'
    },
    averageRating: 4.6,
    reviewCount: 500,
    specifications: [
      { name: 'Color', value: 'Black' },
      { name: 'Battery Life', value: '30 hours' },
      { name: 'Driver Size', value: '30mm' },
      { name: 'Noise Cancellation', value: 'Industry-leading' }
    ]
  },
  {
    id: 'prod-005',
    sku: 'SKU-WEB-001',
    name: {
      en: 'Logitech MX Master 3S Mouse',
      bn: 'লজিটেক MX মাস্টার 3S মাউস'
    },
    slug: 'logitech-mx-master-3s-mouse',
    shortDescription: 'Master your workflow with precision',
    description: 'The Logitech MX Master 3S is an iconic mouse reinvented with an 8000 DPI track-on-glass sensor.',
    regularPrice: 99.99,
    salePrice: 89.99,
    stockQuantity: 200,
    lowStockThreshold: 20,
    status: 'ACTIVE',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: true,
    brand: {
      id: 'brand-logitech',
      name: 'Logitech',
      slug: 'logitech'
    },
    categories: [
      {
        id: 'cat-electronics',
        name: 'Electronics',
        slug: 'electronics',
        level: 1
      },
      {
        id: 'cat-accessories',
        name: 'Accessories',
        slug: 'accessories',
        parentId: 'cat-electronics',
        level: 2
      },
      {
        id: 'cat-mice',
        name: 'Computer Mice',
        slug: 'computer-mice',
        parentId: 'cat-accessories',
        level: 3
      }
    ],
    primaryImage: {
      url: 'https://example.com/images/logitech-mx-master-3s.jpg',
      thumbnailUrl: 'https://example.com/images/logitech-mx-master-3s-thumb.jpg',
      altText: 'Logitech MX Master 3S'
    },
    averageRating: 4.7,
    reviewCount: 300,
    specifications: [
      { name: 'Color', value: 'Graphite' },
      { name: 'DPI', value: '8000' },
      { name: 'Buttons', value: '7' },
      { name: 'Connectivity', value: 'Bluetooth, USB receiver' }
    ]
  }
];

// Sample category data
const sampleCategories = [
  {
    id: 'cat-electronics',
    name: {
      en: 'Electronics',
      bn: 'ইলেকট্রনিক্স'
    },
    slug: 'electronics',
    description: 'Electronic devices and accessories',
    productCount: 500,
    level: 1,
    parentId: null,
    children: ['cat-smartphones', 'cat-laptops', 'cat-audio', 'cat-accessories']
  },
  {
    id: 'cat-smartphones',
    name: {
      en: 'Smartphones',
      bn: 'স্মার্টফোন'
    },
    slug: 'smartphones',
    description: 'Mobile phones and smartphones',
    productCount: 200,
    level: 2,
    parentId: 'cat-electronics',
    children: ['cat-iphone', 'cat-android']
  },
  {
    id: 'cat-iphone',
    name: {
      en: 'iPhone',
      bn: 'আইফোন'
    },
    slug: 'iphone',
    description: 'Apple iPhone devices',
    productCount: 50,
    level: 3,
    parentId: 'cat-smartphones',
    children: []
  },
  {
    id: 'cat-android',
    name: {
      en: 'Android',
      bn: 'অ্যান্ড্রয়েড'
    },
    slug: 'android',
    description: 'Android smartphones',
    productCount: 150,
    level: 3,
    parentId: 'cat-smartphones',
    children: []
  },
  {
    id: 'cat-laptops',
    name: {
      en: 'Laptops',
      bn: 'ল্যাপটপ'
    },
    slug: 'laptops',
    description: 'Portable computers and laptops',
    productCount: 150,
    level: 2,
    parentId: 'cat-electronics',
    children: ['cat-macbook', 'cat-windows-laptops']
  },
  {
    id: 'cat-macbook',
    name: {
      en: 'MacBook',
      bn: 'ম্যাকবুক'
    },
    slug: 'macbook',
    description: 'Apple MacBook laptops',
    productCount: 30,
    level: 3,
    parentId: 'cat-laptops',
    children: []
  },
  {
    id: 'cat-windows-laptops',
    name: {
      en: 'Windows Laptops',
      bn: 'উইন্ডোজ ল্যাপটপ'
    },
    slug: 'windows-laptops',
    description: 'Windows-based laptops',
    productCount: 120,
    level: 3,
    parentId: 'cat-laptops',
    children: []
  },
  {
    id: 'cat-audio',
    name: {
      en: 'Audio',
      bn: 'অডিও'
    },
    slug: 'audio',
    description: 'Audio devices and accessories',
    productCount: 100,
    level: 2,
    parentId: 'cat-electronics',
    children: ['cat-headphones', 'cat-speakers']
  },
  {
    id: 'cat-headphones',
    name: {
      en: 'Headphones',
      bn: 'হেডফোন'
    },
    slug: 'headphones',
    description: 'Headphones and earphones',
    productCount: 80,
    level: 3,
    parentId: 'cat-audio',
    children: []
  },
  {
    id: 'cat-accessories',
    name: {
      en: 'Accessories',
      bn: 'আনুষাঙ্গিক'
    },
    slug: 'accessories',
    description: 'Electronic accessories',
    productCount: 200,
    level: 2,
    parentId: 'cat-electronics',
    children: ['cat-mice', 'cat-keyboards']
  }
];

// Sample brand data
const sampleBrands = [
  {
    id: 'brand-apple',
    name: 'Apple',
    slug: 'apple',
    description: 'Apple Inc. - Technology company',
    logoUrl: 'https://example.com/logos/apple.png',
    productCount: 100,
    isFeatured: true
  },
  {
    id: 'brand-samsung',
    name: 'Samsung',
    slug: 'samsung',
    description: 'Samsung Electronics',
    logoUrl: 'https://example.com/logos/samsung.png',
    productCount: 150,
    isFeatured: true
  },
  {
    id: 'brand-sony',
    name: 'Sony',
    slug: 'sony',
    description: 'Sony Corporation',
    logoUrl: 'https://example.com/logos/sony.png',
    productCount: 80,
    isFeatured: true
  },
  {
    id: 'brand-logitech',
    name: 'Logitech',
    slug: 'logitech',
    description: 'Logitech International',
    logoUrl: 'https://example.com/logos/logitech.png',
    productCount: 120,
    isFeatured: true
  },
  {
    id: 'brand-dell',
    name: 'Dell',
    slug: 'dell',
    description: 'Dell Technologies',
    logoUrl: 'https://example.com/logos/dell.png',
    productCount: 90,
    isFeatured: false
  },
  {
    id: 'brand-hp',
    name: 'HP',
    slug: 'hp',
    description: 'HP Inc.',
    logoUrl: 'https://example.com/logos/hp.png',
    productCount: 85,
    isFeatured: false
  },
  {
    id: 'brand-microsoft',
    name: 'Microsoft',
    slug: 'microsoft',
    description: 'Microsoft Corporation',
    logoUrl: 'https://example.com/logos/microsoft.png',
    productCount: 50,
    isFeatured: true
  },
  {
    id: 'brand-google',
    name: 'Google',
    slug: 'google',
    description: 'Google LLC',
    logoUrl: 'https://example.com/logos/google.png',
    productCount: 40,
    isFeatured: true
  }
];

// Sample search queries
const sampleSearchQueries = [
  {
    query: 'iPhone 15 Pro',
    expectedResults: 5,
    expectedCategories: ['cat-smartphones', 'cat-iphone'],
    expectedBrands: ['brand-apple'],
    filters: {},
    sort: 'relevance'
  },
  {
    query: 'wireless headphones',
    expectedResults: 10,
    expectedCategories: ['cat-headphones'],
    expectedBrands: ['brand-sony', 'brand-apple', 'brand-samsung'],
    filters: { inStockOnly: true },
    sort: 'rating'
  },
  {
    query: 'laptop computer',
    expectedResults: 15,
    expectedCategories: ['cat-laptops'],
    expectedBrands: ['brand-apple', 'brand-dell', 'brand-hp'],
    filters: { priceRange: { min: 500, max: 2000 } },
    sort: 'price_asc'
  },
  {
    query: 'gaming mouse',
    expectedResults: 8,
    expectedCategories: ['cat-mice'],
    expectedBrands: ['brand-logitech', 'brand-microsoft'],
    filters: {},
    sort: 'price_desc'
  },
  {
    query: 'wireless earbuds',
    expectedResults: 12,
    expectedCategories: ['cat-audio'],
    expectedBrands: ['brand-sony', 'brand-samsung', 'brand-apple'],
    filters: { featuredOnly: true },
    sort: 'relevance'
  },
  {
    query: 'keyboard mechanical',
    expectedResults: 6,
    expectedCategories: ['cat-keyboards'],
    expectedBrands: ['brand-logitech'],
    filters: { newArrivalsOnly: true },
    sort: 'newest'
  },
  {
    query: 'smartwatch',
    expectedResults: 10,
    expectedCategories: ['cat-wearables'],
    expectedBrands: ['brand-apple', 'brand-samsung', 'brand-google'],
    filters: { bestSellersOnly: true },
    sort: 'rating'
  },
  {
    query: 'tablet',
    expectedResults: 8,
    expectedCategories: ['cat-tablets'],
    expectedBrands: ['brand-apple', 'brand-samsung', 'brand-microsoft'],
    filters: {},
    sort: 'name_asc'
  }
];

// Sample search logs
const sampleSearchLogs = [
  {
    id: 'log-001',
    query: 'iPhone 15 Pro',
    userId: 'user-001',
    resultsCount: 5,
    executionTime: 45,
    filters: { categoryIds: ['cat-smartphones'], brandIds: ['brand-apple'] },
    sort: 'relevance',
    page: 1,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    timestamp: new Date('2026-01-15T10:30:00Z')
  },
  {
    id: 'log-002',
    query: 'wireless headphones',
    userId: 'user-002',
    resultsCount: 10,
    executionTime: 38,
    filters: {},
    sort: 'rating',
    page: 1,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/17.0',
    timestamp: new Date('2026-01-15T11:45:00Z')
  },
  {
    id: 'log-003',
    query: 'laptop computer',
    userId: 'user-003',
    resultsCount: 15,
    executionTime: 52,
    filters: { priceRange: { min: 500, max: 2000 } },
    sort: 'price_asc',
    page: 1,
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Firefox/121.0',
    timestamp: new Date('2026-01-15T12:00:00Z')
  },
  {
    id: 'log-004',
    query: 'Samsung Galaxy',
    userId: 'user-001',
    resultsCount: 8,
    executionTime: 42,
    filters: { brandIds: ['brand-samsung'] },
    sort: 'relevance',
    page: 1,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    timestamp: new Date('2026-01-15T14:20:00Z')
  },
  {
    id: 'log-005',
    query: 'MacBook Pro',
    userId: 'user-004',
    resultsCount: 3,
    executionTime: 35,
    filters: { brandIds: ['brand-apple'], categoryIds: ['cat-macbook'] },
    sort: 'relevance',
    page: 1,
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0',
    timestamp: new Date('2026-01-16T09:15:00Z')
  }
];

// Elasticsearch mock response
const mockElasticsearchResponse = {
  took: 25,
  timed_out: false,
  hits: {
    total: { value: 100, relation: 'eq' },
    max_score: 5.5,
    hits: sampleProducts.map((product, index) => ({
      _index: 'smarttech_products',
      _id: product.id,
      _score: 5.5 - index * 0.5,
      _source: {
        ...product,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date('2026-01-15').toISOString()
      }
    }))
  },
  aggregations: {
    categories: {
      buckets: [
        { key: 'cat-electronics', doc_count: 100, category_name: { buckets: [{ key: 'Electronics' }] } },
        { key: 'cat-smartphones', doc_count: 80, category_name: { buckets: [{ key: 'Smartphones' }] } }
      ]
    },
    brands: {
      buckets: [
        { key: 'brand-apple', doc_count: 50, brand_name: { buckets: [{ key: 'Apple' }] } },
        { key: 'brand-samsung', doc_count: 40, brand_name: { buckets: [{ key: 'Samsung' }] } }
      ]
    },
    price_ranges: {
      buckets: [
        { key: 'under_500', doc_count: 20, to: 500 },
        { key: '500_1000', doc_count: 30, from: 500, to: 1000 },
        { key: '1000_2000', doc_count: 35, from: 1000, to: 2000 },
        { key: 'over_5000', doc_count: 15, from: 5000 }
      ]
    },
    ratings: {
      buckets: [
        { key: '4_and_up', doc_count: 60, from: 4 },
        { key: '3_to_4', doc_count: 30, from: 3, to: 4 }
      ]
    },
    in_stock: { doc_count: 85 },
    specifications: {
      spec_names: {
        buckets: [
          {
            key: 'Color',
            doc_count: 100,
            spec_values: {
              buckets: [
                { key: 'Black', doc_count: 40 },
                { key: 'White', doc_count: 30 }
              ]
            }
          }
        ]
      }
    }
  }
};

// Helper functions for fixtures
const searchFixtures = {
  /**
   * Get all sample products
   * @returns {Array} Sample products
   */
  getProducts: () => sampleProducts,

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Object|undefined} Product or undefined
   */
  getProductById: (id) => sampleProducts.find(p => p.id === id),

  /**
   * Get all sample categories
   * @returns {Array} Sample categories
   */
  getCategories: () => sampleCategories,

  /**
   * Get category by ID
   * @param {string} id - Category ID
   * @returns {Object|undefined} Category or undefined
   */
  getCategoryById: (id) => sampleCategories.find(c => c.id === id),

  /**
   * Get all sample brands
   * @returns {Array} Sample brands
   */
  getBrands: () => sampleBrands,

  /**
   * Get brand by ID
   * @param {string} id - Brand ID
   * @returns {Object|undefined} Brand or undefined
   */
  getBrandById: (id) => sampleBrands.find(b => b.id === id),

  /**
   * Get sample search queries
   * @returns {Array} Sample search queries
   */
  getSearchQueries: () => sampleSearchQueries,

  /**
   * Get sample search logs
   * @returns {Array} Sample search logs
   */
  getSearchLogs: () => sampleSearchLogs,

  /**
   * Get mock Elasticsearch response
   * @returns {Object} Mock ES response
   */
  getElasticsearchResponse: () => mockElasticsearchResponse,

  /**
   * Create custom test product
   * @param {Object} overrides - Product overrides
   * @returns {Object} Custom test product
   */
  createCustomProduct: (overrides = {}) => {
    return {
      ...sampleProducts[0],
      ...overrides,
      id: `test-product-${Date.now()}`,
      sku: `TEST-SKU-${Date.now()}`
    };
  },

  /**
   * Create custom test category
   * @param {Object} overrides - Category overrides
   * @returns {Object} Custom test category
   */
  createCustomCategory: (overrides = {}) => {
    return {
      ...sampleCategories[0],
      ...overrides,
      id: `test-category-${Date.now()}`,
      slug: `test-category-${Date.now()}`
    };
  },

  /**
   * Create custom test brand
   * @param {Object} overrides - Brand overrides
   * @returns {Object} Custom test brand
   */
  createCustomBrand: (overrides = {}) => {
    return {
      ...sampleBrands[0],
      ...overrides,
      id: `test-brand-${Date.now()}`,
      slug: `test-brand-${Date.now()}`
    };
  },

  /**
   * Create custom search log
   * @param {Object} overrides - Search log overrides
   * @returns {Object} Custom search log
   */
  createCustomSearchLog: (overrides = {}) => {
    return {
      ...sampleSearchLogs[0],
      ...overrides,
      id: `test-log-${Date.now()}`,
      query: `test-query-${Date.now()}`
    };
  }
};

module.exports = {
  sampleProducts,
  sampleCategories,
  sampleBrands,
  sampleSearchQueries,
  sampleSearchLogs,
  mockElasticsearchResponse,
  searchFixtures
};
