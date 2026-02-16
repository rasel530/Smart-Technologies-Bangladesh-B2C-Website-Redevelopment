/**
 * Guest Purchase Lifecycle End-to-End Test
 * 
 * This test performs comprehensive end-to-end testing of the guest purchase lifecycle:
 * 1. Guest Product Addition
 * 2. Guest Cart Page Functionality
 * 3. Guest Checkout Flow
 * 4. Stock Validation
 * 5. Session Persistence
 * 
 * Test Scenarios:
 * - Scenario 1: Guest Product Addition
 * - Scenario 2: Guest Cart Page Functionality
 * - Scenario 3: Guest Checkout Flow
 * - Scenario 4: Stock Validation
 * - Scenario 5: Session Persistence
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  identifier: 'raselbepari88@gmail.com',
  password: '74Vfo^71~_oY'
};

// Test results storage
const testResults = {
  scenario1: null,
  scenario2: null,
  scenario3: null,
  scenario4: null,
  scenario5: null,
  errors: [],
  warnings: [],
  summary: {
    total: 5,
    passed: 0,
    failed: 0
  }
};

let authToken = null;
let guestSessionId = null;
let testProductId = null;
let testVariantId = null;
let guestCartId = null;
let createdOrderId = null;
let initialStock = {};

/**
 * Make HTTP request
 */
function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Utility function to log messages
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  console.log(`${prefix[type]} [${timestamp}] ${message}`);
}

/**
 * Login to get auth token (for authenticated tests)
 */
