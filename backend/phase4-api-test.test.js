/**
 * PHASE 4 MILESTONE 1: Product Data Model Enhancement
 * Backend API Testing Script
 * 
 * This script tests:
 * 1. Product Entity Enhancement Endpoints
 * 2. Category System Enhancement Endpoints
 * 3. Brand Management System Endpoints
 * 4. Product Relationships Endpoints
 * 5. API Security and Validation
 */

const http = require('http');

// Test configuration
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  apiPrefix: '/api/v1',
  timeout: 10000
};

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Store created resources for cleanup
const createdResources = {
  products: [],
  categories: [],
  brands: [],
  specifications: [],
  variants: [],
  images: [],
  relationships: []
};

function logTest(testName, passed, message = '') {
  const result = { testName, message, timestamp: new Date().toISOString() };
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ PASS: ${testName}`);
    if (message) console.log(`   ${message}`);
  } else {
    testResults.failed.push(result);
    console.log(`❌ FAIL: ${testName}`);
    if (message) console.log(`   ${message}`);
  }
}

function logWarning(testName, message) {
  const result = { testName, message, timestamp: new Date().toISOString() };
  testResults.warnings.push(result);
  console.log(`⚠️  WARN: ${testName}`);
  console.log(`   ${message}`);
}

// HTTP request helper
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test helper
async function testEndpoint(name, method, path, data = null, expectedStatus = 200, headers = {}) {
  try {
    const startTime = Date.now();
    const response = await makeRequest(method, path, data, headers);
    const duration = Date.now() - startTime;

    const success = response.status === expectedStatus;
    logTest(name, success, `Status: ${response.status}, Expected: ${expectedStatus}, Duration: ${duration}ms`);

    return { success, response, duration };
  } catch (error) {
    logTest(name, false, `Error: ${error.message}`);
    return { success: false, error };
  }
}

// ============================================
// PRODUCT ENTITY ENHANCEMENT ENDPOINTS
// ============================================

async function testProductSpecificationsEndpoints() {
  console.log('\n========================================');
  console.log('PRODUCT SPECIFICATIONS ENDPOINTS');
  console.log('========================================\n');

  // Need a product to test specifications
  let productId = null;

  // First create a test product
  try {
    const categoryResponse = await makeRequest('POST', `${config.apiPrefix}/categories`, {
      name: 'Test Category for Specs',
      slug: `test-cat-specs-${Date.now()}`,
      status: 'active'
    }, { 'Authorization': 'Bearer test-admin-token' });

    if (categoryResponse.status === 201) {
      createdResources.categories.push(categoryResponse.data.category.id);

      const brandResponse = await makeRequest('POST', `${config.apiPrefix}/brands`, {
        name: 'Test Brand for Specs',
        slug: `test-brand-specs-${Date.now()}`,
        status: 'active'
      }, { 'Authorization': 'Bearer test-admin-token' });

      if (brandResponse.status === 201) {
        createdResources.brands.push(brandResponse.data.brand.id);

        const productResponse = await makeRequest('POST', `${config.apiPrefix}/products`, {
          sku: `TEST-SKU-SPECS-${Date.now()}`,
          name: 'Test Product for Specs',
          nameEn: 'Test Product for Specs',
          slug: `test-product-specs-${Date.now()}`,
          categoryId: categoryResponse.data.category.id,
          brandId: brandResponse.data.brand.id,
          regularPrice: 99.99,
          costPrice: 50.00,
          stockQuantity: 10,
          status: 'published',
          visibility: 'public'
        }, { 'Authorization': 'Bearer test-admin-token' });

        if (productResponse.status === 201) {
          productId = productResponse.data.product.id;
          createdResources.products.push(productId);
        }
      }
    }
  } catch (error) {
    logWarning('Product Specifications Setup', `Failed to create test product: ${error.message}`);
  }

  if (!productId) {
    logWarning('Product Specifications Endpoints', 'Skipping tests - could not create test product');
    return;
  }

  // Test POST /api/v1/products/:id/specifications
  await testEndpoint(
    'POST Create Product Specification',
    'POST',
    `${config.apiPrefix}/products/${productId}/specifications`,
    {
      name: 'Test Specification',
      value: 'Test Value',
      sortOrder: 0
    },
    201,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test PUT /api/v1/products/:id/specifications/:specId
  const specResponse = await makeRequest('GET', `${config.apiPrefix}/products/${productId}`);
  if (specResponse.status === 200 && specResponse.data.product.specifications.length > 0) {
    const specId = specResponse.data.product.specifications[0].id;
    createdResources.specifications.push(specId);

    await testEndpoint(
      'PUT Update Product Specification',
      'PUT',
      `${config.apiPrefix}/products/${productId}/specifications/${specId}`,
      {
        name: 'Updated Specification',
        value: 'Updated Value',
        sortOrder: 1
      },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test DELETE /api/v1/products/:id/specifications/:specId
    await testEndpoint(
      'DELETE Product Specification',
      'DELETE',
      `${config.apiPrefix}/products/${productId}/specifications/${specId}`,
      null,
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );
  }
}

async function testProductVariantsEndpoints() {
  console.log('\n========================================');
  console.log('PRODUCT VARIANTS ENDPOINTS');
  console.log('========================================\n');

  // Use first available product
  const productResponse = await makeRequest('GET', `${config.apiPrefix}/products`);
  let productId = null;

  if (productResponse.status === 200 && productResponse.data.products.length > 0) {
    productId = productResponse.data.products[0].id;
  } else {
    logWarning('Product Variants Endpoints', 'No products available for testing');
    return;
  }

  // Test POST /api/v1/products/:id/variants
  await testEndpoint(
    'POST Create Product Variant',
    'POST',
    `${config.apiPrefix}/products/${productId}/variants`,
    {
      name: 'Test Variant',
      sku: `TEST-VARIANT-${Date.now()}`,
      price: 89.99,
      comparePrice: 99.99,
      stock: 50,
      isActive: true
    },
    201,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test PUT /api/v1/products/:id/variants/:variantId
  const updatedProductResponse = await makeRequest('GET', `${config.apiPrefix}/products/${productId}`);
  if (updatedProductResponse.status === 200 && updatedProductResponse.data.product.variants.length > 0) {
    const variantId = updatedProductResponse.data.product.variants[0].id;
    createdResources.variants.push(variantId);

    await testEndpoint(
      'PUT Update Product Variant',
      'PUT',
      `${config.apiPrefix}/products/${productId}/variants/${variantId}`,
      {
        name: 'Updated Variant',
        price: 79.99,
        stock: 30
      },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test DELETE /api/v1/products/:id/variants/:variantId
    await testEndpoint(
      'DELETE Product Variant',
      'DELETE',
      `${config.apiPrefix}/products/${productId}/variants/${variantId}`,
      null,
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );
  }
}

async function testProductImagesEndpoints() {
  console.log('\n========================================');
  console.log('PRODUCT IMAGES ENDPOINTS');
  console.log('========================================\n');

  // Use first available product
  const productResponse = await makeRequest('GET', `${config.apiPrefix}/products`);
  let productId = null;

  if (productResponse.status === 200 && productResponse.data.products.length > 0) {
    productId = productResponse.data.products[0].id;
  } else {
    logWarning('Product Images Endpoints', 'No products available for testing');
    return;
  }

  // Test POST /api/v1/products/:id/images
  // Note: This would require multipart/form-data, which is complex to test with plain HTTP
  logWarning('POST Create Product Image', 'Skipping - requires file upload (multipart/form-data)');

  // Test PUT /api/v1/products/:id/images/:imageId
  logWarning('PUT Update Product Image', 'Skipping - requires file upload (multipart/form-data)');

  // Test DELETE /api/v1/products/:id/images/:imageId
  logWarning('DELETE Product Image', 'Skipping - requires existing image');
}

async function testProductStatusAndVisibilityEndpoints() {
  console.log('\n========================================');
  console.log('PRODUCT STATUS & VISIBILITY ENDPOINTS');
  console.log('========================================\n');

  // Use first available product
  const productResponse = await makeRequest('GET', `${config.apiPrefix}/products`);
  let productId = null;

  if (productResponse.status === 200 && productResponse.data.products.length > 0) {
    productId = productResponse.data.products[0].id;
  } else {
    logWarning('Product Status & Visibility Endpoints', 'No products available for testing');
    return;
  }

  // Test PATCH /api/v1/products/:id/status
  await testEndpoint(
    'PATCH Update Product Status',
    'PATCH',
    `${config.apiPrefix}/products/${productId}/status`,
    { status: 'draft' },
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test PATCH /api/v1/products/:id/visibility
  await testEndpoint(
    'PATCH Update Product Visibility',
    'PATCH',
    `${config.apiPrefix}/products/${productId}/visibility`,
    { visibility: 'private' },
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );
}

async function testProductSEOEndpoints() {
  console.log('\n========================================');
  console.log('PRODUCT SEO ENDPOINTS');
  console.log('========================================\n');

  // Use first available product
  const productResponse = await makeRequest('GET', `${config.apiPrefix}/products`);
  let productId = null;

  if (productResponse.status === 200 && productResponse.data.products.length > 0) {
    productId = productResponse.data.products[0].id;
  } else {
    logWarning('Product SEO Endpoints', 'No products available for testing');
    return;
  }

  // Test PATCH /api/v1/products/:id/seo
  await testEndpoint(
    'PATCH Update Product SEO',
    'PATCH',
    `${config.apiPrefix}/products/${productId}/seo`,
    {
      metaTitle: 'Updated Meta Title',
      metaDescription: 'Updated Meta Description',
      metaKeywords: 'updated, keywords'
    },
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );
}

// ============================================
// CATEGORY SYSTEM ENHANCEMENT ENDPOINTS
// ============================================

async function testCategoryEndpoints() {
  console.log('\n========================================');
  console.log('CATEGORY ENDPOINTS');
  console.log('========================================\n');

  // Test GET /api/v1/categories
  await testEndpoint(
    'GET List Categories',
    'GET',
    `${config.apiPrefix}/categories`,
    null,
    200
  );

  // Test GET /api/v1/categories/tree
  await testEndpoint(
    'GET Category Tree',
    'GET',
    `${config.apiPrefix}/categories/tree`,
    null,
    200
  );

  // Test POST /api/v1/categories
  const createCategoryResponse = await testEndpoint(
    'POST Create Category',
    'POST',
    `${config.apiPrefix}/categories`,
    {
      name: 'Test Category API',
      slug: `test-category-api-${Date.now()}`,
      description: 'Test category description',
      status: 'active',
      displayOrder: 0,
      metaTitle: 'Test Category Meta Title',
      metaDescription: 'Test Category Meta Description',
      metaKeywords: 'test, category, api'
    },
    201,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  let categoryId = null;
  if (createCategoryResponse.success && createCategoryResponse.response.data) {
    categoryId = createCategoryResponse.response.data.category.id;
    createdResources.categories.push(categoryId);

    // Test GET /api/v1/categories/:id
    await testEndpoint(
      'GET Category by ID',
      'GET',
      `${config.apiPrefix}/categories/${categoryId}`,
      null,
      200
    );

    // Test PUT /api/v1/categories/:id
    await testEndpoint(
      'PUT Update Category',
      'PUT',
      `${config.apiPrefix}/categories/${categoryId}`,
      {
        name: 'Updated Test Category API',
        status: 'inactive',
        displayOrder: 1
      },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test PATCH /api/v1/categories/:id/seo
    await testEndpoint(
      'PATCH Update Category SEO',
      'PATCH',
      `${config.apiPrefix}/categories/${categoryId}/seo`,
      {
        metaTitle: 'Updated Category Meta Title',
        metaDescription: 'Updated Category Meta Description',
        metaKeywords: 'updated, category, keywords'
      },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test PATCH /api/v1/categories/:id/reorder
    await testEndpoint(
      'PATCH Reorder Category',
      'PATCH',
      `${config.apiPrefix}/categories/${categoryId}/reorder`,
      { displayOrder: 5 },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test POST /api/v1/categories/:id/subcategories
    await testEndpoint(
      'POST Create Subcategory',
      'POST',
      `${config.apiPrefix}/categories/${categoryId}/subcategories`,
      {
        name: 'Test Subcategory',
        slug: `test-subcategory-${Date.now()}`,
        status: 'active',
        displayOrder: 0
      },
      201,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test PUT /api/v1/categories/:id/move
    await testEndpoint(
      'PUT Move Category',
      'PUT',
      `${config.apiPrefix}/categories/${categoryId}/move`,
      { parentId: null },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test PATCH /api/v1/categories/reorder-batch
    await testEndpoint(
      'PATCH Batch Reorder Categories',
      'PATCH',
      `${config.apiPrefix}/categories/reorder-batch`,
      {
        orders: [
          { id: categoryId, displayOrder: 10 }
        ]
      },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test GET /api/v1/categories/:id/products
    await testEndpoint(
      'GET Category Products',
      'GET',
      `${config.apiPrefix}/categories/${categoryId}/products`,
      null,
      200
    );

    // Test DELETE /api/v1/categories/:id
    await testEndpoint(
      'DELETE Category',
      'DELETE',
      `${config.apiPrefix}/categories/${categoryId}`,
      null,
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );
  }
}

// ============================================
// BRAND MANAGEMENT SYSTEM ENDPOINTS
// ============================================

async function testBrandEndpoints() {
  console.log('\n========================================');
  console.log('BRAND ENDPOINTS');
  console.log('========================================\n');

  // Test GET /api/v1/brands
  await testEndpoint(
    'GET List Brands',
    'GET',
    `${config.apiPrefix}/brands`,
    null,
    200
  );

  // Test GET /api/v1/brands/featured
  await testEndpoint(
    'GET Featured Brands',
    'GET',
    `${config.apiPrefix}/brands/featured`,
    null,
    200
  );

  // Test POST /api/v1/brands
  const createBrandResponse = await testEndpoint(
    'POST Create Brand',
    'POST',
    `${config.apiPrefix}/brands`,
    {
      name: 'Test Brand API',
      slug: `test-brand-api-${Date.now()}`,
      description: 'Test brand description',
      status: 'active',
      isFeatured: false,
      featuredOrder: 0,
      metaTitle: 'Test Brand Meta Title',
      metaDescription: 'Test Brand Meta Description',
      metaKeywords: 'test, brand, api'
    },
    201,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  let brandId = null;
  if (createBrandResponse.success && createBrandResponse.response.data) {
    brandId = createBrandResponse.response.data.brand.id;
    createdResources.brands.push(brandId);

    // Test GET /api/v1/brands/:id
    await testEndpoint(
      'GET Brand by ID',
      'GET',
      `${config.apiPrefix}/brands/${brandId}`,
      null,
      200
    );

    // Test PUT /api/v1/brands/:id
    await testEndpoint(
      'PUT Update Brand',
      'PUT',
      `${config.apiPrefix}/brands/${brandId}`,
      {
        name: 'Updated Test Brand API',
        status: 'inactive',
        isFeatured: true,
        featuredOrder: 1
      },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test PATCH /api/v1/brands/:id/status
    await testEndpoint(
      'PATCH Update Brand Status',
      'PATCH',
      `${config.apiPrefix}/brands/${brandId}/status`,
      { status: 'active' },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test PATCH /api/v1/brands/:id/featured
    await testEndpoint(
      'PATCH Toggle Brand Featured',
      'PATCH',
      `${config.apiPrefix}/brands/${brandId}/featured`,
      { isFeatured: true, featuredOrder: 5 },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test PATCH /api/v1/brands/featured-reorder
    await testEndpoint(
      'PATCH Reorder Featured Brands',
      'PATCH',
      `${config.apiPrefix}/brands/featured-reorder`,
      {
        orders: [
          { id: brandId, featuredOrder: 10 }
        ]
      },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test GET /api/v1/brands/:id/products
    await testEndpoint(
      'GET Brand Products',
      'GET',
      `${config.apiPrefix}/brands/${brandId}/products`,
      null,
      200
    );

    // Test PATCH /api/v1/brands/:id/seo
    await testEndpoint(
      'PATCH Update Brand SEO',
      'PATCH',
      `${config.apiPrefix}/brands/${brandId}/seo`,
      {
        metaTitle: 'Updated Brand Meta Title',
        metaDescription: 'Updated Brand Meta Description',
        metaKeywords: 'updated, brand, keywords'
      },
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );

    // Test DELETE /api/v1/brands/:id
    await testEndpoint(
      'DELETE Brand',
      'DELETE',
      `${config.apiPrefix}/brands/${brandId}`,
      null,
      200,
      { 'Authorization': 'Bearer test-admin-token' }
    );
  }
}

// ============================================
// PRODUCT RELATIONSHIPS ENDPOINTS
// ============================================

async function testProductRelationshipsEndpoints() {
  console.log('\n========================================');
  console.log('PRODUCT RELATIONSHIPS ENDPOINTS');
  console.log('========================================\n');

  // Get two products for relationship testing
  const productsResponse = await makeRequest('GET', `${config.apiPrefix}/products`);
  
  if (productsResponse.status !== 200 || productsResponse.data.products.length < 2) {
    logWarning('Product Relationships Endpoints', 'Need at least 2 products for testing');
    return;
  }

  const productId1 = productsResponse.data.products[0].id;
  const productId2 = productsResponse.data.products[1].id;

  // Test POST /api/v1/products/:id/categories
  await testEndpoint(
    'POST Assign Categories to Product',
    'POST',
    `${config.apiPrefix}/products/${productId1}/categories`,
    {
      categoryIds: [productsResponse.data.products[0].categoryId],
      primaryCategoryId: productsResponse.data.products[0].categoryId
    },
    201,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test PATCH /api/v1/products/:id/categories/:categoryId/primary
  await testEndpoint(
    'PATCH Set Primary Category',
    'PATCH',
    `${config.apiPrefix}/products/${productId1}/categories/${productsResponse.data.products[0].categoryId}/primary`,
    null,
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test PATCH /api/v1/products/:id/brand
  await testEndpoint(
    'PATCH Assign Brand to Product',
    'PATCH',
    `${config.apiPrefix}/products/${productId1}/brand`,
    { brandId: productsResponse.data.products[0].brandId },
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test POST /api/v1/products/:id/cross-sell
  await testEndpoint(
    'POST Add Cross-sell Product',
    'POST',
    `${config.apiPrefix}/products/${productId1}/cross-sell`,
    {
      relatedProductId: productId2,
      displayOrder: 0
    },
    201,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test PATCH /api/v1/products/:id/cross-sell/reorder
  await testEndpoint(
    'PATCH Reorder Cross-sell Products',
    'PATCH',
    `${config.apiPrefix}/products/${productId1}/cross-sell/reorder`,
    {
      orders: [
        { relatedProductId: productId2, displayOrder: 1 }
      ]
    },
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test DELETE /api/v1/products/:id/cross-sell/:relatedId
  await testEndpoint(
    'DELETE Remove Cross-sell Product',
    'DELETE',
    `${config.apiPrefix}/products/${productId1}/cross-sell/${productId2}`,
    null,
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test POST /api/v1/products/:id/up-sell
  await testEndpoint(
    'POST Add Up-sell Product',
    'POST',
    `${config.apiPrefix}/products/${productId1}/up-sell`,
    {
      relatedProductId: productId2,
      displayOrder: 0
    },
    201,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test PATCH /api/v1/products/:id/up-sell/reorder
  await testEndpoint(
    'PATCH Reorder Up-sell Products',
    'PATCH',
    `${config.apiPrefix}/products/${productId1}/up-sell/reorder`,
    {
      orders: [
        { relatedProductId: productId2, displayOrder: 1 }
      ]
    },
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test DELETE /api/v1/products/:id/up-sell/:relatedId
  await testEndpoint(
    'DELETE Remove Up-sell Product',
    'DELETE',
    `${config.apiPrefix}/products/${productId1}/up-sell/${productId2}`,
    null,
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test POST /api/v1/products/:id/related
  await testEndpoint(
    'POST Add Related Product',
    'POST',
    `${config.apiPrefix}/products/${productId1}/related`,
    {
      relatedProductId: productId2,
      displayOrder: 0
    },
    201,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test PATCH /api/v1/products/:id/related/reorder
  await testEndpoint(
    'PATCH Reorder Related Products',
    'PATCH',
    `${config.apiPrefix}/products/${productId1}/related/reorder`,
    {
      orders: [
        { relatedProductId: productId2, displayOrder: 1 }
      ]
    },
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test DELETE /api/v1/products/:id/related/:relatedId
  await testEndpoint(
    'DELETE Remove Related Product',
    'DELETE',
    `${config.apiPrefix}/products/${productId1}/related/${productId2}`,
    null,
    200,
    { 'Authorization': 'Bearer test-admin-token' }
  );
}

// ============================================
// API SECURITY AND VALIDATION
// ============================================

async function testAPISecurityAndValidation() {
  console.log('\n========================================');
  console.log('API SECURITY AND VALIDATION');
  console.log('========================================\n');

  // Test unauthorized access to admin endpoints
  await testEndpoint(
    'Security: POST Create Category without auth',
    'POST',
    `${config.apiPrefix}/categories`,
    {
      name: 'Unauthorized Category',
      slug: 'unauthorized-category',
      status: 'active'
    },
    401,
    {}
  );

  await testEndpoint(
    'Security: POST Create Brand without auth',
    'POST',
    `${config.apiPrefix}/brands`,
    {
      name: 'Unauthorized Brand',
      slug: 'unauthorized-brand',
      status: 'active'
    },
    401,
    {}
  );

  // Test validation errors
  await testEndpoint(
    'Validation: POST Category with missing required fields',
    'POST',
    `${config.apiPrefix}/categories`,
    {
      // Missing 'name' and 'slug'
      description: 'Test description'
    },
    400,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  await testEndpoint(
    'Validation: POST Brand with missing required fields',
    'POST',
    `${config.apiPrefix}/brands`,
    {
      // Missing 'name' and 'slug'
      description: 'Test description'
    },
    400,
    { 'Authorization': 'Bearer test-admin-token' }
  );

  // Test invalid UUID
  await testEndpoint(
    'Validation: GET Product with invalid UUID',
    'GET',
    `${config.apiPrefix}/products/invalid-uuid`,
    null,
    400
  );

  await testEndpoint(
    'Validation: GET Category with invalid UUID',
    'GET',
    `${config.apiPrefix}/categories/invalid-uuid`,
    null,
    400
  );

  await testEndpoint(
    'Validation: GET Brand with invalid UUID',
    'GET',
    `${config.apiPrefix}/brands/invalid-uuid`,
    null,
    400
  );

  // Test non-existent resources
  await testEndpoint(
    'GET Non-existent Product',
    'GET',
    `${config.apiPrefix}/products/00000000-0000-0000-0000-000000000000`,
    null,
    404
  );

  await testEndpoint(
    'GET Non-existent Category',
    'GET',
    `${config.apiPrefix}/categories/00000000-0000-0000-0000-000000000000`,
    null,
    404
  );

  await testEndpoint(
    'GET Non-existent Brand',
    'GET',
    `${config.apiPrefix}/brands/00000000-0000-0000-0000-000000000000`,
    null,
    404
  );
}

async function generateReport() {
  console.log('\n========================================');
  console.log('TEST SUMMARY REPORT');
  console.log('========================================\n');

  console.log(`Total Tests Run: ${testResults.passed.length + testResults.failed.length}`);
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);

  if (testResults.failed.length > 0) {
    console.log('\n--- FAILED TESTS ---');
    testResults.failed.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
      if (test.message) console.log(`   ${test.message}`);
    });
  }

  if (testResults.warnings.length > 0) {
    console.log('\n--- WARNINGS ---');
    testResults.warnings.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
      if (test.message) console.log(`   ${test.message}`);
    });
  }

  const passRate = testResults.passed.length + testResults.failed.length > 0
    ? ((testResults.passed.length / (testResults.passed.length + testResults.failed.length)) * 100).toFixed(2)
    : 0;
  console.log(`\nPass Rate: ${passRate}%`);

  return {
    total: testResults.passed.length + testResults.failed.length,
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    warnings: testResults.warnings.length,
    passRate: parseFloat(passRate),
    failedTests: testResults.failed,
    warnings: testResults.warnings
  };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   PHASE 4 MILESTONE 1: BACKEND API TESTING             ║');
  console.log('║   Product Data Model Enhancement                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Check if backend is running
    try {
      await makeRequest('GET', `${config.apiPrefix}/products`);
      console.log('✅ Backend server is accessible\n');
    } catch (error) {
      console.log('❌ Backend server is not accessible');
      console.log(`   Make sure the backend is running at ${config.baseUrl}`);
      console.log(`   Error: ${error.message}\n`);
      process.exit(1);
    }

    await testProductSpecificationsEndpoints();
    await testProductVariantsEndpoints();
    await testProductImagesEndpoints();
    await testProductStatusAndVisibilityEndpoints();
    await testProductSEOEndpoints();
    await testCategoryEndpoints();
    await testBrandEndpoints();
    await testProductRelationshipsEndpoints();
    await testAPISecurityAndValidation();
    const report = await generateReport();

    // Save report to file
    const fs = require('fs');
    const reportPath = './phase4-api-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

  } catch (error) {
    console.error('Fatal error during testing:', error);
  }
}

main();
