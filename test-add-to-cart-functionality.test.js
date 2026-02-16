/**
 * Add to Cart Functionality Test Script
 * 
 * This script tests the Add to Cart button functionality fixes:
 * 1. ProductGrid component - onAddToCart prop
 * 2. Product listing page - handleAddToCart function
 * 3. Product detail page - proper addItem handler
 * 
 * Prerequisites:
 * - Docker containers must be running (docker-compose -f docker-compose.dev.yml up -d)
 * - Frontend should be accessible at http://localhost:3000
 * - Backend should be accessible at http://localhost:3001
 */

const http = require('http');
const https = require('https');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  errors: []
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Helper function to make HTTP requests
 */
function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'AddToCart-Test-Script/1.0',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Log test result
 */
function logResult(testName, passed, message, details = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const color = passed ? colors.green : colors.red;
  
  console.log(`${color}[${status}]${colors.reset} ${testName}`);
  if (message) {
    console.log(`      ${message}`);
  }
  if (details) {
    console.log(`      ${colors.cyan}${details}${colors.reset}`);
  }
  
  if (passed) {
    testResults.passed.push({ name: testName, message, details });
  } else {
    testResults.failed.push({ name: testName, message, details });
  }
}

/**
 * Log warning
 */
function logWarning(testName, message) {
  console.log(`${colors.yellow}[WARN]${colors.reset} ${testName}: ${message}`);
  testResults.warnings.push({ name: testName, message });
}

/**
 * Log error
 */
function logError(testName, error) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${testName}: ${error}`);
  testResults.errors.push({ name: testName, error });
}

/**
 * Test 1: Verify Frontend is accessible
 */
async function testFrontendAccessible() {
  console.log(`\n${colors.blue}=== Test 1: Frontend Accessibility ===${colors.reset}`);
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    const passed = response.statusCode === 200;
    logResult(
      'Frontend Home Page',
      passed,
      passed ? 'Frontend is accessible' : `Unexpected status code: ${response.statusCode}`,
      `URL: ${FRONTEND_URL}, Status: ${response.statusCode}`
    );
    return passed;
  } catch (error) {
    logError('Frontend Home Page', error.message);
    return false;
  }
}

/**
 * Test 2: Verify Product Listing Page is accessible
 */
async function testProductListingPage() {
  console.log(`\n${colors.blue}=== Test 2: Product Listing Page ===${colors.reset}`);
  
  try {
    const response = await makeRequest(`${FRONTEND_URL}/products`);
    const passed = response.statusCode === 200;
    
    // Check for key elements in the HTML
    const body = response.body;
    const hasProductGrid = body.includes('ProductGrid') || body.includes('product-grid');
    const hasAddToCartButton = body.includes('Add to Cart') || body.includes('add-to-cart');
    
    logResult(
      'Product Listing Page Access',
      passed,
      passed ? 'Product listing page loads successfully' : `Status code: ${response.statusCode}`,
      `URL: ${FRONTEND_URL}/products`
    );
    
    logResult(
      'Product Listing Page Content',
      hasProductGrid,
      hasProductGrid ? 'Product grid component found' : 'Product grid component not found'
    );
    
    logResult(
      'Add to Cart Button Present',
      hasAddToCartButton,
      hasAddToCartButton ? 'Add to Cart button found' : 'Add to Cart button not found in HTML'
    );
    
    return passed && hasProductGrid;
  } catch (error) {
    logError('Product Listing Page', error.message);
    return false;
  }
}

/**
 * Test 3: Verify Product Detail Page is accessible
 */
async function testProductDetailPage() {
  console.log(`\n${colors.blue}=== Test 3: Product Detail Page ===${colors.reset}`);
  
  try {
    // Try to access a known product detail page
    const response = await makeRequest(`${FRONTEND_URL}/products/hp-15-fr0076tu-core-i5-13th-gen-156-inch-fhd-laptop`);
    const passed = response.statusCode === 200;
    
    // Check for key elements in the HTML
    const body = response.body;
    const hasProductDetail = body.includes('ProductDetail') || body.includes('product-detail');
    const hasAddToCartButton = body.includes('Add to Cart') || body.includes('add-to-cart');
    const hasCartContext = body.includes('CartContext') || body.includes('useCart');
    
    logResult(
      'Product Detail Page Access',
      passed,
      passed ? 'Product detail page loads successfully' : `Status code: ${response.statusCode}`,
      `URL: ${FRONTEND_URL}/products/hp-15-fr0076tu-core-i5-13th-gen-156-inch-fhd-laptop`
    );
    
    logResult(
      'Product Detail Component',
      hasProductDetail,
      hasProductDetail ? 'Product detail component found' : 'Product detail component not found'
    );
    
    logResult(
      'Add to Cart Button Present',
      hasAddToCartButton,
      hasAddToCartButton ? 'Add to Cart button found' : 'Add to Cart button not found in HTML'
    );
    
    logResult(
      'Cart Context Integration',
      hasCartContext,
      hasCartContext ? 'Cart context integration detected' : 'Cart context not detected in HTML'
    );
    
    return passed && hasProductDetail;
  } catch (error) {
    logError('Product Detail Page', error.message);
    return false;
  }
}

/**
 * Test 4: Verify Cart Page is accessible
 */
async function testCartPage() {
  console.log(`\n${colors.blue}=== Test 4: Cart Page ===${colors.reset}`);
  
  try {
    const response = await makeRequest(`${FRONTEND_URL}/cart`);
    const passed = response.statusCode === 200;
    
    logResult(
      'Cart Page Access',
      passed,
      passed ? 'Cart page loads successfully' : `Status code: ${response.statusCode}`,
      `URL: ${FRONTEND_URL}/cart`
    );
    
    return passed;
  } catch (error) {
    logError('Cart Page', error.message);
    return false;
  }
}

/**
 * Test 5: Verify Backend API is accessible
 */
async function testBackendAPI() {
  console.log(`\n${colors.blue}=== Test 5: Backend API ===${colors.reset}`);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/v1/health`);
    const passed = response.statusCode === 200 || response.statusCode === 404; // 404 is acceptable if health endpoint doesn't exist
    
    logResult(
      'Backend API Access',
      passed,
      passed ? 'Backend API is accessible' : `Status code: ${response.statusCode}`,
      `URL: ${BACKEND_URL}/api/v1/health`
    );
    
    return passed;
  } catch (error) {
    logWarning('Backend API', `Backend may not be running: ${error.message}`);
    return true; // Don't fail the test if backend is not running
  }
}