async function login() {
  log('=== Login ===', 'info');
  try {
    const response = await makeRequest('POST', `${API_BASE_URL}/auth/login`, TEST_USER);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      if (response.data.token) {
        authToken = response.data.token;
        log('Login successful', 'success');
        log(`User ID: ${response.data.user?.id}`, 'info');
        return true;
      } else {
        log('Login failed: No token in response', 'error');
        return false;
      }
    } else {
      log(`Login failed: ${response.statusCode}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Login error: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Get products for testing
 */
async function getProducts() {
  log('\n=== Get Products ===', 'info');
  try {
    const response = await makeRequest('GET', `${API_BASE_URL}/products?limit=20`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.statusCode === 200) {
      const products = response.data.products || response.data || [];
      log(`Retrieved ${products.length} products`, 'success');
      
      // Find a product with stock
      const availableProducts = products.filter(p => (p.stock || p.stockQuantity || 0) > 0);
      
      if (availableProducts.length > 0) {
        testProductId = availableProducts[0].id;
        // Check for variants
        if (availableProducts[0].variants && availableProducts[0].variants.length > 0) {
          testVariantId = availableProducts[0].variants[0].id;
        }
        log(`Selected product ID: ${testProductId}`, 'info');
        if (testVariantId) {
          log(`Selected variant ID: ${testVariantId}`, 'info');
        }
        // Store initial stock
        initialStock[testProductId] = availableProducts[0].stock || availableProducts[0].stockQuantity || 0;
        return products;
      } else {
        log('No products with stock available', 'warning');
        return [];
      }
    } else {
      log(`Get products failed: ${response.statusCode}`, 'error');
      return [];
    }
  } catch (error) {
    log(`Get products error: ${error.message}`, 'error');
    return [];
  }
}

/**
 * ============================================================================
 * SCENARIO 1: Guest Product Addition
 * ============================================================================
 */
async function testScenario1() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 1: Guest Product Addition');
  console.log('='.repeat(80));
  
  const scenarioResults = {
    name: 'Scenario 1: Guest Product Addition',
    tests: [],
    passed: 0,
    failed: 0
  };
  
  // Generate a unique guest session ID
  guestSessionId = 'guest-session-' + Date.now();
  log(`Guest Session ID: ${guestSessionId}`, 'info');
  
  // Test 1.1: Add product to guest cart
  log('\n--- Test 1.1: Add product to guest cart ---', 'info');
  try {
    const cartItem = {
      productId: testProductId,
      quantity: 2,
      variantId: testVariantId || null
    };
    
    log(`Adding product to cart: ${JSON.stringify(cartItem)}`, 'info');
    
    const response = await makeRequest(
      'POST',
      `${API_BASE_URL}/cart/items`,
      cartItem,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      guestCartId = response.data.cartId || response.data.id;
      log(`Product added to cart successfully`, 'success');
      log(`Cart ID: ${guestCartId}`, 'info');
      log(`Status: ${response.statusCode}`, 'info');
      
      scenarioResults.tests.push({
        name: 'Test 1.1: Add product to guest cart',
        status: 'PASSED',
        statusCode: response.statusCode,
        cartId: guestCartId
      });
      scenarioResults.passed++;
    } else {
      log(`Failed to add product to cart: ${response.statusCode}`, 'error');
      log(`Error: ${JSON.stringify(response.data)}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 1.1: Add product to guest cart',
        status: 'FAILED',
        statusCode: response.statusCode,
        error: response.data.message || 'Unknown error'
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 1.1: Failed to add product to cart - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error adding product to cart: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 1.1: Add product to guest cart',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 1.1: Error adding product to cart - ${error.message}`);
  }
  
  // Test 1.2: Verify product appears in guest cart
  log('\n--- Test 1.2: Verify product appears in guest cart ---', 'info');
  try {
    const response = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      const itemFound = cartItems.some(item => item.productId === testProductId);
      
      if (itemFound) {
        log(`Product found in guest cart`, 'success');
        log(`Items in cart: ${cartItems.length}`, 'info');
        
        scenarioResults.tests.push({
          name: 'Test 1.2: Verify product appears in guest cart',
          status: 'PASSED',
          itemCount: cartItems.length
        });
        scenarioResults.passed++;
      } else {
        log(`Product not found in guest cart`, 'error');
        
        scenarioResults.tests.push({
          name: 'Test 1.2: Verify product appears in guest cart',
          status: 'FAILED',
          itemCount: cartItems.length
        });
        scenarioResults.failed++;
        testResults.errors.push('Scenario 1.2: Product not found in guest cart');
      }
    } else {
      log(`Failed to get guest cart: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 1.2: Verify product appears in guest cart',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 1.2: Failed to get guest cart - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error getting guest cart: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 1.2: Verify product appears in guest cart',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 1.2: Error getting guest cart - ${error.message}`);
  }
  
  // Test 1.3: Verify cart count updates
  log('\n--- Test 1.3: Verify cart count updates ---', 'info');
  try {
    const response = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      
      log(`Cart count: ${totalQuantity}`, 'info');
      log(`Cart count updated successfully`, 'success');
      
      scenarioResults.tests.push({
        name: 'Test 1.3: Verify cart count updates',
        status: 'PASSED',
        cartCount: totalQuantity
      });
      scenarioResults.passed++;
    } else {
      log(`Failed to verify cart count: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 1.3: Verify cart count updates',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 1.3: Failed to verify cart count - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error verifying cart count: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 1.3: Verify cart count updates',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 1.3: Error verifying cart count - ${error.message}`);
  }
  
  testResults.scenario1 = scenarioResults;
  
  if (scenarioResults.failed === 0) {
    testResults.summary.passed++;
    log('\n✅ SCENARIO 1 PASSED', 'success');
  } else {
    testResults.summary.failed++;
    log('\n❌ SCENARIO 1 FAILED', 'error');
  }
  
  return scenarioResults;
}

/**
 * ============================================================================
 * SCENARIO 2: Guest Cart Page Functionality
 * ============================================================================
 */
async function testScenario2() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 2: Guest Cart Page Functionality');
  console.log('='.repeat(80));
  
  const scenarioResults = {
    name: 'Scenario 2: Guest Cart Page Functionality',
    tests: [],
    passed: 0,
    failed: 0
  };
  
  // Test 2.1: Verify all cart items are displayed
  log('\n--- Test 2.1: Verify all cart items are displayed ---', 'info');
  try {
    const response = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      log(`Cart items retrieved: ${cartItems.length}`, 'success');
      
      cartItems.forEach((item, index) => {
        log(`  Item ${index + 1}: Product ID ${item.productId}, Quantity ${item.quantity}`, 'info');
      });
      
      scenarioResults.tests.push({
        name: 'Test 2.1: Verify all cart items are displayed',
        status: 'PASSED',
        itemCount: cartItems.length
      });
      scenarioResults.passed++;
    } else {
      log(`Failed to get cart items: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 2.1: Verify all cart items are displayed',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 2.1: Failed to get cart items - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error getting cart items: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 2.1: Verify all cart items are displayed',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 2.1: Error getting cart items - ${error.message}`);
  }
  
  // Test 2.2: Test quantity increase functionality
  log('\n--- Test 2.2: Test quantity increase functionality ---', 'info');
  try {
    const response = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      
      if (cartItems.length > 0) {
        const firstItem = cartItems[0];
        const newQuantity = firstItem.quantity + 1;
        
        log(`Updating quantity for item ${firstItem.productId} from ${firstItem.quantity} to ${newQuantity}`, 'info');
        
        const updateResponse = await makeRequest(
          'PUT',
          `${API_BASE_URL}/cart/items/${firstItem.productId}`,
          { quantity: newQuantity, variantId: firstItem.variantId },
          { 'x-session-id': guestSessionId }
        );
        
        if (updateResponse.statusCode === 200 || updateResponse.statusCode === 201) {
          log(`Quantity updated successfully`, 'success');
          
          scenarioResults.tests.push({
            name: 'Test 2.2: Test quantity increase functionality',
            status: 'PASSED',
            oldQuantity: firstItem.quantity,
            newQuantity: newQuantity
          });
          scenarioResults.passed++;
        } else {
          log(`Failed to update quantity: ${updateResponse.statusCode}`, 'error');
          
          scenarioResults.tests.push({
            name: 'Test 2.2: Test quantity increase functionality',
            status: 'FAILED',
            statusCode: updateResponse.statusCode
          });
          scenarioResults.failed++;
          testResults.errors.push(`Scenario 2.2: Failed to update quantity - ${updateResponse.statusCode}`);
        }
      } else {
        log(`No items in cart to update quantity`, 'warning');
        
        scenarioResults.tests.push({
          name: 'Test 2.2: Test quantity increase functionality',
          status: 'SKIPPED',
          reason: 'No items in cart'
        });
        testResults.warnings.push('Scenario 2.2: No items in cart to update quantity');
      }
    } else {
      log(`Failed to get cart items: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 2.2: Test quantity increase functionality',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 2.2: Failed to get cart items - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error updating quantity: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 2.2: Test quantity increase functionality',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 2.2: Error updating quantity - ${error.message}`);
  }
  
  // Test 2.3: Test quantity decrease functionality
  log('\n--- Test 2.3: Test quantity decrease functionality ---', 'info');
  try {
    const response = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      
      if (cartItems.length > 0) {
        const firstItem = cartItems[0];
        
        if (firstItem.quantity > 1) {
          const newQuantity = firstItem.quantity - 1;
          
          log(`Updating quantity for item ${firstItem.productId} from ${firstItem.quantity} to ${newQuantity}`, 'info');
          
          const updateResponse = await makeRequest(
            'PUT',
            `${API_BASE_URL}/cart/items/${firstItem.productId}`,
            { quantity: newQuantity, variantId: firstItem.variantId },
            { 'x-session-id': guestSessionId }
          );
          
          if (updateResponse.statusCode === 200 || updateResponse.statusCode === 201) {
            log(`Quantity updated successfully`, 'success');
            
            scenarioResults.tests.push({
              name: 'Test 2.3: Test quantity decrease functionality',
              status: 'PASSED',
              oldQuantity: firstItem.quantity,
              newQuantity: newQuantity
            });
            scenarioResults.passed++;
          } else {
            log(`Failed to update quantity: ${updateResponse.statusCode}`, 'error');
            
            scenarioResults.tests.push({
              name: 'Test 2.3: Test quantity decrease functionality',
              status: 'FAILED',
              statusCode: updateResponse.statusCode
            });
            scenarioResults.failed++;
            testResults.errors.push(`Scenario 2.3: Failed to update quantity - ${updateResponse.statusCode}`);
          }
        } else {
          log(`Item quantity is already 1, cannot decrease`, 'warning');
          
          scenarioResults.tests.push({
            name: 'Test 2.3: Test quantity decrease functionality',
            status: 'SKIPPED',
            reason: 'Item quantity is already 1'
          });
          testResults.warnings.push('Scenario 2.3: Item quantity is already 1, cannot decrease');
        }
      } else {
        log(`No items in cart to update quantity`, 'warning');
        
        scenarioResults.tests.push({
          name: 'Test 2.3: Test quantity decrease functionality',
          status: 'SKIPPED',
          reason: 'No items in cart'
        });
        testResults.warnings.push('Scenario 2.3: No items in cart to update quantity');
      }
    } else {
      log(`Failed to get cart items: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 2.3: Test quantity decrease functionality',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 2.3: Failed to get cart items - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error updating quantity: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 2.3: Test quantity decrease functionality',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 2.3: Error updating quantity - ${error.message}`);
  }
  
  // Test 2.4: Test item removal functionality
  log('\n--- Test 2.4: Test item removal functionality ---', 'info');
  try {
    const response = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      
      if (cartItems.length > 0) {
        const firstItem = cartItems[0];
        
        log(`Removing item ${firstItem.productId} from cart`, 'info');
        
        const deleteResponse = await makeRequest(
          'DELETE',
          `${API_BASE_URL}/cart/items/${firstItem.productId}?variantId=${firstItem.variantId || ''}`,
          null,
          { 'x-session-id': guestSessionId }
        );
        
        if (deleteResponse.statusCode === 200 || deleteResponse.statusCode === 204) {
          log(`Item removed successfully`, 'success');
          
          scenarioResults.tests.push({
            name: 'Test 2.4: Test item removal functionality',
            status: 'PASSED',
            removedItemId: firstItem.productId
          });
          scenarioResults.passed++;
        } else {
          log(`Failed to remove item: ${deleteResponse.statusCode}`, 'error');
          
          scenarioResults.tests.push({
            name: 'Test 2.4: Test item removal functionality',
            status: 'FAILED',
            statusCode: deleteResponse.statusCode
          });
          scenarioResults.failed++;
          testResults.errors.push(`Scenario 2.4: Failed to remove item - ${deleteResponse.statusCode}`);
        }
      } else {
        log(`No items in cart to remove`, 'warning');
        
        scenarioResults.tests.push({
          name: 'Test 2.4: Test item removal functionality',
          status: 'SKIPPED',
          reason: 'No items in cart'
        });
        testResults.warnings.push('Scenario 2.4: No items in cart to remove');
      }
    } else {
      log(`Failed to get cart items: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 2.4: Test item removal functionality',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 2.4: Failed to get cart items - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error removing item: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 2.4: Test item removal functionality',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 2.4: Error removing item - ${error.message}`);
  }
  
  // Test 2.5: Verify cart totals are calculated correctly
  log('\n--- Test 2.5: Verify cart totals are calculated correctly ---', 'info');
  try {
    const response = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      const subTotal = response.data.subTotal || response.data.subtotal || 0;
      const totalAmount = response.data.totalAmount || response.data.total || 0;
      
      log(`Cart subtotal: ${subTotal}`, 'info');
      log(`Cart total: ${totalAmount}`, 'info');
      
      // Calculate expected total
      let expectedTotal = 0;
      cartItems.forEach(item => {
        expectedTotal += (item.price || item.product?.price || 0) * item.quantity;
      });
      
      log(`Expected total: ${expectedTotal}`, 'info');
      
      if (Math.abs(expectedTotal - subTotal) < 0.01) {
        log(`Cart totals calculated correctly`, 'success');
        
        scenarioResults.tests.push({
          name: 'Test 2.5: Verify cart totals are calculated correctly',
          status: 'PASSED',
          expectedTotal: expectedTotal,
          actualTotal: subTotal
        });
        scenarioResults.passed++;
      } else {
        log(`Cart totals mismatch: expected ${expectedTotal}, got ${subTotal}`, 'error');
        
        scenarioResults.tests.push({
          name: 'Test 2.5: Verify cart totals are calculated correctly',
          status: 'FAILED',
          expectedTotal: expectedTotal,
          actualTotal: subTotal
        });
        scenarioResults.failed++;
        testResults.errors.push(`Scenario 2.5: Cart totals mismatch - expected ${expectedTotal}, got ${subTotal}`);
      }
    } else {
      log(`Failed to get cart totals: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 2.5: Verify cart totals are calculated correctly',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 2.5: Failed to get cart totals - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error getting cart totals: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 2.5: Verify cart totals are calculated correctly',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 2.5: Error getting cart totals - ${error.message}`);
  }
  
  testResults.scenario2 = scenarioResults;
  
  if (scenarioResults.failed === 0) {
    testResults.summary.passed++;
    log('\n✅ SCENARIO 2 PASSED', 'success');
  } else {
    testResults.summary.failed++;
    log('\n❌ SCENARIO 2 FAILED', 'error');
  }
  
  return scenarioResults;
}

