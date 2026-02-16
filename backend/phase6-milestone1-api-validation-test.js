/**
 * Phase 6, Milestone 1: Shopping Cart Foundation - Comprehensive API Validation Test
 * 
 * This test file validates ALL API endpoints for the Shopping Cart Foundation:
 * - Cart CRUD operations (10 endpoints)
 * - Admin cart operations (13 endpoints)
 * - Analytics endpoints (5 endpoints)
 * 
 * Validation includes:
 * - Correct HTTP method
 * - Proper authentication/authorization
 * - Input validation
 * - Error handling
 * - Response structure
 * - Response time (<500ms requirement)
 * - Bilingual error messages
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  identifier: 'raselbepari88@gmail.com',
  password: '74Vfo^71~_oY',
  firstName: 'API',
  lastName: 'Validation'
};

const TEST_ADMIN = {
  identifier: 'admin@smarttech.com',
  password: 'AdminPassword123'
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  endpoints: {
    cart: { total: 10, passed: 0, failed: 0, skipped: 0 },
    admin: { total: 13, passed: 0, failed: 0, skipped: 0 },
    analytics: { total: 5, passed: 0, failed: 0, skipped: 0 }
  },
  performance: {
    fast: 0,    // <200ms
    normal: 0,  // 200-500ms
    slow: 0,    // >500ms
    verySlow: 0 // >1000ms
  }
};

// Helper function to log test results
function logTest(testName, passed, details = {}) {
  const result = {
    testName,
    passed,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
    if (details.responseTime) {
      const time = details.responseTime;
      if (time < 200) {
        testResults.performance.fast++;
        console.log(`   ⚡ Response time: ${time}ms (FAST)`);
      } else if (time < 500) {
        testResults.performance.normal++;
        console.log(`   ⏱️ Response time: ${time}ms (NORMAL)`);
      } else if (time < 1000) {
        testResults.performance.slow++;
        console.log(`   ⏰ Response time: ${time}ms (SLOW - exceeds 500ms)`);
      } else {
        testResults.performance.verySlow++;
        console.log(`   🐌 Response time: ${time}ms (VERY SLOW)`);
      }
    }
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName}`);
    if (details.error) {
      console.log(`   Error: ${details.error}`);
    }
    if (details.expected) {
      console.log(`   Expected: ${details.expected}`);
    }
    if (details.actual) {
      console.log(`   Actual: ${details.actual}`);
    }
  }
}

// Helper function to track endpoint category results
function trackEndpointResult(category, passed, skipped = false) {
  if (skipped) {
    testResults.endpoints[category].skipped++;
    testResults.skipped++;
  } else if (passed) {
    testResults.endpoints[category].passed++;
  } else {
    testResults.endpoints[category].failed++;
  }
}

// Helper function to make API requests with timing
async function apiRequest(method, endpoint, data = null, headers = {}, timeout = 5000) {
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    return { 
      success: true, 
      data: response.data, 
      status: response.status,
      responseTime 
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
      responseTime
    };
  }
}

// Helper function to validate response structure
function validateResponseStructure(data, requiredFields) {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      missingFields.push(field);
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

// Helper function to validate bilingual messages
function validateBilingualMessages(data) {
  const hasMessage = 'message' in data && data.message !== null && data.message !== '';
  const hasMessageBn = 'messageBn' in data && data.messageBn !== null && data.messageBn !== '';
  
  return {
    valid: hasMessage && hasMessageBn,
    hasMessage,
    hasMessageBn,
    message: data.message,
    messageBn: data.messageBn
  };
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

async function registerOrLoginUser() {
  console.log('\n🔐 Setting up test user...');
  
  // Try to register
  const registerResult = await apiRequest('POST', '/auth/register', TEST_USER);
  
  if (registerResult.success && registerResult.data.success) {
    console.log('✅ User registered successfully');
    return registerResult.data.data?.user?.id;
  }
  
  // Try to login if registration failed (user might already exist)
  const loginResult = await apiRequest('POST', '/auth/login', {
    identifier: TEST_USER.identifier,
    password: TEST_USER.password
  });
  
  if (loginResult.success && loginResult.data.success) {
    console.log('✅ User logged in successfully');
    return loginResult.data.data?.token;
  }
  
  console.log('❌ Failed to authenticate user');
  return null;
}

async function loginAdmin() {
  console.log('\n🔐 Setting up admin user...');
  
  const result = await apiRequest('POST', '/auth/login', {
    identifier: TEST_ADMIN.identifier,
    password: TEST_ADMIN.password
  });
  
  if (result.success && result.data.success) {
    console.log('✅ Admin logged in successfully');
    return result.data.data?.token;
  }
  
  console.log('❌ Failed to authenticate admin');
  return null;
}

// ============================================================================
// PRODUCT HELPERS
// ============================================================================

async function getTestProducts() {
  const result = await apiRequest('GET', '/products?limit=10');
  
  if (result.success && result.data.success) {
    return result.data.data?.products || [];
  }
  
  return [];
}

// ============================================================================
// CART API ENDPOINTS (10 endpoints)
// ============================================================================

// 1. GET /api/v1/cart - Retrieve user's cart
async function testGetCart(token, sessionId = null) {
  console.log('\n📋 Test 1: GET /api/v1/cart - Retrieve user\'s cart');
  
  const headers = sessionId ? { 'x-session-id': sessionId } : { 'Authorization': `Bearer ${token}` };
  const result = await apiRequest('GET', '/cart', null, headers);
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/cart', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartId: result.data.data?.id,
    itemCount: result.data.data?.items?.length,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed ? result.data.data : null;
}

// 2. POST /api/v1/cart/items - Add item to cart
async function testAddCartItem(token, cartId, productId, quantity = 1) {
  console.log('\n➕ Test 2: POST /api/v1/cart/items - Add item to cart');
  
  const result = await apiRequest('POST', '/cart/items', {
    cartId,
    productId,
    quantity
  }, { 'Authorization': `Bearer ${token}` });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('POST /api/v1/cart/items', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartItemId: result.data.data?.id,
    productId,
    quantity,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed ? result.data.data : null;
}

// 3. PUT /api/v1/cart/items/:itemId - Update item quantity
async function testUpdateCartItem(token, cartItemId, quantity) {
  console.log('\n✏️ Test 3: PUT /api/v1/cart/items/:itemId - Update item quantity');
  
  const result = await apiRequest('PUT', `/cart/items/${cartItemId}`, {
    quantity
  }, { 'Authorization': `Bearer ${token}` });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('PUT /api/v1/cart/items/:itemId', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartItemId,
    newQuantity: result.data.data?.quantity,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed ? result.data.data : null;
}

// 4. DELETE /api/v1/cart/items/:itemId - Remove item from cart
async function testDeleteCartItem(token, cartItemId) {
  console.log('\n🗑️ Test 4: DELETE /api/v1/cart/items/:itemId - Remove item from cart');
  
  const result = await apiRequest('DELETE', `/cart/items/${cartItemId}`, null, {
    'Authorization': `Bearer ${token}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('DELETE /api/v1/cart/items/:itemId', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartItemId,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed;
}

// 5. DELETE /api/v1/cart - Clear entire cart
async function testClearCart(token) {
  console.log('\n🧹 Test 5: DELETE /api/v1/cart - Clear entire cart');
  
  const result = await apiRequest('DELETE', '/cart', null, {
    'Authorization': `Bearer ${token}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('DELETE /api/v1/cart', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed;
}

// 6. POST /api/v1/cart/calculate - Calculate cart totals
async function testCalculateCart(token) {
  console.log('\n🧮 Test 6: POST /api/v1/cart/calculate - Calculate cart totals');
  
  const result = await apiRequest('POST', '/cart/calculate', null, {
    'Authorization': `Bearer ${token}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('POST /api/v1/cart/calculate', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    subtotal: result.data.data?.subtotal,
    tax: result.data.data?.tax,
    total: result.data.data?.total,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed ? result.data.data : null;
}

// 7. POST /api/v1/cart/validate - Validate cart items (stock checking)
async function testValidateCart(token) {
  console.log('\n✅ Test 7: POST /api/v1/cart/validate - Validate cart items');
  
  const result = await apiRequest('POST', '/cart/validate', null, {
    'Authorization': `Bearer ${token}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('POST /api/v1/cart/validate', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    isValid: result.data.data?.isValid,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed ? result.data.data : null;
}

// 8. POST /api/v1/cart/:id/share - Generate cart share link
async function testShareCart(token, cartId) {
  console.log('\n🔗 Test 8: POST /api/v1/cart/:id/share - Generate cart share link');
  
  const result = await apiRequest('POST', `/cart/${cartId}/share`, null, {
    'Authorization': `Bearer ${token}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('POST /api/v1/cart/:id/share', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    shareToken: result.data.data?.shareToken,
    shareUrl: result.data.data?.shareUrl,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed ? result.data.data : null;
}

// 9. GET /api/v1/cart/shared/:token - Access shared cart
async function testGetSharedCart(shareToken) {
  console.log('\n🔓 Test 9: GET /api/v1/cart/shared/:token - Access shared cart');
  
  const result = await apiRequest('GET', `/cart/shared/${shareToken}`);
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/cart/shared/:token', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartId: result.data.data?.id,
    itemCount: result.data.data?.items?.length,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed ? result.data.data : null;
}

// 10. POST /api/v1/cart/merge - Merge guest cart on login
async function testMergeCart(token, guestSessionId) {
  console.log('\n🔄 Test 10: POST /api/v1/cart/merge - Merge guest cart on login');
  
  const result = await apiRequest('POST', '/cart/merge', {
    guestSessionId
  }, { 'Authorization': `Bearer ${token}` });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('POST /api/v1/cart/merge', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartId: result.data.data?.cartId,
    mergedItemCount: result.data.data?.mergedItemCount,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('cart', passed);
  return passed ? result.data.data : null;
}

// ============================================================================
// ADMIN CART API ENDPOINTS (13 endpoints)
// ============================================================================

// 11. GET /api/v1/admin/carts - List all carts with filters
async function testAdminListCarts(adminToken, filters = {}) {
  console.log('\n📋 Test 11: GET /api/v1/admin/carts - List all carts with filters');
  
  const queryString = new URLSearchParams(filters).toString();
  const endpoint = queryString ? `/admin/carts?${queryString}` : '/admin/carts';
  
  const result = await apiRequest('GET', endpoint, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/carts', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartCount: result.data.data?.carts?.length || 0,
    total: result.data.data?.total,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 12. GET /api/v1/admin/carts/:id - Get cart details
async function testAdminGetCart(adminToken, cartId) {
  console.log('\n📋 Test 12: GET /api/v1/admin/carts/:id - Get cart details');
  
  const result = await apiRequest('GET', `/admin/carts/${cartId}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/carts/:id', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartId: result.data.data?.id,
    itemCount: result.data.data?.items?.length,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 13. GET /api/v1/admin/carts/:id/items - Get cart items
async function testAdminGetCartItems(adminToken, cartId) {
  console.log('\n📋 Test 13: GET /api/v1/admin/carts/:id/items - Get cart items');
  
  const result = await apiRequest('GET', `/admin/carts/${cartId}/items`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/carts/:id/items', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    itemCount: result.data.data?.items?.length || 0,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 14. PUT /api/v1/admin/carts/:id/items/:itemId - Update cart item
async function testAdminUpdateCartItem(adminToken, cartId, cartItemId, quantity) {
  console.log('\n✏️ Test 14: PUT /api/v1/admin/carts/:id/items/:itemId - Update cart item');
  
  const result = await apiRequest('PUT', `/admin/carts/${cartId}/items/${cartItemId}`, {
    quantity
  }, { 'Authorization': `Bearer ${adminToken}` });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('PUT /api/v1/admin/carts/:id/items/:itemId', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartItemId,
    newQuantity: result.data.data?.quantity,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 15. DELETE /api/v1/admin/carts/:id/items/:itemId - Remove cart item
async function testAdminDeleteCartItem(adminToken, cartId, cartItemId) {
  console.log('\n🗑️ Test 15: DELETE /api/v1/admin/carts/:id/items/:itemId - Remove cart item');
  
  const result = await apiRequest('DELETE', `/admin/carts/${cartId}/items/${cartItemId}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('DELETE /api/v1/admin/carts/:id/items/:itemId', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartItemId,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed;
}

// 16. DELETE /api/v1/admin/carts/:id - Clear cart
async function testAdminClearCart(adminToken, cartId) {
  console.log('\n🧹 Test 16: DELETE /api/v1/admin/carts/:id - Clear cart');
  
  const result = await apiRequest('DELETE', `/admin/carts/${cartId}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('DELETE /api/v1/admin/carts/:id', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartId,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed;
}

// 17. GET /api/v1/admin/cart-analytics - Get cart analytics
async function testAdminCartAnalytics(adminToken) {
  console.log('\n📊 Test 17: GET /api/v1/admin/cart-analytics - Get cart analytics');
  
  const result = await apiRequest('GET', '/admin/cart-analytics', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/cart-analytics', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    totalCarts: result.data.data?.totalCarts,
    activeCarts: result.data.data?.activeCarts,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 18. DELETE /api/v1/admin/carts/expired - Clean up expired carts
async function testAdminDeleteExpiredCarts(adminToken) {
  console.log('\n🗑️ Test 18: DELETE /api/v1/admin/carts/expired - Clean up expired carts');
  
  const result = await apiRequest('DELETE', '/admin/carts/expired', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('DELETE /api/v1/admin/carts/expired', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    deletedCount: result.data.data?.deletedCount,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 19. GET /api/v1/admin/carts/export - Export carts
async function testAdminExportCarts(adminToken) {
  console.log('\n📤 Test 19: GET /api/v1/admin/carts/export - Export carts');
  
  const result = await apiRequest('GET', '/admin/carts/export', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 1000; // Export may take longer
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/carts/export', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    exportUrl: result.data.data?.exportUrl,
    recordCount: result.data.data?.recordCount,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 20. GET /api/v1/admin/carts/:id/export - Export single cart
async function testAdminExportSingleCart(adminToken, cartId) {
  console.log('\n📤 Test 20: GET /api/v1/admin/carts/:id/export - Export single cart');
  
  const result = await apiRequest('GET', `/admin/carts/${cartId}/export`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/carts/:id/export', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    cartId,
    exportUrl: result.data.data?.exportUrl,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 21. DELETE /api/v1/admin/carts/bulk - Bulk delete carts
async function testAdminBulkDeleteCarts(adminToken, cartIds) {
  console.log('\n🗑️ Test 21: DELETE /api/v1/admin/carts/bulk - Bulk delete carts');
  
  const result = await apiRequest('DELETE', '/admin/carts/bulk', {
    cartIds
  }, { 'Authorization': `Bearer ${adminToken}` });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('DELETE /api/v1/admin/carts/bulk', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    deletedCount: result.data.data?.deletedCount,
    requestedCount: cartIds.length,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 22. DELETE /api/v1/admin/carts/bulk/clear - Bulk clear carts
async function testAdminBulkClearCarts(adminToken, cartIds) {
  console.log('\n🧹 Test 22: DELETE /api/v1/admin/carts/bulk/clear - Bulk clear carts');
  
  const result = await apiRequest('DELETE', '/admin/carts/bulk/clear', {
    cartIds
  }, { 'Authorization': `Bearer ${adminToken}` });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('DELETE /api/v1/admin/carts/bulk/clear', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    clearedCount: result.data.data?.clearedCount,
    requestedCount: cartIds.length,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// 23. PUT /api/v1/admin/carts/bulk/status - Bulk update cart status
async function testAdminBulkUpdateCartStatus(adminToken, cartIds, status) {
  console.log('\n✏️ Test 23: PUT /api/v1/admin/carts/bulk/status - Bulk update cart status');
  
  const result = await apiRequest('PUT', '/admin/carts/bulk/status', {
    cartIds,
    status
  }, { 'Authorization': `Bearer ${adminToken}` });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('PUT /api/v1/admin/carts/bulk/status', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    updatedCount: result.data.data?.updatedCount,
    requestedCount: cartIds.length,
    status,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('admin', passed);
  return passed ? result.data.data : null;
}

// ============================================================================
// ANALYTICS API ENDPOINTS (5 endpoints)
// ============================================================================

// 24. GET /api/v1/admin/cart-analytics/conversion - Cart conversion rates
async function testAnalyticsConversion(adminToken, period = '7d') {
  console.log('\n📈 Test 24: GET /api/v1/admin/cart-analytics/conversion - Cart conversion rates');
  
  const result = await apiRequest('GET', `/admin/cart-analytics/conversion?period=${period}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/cart-analytics/conversion', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    conversionRate: result.data.data?.conversionRate,
    period,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('analytics', passed);
  return passed ? result.data.data : null;
}

// 25. GET /api/v1/admin/cart-analytics/average-value - Average cart value
async function testAnalyticsAverageValue(adminToken, period = '7d') {
  console.log('\n💰 Test 25: GET /api/v1/admin/cart-analytics/average-value - Average cart value');
  
  const result = await apiRequest('GET', `/admin/cart-analytics/average-value?period=${period}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/cart-analytics/average-value', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    averageValue: result.data.data?.averageValue,
    period,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('analytics', passed);
  return passed ? result.data.data : null;
}

// 26. GET /api/v1/admin/cart-analytics/abandonment - Cart abandonment rates
async function testAnalyticsAbandonment(adminToken, period = '7d') {
  console.log('\n📉 Test 26: GET /api/v1/admin/cart-analytics/abandonment - Cart abandonment rates');
  
  const result = await apiRequest('GET', `/admin/cart-analytics/abandonment?period=${period}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/cart-analytics/abandonment', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    abandonmentRate: result.data.data?.abandonmentRate,
    period,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('analytics', passed);
  return passed ? result.data.data : null;
}

// 27. GET /api/v1/admin/cart-analytics/popular-products - Popular products in carts
async function testAnalyticsPopularProducts(adminToken, limit = 10) {
  console.log('\n🏆 Test 27: GET /api/v1/admin/cart-analytics/popular-products - Popular products in carts');
  
  const result = await apiRequest('GET', `/admin/cart-analytics/popular-products?limit=${limit}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/cart-analytics/popular-products', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    productCount: result.data.data?.products?.length || 0,
    limit,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('analytics', passed);
  return passed ? result.data.data : null;
}

// 28. GET /api/v1/admin/cart-analytics/time-in-cart - Time in cart statistics
async function testAnalyticsTimeInCart(adminToken, period = '7d') {
  console.log('\n⏱️ Test 28: GET /api/v1/admin/cart-analytics/time-in-cart - Time in cart statistics');
  
  const result = await apiRequest('GET', `/admin/cart-analytics/time-in-cart?period=${period}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  const structureValid = validateResponseStructure(result.data, ['success', 'data', 'message', 'messageBn']);
  const bilingualValid = validateBilingualMessages(result.data);
  const performanceValid = result.responseTime < 500;
  
  const passed = result.success && result.data.success && structureValid.valid && bilingualValid.valid && performanceValid;
  
  logTest('GET /api/v1/admin/cart-analytics/time-in-cart', passed, {
    responseTime: result.responseTime,
    structureValid: structureValid.valid,
    bilingualValid: bilingualValid.valid,
    averageTime: result.data.data?.averageTime,
    period,
    error: !passed ? result.error : undefined
  });
  
  trackEndpointResult('analytics', passed);
  return passed ? result.data.data : null;
}

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

async function testErrorHandling(token, adminToken, cartId, productId) {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 ERROR HANDLING TESTS');
  console.log('='.repeat(70));
  
  let errorTestsPassed = 0;
  let errorTestsFailed = 0;
  
  // Test 1: Invalid cart ID
  console.log('\n❌ Test: Invalid cart ID');
  const result1 = await apiRequest('GET', '/cart/invalid-cart-id', null, {
    'Authorization': `Bearer ${token}`
  });
  const test1Passed = !result1.success && (result1.status === 404 || result1.status === 400);
  if (test1Passed) {
    errorTestsPassed++;
    console.log('✅ Invalid cart ID handled correctly');
  } else {
    errorTestsFailed++;
    console.log('❌ Invalid cart ID not handled correctly');
  }
  
  // Test 2: Invalid product ID
  console.log('\n❌ Test: Invalid product ID');
  const result2 = await apiRequest('POST', '/cart/items', {
    cartId,
    productId: 'invalid-product-id',
    quantity: 1
  }, { 'Authorization': `Bearer ${token}` });
  const test2Passed = !result2.success && (result2.status === 400 || result2.status === 404);
  if (test2Passed) {
    errorTestsPassed++;
    console.log('✅ Invalid product ID handled correctly');
  } else {
    errorTestsFailed++;
    console.log('❌ Invalid product ID not handled correctly');
  }
  
  // Test 3: Invalid quantity (negative)
  console.log('\n❌ Test: Invalid quantity (negative)');
  const result3 = await apiRequest('POST', '/cart/items', {
    cartId,
    productId,
    quantity: -1
  }, { 'Authorization': `Bearer ${token}` });
  const test3Passed = !result3.success && result3.status === 400;
  if (test3Passed) {
    errorTestsPassed++;
    console.log('✅ Invalid quantity handled correctly');
  } else {
    errorTestsFailed++;
    console.log('❌ Invalid quantity not handled correctly');
  }
  
  // Test 4: Invalid quantity (zero)
  console.log('\n❌ Test: Invalid quantity (zero)');
  const result4 = await apiRequest('POST', '/cart/items', {
    cartId,
    productId,
    quantity: 0
  }, { 'Authorization': `Bearer ${token}` });
  const test4Passed = !result4.success && result4.status === 400;
  if (test4Passed) {
    errorTestsPassed++;
    console.log('✅ Zero quantity handled correctly');
  } else {
    errorTestsFailed++;
    console.log('❌ Zero quantity not handled correctly');
  }
  
  // Test 5: Unauthorized access (no token)
  console.log('\n❌ Test: Unauthorized access (no token)');
  const result5 = await apiRequest('GET', '/cart');
  const test5Passed = !result5.success && result5.status === 401;
  if (test5Passed) {
    errorTestsPassed++;
    console.log('✅ Unauthorized access handled correctly');
  } else {
    errorTestsFailed++;
    console.log('❌ Unauthorized access not handled correctly');
  }
  
  // Test 6: Forbidden access (user token for admin endpoint)
  console.log('\n❌ Test: Forbidden access (user token for admin endpoint)');
  const result6 = await apiRequest('GET', '/admin/carts', null, {
    'Authorization': `Bearer ${token}`
  });
  const test6Passed = !result6.success && result6.status === 403;
  if (test6Passed) {
    errorTestsPassed++;
    console.log('✅ Forbidden access handled correctly');
  } else {
    errorTestsFailed++;
    console.log('❌ Forbidden access not handled correctly');
  }
  
  // Test 7: Missing required fields
  console.log('\n❌ Test: Missing required fields');
  const result7 = await apiRequest('POST', '/cart/items', {
    cartId
    // Missing productId and quantity
  }, { 'Authorization': `Bearer ${token}` });
  const test7Passed = !result7.success && result7.status === 400;
  if (test7Passed) {
    errorTestsPassed++;
    console.log('✅ Missing required fields handled correctly');
  } else {
    errorTestsFailed++;
    console.log('❌ Missing required fields not handled correctly');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 Error Handling Tests: ${errorTestsPassed}/${errorTestsPassed + errorTestsFailed} passed`);
  console.log('='.repeat(70));
  
  return { passed: errorTestsPassed, failed: errorTestsFailed };
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runTests() {
  console.log('🚀 Starting Phase 6, Milestone 1: Shopping Cart API Validation Tests');
  console.log('=' .repeat(70));
  console.log('Validating 28 API endpoints across 3 categories:');
  console.log('  - Cart API: 10 endpoints');
  console.log('  - Admin API: 13 endpoints');
  console.log('  - Analytics API: 5 endpoints');
  console.log('='.repeat(70));
  
  try {
    // Setup authentication
    const userToken = await registerOrLoginUser();
    const adminToken = await loginAdmin();
    
    if (!userToken) {
      console.log('\n❌ Cannot proceed without user authentication');
      return;
    }
    
    if (!adminToken) {
      console.log('\n⚠️  Admin authentication failed - skipping admin tests');
    }
    
    // Get test products
    const products = await getTestProducts();
    
    if (products.length === 0) {
      console.log('\n❌ Cannot proceed without products');
      return;
    }
    
    const product = products[0];
    
    // ============================================================================
    // CART API TESTS (10 endpoints)
    // ============================================================================
    console.log('\n' + '='.repeat(70));
    console.log('🛒 CART API TESTS (10 endpoints)');
    console.log('='.repeat(70));
    
    // Test 1: Get cart (user)
    const userCart = await testGetCart(userToken);
    
    if (userCart) {
      // Test 2: Add item to cart
      const cartItem = await testAddCartItem(userToken, userCart.id, product.id, 2);
      
      if (cartItem) {
        // Test 3: Update cart item quantity
        await testUpdateCartItem(userToken, cartItem.id, 5);
        
        // Test 6: Calculate cart totals
        await testCalculateCart(userToken);
        
        // Test 7: Validate cart
        await testValidateCart(userToken);
        
        // Test 8: Share cart
        const shareData = await testShareCart(userToken, userCart.id);
        
        if (shareData) {
          // Test 9: Access shared cart
          await testGetSharedCart(shareData.shareToken);
        }
      }
    }
    
    // Test guest cart operations
    const guestSessionId = uuidv4();
    const guestCart = await testGetCart(null, guestSessionId);
    
    if (guestCart) {
      await testAddCartItem(userToken, guestCart.id, product.id, 1);
      
      // Test 10: Merge guest cart
      await testMergeCart(userToken, guestSessionId);
    }
    
    // Test 4: Delete cart item (need to get cart again to get item)
    const updatedCart = await testGetCart(userToken);
    if (updatedCart && updatedCart.items && updatedCart.items.length > 0) {
      await testDeleteCartItem(userToken, updatedCart.items[0].id);
    }
    
    // Test 5: Clear cart
    await testClearCart(userToken);
    
    // ============================================================================
    // ADMIN API TESTS (13 endpoints)
    // ============================================================================
    if (adminToken) {
      console.log('\n' + '='.repeat(70));
      console.log('👨‍💼 ADMIN API TESTS (13 endpoints)');
      console.log('='.repeat(70));
      
      // Create a test cart for admin operations
      const testCart = await testGetCart(userToken);
      await testAddCartItem(userToken, testCart.id, product.id, 3);
      
      // Test 11: List all carts
      const cartsList = await testAdminListCarts(adminToken, { limit: 10 });
      
      if (testCart) {
        // Test 12: Get cart details
        await testAdminGetCart(adminToken, testCart.id);
        
        // Test 13: Get cart items
        await testAdminGetCartItems(adminToken, testCart.id);
        
        // Test 17: Get cart analytics
        await testAdminCartAnalytics(adminToken);
        
        // Test 19: Export carts
        await testAdminExportCarts(adminToken);
        
        // Test 20: Export single cart
        await testAdminExportSingleCart(adminToken, testCart.id);
        
        // Get cart item for update/delete tests
        const cartWithItems = await testGetCart(userToken);
        if (cartWithItems && cartWithItems.items && cartWithItems.items.length > 0) {
          const cartItem = cartWithItems.items[0];
          
          // Test 14: Update cart item
          await testAdminUpdateCartItem(adminToken, testCart.id, cartItem.id, 10);
          
          // Test 15: Delete cart item
          await testAdminDeleteCartItem(adminToken, testCart.id, cartItem.id);
        }
        
        // Test 16: Clear cart
        await testAdminClearCart(adminToken, testCart.id);
        
        // Test 18: Delete expired carts
        await testAdminDeleteExpiredCarts(adminToken);
        
        // Test bulk operations (create multiple carts for bulk operations)
        const bulkCartIds = [];
        for (let i = 0; i < 3; i++) {
          const newCart = await testGetCart(userToken);
          if (newCart) {
            await testAddCartItem(userToken, newCart.id, product.id, 1);
            bulkCartIds.push(newCart.id);
          }
        }
        
        if (bulkCartIds.length > 0) {
          // Test 21: Bulk delete carts
          await testAdminBulkDeleteCarts(adminToken, [bulkCartIds[0]]);
          
          // Test 22: Bulk clear carts
          await testAdminBulkClearCarts(adminToken, [bulkCartIds[1]]);
          
          // Test 23: Bulk update cart status
          await testAdminBulkUpdateCartStatus(adminToken, [bulkCartIds[2]], 'EXPIRED');
        }
      }
    }
    
    // ============================================================================
    // ANALYTICS API TESTS (5 endpoints)
    // ============================================================================
    if (adminToken) {
      console.log('\n' + '='.repeat(70));
      console.log('📊 ANALYTICS API TESTS (5 endpoints)');
      console.log('='.repeat(70));
      
      // Test 24: Conversion analytics
      await testAnalyticsConversion(adminToken, '7d');
      
      // Test 25: Average value analytics
      await testAnalyticsAverageValue(adminToken, '7d');
      
      // Test 26: Abandonment analytics
      await testAnalyticsAbandonment(adminToken, '7d');
      
      // Test 27: Popular products analytics
      await testAnalyticsPopularProducts(adminToken, 10);
      
      // Test 28: Time in cart analytics
      await testAnalyticsTimeInCart(adminToken, '7d');
    }
    
    // ============================================================================
    // ERROR HANDLING TESTS
    // ============================================================================
    const testCart = await testGetCart(userToken);
    if (testCart) {
      await testErrorHandling(userToken, adminToken, testCart.id, product.id);
    }
    
    // ============================================================================
    // FINAL REPORT
    // ============================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL VALIDATION REPORT');
    console.log('='.repeat(70));
    
    console.log('\n📈 OVERALL RESULTS:');
    console.log(`   Total Tests: ${testResults.tests.length}`);
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   ⏭️  Skipped: ${testResults.skipped}`);
    console.log(`   Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(2)}%`);
    
    console.log('\n📊 BY CATEGORY:');
    console.log(`   Cart API (${testResults.endpoints.cart.total} endpoints):`);
    console.log(`     ✅ Passed: ${testResults.endpoints.cart.passed}`);
    console.log(`     ❌ Failed: ${testResults.endpoints.cart.failed}`);
    console.log(`     ⏭️  Skipped: ${testResults.endpoints.cart.skipped}`);
    console.log(`     Success Rate: ${((testResults.endpoints.cart.passed / testResults.endpoints.cart.total) * 100).toFixed(2)}%`);
    
    console.log(`   Admin API (${testResults.endpoints.admin.total} endpoints):`);
    console.log(`     ✅ Passed: ${testResults.endpoints.admin.passed}`);
    console.log(`     ❌ Failed: ${testResults.endpoints.admin.failed}`);
    console.log(`     ⏭️  Skipped: ${testResults.endpoints.admin.skipped}`);
    console.log(`     Success Rate: ${((testResults.endpoints.admin.passed / testResults.endpoints.admin.total) * 100).toFixed(2)}%`);
    
    console.log(`   Analytics API (${testResults.endpoints.analytics.total} endpoints):`);
    console.log(`     ✅ Passed: ${testResults.endpoints.analytics.passed}`);
    console.log(`     ❌ Failed: ${testResults.endpoints.analytics.failed}`);
    console.log(`     ⏭️  Skipped: ${testResults.endpoints.analytics.skipped}`);
    console.log(`     Success Rate: ${((testResults.endpoints.analytics.passed / testResults.endpoints.analytics.total) * 100).toFixed(2)}%`);
    
    console.log('\n⚡ PERFORMANCE METRICS:');
    console.log(`   ⚡ Fast (<200ms): ${testResults.performance.fast}`);
    console.log(`   ⏱️  Normal (200-500ms): ${testResults.performance.normal}`);
    console.log(`   ⏰ Slow (500-1000ms): ${testResults.performance.slow}`);
    console.log(`   🐌 Very Slow (>1000ms): ${testResults.performance.verySlow}`);
    
    const totalPerformanceTests = testResults.performance.fast + testResults.performance.normal + testResults.performance.slow + testResults.performance.verySlow;
    const performanceSuccessRate = ((testResults.performance.fast + testResults.performance.normal) / totalPerformanceTests * 100).toFixed(2);
    console.log(`   Performance Success Rate (<500ms): ${performanceSuccessRate}%`);
    
    console.log('\n'.repeat(70));
    
    // Save results to file
    const resultsPath = './phase6-milestone1-api-validation-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`📁 Detailed results saved to: ${resultsPath}`);
    
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
  }
}

// Run tests
runTests();