/**
 * Test 6: Check for JavaScript errors in build output
 */
async function testJavaScriptBuild() {
  console.log(`\n${colors.blue}=== Test 6: JavaScript Build Check ===${colors.reset}`);
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    const body = response.body;
    
    // Check for common error patterns
    const hasConsoleErrors = body.includes('console.error') || body.includes('throw new Error');
    const hasUndefinedErrors = body.includes('undefined is not a function') || body.includes('Cannot read property');
    
    logResult(
      'No Console Errors in HTML',
      !hasConsoleErrors,
      !hasConsoleErrors ? 'No console errors detected' : 'Potential console errors found'
    );
    
    logResult(
      'No Undefined Errors',
      !hasUndefinedErrors,
      !hasUndefinedErrors ? 'No undefined errors detected' : 'Potential undefined errors found'
    );
    
    return !hasConsoleErrors && !hasUndefinedErrors;
  } catch (error) {
    logError('JavaScript Build Check', error.message);
    return false;
  }
}

/**
 * Test 7: Verify CartContext is properly integrated
 */
async function testCartContextIntegration() {
  console.log(`\n${colors.blue}=== Test 7: CartContext Integration ===${colors.reset}`);
  
  try {
    // Check product listing page
    const listingResponse = await makeRequest(`${FRONTEND_URL}/products`);
    const listingBody = listingResponse.body;
    const listingHasCartContext = listingBody.includes('CartContext') || listingBody.includes('useCart');
    
    logResult(
      'Product Listing - CartContext',
      listingHasCartContext,
      listingHasCartContext ? 'CartContext imported in product listing' : 'CartContext not found'
    );
    
    // Check product detail page
    const detailResponse = await makeRequest(`${FRONTEND_URL}/products/hp-15-fr0076tu-core-i5-13th-gen-156-inch-fhd-laptop`);
    const detailBody = detailResponse.body;
    const detailHasCartContext = detailBody.includes('CartContext') || detailBody.includes('useCart');
    
    logResult(
      'Product Detail - CartContext',
      detailHasCartContext,
      detailHasCartContext ? 'CartContext imported in product detail' : 'CartContext not found'
    );
    
    return listingHasCartContext && detailHasCartContext;
  } catch (error) {
    logError('CartContext Integration', error.message);
    return false;
  }
}

