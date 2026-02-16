/**
 * Billing Calculation Fix Verification Test
 * 
 * This test verifies that the billing calculation fixes for order ORD1770998605760578 are working correctly.
 * 
 * Bugs Fixed:
 * 1. Double Discount Bug: Removed the discount calculation loop that was incorrectly applying a second 
 *    discount at the order level. The discount is already applied at the cart level via item.unitPrice.
 * 2. Free Shipping Logic: Implemented free shipping for orders with subtotal >= 5000 
 *    (shippingCost = subtotal >= 5000 ? 0 : 100).
 * 
 * Test Scenarios:
 * 1. Exact scenario from bug report (ORD1770998605760578)
 * 2. Edge cases for free shipping (4999, 5000, 5001)
 * 3. Verification that discounts are not double-applied
 * 4. Multiple scenarios with different combinations of discounts and shipping
 */

const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  identifier: 'raselbepari88@gmail.com',
  password: '74Vfo^71~_oY'
};

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  verbose: true
};

// Global variables
let authToken = null;
let testProductId1 = null; // For discounted item (HP 15-fc0659au)
let testProductId2 = null; // For non-discounted item (HP 15-fr0076TU)
let testProductIdLowPrice = null; // For edge case testing
let testProductIdHighPrice = null; // For edge case testing
let testAddressId = null;

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    skip: '⏭️'
  };
  
  console.log(`${prefix[type]} [${timestamp}] ${message}`);
}

