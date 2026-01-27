/**
 * Test Product Relationship Endpoints
 * 
 * This script tests all product relationship endpoints:
 * - Cross-sell products (POST, DELETE, PATCH)
 * - Up-sell products (POST, DELETE, PATCH)
 * - Related products (POST, DELETE, PATCH)
 * - GET /api/v1/products/:id includes relationship data
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001/api/v1';
let authToken = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

// Helper function to log test results
function logTest(testName, passed, message = '') {
  const status = passed ? `${colors.green}✓ PASSED${colors.reset}` : `${colors.red}✗ FAILED${colors.reset}`;
  console.log(`${status} - ${testName}${message ? ': ' + message : ''}`);
}

// Helper function to make authenticated requests
async function authenticatedRequest(method, endpoint, data = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      data,
      validateStatus: () => true // Don't throw on error status codes
    });
    return response;
  } catch (error) {
    return {
      status: 500,
      data: { error: error.message }
    };
  }
}

// Test suite
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('PRODUCT RELATIONSHIP ENDPOINTS TEST SUITE');
  console.log('='.repeat(60) + '\n');

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Test 1: Login as admin
  console.log(`${colors.blue}[TEST 1]${colors.reset} Login as admin user`);
  testResults.total++;
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      logTest('Admin login', true);
      testResults.passed++;
    } else {
      logTest('Admin login', false, 'No token received');
      testResults.failed++;
    }
  } catch (error) {
    logTest('Admin login', false, error.message);
    testResults.failed++;
  }

  // Test 2: Get all products to find test products
  console.log(`\n${colors.blue}[TEST 2]${colors.reset} Get all products`);
  testResults.total++;
  const productsResponse = await authenticatedRequest('GET', '/products');
  
  if (productsResponse.status === 200 && productsResponse.data.products.length >= 2) {
    logTest('Get products', true, `Found ${productsResponse.data.products.length} products`);
    testResults.passed++;
    
    // Use first two products for relationship testing
    const product1 = productsResponse.data.products[0];
    const product2 = productsResponse.data.products[1];
    
    console.log(`  Using products:`);
    console.log(`  - Product 1: ${product1.name} (${product1.id})`);
    console.log(`  - Product 2: ${product2.name} (${product2.id})\n`);

    // ============================================
    // CROSS-SELL PRODUCT TESTS
    // ============================================
    
    console.log(`${colors.yellow}CROSS-SELL PRODUCT TESTS${colors.reset}\n`);

    // Test 3: Add cross-sell product
    console.log(`${colors.blue}[TEST 3]${colors.reset} Add cross-sell product`);
    testResults.total++;
    const addCrossSellResponse = await authenticatedRequest('POST', `/products/${product1.id}/cross-sell`, {
      relatedProductId: product2.id,
      displayOrder: 0
    });
    
    if (addCrossSellResponse.status === 201) {
      logTest('Add cross-sell product', true);
      testResults.passed++;
    } else {
      logTest('Add cross-sell product', false, addCrossSellResponse.data.error || 'Unknown error');
      testResults.failed++;
    }

    // Test 4: Get product with cross-sell data
    console.log(`${colors.blue}[TEST 4]${colors.reset} Get product with cross-sell data`);
    testResults.total++;
    const getProductResponse = await authenticatedRequest('GET', `/products/${product1.id}`);
    
    if (getProductResponse.status === 200 && 
        getProductResponse.data.product.crossSellProducts) {
      logTest('Get product with cross-sell data', true, 
        `Found ${getProductResponse.data.product.crossSellProducts.length} cross-sell products`);
      testResults.passed++;
    } else {
      logTest('Get product with cross-sell data', false, 'No cross-sell data in response');
      testResults.failed++;
    }

    // Test 5: Reorder cross-sell products
    console.log(`${colors.blue}[TEST 5]${colors.reset} Reorder cross-sell products`);
    testResults.total++;
    const reorderCrossSellResponse = await authenticatedRequest('PATCH', 
      `/products/${product1.id}/cross-sell/reorder`, {
      orders: [
        { relatedProductId: product2.id, displayOrder: 1 }
      ]
    });
    
    if (reorderCrossSellResponse.status === 200) {
      logTest('Reorder cross-sell products', true);
      testResults.passed++;
    } else {
      logTest('Reorder cross-sell products', false, reorderCrossSellResponse.data.error || 'Unknown error');
      testResults.failed++;
    }

    // Test 6: Remove cross-sell product
    console.log(`${colors.blue}[TEST 6]${colors.reset} Remove cross-sell product`);
    testResults.total++;
    const removeCrossSellResponse = await authenticatedRequest('DELETE', 
      `/products/${product1.id}/cross-sell/${product2.id}`);
    
    if (removeCrossSellResponse.status === 200) {
      logTest('Remove cross-sell product', true);
      testResults.passed++;
    } else {
      logTest('Remove cross-sell product', false, removeCrossSellResponse.data.error || 'Unknown error');
      testResults.failed++;
    }

    // ============================================
    // UP-SELL PRODUCT TESTS
    // ============================================
    
    console.log(`\n${colors.yellow}UP-SELL PRODUCT TESTS${colors.reset}\n`);

    // Test 7: Add up-sell product
    console.log(`${colors.blue}[TEST 7]${colors.reset} Add up-sell product`);
    testResults.total++;
    const addUpSellResponse = await authenticatedRequest('POST', `/products/${product1.id}/up-sell`, {
      relatedProductId: product2.id,
      displayOrder: 0
    });
    
    if (addUpSellResponse.status === 201) {
      logTest('Add up-sell product', true);
      testResults.passed++;
    } else {
      logTest('Add up-sell product', false, addUpSellResponse.data.error || 'Unknown error');
      testResults.failed++;
    }

    // Test 8: Get product with up-sell data
    console.log(`${colors.blue}[TEST 8]${colors.reset} Get product with up-sell data`);
    testResults.total++;
    const getProductWithUpSellResponse = await authenticatedRequest('GET', `/products/${product1.id}`);
    
    if (getProductWithUpSellResponse.status === 200 && 
        getProductWithUpSellResponse.data.product.upSellProducts) {
      logTest('Get product with up-sell data', true,
        `Found ${getProductWithUpSellResponse.data.product.upSellProducts.length} up-sell products`);
      testResults.passed++;
    } else {
      logTest('Get product with up-sell data', false, 'No up-sell data in response');
      testResults.failed++;
    }

    // Test 9: Reorder up-sell products
    console.log(`${colors.blue}[TEST 9]${colors.reset} Reorder up-sell products`);
    testResults.total++;
    const reorderUpSellResponse = await authenticatedRequest('PATCH', 
      `/products/${product1.id}/up-sell/reorder`, {
      orders: [
        { relatedProductId: product2.id, displayOrder: 1 }
      ]
    });
    
    if (reorderUpSellResponse.status === 200) {
      logTest('Reorder up-sell products', true);
      testResults.passed++;
    } else {
      logTest('Reorder up-sell products', false, reorderUpSellResponse.data.error || 'Unknown error');
      testResults.failed++;
    }

    // Test 10: Remove up-sell product
    console.log(`${colors.blue}[TEST 10]${colors.reset} Remove up-sell product`);
    testResults.total++;
    const removeUpSellResponse = await authenticatedRequest('DELETE', 
      `/products/${product1.id}/up-sell/${product2.id}`);
    
    if (removeUpSellResponse.status === 200) {
      logTest('Remove up-sell product', true);
      testResults.passed++;
    } else {
      logTest('Remove up-sell product', false, removeUpSellResponse.data.error || 'Unknown error');
      testResults.failed++;
    }

    // ============================================
    // RELATED PRODUCT TESTS
    // ============================================
    
    console.log(`\n${colors.yellow}RELATED PRODUCT TESTS${colors.reset}\n`);

    // Test 11: Add related product
    console.log(`${colors.blue}[TEST 11]${colors.reset} Add related product`);
    testResults.total++;
    const addRelatedResponse = await authenticatedRequest('POST', `/products/${product1.id}/related`, {
      relatedProductId: product2.id,
      displayOrder: 0
    });
    
    if (addRelatedResponse.status === 201) {
      logTest('Add related product', true);
      testResults.passed++;
    } else {
      logTest('Add related product', false, addRelatedResponse.data.error || 'Unknown error');
      testResults.failed++;
    }

    // Test 12: Get product with related product data
    console.log(`${colors.blue}[TEST 12]${colors.reset} Get product with related product data`);
    testResults.total++;
    const getProductWithRelatedResponse = await authenticatedRequest('GET', `/products/${product1.id}`);
    
    if (getProductWithRelatedResponse.status === 200 && 
        getProductWithRelatedResponse.data.product.relatedProducts) {
      logTest('Get product with related product data', true,
        `Found ${getProductWithRelatedResponse.data.product.relatedProducts.length} related products`);
      testResults.passed++;
    } else {
      logTest('Get product with related product data', false, 'No related product data in response');
      testResults.failed++;
    }

    // Test 13: Reorder related products
    console.log(`${colors.blue}[TEST 13]${colors.reset} Reorder related products`);
    testResults.total++;
    const reorderRelatedResponse = await authenticatedRequest('PATCH', 
      `/products/${product1.id}/reorder-related`, {
      orders: [
        { relatedProductId: product2.id, displayOrder: 1 }
      ]
    });
    
    if (reorderRelatedResponse.status === 200) {
      logTest('Reorder related products', true);
      testResults.passed++;
    } else {
      logTest('Reorder related products', false, reorderRelatedResponse.data.error || 'Unknown error');
      testResults.failed++;
    }

    // Test 14: Remove related product
    console.log(`${colors.blue}[TEST 14]${colors.reset} Remove related product`);
    testResults.total++;
    const removeRelatedResponse = await authenticatedRequest('DELETE', 
      `/products/${product1.id}/related/${product2.id}`);
    
    if (removeRelatedResponse.status === 200) {
      logTest('Remove related product', true);
      testResults.passed++;
    } else {
      logTest('Remove related product', false, removeRelatedResponse.data.error || 'Unknown error');
      testResults.failed++;
    }

    // ============================================
    // VALIDATION TESTS
    // ============================================
    
    console.log(`\n${colors.yellow}VALIDATION TESTS${colors.reset}\n`);

    // Test 15: Prevent self-referencing (cross-sell)
    console.log(`${colors.blue}[TEST 15]${colors.reset} Prevent self-referencing (cross-sell)`);
    testResults.total++;
    const selfCrossSellResponse = await authenticatedRequest('POST', 
      `/products/${product1.id}/cross-sell`, {
      relatedProductId: product1.id
    });
    
    if (selfCrossSellResponse.status === 400) {
      logTest('Prevent self-referencing (cross-sell)', true);
      testResults.passed++;
    } else {
      logTest('Prevent self-referencing (cross-sell)', false, 'Should reject self-referencing');
      testResults.failed++;
    }

    // Test 16: Prevent duplicate relationships (up-sell)
    console.log(`${colors.blue}[TEST 16]${colors.reset} Prevent duplicate relationships (up-sell)`);
    testResults.total++;
    
    // First add
    await authenticatedRequest('POST', `/products/${product1.id}/up-sell`, {
      relatedProductId: product2.id
    });
    
    // Try to add again
    const duplicateUpSellResponse = await authenticatedRequest('POST', 
      `/products/${product1.id}/up-sell`, {
      relatedProductId: product2.id
    });
    
    if (duplicateUpSellResponse.status === 409) {
      logTest('Prevent duplicate relationships (up-sell)', true);
      testResults.passed++;
    } else {
      logTest('Prevent duplicate relationships (up-sell)', false, 'Should reject duplicate');
      testResults.failed++;
    }

    // Clean up
    await authenticatedRequest('DELETE', `/products/${product1.id}/up-sell/${product2.id}`);

  } else {
    logTest('Get products', false, 'Not enough products for testing (need at least 2)');
    testResults.failed++;
  }

  // ============================================
  // TEST SUMMARY
  // ============================================
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  console.log('='.repeat(60) + '\n');

  return testResults;
}

// Run tests
runTests()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
