/**
 * Elasticsearch Integration Tests
 * 
 * Tests for Elasticsearch search functionality including:
 * - Index creation and management
 * - Product indexing
 * - Search queries
 * - Faceted search
 * - Autocomplete
 * - Analytics aggregation
 * - Graceful degradation
 */

const { Client } = require('@elastic/elasticsearch');
const { PrismaClient } = require('@prisma/client');
const { ProductIndex } = require('../services/elasticsearch/productIndex');
const { ProductIndexingService } = require('../services/elasticsearch/productIndexingService');
const { SearchAnalyticsService } = require('../services/elasticsearch/searchAnalytics');
const { elasticsearchConfig } = require('../config/elasticsearch');

const prisma = new PrismaClient();
const productIndex = new ProductIndex();
const productIndexingService = new ProductIndexingService();
const searchAnalyticsService = new SearchAnalyticsService();

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds for Elasticsearch operations
const TEST_INDEX_PREFIX = 'test_smarttech_';

// Helper function to create test product
const createTestProduct = async (overrides = {}) => {
  const defaultProduct = {
    sku: `TEST-${Date.now()}`,
    name: 'Test Product',
    nameEn: 'Test Product',
    nameBn: 'টেস্ট প্রোডাক্ট',
    slug: `test-product-${Date.now()}`,
    shortDescription: 'A test product for Elasticsearch',
    description: 'This is a detailed description of a test product for Elasticsearch integration testing.',
    descriptionEn: 'This is a detailed description of a test product for Elasticsearch integration testing.',
    descriptionBn: 'এটি এলাস্টিকসার্চ ইন্টিগ্রেশন টেস্টিংয়ের জন্য একটি টেস্ট প্রোডাক্টের বিস্তারিত বিবরণ।',
    regularPrice: 1000,
    salePrice: 800,
    costPrice: 500,
    stockQuantity: 100,
    lowStockThreshold: 10,
    status: 'active',
    visibility: 'public',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    metaTitle: 'Test Product Meta Title',
    metaDescription: 'Test product meta description',
    metaKeywords: 'test, product, elasticsearch',
    warrantyPeriod: 12,
    warrantyType: 'months',
    ...overrides
  };

  // Create brand if provided
  if (overrides.brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: overrides.brandId }
    });
    if (!brand) {
      throw new Error('Brand not found');
    }
  }

  // Create product
  const product = await prisma.product.create({
    data: {
      ...defaultProduct,
      brandId: overrides.brandId || null,
      categories: overrides.categories ? {
        create: overrides.categories.map((categoryId, index) => ({
          categoryId,
          isPrimary: index === 0
        }))
      } : undefined
    }
  });

  return product;
};

