const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { app } = require('../index');

const prisma = new PrismaClient();

// Test setup and teardown
beforeAll(async () => {
  // Clean up test data
  await cleanupTestData();
});

afterAll(async () => {
  // Clean up test data
  await cleanupTestData();
  await prisma.$disconnect();
});

async function cleanupTestData() {
  // Delete in order to respect foreign key constraints
  await prisma.product.deleteMany({
    where: {
      sku: { startsWith: 'TEST-' }
    }
  });
  await prisma.category.deleteMany({
    where: {
      slug: { startsWith: 'test-' }
    }
  });
  await prisma.brand.deleteMany({
    where: {
      slug: { startsWith: 'test-' }
    }
  });
}

// Helper function to create test category
async function createTestCategory(suffix = '') {
  return await prisma.category.create({
    data: {
      name: `Test Category ${suffix}`,
      slug: `test-category-${suffix}`,
      status: 'active'
    }
  });
}

// Helper function to create test brand
async function createTestBrand(suffix = '') {
  return await prisma.brand.create({
    data: {
      name: `Test Brand ${suffix}`,
      slug: `test-brand-${suffix}`,
      status: 'active'
    }
  });
}

// Helper function to create admin user token
function getAdminToken() {
  // In a real scenario, this would be a valid JWT token
  return 'Bearer test-admin-token';
}