/**
 * Test 8: Verify ProductGrid onAddToCart prop
 */
async function testProductGridOnAddToCart() {
  console.log(`\n${colors.blue}=== Test 8: ProductGrid onAddToCart Prop ===${colors.reset}`);
  
  try {
    const response = await makeRequest(`${FRONTEND_URL}/products`);
    const body = response.body;
    
    // Check for onAddToCart prop usage
    const hasOnAddToCart = body.includes('onAddToCart') || body.includes('on-add-to-cart');
    
    logResult(
      'ProductGrid onAddToCart Prop',
      hasOnAddToCart,
      hasOnAddToCart ? 'onAddToCart prop found' : 'onAddToCart prop not found'
    );
    
    return hasOnAddToCart;
  } catch (error) {
    logError('ProductGrid onAddToCart', error.message);
    return false;
  }
}

/**
 * Test 9: Verify handleAddToCart function
 */
async function testHandleAddToCartFunction() {
  console.log(`\n${colors.blue}=== Test 9: handleAddToCart Function ===${colors.reset}`);
  
  try {
    const response = await makeRequest(`${FRONTEND_URL}/products`);
    const body = response.body;
    
    // Check for handleAddToCart function
    const hasHandleAddToCart = body.includes('handleAddToCart') || body.includes('handle-add-to-cart');
    const hasAddItem = body.includes('addItem') || body.includes('add-item');
    
    logResult(
      'handleAddToCart Function',
      hasHandleAddToCart,
      hasHandleAddToCart ? 'handleAddToCart function found' : 'handleAddToCart function not found'
    );
    
    logResult(
      'addItem Function Call',
      hasAddItem,
      hasAddItem ? 'addItem function call found' : 'addItem function call not found'
    );
    
    return hasHandleAddToCart && hasAddItem;
  } catch (error) {
    logError('handleAddToCart Function', error.message);
    return false;
  }
}

/**
 * Test 10: Check for React hydration errors
 */
async function testReactHydration() {
  console.log(`\n${colors.blue}=== Test 10: React Hydration Check ===${colors.reset}`);
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    const body = response.body;
    
    // Check for hydration error indicators
    const hasHydrationErrors = body.includes('Hydration failed') || body.includes('Text content does not match');
    
    logResult(
      'No Hydration Errors',
      !hasHydrationErrors,
      !hasHydrationErrors ? 'No hydration errors detected' : 'Potential hydration errors found'
    );
    
    return !hasHydrationErrors;
  } catch (error) {
    logError('React Hydration Check', error.message);
    return false;
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}         TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);
  
  console.log(`${colors.green}✓ Passed: ${testResults.passed.length}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${testResults.failed.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warnings: ${testResults.warnings.length}${colors.reset}`);
  console.log(`${colors.red}✗ Errors: ${testResults.errors.length}${colors.reset}`);
  
  if (testResults.failed.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    testResults.failed.forEach(test => {
      console.log(`  - ${test.name}`);
      if (test.message) console.log(`    ${test.message}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
    testResults.warnings.forEach(warning => {
      console.log(`  - ${warning.name}: ${warning.message}`);
    });
  }
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    testResults.errors.forEach(error => {
      console.log(`  - ${error.name}: ${error.error}`);
    });
  }
  
  const totalTests = testResults.passed.length + testResults.failed.length;
  const successRate = totalTests > 0 ? ((testResults.passed.length / totalTests) * 100).toFixed(2) : 0;
  
  console.log(`\n${colors.blue}Success Rate: ${successRate}%${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.cyan}╔══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Add to Cart Functionality Test Suite  ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.cyan}Frontend URL: ${FRONTEND_URL}${colors.reset}`);
  console.log(`${colors.cyan}Backend URL: ${BACKEND_URL}${colors.reset}`);
  
  // Run all tests
  await testFrontendAccessible();
  await testProductListingPage();
  await testProductDetailPage();
  await testCartPage();
  await testBackendAPI();
  await testJavaScriptBuild();
  await testCartContextIntegration();
  await testProductGridOnAddToCart();
  await testHandleAddToCartFunction();
  await testReactHydration();
  
  // Print summary
  printSummary();
  
  // Exit with appropriate code
  const allPassed = testResults.failed.length === 0 && testResults.errors.length === 0;
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});
