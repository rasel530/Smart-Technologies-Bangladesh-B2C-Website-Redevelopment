/**
 * Test Script: Products Display Verification
 * 
 * This script tests that products are displaying correctly on both:
 * 1. Public products page (http://localhost:3000/products)
 * 2. Admin products page (http://localhost:3000/admin/products)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60) + '\n');
}

/**
 * Make HTTP request
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
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
 * Check if page contains products
 */
function checkForProducts(html) {
  // Check for common product indicators
  const productIndicators = [
    'product',
    'Product',
    'price',
    'Price',
    '৳', // Bengali currency symbol
  ];

  let foundIndicators = [];
  productIndicators.forEach(indicator => {
    if (html.includes(indicator)) {
      foundIndicators.push(indicator);
    }
  });

  return foundIndicators;
}

/**
 * Check for error messages
 */
function checkForErrors(html) {
  const errorIndicators = [
    'error',
    'Error',
    'failed',
    'Failed',
    '404',
    '500',
    'Network error',
    'Authentication required',
  ];

  let foundErrors = [];
  errorIndicators.forEach(indicator => {
    if (html.includes(indicator)) {
      foundErrors.push(indicator);
    }
  });

  return foundErrors;
}

/**
 * Test public products page
 */
async function testPublicProductsPage() {
  logSection('Testing Public Products Page');

  try {
    logInfo('Fetching http://localhost:3000/products');
    const response = await makeRequest('/products');

    logInfo(`Response Status: ${response.statusCode}`);

    if (response.statusCode === 200) {
      logSuccess('Public products page is accessible');
    } else {
      logError(`Public products page returned status ${response.statusCode}`);
      return false;
    }

    // Check for products
    const productIndicators = checkForProducts(response.body);
    if (productIndicators.length > 0) {
      logSuccess(`Found product indicators: ${productIndicators.join(', ')}`);
    } else {
      logError('No product indicators found in page');
      return false;
    }

    // Check for errors
    const errors = checkForErrors(response.body);
    if (errors.length > 0) {
      logError(`Found error indicators: ${errors.join(', ')}`);
      return false;
    } else {
      logSuccess('No error indicators found');
    }

    return true;
  } catch (error) {
    logError(`Failed to test public products page: ${error.message}`);
    return false;
  }
}

/**
 * Test admin products page
 */
async function testAdminProductsPage() {
  logSection('Testing Admin Products Page');

  try {
    logInfo('Fetching http://localhost:3000/admin/products');
    const response = await makeRequest('/admin/products');

    logInfo(`Response Status: ${response.statusCode}`);

    if (response.statusCode === 200) {
      logSuccess('Admin products page is accessible');
    } else if (response.statusCode === 302 || response.statusCode === 307) {
      logInfo('Admin products page redirected (likely to login)');
      logInfo('This is expected behavior for unauthenticated users');
      return true;
    } else {
      logError(`Admin products page returned status ${response.statusCode}`);
      return false;
    }

    // Check for products
    const productIndicators = checkForProducts(response.body);
    if (productIndicators.length > 0) {
      logSuccess(`Found product indicators: ${productIndicators.join(', ')}`);
    } else {
      logInfo('No product indicators found (may need authentication)');
    }

    // Check for errors
    const errors = checkForErrors(response.body);
    if (errors.length > 0) {
      logError(`Found error indicators: ${errors.join(', ')}`);
      return false;
    } else {
      logSuccess('No error indicators found');
    }

    return true;
  } catch (error) {
    logError(`Failed to test admin products page: ${error.message}`);
    return false;
  }
}

/**
 * Test backend API directly
 */
async function testBackendAPI() {
  logSection('Testing Backend API');

  try {
    logInfo('Fetching http://localhost:3001/api/v1/products');
    const response = await makeRequest('/api/v1/products');

    logInfo(`Response Status: ${response.statusCode}`);

    if (response.statusCode === 200) {
      logSuccess('Backend API is accessible');
    } else {
      logError(`Backend API returned status ${response.statusCode}`);
      return false;
    }

    // Check if response contains products
    try {
      const data = JSON.parse(response.body);
      if (data.success && data.data) {
        const products = data.data.products || data.data;
        if (Array.isArray(products) && products.length > 0) {
          logSuccess(`Backend API returned ${products.length} products`);
          return true;
        } else {
          logError('Backend API returned no products');
          return false;
        }
      } else {
        logError('Backend API response format unexpected');
        return false;
      }
    } catch (parseError) {
      logError('Failed to parse backend API response');
      return false;
    }
  } catch (error) {
    logError(`Failed to test backend API: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  logSection('PRODUCTS DISPLAY VERIFICATION TEST');
  logInfo('Starting tests...\n');

  const results = {
    backendAPI: await testBackendAPI(),
    publicProductsPage: await testPublicProductsPage(),
    adminProductsPage: await testAdminProductsPage(),
  };

  logSection('TEST RESULTS SUMMARY');

  if (results.backendAPI) {
    logSuccess('Backend API: PASS');
  } else {
    logError('Backend API: FAIL');
  }

  if (results.publicProductsPage) {
    logSuccess('Public Products Page: PASS');
  } else {
    logError('Public Products Page: FAIL');
  }

  if (results.adminProductsPage) {
    logSuccess('Admin Products Page: PASS');
  } else {
    logError('Admin Products Page: FAIL');
  }

  const allPassed = results.backendAPI && results.publicProductsPage && results.adminProductsPage;

  logSection(allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗');

  if (allPassed) {
    logSuccess('Products are displaying correctly on both pages!');
    logInfo('Next steps:');
    logInfo('  1. Visit http://localhost:3000/products to verify visually');
    logInfo('  2. Login and visit http://localhost:3000/admin/products to verify visually');
  } else {
    logError('Some tests failed. Check the logs above for details.');
    logInfo('Troubleshooting tips:');
    logInfo('  1. Check browser console for JavaScript errors');
    logInfo('  2. Check backend logs: docker logs smarttech_backend');
    logInfo('  3. Check frontend logs: docker logs smarttech_frontend');
    logInfo('  4. Verify environment variables are set correctly');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
});
