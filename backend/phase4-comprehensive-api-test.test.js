/**
 * PHASE 4 MILESTONE 1: Product Data Model Enhancement
 * Comprehensive Backend API Testing Script
 * 
 * This script tests:
 * 1. Product Entity Enhancement Endpoints
 * 2. Category System Enhancement Endpoints
 * 3. Brand Management System Endpoints
 * 4. API Security and Validation
 * 5. Performance Metrics
 */

const http = require('http');
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  warnings: [],
  performance: []
};

// Store created resources for cleanup
const createdResources = {
  products: [],
  categories: [],
  brands: [],
  specifications: [],
  variants: [],
  images: [],
  adminToken: null
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

function logPerformance(testName, duration) {
  const result = { testName, duration, timestamp: new Date().toISOString() };
  testResults.performance.push(result);
  console.log(`⏱️  PERF: ${testName} - ${duration}ms`);
}

// HTTP request helper
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const httpLib = isHttps ? https : http;
    
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 3001),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = httpLib.request(options, (res) => {
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
    logPerformance(name, duration);

    const success = response.status === expectedStatus;
    logTest(name, success, `Status: ${response.status}, Expected: ${expectedStatus}, Duration: ${duration}ms`);

    return { success, response, duration };
  } catch (error) {
    logTest(name, false, `Error: ${error.message}`);
    return { success: false, error };
  }
}

// ============================================
// AUTHENTICATION SETUP
// ============================================

async function setupAdminAuthentication() {
  console.log('\n========================================');
  console.log('AUTHENTICATION SETUP');
  console.log('========================================\n');

  try {
    // Find or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('Creating admin user for testing...');
      adminUser = await prisma.user.create({
        data: {
          email: `admin-test-${Date.now()}@example.com`,
          passwordHash: '$2b$10$test', // Simplified for testing
          role: 'ADMIN',
          isActive: true,
          emailVerified: true
        }
      });
    }

    // Login to get token
    const loginResponse = await makeRequest('POST', `${config.apiPrefix}/auth/login`, {
      email: adminUser.email,
      password: 'admin123' // Default test password
    });

    if (loginResponse.status === 200 && loginResponse.data.token) {
      createdResources.adminToken = loginResponse.data.token;
      logTest('Admin Authentication Setup', true, 'Admin token obtained successfully');
      return true;
    } else {
      logWarning('Admin Authentication Setup', 'Could not obtain admin token, using test token');
      createdResources.adminToken = 'test-admin-token';
      return false;
    }
  } catch (error) {
    logWarning('Admin Authentication Setup', `Error: ${error.message}, using test token`);
    createdResources.adminToken = 'test-admin-token';
    return false;
  }
}

// ============================================
// PRODUCT ENDPOINTS
// ============================================

