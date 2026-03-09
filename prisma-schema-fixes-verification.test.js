/**
 * Prisma Schema Fixes Verification Test
 * 
 * This test verifies that the Prisma schema relationship errors have been fixed:
 * - Products API: Replaced direct 'categories' includes with 'product_categories' with nested 'categories'
 * - Categories API: Replaced 'parent' → 'categories' and 'children' → 'other_categories'
 * 
 * Original Errors:
 * 1. Products API: "Unknown field 'categories' for include statement on model 'products'"
 * 2. Categories API: "Unknown field 'parent' for include statement on model 'categories'"
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3001/api/v1';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test results storage
const testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalTests: 0,
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Helper function to make HTTP requests
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Helper function to run a test
 */
async function runTest(testName, testFn) {
  testResults.totalTests++;
  const testResult = {
    name: testName,
    status: 'pending',
    startTime: new Date().toISOString(),
    endTime: null,
    error: null,
    details: null
  };

  console.log(`\n[TEST] ${testName}`);
  console.log(`[START] ${testResult.startTime}`);

  try {
    await testFn(testResult);
    testResult.status = 'passed';
    testResults.passed++;
    console.log(`[PASS] ✓ ${testName}`);
  } catch (error) {
    testResult.status = 'failed';
    testResult.error = error.message;
    testResults.failed++;
    console.log(`[FAIL] ✗ ${testName}`);
    console.log(`[ERROR] ${error.message}`);
  }

  testResult.endTime = new Date().toISOString();
  testResults.tests.push(testResult);
}

/**
 * Helper function to assert condition
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Helper function to assert equals
 */
function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

/**
 * Helper function to assert contains
 */
function assertContains(actual, expected, message) {
  if (!actual || !actual.includes(expected)) {
    throw new Error(message || `Expected to contain "${expected}" but got "${actual}"`);
  }
}

// ============================================
// TEST SUITE: Products API
// ============================================

/**
 * Test 1: Products API - Basic endpoint access
 * Verifies that the products endpoint is accessible
 */
async function testProductsEndpointAccess(testResult) {
  const url = `${BASE_URL}/products?page=1&limit=20&status=active&visibility=public`;
  const response = await makeRequest({ url });

  testResult.details = {
    url,
    statusCode: response.statusCode,
    hasData: !!response.data
  };

  console.log(`  Status Code: ${response.statusCode}`);
  console.log(`  Has Data: ${!!response.data}`);

  assertEquals(response.statusCode, 200, 'Expected status code 200');
  assert(response.data !== null && response.data !== undefined, 'Response should have data');
}

/**
 * Test 2: Products API - Response structure
 * Verifies that the response has the correct structure
 */
async function testProductsResponseStructure(testResult) {
  const url = `${BASE_URL}/products?page=1&limit=20&status=active&visibility=public`;
  const response = await makeRequest({ url });

  testResult.details = {
    hasProducts: Array.isArray(response.data.products),
    hasPagination: !!response.data.pagination,
    hasMetadata: !!response.data.metadata
  };

  console.log(`  Has Products Array: ${testResult.details.hasProducts}`);
  console.log(`  Has Pagination: ${testResult.details.hasPagination}`);
  console.log(`  Has Metadata: ${testResult.details.hasMetadata}`);

  assert(Array.isArray(response.data.products), 'Response should have products array');
  assert(response.data.pagination !== undefined, 'Response should have pagination object');
  assert(response.data.metadata !== undefined, 'Response should have metadata object');
}

/**
 * Test 3: Products API - Product categories relationship
 * Verifies that products include product_categories with nested categories
 */
async function testProductsCategoriesRelationship(testResult) {
  const url = `${BASE_URL}/products?page=1&limit=5&status=active&visibility=public`;
  const response = await makeRequest({ url });

  if (response.data.products && response.data.products.length > 0) {
    const firstProduct = response.data.products[0];
    const hasProductCategories = firstProduct.product_categories !== undefined;
    const firstHasCategories = hasProductCategories && 
                              firstProduct.product_categories.length > 0 &&
                              firstProduct.product_categories[0].categories !== undefined;

    testResult.details = {
      firstProductId: firstProduct.id,
      productName: firstProduct.name,
      hasProductCategories,
      firstHasCategories,
      productCategoriesCount: hasProductCategories ? firstProduct.product_categories.length : 0
    };

    console.log(`  Product: ${firstProduct.name}`);
    console.log(`  Has product_categories: ${hasProductCategories}`);
    console.log(`  First has nested categories: ${firstHasCategories}`);
    console.log(`  Product categories count: ${testResult.details.productCategoriesCount}`);

    assert(hasProductCategories, 'Product should have product_categories relationship');
    if (hasProductCategories && firstProduct.product_categories.length > 0) {
      assert(firstProduct.product_categories[0].categories !== undefined, 
             'product_categories should have nested categories');
    }
  } else {
    testResult.details = {
      message: 'No products found in response',
      productsCount: 0
    };
    console.log(`  Warning: No products found in response`);
  }
}

