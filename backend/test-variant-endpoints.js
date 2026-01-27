/**
 * Variant Management Endpoints Test Suite
 * 
 * This test suite verifies all variant management endpoints:
 * - ProductVariant CRUD (POST, PUT, DELETE, PATCH)
 * - VariantType CRUD (POST, PUT, DELETE)
 * - VariantValue CRUD (POST, PUT, DELETE)
 * - GET /api/v1/products/:id includes full variant data
 */

const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const productsRouter = require('./routes/products');
const authMiddleware = require('./middleware/auth');

const prisma = new PrismaClient();

// Mock auth middleware for testing
jest.mock('./middleware/auth', () => ({
  authMiddleware: {
    adminOnly: () => (req, res, next) => {
      // Mock admin user
      req.user = { id: 'test-admin-id', role: 'admin' };
      next();
    }
  }
}));

const app = express();
app.use(express.json());
app.use('/api/v1/products', productsRouter);

describe('Variant Management Endpoints', () => {
  let testProduct;
  let testVariant;
  let testVariantType;
  let testVariantValue;
  let authToken;

  beforeAll(async () => {
    // Clean up test data
    await prisma.productVariant.deleteMany({});
    await prisma.variantValue.deleteMany({});
    await prisma.variantType.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});

    // Create test brand
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand',
        slug: 'test-brand',
        status: 'active'
      }
    });

    // Create test product
    testProduct = await prisma.product.create({
      data: {
        sku: 'TEST-001',
        name: 'Test Product',
        nameEn: 'Test Product',
        slug: 'test-product',
        brandId: brand.id,
        regularPrice: 100.00,
        costPrice: 50.00,
        status: 'active',
        visibility: 'public'
      }
    });

    console.log('Test setup complete');
    console.log('Product ID:', testProduct.id);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.productVariant.deleteMany({});
    await prisma.variantValue.deleteMany({});
    await prisma.variantType.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});
    await prisma.$disconnect();
  });

  describe('ProductVariant CRUD Endpoints', () => {
    test('POST /api/v1/products/:id/variants - Create product variant', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variants`)
        .send({
          name: 'Size M',
          sku: 'TEST-001-M',
          price: 100.00,
          comparePrice: 120.00,
          stock: 50,
          isActive: true
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Product variant created successfully');
      expect(response.body.variant).toHaveProperty('id');
      expect(response.body.variant.name).toBe('Size M');
      expect(response.body.variant.sku).toBe('TEST-001-M');
      expect(parseFloat(response.body.variant.price)).toBe(100.00);
      
      testVariant = response.body.variant;
      console.log('✓ Created product variant:', testVariant.id);
    });

    test('POST /api/v1/products/:id/variants - Should fail with duplicate SKU', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variants`)
        .send({
          name: 'Size M Duplicate',
          sku: 'TEST-001-M',
          price: 100.00,
          stock: 50
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('SKU already exists');
      console.log('✓ Duplicate SKU validation works');
    });

    test('PUT /api/v1/products/:id/variants/:variantId - Update product variant', async () => {
      const response = await request(app)
        .put(`/api/v1/products/${testProduct.id}/variants/${testVariant.id}`)
        .send({
          name: 'Size L',
          price: 110.00,
          stock: 30
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Product variant updated successfully');
      expect(response.body.variant.name).toBe('Size L');
      expect(parseFloat(response.body.variant.price)).toBe(110.00);
      expect(response.body.variant.stock).toBe(30);
      
      console.log('✓ Updated product variant');
    });

    test('PATCH /api/v1/products/:id/variants/:variantId/status - Toggle variant active/inactive', async () => {
      const response = await request(app)
        .patch(`/api/v1/products/${testProduct.id}/variants/${testVariant.id}/status`)
        .send({
          isActive: false
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Variant status updated successfully');
      expect(response.body.variant.isActive).toBe(false);
      
      console.log('✓ Toggled variant status');
    });

    test('DELETE /api/v1/products/:id/variants/:variantId - Delete product variant', async () => {
      // Create a temporary variant for deletion
      const tempVariant = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variants`)
        .send({
          name: 'Size S',
          sku: 'TEST-001-S',
          price: 90.00,
          stock: 20
        });

      const response = await request(app)
        .delete(`/api/v1/products/${testProduct.id}/variants/${tempVariant.body.variant.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Product variant deleted successfully');
      
      console.log('✓ Deleted product variant');
    });
  });

  describe('VariantType CRUD Endpoints', () => {
    test('POST /api/v1/products/:id/variant-types - Create variant type', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variant-types`)
        .send({
          name: 'Size'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Variant type created successfully');
      expect(response.body.variantType).toHaveProperty('id');
      expect(response.body.variantType.name).toBe('Size');
      expect(response.body.variantType.values).toEqual([]);
      
      testVariantType = response.body.variantType;
      console.log('✓ Created variant type:', testVariantType.id);
    });

    test('POST /api/v1/products/:id/variant-types - Should fail with duplicate name', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variant-types`)
        .send({
          name: 'Size'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Variant type with this name already exists');
      console.log('✓ Duplicate variant type name validation works');
    });

    test('PUT /api/v1/products/:id/variant-types/:typeId - Update variant type', async () => {
      const response = await request(app)
        .put(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}`)
        .send({
          name: 'Color'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Variant type updated successfully');
      expect(response.body.variantType.name).toBe('Color');
      
      console.log('✓ Updated variant type');
    });

    test('DELETE /api/v1/products/:id/variant-types/:typeId - Delete variant type', async () => {
      // Create a temporary variant type for deletion
      const tempType = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variant-types`)
        .send({
          name: 'Material'
        });

      const response = await request(app)
        .delete(`/api/v1/products/${testProduct.id}/variant-types/${tempType.body.variantType.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Variant type deleted successfully');
      
      console.log('✓ Deleted variant type');
    });
  });

  describe('VariantValue CRUD Endpoints', () => {
    test('POST /api/v1/products/:id/variant-types/:typeId/values - Create variant value', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}/values`)
        .send({
          value: 'Red'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Variant value created successfully');
      expect(response.body.variantValue).toHaveProperty('id');
      expect(response.body.variantValue.value).toBe('Red');
      
      testVariantValue = response.body.variantValue;
      console.log('✓ Created variant value:', testVariantValue.id);
    });

    test('POST /api/v1/products/:id/variant-types/:typeId/values - Should fail with duplicate value', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}/values`)
        .send({
          value: 'Red'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Variant value with this name already exists');
      console.log('✓ Duplicate variant value validation works');
    });

    test('PUT /api/v1/products/:id/variant-types/:typeId/values/:valueId - Update variant value', async () => {
      const response = await request(app)
        .put(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}/values/${testVariantValue.id}`)
        .send({
          value: 'Blue'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Variant value updated successfully');
      expect(response.body.variantValue.value).toBe('Blue');
      
      console.log('✓ Updated variant value');
    });

    test('DELETE /api/v1/products/:id/variant-types/:typeId/values/:valueId - Delete variant value', async () => {
      // Create a temporary variant value for deletion
      const tempValue = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}/values`)
        .send({
          value: 'Green'
        });

      const response = await request(app)
        .delete(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}/values/${tempValue.body.variantValue.id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Variant value deleted successfully');
      
      console.log('✓ Deleted variant value');
    });
  });

  describe('GET /api/v1/products/:id - Include full variant data', () => {
    test('GET /api/v1/products/:id - Should include variants, variantTypes, and values', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${testProduct.id}`);

      expect(response.status).toBe(200);
      expect(response.body.product).toHaveProperty('id');
      expect(response.body.product).toHaveProperty('variants');
      expect(response.body.product).toHaveProperty('variantTypes');
      
      // Check that variantTypes includes values
      if (response.body.product.variantTypes.length > 0) {
        expect(response.body.product.variantTypes[0]).toHaveProperty('values');
        expect(Array.isArray(response.body.product.variantTypes[0].values)).toBe(true);
      }
      
      console.log('✓ GET /api/v1/products/:id includes full variant data');
      console.log('  - Variants:', response.body.product.variants.length);
      console.log('  - Variant Types:', response.body.product.variantTypes.length);
      response.body.product.variantTypes.forEach(type => {
        console.log(`    - ${type.name}: ${type.values.length} values`);
      });
    });
  });

  describe('GET /api/v1/products/slug/:slug - Include full variant data', () => {
    test('GET /api/v1/products/slug/:slug - Should include variants, variantTypes, and values', async () => {
      const response = await request(app)
        .get(`/api/v1/products/slug/${testProduct.slug}`);

      expect(response.status).toBe(200);
      expect(response.body.product).toHaveProperty('id');
      expect(response.body.product).toHaveProperty('variants');
      expect(response.body.product).toHaveProperty('variantTypes');
      
      // Check that variantTypes includes values
      if (response.body.product.variantTypes.length > 0) {
        expect(response.body.product.variantTypes[0]).toHaveProperty('values');
        expect(Array.isArray(response.body.product.variantTypes[0].values)).toBe(true);
      }
      
      console.log('✓ GET /api/v1/products/slug/:slug includes full variant data');
    });
  });

  describe('Error Handling', () => {
    test('POST /api/v1/products/:id/variants - Should fail with invalid product ID', async () => {
      const response = await request(app)
        .post('/api/v1/products/invalid-id/variants')
        .send({
          name: 'Test',
          sku: 'TEST',
          price: 100
        });

      expect(response.status).toBe(400);
      console.log('✓ Invalid product ID validation works');
    });

    test('POST /api/v1/products/:id/variant-types - Should fail with missing name', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variant-types`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      console.log('✓ Missing variant type name validation works');
    });

    test('POST /api/v1/products/:id/variant-types/:typeId/values - Should fail with missing value', async () => {
      const response = await request(app)
        .post(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}/values`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      console.log('✓ Missing variant value validation works');
    });
  });
});

console.log('\n========================================');
console.log('Variant Management Endpoints Test Suite');
console.log('========================================\n');