function makeRequest(method, url, data = null, headers = {}) {
  const config = {
    method,
    url: `${API_BASE_URL}${url}`,
    timeout: TEST_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

async function testEndpoint(description, testFn) {
  log(`Testing: ${description}`, 'info');
  
  try {
    const result = await testFn();
    log(`SUCCESS: ${description}`, 'success');
    return { success: true, result };
  } catch (error) {
    const errorMsg = error.response ? 
      `${error.response.status}: ${JSON.stringify(error.response.data)}` : 
      error.message;
    log(`FAILED: ${description} - ${errorMsg}`, 'error');
    return { success: false, error: errorMsg, status: error.response?.status };
  }
}

// Helper functions
async function login() {
  log('=== Login ===', 'info');
  try {
    const response = await makeRequest('POST', '/auth/login', TEST_USER);
    
    if (response.status === 200 || response.status === 201) {
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
      log(`Login failed: ${response.status}`, 'error');
      log(`Error: ${response.data.message || 'Unknown error'}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Login error: ${error.message}`, 'error');
    return false;
  }
}

async function getProducts() {
  log('\n=== Get Products ===', 'info');
  try {
    const response = await makeRequest('GET', '/products?limit=50', null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.status === 200) {
      const products = response.data.products || response.data || [];
      log(`Retrieved ${products.length} products`, 'success');
      
      // Find products with different price ranges
      const productsWithSalePrice = products.filter(p => 
        p.salePrice && parseFloat(p.salePrice) > 0 && parseFloat(p.salePrice) < parseFloat(p.regularPrice)
      );
      
      const productsWithoutSalePrice = products.filter(p => 
        !p.salePrice || parseFloat(p.salePrice) <= 0 || parseFloat(p.salePrice) >= parseFloat(p.regularPrice)
      );
      
      const lowPriceProducts = products.filter(p => parseFloat(p.regularPrice) < 5000);
      const highPriceProducts = products.filter(p => parseFloat(p.regularPrice) >= 5000);
      
      if (productsWithSalePrice.length > 0) {
        testProductId1 = productsWithSalePrice[0].id;
        log(`Selected discounted product ID: ${testProductId1}`, 'info');
        log(`  Regular Price: ${productsWithSalePrice[0].regularPrice}`, 'info');
        log(`  Sale Price: ${productsWithSalePrice[0].salePrice}`, 'info');
      }
      
      if (productsWithoutSalePrice.length > 0) {
        testProductId2 = productsWithoutSalePrice[0].id;
        log(`Selected non-discounted product ID: ${testProductId2}`, 'info');
        log(`  Regular Price: ${productsWithoutSalePrice[0].regularPrice}`, 'info');
      }
      
      if (lowPriceProducts.length > 0) {
        testProductIdLowPrice = lowPriceProducts[0].id;
        log(`Selected low price product ID: ${testProductIdLowPrice}`, 'info');
        log(`  Regular Price: ${lowPriceProducts[0].regularPrice}`, 'info');
      }
      
      if (highPriceProducts.length > 0) {
        testProductIdHighPrice = highPriceProducts[0].id;
        log(`Selected high price product ID: ${testProductIdHighPrice}`, 'info');
        log(`  Regular Price: ${highPriceProducts[0].regularPrice}`, 'info');
      }
      
      return products;
    } else {
      log(`Get products failed: ${response.status}`, 'error');
      return [];
    }
  } catch (error) {
    log(`Get products error: ${error.message}`, 'error');
    return [];
  }
}

async function getOrCreateAddress() {
  log('\n=== Get or Create Address ===', 'info');
  try {
    // Since there's no /addresses endpoint, we'll return a shipping address object
    // that will be used directly in the order creation
    const shippingAddress = {
      firstName: 'Test',
      lastName: 'User',
      phone: '01234567890',
      addressLine1: '123 Test Street',
      addressLine2: 'Apt 4B',
      city: 'Dhaka',
      state: 'Dhaka',
      postalCode: '1000',
      country: 'Bangladesh'
    };
    
    log('Using shipping address object for order creation', 'success');
    return shippingAddress;
  } catch (error) {
    log(`Address error: ${error.message}`, 'error');
    return null;
  }
}

async function createOrder(orderData) {
  // Use shippingAddress instead of addressId
  const orderPayload = {
    ...orderData,
    shippingAddress: testAddressId // testAddressId now contains the shippingAddress object
  };
  // Remove addressId if present
  delete orderPayload.addressId;
  
  const response = await makeRequest('POST', '/orders', orderPayload, {
    'Authorization': `Bearer ${authToken}`
  });
  return response;
}

// ============================================================================
// TEST 1: Exact scenario from bug report (ORD1770998605760578)
// ============================================================================
const test1 = {
  name: 'Test 1: Exact scenario from bug report (ORD1770998605760578)',
  test: async () => {
    log('\n--- Test 1 Details ---', 'info');
    log('Testing the exact scenario from the bug report:', 'info');
    log('  - Item 1: HP 15-fc0659au Ryzen 5 7520U - Original: 1000, 15% discount = 850', 'info');
    log('  - Item 2: HP 15-fr0076TU Core i5 13th Gen - Original: 5000, 0% discount = 5000', 'info');
    log('  - Expected Subtotal: 5850', 'info');
    log('  - Expected Shipping: 0 (free shipping because subtotal >= 5000)', 'info');
    log('  - Expected Discount: 0 (no additional discount needed)', 'info');
    log('  - Expected Total: 5850', 'info');

    if (!testProductId1 || !testProductId2) {
      throw new Error('Required products not available for this test');
    }

    const orderData = {
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [
        {
          productId: testProductId1,
          quantity: 1,
          unitPrice: 850 // Simulating discounted price (1000 - 15%)
        },
        {
          productId: testProductId2,
          quantity: 1,
          unitPrice: 5000 // No discount
        }
      ]
    };

    log(`Creating order with items: ${JSON.stringify(orderData.items)}`, 'info');

    const response = await createOrder(orderData);

    log(`Response status: ${response.status}`, 'info');

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected status 201 or 200, got ${response.status}`);
    }
    log('✓ Order created successfully', 'success');

    const order = response.data.order;

    // Verify order structure
    if (!order) {
      throw new Error('Order object missing from response');
    }
    log('✓ Order object exists', 'success');

    // Verify subtotal
    if (typeof order.subtotal !== 'number') {
      throw new Error(`Subtotal should be a number, got ${typeof order.subtotal}`);
    }
    log(`✓ Subtotal is a number: ${order.subtotal}`, 'success');

    // Verify expected subtotal (allowing for small floating point differences)
    const expectedSubtotal = 5850;
    const subtotalDiff = Math.abs(order.subtotal - expectedSubtotal);
    if (subtotalDiff > 0.01) {
      throw new Error(`Expected subtotal ${expectedSubtotal}, got ${order.subtotal} (difference: ${subtotalDiff})`);
    }
    log(`✓ Subtotal is correct: ${order.subtotal} (expected: ${expectedSubtotal})`, 'success');

    // Verify shipping cost (should be 0 for free shipping)
    if (typeof order.shippingCost !== 'number') {
      throw new Error(`Shipping cost should be a number, got ${typeof order.shippingCost}`);
    }
    log(`✓ Shipping cost is a number: ${order.shippingCost}`, 'success');

    const expectedShipping = 0;
    if (order.shippingCost !== expectedShipping) {
      throw new Error(`Expected shipping cost ${expectedShipping}, got ${order.shippingCost}`);
    }
    log(`✓ Shipping cost is correct: ${order.shippingCost} (expected: ${expectedShipping} - free shipping)`, 'success');

    // Verify discount (should be 0 - no double discount)
    if (typeof order.discount !== 'number') {
      throw new Error(`Discount should be a number, got ${typeof order.discount}`);
    }
    log(`✓ Discount is a number: ${order.discount}`, 'success');

    const expectedDiscount = 0;
    if (order.discount !== expectedDiscount) {
      throw new Error(`Expected discount ${expectedDiscount}, got ${order.discount} - Double discount bug may still exist!`);
    }
    log(`✓ Discount is correct: ${order.discount} (expected: ${expectedDiscount} - no double discount)`, 'success');

    // Verify total
    if (typeof order.total !== 'number') {
      throw new Error(`Total should be a number, got ${typeof order.total}`);
    }
    log(`✓ Total is a number: ${order.total}`, 'success');

    const expectedTotal = 5850;
    const totalDiff = Math.abs(order.total - expectedTotal);
    if (totalDiff > 0.01) {
      throw new Error(`Expected total ${expectedTotal}, got ${order.total} (difference: ${totalDiff})`);
    }
    log(`✓ Total is correct: ${order.total} (expected: ${expectedTotal})`, 'success');

    // Verify the calculation: total = subtotal + tax + shipping - discount
    const calculatedTotal = order.subtotal + (order.tax || 0) + order.shippingCost - order.discount;
    const calcDiff = Math.abs(order.total - calculatedTotal);
    if (calcDiff > 0.01) {
      throw new Error(`Total calculation mismatch: expected ${calculatedTotal}, got ${order.total}`);
    }
    log(`✓ Total calculation is correct: ${order.subtotal} + ${order.tax || 0} + ${order.shippingCost} - ${order.discount} = ${order.total}`, 'success');

    log('\n--- Test 1 Passed ---', 'success');
    log('✓ Bug #1 (Double Discount) is FIXED: Discount is 0, not subtracted again', 'success');
    log('✓ Bug #2 (Free Shipping) is FIXED: Shipping is 0 for subtotal >= 5000', 'success');
    log('✓ Total is correct: 5850 (matches expected value)', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 2: Edge case - Order with subtotal = 4999 (no free shipping)
// ============================================================================
const test2 = {
  name: 'Test 2: Edge case - Order with subtotal = 4999 (no free shipping)',
  test: async () => {
    log('\n--- Test 2 Details ---', 'info');
    log('Testing edge case for free shipping threshold:', 'info');
    log('  - Subtotal: 4999 (just below threshold)', 'info');
    log('  - Expected Shipping: 100 (no free shipping)', 'info');

    if (!testProductIdLowPrice) {
      throw new Error('Required product not available for this test');
    }

    const orderData = {
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [
        {
          productId: testProductIdLowPrice,
          quantity: 1,
          unitPrice: 4999
        }
      ]
    };

    log(`Creating order with items: ${JSON.stringify(orderData.items)}`, 'info');

    const response = await createOrder(orderData);

    log(`Response status: ${response.status}`, 'info');

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected status 201 or 200, got ${response.status}`);
    }
    log('✓ Order created successfully', 'success');

    const order = response.data.order;

    // Verify subtotal
    const expectedSubtotal = 4999;
    const subtotalDiff = Math.abs(order.subtotal - expectedSubtotal);
    if (subtotalDiff > 0.01) {
      throw new Error(`Expected subtotal ${expectedSubtotal}, got ${order.subtotal}`);
    }
    log(`✓ Subtotal is correct: ${order.subtotal}`, 'success');

    // Verify shipping cost (should be 100 for subtotal < 5000)
    const expectedShipping = 100;
    if (order.shippingCost !== expectedShipping) {
      throw new Error(`Expected shipping cost ${expectedShipping}, got ${order.shippingCost}`);
    }
    log(`✓ Shipping cost is correct: ${order.shippingCost} (expected: ${expectedShipping} - no free shipping)`, 'success');

    // Verify total = subtotal + shipping (assuming no tax and no discount)
    const expectedTotal = expectedSubtotal + expectedShipping;
    const totalDiff = Math.abs(order.total - expectedTotal);
    if (totalDiff > 0.01) {
      throw new Error(`Expected total ${expectedTotal}, got ${order.total}`);
    }
    log(`✓ Total is correct: ${order.total} (subtotal ${order.subtotal} + shipping ${order.shippingCost})`, 'success');

    log('\n--- Test 2 Passed ---', 'success');
    log('✓ Free shipping threshold works correctly for subtotal < 5000', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 3: Edge case - Order with subtotal = 5000 (free shipping threshold)
// ============================================================================
const test3 = {
  name: 'Test 3: Edge case - Order with subtotal = 5000 (free shipping threshold)',
  test: async () => {
    log('\n--- Test 3 Details ---', 'info');
    log('Testing edge case for free shipping threshold:', 'info');
    log('  - Subtotal: 5000 (exactly at threshold)', 'info');
    log('  - Expected Shipping: 0 (free shipping)', 'info');

    if (!testProductIdHighPrice) {
      throw new Error('Required product not available for this test');
    }

    const orderData = {
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [
        {
          productId: testProductIdHighPrice,
          quantity: 1,
          unitPrice: 5000
        }
      ]
    };

    log(`Creating order with items: ${JSON.stringify(orderData.items)}`, 'info');

    const response = await createOrder(orderData);

    log(`Response status: ${response.status}`, 'info');

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected status 201 or 200, got ${response.status}`);
    }
    log('✓ Order created successfully', 'success');

    const order = response.data.order;

    // Verify subtotal
    const expectedSubtotal = 5000;
    const subtotalDiff = Math.abs(order.subtotal - expectedSubtotal);
    if (subtotalDiff > 0.01) {
      throw new Error(`Expected subtotal ${expectedSubtotal}, got ${order.subtotal}`);
    }
    log(`✓ Subtotal is correct: ${order.subtotal}`, 'success');

    // Verify shipping cost (should be 0 for subtotal >= 5000)
    const expectedShipping = 0;
    if (order.shippingCost !== expectedShipping) {
      throw new Error(`Expected shipping cost ${expectedShipping}, got ${order.shippingCost}`);
    }
    log(`✓ Shipping cost is correct: ${order.shippingCost} (expected: ${expectedShipping} - free shipping)`, 'success');

    // Verify total = subtotal (assuming no tax and no discount)
    const expectedTotal = expectedSubtotal;
    const totalDiff = Math.abs(order.total - expectedTotal);
    if (totalDiff > 0.01) {
      throw new Error(`Expected total ${expectedTotal}, got ${order.total}`);
    }
    log(`✓ Total is correct: ${order.total}`, 'success');

    log('\n--- Test 3 Passed ---', 'success');
    log('✓ Free shipping threshold works correctly for subtotal = 5000', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 4: Edge case - Order with subtotal = 5001 (just above threshold)
// ============================================================================
const test4 = {
  name: 'Test 4: Edge case - Order with subtotal = 5001 (just above threshold)',
  test: async () => {
    log('\n--- Test 4 Details ---', 'info');
    log('Testing edge case for free shipping threshold:', 'info');
    log('  - Subtotal: 5001 (just above threshold)', 'info');
    log('  - Expected Shipping: 0 (free shipping)', 'info');

    if (!testProductIdHighPrice) {
      throw new Error('Required product not available for this test');
    }

    const orderData = {
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [
        {
          productId: testProductIdHighPrice,
          quantity: 1,
          unitPrice: 5001
        }
      ]
    };

    log(`Creating order with items: ${JSON.stringify(orderData.items)}`, 'info');

    const response = await createOrder(orderData);

    log(`Response status: ${response.status}`, 'info');

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected status 201 or 200, got ${response.status}`);
    }
    log('✓ Order created successfully', 'success');

    const order = response.data.order;

    // Verify subtotal
    const expectedSubtotal = 5001;
    const subtotalDiff = Math.abs(order.subtotal - expectedSubtotal);
    if (subtotalDiff > 0.01) {
      throw new Error(`Expected subtotal ${expectedSubtotal}, got ${order.subtotal}`);
    }
    log(`✓ Subtotal is correct: ${order.subtotal}`, 'success');

    // Verify shipping cost (should be 0 for subtotal >= 5000)
    const expectedShipping = 0;
    if (order.shippingCost !== expectedShipping) {
      throw new Error(`Expected shipping cost ${expectedShipping}, got ${order.shippingCost}`);
    }
    log(`✓ Shipping cost is correct: ${order.shippingCost} (expected: ${expectedShipping} - free shipping)`, 'success');

    // Verify total = subtotal (assuming no tax and no discount)
    const expectedTotal = expectedSubtotal;
    const totalDiff = Math.abs(order.total - expectedTotal);
    if (totalDiff > 0.01) {
      throw new Error(`Expected total ${expectedTotal}, got ${order.total}`);
    }
    log(`✓ Total is correct: ${order.total}`, 'success');

    log('\n--- Test 4 Passed ---', 'success');
    log('✓ Free shipping threshold works correctly for subtotal > 5000', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 5: Verify discounts are not double-applied
// ============================================================================
const test5 = {
  name: 'Test 5: Verify discounts are not double-applied',
  test: async () => {
    log('\n--- Test 5 Details ---', 'info');
    log('Testing that discounts are not double-applied:', 'info');
    log('  - Create an order with a discounted item', 'info');
    log('  - Verify that totalDiscount is 0 (not subtracted again)', 'info');
    log('  - Verify that the final total equals the subtotal (plus shipping and tax)', 'info');

    if (!testProductId1) {
      throw new Error('Required product not available for this test');
    }

    // Simulate a discounted item (regular price 1000, discounted to 850)
    const regularPrice = 1000;
    const discountedPrice = 850;
    const discountAmount = regularPrice - discountedPrice; // 150

    const orderData = {
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [
        {
          productId: testProductId1,
          quantity: 1,
          unitPrice: discountedPrice // Already discounted price
        }
      ]
    };

    log(`Creating order with discounted item:`, 'info');
    log(`  Regular Price: ${regularPrice}`, 'info');
    log(`  Discounted Price: ${discountedPrice}`, 'info');
    log(`  Discount Amount: ${discountAmount}`, 'info');

    const response = await createOrder(orderData);

    log(`Response status: ${response.status}`, 'info');

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected status 201 or 200, got ${response.status}`);
    }
    log('✓ Order created successfully', 'success');

    const order = response.data.order;

    // Verify subtotal uses discounted price
    const expectedSubtotal = discountedPrice;
    const subtotalDiff = Math.abs(order.subtotal - expectedSubtotal);
    if (subtotalDiff > 0.01) {
      throw new Error(`Expected subtotal ${expectedSubtotal}, got ${order.subtotal}`);
    }
    log(`✓ Subtotal uses discounted price: ${order.subtotal}`, 'success');

    // Verify discount is 0 (not double-applied)
    const expectedDiscount = 0;
    if (order.discount !== expectedDiscount) {
      throw new Error(
        `Expected discount ${expectedDiscount}, got ${order.discount}. ` +
        `This indicates the discount is being double-applied! ` +
        `The ${discountAmount} discount is already in the unitPrice (${discountedPrice}), ` +
        `so it should NOT be subtracted again at the order level.`
      );
    }
    log(`✓ Discount is 0 (not double-applied)`, 'success');
    log(`  Note: The ${discountAmount} discount is already reflected in the unitPrice`, 'info');

    // Verify total calculation
    const expectedTotal = order.subtotal + (order.tax || 0) + order.shippingCost - order.discount;
    const totalDiff = Math.abs(order.total - expectedTotal);
    if (totalDiff > 0.01) {
      throw new Error(`Expected total ${expectedTotal}, got ${order.total}`);
    }
    log(`✓ Total calculation is correct: ${order.total}`, 'success');

    log('\n--- Test 5 Passed ---', 'success');
    log('✓ Discounts are NOT double-applied (Bug #1 is FIXED)', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 6: Order with no discounts and no free shipping
// ============================================================================
const test6 = {
  name: 'Test 6: Order with no discounts and no free shipping',
  test: async () => {
    log('\n--- Test 6 Details ---', 'info');
    log('Testing order with no discounts and no free shipping:', 'info');
    log('  - Subtotal < 5000 (no free shipping)', 'info');
    log('  - No discounts on items', 'info');
    log('  - Expected: Shipping = 100, Discount = 0', 'info');

    if (!testProductIdLowPrice) {
      throw new Error('Required product not available for this test');
    }

    const orderData = {
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [
        {
          productId: testProductIdLowPrice,
          quantity: 1,
          unitPrice: 1000 // No discount
        }
      ]
    };

    log(`Creating order with items: ${JSON.stringify(orderData.items)}`, 'info');

    const response = await createOrder(orderData);

    log(`Response status: ${response.status}`, 'info');

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected status 201 or 200, got ${response.status}`);
    }
    log('✓ Order created successfully', 'success');

    const order = response.data.order;

    // Verify subtotal
    const expectedSubtotal = 1000;
    const subtotalDiff = Math.abs(order.subtotal - expectedSubtotal);
    if (subtotalDiff > 0.01) {
      throw new Error(`Expected subtotal ${expectedSubtotal}, got ${order.subtotal}`);
    }
    log(`✓ Subtotal is correct: ${order.subtotal}`, 'success');

    // Verify shipping cost (should be 100 for subtotal < 5000)
    const expectedShipping = 100;
    if (order.shippingCost !== expectedShipping) {
      throw new Error(`Expected shipping cost ${expectedShipping}, got ${order.shippingCost}`);
    }
    log(`✓ Shipping cost is correct: ${order.shippingCost}`, 'success');

    // Verify discount is 0
    const expectedDiscount = 0;
    if (order.discount !== expectedDiscount) {
      throw new Error(`Expected discount ${expectedDiscount}, got ${order.discount}`);
    }
    log(`✓ Discount is correct: ${order.discount}`, 'success');

    // Verify total = subtotal + shipping
    const expectedTotal = expectedSubtotal + expectedShipping;
    const totalDiff = Math.abs(order.total - expectedTotal);
    if (totalDiff > 0.01) {
      throw new Error(`Expected total ${expectedTotal}, got ${order.total}`);
    }
    log(`✓ Total is correct: ${order.total}`, 'success');

    log('\n--- Test 6 Passed ---', 'success');
    log('✓ Order with no discounts and no free shipping works correctly', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 7: Order with discounts and free shipping
// ============================================================================
const test7 = {
  name: 'Test 7: Order with discounts and free shipping',
  test: async () => {
    log('\n--- Test 7 Details ---', 'info');
    log('Testing order with discounts and free shipping:', 'info');
    log('  - Subtotal >= 5000 (free shipping)', 'info');
    log('  - Items have discounted prices', 'info');
    log('  - Expected: Shipping = 0, Discount = 0 (not double-applied)', 'info');

    if (!testProductId1 || !testProductId2) {
      throw new Error('Required products not available for this test');
    }

    const orderData = {
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [
        {
          productId: testProductId1,
          quantity: 2,
          unitPrice: 850 // Discounted price
        },
        {
          productId: testProductId2,
          quantity: 1,
          unitPrice: 5000
        }
      ]
    };

    log(`Creating order with items: ${JSON.stringify(orderData.items)}`, 'info');

    const response = await createOrder(orderData);

    log(`Response status: ${response.status}`, 'info');

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected status 201 or 200, got ${response.status}`);
    }
    log('✓ Order created successfully', 'success');

    const order = response.data.order;

    // Verify subtotal
    const expectedSubtotal = (850 * 2) + 5000; // 6700
    const subtotalDiff = Math.abs(order.subtotal - expectedSubtotal);
    if (subtotalDiff > 0.01) {
      throw new Error(`Expected subtotal ${expectedSubtotal}, got ${order.subtotal}`);
    }
    log(`✓ Subtotal is correct: ${order.subtotal}`, 'success');

    // Verify shipping cost (should be 0 for subtotal >= 5000)
    const expectedShipping = 0;
    if (order.shippingCost !== expectedShipping) {
      throw new Error(`Expected shipping cost ${expectedShipping}, got ${order.shippingCost}`);
    }
    log(`✓ Shipping cost is correct: ${order.shippingCost} (free shipping)`, 'success');

    // Verify discount is 0 (not double-applied)
    const expectedDiscount = 0;
    if (order.discount !== expectedDiscount) {
      throw new Error(`Expected discount ${expectedDiscount}, got ${order.discount}`);
    }
    log(`✓ Discount is correct: ${order.discount} (not double-applied)`, 'success');

    // Verify total = subtotal
    const expectedTotal = expectedSubtotal;
    const totalDiff = Math.abs(order.total - expectedTotal);
    if (totalDiff > 0.01) {
      throw new Error(`Expected total ${expectedTotal}, got ${order.total}`);
    }
    log(`✓ Total is correct: ${order.total}`, 'success');

    log('\n--- Test 7 Passed ---', 'success');
    log('✓ Order with discounts and free shipping works correctly', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 8: Order with no discounts and free shipping
// ============================================================================
const test8 = {
  name: 'Test 8: Order with no discounts and free shipping',
  test: async () => {
    log('\n--- Test 8 Details ---', 'info');
    log('Testing order with no discounts and free shipping:', 'info');
    log('  - Subtotal >= 5000 (free shipping)', 'info');
    log('  - No discounts on items', 'info');
    log('  - Expected: Shipping = 0, Discount = 0', 'info');

    if (!testProductIdHighPrice) {
      throw new Error('Required product not available for this test');
    }

    const orderData = {
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [
        {
          productId: testProductIdHighPrice,
          quantity: 1,
          unitPrice: 6000 // No discount, qualifies for free shipping
        }
      ]
    };

    log(`Creating order with items: ${JSON.stringify(orderData.items)}`, 'info');

    const response = await createOrder(orderData);

    log(`Response status: ${response.status}`, 'info');

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected status 201 or 200, got ${response.status}`);
    }
    log('✓ Order created successfully', 'success');

    const order = response.data.order;

    // Verify subtotal
    const expectedSubtotal = 6000;
    const subtotalDiff = Math.abs(order.subtotal - expectedSubtotal);
    if (subtotalDiff > 0.01) {
      throw new Error(`Expected subtotal ${expectedSubtotal}, got ${order.subtotal}`);
    }
    log(`✓ Subtotal is correct: ${order.subtotal}`, 'success');

    // Verify shipping cost (should be 0 for subtotal >= 5000)
    const expectedShipping = 0;
    if (order.shippingCost !== expectedShipping) {
      throw new Error(`Expected shipping cost ${expectedShipping}, got ${order.shippingCost}`);
    }
    log(`✓ Shipping cost is correct: ${order.shippingCost} (free shipping)`, 'success');

    // Verify discount is 0
    const expectedDiscount = 0;
    if (order.discount !== expectedDiscount) {
      throw new Error(`Expected discount ${expectedDiscount}, got ${order.discount}`);
    }
    log(`✓ Discount is correct: ${order.discount}`, 'success');

    // Verify total = subtotal
    const expectedTotal = expectedSubtotal;
    const totalDiff = Math.abs(order.total - expectedTotal);
    if (totalDiff > 0.01) {
      throw new Error(`Expected total ${expectedTotal}, got ${order.total}`);
    }
    log(`✓ Total is correct: ${order.total}`, 'success');

    log('\n--- Test 8 Passed ---', 'success');
    log('✓ Order with no discounts and free shipping works correctly', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 9: Order with discounts and no free shipping
// ============================================================================
const test9 = {
  name: 'Test 9: Order with discounts and no free shipping',
  test: async () => {
    log('\n--- Test 9 Details ---', 'info');
    log('Testing order with discounts and no free shipping:', 'info');
    log('  - Subtotal < 5000 (no free shipping)', 'info');
    log('  - Items have discounted prices', 'info');
    log('  - Expected: Shipping = 100, Discount = 0 (not double-applied)', 'info');

    if (!testProductId1) {
      throw new Error('Required product not available for this test');
    }

    const orderData = {
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [
        {
          productId: testProductId1,
          quantity: 3,
          unitPrice: 850 // Discounted price
        }
      ]
    };

    log(`Creating order with items: ${JSON.stringify(orderData.items)}`, 'info');

    const response = await createOrder(orderData);

    log(`Response status: ${response.status}`, 'info');

    if (response.status !== 201 && response.status !== 200) {
      throw new Error(`Expected status 201 or 200, got ${response.status}`);
    }
    log('✓ Order created successfully', 'success');

    const order = response.data.order;

    // Verify subtotal
    const expectedSubtotal = 850 * 3; // 2550
    const subtotalDiff = Math.abs(order.subtotal - expectedSubtotal);
    if (subtotalDiff > 0.01) {
      throw new Error(`Expected subtotal ${expectedSubtotal}, got ${order.subtotal}`);
    }
    log(`✓ Subtotal is correct: ${order.subtotal}`, 'success');

    // Verify shipping cost (should be 100 for subtotal < 5000)
    const expectedShipping = 100;
    if (order.shippingCost !== expectedShipping) {
      throw new Error(`Expected shipping cost ${expectedShipping}, got ${order.shippingCost}`);
    }
    log(`✓ Shipping cost is correct: ${order.shippingCost}`, 'success');

    // Verify discount is 0 (not double-applied)
    const expectedDiscount = 0;
    if (order.discount !== expectedDiscount) {
      throw new Error(`Expected discount ${expectedDiscount}, got ${order.discount}`);
    }
    log(`✓ Discount is correct: ${order.discount} (not double-applied)`, 'success');

    // Verify total = subtotal + shipping
    const expectedTotal = expectedSubtotal + expectedShipping;
    const totalDiff = Math.abs(order.total - expectedTotal);
    if (totalDiff > 0.01) {
      throw new Error(`Expected total ${expectedTotal}, got ${order.total}`);
    }
    log(`✓ Total is correct: ${order.total}`, 'success');

    log('\n--- Test 9 Passed ---', 'success');
    log('✓ Order with discounts and no free shipping works correctly', 'success');

    return response.data;
  }
};

// Test cases array
const testCases = [
  test1,  // Exact scenario from bug report
  test2,  // Edge case: subtotal = 4999
  test3,  // Edge case: subtotal = 5000
  test4,  // Edge case: subtotal = 5001
  test5,  // Verify discounts are not double-applied
  test6,  // No discounts, no free shipping
  test7,  // Discounts and free shipping
  test8,  // No discounts, free shipping
  test9   // Discounts, no free shipping
];

// Main test execution function
async function runTests() {
  console.log('='.repeat(80));
  console.log('BILLING CALCULATION FIX VERIFICATION TEST');
  console.log('Testing: POST /api/v1/orders');
  console.log('='.repeat(80));
  console.log('');
  console.log('This test verifies the billing calculation fixes for order ORD1770998605760578:');
  console.log('1. Bug #1 (Double Discount): Removed discount calculation loop');
  console.log('2. Bug #2 (Free Shipping): Implemented free shipping for subtotal >= 5000');
  console.log('='.repeat(80));
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without authentication', 'error');
    return results;
  }

  // Get products for test data
  const products = await getProducts();
  if (products.length === 0) {
    log('\n❌ No products available for testing', 'error');
    return results;
  }

  // Get or create address
  testAddressId = await getOrCreateAddress();
  if (!testAddressId) {
    log('\n❌ Cannot proceed without an address', 'error');
    return results;
  }

  // Run all test cases
  log('\n' + '='.repeat(80));
  log('RUNNING TEST CASES');
  log('='.repeat(80));
  
  for (const testCase of testCases) {
    results.total++;
    
    try {
      const testResult = await testEndpoint(testCase.name, testCase.test);
      
      if (testResult.success) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push({
          test: testCase.name,
          error: testResult.error,
          status: testResult.status
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        test: testCase.name,
        error: `Unexpected error: ${error.message}`
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}`);
      console.log(`   Error: ${error.error}`);
      if (error.status) {
        console.log(`   Status: ${error.status}`);
      }
      console.log('');
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('TEST DATA USED');
  console.log('='.repeat(80));
  console.log(`Product ID (Discounted): ${testProductId1 || 'N/A'}`);
  console.log(`Product ID (Non-Discounted): ${testProductId2 || 'N/A'}`);
  console.log(`Product ID (Low Price): ${testProductIdLowPrice || 'N/A'}`);
  console.log(`Product ID (High Price): ${testProductIdHighPrice || 'N/A'}`);
  console.log(`Shipping Address: ${testAddressId ? JSON.stringify(testAddressId) : 'N/A'}`);
  console.log('='.repeat(80));

  // Final verification summary
  console.log('\n' + '='.repeat(80));
  console.log('FINAL VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  
  if (results.failed === 0) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('');
    console.log('Both billing calculation bugs are FIXED:');
    console.log('');
    console.log('Bug #1 - Double Discount:');
    console.log('✓ The discount calculation loop has been removed');
    console.log('✓ Discounts are no longer double-applied');
    console.log('✓ totalDiscount is always 0 (not subtracted again)');
    console.log('✓ Final total equals subtotal + tax + shipping (no double discount)');
    console.log('');
    console.log('Bug #2 - Free Shipping:');
    console.log('✓ Free shipping logic has been implemented');
    console.log('✓ Orders with subtotal >= 5000 get free shipping (shippingCost = 0)');
    console.log('✓ Orders with subtotal < 5000 pay shipping (shippingCost = 100)');
    console.log('✓ Free shipping threshold works correctly at the boundary (5000)');
    console.log('');
    console.log('Order ORD1770998605760578 scenario:');
    console.log('✓ Item 1 (850) + Item 2 (5000) = Subtotal 5850');
    console.log('✓ Shipping = 0 (free shipping because 5850 >= 5000)');
    console.log('✓ Discount = 0 (no double discount)');
    console.log('✓ Total = 5850 (correct!)');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('');
    console.log('Please review the failed tests above to identify issues.');
  }
  
  console.log('='.repeat(80));

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n✅ All tests completed');
      
      // Exit with appropriate code
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testCases,
  TEST_CONFIG
};
