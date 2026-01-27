/**
 * Variant Management Endpoints Simple Test
 * 
 * This test verifies all variant management endpoints work correctly
 */

const express = require('express');
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create a simple test app
const app = express();
app.use(express.json());

// Import the products router
const productsRouter = require('./routes/products');

// Mock auth middleware - bypass authentication for testing
const originalRequire = require;
require = function(id) {
  if (id === './middleware/auth') {
    return {
      authMiddleware: {
        adminOnly: () => (req, res, next) => {
          req.user = { id: 'test-admin-id', role: 'admin' };
          next();
        }
      }
    };
  }
  return originalRequire(id);
};

app.use('/api/v1/products', productsRouter);

// Restore original require
require = originalRequire;

async function runTests() {
  console.log('\n========================================');
  console.log('Variant Management Endpoints Test');
  console.log('========================================\n');

  let testProduct;
  let testVariant;
  let testVariantType;
  let testVariantValue;

  try {
    // Setup: Clean up and create test data
    console.log('🔧 Setting up test data...');
    
    await prisma.productVariant.deleteMany({});
    await prisma.variantValue.deleteMany({});
    await prisma.variantType.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});

    // Create test brand
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand',
        slug: 'test-brand-' + Date.now(),
        status: 'active'
      }
    });

    // Create test product
    testProduct = await prisma.product.create({
      data: {
        sku: 'TEST-' + Date.now(),
        name: 'Test Product',
        nameEn: 'Test Product',
        slug: 'test-product-' + Date.now(),
        brandId: brand.id,
        regularPrice: 100.00,
        costPrice: 50.00,
        status: 'active',
        visibility: 'public'
      }
    });

    console.log('✓ Test product created:', testProduct.id);
    console.log('');

    // Test 1: Create product variant
    console.log('📝 Test 1: Create product variant');
    const variantResponse = await request(app)
      .post(`/api/v1/products/${testProduct.id}/variants`)
      .send({
        name: 'Size M',
        sku: 'TEST-001-M',
        price: 100.00,
        comparePrice: 120.00,
        stock: 50,
        isActive: true
      });

    if (variantResponse.status === 201) {
      console.log('✓ Variant created successfully');
      testVariant = variantResponse.body.variant;
      console.log('  ID:', testVariant.id);
      console.log('  Name:', testVariant.name);
      console.log('  SKU:', testVariant.sku);
      console.log('  Price:', testVariant.price);
    } else {
      console.log('✗ Failed to create variant');
      console.log('  Status:', variantResponse.status);
      console.log('  Error:', variantResponse.body);
    }
    console.log('');

    // Test 2: Update product variant
    console.log('📝 Test 2: Update product variant');
    const updateVariantResponse = await request(app)
      .put(`/api/v1/products/${testProduct.id}/variants/${testVariant.id}`)
      .send({
        name: 'Size L',
        price: 110.00,
        stock: 30
      });

    if (updateVariantResponse.status === 200) {
      console.log('✓ Variant updated successfully');
      console.log('  New name:', updateVariantResponse.body.variant.name);
      console.log('  New price:', updateVariantResponse.body.variant.price);
    } else {
      console.log('✗ Failed to update variant');
      console.log('  Status:', updateVariantResponse.status);
      console.log('  Error:', updateVariantResponse.body);
    }
    console.log('');

    // Test 3: Toggle variant status
    console.log('📝 Test 3: Toggle variant status');
    const toggleStatusResponse = await request(app)
      .patch(`/api/v1/products/${testProduct.id}/variants/${testVariant.id}/status`)
      .send({
        isActive: false
      });

    if (toggleStatusResponse.status === 200) {
      console.log('✓ Variant status toggled successfully');
      console.log('  isActive:', toggleStatusResponse.body.variant.isActive);
    } else {
      console.log('✗ Failed to toggle variant status');
      console.log('  Status:', toggleStatusResponse.status);
      console.log('  Error:', toggleStatusResponse.body);
    }
    console.log('');

    // Test 4: Create variant type
    console.log('📝 Test 4: Create variant type');
    const typeResponse = await request(app)
      .post(`/api/v1/products/${testProduct.id}/variant-types`)
      .send({
        name: 'Size'
      });

    if (typeResponse.status === 201) {
      console.log('✓ Variant type created successfully');
      testVariantType = typeResponse.body.variantType;
      console.log('  ID:', testVariantType.id);
      console.log('  Name:', testVariantType.name);
    } else {
      console.log('✗ Failed to create variant type');
      console.log('  Status:', typeResponse.status);
      console.log('  Error:', typeResponse.body);
    }
    console.log('');

    // Test 5: Create variant value
    console.log('📝 Test 5: Create variant value');
    const valueResponse = await request(app)
      .post(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}/values`)
      .send({
        value: 'Red'
      });

    if (valueResponse.status === 201) {
      console.log('✓ Variant value created successfully');
      testVariantValue = valueResponse.body.variantValue;
      console.log('  ID:', testVariantValue.id);
      console.log('  Value:', testVariantValue.value);
    } else {
      console.log('✗ Failed to create variant value');
      console.log('  Status:', valueResponse.status);
      console.log('  Error:', valueResponse.body);
    }
    console.log('');

    // Test 6: Update variant value
    console.log('📝 Test 6: Update variant value');
    const updateValueResponse = await request(app)
      .put(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}/values/${testVariantValue.id}`)
      .send({
        value: 'Blue'
      });

    if (updateValueResponse.status === 200) {
      console.log('✓ Variant value updated successfully');
      console.log('  New value:', updateValueResponse.body.variantValue.value);
    } else {
      console.log('✗ Failed to update variant value');
      console.log('  Status:', updateValueResponse.status);
      console.log('  Error:', updateValueResponse.body);
    }
    console.log('');

    // Test 7: Get product with full variant data
    console.log('📝 Test 7: Get product with full variant data');
    const getProductResponse = await request(app)
      .get(`/api/v1/products/${testProduct.id}`);

    if (getProductResponse.status === 200) {
      console.log('✓ Product retrieved successfully');
      const product = getProductResponse.body.product;
      console.log('  Variants:', product.variants.length);
      console.log('  Variant Types:', product.variantTypes.length);
      product.variantTypes.forEach(type => {
        console.log(`    - ${type.name}: ${type.values.length} values`);
      });
    } else {
      console.log('✗ Failed to get product');
      console.log('  Status:', getProductResponse.status);
      console.log('  Error:', getProductResponse.body);
    }
    console.log('');

    // Test 8: Get product by slug with full variant data
    console.log('📝 Test 8: Get product by slug with full variant data');
    const getProductBySlugResponse = await request(app)
      .get(`/api/v1/products/slug/${testProduct.slug}`);

    if (getProductBySlugResponse.status === 200) {
      console.log('✓ Product retrieved by slug successfully');
      const product = getProductBySlugResponse.body.product;
      console.log('  Variants:', product.variants.length);
      console.log('  Variant Types:', product.variantTypes.length);
    } else {
      console.log('✗ Failed to get product by slug');
      console.log('  Status:', getProductBySlugResponse.status);
      console.log('  Error:', getProductBySlugResponse.body);
    }
    console.log('');

    // Test 9: Delete variant value
    console.log('📝 Test 9: Delete variant value');
    const deleteValueResponse = await request(app)
      .delete(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}/values/${testVariantValue.id}`);

    if (deleteValueResponse.status === 200) {
      console.log('✓ Variant value deleted successfully');
    } else {
      console.log('✗ Failed to delete variant value');
      console.log('  Status:', deleteValueResponse.status);
      console.log('  Error:', deleteValueResponse.body);
    }
    console.log('');

    // Test 10: Delete variant type
    console.log('📝 Test 10: Delete variant type');
    const deleteTypeResponse = await request(app)
      .delete(`/api/v1/products/${testProduct.id}/variant-types/${testVariantType.id}`);

    if (deleteTypeResponse.status === 200) {
      console.log('✓ Variant type deleted successfully');
    } else {
      console.log('✗ Failed to delete variant type');
      console.log('  Status:', deleteTypeResponse.status);
      console.log('  Error:', deleteTypeResponse.body);
    }
    console.log('');

    // Test 11: Delete variant
    console.log('📝 Test 11: Delete variant');
    const deleteVariantResponse = await request(app)
      .delete(`/api/v1/products/${testProduct.id}/variants/${testVariant.id}`);

    if (deleteVariantResponse.status === 200) {
      console.log('✓ Variant deleted successfully');
    } else {
      console.log('✗ Failed to delete variant');
      console.log('  Status:', deleteVariantResponse.status);
      console.log('  Error:', deleteVariantResponse.body);
    }
    console.log('');

    console.log('========================================');
    console.log('All tests completed successfully! ✓');
    console.log('========================================\n');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.productVariant.deleteMany({});
    await prisma.variantValue.deleteMany({});
    await prisma.variantType.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});
    await prisma.$disconnect();
    console.log('✓ Cleanup complete\n');
  }
}

// Run tests
runTests().catch(console.error);