/**
 * Test 4: Products API - Category data structure
 * Verifies that nested category data has correct structure
 */
async function testProductsCategoryDataStructure(testResult) {
  const url = `${BASE_URL}/products?page=1&limit=5&status=active&visibility=public`;
  const response = await makeRequest({ url });

  if (response.data.products && response.data.products.length > 0) {
    const productWithCategories = response.data.products.find(p => 
      p.product_categories && p.product_categories.length > 0
    );

    if (productWithCategories) {
      const firstCategory = productWithCategories.product_categories[0].categories;
      const hasRequiredFields = firstCategory && 
                               firstCategory.id && 
                               firstCategory.name && 
                               firstCategory.slug;

      testResult.details = {
        productId: productWithCategories.id,
        productName: productWithCategories.name,
        categoryId: firstCategory ? firstCategory.id : null,
        categoryName: firstCategory ? firstCategory.name : null,
        hasRequiredFields
      };

      console.log(`  Product: ${productWithCategories.name}`);
      console.log(`  Category ID: ${testResult.details.categoryId}`);
      console.log(`  Category Name: ${testResult.details.categoryName}`);
      console.log(`  Has required fields (id, name, slug): ${hasRequiredFields}`);

      assert(hasRequiredFields, 'Category should have id, name, and slug fields');
    } else {
      testResult.details = {
        message: 'No products with categories found'
      };
      console.log(`  Warning: No products with categories found`);
    }
  } else {
    testResult.details = {
      message: 'No products found in response'
    };
    console.log(`  Warning: No products found in response`);
  }
}

/**
 * Test 5: Products API - No Prisma schema error
 * Verifies that the response does not contain Prisma schema errors
 */
async function testProductsNoPrismaError(testResult) {
  const url = `${BASE_URL}/products?page=1&limit=20&status=active&visibility=public`;
  const response = await makeRequest({ url });

  const hasError = response.data.error !== undefined;
  const hasPrismaError = hasError && 
                        (response.data.message?.includes('Unknown field') ||
                         response.data.message?.includes('include statement'));

  testResult.details = {
    hasError,
    hasPrismaError,
    errorMessage: response.data.message || null
  };

  console.log(`  Has Error: ${hasError}`);
  console.log(`  Has Prisma Error: ${hasPrismaError}`);
  if (response.data.message) {
    console.log(`  Error Message: ${response.data.message}`);
  }

  assert(!hasPrismaError, 'Response should not contain Prisma schema errors');
}

/**
 * Test 6: Products API - Featured products endpoint
 * Verifies that the featured products endpoint works correctly
 */
async function testProductsFeaturedEndpoint(testResult) {
  const url = `${BASE_URL}/products/featured`;
  const response = await makeRequest({ url });

  testResult.details = {
    statusCode: response.statusCode,
    hasProducts: Array.isArray(response.data.products),
    productsCount: Array.isArray(response.data.products) ? response.data.products.length : 0
  };

  console.log(`  Status Code: ${response.statusCode}`);
  console.log(`  Has Products: ${testResult.details.hasProducts}`);
  console.log(`  Products Count: ${testResult.details.productsCount}`);

  assertEquals(response.statusCode, 200, 'Expected status code 200');
  assert(Array.isArray(response.data.products), 'Response should have products array');
}

// ============================================
// TEST SUITE: Categories API
// ============================================

/**
 * Test 7: Categories API - Basic endpoint access
 * Verifies that the categories endpoint is accessible
 */
async function testCategoriesEndpointAccess(testResult) {
  const url = `${BASE_URL}/categories?status=active`;
  const response = await makeRequest({ url });

  testResult.details = {
    url,
    statusCode: response.statusCode,
    hasData: !!response.data
  };

  console.log(`  Status Code: ${response.statusCode}`);
  console.log(`  Has Data: ${!!response.data}`);

  assertEquals(response.statusCode, 200, 'Expected status code 200');
  assert(response.data !== null && response.data !== undefined, 'Response should have data');
}

/**
 * Test 8: Categories API - Response structure
 * Verifies that the response has the correct structure
 */
