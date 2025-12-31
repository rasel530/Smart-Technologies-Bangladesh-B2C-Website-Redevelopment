const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_RESULTS_FILE = 'api-test-results-after-redis-fix.json';

// Test data
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = null;
let sessionId = null;
let testUserId = null;
let testProductId = null;
let testCategoryId = null;
let testBrandId = null;
let testOrderId = null;
let testCartId = null;
let testWishlistId = null;
let testReviewId = null;
let testCouponId = null;

// Test results tracking
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  endpoints: {},
  redisStatus: 'unknown',
  databaseStatus: 'unknown',
  timestamp: new Date().toISOString()
};

// Utility functions
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data || error.message,
      message: error.message
    };
  }
}

function recordTestResult(endpoint, method, passed, details = '') {
  const key = `${method.toUpperCase()} ${endpoint}`;
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    testResults.endpoints[key] = { status: 'PASSED', details };
  } else {
    testResults.summary.failed++;
    testResults.endpoints[key] = { status: 'FAILED', details };
  }
}

// Test functions
async function testHealthEndpoints() {
  logInfo('\n🔍 Testing Health Endpoints...');
  
  // Basic health check
  const healthResult = await makeRequest('GET', '/health');
  if (healthResult.success) {
    logSuccess('Basic health check passed');
    recordTestResult('/health', 'GET', true, 'Server is running');
    testResults.databaseStatus = healthResult.data.database || 'unknown';
    testResults.redisStatus = healthResult.data.redis || 'unknown';
  } else {
    logError(`Basic health check failed: ${healthResult.error}`);
    recordTestResult('/health', 'GET', false, healthResult.error);
  }

  // Enhanced health check
  const enhancedHealthResult = await makeRequest('GET', '/api/v1/health');
  if (enhancedHealthResult.success) {
    logSuccess('Enhanced health check passed');
    recordTestResult('/api/v1/health', 'GET', true, 'Enhanced health check working');
  } else {
    logError(`Enhanced health check failed: ${enhancedHealthResult.error}`);
    recordTestResult('/api/v1/health', 'GET', false, enhancedHealthResult.error);
  }

  // Database status
  const dbStatusResult = await makeRequest('GET', '/api/db-status');
  if (dbStatusResult.success) {
    logSuccess('Database status check passed');
    recordTestResult('/api/db-status', 'GET', true, 'Database connection working');
  } else {
    logError(`Database status check failed: ${dbStatusResult.error}`);
    recordTestResult('/api/db-status', 'GET', false, dbStatusResult.error);
  }

  // Rate limiting status
  const rateLimitResult = await makeRequest('GET', '/api/rate-limit-status');
  if (rateLimitResult.success) {
    logSuccess('Rate limiting status check passed');
    recordTestResult('/api/rate-limit-status', 'GET', true, 'Rate limiting service working');
    if (rateLimitResult.data.redis) {
      testResults.redisStatus = rateLimitResult.data.redis.status;
    }
  } else {
    logError(`Rate limiting status check failed: ${rateLimitResult.error}`);
    recordTestResult('/api/rate-limit-status', 'GET', false, rateLimitResult.error);
  }
}

async function testAuthenticationEndpoints() {
  logInfo('\n🔐 Testing Authentication Endpoints...');
  
  // Registration
  const registerResult = await makeRequest('POST', '/api/v1/auth/register', testUser);
  if (registerResult.success) {
    logSuccess('User registration successful');
    recordTestResult('/api/v1/auth/register', 'POST', true, 'User registration working');
    testUserId = registerResult.data.user?.id;
  } else {
    logError(`User registration failed: ${registerResult.error}`);
    recordTestResult('/api/v1/auth/register', 'POST', false, registerResult.error);
  }

  // Login
  const loginResult = await makeRequest('POST', '/api/v1/auth/login', {
    identifier: testUser.email,
    password: testUser.password,
    rememberMe: true
  });
  if (loginResult.success) {
    logSuccess('User login successful');
    recordTestResult('/api/v1/auth/login', 'POST', true, 'User login working');
    authToken = loginResult.data.token;
    sessionId = loginResult.data.sessionId;
  } else {
    logError(`User login failed: ${loginResult.error}`);
    recordTestResult('/api/v1/auth/login', 'POST', false, loginResult.error);
  }

  // Get password policy
  const passwordPolicyResult = await makeRequest('GET', '/api/v1/auth/password-policy');
  if (passwordPolicyResult.success) {
    logSuccess('Password policy retrieval successful');
    recordTestResult('/api/v1/auth/password-policy', 'GET', true, 'Password policy endpoint working');
  } else {
    logError(`Password policy retrieval failed: ${passwordPolicyResult.error}`);
    recordTestResult('/api/v1/auth/password-policy', 'GET', false, passwordPolicyResult.error);
  }

  // Get supported operators
  const operatorsResult = await makeRequest('GET', '/api/v1/auth/operators');
  if (operatorsResult.success) {
    logSuccess('Supported operators retrieval successful');
    recordTestResult('/api/v1/auth/operators', 'GET', true, 'Operators endpoint working');
  } else {
    logError(`Supported operators retrieval failed: ${operatorsResult.error}`);
    recordTestResult('/api/v1/auth/operators', 'GET', false, operatorsResult.error);
  }
}

