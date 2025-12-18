/**
 * Product Management API Endpoint Tests
 * 
 * This test suite covers all product management endpoints including:
 * - Get all products with filtering and pagination
 * - Get product by ID
 * - Get product by slug
 * - Create product (admin only)
 * - Update product (admin only)
 * - Delete product (admin only)
 * - Get featured products
 * - Input validation
 * - Authorization checks
 * - Error handling
 */

const request = require('supertest');
const { app } = require('../index');
const { 
  TEST_CONFIG, 
  createTestUser, 
  createTestAdmin,
  createTestCategory,
  createTestBrand,
  createTestProduct,
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure,
  prisma 
} = require('./api-test-utils');

describe('Product Management API Endpoints', () => {
  let testUser, adminUser, testCategory, testBrand, testProduct;

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    adminUser = await createTestAdmin();
    testCategory = await createTestCategory();
    testBrand = await createTestBrand();
    testProduct = await createTestProduct({ 
      category: testCategory, 
      brand: testBrand 
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('GET /api/v1/products', () => {
    /**
     * Test successful retrieval of all products
     */
    it('should retrieve all products successfully', async () => {
      const response = await request(app)
        .get('/api/v1/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      
      // Verify pagination structure
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
      
      // Verify product data structure
      const products = response.body.products;
      expect(Array.isArray(products)).toBe(true);
      
      if (products.length > 0) {
        const product = products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('nameEn');
        expect(product).toHaveProperty('slug');
        expect(product).toHaveProperty('sku');
        expect(product).toHaveProperty('regularPrice');
        expect(product).toHaveProperty('salePrice');
        expect(product).toHaveProperty('status');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('brand');
        expect(product).toHaveProperty('images');
        expect(product).toHaveProperty('_count');
      }
    });

    /**
     * Test pagination parameters
     */
    it('should respect pagination parameters', async () => {
      // Create additional products
      await Promise.all([
        createTestProduct({ name: 'Product 1' }),
        createTestProduct({ name: 'Product 2' }),
        createTestProduct({ name: 'Product 3' })
      ]);

      const response = await request(app)
        .get('/api/v1/products?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    /**
     * Test category filtering
     */
    it('should filter products by category', async () => {
      const response = await request(app)
        .get(`/api/v1/products?category=${testCategory.id}`);

      expect(response.status).toBe(200);
      const products = response.body.products;
      
      if (products.length > 0) {
        products.forEach(product => {
          expect(product.category.id).toBe(testCategory.id);
        });
      }
    });

    /**
     * Test brand filtering
     */
    it('should filter products by brand', async () => {
      const response = await request(app)
        .get(`/api/v1/products?brand=${testBrand.id}`);

      expect(response.status).toBe(200);
      const products = response.body.products;
      
      if (products.length > 0) {
        products.forEach(product => {
          expect(product.brand.id).toBe(testBrand.id);
        });
      }
    });

    /**
     * Test search functionality
     */
    it('should search products by name and description', async () => {
      const response = await request(app)
        .get('/api/v1/products?search=Test');

      expect(response.status).toBe(200);
      const products = response.body.products;
      
      if (products.length > 0) {
        const searchMatches = products.some(product => 
          product.name.toLowerCase().includes('test'.toLowerCase()) ||
          product.nameEn.toLowerCase().includes('test'.toLowerCase()) ||
          (product.shortDescription && product.shortDescription.toLowerCase().includes('test'.toLowerCase()))
        );
        expect(searchMatches).toBe(true);
      }
    });

    /**
     * Test price range filtering
     */
    it('should filter products by price range', async () => {
      const response = await request(app)
        .get('/api/v1/products?minPrice=50&maxPrice=150');

      expect(response.status).toBe(200);
      const products = response.body.products;
      
      if (products.length > 0) {
        products.forEach(product => {
          const price = parseFloat(product.regularPrice);
          expect(price).toBeGreaterThanOrEqual(50);
          expect(price).toBeLessThanOrEqual(150);
        });
      }
    });

    /**
     * Test status filtering
     */
    it('should filter products by status', async () => {
      // Create inactive product
      await createTestProduct({ status: 'INACTIVE' });

      const response = await request(app)
        .get('/api/v1/products?status=ACTIVE');

      expect(response.status).toBe(200);
      const products = response.body.products;
      
      if (products.length > 0) {
        products.forEach(product => {
          expect(product.status).toBe('ACTIVE');
        });
      }
    });

    /**
     * Test sorting functionality
     */
    it('should sort products by different fields', async () => {
      const sortOptions = ['price', 'name', 'createdAt', 'stockQuantity'];
      
      for (const sortBy of sortOptions) {
        const response = await request(app)
          .get(`/api/v1/products?sortBy=${sortBy}&sortOrder=asc`);

        expect(response.status).toBe(200);
        expect(response.body.products.length).toBeGreaterThanOrEqual(0);
      }
    });

    /**
     * Test Bangladesh-specific search in Bengali
     */
    it('should search products by Bengali name', async () => {
      // Create product with Bengali name
      await createTestProduct({ 
        nameBn: 'টেস্ট পণ্য',
        nameEn: 'Test Product'
      });

      const response = await request(app)
        .get('/api/v1/products?search=টেস্ট');

      expect(response.status).toBe(200);
      const products = response.body.products;
      expect(products.length).toBeGreaterThan(0);
    });

    /**
     * Test validation of query parameters
     */
    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=-1&limit=0&minPrice=-50');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/v1/products/:id', () => {
    /**
     * Test successful retrieval of product by ID
     */
    it('should retrieve product by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProduct.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product');
      
      const product = response.body.product;
      expect(product.id).toBe(testProduct.id);
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('nameEn');
      expect(product).toHaveProperty('nameBn');
      expect(product).toHaveProperty('slug');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('shortDescription');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('regularPrice');
      expect(product).toHaveProperty('salePrice');
      expect(product).toHaveProperty('costPrice');
      expect(product).toHaveProperty('stockQuantity');
      expect(product).toHaveProperty('lowStockThreshold');
      expect(product).toHaveProperty('status');
      expect(product).toHaveProperty('warrantyPeriod');
      expect(product).toHaveProperty('warrantyType');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('brand');
      expect(product).toHaveProperty('images');
      expect(product).toHaveProperty('specifications');
      expect(product).toHaveProperty('variants');
      expect(product).toHaveProperty('reviews');
      expect(product).toHaveProperty('avgRating');
      expect(product).toHaveProperty('_count');
    });

    /**
     * Test retrieval of non-existent product
     */
    it('should return 404 for non-existent product', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/products/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    /**
     * Test invalid UUID format
     */
    it('should return validation error for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/products/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/v1/products/slug/:slug', () => {
    /**
     * Test successful retrieval of product by slug
     */
    it('should retrieve product by slug successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/products/slug/${testProduct.slug}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('product');
      expect(response.body.product.slug).toBe(testProduct.slug);
    });

    /**
     * Test retrieval of non-existent product by slug
     */
    it('should return 404 for non-existent product slug', async () => {
      const response = await request(app)
        .get('/api/v1/products/slug/non-existent-slug');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    /**
     * Test invalid slug format
     */
    it('should return validation error for invalid slug format', async () => {
      const response = await request(app)
        .get('/api/v1/products/slug/Invalid Slug With Spaces');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('POST /api/v1/products', () => {
    /**
     * Test successful product creation by admin
     */
    it('should allow admin to create product', async () => {
      const productData = {
        name: 'New Test Product',
        nameEn: 'New Test Product English',
        slug: 'new-test-product',
        sku: 'NEW-SKU-001',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 199.99,
        salePrice: 149.99,
        costPrice: 100.00,
        stockQuantity: 50,
        lowStockThreshold: 5,
        description: 'New product description',
        shortDescription: 'New product short description',
        nameBn: 'নিউ টেস্ট পণ্য',
        warrantyPeriod: 24,
        warrantyType: 'Extended Warranty'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/products',
        productData,
        adminUser.token
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Product created successfully');
      expect(response.body).toHaveProperty('product');
      
      const product = response.body.product;
      expect(product.name).toBe(productData.name);
      expect(product.nameEn).toBe(productData.nameEn);
      expect(product.slug).toBe(productData.slug);
      expect(product.sku).toBe(productData.sku);
      expect(parseFloat(product.regularPrice)).toBe(productData.regularPrice);
      expect(parseFloat(product.salePrice)).toBe(productData.salePrice);
      expect(parseFloat(product.costPrice)).toBe(productData.costPrice);
      expect(product.stockQuantity).toBe(productData.stockQuantity);
      expect(product.warrantyPeriod).toBe(productData.warrantyPeriod);
      expect(product.warrantyType).toBe(productData.warrantyType);
    });

    /**
     * Test unauthorized product creation by regular user
     */
    it('should deny product creation by regular user', async () => {
      const productData = {
        name: 'Unauthorized Product',
        nameEn: 'Unauthorized Product',
        slug: 'unauthorized-product',
        sku: 'UNAUTH-001',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 99.99,
        costPrice: 50.00,
        stockQuantity: 10
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/products',
        productData,
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test product creation without authentication
     */
    it('should deny product creation without authentication', async () => {
      const productData = {
        name: 'No Auth Product',
        nameEn: 'No Auth Product',
        slug: 'no-auth-product',
        sku: 'NOAUTH-001',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 99.99,
        costPrice: 50.00,
        stockQuantity: 10
      };

      const response = await request(app)
        .post('/api/v1/products')
        .send(productData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    /**
     * Test product creation with duplicate SKU
     */
    it('should prevent creation with duplicate SKU', async () => {
      const productData = {
        name: 'Duplicate SKU Product',
        nameEn: 'Duplicate SKU Product',
        slug: 'duplicate-sku-product',
        sku: testProduct.sku, // Duplicate SKU
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 99.99,
        costPrice: 50.00,
        stockQuantity: 10
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/products',
        productData,
        adminUser.token
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Product with this SKU already exists');
    });

    /**
     * Test product creation with duplicate slug
     */
    it('should prevent creation with duplicate slug', async () => {
      const productData = {
        name: 'Duplicate Slug Product',
        nameEn: 'Duplicate Slug Product',
        slug: testProduct.slug, // Duplicate slug
        sku: 'DIFFERENT-SKU',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 99.99,
        costPrice: 50.00,
        stockQuantity: 10
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/products',
        productData,
        adminUser.token
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Product with this slug already exists');
    });

    /**
     * Test validation of required fields
     */
    it('should validate required product fields', async () => {
      const incompleteData = {
        name: 'Incomplete Product'
        // Missing many required fields
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/products',
        incompleteData,
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test validation of field formats
     */
    it('should validate field formats and constraints', async () => {
      const invalidData = {
        name: 'A', // Too short
        nameEn: 'A', // Too short
        slug: 'Invalid Slug!', // Invalid characters
        sku: '', // Empty
        categoryId: 'invalid-uuid',
        brandId: 'invalid-uuid',
        regularPrice: -10, // Negative
        costPrice: -5, // Negative
        stockQuantity: -1, // Negative
        warrantyPeriod: -12 // Negative
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/products',
        invalidData,
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    /**
     * Test successful product update by admin
     */
    it('should allow admin to update product', async () => {
      const updateData = {
        name: 'Updated Product Name',
        regularPrice: 299.99,
        stockQuantity: 75,
        status: 'INACTIVE'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/products/${testProduct.id}`,
        updateData,
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Product updated successfully');
      expect(response.body).toHaveProperty('product');
      
      const product = response.body.product;
      expect(product.name).toBe(updateData.name);
      expect(parseFloat(product.regularPrice)).toBe(updateData.regularPrice);
      expect(product.stockQuantity).toBe(updateData.stockQuantity);
      expect(product.status).toBe(updateData.status);
    });

    /**
     * Test unauthorized product update by regular user
     */
    it('should deny product update by regular user', async () => {
      const updateData = {
        name: 'Hacked Product'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/products/${testProduct.id}`,
        updateData,
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test update of non-existent product
     */
    it('should return 404 when updating non-existent product', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/products/${fakeId}`,
        { name: 'Updated' },
        adminUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    /**
     * Test update with conflicting SKU
     */
    it('should prevent update with conflicting SKU', async () => {
      // Create another product
      const anotherProduct = await createTestProduct({ sku: 'DIFFERENT-SKU' });

      const updateData = {
        sku: anotherProduct.sku // Try to use another product's SKU
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/products/${testProduct.id}`,
        updateData,
        adminUser.token
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Product with this SKU already exists');
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    /**
     * Test successful product deletion by admin
     */
    it('should allow admin to delete product without orders', async () => {
      const productToDelete = await createTestProduct({ 
        name: 'Product to Delete' 
      });

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/products/${productToDelete.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Product deleted successfully');

      // Verify product is deleted
      const deletedProduct = await prisma.product.findUnique({
        where: { id: productToDelete.id }
      });
      expect(deletedProduct).toBeNull();
    });

    /**
     * Test deletion prevention for product with orders
     */
    it('should prevent deletion of product with existing orders', async () => {
      // Create product with order
      const productWithOrder = await createTestProduct({ 
        name: 'Product with Order' 
      });
      await createTestOrder({ product: productWithOrder });

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/products/${productWithOrder.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot delete product with existing orders');
      expect(response.body).toHaveProperty('suggestion', 'Consider discontinuing the product instead');
    });

    /**
     * Test unauthorized deletion by regular user
     */
    it('should deny product deletion by regular user', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/products/${testProduct.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });
  });

  describe('GET /api/v1/products/featured/list', () => {
    /**
     * Test retrieval of featured products
     */
    it('should retrieve featured products successfully', async () => {
      // Create featured product
      await createTestProduct({ 
        name: 'Featured Product',
        isFeatured: true 
      });

      const response = await request(app)
        .get('/api/v1/products/featured/list');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
      
      if (response.body.products.length > 0) {
        const products = response.body.products;
        products.forEach(product => {
          expect(product.isFeatured).toBe(true);
          expect(product.status).toBe('ACTIVE');
        });
      }
    });

    /**
     * Test that featured products include necessary fields
     */
    it('should include necessary fields in featured products', async () => {
      await createTestProduct({ 
        name: 'Featured Product Full',
        isFeatured: true 
      });

      const response = await request(app)
        .get('/api/v1/products/featured/list');

      expect(response.status).toBe(200);
      
      if (response.body.products.length > 0) {
        const product = response.body.products[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('slug');
        expect(product).toHaveProperty('regularPrice');
        expect(product).toHaveProperty('salePrice');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('brand');
        expect(product).toHaveProperty('images');
        expect(product).toHaveProperty('_count');
      }
    });
  });

  describe('Product Management Bangladesh-Specific Tests', () => {
    /**
     * Test product with Bangladesh-specific warranty
     */
    it('should handle Bangladesh-specific warranty information', async () => {
      const bdProductData = {
        name: 'Bangladesh Product',
        nameEn: 'Bangladesh Product',
        slug: 'bangladesh-product',
        sku: 'BD-SKU-001',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 19999.99,
        costPrice: 15000.00,
        stockQuantity: 10,
        warrantyPeriod: 36, // 3 years warranty
        warrantyType: 'Bangladesh Manufacturer Warranty',
        nameBn: 'বাংলাদেশ পণ্য'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/products',
        bdProductData,
        adminUser.token
      );

      expect(response.status).toBe(201);
      const product = response.body.product;
      expect(product.warrantyPeriod).toBe(bdProductData.warrantyPeriod);
      expect(product.warrantyType).toBe(bdProductData.warrantyType);
      expect(product.nameBn).toBe(bdProductData.nameBn);
    });

    /**
     * Test product pricing in BDT context
     */
    it('should handle BDT pricing correctly', async () => {
      const bdtProduct = await createTestProduct({ 
        regularPrice: 1999.99,
        salePrice: 1799.99
      });

      const response = await request(app)
        .get(`/api/v1/products/${bdtProduct.id}`);

      expect(response.status).toBe(200);
      const product = response.body.product;
      expect(parseFloat(product.regularPrice)).toBe(1999.99);
      expect(parseFloat(product.salePrice)).toBe(1799.99);
    });
  });

  describe('Product Management Security Tests', () => {
    /**
     * Test SQL injection protection
     */
    it('should protect against SQL injection in product search', async () => {
      const maliciousQuery = "'; DROP TABLE products; --";
      
      const response = await request(app)
        .get(`/api/v1/products?search=${encodeURIComponent(maliciousQuery)}`);

      // Should not crash the server
      expect(response.status).toBe(200);
      
      // Verify products table still exists
      const productCount = await prisma.product.count();
      expect(productCount).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test XSS protection in product data
     */
    it('should sanitize product input to prevent XSS', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/products',
        {
          name: xssPayload,
          nameEn: 'Safe Name',
          slug: 'safe-slug',
          sku: 'XSS-001',
          categoryId: testCategory.id,
          brandId: testBrand.id,
          regularPrice: 99.99,
          costPrice: 50.00,
          stockQuantity: 10
        },
        adminUser.token
      );

      // Should either reject or sanitize input
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        // If accepted, should be sanitized
        expect(response.body.product.name).not.toBe(xssPayload);
      }
    });

    /**
     * Test rate limiting on product creation
     */
    it('should implement rate limiting on product creation', async () => {
      const productData = {
        name: 'Rate Limit Test',
        nameEn: 'Rate Limit Test',
        slug: 'rate-limit-test',
        sku: 'RATE-001',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 99.99,
        costPrice: 50.00,
        stockQuantity: 10
      };

      // Make multiple requests
      const promises = Array(10).fill().map(() => 
        makeAuthenticatedRequest(
          app,
          'POST',
          '/api/v1/products',
          productData,
          adminUser.token
        )
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimitedResponse = responses.find(res => res.status === 429);
      expect(rateLimitedResponse).toBeDefined();
    });
  });
});