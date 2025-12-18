/**
 * Brand Management API Endpoint Tests
 * 
 * This test suite covers all brand management endpoints including:
 * - Get all brands with filtering
 * - Get brand by ID
 * - Create brand (admin only)
 * - Update brand (admin only)
 * - Delete brand (admin only)
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

describe('Brand Management API Endpoints', () => {
  let testUser, adminUser, testBrand, testCategory, testProduct;

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    adminUser = await createTestAdmin();
    testBrand = await createTestBrand();
    testCategory = await createTestCategory();
    testProduct = await createTestProduct({ 
      category: testCategory, 
      brand: testBrand 
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('GET /api/v1/brands', () => {
    /**
     * Test successful retrieval of all brands
     */
    it('should retrieve all brands successfully', async () => {
      const response = await request(app)
        .get('/api/v1/brands');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('brands');
      expect(Array.isArray(response.body.brands)).toBe(true);
      
      // Verify brand data structure
      if (response.body.brands.length > 0) {
        const brand = response.body.brands[0];
        expect(brand).toHaveProperty('id');
        expect(brand).toHaveProperty('name');
        expect(brand).toHaveProperty('slug');
        expect(brand).toHaveProperty('description');
        expect(brand).toHaveProperty('website');
        expect(brand).toHaveProperty('isActive');
        expect(brand).toHaveProperty('_count');
        expect(brand).not.toHaveProperty('password');
      }
    });

    /**
     * Test filtering by active status
     */
    it('should filter brands by active status', async () => {
      // Create inactive brand
      await createTestBrand({ 
        name: 'Inactive Brand',
        slug: 'inactive-brand',
        isActive: false 
      });

      const response = await request(app)
        .get('/api/v1/brands?includeInactive=false');

      expect(response.status).toBe(200);
      const brands = response.body.brands;
      
      if (brands.length > 0) {
        brands.forEach(brand => {
          expect(brand.isActive).toBe(true);
        });
      }
    });

    /**
     * Test including inactive brands
     */
    it('should include inactive brands when requested', async () => {
      // Create inactive brand
      await createTestBrand({ 
        name: 'Inactive Brand',
        slug: 'inactive-brand',
        isActive: false 
      });

      const response = await request(app)
        .get('/api/v1/brands?includeInactive=true');

      expect(response.status).toBe(200);
      const brands = response.body.brands;
      
      const hasInactiveBrand = brands.some(brand => brand.isActive === false);
      expect(hasInactiveBrand).toBe(true);
    });

    /**
     * Test search functionality
     */
    it('should search brands by name and description', async () => {
      const response = await request(app)
        .get('/api/v1/brands?search=Test');

      expect(response.status).toBe(200);
      const brands = response.body.brands;
      
      if (brands.length > 0) {
        const searchMatches = brands.some(brand => 
          brand.name.toLowerCase().includes('test'.toLowerCase()) ||
          (brand.description && brand.description.toLowerCase().includes('test'.toLowerCase()))
        );
        expect(searchMatches).toBe(true);
      }
    });

    /**
     * Test brand product counts
     */
    it('should include product counts in brand response', async () => {
      const response = await request(app)
        .get('/api/v1/brands');

      expect(response.status).toBe(200);
      const brands = response.body.brands;
      
      if (brands.length > 0) {
        const brand = brands[0];
        expect(brand._count).toBeDefined();
        expect(brand._count).toHaveProperty('products');
        expect(typeof brand._count.products).toBe('number');
      }
    });

    /**
     * Test sorting by name
     */
    it('should sort brands by name alphabetically', async () => {
      // Create brands with specific names
      await Promise.all([
        createTestBrand({ name: 'Zebra Brand' }),
        createTestBrand({ name: 'Alpha Brand' }),
        createTestBrand({ name: 'Beta Brand' })
      ]);

      const response = await request(app)
        .get('/api/v1/brands');

      expect(response.status).toBe(200);
      const brands = response.body.brands;
      
      // Should be sorted alphabetically
      for (let i = 1; i < brands.length; i++) {
        expect(brands[i-1].name.localeCompare(brands[i].name)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('GET /api/v1/brands/:id', () => {
    /**
     * Test successful retrieval of brand by ID
     */
    it('should retrieve brand by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/brands/${testBrand.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('brand');
      
      const brand = response.body.brand;
      expect(brand.id).toBe(testBrand.id);
      expect(brand).toHaveProperty('name');
      expect(brand).toHaveProperty('slug');
      expect(brand).toHaveProperty('description');
      expect(brand).toHaveProperty('website');
      expect(brand).toHaveProperty('isActive');
      expect(brand).toHaveProperty('_count');
      expect(brand).toHaveProperty('products');
    });

    /**
     * Test retrieval of brand with products
     */
    it('should include active products in brand response', async () => {
      const response = await request(app)
        .get(`/api/v1/brands/${testBrand.id}`);

      expect(response.status).toBe(200);
      const brand = response.body.brand;
      
      if (brand.products) {
        expect(Array.isArray(brand.products)).toBe(true);
        
        // Should only include active products
        brand.products.forEach(product => {
          expect(product.status).toBe('ACTIVE');
        });
        
        // Should limit to 10 products
        expect(brand.products.length).toBeLessThanOrEqual(10);
        
        // Should include product images
        if (brand.products.length > 0) {
          brand.products.forEach(product => {
            expect(product).toHaveProperty('images');
            if (product.images && product.images.length > 0) {
              expect(product.images[0]).toHaveProperty('url');
              expect(product.images[0]).toHaveProperty('alt');
            }
          });
        }
      }
    });

    /**
     * Test retrieval of non-existent brand
     */
    it('should return 404 for non-existent brand', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/brands/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Brand not found');
    });

    /**
     * Test invalid UUID format
     */
    it('should return validation error for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/brands/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('POST /api/v1/brands', () => {
    /**
     * Test successful brand creation by admin
     */
    it('should allow admin to create brand', async () => {
      const brandData = {
        name: 'New Test Brand',
        slug: 'new-test-brand',
        description: 'New brand description for testing',
        website: 'https://newbrand.example.com',
        isActive: true
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/brands',
        brandData,
        adminUser.token
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Brand created successfully');
      expect(response.body).toHaveProperty('brand');
      
      const brand = response.body.brand;
      expect(brand.name).toBe(brandData.name);
      expect(brand.slug).toBe(brandData.slug);
      expect(brand.description).toBe(brandData.description);
      expect(brand.website).toBe(brandData.website);
      expect(brand.isActive).toBe(brandData.isActive);
    });

    /**
     * Test brand creation with minimal data
     */
    it('should create brand with minimal required data', async () => {
      const minimalBrandData = {
        name: 'Minimal Brand',
        slug: 'minimal-brand'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/brands',
        minimalBrandData,
        adminUser.token
      );

      expect(response.status).toBe(201);
      const brand = response.body.brand;
      expect(brand.name).toBe(minimalBrandData.name);
      expect(brand.slug).toBe(minimalBrandData.slug);
      expect(brand.isActive).toBe(true); // Default value
      expect(brand.description).toBeNull();
      expect(brand.website).toBeNull();
    });

    /**
     * Test unauthorized brand creation by regular user
     */
    it('should deny brand creation by regular user', async () => {
      const brandData = {
        name: 'Unauthorized Brand',
        slug: 'unauthorized-brand',
        description: 'Unauthorized brand'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/brands',
        brandData,
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test brand creation without authentication
     */
    it('should deny brand creation without authentication', async () => {
      const brandData = {
        name: 'No Auth Brand',
        slug: 'no-auth-brand',
        description: 'No auth brand'
      };

      const response = await request(app)
        .post('/api/v1/brands')
        .send(brandData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    /**
     * Test brand creation with duplicate slug
     */
    it('should prevent creation with duplicate slug', async () => {
      const brandData = {
        name: 'Duplicate Slug Brand',
        slug: testBrand.slug, // Duplicate slug
        description: 'Duplicate slug brand'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/brands',
        brandData,
        adminUser.token
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Brand with this slug already exists');
    });

    /**
     * Test validation of required fields
     */
    it('should validate required brand fields', async () => {
      const incompleteData = {
        description: 'Incomplete brand'
        // Missing name and slug
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/brands',
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
        name: '', // Empty name
        slug: 'Invalid Slug!', // Invalid characters
        website: 'not-a-url',
        isActive: 'not-a-boolean'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/brands',
        invalidData,
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test validation of website URL
     */
    it('should validate website URL format', async () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid-protocol.com',
        'http://',
        'https://'
      ];

      for (const website of invalidUrls) {
        const brandData = {
          name: 'Test Brand',
          slug: 'test-brand-url',
          website: website
        };

        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          '/api/v1/brands',
          brandData,
          adminUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });

    /**
     * Test valid website URLs
     */
    it('should accept valid website URLs', async () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com',
        'https://example.com/path',
        'https://example.com/path?query=value',
        'https://example.com/path#anchor'
      ];

      for (const website of validUrls) {
        const brandData = {
          name: `Test Brand ${website}`,
          slug: `test-brand-${website.length}`,
          website: website
        };

        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          '/api/v1/brands',
          brandData,
          adminUser.token
        );

        expect(response.status).toBe(201);
        expect(response.body.brand.website).toBe(website);
      }
    });
  });

  describe('PUT /api/v1/brands/:id', () => {
    /**
     * Test successful brand update by admin
     */
    it('should allow admin to update brand', async () => {
      const updateData = {
        name: 'Updated Brand Name',
        description: 'Updated brand description',
        website: 'https://updated.example.com',
        isActive: false
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/brands/${testBrand.id}`,
        updateData,
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Brand updated successfully');
      expect(response.body).toHaveProperty('brand');
      
      const brand = response.body.brand;
      expect(brand.name).toBe(updateData.name);
      expect(brand.description).toBe(updateData.description);
      expect(brand.website).toBe(updateData.website);
      expect(brand.isActive).toBe(updateData.isActive);
    });

    /**
     * Test partial brand update
     */
    it('should allow partial brand update', async () => {
      const partialUpdateData = {
        name: 'Partially Updated Brand'
        // Only updating name
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/brands/${testBrand.id}`,
        partialUpdateData,
        adminUser.token
      );

      expect(response.status).toBe(200);
      const brand = response.body.brand;
      expect(brand.name).toBe(partialUpdateData.name);
      // Other fields should remain unchanged
      expect(brand.slug).toBe(testBrand.slug);
      expect(brand.description).toBe(testBrand.description);
    });

    /**
     * Test unauthorized brand update by regular user
     */
    it('should deny brand update by regular user', async () => {
      const updateData = {
        name: 'Hacked Brand'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/brands/${testBrand.id}`,
        updateData,
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test update of non-existent brand
     */
    it('should return 404 when updating non-existent brand', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/brands/${fakeId}`,
        { name: 'Updated' },
        adminUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Brand not found');
    });

    /**
     * Test update with conflicting slug
     */
    it('should prevent update with conflicting slug', async () => {
      // Create another brand
      const anotherBrand = await createTestBrand({ 
        name: 'Another Brand',
        slug: 'another-brand'
      });

      const updateData = {
        slug: anotherBrand.slug // Try to use another brand's slug
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/brands/${testBrand.id}`,
        updateData,
        adminUser.token
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Brand with this slug already exists');
    });
  });

  describe('DELETE /api/v1/brands/:id', () => {
    /**
     * Test successful brand deletion by admin
     */
    it('should allow admin to delete brand without products', async () => {
      const brandToDelete = await createTestBrand({ 
        name: 'Brand to Delete',
        slug: 'brand-to-delete'
      });

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/brands/${brandToDelete.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Brand deleted successfully');

      // Verify brand is deleted
      const deletedBrand = await prisma.brand.findUnique({
        where: { id: brandToDelete.id }
      });
      expect(deletedBrand).toBeNull();
    });

    /**
     * Test deletion prevention for brand with products
     */
    it('should prevent deletion of brand with existing products', async () => {
      // Create brand with product
      const brandWithProduct = await createTestBrand({ 
        name: 'Brand with Product',
        slug: 'brand-with-product'
      });
      await createTestProduct({ brand: brandWithProduct });

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/brands/${brandWithProduct.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot delete brand with existing products');
      expect(response.body).toHaveProperty('suggestion', 'Consider deactivating the brand instead');
    });

    /**
     * Test unauthorized deletion by regular user
     */
    it('should deny brand deletion by regular user', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/brands/${testBrand.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });
  });

  describe('Brand Management Bangladesh-Specific Tests', () => {
    /**
     * Test brand with Bangladesh-specific website
     */
    it('should handle Bangladesh brand websites', async () => {
      const bdBrandData = {
        name: 'Bangladesh Brand',
        slug: 'bangladesh-brand',
        description: 'বাংলাদেশের স্থানীয় ব্র্যান্ড',
        website: 'https://brand.com.bd'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/brands',
        bdBrandData,
        adminUser.token
      );

      expect(response.status).toBe(201);
      const brand = response.body.brand;
      expect(brand.name).toBe(bdBrandData.name);
      expect(brand.description).toBe(bdBrandData.description);
      expect(brand.website).toBe(bdBrandData.website);
    });

    /**
     * Test brand with .bd domain
     */
    it('should accept .bd domain for brand website', async () => {
      const bdDomainBrand = {
        name: '.BD Domain Brand',
        slug: 'bd-domain-brand',
        website: 'https://example.bd'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/brands',
        bdDomainBrand,
        adminUser.token
      );

      expect(response.status).toBe(201);
      expect(response.body.brand.website).toBe(bdDomainBrand.website);
    });
  });

  describe('Brand Management Security Tests', () => {
    /**
     * Test SQL injection protection
     */
    it('should protect against SQL injection in brand search', async () => {
      const maliciousQuery = "'; DROP TABLE brands; --";
      
      const response = await request(app)
        .get(`/api/v1/brands?search=${encodeURIComponent(maliciousQuery)}`);

      // Should not crash the server
      expect(response.status).toBe(200);
      
      // Verify brands table still exists
      const brandCount = await prisma.brand.count();
      expect(brandCount).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test XSS protection in brand data
     */
    it('should sanitize brand input to prevent XSS', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/brands',
        {
          name: xssPayload,
          slug: 'safe-slug',
          description: 'Safe description'
        },
        adminUser.token
      );

      // Should either reject or sanitize input
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        // If accepted, should be sanitized
        expect(response.body.brand.name).not.toBe(xssPayload);
      }
    });

    /**
     * Test rate limiting on brand creation
     */
    it('should implement rate limiting on brand creation', async () => {
      const brandData = {
        name: 'Rate Limit Test',
        slug: 'rate-limit-test',
        description: 'Rate limit test brand'
      };

      // Make multiple requests
      const promises = Array(10).fill().map(() => 
        makeAuthenticatedRequest(
          app,
          'POST',
          '/api/v1/brands',
          brandData,
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