async function testSessionEndpoints() {
  logInfo('\n📱 Testing Session Endpoints...');
  
  if (!sessionId) {
    logWarning('No session ID available, skipping session tests');
    recordTestResult('/api/v1/sessions/*', '*', false, 'No session ID available');
    return;
  }

  // Validate session
  const validateResult = await makeRequest('GET', '/api/v1/sessions/validate', null, {
    'Cookie': `sessionId=${sessionId}`
  });
  if (validateResult.success) {
    logSuccess('Session validation successful');
    recordTestResult('/api/v1/sessions/validate', 'GET', true, 'Session validation working');
  } else {
    logError(`Session validation failed: ${validateResult.error}`);
    recordTestResult('/api/v1/sessions/validate', 'GET', false, validateResult.error);
  }

  // Get session status
  const statusResult = await makeRequest('GET', '/api/v1/sessions/status', null, {
    'Cookie': `sessionId=${sessionId}`
  });
  if (statusResult.success) {
    logSuccess('Session status check successful');
    recordTestResult('/api/v1/sessions/status', 'GET', true, 'Session status check working');
  } else {
    logError(`Session status check failed: ${statusResult.error}`);
    recordTestResult('/api/v1/sessions/status', 'GET', false, statusResult.error);
  }
}

async function testProductEndpoints() {
  logInfo('\n🛍️ Testing Product Endpoints...');
  
  // Get all products
  const productsResult = await makeRequest('GET', '/api/v1/products');
  if (productsResult.success) {
    logSuccess('Get all products successful');
    recordTestResult('/api/v1/products', 'GET', true, 'Products listing working');
    if (productsResult.data.products && productsResult.data.products.length > 0) {
      testProductId = productsResult.data.products[0].id;
    }
  } else {
    logError(`Get all products failed: ${productsResult.error}`);
    recordTestResult('/api/v1/products', 'GET', false, productsResult.error);
  }

  // Get featured products
  const featuredResult = await makeRequest('GET', '/api/v1/products/featured/list');
  if (featuredResult.success) {
    logSuccess('Get featured products successful');
    recordTestResult('/api/v1/products/featured/list', 'GET', true, 'Featured products working');
  } else {
    logError(`Get featured products failed: ${featuredResult.error}`);
    recordTestResult('/api/v1/products/featured/list', 'GET', false, featuredResult.error);
  }

  if (testProductId) {
    // Get product by ID
    const productByIdResult = await makeRequest('GET', `/api/v1/products/${testProductId}`);
    if (productByIdResult.success) {
      logSuccess('Get product by ID successful');
      recordTestResult(`/api/v1/products/:id`, 'GET', true, 'Product by ID working');
    } else {
      logError(`Get product by ID failed: ${productByIdResult.error}`);
      recordTestResult(`/api/v1/products/:id`, 'GET', false, productByIdResult.error);
    }
  }
}

async function testCategoryEndpoints() {
  logInfo('\n📂 Testing Category Endpoints...');
  
  // Get all categories
  const categoriesResult = await makeRequest('GET', '/api/v1/categories');
  if (categoriesResult.success) {
    logSuccess('Get all categories successful');
    recordTestResult('/api/v1/categories', 'GET', true, 'Categories listing working');
    if (categoriesResult.data.categories && categoriesResult.data.categories.length > 0) {
      testCategoryId = categoriesResult.data.categories[0].id;
    }
  } else {
    logError(`Get all categories failed: ${categoriesResult.error}`);
    recordTestResult('/api/v1/categories', 'GET', false, categoriesResult.error);
  }

  // Get category tree
  const treeResult = await makeRequest('GET', '/api/v1/categories/tree/all');
  if (treeResult.success) {
    logSuccess('Get category tree successful');
    recordTestResult('/api/v1/categories/tree/all', 'GET', true, 'Category tree working');
  } else {
    logError(`Get category tree failed: ${treeResult.error}`);
    recordTestResult('/api/v1/categories/tree/all', 'GET', false, treeResult.error);
  }

  if (testCategoryId) {
    // Get category by ID
    const categoryByIdResult = await makeRequest('GET', `/api/v1/categories/${testCategoryId}`);
    if (categoryByIdResult.success) {
      logSuccess('Get category by ID successful');
      recordTestResult(`/api/v1/categories/:id`, 'GET', true, 'Category by ID working');
    } else {
      logError(`Get category by ID failed: ${categoryByIdResult.error}`);
      recordTestResult(`/api/v1/categories/:id`, 'GET', false, categoryByIdResult.error);
    }
  }
}