async function testCategoriesResponseStructure(testResult) {
  const url = `${BASE_URL}/categories?status=active`;
  const response = await makeRequest({ url });

  const hasCategories = Array.isArray(response.data.categories);
  const hasPagination = !!response.data.pagination;

  testResult.details = {
    hasCategories,
    hasPagination,
    categoriesCount: hasCategories ? response.data.categories.length : 0
  };

  console.log(`  Has Categories Array: ${hasCategories}`);
  console.log(`  Has Pagination: ${hasPagination}`);
  console.log(`  Categories Count: ${testResult.details.categoriesCount}`);

  assert(hasCategories, 'Response should have categories array');
  assert(hasPagination, 'Response should have pagination object');
}

/**
 * Test 9: Categories API - Parent categories relationship
 * Verifies that categories include 'categories' (parent) relationship
 */
async function testCategoriesParentRelationship(testResult) {
  const url = `${BASE_URL}/categories?status=active`;
  const response = await makeRequest({ url });

  if (response.data.categories && response.data.categories.length > 0) {
    const firstCategory = response.data.categories[0];
    const hasParentCategories = firstCategory.categories !== undefined;

    testResult.details = {
      categoryId: firstCategory.id,
      categoryName: firstCategory.name,
      hasParentCategories,
      parentId: firstCategory.parentId,
      parentCategoriesCount: hasParentCategories ? firstCategory.categories.length : 0
    };

    console.log(`  Category: ${firstCategory.name}`);
    console.log(`  Has parent categories: ${hasParentCategories}`);
    console.log(`  Parent ID: ${testResult.details.parentId}`);
    console.log(`  Parent categories count: ${testResult.details.parentCategoriesCount}`);

    assert(hasParentCategories, 'Category should have categories (parent) relationship');
  } else {
    testResult.details = {
      message: 'No categories found in response',
      categoriesCount: 0
    };
    console.log(`  Warning: No categories found in response`);
  }
}

/**
 * Test 10: Categories API - Child categories relationship
 * Verifies that categories include 'other_categories' (children) relationship
 */
async function testCategoriesChildRelationship(testResult) {
  const url = `${BASE_URL}/categories?status=active`;
  const response = await makeRequest({ url });

  if (response.data.categories && response.data.categories.length > 0) {
    const firstCategory = response.data.categories[0];
    const hasChildCategories = firstCategory.other_categories !== undefined;

    testResult.details = {
      categoryId: firstCategory.id,
      categoryName: firstCategory.name,
      hasChildCategories,
      childCategoriesCount: hasChildCategories ? firstCategory.other_categories.length : 0
    };

    console.log(`  Category: ${firstCategory.name}`);
    console.log(`  Has child categories: ${hasChildCategories}`);
    console.log(`  Child categories count: ${testResult.details.childCategoriesCount}`);

    assert(hasChildCategories, 'Category should have other_categories (children) relationship');
  } else {
    testResult.details = {
      message: 'No categories found in response',
      categoriesCount: 0
    };
    console.log(`  Warning: No categories found in response`);
  }
}

/**
 * Test 11: Categories API - Category data structure
 * Verifies that category data has correct structure
 */
async function testCategoriesDataStructure(testResult) {
  const url = `${BASE_URL}/categories?status=active`;
  const response = await makeRequest({ url });

  if (response.data.categories && response.data.categories.length > 0) {
    const firstCategory = response.data.categories[0];
    const hasRequiredFields = firstCategory.id && 
                             firstCategory.name && 
                             firstCategory.slug;

    testResult.details = {
      categoryId: firstCategory.id,
      categoryName: firstCategory.name,
      categorySlug: firstCategory.slug,
      hasRequiredFields
    };

    console.log(`  Category ID: ${firstCategory.id}`);
    console.log(`  Category Name: ${firstCategory.name}`);
    console.log(`  Category Slug: ${firstCategory.slug}`);
    console.log(`  Has required fields (id, name, slug): ${hasRequiredFields}`);

    assert(hasRequiredFields, 'Category should have id, name, and slug fields');
  } else {
    testResult.details = {
      message: 'No categories found in response'
    };
    console.log(`  Warning: No categories found in response`);
  }
}

/**
 * Test 12: Categories API - No Prisma schema error
 * Verifies that the response does not contain Prisma schema errors
 */
async function testCategoriesNoPrismaError(testResult) {
  const url = `${BASE_URL}/categories?status=active`;
  const response = await makeRequest({ url });

  const hasError = response.data.error !== undefined;
  const hasPrismaError = hasError && 
                        (response.data.message?.includes('Unknown field') ||
                         response.data.message?.includes('include statement'));

  testResult.details = {
    hasError,
    hasPrismaError,
    errorMessage: response.data.message || null
  };

  console.log(`  Has Error: ${hasError}`);
  console.log(`  Has Prisma Error: ${hasPrismaError}`);
  if (response.data.message) {
    console.log(`  Error Message: ${response.data.message}`);
  }

  assert(!hasPrismaError, 'Response should not contain Prisma schema errors');
}