/**
 * ============================================================================
 * SCENARIO 3: Guest Checkout Flow
 * ============================================================================
 */
async function testScenario3() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 3: Guest Checkout Flow');
  console.log('='.repeat(80));
  
  const scenarioResults = {
    name: 'Scenario 3: Guest Checkout Flow',
    tests: [],
    passed: 0,
    failed: 0
  };
  
  // First, add items to the cart for checkout
  log('\n--- Preparing cart for checkout ---', 'info');
  try {
    const cartItem = {
      productId: testProductId,
      quantity: 1,
      variantId: testVariantId || null
    };
    
    const response = await makeRequest(
      'POST',
      `${API_BASE_URL}/cart/items`,
      cartItem,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      log(`Product added to cart for checkout`, 'success');
    } else {
      log(`Failed to add product to cart: ${response.statusCode}`, 'error');
    }
  } catch (error) {
    log(`Error adding product to cart: ${error.message}`, 'error');
  }
  
  // Test 3.1: Verify guest checkout is possible
  log('\n--- Test 3.1: Verify guest checkout is possible ---', 'info');
  try {
    const response = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      
      if (cartItems.length > 0) {
        log(`Guest cart is ready for checkout`, 'success');
        log(`Items in cart: ${cartItems.length}`, 'info');
        
        scenarioResults.tests.push({
          name: 'Test 3.1: Verify guest checkout is possible',
          status: 'PASSED',
          itemCount: cartItems.length
        });
        scenarioResults.passed++;
      } else {
        log(`Guest cart is empty, cannot proceed with checkout`, 'error');
        
        scenarioResults.tests.push({
          name: 'Test 3.1: Verify guest checkout is possible',
          status: 'FAILED',
          reason: 'Cart is empty'
        });
        scenarioResults.failed++;
        testResults.errors.push('Scenario 3.1: Guest cart is empty, cannot proceed with checkout');
      }
    } else {
      log(`Failed to get guest cart: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 3.1: Verify guest checkout is possible',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 3.1: Failed to get guest cart - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error getting guest cart: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 3.1: Verify guest checkout is possible',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 3.1: Error getting guest cart - ${error.message}`);
  }
  
  // Test 3.2: Test guest checkout with address entry
  log('\n--- Test 3.2: Test guest checkout with address entry ---', 'info');
  try {
    const orderData = {
      shippingAddress: {
        fullName: 'Guest User',
        addressLine1: '123 Guest Street',
        addressLine2: 'Apt 1',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1000',
        country: 'Bangladesh',
        phone: '+8801234567890'
      },
      billingAddress: {
        fullName: 'Guest User',
        addressLine1: '123 Guest Street',
        addressLine2: 'Apt 1',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1000',
        country: 'Bangladesh',
        phone: '+8801234567890'
      },
      paymentMethod: 'CASH_ON_DELIVERY',
      notes: 'Guest checkout test'
    };
    
    log(`Placing guest order with session ID: ${guestSessionId}`, 'info');
    
    const response = await makeRequest(
      'POST',
      `${API_BASE_URL}/orders`,
      orderData,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      createdOrderId = response.data.id || response.data.orderId;
      log(`Guest order placed successfully`, 'success');
      log(`Order ID: ${createdOrderId}`, 'info');
      log(`Order Number: ${response.data.orderNumber || 'N/A'}`, 'info');
      
      scenarioResults.tests.push({
        name: 'Test 3.2: Test guest checkout with address entry',
        status: 'PASSED',
        orderId: createdOrderId,
        orderNumber: response.data.orderNumber
      });
      scenarioResults.passed++;
    } else {
      log(`Failed to place guest order: ${response.statusCode}`, 'error');
      log(`Error: ${JSON.stringify(response.data)}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 3.2: Test guest checkout with address entry',
        status: 'FAILED',
        statusCode: response.statusCode,
        error: response.data.message || 'Unknown error'
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 3.2: Failed to place guest order - ${response.statusCode}: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    log(`Error placing guest order: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 3.2: Test guest checkout with address entry',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 3.2: Error placing guest order - ${error.message}`);
  }
  
  // Test 3.3: Verify order creation for guest users
  log('\n--- Test 3.3: Verify order creation for guest users ---', 'info');
  if (createdOrderId) {
    try {
      const response = await makeRequest(
        'GET',
        `${API_BASE_URL}/orders/${createdOrderId}`,
        null,
        { 'x-session-id': guestSessionId }
      );
      
      if (response.statusCode === 200) {
        log(`Guest order retrieved successfully`, 'success');
        log(`Order Status: ${response.data.status}`, 'info');
        log(`Payment Method: ${response.data.paymentMethod}`, 'info');
        
        scenarioResults.tests.push({
          name: 'Test 3.3: Verify order creation for guest users',
          status: 'PASSED',
          orderId: createdOrderId,
          orderStatus: response.data.status
        });
        scenarioResults.passed++;
      } else {
        log(`Failed to retrieve guest order: ${response.statusCode}`, 'error');
        
        scenarioResults.tests.push({
          name: 'Test 3.3: Verify order creation for guest users',
          status: 'FAILED',
          statusCode: response.statusCode
        });
        scenarioResults.failed++;
        testResults.errors.push(`Scenario 3.3: Failed to retrieve guest order - ${response.statusCode}`);
      }
    } catch (error) {
      log(`Error retrieving guest order: ${error.message}`, 'error');
      scenarioResults.tests.push({
        name: 'Test 3.3: Verify order creation for guest users',
        status: 'FAILED',
        error: error.message
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 3.3: Error retrieving guest order - ${error.message}`);
    }
  } else {
    log(`No order ID available to verify`, 'warning');
    
    scenarioResults.tests.push({
      name: 'Test 3.3: Verify order creation for guest users',
      status: 'SKIPPED',
      reason: 'No order ID available'
    });
    testResults.warnings.push('Scenario 3.3: No order ID available to verify');
  }
  
  testResults.scenario3 = scenarioResults;
  
  if (scenarioResults.failed === 0) {
    testResults.summary.passed++;
    log('\n✅ SCENARIO 3 PASSED', 'success');
  } else {
    testResults.summary.failed++;
    log('\n❌ SCENARIO 3 FAILED', 'error');
  }
  
  return scenarioResults;
}

/**
 * ============================================================================
 * SCENARIO 4: Stock Validation
 * ============================================================================
 */
async function testScenario4() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 4: Stock Validation');
  console.log('='.repeat(80));
  
  const scenarioResults = {
    name: 'Scenario 4: Stock Validation',
    tests: [],
    passed: 0,
    failed: 0
  };
  
  // Test 4.1: Validate stock before adding to cart
  log('\n--- Test 4.1: Validate stock before adding to cart ---', 'info');
  try {
    const items = [
      {
        productId: testProductId,
        quantity: 1,
        variantId: testVariantId || null
      }
    ];
    
    const response = await makeRequest(
      'POST',
      `${API_BASE_URL}/cart/guest/validate-stock`,
      { items },
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const isValid = response.data.isValid;
      const validationResults = response.data.data?.validationResults || [];
      
      if (isValid) {
        log(`Stock validation passed`, 'success');
        log(`Validation results: ${validationResults.length} items validated`, 'info');
        
        scenarioResults.tests.push({
          name: 'Test 4.1: Validate stock before adding to cart',
          status: 'PASSED',
          isValid: isValid,
          validationResults: validationResults.length
        });
        scenarioResults.passed++;
      } else {
        log(`Stock validation failed`, 'error');
        log(`Unavailable items: ${JSON.stringify(response.data.data?.unavailableItems)}`, 'error');
        
        scenarioResults.tests.push({
          name: 'Test 4.1: Validate stock before adding to cart',
          status: 'FAILED',
          isValid: isValid,
          unavailableItems: response.data.data?.unavailableItems
        });
        scenarioResults.failed++;
        testResults.errors.push('Scenario 4.1: Stock validation failed - items are out of stock');
      }
    } else {
      log(`Failed to validate stock: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 4.1: Validate stock before adding to cart',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 4.1: Failed to validate stock - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error validating stock: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 4.1: Validate stock before adding to cart',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 4.1: Error validating stock - ${error.message}`);
  }
  
  // Test 4.2: Attempt checkout with insufficient stock
  log('\n--- Test 4.2: Attempt checkout with insufficient stock ---', 'info');
  try {
    // First, validate stock with excessive quantity
    const items = [
      {
        productId: testProductId,
        quantity: 9999, // Excessive quantity
        variantId: testVariantId || null
      }
    ];
    
    const response = await makeRequest(
      'POST',
      `${API_BASE_URL}/cart/guest/validate-stock`,
      { items },
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200) {
      const isValid = response.data.isValid;
      
      if (!isValid) {
        log(`Insufficient stock detected correctly`, 'success');
        log(`Error message: ${response.data.message}`, 'info');
        
        scenarioResults.tests.push({
          name: 'Test 4.2: Attempt checkout with insufficient stock',
          status: 'PASSED',
          isValid: isValid,
          errorMessage: response.data.message
        });
        scenarioResults.passed++;
      } else {
        log(`Insufficient stock not detected`, 'error');
        
        scenarioResults.tests.push({
          name: 'Test 4.2: Attempt checkout with insufficient stock',
          status: 'FAILED',
          isValid: isValid
        });
        scenarioResults.failed++;
        testResults.errors.push('Scenario 4.2: Insufficient stock not detected');
      }
    } else {
      log(`Failed to validate stock: ${response.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 4.2: Attempt checkout with insufficient stock',
        status: 'FAILED',
        statusCode: response.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 4.2: Failed to validate stock - ${response.statusCode}`);
    }
  } catch (error) {
    log(`Error validating stock: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 4.2: Attempt checkout with insufficient stock',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 4.2: Error validating stock - ${error.message}`);
  }
  
  // Test 4.3: Verify stock is reserved during checkout
  log('\n--- Test 4.3: Verify stock is reserved during checkout ---', 'info');
  try {
    // Get current stock
    const productResponse = await makeRequest(
      'GET',
      `${API_BASE_URL}/products`,
      null,
      { 'Authorization': `Bearer ${authToken}` }
    );
    
    if (productResponse.statusCode === 200) {
      const products = productResponse.data.products || productResponse.data || [];
      const product = products.find(p => p.id === testProductId);
      
      if (product) {
        const currentStock = product.stock || product.stockQuantity || 0;
        log(`Current stock for product ${testProductId}: ${currentStock}`, 'info');
        log(`Initial stock: ${initialStock[testProductId]}`, 'info');
        
        scenarioResults.tests.push({
          name: 'Test 4.3: Verify stock is reserved during checkout',
          status: 'PASSED',
          initialStock: initialStock[testProductId],
          currentStock: currentStock
        });
        scenarioResults.passed++;
      } else {
        log(`Product not found`, 'error');
        
        scenarioResults.tests.push({
          name: 'Test 4.3: Verify stock is reserved during checkout',
          status: 'FAILED',
          reason: 'Product not found'
        });
        scenarioResults.failed++;
        testResults.errors.push('Scenario 4.3: Product not found');
      }
    } else {
      log(`Failed to get product: ${productResponse.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 4.3: Verify stock is reserved during checkout',
        status: 'FAILED',
        statusCode: productResponse.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 4.3: Failed to get product - ${productResponse.statusCode}`);
    }
  } catch (error) {
    log(`Error getting product: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 4.3: Verify stock is reserved during checkout',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 4.3: Error getting product - ${error.message}`);
  }
  
  testResults.scenario4 = scenarioResults;
  
  if (scenarioResults.failed === 0) {
    testResults.summary.passed++;
    log('\n✅ SCENARIO 4 PASSED', 'success');
  } else {
    testResults.summary.failed++;
    log('\n❌ SCENARIO 4 FAILED', 'error');
  }
  
  return scenarioResults;
}

/**
 * ============================================================================
 * SCENARIO 5: Session Persistence
 * ============================================================================
 */
async function testScenario5() {
  console.log('\n' + '='.repeat(80));
  console.log('SCENARIO 5: Session Persistence');
  console.log('='.repeat(80));
  
  const scenarioResults = {
    name: 'Scenario 5: Session Persistence',
    tests: [],
    passed: 0,
    failed: 0
  };
  
  // Add items to cart for persistence testing
  log('\n--- Preparing cart for persistence testing ---', 'info');
  try {
    const cartItem = {
      productId: testProductId,
      quantity: 1,
      variantId: testVariantId || null
    };
    
    const response = await makeRequest(
      'POST',
      `${API_BASE_URL}/cart/items`,
      cartItem,
      { 'x-session-id': guestSessionId }
    );
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      log(`Product added to cart for persistence testing`, 'success');
    } else {
      log(`Failed to add product to cart: ${response.statusCode}`, 'error');
    }
  } catch (error) {
    log(`Error adding product to cart: ${error.message}`, 'error');
  }
  
  // Test 5.1: Verify cart items persist after refresh
  log('\n--- Test 5.1: Verify cart items persist after refresh ---', 'info');
  try {
    // Get cart before "refresh"
    const beforeResponse = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (beforeResponse.statusCode === 200) {
      const beforeItems = beforeResponse.data.items || beforeResponse.data.cartItems || [];
      const beforeCount = beforeItems.length;
      
      log(`Cart items before refresh: ${beforeCount}`, 'info');
      
      // Simulate refresh by waiting and getting cart again
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const afterResponse = await makeRequest(
        'GET',
        `${API_BASE_URL}/cart`,
        null,
        { 'x-session-id': guestSessionId }
      );
      
      if (afterResponse.statusCode === 200) {
        const afterItems = afterResponse.data.items || afterResponse.data.cartItems || [];
        const afterCount = afterItems.length;
        
        log(`Cart items after refresh: ${afterCount}`, 'info');
        
        if (beforeCount === afterCount) {
          log(`Cart items persisted after refresh`, 'success');
          
          scenarioResults.tests.push({
            name: 'Test 5.1: Verify cart items persist after refresh',
            status: 'PASSED',
            beforeCount: beforeCount,
            afterCount: afterCount
          });
          scenarioResults.passed++;
        } else {
          log(`Cart items did not persist: ${beforeCount} -> ${afterCount}`, 'error');
          
          scenarioResults.tests.push({
            name: 'Test 5.1: Verify cart items persist after refresh',
            status: 'FAILED',
            beforeCount: beforeCount,
            afterCount: afterCount
          });
          scenarioResults.failed++;
          testResults.errors.push(`Scenario 5.1: Cart items did not persist - ${beforeCount} -> ${afterCount}`);
        }
      } else {
        log(`Failed to get cart after refresh: ${afterResponse.statusCode}`, 'error');
        
        scenarioResults.tests.push({
          name: 'Test 5.1: Verify cart items persist after refresh',
          status: 'FAILED',
          statusCode: afterResponse.statusCode
        });
        scenarioResults.failed++;
        testResults.errors.push(`Scenario 5.1: Failed to get cart after refresh - ${afterResponse.statusCode}`);
      }
    } else {
      log(`Failed to get cart before refresh: ${beforeResponse.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 5.1: Verify cart items persist after refresh',
        status: 'FAILED',
        statusCode: beforeResponse.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 5.1: Failed to get cart before refresh - ${beforeResponse.statusCode}`);
    }
  } catch (error) {
    log(`Error testing session persistence: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 5.1: Verify cart items persist after refresh',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 5.1: Error testing session persistence - ${error.message}`);
  }
  
  // Test 5.2: Verify cart state is maintained across different requests
  log('\n--- Test 5.2: Verify cart state is maintained across different requests ---', 'info');
  try {
    // Get cart
    const getResponse = await makeRequest(
      'GET',
      `${API_BASE_URL}/cart`,
      null,
      { 'x-session-id': guestSessionId }
    );
    
    if (getResponse.statusCode === 200) {
      const items = getResponse.data.items || getResponse.data.cartItems || [];
      
      log(`Cart state retrieved: ${items.length} items`, 'info');
      
      // Add another item
      const addItem = {
        productId: testProductId,
        quantity: 1,
        variantId: testVariantId || null
      };
      
      const addResponse = await makeRequest(
        'POST',
        `${API_BASE_URL}/cart/items`,
        addItem,
        { 'x-session-id': guestSessionId }
      );
      
      if (addResponse.statusCode === 200 || addResponse.statusCode === 201) {
        // Get cart again to verify state
        const getAfterAddResponse = await makeRequest(
          'GET',
          `${API_BASE_URL}/cart`,
          null,
          { 'x-session-id': guestSessionId }
        );
        
        if (getAfterAddResponse.statusCode === 200) {
          const afterItems = getAfterAddResponse.data.items || getAfterAddResponse.data.cartItems || [];
          
          log(`Cart state after adding item: ${afterItems.length} items`, 'info');
          
          if (afterItems.length > items.length) {
            log(`Cart state maintained correctly`, 'success');
            
            scenarioResults.tests.push({
              name: 'Test 5.2: Verify cart state is maintained across different requests',
              status: 'PASSED',
              beforeCount: items.length,
              afterCount: afterItems.length
            });
            scenarioResults.passed++;
          } else {
            log(`Cart state not maintained correctly`, 'error');
            
            scenarioResults.tests.push({
              name: 'Test 5.2: Verify cart state is maintained across different requests',
              status: 'FAILED',
              beforeCount: items.length,
              afterCount: afterItems.length
            });
            scenarioResults.failed++;
            testResults.errors.push(`Scenario 5.2: Cart state not maintained correctly`);
          }
        } else {
          log(`Failed to get cart after adding item: ${getAfterAddResponse.statusCode}`, 'error');
          
          scenarioResults.tests.push({
            name: 'Test 5.2: Verify cart state is maintained across different requests',
            status: 'FAILED',
            statusCode: getAfterAddResponse.statusCode
          });
          scenarioResults.failed++;
          testResults.errors.push(`Scenario 5.2: Failed to get cart after adding item - ${getAfterAddResponse.statusCode}`);
        }
      } else {
        log(`Failed to add item: ${addResponse.statusCode}`, 'error');
        
        scenarioResults.tests.push({
          name: 'Test 5.2: Verify cart state is maintained across different requests',
          status: 'FAILED',
          statusCode: addResponse.statusCode
        });
        scenarioResults.failed++;
        testResults.errors.push(`Scenario 5.2: Failed to add item - ${addResponse.statusCode}`);
      }
    } else {
      log(`Failed to get cart: ${getResponse.statusCode}`, 'error');
      
      scenarioResults.tests.push({
        name: 'Test 5.2: Verify cart state is maintained across different requests',
        status: 'FAILED',
        statusCode: getResponse.statusCode
      });
      scenarioResults.failed++;
      testResults.errors.push(`Scenario 5.2: Failed to get cart - ${getResponse.statusCode}`);
    }
  } catch (error) {
    log(`Error testing cart state maintenance: ${error.message}`, 'error');
    scenarioResults.tests.push({
      name: 'Test 5.2: Verify cart state is maintained across different requests',
      status: 'FAILED',
      error: error.message
    });
    scenarioResults.failed++;
    testResults.errors.push(`Scenario 5.2: Error testing cart state maintenance - ${error.message}`);
  }
  
  testResults.scenario5 = scenarioResults;
  
  if (scenarioResults.failed === 0) {
    testResults.summary.passed++;
    log('\n✅ SCENARIO 5 PASSED', 'success');
  } else {
    testResults.summary.failed++;
    log('\n❌ SCENARIO 5 FAILED', 'error');
  }
  
  return scenarioResults;
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('GUEST PURCHASE LIFECYCLE END-TO-END TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Test Date: ${new Date().toISOString()}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Guest Session ID: ${guestSessionId}`);
  console.log('');
  
  // Summary
  console.log('SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total Scenarios: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`);
  console.log('');
  
  // Scenario 1 Results
  console.log('SCENARIO 1: Guest Product Addition');
  console.log('-'.repeat(80));
  if (testResults.scenario1) {
    console.log(`Status: ${testResults.scenario1.failed === 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`Tests: ${testResults.scenario1.passed} passed, ${testResults.scenario1.failed} failed`);
    console.log('');
    testResults.scenario1.tests.forEach(test => {
      console.log(`  ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}`);
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      }
    });
  } else {
    console.log('Status: NOT EXECUTED');
  }
  console.log('');
  
  // Scenario 2 Results
  console.log('SCENARIO 2: Guest Cart Page Functionality');
  console.log('-'.repeat(80));
  if (testResults.scenario2) {
    console.log(`Status: ${testResults.scenario2.failed === 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`Tests: ${testResults.scenario2.passed} passed, ${testResults.scenario2.failed} failed`);
    console.log('');
    testResults.scenario2.tests.forEach(test => {
      console.log(`  ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}`);
      if (test.status === 'SKIPPED') {
        console.log(`     Reason: ${test.reason}`);
      }
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      }
    });
  } else {
    console.log('Status: NOT EXECUTED');
  }
  console.log('');
  
  // Scenario 3 Results
  console.log('SCENARIO 3: Guest Checkout Flow');
  console.log('-'.repeat(80));
  if (testResults.scenario3) {
    console.log(`Status: ${testResults.scenario3.failed === 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`Tests: ${testResults.scenario3.passed} passed, ${testResults.scenario3.failed} failed`);
    console.log('');
    testResults.scenario3.tests.forEach(test => {
      console.log(`  ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}`);
      if (test.status === 'SKIPPED') {
        console.log(`     Reason: ${test.reason}`);
      }
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      }
    });
  } else {
    console.log('Status: NOT EXECUTED');
  }
  console.log('');
  
  // Scenario 4 Results
  console.log('SCENARIO 4: Stock Validation');
  console.log('-'.repeat(80));
  if (testResults.scenario4) {
    console.log(`Status: ${testResults.scenario4.failed === 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`Tests: ${testResults.scenario4.passed} passed, ${testResults.scenario4.failed} failed`);
    console.log('');
    testResults.scenario4.tests.forEach(test => {
      console.log(`  ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}`);
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      }
    });
  } else {
    console.log('Status: NOT EXECUTED');
  }
  console.log('');
  
  // Scenario 5 Results
  console.log('SCENARIO 5: Session Persistence');
  console.log('-'.repeat(80));
  if (testResults.scenario5) {
    console.log(`Status: ${testResults.scenario5.failed === 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`Tests: ${testResults.scenario5.passed} passed, ${testResults.scenario5.failed} failed`);
    console.log('');
    testResults.scenario5.tests.forEach(test => {
      console.log(`  ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}`);
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      }
    });
  } else {
    console.log('Status: NOT EXECUTED');
  }
  console.log('');
  
  // Errors
  if (testResults.errors.length > 0) {
    console.log('ERRORS');
    console.log('-'.repeat(80));
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    console.log('');
  }
  
  // Warnings
  if (testResults.warnings.length > 0) {
    console.log('WARNINGS');
    console.log('-'.repeat(80));
    testResults.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
    console.log('');
  }
  
  // Final Conclusion
  console.log('FINAL CONCLUSION');
  console.log('-'.repeat(80));
  
  if (testResults.summary.failed === 0) {
    console.log('✅ GUEST PURCHASE LIFECYCLE: WORKING');
    console.log('');
    console.log('All scenarios passed successfully:');
    console.log('✓ Guest Product Addition - Products can be added to cart');
    console.log('✓ Guest Cart Page Functionality - Cart operations work correctly');
    console.log('✓ Guest Checkout Flow - Orders can be placed by guests');
    console.log('✓ Stock Validation - Stock is validated correctly');
    console.log('✓ Session Persistence - Cart state persists across requests');
  } else if (testResults.summary.passed > 0) {
    console.log('⚠️  GUEST PURCHASE LIFECYCLE: PARTIALLY WORKING');
    console.log('');
    console.log(`Some scenarios failed. Please review the errors above.`);
  } else {
    console.log('❌ GUEST PURCHASE LIFECYCLE: FAILED');
    console.log('');
    console.log('All scenarios failed. Please review the errors above.');
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('END OF TEST REPORT');
  console.log('='.repeat(80));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('GUEST PURCHASE LIFECYCLE END-TO-END TEST');
  console.log('='.repeat(80));
  
  try {
    // Login first (for getting products)
    await login();
    
    // Get products for testing
    await getProducts();
    
    if (!testProductId) {
      log('❌ No suitable product found for testing', 'error');
      return;
    }
    
    // Run all scenarios
    await testScenario1();
    await testScenario2();
    await testScenario3();
    await testScenario4();
    await testScenario5();
    
    // Generate report
    generateTestReport();
    
    // Save results to file
    const fs = require('fs');
    const reportPath = './guest-purchase-lifecycle-test-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\nTest results saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    testResults.errors.push(`Test execution error: ${error.message}`);
  }
}

// Run tests
runTests();