async function testProductEndpoints() {
  console.log('\n========================================');
  console.log('PRODUCT ENDPOINTS');
  console.log('========================================\n');

  const authHeaders = { 'Authorization': `Bearer ${createdResources.adminToken}` };

  // Test GET /api/v1/products
  await testEndpoint(
    'GET List Products',
    'GET',
    `${config.apiPrefix}/products`,
    null,
    200
  );

  // Test GET /api/v1/products/featured
  await testEndpoint(
    'GET Featured Products',
    'GET',
    `${config.apiPrefix}/products/featured`,
    null,
    200
  );

  // Test GET /api/v1/products/new-arrivals
  await testEndpoint(
    'GET New Arrivals',
    'GET',
    `${config.apiPrefix}/products/new-arrivals`,
    null,
    200
  );

  // Test GET /api/v1/products/best-sellers
  await testEndpoint(
    'GET Best Sellers',
    'GET',
    `${config.apiPrefix}/products/best-sellers`,
    null,
    200
  );

  // Get first product for detailed tests
  const productsResponse = await makeRequest('GET', `${config.apiPrefix}/products`);
  let testProductId = null;

  if (productsResponse.status === 200 && productsResponse.data.products.length > 0) {
    testProductId = productsResponse.data.products[0].id;
    createdResources.products.push(testProductId);

    // Test GET /api/v1/products/:id
    await testEndpoint(
      'GET Product by ID',
      'GET',
      `${config.apiPrefix}/products/${testProductId}`,
      null,
      200
    );

    // Test PATCH /api/v1/products/:id/status
    await testEndpoint(
      'PATCH Update Product Status',
      'PATCH',
      `${config.apiPrefix}/products/${testProductId}/status`,
      { status: 'published' },
      200,
      authHeaders
    );

    // Test PATCH /api/v1/products/:id/seo
    await testEndpoint(
      'PATCH Update Product SEO',
      'PATCH',
      `${config.apiPrefix}/products/${testProductId}/seo`,
      {
        metaTitle: 'Test Meta Title',
        metaDescription: 'Test Meta Description',
        metaKeywords: 'test, keywords'
      },
      200,
      authHeaders
    );

    // Test POST /api/v1/products/:id/specifications
    const specResponse = await testEndpoint(
      'POST Create Product Specification',
      'POST',
      `${config.apiPrefix}/products/${testProductId}/specifications`,
      {
        name: 'Test Specification',
        value: 'Test Value',
        sortOrder: 0
      },
      201,
      authHeaders
    );

    if (specResponse.success && specResponse.response.data) {
      const specId = specResponse.response.data.specification.id;
      createdResources.specifications.push(specId);

      // Test PUT /api/v1/products/:productId/specifications/:specId
      await testEndpoint(
        'PUT Update Product Specification',
        'PUT',
        `${config.apiPrefix}/products/${testProductId}/specifications/${specId}`,
        {
          name: 'Updated Specification',
          value: 'Updated Value'
        },
        200,
        authHeaders
      );

      // Test DELETE /api/v1/products/:productId/specifications/:specId
      await testEndpoint(
        'DELETE Product Specification',
        'DELETE',
        `${config.apiPrefix}/products/${testProductId}/specifications/${specId}`,
        null,
        200,
        authHeaders
      );
    }
  } else {
    logWarning('Product Detailed Tests', 'No products available for testing');
  }
}

// ============================================
// CATEGORY ENDPOINTS
// ============================================

async function testCategoryEndpoints() {
  console.log('\n========================================');
  console.log('CATEGORY ENDPOINTS');
  console.log('========================================\n');

  const authHeaders = { 'Authorization': `Bearer ${createdResources.adminToken}` };

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
      name: 'Test Category Phase4',
      slug: `test-category-phase4-${Date.now()}`,
      description: 'Test category description',
      status: 'active',
      displayOrder: 0,
      metaTitle: 'Test Category Meta Title',
      metaDescription: 'Test Category Meta Description',
      metaKeywords: 'test, category, phase4'
    },
    201,
    authHeaders
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
        name: 'Updated Test Category Phase4',
        status: 'inactive',
        displayOrder: 1
      },
      200,
      authHeaders
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
      authHeaders
    );

    // Test PATCH /api/v1/categories/:id/reorder
    await testEndpoint(
      'PATCH Reorder Category',
      'PATCH',
      `${config.apiPrefix}/categories/${categoryId}/reorder`,
      { displayOrder: 5 },
      200,
      authHeaders
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
      authHeaders
    );

    // Test PUT /api/v1/categories/:id/move
    await testEndpoint(
      'PUT Move Category',
      'PUT',
      `${config.apiPrefix}/categories/${categoryId}/move`,
      { parentId: null },
      200,
      authHeaders
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
      authHeaders
    );

    // Test GET /api/v1/categories/:id/products
    await testEndpoint(
      'GET Category Products',
      'GET',
      `${config.apiPrefix}/categories/${categoryId}/products`,
      null,
      200
    );
  }
}

// ============================================
// BRAND ENDPOINTS
// ============================================