/**
 * Test 13: Categories API - Tree endpoint
 * Verifies that the categories tree endpoint works correctly
 */
async function testCategoriesTreeEndpoint(testResult) {
  const url = `${BASE_URL}/categories/tree`;
  const response = await makeRequest({ url });

  testResult.details = {
    statusCode: response.statusCode,
    hasTree: Array.isArray(response.data.tree),
    treeCount: Array.isArray(response.data.tree) ? response.data.tree.length : 0
  };

  console.log(`  Status Code: ${response.statusCode}`);
  console.log(`  Has Tree: ${testResult.details.hasTree}`);
  console.log(`  Tree Count: ${testResult.details.treeCount}`);

  assertEquals(response.statusCode, 200, 'Expected status code 200');
  assert(Array.isArray(response.data.tree), 'Response should have tree array');
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('='.repeat(80));
  console.log('PRISMA SCHEMA FIXES VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log(`Start Time: ${testResults.startTime}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(80));

  // Check if backend server is running
  console.log('\n[CHECK] Verifying backend server is running...');
  try {
    const response = await makeRequest({ url: BASE_URL + '/products?page=1&limit=1' });
    if (response.statusCode === 200) {
      console.log('[PASS] ✓ Backend server is running and accessible');
    } else {
      console.log(`[WARN] Backend server responded with status ${response.statusCode}`);
    }
  } catch (error) {
    console.log('[FAIL] ✗ Backend server is not running or not accessible');
    console.log(`[ERROR] ${error.message}`);
    console.log('\nPlease start the backend server before running tests:');
    console.log('  cd backend && npm start');
    process.exit(1);
  }

  // Run Products API tests
  console.log('\n' + '='.repeat(80));
  console.log('PRODUCTS API TESTS');
  console.log('='.repeat(80));

  await runTest('Products API - Basic endpoint access', testProductsEndpointAccess);
  await runTest('Products API - Response structure', testProductsResponseStructure);
  await runTest('Products API - Product categories relationship', testProductsCategoriesRelationship);
  await runTest('Products API - Category data structure', testProductsCategoryDataStructure);
  await runTest('Products API - No Prisma schema error', testProductsNoPrismaError);
  await runTest('Products API - Featured products endpoint', testProductsFeaturedEndpoint);

  // Run Categories API tests
  console.log('\n' + '='.repeat(80));
  console.log('CATEGORIES API TESTS');
  console.log('='.repeat(80));

  await runTest('Categories API - Basic endpoint access', testCategoriesEndpointAccess);
  await runTest('Categories API - Response structure', testCategoriesResponseStructure);
  await runTest('Categories API - Parent categories relationship', testCategoriesParentRelationship);
  await runTest('Categories API - Child categories relationship', testCategoriesChildRelationship);
  await runTest('Categories API - Category data structure', testCategoriesDataStructure);
  await runTest('Categories API - No Prisma schema error', testCategoriesNoPrismaError);
  await runTest('Categories API - Tree endpoint', testCategoriesTreeEndpoint);

  // Print test summary
  testResults.endTime = new Date().toISOString();
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Start Time: ${testResults.startTime}`);
  console.log(`End Time: ${testResults.endTime}`);
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passed} ✓`);
  console.log(`Failed: ${testResults.failed} ✗`);
  console.log(`Success Rate: ${((testResults.passed / testResults.totalTests) * 100).toFixed(2)}%`);
  console.log('='.repeat(80));

  // Print failed tests
  if (testResults.failed > 0) {
    console.log('\nFAILED TESTS:');
    console.log('='.repeat(80));
    testResults.tests.filter(t => t.status === 'failed').forEach(test => {
      console.log(`✗ ${test.name}`);
      console.log(`  Error: ${test.error}`);
      console.log(`  Time: ${test.startTime} - ${test.endTime}`);
    });
    console.log('='.repeat(80));
  }

  // Save test results to file
  const resultsFilename = `prisma-schema-fixes-test-results-${Date.now()}.json`;
  const fs = require('fs');
  fs.writeFileSync(resultsFilename, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${resultsFilename}`);

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run all tests with timeout
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Test execution timed out')), TEST_TIMEOUT);
});

Promise.race([runAllTests(), timeoutPromise])
  .catch(error => {
    console.error('\n' + '='.repeat(80));
    console.error('FATAL ERROR');
    console.error('='.repeat(80));
    console.error(error.message);
    console.error('='.repeat(80));
    process.exit(1);
  });
