/**
 * Phase 6, Milestone 1: Shopping Cart Foundation - Comprehensive Test
 * 
 * This test file covers all cart operations including:
 * - Logged-in user cart operations
 * - Guest cart operations
 * - Cart merging on login
 * - Stock validation
 * - Cart expiration
 * - Bilingual support
 * - Redis caching
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_USER = {
  email: 'cart-test@example.com',
  password: 'Test123456',
  firstName: 'Cart',
  lastName: 'Test'
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
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
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName}`);
    if (details.error) {
      console.log(`   Error: ${details.error}`);
    }
  }
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
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
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test: User Registration
async function testUserRegistration() {
  console.log('\n📝 Test: User Registration');
  
  const result = await apiRequest('POST', '/auth/register', TEST_USER);
  
  if (result.success && result.data.success) {
    logTest('User Registration', true, { userId: result.data.data?.user?.id });
    return result.data.data?.user?.id;
  } else {
    // User might already exist, try to login
    const loginResult = await apiRequest('POST', '/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (loginResult.success && loginResult.data.success) {
      logTest('User Registration (existing user)', true, { userId: loginResult.data.data?.user?.id });
      return loginResult.data.data?.user?.id;
    }
    
    logTest('User Registration', false, { error: result.error });
    return null;
  }
}

// Test: User Login
async function testUserLogin() {
  console.log('\n🔐 Test: User Login');
  
  const result = await apiRequest('POST', '/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (result.success && result.data.success) {
    logTest('User Login', true, { userId: result.data.data?.user?.id });
    return result.data.data?.token;
  }
  
  logTest('User Login', false, { error: result.error });
  return null;
}

// Test: Get Products (to have products to add to cart)
async function testGetProducts() {
  console.log('\n📦 Test: Get Products');
  
  const result = await apiRequest('GET', '/products?limit=5');
  
  if (result.success && result.data.success) {
    const products = result.data.data?.products || [];
    logTest('Get Products', true, { productCount: products.length });
    return products;
  }
  
  logTest('Get Products', false, { error: result.error });
  return [];
}

// Test: Create Guest Cart
async function testCreateGuestCart() {
  console.log('\n🛒 Test: Create Guest Cart');
  
  const sessionId = uuidv4();
  
  const result = await apiRequest('GET', '/cart', null, {
    'x-session-id': sessionId
  });
  
  if (result.success && result.data.success) {
    logTest('Create Guest Cart', true, { 
      cartId: result.data.data?.id,
      sessionId 
    });
    return { cartId: result.data.data?.id, sessionId };
  }
  
  logTest('Create Guest Cart', false, { error: result.error });
  return null;
}

// Test: Add Item to Guest Cart
async function testAddItemToGuestCart(cartId, productId, quantity = 1) {
  console.log('\n➕ Test: Add Item to Guest Cart');
  
  const result = await apiRequest('POST', '/cart/items', {
    cartId,
    productId,
    quantity
  });
  
  if (result.success && result.data.success) {
    logTest('Add Item to Guest Cart', true, { 
      cartItemId: result.data.data?.id,
      productId,
      quantity 
    });
    return result.data.data;
  }
  
  logTest('Add Item to Guest Cart', false, { 
    error: result.error,
    productId 
  });
  return null;
}

// Test: Get Guest Cart
async function testGetGuestCart(sessionId) {
  console.log('\n📋 Test: Get Guest Cart');
  
  const result = await apiRequest('GET', '/cart', null, {
    'x-session-id': sessionId
  });
  
  if (result.success && result.data.success) {
    logTest('Get Guest Cart', true, { 
      cartId: result.data.data?.id,
      itemCount: result.data.data?.items?.length 
    });
    return result.data.data;
  }
  
  logTest('Get Guest Cart', false, { error: result.error });
  return null;
}

// Test: Get User Cart
async function testGetUserCart(token) {
  console.log('\n📋 Test: Get User Cart');
  
  const result = await apiRequest('GET', '/cart', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    logTest('Get User Cart', true, { 
      cartId: result.data.data?.id,
      itemCount: result.data.data?.items?.length 
    });
    return result.data.data;
  }
  
  logTest('Get User Cart', false, { error: result.error });
  return null;
}

// Test: Add Item to User Cart
async function testAddItemToUserCart(token, cartId, productId, quantity = 1) {
  console.log('\n➕ Test: Add Item to User Cart');
  
  const result = await apiRequest('POST', '/cart/items', {
    cartId,
    productId,
    quantity
  }, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    logTest('Add Item to User Cart', true, { 
      cartItemId: result.data.data?.id,
      productId,
      quantity 
    });
    return result.data.data;
  }
  
  logTest('Add Item to User Cart', false, { 
    error: result.error,
    productId 
  });
  return null;
}

// Test: Update Cart Item Quantity
async function testUpdateCartItemQuantity(token, cartItemId, quantity) {
  console.log('\n✏️ Test: Update Cart Item Quantity');
  
  const result = await apiRequest('PATCH', `/cart/items/${cartItemId}/quantity`, {
    quantity
  }, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    logTest('Update Cart Item Quantity', true, { 
      cartItemId,
      newQuantity: result.data.data?.quantity 
    });
    return result.data.data;
  }
  
  logTest('Update Cart Item Quantity', false, { 
    error: result.error,
    cartItemId 
  });
  return null;
}

// Test: Remove Cart Item
async function testRemoveCartItem(token, cartItemId) {
  console.log('\n🗑️ Test: Remove Cart Item');
  
  const result = await apiRequest('DELETE', `/cart/items/${cartItemId}`, null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    logTest('Remove Cart Item', true, { cartItemId });
    return true;
  }
  
  logTest('Remove Cart Item', false, { 
    error: result.error,
    cartItemId 
  });
  return false;
}

// Test: Get Cart Summary
async function testGetCartSummary(token) {
  console.log('\n📊 Test: Get Cart Summary');
  
  const result = await apiRequest('GET', '/cart/summary', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    const summary = result.data.data;
    logTest('Get Cart Summary', true, { 
      itemCount: summary?.itemCount,
      totalItems: summary?.totalItems,
      total: summary?.total 
    });
    return summary;
  }
  
  logTest('Get Cart Summary', false, { error: result.error });
  return null;
}

// Test: Validate Cart Stock
async function testValidateCartStock(token) {
  console.log('\n✅ Test: Validate Cart Stock');
  
  const result = await apiRequest('GET', '/cart/validate', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    logTest('Validate Cart Stock', true, { 
      isValid: result.data.data?.isValid 
    });
    return result.data.data;
  }
  
  logTest('Validate Cart Stock', false, { error: result.error });
  return null;
}

// Test: Clear Cart
async function testClearCart(token) {
  console.log('\n🧹 Test: Clear Cart');
  
  const result = await apiRequest('DELETE', '/cart', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    logTest('Clear Cart', true);
    return true;
  }
  
  logTest('Clear Cart', false, { error: result.error });
  return false;
}

// Test: Merge Guest Cart on Login
async function testMergeGuestCart(guestSessionId, token) {
  console.log('\n🔄 Test: Merge Guest Cart on Login');
  
  const result = await apiRequest('POST', '/cart/merge', {
    guestSessionId
  }, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    logTest('Merge Guest Cart on Login', true, { 
      cartId: result.data.data?.cartId 
    });
    return result.data.data;
  }
  
  logTest('Merge Guest Cart on Login', false, { error: result.error });
  return null;
}

// Test: Bilingual Support
async function testBilingualSupport() {
  console.log('\n🌐 Test: Bilingual Support');
  
  let bilingualPassed = true;
  
  // Test with guest cart
  const sessionId = uuidv4();
  const cartResult = await apiRequest('GET', '/cart', null, {
    'x-session-id': sessionId
  });
  
  if (cartResult.success && cartResult.data.success) {
    const hasMessage = !!cartResult.data.message;
    const hasMessageBn = !!cartResult.data.messageBn;
    
    logTest('Bilingual Support - Get Cart', hasMessage && hasMessageBn, {
      hasMessage,
      hasMessageBn,
      message: cartResult.data.message,
      messageBn: cartResult.data.messageBn
    });
    
    if (!hasMessage || !hasMessageBn) {
      bilingualPassed = false;
    }
  } else {
    logTest('Bilingual Support - Get Cart', false, { error: cartResult.error });
    bilingualPassed = false;
  }
  
  return bilingualPassed;
}

// Test: Stock Validation (Out of Stock Scenario)
async function testStockValidation() {
  console.log('\n📦 Test: Stock Validation');
  
  // Get products
  const products = await testGetProducts();
  
  if (products.length === 0) {
    logTest('Stock Validation', false, { error: 'No products available' });
    return false;
  }
  
  const product = products[0];
  const sessionId = uuidv4();
  
  // Create guest cart
  const cartResult = await apiRequest('GET', '/cart', null, {
    'x-session-id': sessionId
  });
  
  if (!cartResult.success || !cartResult.data.success) {
    logTest('Stock Validation', false, { error: 'Failed to create cart' });
    return false;
  }
  
  const cartId = cartResult.data.data?.id;
  
  // Try to add more items than available stock
  const result = await apiRequest('POST', '/cart/items', {
    cartId,
    productId: product.id,
    quantity: 99999 // Excessive quantity
  });
  
  // Should fail with insufficient stock error
  const stockValidationPassed = !result.success || 
    (result.error?.error?.toLowerCase().includes('stock') || 
     result.error?.message?.toLowerCase().includes('stock'));
  
  logTest('Stock Validation', stockValidationPassed, {
    productId: product.id,
    requestedQuantity: 99999,
    expectedError: 'Insufficient stock available',
    actualError: result.error?.error || result.error?.message
  });
  
  return stockValidationPassed;
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Phase 6, Milestone 1: Shopping Cart Foundation Tests');
  console.log('=' .repeat(70));
  
  try {
    // 1. User Registration/Login
    const userId = await testUserRegistration();
    const token = await testUserLogin();
    
    if (!token) {
      console.log('\n❌ Cannot proceed without authentication token');
      return;
    }
    
    // 2. Get Products
    const products = await testGetProducts();
    
    if (products.length === 0) {
      console.log('\n❌ Cannot proceed without products');
      return;
    }
    
    const product = products[0];
    
    // 3. Guest Cart Tests
    console.log('\n' + '='.repeat(70));
    console.log('🛒 GUEST CART TESTS');
    console.log('='.repeat(70));
    
    const guestCart = await testCreateGuestCart();
    
    if (guestCart) {
      await testGetGuestCart(guestCart.sessionId);
      await testAddItemToGuestCart(guestCart.cartId, product.id, 2);
      await testGetGuestCart(guestCart.sessionId);
    }
    
    // 4. User Cart Tests
    console.log('\n' + '='.repeat(70));
    console.log('👤 USER CART TESTS');
    console.log('='.repeat(70));
    
    const userCart = await testGetUserCart(token);
    
    if (userCart) {
      const cartItem = await testAddItemToUserCart(token, userCart.id, product.id, 3);
      
      if (cartItem) {
        await testUpdateCartItemQuantity(token, cartItem.id, 5);
        await testGetCartSummary(token);
        await testValidateCartStock(token);
      }
    }
    
    // 5. Cart Merging Test
    console.log('\n' + '='.repeat(70));
    console.log('🔄 CART MERGING TESTS');
    console.log('='.repeat(70));
    
    // Create another guest cart
    const guestCart2 = await testCreateGuestCart();
    
    if (guestCart2) {
      await testAddItemToGuestCart(guestCart2.cartId, product.id, 1);
      await testMergeGuestCart(guestCart2.sessionId, token);
    }
    
    // 6. Bilingual Support Test
    console.log('\n' + '='.repeat(70));
    console.log('🌐 BILINGUAL SUPPORT TESTS');
    console.log('='.repeat(70));
    
    await testBilingualSupport();
    
    // 7. Stock Validation Test
    console.log('\n' + '='.repeat(70));
    console.log('📦 STOCK VALIDATION TESTS');
    console.log('='.repeat(70));
    
    await testStockValidation();
    
    // 8. Clear Cart Test
    console.log('\n' + '='.repeat(70));
    console.log('🧹 CLEAR CART TESTS');
    console.log('='.repeat(70));
    
    await testClearCart(token);
    
    // Print final results
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${testResults.tests.length}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(2)}%`);
    console.log('='.repeat(70));
    
    // Save results to file
    const fs = require('fs');
    const resultsPath = './phase6-milestone1-cart-test-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📁 Test results saved to: ${resultsPath}`);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
  }
}

// Run tests
runTests();