async function testBrandEndpoints() {
  console.log('\n========================================');
  console.log('BRAND ENDPOINTS');
  console.log('========================================\n');

  const authHeaders = { 'Authorization': `Bearer ${createdResources.adminToken}` };

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
      name: 'Test Brand Phase4',
      slug: `test-brand-phase4-${Date.now()}`,
      description: 'Test brand description',
      status: 'active',
      isFeatured: false,
      featuredOrder: 0,
      metaTitle: 'Test Brand Meta Title',
      metaDescription: 'Test Brand Meta Description',
      metaKeywords: 'test, brand, phase4'
    },
    201,
    authHeaders
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
        name: 'Updated Test Brand Phase4',
        status: 'inactive',
        isFeatured: true,
        featuredOrder: 1
      },
      200,
      authHeaders
    );

    // Test PATCH /api/v1/brands/:id/status
    await testEndpoint(
      'PATCH Update Brand Status',
      'PATCH',
      `${config.apiPrefix}/brands/${brandId}/status`,
      { status: 'active' },
      200,
      authHeaders
    );

    // Test PATCH /api/v1/brands/:id/featured
    await testEndpoint(
      'PATCH Toggle Brand Featured',
      'PATCH',
      `${config.apiPrefix}/brands/${brandId}/featured`,
      { isFeatured: true, featuredOrder: 5 },
      200,
      authHeaders
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
      authHeaders
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
      authHeaders
    );
  }
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
    { 'Authorization': `Bearer ${createdResources.adminToken}` }
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
    { 'Authorization': `Bearer ${createdResources.adminToken}` }
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

  console.log('\n--- PERFORMANCE METRICS ---');
  if (testResults.performance.length > 0) {
    const avgDuration = testResults.performance.reduce((sum, p) => sum + p.duration, 0) / testResults.performance.length;
    const maxDuration = Math.max(...testResults.performance.map(p => p.duration));
    const minDuration = Math.min(...testResults.performance.map(p => p.duration));
    
    console.log(`Average Response Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`Max Response Time: ${maxDuration}ms`);
    console.log(`Min Response Time: ${minDuration}ms`);
    
    const slowTests = testResults.performance.filter(p => p.duration > 500);
    if (slowTests.length > 0) {
      console.log(`\nSlow Tests (>500ms): ${slowTests.length}`);
      slowTests.forEach(test => {
        console.log(`  - ${test.testName}: ${test.duration}ms`);
      });
    }
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
    warnings: testResults.warnings,
    performance: {
      average: testResults.performance.length > 0 
        ? (testResults.performance.reduce((sum, p) => sum + p.duration, 0) / testResults.performance.length).toFixed(2)
        : 0,
      max: testResults.performance.length > 0 ? Math.max(...testResults.performance.map(p => p.duration)) : 0,
      min: testResults.performance.length > 0 ? Math.min(...testResults.performance.map(p => p.duration)) : 0,
      slowTests: testResults.performance.filter(p => p.duration > 500).length
    }
  };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   PHASE 4 MILESTONE 1: COMPREHENSIVE API TESTING      ║');
  console.log('║   Product Data Model Enhancement                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Check if backend is running
    try {
      await makeRequest('GET', `${config.apiPrefix}/products`);
      console.log('✅ Backend server is accessible\n');
    } catch (error) {
      console.log('❌ Backend server is not accessible');
      console.log(`   Make sure to backend is running at ${config.baseUrl}`);
      console.log(`   Error: ${error.message}\n`);
      process.exit(1);
    }

    await setupAdminAuthentication();
    await testProductEndpoints();
    await testCategoryEndpoints();
    await testBrandEndpoints();
    await testAPISecurityAndValidation();
    const report = await generateReport();

    // Save report to file
    const fs = require('fs');
    const reportPath = './phase4-comprehensive-api-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

  } catch (error) {
    console.error('Fatal error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