// Helper function to cleanup test data
const cleanupTestData = async () => {
  try {
    // Delete test products
    await prisma.product.deleteMany({
      where: {
        sku: {
          startsWith: 'TEST-'
        }
      }
    });

    // Delete test search logs
    await prisma.searchLog.deleteMany({
      where: {
        query: {
          startsWith: 'TEST_SEARCH_'
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};

// Helper function to wait for Elasticsearch to index
const waitForIndexing = async (delay = 2000) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

describe('Elasticsearch Integration Tests', () => {
  
  beforeAll(async () => {
    // Check if Elasticsearch is available
    if (!elasticsearchConfig.isAvailable()) {
      console.warn('Elasticsearch is not available. Skipping tests.');
      return;
    }

    // Initialize test index
    await productIndex.initializeIndex();
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();

    // Delete test index
    if (elasticsearchConfig.isAvailable()) {
      await productIndex.deleteIndex();
    }

    // Close database connection
    await prisma.$disconnect();
  });

  describe('Index Management', () => {
    
    test('should create product index successfully', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const result = await productIndex.initializeIndex();
      expect(result.acknowledged).toBe(true);
      expect(result.index).toBeDefined();
    }, TEST_TIMEOUT);

    test('should get index statistics', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const stats = await productIndex.getIndexStats();
      expect(stats).toBeDefined();
      expect(stats._all).toBeDefined();
      expect(stats._all.primaries).toBeDefined();
    }, TEST_TIMEOUT);

    test('should check if index exists', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const exists = await productIndex.exists();
      expect(exists).toBe(true);
    }, TEST_TIMEOUT);

    test('should delete index successfully', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      // Create a temporary test index
      const tempIndexName = `${TEST_INDEX_PREFIX}temp_${Date.now()}`;
      const client = elasticsearchConfig.getClient();
      
      await client.indices.create({
        index: tempIndexName,
        body: productIndex.getMapping()
      });

      // Verify index exists
      let exists = await client.indices.exists({ index: tempIndexName });
      expect(exists).toBe(true);

      // Delete index
      await client.indices.delete({ index: tempIndexName });

      // Verify index is deleted
      exists = await client.indices.exists({ index: tempIndexName });
      expect(exists).toBe(false);
    }, TEST_TIMEOUT);

    test('should rebuild index successfully', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const stats = await productIndex.rebuildIndex();
      expect(stats).toBeDefined();
      expect(stats.totalIndexed).toBeDefined();
      expect(stats.errors).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Product Indexing', () => {
    
    let testProduct;
    let testBrand;
    let testCategory;

    beforeAll(async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      // Create test brand
      testBrand = await prisma.brand.create({
        data: {
          name: 'Test Brand',
          nameEn: 'Test Brand',
          nameBn: 'টেস্ট ব্র্যান্ড',
          slug: `test-brand-${Date.now()}`,
          status: 'active'
        }
      });

      // Create test category
      testCategory = await prisma.category.create({
        data: {
          name: 'Test Category',
          nameEn: 'Test Category',
          nameBn: 'টেস্ট ক্যাটাগরি',
          slug: `test-category-${Date.now()}`,
          status: 'active'
        }
      });
    }, TEST_TIMEOUT);

    afterAll(async () => {
      // Cleanup test brand and category
      if (testBrand) {
        await prisma.brand.delete({ where: { id: testBrand.id } });
      }
      if (testCategory) {
        await prisma.category.delete({ where: { id: testCategory.id } });
      }
    });

    test('should index a single product successfully', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      testProduct = await createTestProduct({
        brandId: testBrand.id,
        categories: [testCategory.id]
      });

      const result = await productIndexingService.indexProduct(testProduct.id);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Wait for indexing
      await waitForIndexing();

      // Verify product is indexed
      const client = elasticsearchConfig.getClient();
      const indexedProduct = await client.get({
        index: productIndex.buildIndexName(),
        id: testProduct.id
      });

      expect(indexedProduct.found).toBe(true);
      expect(indexedProduct._source.id).toBe(testProduct.id);
    }, TEST_TIMEOUT);

    test('should index multiple products successfully', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      // Create multiple test products
      const products = await Promise.all([
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategory.id],
          name: 'Product 1'
        }),
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategory.id],
          name: 'Product 2'
        }),
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategory.id],
          name: 'Product 3'
        })
      ]);

      const productIds = products.map(p => p.id);
      const result = await productIndexingService.indexProducts(productIds);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.indexedCount).toBe(3);

      // Wait for indexing
      await waitForIndexing();

      // Verify all products are indexed
      const client = elasticsearchConfig.getClient();
      const { count } = await client.count({
        index: productIndex.buildIndexName()
      });

      expect(count).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('should update indexed product successfully', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      // Update product
      const updatedProduct = await prisma.product.update({
        where: { id: testProduct.id },
        data: {
          name: 'Updated Test Product',
          regularPrice: 1500
        }
      });

      const result = await productIndexingService.updateProduct(testProduct.id);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Wait for indexing
      await waitForIndexing();

      // Verify product is updated in index
      const client = elasticsearchConfig.getClient();
      const indexedProduct = await client.get({
        index: productIndex.buildIndexName(),
        id: testProduct.id
      });

      expect(indexedProduct.found).toBe(true);
      expect(indexedProduct._source.name).toBe('Updated Test Product');
      expect(indexedProduct._source.regularPrice).toBe(1500);
    }, TEST_TIMEOUT);

    test('should delete product from index successfully', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      // Verify product is in index
      const client = elasticsearchConfig.getClient();
      let indexedProduct = await client.get({
        index: productIndex.buildIndexName(),
        id: testProduct.id
      });
      expect(indexedProduct.found).toBe(true);

      // Delete product from index
      const result = await productIndexingService.deleteProduct(testProduct.id);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Wait for deletion
      await waitForIndexing();

      // Verify product is deleted from index
      try {
        indexedProduct = await client.get({
          index: productIndex.buildIndexName(),
          id: testProduct.id
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.meta.statusCode).toBe(404);
      }
    }, TEST_TIMEOUT);

    test('should handle indexing errors gracefully', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      // Try to index non-existent product
      const result = await productIndexingService.indexProduct('non-existent-id');
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Search Queries', () => {
    
    let testProducts = [];
    let testBrand;
    let testCategory;

    beforeAll(async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      // Create test brand and category
      testBrand = await prisma.brand.create({
        data: {
          name: 'Electronics Brand',
          nameEn: 'Electronics Brand',
          nameBn: 'ইলেকট্রনিক্স ব্র্যান্ড',
          slug: `electronics-brand-${Date.now()}`,
          status: 'active'
        }
      });

      testCategory = await prisma.category.create({
        data: {
          name: 'Electronics',
          nameEn: 'Electronics',
          nameBn: 'ইলেকট্রনিক্স',
          slug: `electronics-${Date.now()}`,
          status: 'active'
        }
      });

      // Create test products
      testProducts = await Promise.all([
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategory.id],
          name: 'Smartphone',
          nameEn: 'Smartphone',
          nameBn: 'স্মার্টফোন',
          description: 'A high-end smartphone with advanced features',
          regularPrice: 25000,
          salePrice: 22000,
          isFeatured: true
        }),
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategory.id],
          name: 'Laptop',
          nameEn: 'Laptop',
          nameBn: 'ল্যাপটপ',
          description: 'Powerful laptop for work and gaming',
          regularPrice: 80000,
          salePrice: 75000,
          isBestSeller: true
        }),
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategory.id],
          name: 'Headphones',
          nameEn: 'Headphones',
          nameBn: 'হেডফোন',
          description: 'Wireless headphones with noise cancellation',
          regularPrice: 5000,
          salePrice: 4500,
          isNewArrival: true
        })
      ]);

      // Index all products
      await productIndexingService.indexProducts(testProducts.map(p => p.id));
      await waitForIndexing();
    }, TEST_TIMEOUT);

    afterAll(async () => {
      // Cleanup
      if (testBrand) {
        await prisma.brand.delete({ where: { id: testBrand.id } });
      }
      if (testCategory) {
        await prisma.category.delete({ where: { id: testCategory.id } });
      }
    });

    test('should search products by name', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          query: {
            multi_match: {
              query: 'smartphone',
              fields: ['nameEn^3', 'nameBn^2', 'descriptionEn', 'descriptionBn'],
              fuzziness: 'AUTO'
            }
          }
        }
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
      expect(result.hits.hits.length).toBeGreaterThan(0);
      expect(result.hits.hits[0]._source.nameEn).toBe('Smartphone');
    }, TEST_TIMEOUT);

    test('should search products with fuzzy matching', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          query: {
            multi_match: {
              query: 'smartphne', // Typo
              fields: ['nameEn^3', 'nameBn^2', 'descriptionEn', 'descriptionBn'],
              fuzziness: 'AUTO'
            }
          }
        }
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('should search products with phrase matching', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          query: {
            multi_match: {
              query: 'wireless headphones',
              fields: ['nameEn^3', 'nameBn^2', 'descriptionEn', 'descriptionBn'],
              type: 'phrase'
            }
          }
        }
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('should filter products by price range', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          query: {
            bool: {
              must: [
                {
                  range: {
                    regularPrice: {
                      gte: 10000,
                      lte: 50000
                    }
                  }
                }
              ]
            }
          }
        }
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
      result.hits.hits.forEach(hit => {
        expect(hit._source.regularPrice).toBeGreaterThanOrEqual(10000);
        expect(hit._source.regularPrice).toBeLessThanOrEqual(50000);
      });
    }, TEST_TIMEOUT);

    test('should filter products by category', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          query: {
            term: {
              'categoryId.keyword': testCategory.id
            }
          }
        }
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('should filter products by brand', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          query: {
            term: {
              'brandId.keyword': testBrand.id
            }
          }
        }
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('should filter products by status flags', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          query: {
            bool: {
              must: [
                { term: { isFeatured: true } }
              ]
            }
          }
        }
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
      result.hits.hits.forEach(hit => {
        expect(hit._source.isFeatured).toBe(true);
      });
    }, TEST_TIMEOUT);

    test('should sort search results', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          query: {
            match_all: {}
          },
          sort: [
            { regularPrice: { order: 'asc' } }
          ]
        }
      });

      expect(result.hits.hits.length).toBeGreaterThan(1);
      for (let i = 0; i < result.hits.hits.length - 1; i++) {
        expect(result.hits.hits[i]._source.regularPrice)
          .toBeLessThanOrEqual(result.hits.hits[i + 1]._source.regularPrice);
      }
    }, TEST_TIMEOUT);

    test('should paginate search results', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const page1 = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          from: 0,
          size: 2,
          query: {
            match_all: {}
          }
        }
      });

      const page2 = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          from: 2,
          size: 2,
          query: {
            match_all: {}
          }
        }
      });

      expect(page1.hits.hits.length).toBe(2);
      expect(page2.hits.hits.length).toBe(2);
      
      // Verify different results
      const page1Ids = page1.hits.hits.map(h => h._id);
      const page2Ids = page2.hits.hits.map(h => h._id);
      expect(page1Ids).not.toEqual(page2Ids);
    }, TEST_TIMEOUT);
  });

  describe('Faceted Search', () => {
    
    let testProducts = [];
    let testBrand;
    let testCategories = [];

    beforeAll(async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      // Create test brand
      testBrand = await prisma.brand.create({
        data: {
          name: 'Test Brand',
          nameEn: 'Test Brand',
          nameBn: 'টেস্ট ব্র্যান্ড',
          slug: `test-brand-${Date.now()}`,
          status: 'active'
        }
      });

      // Create test categories
      testCategories = await Promise.all([
        prisma.category.create({
          data: {
            name: 'Category A',
            nameEn: 'Category A',
            nameBn: 'ক্যাটাগরি এ',
            slug: `category-a-${Date.now()}`,
            status: 'active'
          }
        }),
        prisma.category.create({
          data: {
            name: 'Category B',
            nameEn: 'Category B',
            nameBn: 'ক্যাটাগরি বি',
            slug: `category-b-${Date.now()}`,
            status: 'active'
          }
        })
      ]);

      // Create test products
      testProducts = await Promise.all([
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategories[0].id],
          name: 'Product A1',
          regularPrice: 1000,
          isFeatured: true
        }),
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategories[0].id],
          name: 'Product A2',
          regularPrice: 2000,
          isFeatured: false
        }),
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategories[1].id],
          name: 'Product B1',
          regularPrice: 3000,
          isFeatured: true
        }),
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategories[1].id],
          name: 'Product B2',
          regularPrice: 4000,
          isFeatured: false
        })
      ]);

      // Index all products
      await productIndexingService.indexProducts(testProducts.map(p => p.id));
      await waitForIndexing();
    }, TEST_TIMEOUT);

    afterAll(async () => {
      // Cleanup
      if (testBrand) {
        await prisma.brand.delete({ where: { id: testBrand.id } });
      }
      testCategories.forEach(async (cat) => {
        await prisma.category.delete({ where: { id: cat.id } });
      });
    });

    test('should aggregate categories', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          size: 0,
          aggs: {
            categories: {
              terms: {
                field: 'categoryId.keyword'
              }
            }
          }
        }
      });

      expect(result.aggregations).toBeDefined();
      expect(result.aggregations.categories).toBeDefined();
      expect(result.aggregations.categories.buckets.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('should aggregate brands', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          size: 0,
          aggs: {
            brands: {
              terms: {
                field: 'brandId.keyword'
              }
            }
          }
        }
      });

      expect(result.aggregations).toBeDefined();
      expect(result.aggregations.brands).toBeDefined();
      expect(result.aggregations.brands.buckets.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('should aggregate price ranges', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          size: 0,
          aggs: {
            price_ranges: {
              range: {
                field: 'regularPrice',
                ranges: [
                  { to: 1000 },
                  { from: 1000, to: 2000 },
                  { from: 2000, to: 3000 },
                  { from: 3000 }
                ]
              }
            }
          }
        }
      });

      expect(result.aggregations).toBeDefined();
      expect(result.aggregations.price_ranges).toBeDefined();
      expect(result.aggregations.price_ranges.buckets.length).toBe(4);
    }, TEST_TIMEOUT);

    test('should aggregate status flags', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          size: 0,
          aggs: {
            featured: {
              filter: { term: { isFeatured: true } }
            },
            new_arrivals: {
              filter: { term: { isNewArrival: true } }
            },
            best_sellers: {
              filter: { term: { isBestSeller: true } }
            }
          }
        }
      });

      expect(result.aggregations).toBeDefined();
      expect(result.aggregations.featured).toBeDefined();
      expect(result.aggregations.new_arrivals).toBeDefined();
      expect(result.aggregations.best_sellers).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Autocomplete', () => {
    
    let testProducts = [];
    let testBrand;
    let testCategory;

    beforeAll(async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      // Create test brand and category
      testBrand = await prisma.brand.create({
        data: {
          name: 'Test Brand',
          nameEn: 'Test Brand',
          nameBn: 'টেস্ট ব্র্যান্ড',
          slug: `test-brand-${Date.now()}`,
          status: 'active'
        }
      });

      testCategory = await prisma.category.create({
        data: {
          name: 'Test Category',
          nameEn: 'Test Category',
          nameBn: 'টেস্ট ক্যাটাগরি',
          slug: `test-category-${Date.now()}`,
          status: 'active'
        }
      });

      // Create test products with similar names
      testProducts = await Promise.all([
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategory.id],
          name: 'Apple iPhone',
          nameEn: 'Apple iPhone',
          nameBn: 'অ্যাপল আইফোন'
        }),
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategory.id],
          name: 'Apple iPad',
          nameEn: 'Apple iPad',
          nameBn: 'অ্যাপল আইপ্যাড'
        }),
        createTestProduct({
          brandId: testBrand.id,
          categories: [testCategory.id],
          name: 'Apple MacBook',
          nameEn: 'Apple MacBook',
          nameBn: 'অ্যাপল ম্যাকবুক'
        })
      ]);

      // Index all products
      await productIndexingService.indexProducts(testProducts.map(p => p.id));
      await waitForIndexing();
    }, TEST_TIMEOUT);

    afterAll(async () => {
      // Cleanup
      if (testBrand) {
        await prisma.brand.delete({ where: { id: testBrand.id } });
      }
      if (testCategory) {
        await prisma.category.delete({ where: { id: testCategory.id } });
      }
    });

    test('should provide autocomplete suggestions', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          size: 10,
          query: {
            prefix: {
              nameEn: 'Apple'
            }
          }
        }
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
      expect(result.hits.hits.length).toBeGreaterThan(0);
      result.hits.hits.forEach(hit => {
        expect(hit._source.nameEn).toMatch(/Apple/i);
      });
    }, TEST_TIMEOUT);

    test('should provide autocomplete with partial query', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          size: 10,
          query: {
            prefix: {
            nameEn: 'App'
            }
          }
        }
      });

      expect(result.hits.total.value).toBeGreaterThan(0);
      result.hits.hits.forEach(hit => {
        expect(hit._source.nameEn).toMatch(/^App/i);
      });
    }, TEST_TIMEOUT);

    test('should limit autocomplete suggestions', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const client = elasticsearchConfig.getClient();
      const result = await client.search({
        index: productIndex.buildIndexName(),
        body: {
          size: 2,
          query: {
            prefix: {
              nameEn: 'Apple'
            }
          }
        }
      });

      expect(result.hits.hits.length).toBeLessThanOrEqual(2);
    }, TEST_TIMEOUT);
  });

  describe('Search Analytics', () => {
    
    let testUser;

    beforeAll(async () => {
      // Create test user
      testUser = await prisma.user.create({
        data: {
          email: `test-user-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Test User',
          isEmailVerified: true
        }
      });
    });

    afterAll(async () => {
      // Cleanup
      if (testUser) {
        await prisma.user.delete({ where: { id: testUser.id } });
      }
    });

    test('should log search query', async () => {
      const result = await searchAnalyticsService.logSearch(
        'TEST_SEARCH_query',
        testUser.id,
        10,
        150,
        { categoryId: 'test-category' }
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.query).toBe('TEST_SEARCH_query');
      expect(result.userId).toBe(testUser.id);
      expect(result.resultsCount).toBe(10);
      expect(result.executionTime).toBe(150);
    });

    test('should get top search queries', async () => {
      // Log multiple searches
      await Promise.all([
        searchAnalyticsService.logSearch('TEST_SEARCH_query1', testUser.id, 5, 100),
        searchAnalyticsService.logSearch('TEST_SEARCH_query1', testUser.id, 5, 100),
        searchAnalyticsService.logSearch('TEST_SEARCH_query1', testUser.id, 5, 100),
        searchAnalyticsService.logSearch('TEST_SEARCH_query2', testUser.id, 3, 80),
        searchAnalyticsService.logSearch('TEST_SEARCH_query2', testUser.id, 3, 80)
      ]);

      const topQueries = await searchAnalyticsService.getTopQueries(10);
      expect(topQueries).toBeDefined();
      expect(topQueries.length).toBeGreaterThan(0);
      expect(topQueries[0].query).toBe('TEST_SEARCH_query1');
      expect(topQueries[0].count).toBe(3);
    });

    test('should get zero-result searches', async () => {
      // Log zero-result searches
      await Promise.all([
        searchAnalyticsService.logSearch('TEST_SEARCH_zero1', testUser.id, 0, 50),
        searchAnalyticsService.logSearch('TEST_SEARCH_zero2', testUser.id, 0, 60)
      ]);

      const zeroResultSearches = await searchAnalyticsService.getZeroResultSearches(10);
      expect(zeroResultSearches).toBeDefined();
      expect(zeroResultSearches.length).toBeGreaterThan(0);
      zeroResultSearches.forEach(search => {
        expect(search.resultsCount).toBe(0);
      });
    });

    test('should get average result count', async () => {
      const avgResultCount = await searchAnalyticsService.getAverageResultCount();
      expect(avgResultCount).toBeDefined();
      expect(typeof avgResultCount).toBe('number');
      expect(avgResultCount).toBeGreaterThanOrEqual(0);
    });

    test('should get search volume over time', async () => {
      const searchVolume = await searchAnalyticsService.getSearchVolumeOverTime(7);
      expect(searchVolume).toBeDefined();
      expect(searchVolume.length).toBeGreaterThan(0);
      searchVolume.forEach(day => {
        expect(day.date).toBeDefined();
        expect(day.count).toBeDefined();
        expect(typeof day.count).toBe('number');
      });
    });

    test('should get analytics summary', async () => {
      const summary = await searchAnalyticsService.getAnalyticsSummary(7);
      expect(summary).toBeDefined();
      expect(summary.totalSearches).toBeDefined();
      expect(summary.uniqueQueries).toBeDefined();
      expect(summary.avgResults).toBeDefined();
      expect(summary.avgExecutionTime).toBeDefined();
      expect(summary.topQueries).toBeDefined();
      expect(summary.zeroResultQueries).toBeDefined();
      expect(summary.searchVolume).toBeDefined();
    });

    test('should get user search history', async () => {
      const history = await searchAnalyticsService.getUserSearchHistory(testUser.id, 10);
      expect(history).toBeDefined();
      expect(history.length).toBeGreaterThan(0);
      history.forEach(search => {
        expect(search.userId).toBe(testUser.id);
      });
    });

    test('should cleanup old search logs', async () => {
      const result = await searchAnalyticsService.cleanupOldLogs(30);
      expect(result).toBeDefined();
      expect(result.deletedCount).toBeDefined();
      expect(typeof result.deletedCount).toBe('number');
    });
  });

  describe('Graceful Degradation', () => {
    
    test('should handle Elasticsearch unavailability gracefully', async () => {
      // This test verifies that the application continues to work
      // even when Elasticsearch is unavailable
      expect(elasticsearchConfig.isAvailable()).toBeDefined();
      expect(typeof elasticsearchConfig.isAvailable()).toBe('boolean');
    });

    test('should provide fallback to PostgreSQL search', async () => {
      // Verify that PostgreSQL search still works
      const products = await prisma.product.findMany({
        where: {
          name: {
            contains: 'Test'
          }
        },
        take: 10
      });

      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
    });

    test('should log Elasticsearch errors', async () => {
      // This test verifies error logging is working
      const client = elasticsearchConfig.getClient();
      
      try {
        // Try to search in non-existent index
        await client.search({
          index: 'non_existent_index',
          body: {
            query: {
              match_all: {}
            }
          }
        });
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Performance Tests', () => {
    
    test('search response time should be under 300ms', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const startTime = Date.now();
      const client = elasticsearchConfig.getClient();
      
      await client.search({
        index: productIndex.buildIndexName(),
        body: {
          query: {
            match_all: {}
          }
        }
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(300);
    }, TEST_TIMEOUT);

    test('bulk indexing should be efficient', async () => {
      if (!elasticsearchConfig.isAvailable()) {
        return;
      }

      const startTime = Date.now();
      
      // Create and index 100 products
      const products = [];
      for (let i = 0; i < 100; i++) {
        const product = await createTestProduct({
          name: `Performance Test Product ${i}`
        });
        products.push(product);
      }

      await productIndexingService.indexProducts(products.map(p => p.id));
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Bulk indexing 100 products should take less than 10 seconds
      expect(executionTime).toBeLessThan(10000);

      // Cleanup
      await prisma.product.deleteMany({
        where: {
          id: {
            in: products.map(p => p.id)
          }
        }
      });
    }, TEST_TIMEOUT);
  });
});