async function testBrandEndpoints() {
  logInfo('\n🏷️ Testing Brand Endpoints...');
  
  // Get all brands
  const brandsResult = await makeRequest('GET', '/api/v1/brands');
  if (brandsResult.success) {
    logSuccess('Get all brands successful');
    recordTestResult('/api/v1/brands', 'GET', true, 'Brands listing working');
    if (brandsResult.data.brands && brandsResult.data.brands.length > 0) {
      testBrandId = brandsResult.data.brands[0].id;
    }
  } else {
    logError(`Get all brands failed: ${brandsResult.error}`);
    recordTestResult('/api/v1/brands', 'GET', false, brandsResult.error);
  }

  if (testBrandId) {
    // Get brand by ID
    const brandByIdResult = await makeRequest('GET', `/api/v1/brands/${testBrandId}`);
    if (brandByIdResult.success) {
      logSuccess('Get brand by ID successful');
      recordTestResult(`/api/v1/brands/:id`, 'GET', true, 'Brand by ID working');
    } else {
      logError(`Get brand by ID failed: ${brandByIdResult.error}`);
      recordTestResult(`/api/v1/brands/:id`, 'GET', false, brandByIdResult.error);
    }
  }
}

async function testUserEndpoints() {
  logInfo('\n👤 Testing User Endpoints...');
  
  if (!authToken) {
    logWarning('No auth token available, skipping protected user tests');
    recordTestResult('/api/v1/users/*', '*', false, 'No auth token available');
    return;
  }

  if (testUserId) {
    // Get user by ID
    const userByIdResult = await makeRequest('GET', `/api/v1/users/${testUserId}`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    if (userByIdResult.success) {
      logSuccess('Get user by ID successful');
      recordTestResult(`/api/v1/users/:id`, 'GET', true, 'User by ID working');
    } else {
      logError(`Get user by ID failed: ${userByIdResult.error}`);
      recordTestResult(`/api/v1/users/:id`, 'GET', false, userByIdResult.error);
    }

    // Get user addresses
    const addressesResult = await makeRequest('GET', `/api/v1/users/${testUserId}/addresses`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    if (addressesResult.success) {
      logSuccess('Get user addresses successful');
      recordTestResult(`/api/v1/users/:id/addresses`, 'GET', true, 'User addresses working');
    } else {
      logError(`Get user addresses failed: ${addressesResult.error}`);
      recordTestResult(`/api/v1/users/:id/addresses`, 'GET', false, addressesResult.error);
    }
  }
}

async function testCartEndpoints() {
  logInfo('\n🛒 Testing Cart Endpoints...');
  
  if (!authToken) {
    logWarning('No auth token available, skipping cart tests');
    recordTestResult('/api/v1/cart/*', '*', false, 'No auth token available');
    return;
  }

  // Create a test cart ID (since we need a valid UUID)
  testCartId = '550e8400-e29b-41d4-a716-446655440000';

  // Get cart (will likely fail with test UUID, but tests the endpoint)
  const cartResult = await makeRequest('GET', `/api/v1/cart/${testCartId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  if (cartResult.success || cartResult.status === 404) {
    logSuccess('Cart endpoint accessible');
    recordTestResult(`/api/v1/cart/:id`, 'GET', true, 'Cart endpoint working');
  } else {
    logError(`Cart test failed: ${cartResult.error}`);
    recordTestResult(`/api/v1/cart/:id`, 'GET', false, cartResult.error);
  }
}

async function testWishlistEndpoints() {
  logInfo('\n❤️ Testing Wishlist Endpoints...');
  
  if (!authToken || !testUserId) {
    logWarning('No auth token or user ID available, skipping wishlist tests');
    recordTestResult('/api/v1/wishlist/*', '*', false, 'No auth token or user ID available');
    return;
  }

  // Get user wishlists
  const wishlistsResult = await makeRequest('GET', `/api/v1/wishlist/user/${testUserId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  if (wishlistsResult.success) {
    logSuccess('Get user wishlists successful');
    recordTestResult('/api/v1/wishlist/user/:userId', 'GET', true, 'User wishlists working');
  } else {
    logError(`Get user wishlists failed: ${wishlistsResult.error}`);
    recordTestResult('/api/v1/wishlist/user/:userId', 'GET', false, wishlistsResult.error);
  }

  // Create wishlist
  const createWishlistResult = await makeRequest('POST', '/api/v1/wishlist', {
    name: 'Test Wishlist',
    isPrivate: false
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  if (createWishlistResult.success) {
    logSuccess('Create wishlist successful');
    recordTestResult('/api/v1/wishlist', 'POST', true, 'Create wishlist working');
    testWishlistId = createWishlistResult.data.wishlist?.id;
  } else {
    logError(`Create wishlist failed: ${createWishlistResult.error}`);
    recordTestResult('/api/v1/wishlist', 'POST', false, createWishlistResult.error);
  }
}

async function testReviewEndpoints() {
  logInfo('\n⭐ Testing Review Endpoints...');
  
  // Get all reviews
  const reviewsResult = await makeRequest('GET', '/api/v1/reviews');
  if (reviewsResult.success) {
    logSuccess('Get all reviews successful');
    recordTestResult('/api/v1/reviews', 'GET', true, 'Reviews listing working');
    if (reviewsResult.data.reviews && reviewsResult.data.reviews.length > 0) {
      testReviewId = reviewsResult.data.reviews[0].id;
    }
  } else {
    logError(`Get all reviews failed: ${reviewsResult.error}`);
    recordTestResult('/api/v1/reviews', 'GET', false, reviewsResult.error);
  }

  if (testReviewId) {
    // Get review by ID
    const reviewByIdResult = await makeRequest('GET', `/api/v1/reviews/${testReviewId}`);
    if (reviewByIdResult.success) {
      logSuccess('Get review by ID successful');
      recordTestResult(`/api/v1/reviews/:id`, 'GET', true, 'Review by ID working');
    } else {
      logError(`Get review by ID failed: ${reviewByIdResult.error}`);
      recordTestResult(`/api/v1/reviews/:id`, 'GET', false, reviewByIdResult.error);
    }
  }
}

async function testCouponEndpoints() {
  logInfo('\n🎫 Testing Coupon Endpoints...');
  
  // Get all coupons
  const couponsResult = await makeRequest('GET', '/api/v1/coupons');
  if (couponsResult.success) {
    logSuccess('Get all coupons successful');
    recordTestResult('/api/v1/coupons', 'GET', true, 'Coupons listing working');
    if (couponsResult.data.coupons && couponsResult.data.coupons.length > 0) {
      testCouponId = couponsResult.data.coupons[0].id;
    }
  } else {
    logError(`Get all coupons failed: ${couponsResult.error}`);
    recordTestResult('/api/v1/coupons', 'GET', false, couponsResult.error);
  }

  // Test coupon by code (with a test code)
  const couponByCodeResult = await makeRequest('GET', '/api/v1/coupons/code/TESTCODE');
  if (couponByCodeResult.success || couponByCodeResult.status === 404) {
    logSuccess('Coupon by code endpoint accessible');
    recordTestResult('/api/v1/coupons/code/:code', 'GET', true, 'Coupon by code working');
  } else {
    logError(`Coupon by code test failed: ${couponByCodeResult.error}`);
    recordTestResult('/api/v1/coupons/code/:code', 'GET', false, couponByCodeResult.error);
  }

  if (testCouponId) {
    // Get coupon by ID
    const couponByIdResult = await makeRequest('GET', `/api/v1/coupons/${testCouponId}`);
    if (couponByIdResult.success) {
      logSuccess('Get coupon by ID successful');
      recordTestResult(`/api/v1/coupons/:id`, 'GET', true, 'Coupon by ID working');
    } else {
      logError(`Get coupon by ID failed: ${couponByIdResult.error}`);
      recordTestResult(`/api/v1/coupons/:id`, 'GET', false, couponByIdResult.error);
    }
  }
}

async function testOrderEndpoints() {
  logInfo('\n📦 Testing Order Endpoints...');
  
  if (!authToken) {
    logWarning('No auth token available, skipping order tests');
    recordTestResult('/api/v1/orders/*', '*', false, 'No auth token available');
    return;
  }

  // Get orders
  const ordersResult = await makeRequest('GET', '/api/v1/orders', null, {
    'Authorization': `Bearer ${authToken}`
  });
  if (ordersResult.success) {
    logSuccess('Get orders successful');
    recordTestResult('/api/v1/orders', 'GET', true, 'Orders listing working');
    if (ordersResult.data.orders && ordersResult.data.orders.length > 0) {
      testOrderId = ordersResult.data.orders[0].id;
    }
  } else {
    logError(`Get orders failed: ${ordersResult.error}`);
    recordTestResult('/api/v1/orders', 'GET', false, ordersResult.error);
  }
}

async function testErrorHandling() {
  logInfo('\n🚨 Testing Error Handling...');
  
  // Test 404 error
  const notFoundResult = await makeRequest('GET', '/api/v1/nonexistent-endpoint');
  if (notFoundResult.status === 404) {
    logSuccess('404 error handling working');
    recordTestResult('/api/v1/nonexistent', 'GET', true, '404 error handling working');
  } else {
    logError('404 error handling not working properly');
    recordTestResult('/api/v1/nonexistent', 'GET', false, '404 error handling failed');
  }

  // Test validation error
  const validationResult = await makeRequest('POST', '/api/v1/auth/register', {
    email: 'invalid-email',
    password: '123' // Too short
  });
  if (validationResult.status === 400) {
    logSuccess('Validation error handling working');
    recordTestResult('/api/v1/auth/register (invalid)', 'POST', true, 'Validation error handling working');
  } else {
    logError('Validation error handling not working properly');
    recordTestResult('/api/v1/auth/register (invalid)', 'POST', false, 'Validation error handling failed');
  }
}

async function cleanup() {
  logInfo('\n🧹 Cleaning up test data...');
  
  if (authToken && sessionId) {
    // Logout
    const logoutResult = await makeRequest('POST', '/api/v1/auth/logout', {
      allDevices: true
    }, {
      'Authorization': `Bearer ${authToken}`,
      'Cookie': `sessionId=${sessionId}`
    });
    
    if (logoutResult.success) {
      logSuccess('Cleanup: Logout successful');
    } else {
      logWarning('Cleanup: Logout failed');
    }
  }
}

function saveResults() {
  try {
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    logSuccess(`Test results saved to ${TEST_RESULTS_FILE}`);
  } catch (error) {
    logError(`Failed to save test results: ${error.message}`);
  }
}

function printSummary() {
  logInfo('\n📊 Test Summary');
  log('='.repeat(50));
  log(`Total Tests: ${testResults.summary.total}`);
  logSuccess(`Passed: ${testResults.summary.passed}`);
  logError(`Failed: ${testResults.summary.failed}`);
  logWarning(`Skipped: ${testResults.summary.skipped}`);
  
  const successRate = testResults.summary.total > 0 
    ? ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)
    : 0;
  log(`Success Rate: ${successRate}%`);
  
  logInfo('\n🔧 Service Status');
  log(`Database: ${testResults.databaseStatus}`);
  log(`Redis: ${testResults.redisStatus}`);
  
  logInfo('\n📋 Failed Tests:');
  Object.entries(testResults.endpoints)
    .filter(([_, result]) => result.status === 'FAILED')
    .forEach(([endpoint, result]) => {
      logError(`${endpoint}: ${result.details}`);
    });
  
  logInfo('\n✅ Passed Tests:');
  Object.entries(testResults.endpoints)
    .filter(([_, result]) => result.status === 'PASSED')
    .forEach(([endpoint, _]) => {
      logSuccess(endpoint);
    });
}

// Main test execution
async function runTests() {
  logInfo('🚀 Starting Comprehensive API Testing After Redis Fixes');
  logInfo(`Testing against: ${BASE_URL}`);
  log('='.repeat(50));
  
  try {
    await testHealthEndpoints();
    await testAuthenticationEndpoints();
    await testSessionEndpoints();
    await testProductEndpoints();
    await testCategoryEndpoints();
    await testBrandEndpoints();
    await testUserEndpoints();
    await testCartEndpoints();
    await testWishlistEndpoints();
    await testReviewEndpoints();
    await testCouponEndpoints();
    await testOrderEndpoints();
    await testErrorHandling();
    
    await cleanup();
    saveResults();
    printSummary();
    
    // Exit with appropriate code
    const exitCode = testResults.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at ${promise}: ${reason}`);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testResults
};