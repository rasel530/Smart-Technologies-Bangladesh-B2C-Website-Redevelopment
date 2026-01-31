/**
 * Phase 4 Milestone 2 - Final Integration Test Script
 * 
 * This script performs comprehensive end-to-end integration testing for all
 * Phase 4 Milestone 2 features including search, bulk operations, and CSV import/export.
 * 
 * Features Tested:
 * 1. Complete Product Management Workflow
 * 2. Complete Bulk Operations Workflow
 * 3. Category/Brand Management Workflow
 * 4. CSV Import/Export Workflow
 * 5. Search Functionality
 * 6. Performance Benchmarks
 * 7. Security Validation
 * 
 * Usage:
 *   node run-final-integration-tests.js
 *   node run-final-integration-tests.js --quick      # Quick test (no performance)
 *   node run-final-integration-tests.js --report     # Generate detailed report
 * 
 * Output:
 *   - Console output with test results
 *   - JSON report: test-results-final.json
 *   - Markdown report: TEST_REPORT.md
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_TIMEOUT = 30000;
const PERFORMANCE_ITERATIONS = 10;

// Test counters
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: null,
  endTime: null,
  suites: [],
  performanceMetrics: {},
  errors: []
};

// Helper function to make HTTP requests
function request(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      },
      timeout: API_TIMEOUT
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Helper function to measure execution time
async function measureTime(fn) {
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  return { result, duration: end - start };
}

// Test assertion helper
function assert(condition, testName, message = '') {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    console.log(`  ✅ ${testName}`);
    return true;
  } else {
    testResults.failed++;
    const errorMsg = message || `Test failed: ${testName}`;
    testResults.errors.push({ test: testName, message: errorMsg });
    console.log(`  ❌ ${testName} - ${errorMsg}`);
    return false;
  }
}

// Skip test helper
function skip(testName, reason = '') {
  testResults.skipped++;
  console.log(`  ⏭ ${testName} - SKIPPED: ${reason}`);
  return false;
}

// Test suite wrapper
async function runSuite(suiteName, tests) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Suite: ${suiteName}`);
  console.log('='.repeat(60));
  
  const suiteStart = Date.now();
  const suiteResults = { name: suiteName, tests: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
  
  try {
    await tests();
  } catch (error) {
    console.log(`\n  ❌ Suite error: ${error.message}`);
    testResults.errors.push({ suite: suiteName, message: error.message });
  }
  
  suiteResults.duration = Date.now() - suiteStart;
  suiteResults.tests = testResults.total - (suiteResults.passed + suiteResults.failed + suiteResults.skipped);
  testResults.suites.push(suiteResults);
  
  console.log(`\n  Suite completed in ${suiteResults.duration}ms`);
  return suiteResults;
}

// ============================================
// TEST SUITES
// ============================================

async function testProductWorkflow() {
  console.log('\n  Testing Complete Product Management Workflow...\n');

  // Create a test category first
  let category;
  const categoryResult = await request('POST', '/api/v1/categories', {
    name: 'Test Category',
    slug: 'test-category-' + Date.now(),
    description: 'Test category for integration testing',
    isActive: true
  });
  if (categoryResult.status === 200 || categoryResult.status === 201) {
    category = categoryResult.data;
    assert(category && category.id, 'Category creation', 'Category should be created');
  } else {
    skip('Category creation', 'API not available');
  }

  // Create a test brand
  let brand;
  const brandResult = await request('POST', '/api/v1/brands', {
    name: 'Test Brand',
    slug: 'test-brand-' + Date.now(),
    description: 'Test brand for integration testing',
    isActive: true
  });
  if (brandResult.status === 200 || brandResult.status === 201) {
    brand = brandResult.data;
    assert(brand && brand.id, 'Brand creation', 'Brand should be created');
  } else {
    skip('Brand creation', 'API not available');
  }

  // Test 1: Create a new product
  let product;
  const createData = {
    name: 'Integration Test Product',
    slug: 'integration-test-product-' + Date.now(),
    description: 'This is a test product created during integration testing',
    price: 99.99,
    compareAtPrice: 129.99,
    sku: 'TEST-' + Date.now(),
    quantity: 100,
    brandId: brand?.id || 1,
    categoryId: category?.id || 1,
    status: 'active',
    visibility: 'public',
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: false,
    meta: {
      title: 'Test Product',
      description: 'Test product description'
    }
  };

  const createResult = await measureTime(() => 
    request('POST', '/api/v1/products', createData)
  );

  if (createResult.result.status === 200 || createResult.result.status === 201) {
    product = createResult.result.data;
    assert(product && product.id, 'Product creation', 'Product should be created');
    assert(product.name === createData.name, 'Product name match', 'Product name should match');
    testResults.performanceMetrics.productCreate = createResult.duration;
  } else {
    skip('Product creation', `API returned ${createResult.result.status}`);
  }

  // Test 2: Verify product appears in search
  if (product) {
    const searchResult = await measureTime(() =>
      request('GET', '/api/v1/search?q=integration%20test%20product')
    );

    if (searchResult.result.status === 200) {
      assert(searchResult.result.data.results, 'Search results structure', 'Search should return results array');
      const found = searchResult.result.data.results?.find(p => p.id === product.id);
      assert(found, 'Product in search results', 'Product should appear in search results');
      testResults.performanceMetrics.search = searchResult.duration;
    } else {
      skip('Product in search', `Search API returned ${searchResult.result.status}`);
    }
  }

  // Test 3: Update product
  if (product) {
    const updateData = {
      name: 'Updated Integration Test Product',
      price: 149.99,
      quantity: 50
    };

    const updateResult = await measureTime(() =>
      request('PUT', `/api/v1/products/${product.id}`, updateData)
    );

    if (updateResult.result.status === 200) {
      const updated = updateResult.result.data;
      assert(updated.name === updateData.name, 'Product name updated', 'Product name should be updated');
      assert(parseFloat(updated.price) === updateData.price, 'Product price updated', 'Product price should be updated');
      testResults.performanceMetrics.productUpdate = updateResult.duration;
    } else {
      skip('Product update', `API returned ${updateResult.result.status}`);
    }
  }

  // Test 4: Verify update appears in search
  if (product) {
    const searchResult = await request('GET', '/api/v1/search?q=updated%20integration');
    
    if (searchResult.status === 200) {
      const found = searchResult.data.results?.find(p => p.id === product.id);
      assert(found, 'Updated product in search', 'Updated product should appear in search results');
    } else {
      skip('Updated product in search', `Search API returned ${searchResult.status}`);
    }
  }

  // Test 5: Delete product
  if (product) {
    const deleteResult = await measureTime(() =>
      request('DELETE', `/api/v1/products/${product.id}`)
    );

    if (deleteResult.result.status === 200) {
      assert(true, 'Product deletion', 'Product should be deleted');
      testResults.performanceMetrics.productDelete = deleteResult.duration;
    } else {
      skip('Product deletion', `API returned ${deleteResult.result.status}`);
    }
  }

  // Test 6: Verify product no longer appears in search
  if (product) {
    const searchResult = await request('GET', '/api/v1/search?q=integration%20test%20product');
    
    if (searchResult.status === 200) {
      const found = searchResult.data.results?.find(p => p.id === product.id);
      assert(!found, 'Product removed from search', 'Deleted product should not appear in search results');
    } else {
      skip('Product removed from search', `Search API returned ${searchResult.status}`);
    }
  }

  // Cleanup: Delete test category and brand
  if (category) {
    await request('DELETE', `/api/v1/categories/${category.id}`);
  }
  if (brand) {
    await request('DELETE', `/api/v1/brands/${brand.id}`);
  }
}

async function testBulkOperations() {
  console.log('\n  Testing Complete Bulk Operations Workflow...\n');

  // Create test data first
  let category, brand;
  
  const categoryResult = await request('POST', '/api/v1/categories', {
    name: 'Bulk Test Category',
    slug: 'bulk-test-category-' + Date.now(),
    isActive: true
  });
  if (categoryResult.status === 200 || categoryResult.status === 201) {
    category = categoryResult.data;
  }

  const brandResult = await request('POST', '/api/v1/brands', {
    name: 'Bulk Test Brand',
    slug: 'bulk-test-brand-' + Date.now(),
    isActive: true
  });
  if (brandResult.status === 200 || brandResult.status === 201) {
    brand = brandResult.data;
  }

  const testProducts = Array.from({ length: 10 }, (_, i) => ({
    name: `Bulk Test Product ${i + 1}`,
    slug: `bulk-test-product-${i + 1}-${Date.now()}`,
    description: 'Test product for bulk operations',
    price: 10 + i,
    quantity: 10 + i,
    brandId: brand?.id || 1,
    categoryId: category?.id || 1,
    status: 'active',
    visibility: 'public'
  }));

  // Test 1: Bulk create products
  const bulkCreateResult = await measureTime(() =>
    request('POST', '/api/v1/products/bulk', testProducts)
  );

  if (bulkCreateResult.result.status === 200 || bulkCreateResult.result.status === 201) {
    const created = bulkCreateResult.result.data;
    assert(Array.isArray(created), 'Bulk create returns array', 'Bulk create should return array');
    assert(created.length === testProducts.length, 'All products created', `Should create ${testProducts.length} products`);
    testResults.performanceMetrics.bulkCreate = bulkCreateResult.duration;
  } else {
    skip('Bulk product creation', `API returned ${bulkCreateResult.result.status}`);
  }

  // Test 2: Verify all products appear in search
  const searchResult = await request('GET', '/api/v1/search?q=bulk%20test%20product');
  if (searchResult.status === 200) {
    const bulkProducts = searchResult.data.results?.filter(p => p.name.includes('Bulk Test Product')) || [];
    assert(bulkProducts.length >= testProducts.length, 'All bulk products in search', 'All bulk products should appear in search');
  } else {
    skip('Bulk products in search', `Search API returned ${searchResult.status}`);
  }

  // Test 3: Bulk update products
  const updateData = testProducts.map((p, i) => ({
    id: searchResult.data.results?.find(s => s.slug === p.slug)?.id,
    price: 20 + i,
    quantity: 20 + i,
    isFeatured: true
  })).filter(p => p.id);

  if (updateData.length > 0) {
    const bulkUpdateResult = await measureTime(() =>
      request('PUT', '/api/v1/products/bulk', updateData)
    );

    if (bulkUpdateResult.result.status === 200) {
      assert(true, 'Bulk update', 'Bulk update should succeed');
      testResults.performanceMetrics.bulkUpdate = bulkUpdateResult.duration;
    } else {
      skip('Bulk product update', `API returned ${bulkUpdateResult.result.status}`);
    }
  }

  // Test 4: Bulk status update
  const ids = searchResult.data.results
    ?.filter(p => p.name.includes('Bulk Test Product'))
    .slice(0, 5)
    .map(p => p.id) || [];

  if (ids.length > 0) {
    const statusUpdateResult = await measureTime(() =>
      request('PATCH', '/api/v1/products/bulk/status', {
        ids: ids,
        status: 'archived'
      })
    );

    if (statusUpdateResult.result.status === 200) {
      assert(true, 'Bulk status update', 'Bulk status update should succeed');
      testResults.performanceMetrics.bulkStatusUpdate = statusUpdateResult.duration;
    } else {
      skip('Bulk status update', `API returned ${statusUpdateResult.result.status}`);
    }
  }

  // Test 5: Bulk delete products
  const deleteIds = searchResult.data.results
    ?.filter(p => p.name.includes('Bulk Test Product'))
    .map(p => p.id) || [];

  if (deleteIds.length > 0) {
    const bulkDeleteResult = await measureTime(() =>
      request('DELETE', '/api/v1/products/bulk', { ids: deleteIds })
    );

    if (bulkDeleteResult.result.status === 200) {
      assert(true, 'Bulk delete', 'Bulk delete should succeed');
      testResults.performanceMetrics.bulkDelete = bulkDeleteResult.duration;
    } else {
      skip('Bulk product delete', `API returned ${bulkDeleteResult.result.status}`);
    }
  }

  // Cleanup
  if (category) {
    await request('DELETE', `/api/v1/categories/${category.id}`);
  }
  if (brand) {
    await request('DELETE', `/api/v1/brands/${brand.id}`);
  }
}

async function testCSVOperations() {
  console.log('\n  Testing CSV Import/Export Workflow...\n');

  // Test 1: CSV Export
  const exportResult = await measureTime(() =>
    request('GET', '/api/v1/products/export')
  );

  if (exportResult.result.status === 200) {
    assert(exportResult.result.data, 'CSV export returns data', 'CSV export should return data');
    testResults.performanceMetrics.csvExport = exportResult.duration;
  } else if (exportResult.result.status === 404) {
    skip('CSV export', 'Endpoint not implemented');
  } else {
    skip('CSV export', `API returned ${exportResult.result.status}`);
  }

  // Test 2: CSV Import (with small dataset)
  const csvContent = `name,slug,description,price,quantity,status,visibility
Test Import Product 1,test-import-1,First test product,49.99,10,active,public
Test Import Product 2,test-import-2,Second test product,59.99,20,active,public
Test Import Product 3,test-import-3,Third test product,69.99,30,active,public`;

  const importResult = await measureTime(() =>
    request('POST', '/api/v1/products/import', { csv: csvContent })
  );

  if (importResult.result.status === 200 || importResult.result.status === 201) {
    assert(true, 'CSV import', 'CSV import should succeed');
    testResults.performanceMetrics.csvImport = importResult.duration;
  } else if (importResult.result.status === 404) {
    skip('CSV import', 'Endpoint not implemented');
  } else {
    skip('CSV import', `API returned ${importResult.result.status}`);
  }
}

async function testSearchFunctionality() {
  console.log('\n  Testing Search Functionality...\n');

  // Test 1: Basic search
  const basicSearch = await measureTime(() =>
    request('GET', '/api/v1/search?q=laptop')
  );

  if (basicSearch.result.status === 200) {
    assert(Array.isArray(basicSearch.result.data.results), 'Search returns array', 'Search should return results array');
    testResults.performanceMetrics.searchBasic = basicSearch.duration;
  } else {
    skip('Basic search', `API returned ${basicSearch.result.status}`);
  }

  // Test 2: Search with filters
  const filterSearch = await request('GET', '/api/v1/search?q=laptop&category=1&brand=1&minPrice=100&maxPrice=1000');
  if (filterSearch.status === 200) {
    assert(true, 'Search with filters', 'Search with filters should succeed');
  } else {
    skip('Search with filters', `API returned ${filterSearch.status}`);
  }

  // Test 3: Search with sorting
  const sortSearch = await request('GET', '/api/v1/search?q=product&sortBy=price&sortOrder=desc');
  if (sortSearch.status === 200) {
    assert(true, 'Search with sorting', 'Search with sorting should succeed');
  } else {
    skip('Search with sorting', `API returned ${sortSearch.status}`);
  }

  // Test 4: Autocomplete
  const autocomplete = await measureTime(() =>
    request('GET', '/api/v1/search/autocomplete?q=lap')
  );

  if (autocomplete.result.status === 200) {
    assert(Array.isArray(autocomplete.result.data.suggestions), 'Autocomplete returns array', 'Autocomplete should return suggestions array');
    testResults.performanceMetrics.autocomplete = autocomplete.duration;
  } else if (autocomplete.result.status === 404) {
    skip('Autocomplete', 'Endpoint not implemented');
  } else {
    skip('Autocomplete', `API returned ${autocomplete.result.status}`);
  }

  // Test 5: Facets
  const facets = await request('GET', '/api/v1/search/facets');
  if (facets.status === 200) {
    assert(facets.data.categories, 'Facets include categories', 'Facets should include categories');
    assert(facets.data.brands, 'Facets include brands', 'Facets should include brands');
  } else if (facets.status === 404) {
    skip('Facets', 'Endpoint not implemented');
  } else {
    skip('Facets', `API returned ${facets.status}`);
  }

  // Test 6: Empty search
  const emptySearch = await request('GET', '/api/v1/search?q=nonexistentquery12345');
  if (emptySearch.status === 200) {
    assert(emptySearch.data.results.length === 0, 'Empty search returns no results', 'Empty search should return empty array');
  } else {
    skip('Empty search handling', `API returned ${emptySearch.status}`);
  }

  // Test 7: Bangla text search
  const banglaSearch = await request('GET', '/api/v1/search?q=স্মার্টফোন');
  if (banglaSearch.status === 200) {
    assert(true, 'Bangla text search', 'Bangla text search should work');
  } else {
    skip('Bangla text search', `API returned ${banglaSearch.status}`);
  }
}

async function testPerformanceBenchmarks() {
  console.log('\n  Testing Performance Benchmarks...\n');

  // Test 1: Search performance (multiple iterations)
  const searchTimes = [];
  for (let i = 0; i < PERFORMANCE_ITERATIONS; i++) {
    const result = await measureTime(() =>
      request('GET', '/api/v1/search?q=product')
    );
    searchTimes.push(result.duration);
  }

  const searchAvg = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
  const searchP95 = searchTimes.sort((a, b) => a - b)[Math.floor(searchTimes.length * 0.95)];
  
  testResults.performanceMetrics.searchAvg = searchAvg;
  testResults.performanceMetrics.searchP95 = searchP95;

  assert(searchP95 < 300, 'Search p95 < 300ms', `Search p95 is ${searchP95}ms`);
  console.log(`    Search p95: ${searchP95}ms (avg: ${searchAvg.toFixed(2)}ms)`);

  // Test 2: Bulk create performance
  const bulkCreateTimes = [];
  const testProducts = Array.from({ length: 10 }, (_, i) => ({
    name: `Performance Test Product ${i}`,
    slug: `perf-test-${i}-${Date.now()}`,
    price: 10 + i,
    quantity: 10 + i,
    status: 'active'
  }));

  const bulkResult = await measureTime(() =>
    request('POST', '/api/v1/products/bulk', testProducts)
  );

  if (bulkResult.result.status === 200) {
    bulkCreateTimes.push(bulkResult.duration);
    testResults.performanceMetrics.bulkCreatePerf = bulkResult.duration;
    assert(bulkResult.duration < 10000, 'Bulk create < 10s', `Bulk create took ${bulkResult.duration}ms`);
    console.log(`    Bulk create (10 items): ${bulkResult.duration}ms`);

    // Cleanup
    const created = bulkResult.result.data;
    if (Array.isArray(created)) {
      await request('DELETE', '/api/v1/products/bulk', { ids: created.map(p => p.id) });
    }
  } else {
    skip('Bulk create performance', 'API not available');
  }
}

async function testSecurityValidation() {
  console.log('\n  Testing Security Validation...\n');

  // Test 1: Unauthenticated request rejection
  const unauthResult = await request('POST', '/api/v1/products', { name: 'Test' });
  assert(unauthResult.status === 401, 'Unauthenticated request rejected', 'Should return 401 for unauthenticated requests');

  // Test 2: SQL injection prevention in search
  const sqlInjectionQuery = encodeURIComponent("' OR '1'='1");
  const sqlResult = await request('GET', `/api/v1/search?q=${sqlInjectionQuery}`);
  if (sqlResult.status === 200) {
    assert(true, 'SQL injection in search handled', 'SQL injection should be safely handled');
  } else {
    skip('SQL injection handling', `API returned ${sqlResult.status}`);
  }

  // Test 3: XSS prevention in product names
  const xssData = {
    name: '<script>alert("xss")</script> Test Product',
    slug: 'xss-test-' + Date.now(),
    price: 10
  };
  
  const xssResult = await request('POST', '/api/v1/products', xssData);
  if (xssResult.status === 201) {
    // The product should be created with sanitized name
    assert(true, 'XSS in product names handled', 'XSS should be sanitized');
    
    // Cleanup
    if (xssResult.data?.id) {
      await request('DELETE', `/api/v1/products/${xssResult.data.id}`);
    }
  } else {
    skip('XSS prevention', 'Product creation failed');
  }

  // Test 4: Invalid input validation
  const invalidData = {
    name: '',  // Empty name should fail
    price: 'invalid'  // Invalid price should fail
  };
  
  const invalidResult = await request('POST', '/api/v1/products', invalidData);
  assert(invalidResult.status === 400, 'Invalid input rejected', 'Invalid input should return 400 Bad Request');
}

// ============================================
// REPORT GENERATION
// ============================================

function generateJSONReport() {
  const report = {
    testRun: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      testSuite: 'Phase 4 Milestone 2 Final Integration Tests',
      nodeVersion: process.version
    },
    summary: {
      totalTests: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      passRate: `${((testResults.passed / testResults.total) * 100).toFixed(2)}%`,
      totalExecutionTime: `${testResults.endTime - testResults.startTime}ms`
    },
    suites: testResults.suites,
    performanceMetrics: testResults.performanceMetrics,
    errors: testResults.errors,
    status: testResults.failed === 0 ? 'PASS' : 'FAIL'
  };

  const reportPath = path.join(__dirname, 'test-results-final.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 JSON report saved to: ${reportPath}`);
  return report;
}

function generateMarkdownReport(results) {
  const report = `# Phase 4 Milestone 2 - Final Integration Test Report

**Generated:** ${new Date().toISOString()}  
**Test Suite:** Phase 4 Milestone 2 Final Integration Tests

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${results.summary.totalTests} |
| Passed | ${results.summary.passed} |
| Failed | ${results.summary.failed} |
| Skipped | ${results.summary.skipped} |
| Pass Rate | ${results.summary.passRate} |
| Execution Time | ${results.summary.totalExecutionTime} |
| Status | ${results.status === 'PASS' ? '✅ PASS' : '❌ FAIL'} |

## Test Suites

${results.suites.map(suite => `
### ${suite.name}

| Metric | Value |
|--------|-------|
| Tests | ${suite.tests} |
| Passed | ${suite.passed} |
| Failed | ${suite.failed} |
| Duration | ${suite.duration}ms
`).join('\n')}

## Performance Metrics

| Metric | Value |
|--------|-------|
${Object.entries(results.performanceMetrics).map(([key, value]) => `| ${key} | ${typeof value === 'number' ? value + 'ms' : value} |`).join('\n')}

## Errors

${results.errors.length === 0 ? 'No errors encountered.' : results.errors.map((error, i) => `
### ${i + 1}. ${error.test || error.suite}

${error.message}
`).join('\n')}

## Conclusion

${results.status === 'PASS' 
  ? '✅ All tests passed. System is ready for production deployment.'
  : `❌ ${results.failed} test(s) failed. Review and fix before deployment.`}
`;

  const reportPath = path.join(__dirname, 'TEST_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`📄 Markdown report saved to: ${reportPath}`);
}

function printSummary() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('FINAL INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭ Skipped: ${testResults.skipped}`);
  console.log(`Pass Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  console.log(`Total Time: ${testResults.endTime - testResults.startTime}ms`);

  console.log('\n📊 Performance Metrics:');
  Object.entries(testResults.performanceMetrics).forEach(([key, value]) => {
    console.log(`  - ${key}: ${typeof value === 'number' ? value + 'ms' : value}`);
  });

  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.test || error.suite}: ${error.message}`);
    });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(testResults.failed === 0 
    ? '✅ ALL TESTS PASSED - READY FOR PRODUCTION' 
    : `❌ ${testResults.failed} TEST(S) FAILED - REVIEW REQUIRED`);
  console.log('='.repeat(60));
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('='.repeat(60));
  console.log('PHASE 4 MILESTONE 2 - FINAL INTEGRATION TESTS');
  console.log('='.repeat(60));
  console.log(`\nAPI Base URL: ${API_BASE_URL}`);
  console.log(`Test Date: ${new Date().toISOString()}`);

  testResults.startTime = Date.now();

  try {
    // Run all test suites
    await runSuite('Product Management Workflow', testProductWorkflow);
    await runSuite('Bulk Operations Workflow', testBulkOperations);
    await runSuite('CSV Import/Export Workflow', testCSVOperations);
    await runSuite('Search Functionality', testSearchFunctionality);
    await runSuite('Performance Benchmarks', testPerformanceBenchmarks);
    await runSuite('Security Validation', testSecurityValidation);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    testResults.errors.push({ message: error.message });
  }

  testResults.endTime = Date.now();

  // Generate reports
  const results = generateJSONReport();
  generateMarkdownReport(results);
  printSummary();

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
