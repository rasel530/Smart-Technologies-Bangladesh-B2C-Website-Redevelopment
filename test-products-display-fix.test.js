/**
 * Products Display Fix Verification Test Script
 * 
 * This script verifies that the frontend correctly processes the backend API response
 * after the fix for the type system mismatch issue.
 * 
 * Issue: Frontend was trying to access response.data?.products when the response
 * was already the data directly.
 * 
 * Fix: Updated frontend/src/lib/api/products.ts to access response data directly
 * instead of response.data
 */

const API_BASE_URL = 'http://localhost:3001/api/v1';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Log a test step with color
 */
function logStep(message, color = colors.cyan) {
  console.log(`${color}[TEST]${colors.reset} ${message}`);
}

/**
 * Log a success message
 */
function logSuccess(message) {
  console.log(`${colors.green}[PASS]${colors.reset} ${message}`);
}

/**
 * Log an error message
 */
function logError(message) {
  console.log(`${colors.red}[FAIL]${colors.reset} ${message}`);
}

/**
 * Log a warning message
 */
function logWarning(message) {
  console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
}

/**
 * Make an API request to fetch products
 */
async function fetchProducts(filters = {}) {
  const queryString = new URLSearchParams(filters).toString();
  const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`;
  
  logStep(`Fetching products from: ${url}`, colors.blue);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}

/**
 * Test 1: Verify backend API returns correct data structure
 */
async function testBackendApiResponse() {
  logStep('Test 1: Verifying backend API response structure...');
  
  try {
    const response = await fetchProducts({ page: 1, limit: 20 });
    
    // Check if response has the expected structure
    if (!response.products || !Array.isArray(response.products)) {
      logError('Backend API response does not contain "products" array');
      return false;
    }
    
    if (!response.pagination) {
      logError('Backend API response does not contain "pagination" object');
      return false;
    }
    
    logSuccess(`Backend API returned ${response.products.length} products`);
    logSuccess(`Pagination info: page=${response.pagination.page}, total=${response.pagination.total}, pages=${response.pagination.pages}`);
    
    return response;
  } catch (error) {
    logError(`Failed to fetch products: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Verify all 3 expected products are present
 */
async function testProductCount(response) {
  logStep('Test 2: Verifying product count...');
  
  if (!response) {
    logError('No response data available');
    return false;
  }
  
  const expectedCount = 3;
  const actualCount = response.products.length;
  
  if (actualCount !== expectedCount) {
    logError(`Expected ${expectedCount} products, but got ${actualCount}`);
    return false;
  }
  
  logSuccess(`Correct number of products: ${actualCount}`);
  
  // Verify expected products are present
  const expectedProducts = [
    { sku: 'HP123', name: 'HP laptop core i5' },
    { sku: 'Acer123', name: 'Acer laptop core i7' },
    { sku: '123', name: 'Lenovo Laptop core i 5' }
  ];
  
  let allProductsFound = true;
  
  for (const expected of expectedProducts) {
    const found = response.products.find(p => p.sku === expected.sku);
    if (!found) {
      logError(`Product with SKU ${expected.sku} not found`);
      allProductsFound = false;
    } else {
      logSuccess(`Found product: ${found.name} (SKU: ${found.sku})`);
      logSuccess(`  - Status: ${found.status}, Visibility: ${found.visibility}`);
    }
  }
  
  return allProductsFound;
}

/**
 * Test 3: Verify pagination data is correct
 */
async function testPaginationData(response) {
  logStep('Test 3: Verifying pagination data...');
  
  if (!response || !response.pagination) {
    logError('No pagination data available');
    return false;
  }
  
  const { pagination } = response;
  
  // Expected pagination values
  const expected = {
    page: 1,
    limit: 20,
    total: 3,
    pages: 1
  };
  
  let allCorrect = true;
  
  for (const [key, value] of Object.entries(expected)) {
    if (pagination[key] !== value) {
      logError(`Pagination ${key}: expected ${value}, got ${pagination[key]}`);
      allCorrect = false;
    } else {
      logSuccess(`Pagination ${key}: ${value} ✓`);
    }
  }
  
  return allCorrect;
}

/**
 * Test 4: Simulate frontend data processing (as per the fix)
 */
async function testFrontendDataProcessing(response) {
  logStep('Test 4: Simulating frontend data processing...');
  
  if (!response) {
    logError('No response data available');
    return false;
  }
  
  // Simulate what the frontend does after the fix
  // The frontend now accesses response directly instead of response.data
  
  const productsData = {
    products: response?.products || [],
    pagination: response?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  };
  
  logStep('Frontend would process:', colors.blue);
  console.log(JSON.stringify({
    count: productsData.products.length,
    totalPages: productsData.pagination.pages,
    total: productsData.pagination.total
  }, null, 2));
  
  // Verify the data structure matches what the frontend expects
  if (productsData.products.length === 0) {
    logError('Frontend would receive empty products array');
    return false;
  }
  
  if (productsData.pagination.total === 0) {
    logError('Frontend would receive zero total products');
    return false;
  }
  
  logSuccess('Frontend would correctly receive:');
  logSuccess(`  - ${productsData.products.length} products`);
  logSuccess(`  - ${productsData.pagination.total} total products`);
  logSuccess(`  - ${productsData.pagination.pages} total pages`);
  
  return true;
}

/**
 * Test 5: Verify product data integrity
 */
async function testProductDataIntegrity(response) {
  logStep('Test 5: Verifying product data integrity...');
  
  if (!response || !response.products) {
    logError('No products data available');
    return false;
  }
  
  let allValid = true;
  
  for (const product of response.products) {
    // Check required fields
    const requiredFields = ['id', 'sku', 'name', 'status', 'visibility', 'regularPrice', 'stockQuantity'];
    
    for (const field of requiredFields) {
      if (!product[field]) {
        logError(`Product ${product.sku} missing required field: ${field}`);
        allValid = false;
      }
    }
    
    // Check status and visibility are valid
    const validStatuses = ['draft', 'published', 'active', 'inactive', 'out_of_stock', 'discontinued', 'archived'];
    const validVisibilities = ['public', 'private', 'restricted'];
    
    if (!validStatuses.includes(product.status)) {
      logError(`Product ${product.sku} has invalid status: ${product.status}`);
      allValid = false;
    }
    
    if (!validVisibilities.includes(product.visibility)) {
      logError(`Product ${product.sku} has invalid visibility: ${product.visibility}`);
      allValid = false;
    }
  }
  
  if (allValid) {
    logSuccess('All products have valid data structure');
  }
  
  return allValid;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('PRODUCTS DISPLAY FIX VERIFICATION TEST');
  console.log('='.repeat(70) + '\n');
  
  const results = {
    backendApiStructure: false,
    productCount: false,
    paginationData: false,
    frontendProcessing: false,
    dataIntegrity: false
  };
  
  // Test 1: Backend API response structure
  const response = await testBackendApiResponse();
  results.backendApiStructure = !!response;
  
  if (!response) {
    logError('Cannot continue tests without valid API response');
    printSummary(results);
    return;
  }
  
  // Test 2: Product count
  results.productCount = await testProductCount(response);
  
  // Test 3: Pagination data
  results.paginationData = await testPaginationData(response);
  
  // Test 4: Frontend data processing
  results.frontendProcessing = await testFrontendDataProcessing(response);
  
  // Test 5: Data integrity
  results.dataIntegrity = await testProductDataIntegrity(response);
  
  // Print summary
  printSummary(results);
}

/**
 * Print test summary
 */
function printSummary(results) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70) + '\n');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}\n`);
  
  console.log('Test Results:');
  console.log(`  1. Backend API Structure: ${results.backendApiStructure ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  2. Product Count: ${results.productCount ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  3. Pagination Data: ${results.paginationData ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  4. Frontend Processing: ${results.frontendProcessing ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  5. Data Integrity: ${results.dataIntegrity ? '✓ PASS' : '✗ FAIL'}`);
  
  console.log('\n' + '='.repeat(70));
  
  if (passedTests === totalTests) {
    console.log(`${colors.green}ALL TESTS PASSED - Fix is working correctly!${colors.reset}`);
  } else {
    console.log(`${colors.red}SOME TESTS FAILED - Please review the issues above${colors.reset}`);
  }
  
  console.log('='.repeat(70) + '\n');
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}[ERROR]${colors.reset} Test execution failed:`, error);
  process.exit(1);
});