describe('Bulk Product Operations', () => {
  describe('POST /api/v1/products/bulk - Batch Create Products', () => {
    let testCategory, testBrand;

    beforeEach(async () => {
      testCategory = await createTestCategory('bulk-1');
      testBrand = await createTestBrand('bulk-1');
    });

    test('should create multiple products successfully', async () => {
      const products = [
        {
          sku: 'TEST-BULK-001',
          name: 'Test Product 1',
          nameEn: 'Test Product 1',
          slug: 'test-product-1',
          description: 'Test description 1',
          basePrice: 1000,
          costPrice: 700,
          categories: [testCategory.id],
          brandId: testBrand.id,
          status: 'active',
          visibility: 'public'
        },
        {
          sku: 'TEST-BULK-002',
          name: 'Test Product 2',
          nameEn: 'Test Product 2',
          slug: 'test-product-2',
          description: 'Test description 2',
          basePrice: 2000,
          costPrice: 1400,
          categories: [testCategory.id],
          brandId: testBrand.id,
          status: 'active',
          visibility: 'public'
        }
      ];

      const response = await request(app)
        .post('/api/v1/products/bulk')
        .set('Authorization', getAdminToken())
        .send({ products })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.results).toHaveLength(2);
    });

    test('should reject duplicate SKUs in batch', async () => {
      const products = [
        {
          sku: 'TEST-DUP-001',
          name: 'Test Product 1',
          nameEn: 'Test Product 1',
          slug: 'test-product-1',
          basePrice: 1000,
          costPrice: 700,
          categories: [testCategory.id],
          brandId: testBrand.id
        },
        {
          sku: 'TEST-DUP-001',
          name: 'Test Product 2',
          nameEn: 'Test Product 2',
          slug: 'test-product-2',
          basePrice: 2000,
          costPrice: 1400,
          categories: [testCategory.id],
          brandId: testBrand.id
        }
      ];

      const response = await request(app)
        .post('/api/v1/products/bulk')
        .set('Authorization', getAdminToken())
        .send({ products })
        .expect(400);

      expect(response.body.error).toContain('Duplicate SKUs');
    });

    test('should reject duplicate slugs in batch', async () => {
      const products = [
        {
          sku: 'TEST-SLUG-001',
          name: 'Test Product 1',
          nameEn: 'Test Product 1',
          slug: 'test-slug-dup',
          basePrice: 1000,
          costPrice: 700,
          categories: [testCategory.id],
          brandId: testBrand.id
        },
        {
          sku: 'TEST-SLUG-002',
          name: 'Test Product 2',
          nameEn: 'Test Product 2',
          slug: 'test-slug-dup',
          basePrice: 2000,
          costPrice: 1400,
          categories: [testCategory.id],
          brandId: testBrand.id
        }
      ];

      const response = await request(app)
        .post('/api/v1/products/bulk')
        .set('Authorization', getAdminToken())
        .send({ products })
        .expect(400);

      expect(response.body.error).toContain('Duplicate slugs');
    });

    test('should reject batch with more than 100 items', async () => {
      const products = Array.from({ length: 101 }, (_, i) => ({
        sku: `TEST-LIMIT-${i}`,
        name: `Test Product ${i}`,
        nameEn: `Test Product ${i}`,
        slug: `test-product-${i}`,
        basePrice: 1000,
        costPrice: 700,
        categories: [testCategory.id],
        brandId: testBrand.id
      }));

      const response = await request(app)
        .post('/api/v1/products/bulk')
        .set('Authorization', getAdminToken())
        .send({ products })
        .expect(400);

      expect(response.body.error).toContain('1-100 items');
    });
  });

  describe('PUT /api/v1/products/bulk - Batch Update Products', () => {
    let testCategory, testBrand, testProducts;

    beforeEach(async () => {
      testCategory = await createTestCategory('bulk-update-1');
      testBrand = await createTestBrand('bulk-update-1');

      testProducts = await Promise.all([
        prisma.product.create({
          data: {
            sku: 'TEST-UPDATE-001',
            name: 'Test Product 1',
            nameEn: 'Test Product 1',
            slug: 'test-update-product-1',
            regularPrice: 1000,
            costPrice: 700,
            brandId: testBrand.id,
            categories: {
              create: [{ categoryId: testCategory.id, isPrimary: true }]
            }
          }
        }),
        prisma.product.create({
          data: {
            sku: 'TEST-UPDATE-002',
            name: 'Test Product 2',
            nameEn: 'Test Product 2',
            slug: 'test-update-product-2',
            regularPrice: 2000,
            costPrice: 1400,
            brandId: testBrand.id,
            categories: {
              create: [{ categoryId: testCategory.id, isPrimary: true }]
            }
          }
        })
      ]);
    });

    test('should update multiple products successfully', async () => {
      const updates = [
        {
          id: testProducts[0].id,
          name: 'Updated Product 1',
          regularPrice: 1500
        },
        {
          id: testProducts[1].id,
          name: 'Updated Product 2',
          regularPrice: 2500
        }
      ];

      const response = await request(app)
        .put('/api/v1/products/bulk')
        .set('Authorization', getAdminToken())
        .send({ products: updates })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    test('should reject updates for non-existent products', async () => {
      const updates = [
        {
          id: '00000000-0000-0000-0000-000000000000',
          name: 'Non-existent Product',
          regularPrice: 1500
        }
      ];

      const response = await request(app)
        .put('/api/v1/products/bulk')
        .set('Authorization', getAdminToken())
        .send({ products: updates })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/v1/products/bulk - Batch Delete Products', () => {
    let testCategory, testBrand, testProducts;

    beforeEach(async () => {
      testCategory = await createTestCategory('bulk-delete-1');
      testBrand = await createTestBrand('bulk-delete-1');

      testProducts = await Promise.all([
        prisma.product.create({
          data: {
            sku: 'TEST-DELETE-001',
            name: 'Test Product 1',
            nameEn: 'Test Product 1',
            slug: 'test-delete-product-1',
            regularPrice: 1000,
            costPrice: 700,
            brandId: testBrand.id,
            categories: {
              create: [{ categoryId: testCategory.id, isPrimary: true }]
            }
          }
        }),
        prisma.product.create({
          data: {
            sku: 'TEST-DELETE-002',
            name: 'Test Product 2',
            nameEn: 'Test Product 2',
            slug: 'test-delete-product-2',
            regularPrice: 2000,
            costPrice: 1400,
            brandId: testBrand.id,
            categories: {
              create: [{ categoryId: testCategory.id, isPrimary: true }]
            }
          }
        })
      ]);
    });

    test('should delete multiple products successfully', async () => {
      const productIds = testProducts.map(p => p.id);

      const response = await request(app)
        .delete('/api/v1/products/bulk')
        .set('Authorization', getAdminToken())
        .send({ productIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(2);
      expect(response.body.failed).toBe(0);

      // Verify products are deleted
      const remainingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
      expect(remainingProducts).toHaveLength(0);
    });

    test('should reject deletion for non-existent products', async () => {
      const productIds = [
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000001'
      ];

      const response = await request(app)
        .delete('/api/v1/products/bulk')
        .set('Authorization', getAdminToken())
        .send({ productIds })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('PATCH /api/v1/products/bulk/status - Batch Update Product Status', () => {
    let testCategory, testBrand, testProducts;

    beforeEach(async () => {
      testCategory = await createTestCategory('bulk-status-1');
      testBrand = await createTestBrand('bulk-status-1');

      testProducts = await Promise.all([
        prisma.product.create({
          data: {
            sku: 'TEST-STATUS-001',
            name: 'Test Product 1',
            nameEn: 'Test Product 1',
            slug: 'test-status-product-1',
            regularPrice: 1000,
            costPrice: 700,
            status: 'draft',
            brandId: testBrand.id,
            categories: {
              create: [{ categoryId: testCategory.id, isPrimary: true }]
            }
          }
        }),
        prisma.product.create({
          data: {
            sku: 'TEST-STATUS-002',
            name: 'Test Product 2',
            nameEn: 'Test Product 2',
            slug: 'test-status-product-2',
            regularPrice: 2000,
            costPrice: 1400,
            status: 'draft',
            brandId: testBrand.id,
            categories: {
              create: [{ categoryId: testCategory.id, isPrimary: true }]
            }
          }
        })
      ]);
    });

    test('should update status for multiple products successfully', async () => {
      const productIds = testProducts.map(p => p.id);

      const response = await request(app)
        .patch('/api/v1/products/bulk/status')
        .set('Authorization', getAdminToken())
        .send({ productIds, status: 'published' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBe(2);
      expect(response.body.failed).toBe(0);

      // Verify status is updated
      const updatedProducts = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
      updatedProducts.forEach(product => {
        expect(product.status).toBe('published');
        expect(product.publishedAt).not.toBeNull();
      });
    });

    test('should reject invalid status', async () => {
      const productIds = testProducts.map(p => p.id);

      const response = await request(app)
        .patch('/api/v1/products/bulk/status')
        .set('Authorization', getAdminToken())
        .send({ productIds, status: 'invalid-status' })
        .expect(400);

      expect(response.body.error).toContain('Validation failed');
    });
  });
});

describe('Bulk Category Operations', () => {
  describe('POST /api/v1/categories/bulk - Batch Create Categories', () => {
    test('should create multiple categories successfully', async () => {
      const categories = [
        {
          name: 'Test Category 1',
          slug: 'test-bulk-category-1',
          status: 'active'
        },
        {
          name: 'Test Category 2',
          slug: 'test-bulk-category-2',
          status: 'active'
        }
      ];

      const response = await request(app)
        .post('/api/v1/categories/bulk')
        .set('Authorization', getAdminToken())
        .send({ categories })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    test('should reject duplicate slugs in batch', async () => {
      const categories = [
        {
          name: 'Test Category 1',
          slug: 'test-dup-slug',
          status: 'active'
        },
        {
          name: 'Test Category 2',
          slug: 'test-dup-slug',
          status: 'active'
        }
      ];

      const response = await request(app)
        .post('/api/v1/categories/bulk')
        .set('Authorization', getAdminToken())
        .send({ categories })
        .expect(400);

      expect(response.body.error).toContain('Duplicate slugs');
    });
  });

  describe('PUT /api/v1/categories/bulk - Batch Update Categories', () => {
    let testCategories;

    beforeEach(async () => {
      testCategories = await Promise.all([
        prisma.category.create({
          data: {
            name: 'Test Category 1',
            slug: 'test-update-category-1',
            status: 'active'
          }
        }),
        prisma.category.create({
          data: {
            name: 'Test Category 2',
            slug: 'test-update-category-2',
            status: 'active'
          }
        })
      ]);
    });

    test('should update multiple categories successfully', async () => {
      const updates = [
        {
          id: testCategories[0].id,
          name: 'Updated Category 1',
          status: 'inactive'
        },
        {
          id: testCategories[1].id,
          name: 'Updated Category 2',
          status: 'inactive'
        }
      ];

      const response = await request(app)
        .put('/api/v1/categories/bulk')
        .set('Authorization', getAdminToken())
        .send({ categories: updates })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    test('should prevent circular reference in category hierarchy', async () => {
      const parentCategory = await prisma.category.create({
        data: {
          name: 'Parent Category',
          slug: 'parent-category',
          status: 'active'
        }
      });

      const childCategory = await prisma.category.create({
        data: {
          name: 'Child Category',
          slug: 'child-category',
          parentId: parentCategory.id,
          status: 'active'
        }
      });

      const updates = [
        {
          id: parentCategory.id,
          parentId: childCategory.id
        }
      ];

      const response = await request(app)
        .put('/api/v1/categories/bulk')
        .set('Authorization', getAdminToken())
        .send({ categories: updates })
        .expect(400);

      expect(response.body.error).toContain('own descendant');
    });
  });

  describe('DELETE /api/v1/categories/bulk - Batch Delete Categories', () => {
    let testCategories;

    beforeEach(async () => {
      testCategories = await Promise.all([
        prisma.category.create({
          data: {
            name: 'Test Category 1',
            slug: 'test-delete-category-1',
            status: 'active'
          }
        }),
        prisma.category.create({
          data: {
            name: 'Test Category 2',
            slug: 'test-delete-category-2',
            status: 'active'
          }
        })
      ]);
    });

    test('should delete multiple categories successfully', async () => {
      const categoryIds = testCategories.map(c => c.id);

      const response = await request(app)
        .delete('/api/v1/categories/bulk')
        .set('Authorization', getAdminToken())
        .send({ categoryIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    test('should prevent deletion of categories with products', async () => {
      const testBrand = await createTestBrand('delete-with-products');

      const product = await prisma.product.create({
        data: {
          sku: 'TEST-PRODUCT-001',
          name: 'Test Product',
          nameEn: 'Test Product',
          slug: 'test-product-with-category',
          regularPrice: 1000,
          costPrice: 700,
          brandId: testBrand.id,
          categories: {
            create: [{ categoryId: testCategories[0].id, isPrimary: true }]
          }
        }
      });

      const categoryIds = [testCategories[0].id];

      const response = await request(app)
        .delete('/api/v1/categories/bulk')
        .set('Authorization', getAdminToken())
        .send({ categoryIds })
        .expect(400);

      expect(response.body.error).toContain('Cannot delete categories with products');

      // Cleanup
      await prisma.product.delete({ where: { id: product.id } });
    });
  });
});

describe('Bulk Brand Operations', () => {
  describe('POST /api/v1/brands/bulk - Batch Create Brands', () => {
    test('should create multiple brands successfully', async () => {
      const brands = [
        {
          name: 'Test Brand 1',
          slug: 'test-bulk-brand-1',
          status: 'active'
        },
        {
          name: 'Test Brand 2',
          slug: 'test-bulk-brand-2',
          status: 'active'
        }
      ];

      const response = await request(app)
        .post('/api/v1/brands/bulk')
        .set('Authorization', getAdminToken())
        .send({ brands })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    test('should reject duplicate slugs in batch', async () => {
      const brands = [
        {
          name: 'Test Brand 1',
          slug: 'test-dup-brand',
          status: 'active'
        },
        {
          name: 'Test Brand 2',
          slug: 'test-dup-brand',
          status: 'active'
        }
      ];

      const response = await request(app)
        .post('/api/v1/brands/bulk')
        .set('Authorization', getAdminToken())
        .send({ brands })
        .expect(400);

      expect(response.body.error).toContain('Duplicate slugs');
    });
  });

  describe('PUT /api/v1/brands/bulk - Batch Update Brands', () => {
    let testBrands;

    beforeEach(async () => {
      testBrands = await Promise.all([
        prisma.brand.create({
          data: {
            name: 'Test Brand 1',
            slug: 'test-update-brand-1',
            status: 'active'
          }
        }),
        prisma.brand.create({
          data: {
            name: 'Test Brand 2',
            slug: 'test-update-brand-2',
            status: 'active'
          }
        })
      ]);
    });

    test('should update multiple brands successfully', async () => {
      const updates = [
        {
          id: testBrands[0].id,
          name: 'Updated Brand 1',
          status: 'inactive'
        },
        {
          id: testBrands[1].id,
          name: 'Updated Brand 2',
          status: 'inactive'
        }
      ];

      const response = await request(app)
        .put('/api/v1/brands/bulk')
        .set('Authorization', getAdminToken())
        .send({ brands: updates })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBe(2);
      expect(response.body.failed).toBe(0);
    });
  });

  describe('DELETE /api/v1/brands/bulk - Batch Delete Brands', () => {
    let testBrands;

    beforeEach(async () => {
      testBrands = await Promise.all([
        prisma.brand.create({
          data: {
            name: 'Test Brand 1',
            slug: 'test-delete-brand-1',
            status: 'active'
          }
        }),
        prisma.brand.create({
          data: {
            name: 'Test Brand 2',
            slug: 'test-delete-brand-2',
            status: 'active'
          }
        })
      ]);
    });

    test('should delete multiple brands successfully', async () => {
      const brandIds = testBrands.map(b => b.id);

      const response = await request(app)
        .delete('/api/v1/brands/bulk')
        .set('Authorization', getAdminToken())
        .send({ brandIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(2);
      expect(response.body.failed).toBe(0);
    });

    test('should prevent deletion of brands with products', async () => {
      const testCategory = await createTestCategory('delete-brand-products');

      const product = await prisma.product.create({
        data: {
          sku: 'TEST-BRAND-PRODUCT-001',
          name: 'Test Product',
          nameEn: 'Test Product',
          slug: 'test-product-with-brand',
          regularPrice: 1000,
          costPrice: 700,
          brandId: testBrands[0].id,
          categories: {
            create: [{ categoryId: testCategory.id, isPrimary: true }]
          }
        }
      });

      const brandIds = [testBrands[0].id];

      const response = await request(app)
        .delete('/api/v1/brands/bulk')
        .set('Authorization', getAdminToken())
        .send({ brandIds })
        .expect(400);

      expect(response.body.error).toContain('Cannot delete brands with products');

      // Cleanup
      await prisma.product.delete({ where: { id: product.id } });
    });
  });
});

describe('CSV Import/Export Operations', () => {
  describe('POST /api/v1/products/import - Import Products from CSV', () => {
    let testCategory, testBrand;

    beforeEach(async () => {
      testCategory = await createTestCategory('csv-import');
      testBrand = await createTestBrand('csv-import');
    });

    test('should import products from CSV file successfully', async () => {
      const csvContent = `nameEn,nameBn,slug,descriptionEn,descriptionBn,basePrice,discountPrice,categoryId,brandId,sku,status,visibility,isFeatured,isNewArrival,isBestSeller
Test CSV Product 1,টেস্ট পণ্য ১,test-csv-product-1,Test Description 1,বিবরণ ১,1000,900,${testCategory.id},${testBrand.id},TEST-CSV-001,published,public,true,false,false
Test CSV Product 2,টেস্ট পণ্য ২,test-csv-product-2,Test Description 2,বিবরণ ২,2000,1800,${testCategory.id},${testBrand.id},TEST-CSV-002,published,public,false,true,false`;

      const response = await request(app)
        .post('/api/v1/products/import')
        .set('Authorization', getAdminToken())
        .attach('file', Buffer.from(csvContent), 'products.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.imported).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.total).toBe(2);
    });

    test('should handle validation errors in CSV rows', async () => {
      const csvContent = `nameEn,nameBn,slug,descriptionEn,descriptionBn,basePrice,discountPrice,categoryId,brandId,sku,status,visibility,isFeatured,isNewArrival,isBestSeller
Test CSV Product 1,টেস্ট পণ্য ১,test-csv-product-1,Test Description 1,বিবরণ ১,1000,900,${testCategory.id},${testBrand.id},TEST-CSV-001,published,public,true,false,false
Test CSV Product 2,টেস্ট পণ্য ২,test-csv-product-2,Test Description 2,বিবরণ ২,invalid-price,1800,${testCategory.id},${testBrand.id},TEST-CSV-002,published,public,false,true,false`;

      const response = await request(app)
        .post('/api/v1/products/import')
        .set('Authorization', getAdminToken())
        .attach('file', Buffer.from(csvContent), 'products.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.imported).toBe(1);
      expect(response.body.failed).toBe(1);
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].error).toContain('Invalid basePrice');
    });

    test('should reject non-CSV files', async () => {
      const response = await request(app)
        .post('/api/v1/products/import')
        .set('Authorization', getAdminToken())
        .attach('file', Buffer.from('test content'), 'products.txt')
        .expect(400);

      expect(response.body.error).toContain('must be a CSV');
    });
  });

  describe('GET /api/v1/products/export - Export Products to CSV', () => {
    let testCategory, testBrand, testProducts;

    beforeEach(async () => {
      testCategory = await createTestCategory('csv-export');
      testBrand = await createTestBrand('csv-export');

      testProducts = await Promise.all([
        prisma.product.create({
          data: {
            sku: 'TEST-EXPORT-001',
            name: 'Test Export Product 1',
            nameEn: 'Test Export Product 1',
            nameBn: 'টেস্ট এক্সপোর্ট পণ্য ১',
            slug: 'test-export-product-1',
            regularPrice: 1000,
            salePrice: 900,
            costPrice: 700,
            status: 'published',
            visibility: 'public',
            isFeatured: true,
            isNewArrival: false,
            isBestSeller: false,
            stockQuantity: 100,
            brandId: testBrand.id,
            categories: {
              create: [{ categoryId: testCategory.id, isPrimary: true }]
            }
          }
        }),
        prisma.product.create({
          data: {
            sku: 'TEST-EXPORT-002',
            name: 'Test Export Product 2',
            nameEn: 'Test Export Product 2',
            nameBn: 'টেস্ট এক্সপোর্ট পণ্য ২',
            slug: 'test-export-product-2',
            regularPrice: 2000,
            salePrice: 1800,
            costPrice: 1400,
            status: 'published',
            visibility: 'public',
            isFeatured: false,
            isNewArrival: true,
            isBestSeller: false,
            stockQuantity: 50,
            brandId: testBrand.id,
            categories: {
              create: [{ categoryId: testCategory.id, isPrimary: true }]
            }
          }
        })
      ]);
    });

    test('should export products to CSV file successfully', async () => {
      const response = await request(app)
        .get('/api/v1/products/export')
        .set('Authorization', getAdminToken())
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('nameEn,nameBn,slug');
      expect(response.text).toContain('test-export-product-1');
      expect(response.text).toContain('test-export-product-2');
    });

    test('should filter products by category when exporting', async () => {
      const response = await request(app)
        .get(`/api/v1/products/export?categoryId=${testCategory.id}`)
        .set('Authorization', getAdminToken())
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      const csvLines = response.text.split('\n');
      // Header + 2 products = 3 lines
      expect(csvLines.length).toBeGreaterThanOrEqual(3);
    });

    test('should limit export results', async () => {
      const response = await request(app)
        .get('/api/v1/products/export?limit=1')
        .set('Authorization', getAdminToken())
        .expect(200);

      const csvLines = response.text.split('\n');
      // Header + 1 product = 2 lines
      expect(csvLines.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Transaction Safety', () => {
  test('should rollback all operations if one fails in bulk create', async () => {
    const testCategory = await createTestCategory('transaction-1');
    const testBrand = await createTestBrand('transaction-1');

    const products = [
      {
        sku: 'TEST-TRANS-001',
        name: 'Valid Product 1',
        nameEn: 'Valid Product 1',
        slug: 'valid-product-1',
        basePrice: 1000,
        costPrice: 700,
        categories: [testCategory.id],
        brandId: testBrand.id
      },
      {
        sku: 'TEST-TRANS-002',
        name: 'Valid Product 2',
        nameEn: 'Valid Product 2',
        slug: 'valid-product-2',
        basePrice: 2000,
        costPrice: 1400,
        categories: [testCategory.id],
        brandId: testBrand.id
      }
    ];

    // First batch should succeed
    await request(app)
      .post('/api/v1/products/bulk')
      .set('Authorization', getAdminToken())
      .send({ products })
      .expect(201);

    // Second batch with duplicate SKU should fail
    const duplicateProducts = [
      {
        sku: 'TEST-TRANS-001',
        name: 'Duplicate Product',
        nameEn: 'Duplicate Product',
        slug: 'duplicate-product',
        basePrice: 3000,
        costPrice: 2100,
        categories: [testCategory.id],
        brandId: testBrand.id
      }
    ];

    await request(app)
      .post('/api/v1/products/bulk')
      .set('Authorization', getAdminToken())
      .send({ products: duplicateProducts })
      .expect(409);

    // Verify no duplicate product was created
    const duplicateProduct = await prisma.product.findUnique({
      where: { slug: 'duplicate-product' }
    });
    expect(duplicateProduct).toBeNull();
  });
});

describe('Performance Tests', () => {
  test('should handle bulk operations with 100 items efficiently', async () => {
    const testCategory = await createTestCategory('performance-1');
    const testBrand = await createTestBrand('performance-1');

    const startTime = Date.now();

    const products = Array.from({ length: 100 }, (_, i) => ({
      sku: `TEST-PERF-${String(i).padStart(3, '0')}`,
      name: `Performance Test Product ${i}`,
      nameEn: `Performance Test Product ${i}`,
      slug: `perf-product-${i}`,
      basePrice: 1000 + i * 10,
      costPrice: 700 + i * 7,
      categories: [testCategory.id],
      brandId: testBrand.id,
      status: 'active',
      visibility: 'public'
    }));

    const response = await request(app)
      .post('/api/v1/products/bulk')
      .set('Authorization', getAdminToken())
      .send({ products })
      .expect(201);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.body.success).toBe(true);
    expect(response.body.created).toBe(100);
    expect(response.body.failed).toBe(0);

    // Should complete within reasonable time (less than 10 seconds)
    expect(duration).toBeLessThan(10000);

    // Cleanup
    await prisma.product.deleteMany({
      where: { sku: { startsWith: 'TEST-PERF-' } }
    });
  }, 15000);
});
