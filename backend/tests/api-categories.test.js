/**
 * Category Management API Endpoint Tests
 * 
 * This test suite covers all category management endpoints including:
 * - Get all categories with filtering
 * - Get category by ID
 * - Get category tree
 * - Create category (admin only)
 * - Update category (admin only)
 * - Delete category (admin only)
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
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure,
  prisma 
} = require('./api-test-utils');

describe('Category Management API Endpoints', () => {
  let testUser, adminUser, testCategory, parentCategory, childCategory;

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    adminUser = await createTestAdmin();
    
    // Create parent category
    parentCategory = await createTestCategory({ 
      name: 'Parent Category',
      slug: 'parent-category'
    });
    
    // Create child category
    childCategory = await createTestCategory({ 
      name: 'Child Category',
      slug: 'child-category',
      parentId: parentCategory.id
    });
    
    testCategory = parentCategory;
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('GET /api/v1/categories', () => {
    /**
     * Test successful retrieval of all categories
     */
    it('should retrieve all categories successfully', async () => {
      const response = await request(app)
        .get('/api/v1/categories');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      
      // Verify category data structure
      if (response.body.categories.length > 0) {
        const category = response.body.categories[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('isActive');
        expect(category).toHaveProperty('sortOrder');
        expect(category).toHaveProperty('parentCategory');
        expect(category).toHaveProperty('subcategories');
        expect(category).toHaveProperty('_count');
        expect(category).not.toHaveProperty('password');
      }
    });

    /**
     * Test filtering by active status
     */
    it('should filter categories by active status', async () => {
      // Create inactive category
      await createTestCategory({ 
        name: 'Inactive Category',
        slug: 'inactive-category',
        isActive: false 
      });

      const response = await request(app)
        .get('/api/v1/categories?includeInactive=false');

      expect(response.status).toBe(200);
      const categories = response.body.categories;
      
      if (categories.length > 0) {
        categories.forEach(category => {
          expect(category.isActive).toBe(true);
        });
      }
    });

    /**
     * Test including inactive categories
     */
    it('should include inactive categories when requested', async () => {
      // Create inactive category
      await createTestCategory({ 
        name: 'Inactive Category',
        slug: 'inactive-category',
        isActive: false 
      });

      const response = await request(app)
        .get('/api/v1/categories?includeInactive=true');

      expect(response.status).toBe(200);
      const categories = response.body.categories;
      
      const hasInactiveCategory = categories.some(cat => cat.isActive === false);
      expect(hasInactiveCategory).toBe(true);
    });

    /**
     * Test filtering parent categories only
     */
    it('should filter parent categories only', async () => {
      const response = await request(app)
        .get('/api/v1/categories?parentOnly=true');

      expect(response.status).toBe(200);
      const categories = response.body.categories;
      
      if (categories.length > 0) {
        categories.forEach(category => {
          expect(category.parentId).toBeNull();
        });
      }
    });

    /**
     * Test category hierarchy structure
     */
    it('should include subcategories in response', async () => {
      const response = await request(app)
        .get('/api/v1/categories');

      expect(response.status).toBe(200);
      const categories = response.body.categories;
      
      // Find parent category
      const parent = categories.find(cat => cat.id === parentCategory.id);
      expect(parent).toBeDefined();
      expect(parent.subcategories).toBeDefined();
      expect(Array.isArray(parent.subcategories)).toBe(true);
      
      // Find child category in parent's subcategories
      if (parent.subcategories.length > 0) {
        const child = parent.subcategories.find(sub => sub.id === childCategory.id);
        expect(child).toBeDefined();
      }
    });

    /**
     * Test category counts
     */
    it('should include product and subcategory counts', async () => {
      const response = await request(app)
        .get('/api/v1/categories');

      expect(response.status).toBe(200);
      const categories = response.body.categories;
      
      if (categories.length > 0) {
        const category = categories[0];
        expect(category._count).toBeDefined();
        expect(category._count).toHaveProperty('products');
        expect(category._count).toHaveProperty('subcategories');
        expect(typeof category._count.products).toBe('number');
        expect(typeof category._count.subcategories).toBe('number');
      }
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    /**
     * Test successful retrieval of category by ID
     */
    it('should retrieve category by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/categories/${testCategory.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('category');
      
      const category = response.body.category;
      expect(category.id).toBe(testCategory.id);
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('isActive');
      expect(category).toHaveProperty('sortOrder');
      expect(category).toHaveProperty('bannerImage');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('parentCategory');
      expect(category).toHaveProperty('subcategories');
      expect(category).toHaveProperty('products');
      expect(category).toHaveProperty('_count');
    });

    /**
     * Test retrieval of category with products
     */
    it('should include active products in category response', async () => {
      const response = await request(app)
        .get(`/api/v1/categories/${testCategory.id}`);

      expect(response.status).toBe(200);
      const category = response.body.category;
      
      if (category.products) {
        expect(Array.isArray(category.products)).toBe(true);
        
        // Should only include active products
        category.products.forEach(product => {
          expect(product.status).toBe('ACTIVE');
        });
        
        // Should limit to 10 products
        expect(category.products.length).toBeLessThanOrEqual(10);
      }
    });

    /**
     * Test retrieval of non-existent category
     */
    it('should return 404 for non-existent category', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(app)
        .get(`/api/v1/categories/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Category not found');
    });

    /**
     * Test invalid UUID format
     */
    it('should return validation error for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/categories/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/v1/categories/tree/all', () => {
    /**
     * Test successful retrieval of category tree
     */
    it('should retrieve category tree successfully', async () => {
      const response = await request(app)
        .get('/api/v1/categories/tree/all');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      
      // Verify tree structure
      if (response.body.categories.length > 0) {
        const categories = response.body.categories;
        
        // Root categories should have no parentId
        const rootCategories = categories.filter(cat => !cat.parentId);
        expect(rootCategories.length).toBeGreaterThan(0);
        
        // Check nested structure
        rootCategories.forEach(root => {
          if (root.children && root.children.length > 0) {
            root.children.forEach(child => {
              expect(child.parentId).toBe(root.id);
            });
          }
        });
      }
    });

    /**
     * Test tree includes only active categories
     */
    it('should include only active categories in tree', async () => {
      // Create inactive category
      await createTestCategory({ 
        name: 'Inactive Tree Category',
        slug: 'inactive-tree-category',
        isActive: false 
      });

      const response = await request(app)
        .get('/api/v1/categories/tree/all');

      expect(response.status).toBe(200);
      
      // Verify no inactive categories in tree
      const checkInactive = (categories) => {
        categories.forEach(cat => {
          expect(cat.isActive).toBe(true);
          if (cat.children && cat.children.length > 0) {
            checkInactive(cat.children);
          }
        });
      };
      
      checkInactive(response.body.categories);
    });

    /**
     * Test tree includes proper counts
     */
    it('should include product and subcategory counts in tree', async () => {
      const response = await request(app)
        .get('/api/v1/categories/tree/all');

      expect(response.status).toBe(200);
      
      const checkCounts = (categories) => {
        categories.forEach(cat => {
          expect(cat._count).toBeDefined();
          expect(cat._count).toHaveProperty('products');
          expect(cat._count).toHaveProperty('subcategories');
          
          if (cat.children && cat.children.length > 0) {
            checkCounts(cat.children);
          }
        });
      };
      
      checkCounts(response.body.categories);
    });
  });

  describe('POST /api/v1/categories', () => {
    /**
     * Test successful category creation by admin
     */
    it('should allow admin to create category', async () => {
      const categoryData = {
        name: 'New Test Category',
        slug: 'new-test-category',
        description: 'New category description',
        parentId: null,
        sortOrder: 10,
        bannerImage: 'https://example.com/banner.jpg',
        icon: 'https://example.com/icon.png'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/categories',
        categoryData,
        adminUser.token
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Category created successfully');
      expect(response.body).toHaveProperty('category');
      
      const category = response.body.category;
      expect(category.name).toBe(categoryData.name);
      expect(category.slug).toBe(categoryData.slug);
      expect(category.description).toBe(categoryData.description);
      expect(category.parentId).toBe(categoryData.parentId);
      expect(category.sortOrder).toBe(categoryData.sortOrder);
      expect(category.bannerImage).toBe(categoryData.bannerImage);
      expect(category.icon).toBe(categoryData.icon);
      expect(category.isActive).toBe(true); // Default value
    });

    /**
     * Test category creation with parent
     */
    it('should allow creating category with parent', async () => {
      const categoryData = {
        name: 'Child Test Category',
        slug: 'child-test-category',
        description: 'Child category description',
        parentId: testCategory.id,
        sortOrder: 5
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/categories',
        categoryData,
        adminUser.token
      );

      expect(response.status).toBe(201);
      const category = response.body.category;
      expect(category.parentId).toBe(testCategory.id);
    });

    /**
     * Test unauthorized category creation by regular user
     */
    it('should deny category creation by regular user', async () => {
      const categoryData = {
        name: 'Unauthorized Category',
        slug: 'unauthorized-category',
        description: 'Unauthorized category'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/categories',
        categoryData,
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test category creation without authentication
     */
    it('should deny category creation without authentication', async () => {
      const categoryData = {
        name: 'No Auth Category',
        slug: 'no-auth-category',
        description: 'No auth category'
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .send(categoryData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    /**
     * Test category creation with duplicate slug
     */
    it('should prevent creation with duplicate slug', async () => {
      const categoryData = {
        name: 'Duplicate Slug Category',
        slug: testCategory.slug, // Duplicate slug
        description: 'Duplicate slug category'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/categories',
        categoryData,
        adminUser.token
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Category with this slug already exists');
    });

    /**
     * Test category creation with invalid parent
     */
    it('should return error for invalid parent category', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const categoryData = {
        name: 'Invalid Parent Category',
        slug: 'invalid-parent-category',
        description: 'Invalid parent category',
        parentId: fakeId
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/categories',
        categoryData,
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Parent category not found');
    });

    /**
     * Test validation of required fields
     */
    it('should validate required category fields', async () => {
      const incompleteData = {
        description: 'Incomplete category'
        // Missing name and slug
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/categories',
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
        sortOrder: -5, // Negative
        bannerImage: 'not-a-url',
        icon: 'not-a-url'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/categories',
        invalidData,
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    /**
     * Test successful category update by admin
     */
    it('should allow admin to update category', async () => {
      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated category description',
        sortOrder: 20,
        isActive: false
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/categories/${testCategory.id}`,
        updateData,
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Category updated successfully');
      expect(response.body).toHaveProperty('category');
      
      const category = response.body.category;
      expect(category.name).toBe(updateData.name);
      expect(category.description).toBe(updateData.description);
      expect(category.sortOrder).toBe(updateData.sortOrder);
      expect(category.isActive).toBe(updateData.isActive);
    });

    /**
     * Test unauthorized category update by regular user
     */
    it('should deny category update by regular user', async () => {
      const updateData = {
        name: 'Hacked Category'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/categories/${testCategory.id}`,
        updateData,
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });

    /**
     * Test update of non-existent category
     */
    it('should return 404 when updating non-existent category', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/categories/${fakeId}`,
        { name: 'Updated' },
        adminUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Category not found');
    });

    /**
     * Test update with conflicting slug
     */
    it('should prevent update with conflicting slug', async () => {
      // Create another category
      const anotherCategory = await createTestCategory({ 
        name: 'Another Category',
        slug: 'another-category'
      });

      const updateData = {
        slug: anotherCategory.slug // Try to use another category's slug
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/categories/${testCategory.id}`,
        updateData,
        adminUser.token
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Category with this slug already exists');
    });

    /**
     * Test circular reference prevention
     */
    it('should prevent circular reference in parent relationship', async () => {
      const updateData = {
        parentId: testCategory.id // Try to make category its own parent
      };

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/categories/${testCategory.id}`,
        updateData,
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Category cannot be its own parent');
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    /**
     * Test successful category deletion by admin
     */
    it('should allow admin to delete category without dependencies', async () => {
      const categoryToDelete = await createTestCategory({ 
        name: 'Category to Delete',
        slug: 'category-to-delete'
      });

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/categories/${categoryToDelete.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Category deleted successfully');

      // Verify category is deleted
      const deletedCategory = await prisma.category.findUnique({
        where: { id: categoryToDelete.id }
      });
      expect(deletedCategory).toBeNull();
    });

    /**
     * Test deletion prevention for category with products
     */
    it('should prevent deletion of category with existing products', async () => {
      // Create category with product
      const categoryWithProduct = await createTestCategory({ 
        name: 'Category with Product',
        slug: 'category-with-product'
      });
      await createTestProduct({ category: categoryWithProduct });

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/categories/${categoryWithProduct.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot delete category with existing products or subcategories');
      expect(response.body).toHaveProperty('suggestion', 'Consider deactivating the category instead');
    });

    /**
     * Test deletion prevention for category with subcategories
     */
    it('should prevent deletion of category with subcategories', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/categories/${parentCategory.id}`,
        {},
        adminUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot delete category with existing products or subcategories');
    });

    /**
     * Test unauthorized deletion by regular user
     */
    it('should deny category deletion by regular user', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/categories/${testCategory.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });
  });

  describe('Category Management Bangladesh-Specific Tests', () => {
    /**
     * Test category with Bangladesh-specific naming
     */
    it('should handle Bengali category names', async () => {
      const bdCategoryData = {
        name: 'ইলেকট্রনিক্স',
        slug: 'electronics-bn',
        description: 'বাংলাদেশের ইলেকট্রনিক্স পণ্য'
      };

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/categories',
        bdCategoryData,
        adminUser.token
      );

      expect(response.status).toBe(201);
      const category = response.body.category;
      expect(category.name).toBe(bdCategoryData.name);
      expect(category.description).toBe(bdCategoryData.description);
    });

    /**
     * Test category sorting for Bangladesh market
     */
    it('should respect sort order for Bangladesh category display', async () => {
      // Create categories with different sort orders
      await Promise.all([
        createTestCategory({ 
          name: 'First Category',
          slug: 'first-category',
          sortOrder: 10
        }),
        createTestCategory({ 
          name: 'Second Category',
          slug: 'second-category',
          sortOrder: 5
        }),
        createTestCategory({ 
          name: 'Third Category',
          slug: 'third-category',
          sortOrder: 15
        })
      ]);

      const response = await request(app)
        .get('/api/v1/categories');

      expect(response.status).toBe(200);
      const categories = response.body.categories;
      
      // Should be sorted by sortOrder, then name
      expect(categories[0].sortOrder).toBe(5); // Second
      expect(categories[1].sortOrder).toBe(10); // First
      expect(categories[2].sortOrder).toBe(15); // Third
    });
  });

  describe('Category Management Security Tests', () => {
    /**
     * Test SQL injection protection
     */
    it('should protect against SQL injection in category search', async () => {
      const maliciousQuery = "'; DROP TABLE categories; --";
      
      const response = await request(app)
        .get(`/api/v1/categories?search=${encodeURIComponent(maliciousQuery)}`);

      // Should not crash the server
      expect(response.status).toBe(200);
      
      // Verify categories table still exists
      const categoryCount = await prisma.category.count();
      expect(categoryCount).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test XSS protection in category data
     */
    it('should sanitize category input to prevent XSS', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/categories',
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
        expect(response.body.category.name).not.toBe(xssPayload);
      }
    });

    /**
     * Test rate limiting on category creation
     */
    it('should implement rate limiting on category creation', async () => {
      const categoryData = {
        name: 'Rate Limit Test',
        slug: 'rate-limit-test',
        description: 'Rate limit test category'
      };

      // Make multiple requests
      const promises = Array(10).fill().map(() => 
        makeAuthenticatedRequest(
          app,
          'POST',
          '/api/v1/categories',
          categoryData,
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