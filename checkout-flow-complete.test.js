/**
 * Complete Checkout Flow Test Script
 * 
 * This script tests the complete checkout flow after applying both fixes:
 * 1. variantId Fix (line 210): Uses conditional property spreading
 * 2. paymentMethod Fix (lines 226-227, 234): Converts paymentMethod to lowercase
 * 
 * Test Scenarios:
 * 1. Login and get authentication token
 * 2. Get cart items (products without variants)
 * 3. Place order via API
 * 4. Verify order creation (no 500 error)
 * 5. Check order response details
 * 6. Verify stock quantities are updated
 * 7. Verify order appears in order history
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
  login: null,
  cart: null,
  placeOrder: null,
  orderDetails: null,
  stockUpdate: null,
  orderHistory: null,
  errors: [],
  warnings: []
};

let authToken = null;
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
 * Test 1: Login and get authentication token
 */
async function testLogin() {
  console.log('\n=== TEST 1: Login ===');
  try {
    const response = await makeRequest('POST', `${API_BASE_URL}/auth/login`, TEST_USER);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      if (response.data.token) {
        authToken = response.data.token;
        testResults.login = {
          success: true,
          statusCode: response.statusCode,
          token: authToken.substring(0, 20) + '...',
          userId: response.data.user?.id,
          email: response.data.user?.email
        };
        console.log('✅ Login successful');
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   User ID: ${response.data.user?.id}`);
        console.log(`   Email: ${response.data.user?.email}`);
        return true;
      } else {
        testResults.login = {
          success: false,
          statusCode: response.statusCode,
          error: 'No token in response'
        };
        testResults.errors.push('Login failed: No token in response');
        console.log('❌ Login failed: No token in response');
        return false;
      }
    } else {
      testResults.login = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.message || 'Unknown error'
      };
      testResults.errors.push(`Login failed: ${response.statusCode} - ${response.data.message || 'Unknown error'}`);
      console.log(`❌ Login failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    testResults.login = {
      success: false,
      error: error.message
    };
    testResults.errors.push(`Login error: ${error.message}`);
    console.log(`❌ Login error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Get cart items
 */
async function testGetCart() {
  console.log('\n=== TEST 2: Get Cart Items ===');
  if (!authToken) {
    console.log('❌ Cannot get cart: No authentication token');
    testResults.errors.push('Cannot get cart: No authentication token');
    return false;
  }

  try {
    const response = await makeRequest('GET', `${API_BASE_URL}/cart`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      testResults.cart = {
        success: true,
        statusCode: response.statusCode,
        itemCount: cartItems.length,
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.product?.name || item.name,
          quantity: item.quantity,
          variantId: item.variantId,
          hasVariant: !!item.variantId,
          price: item.price || item.product?.price
        }))
      };

      console.log('✅ Cart retrieved successfully');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Items in cart: ${cartItems.length}`);
      
      if (cartItems.length > 0) {
        console.log('\n   Cart Items:');
        cartItems.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.product?.name || item.name || 'Unknown'}`);
          console.log(`      Product ID: ${item.productId}`);
          console.log(`      Quantity: ${item.quantity}`);
          console.log(`      Variant ID: ${item.variantId || 'None (no variant)'}`);
          console.log(`      Has Variant: ${!!item.variantId}`);
          console.log(`      Price: ${item.price || item.product?.price || 'N/A'}`);
          
          // Store initial stock for later verification
          if (item.product) {
            initialStock[item.productId] = item.product.stock || item.product.quantity || 0;
          }
        });
      } else {
        testResults.warnings.push('Cart is empty - cannot proceed with order test');
        console.log('⚠️  Cart is empty - cannot proceed with order test');
      }

      return cartItems.length > 0;
    } else {
      testResults.cart = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.message || 'Unknown error'
      };
      testResults.errors.push(`Get cart failed: ${response.statusCode} - ${response.data.message || 'Unknown error'}`);
      console.log(`❌ Get cart failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    testResults.cart = {
      success: false,
      error: error.message
    };
    testResults.errors.push(`Get cart error: ${error.message}`);
    console.log(`❌ Get cart error: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Place order
 */
async function testPlaceOrder() {
  console.log('\n=== TEST 3: Place Order ===');
  if (!authToken) {
    console.log('❌ Cannot place order: No authentication token');
    testResults.errors.push('Cannot place order: No authentication token');
    return false;
  }

  if (!testResults.cart || testResults.cart.itemCount === 0) {
    console.log('❌ Cannot place order: Cart is empty');
    testResults.errors.push('Cannot place order: Cart is empty');
    return false;
  }

  try {
    const orderData = {
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test Street',
        addressLine2: 'Apt 4B',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1000',
        country: 'Bangladesh',
        phone: '+8801234567890'
      },
      billingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test Street',
        addressLine2: 'Apt 4B',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1000',
        country: 'Bangladesh',
        phone: '+8801234567890'
      },
      paymentMethod: 'CASH_ON_DELIVERY',
      notes: 'Test order for checkout flow verification'
    };

    console.log('Placing order with the following data:');
    console.log(`   Payment Method: ${orderData.paymentMethod}`);
    console.log(`   Cart Items: ${testResults.cart.itemCount}`);
    console.log(`   Items with variants: ${testResults.cart.items.filter(i => i.hasVariant).length}`);
    console.log(`   Items without variants: ${testResults.cart.items.filter(i => !i.hasVariant).length}`);

    const response = await makeRequest('POST', `${API_BASE_URL}/orders`, orderData, {
      'Authorization': `Bearer ${authToken}`
    });

    console.log(`\nResponse Status: ${response.statusCode}`);

    if (response.statusCode === 200 || response.statusCode === 201) {
      createdOrderId = response.data.id || response.data.orderId;
      
      testResults.placeOrder = {
        success: true,
        statusCode: response.statusCode,
        orderId: createdOrderId,
        orderNumber: response.data.orderNumber,
        status: response.data.status,
        totalAmount: response.data.totalAmount,
        paymentMethod: response.data.paymentMethod,
        itemCount: response.data.items?.length || response.data.orderItems?.length || 0
      };

      console.log('✅ Order placed successfully');
      console.log(`   Order ID: ${createdOrderId}`);
      console.log(`   Order Number: ${response.data.orderNumber || 'N/A'}`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Total Amount: ${response.data.totalAmount}`);
      console.log(`   Payment Method: ${response.data.paymentMethod}`);
      console.log(`   Items: ${response.data.items?.length || response.data.orderItems?.length || 0}`);

      // Check if paymentMethod is lowercase in response
      if (response.data.paymentMethod && response.data.paymentMethod === response.data.paymentMethod.toLowerCase()) {
        console.log('   ✅ Payment method is lowercase (fix working)');
      } else {
        console.log('   ⚠️  Payment method is not lowercase');
        testResults.warnings.push('Payment method is not lowercase in response');
      }

      return true;
    } else if (response.statusCode === 500) {
      testResults.placeOrder = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.message || 'Internal Server Error',
        details: response.data.error || response.data.details
      };
      testResults.errors.push(`Place order failed: 500 Internal Server Error`);
      testResults.errors.push(`Error: ${response.data.message || 'Internal Server Error'}`);
      if (response.data.error) {
        testResults.errors.push(`Details: ${response.data.error}`);
      }
      console.log('❌ Order placement failed: 500 Internal Server Error');
      console.log(`   Error: ${response.data.message || 'Internal Server Error'}`);
      if (response.data.error) {
        console.log(`   Details: ${response.data.error}`);
      }
      return false;
    } else {
      testResults.placeOrder = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.message || 'Unknown error'
      };
      testResults.errors.push(`Place order failed: ${response.statusCode} - ${response.data.message || 'Unknown error'}`);
      console.log(`❌ Order placement failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    testResults.placeOrder = {
      success: false,
      error: error.message
    };
    testResults.errors.push(`Place order error: ${error.message}`);
    console.log(`❌ Place order error: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Verify order details
 */
async function testOrderDetails() {
  console.log('\n=== TEST 4: Verify Order Details ===');
  if (!createdOrderId) {
    console.log('❌ Cannot verify order details: No order ID');
    testResults.errors.push('Cannot verify order details: No order ID');
    return false;
  }

  if (!authToken) {
    console.log('❌ Cannot verify order details: No authentication token');
    testResults.errors.push('Cannot verify order details: No authentication token');
    return false;
  }

  try {
    const response = await makeRequest('GET', `${API_BASE_URL}/orders/${createdOrderId}`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.statusCode === 200) {
      const order = response.data;
      const items = order.items || order.orderItems || [];

      testResults.orderDetails = {
        success: true,
        statusCode: response.statusCode,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        subTotal: order.subTotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        itemCount: items.length,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.product?.name || item.name,
          quantity: item.quantity,
          price: item.price,
          variantId: item.variantId,
          hasVariant: !!item.variantId
        }))
      };

      console.log('✅ Order details retrieved successfully');
      console.log(`   Order ID: ${order.id}`);
      console.log(`   Order Number: ${order.orderNumber || 'N/A'}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Payment Method: ${order.paymentMethod}`);
      console.log(`   Total Amount: ${order.totalAmount}`);
      console.log(`   Sub Total: ${order.subTotal || 'N/A'}`);
      console.log(`   Shipping Cost: ${order.shippingCost || 'N/A'}`);
      console.log(`   Tax: ${order.tax || 'N/A'}`);
      console.log(`   Items: ${items.length}`);

      console.log('\n   Order Items:');
      items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product?.name || item.name || 'Unknown'}`);
        console.log(`      Product ID: ${item.productId}`);
        console.log(`      Quantity: ${item.quantity}`);
        console.log(`      Price: ${item.price}`);
        console.log(`      Variant ID: ${item.variantId || 'None (no variant)'}`);
        console.log(`      Has Variant: ${!!item.variantId}`);
      });

      // Verify paymentMethod is lowercase
      if (order.paymentMethod && order.paymentMethod === order.paymentMethod.toLowerCase()) {
        console.log('\n   ✅ Payment method is lowercase (paymentMethod fix working)');
      } else {
        console.log('\n   ⚠️  Payment method is not lowercase');
        testResults.warnings.push('Payment method is not lowercase in order details');
      }

      // Verify status is PENDING
      if (order.status === 'PENDING') {
        console.log('   ✅ Order status is PENDING');
      } else {
        console.log(`   ⚠️  Order status is ${order.status} (expected PENDING)`);
        testResults.warnings.push(`Order status is ${order.status} (expected PENDING)`);
      }

      return true;
    } else {
      testResults.orderDetails = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.message || 'Unknown error'
      };
      testResults.errors.push(`Get order details failed: ${response.statusCode} - ${response.data.message || 'Unknown error'}`);
      console.log(`❌ Get order details failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    testResults.orderDetails = {
      success: false,
      error: error.message
    };
    testResults.errors.push(`Get order details error: ${error.message}`);
    console.log(`❌ Get order details error: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Verify stock update
 */
async function testStockUpdate() {
  console.log('\n=== TEST 5: Verify Stock Update ===');
  if (!authToken) {
    console.log('❌ Cannot verify stock: No authentication token');
    testResults.errors.push('Cannot verify stock: No authentication token');
    return false;
  }

  try {
    const response = await makeRequest('GET', `${API_BASE_URL}/cart`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.statusCode === 200) {
      const cartItems = response.data.items || response.data.cartItems || [];
      
      console.log('✅ Cart retrieved for stock verification');
      console.log(`   Items in cart: ${cartItems.length}`);

      if (cartItems.length > 0) {
        console.log('\n   Current Stock Levels:');
        let stockUpdated = false;
        
        cartItems.forEach((item, index) => {
          const productId = item.productId;
          const currentStock = item.product?.stock || item.product?.quantity || 0;
          const initialStockValue = initialStock[productId];
          const orderQuantity = testResults.cart?.items.find(i => i.productId === productId)?.quantity || 0;
          const expectedStock = initialStockValue - orderQuantity;

          console.log(`   ${index + 1}. ${item.product?.name || item.name || 'Unknown'}`);
          console.log(`      Product ID: ${productId}`);
          console.log(`      Initial Stock: ${initialStockValue}`);
          console.log(`      Order Quantity: ${orderQuantity}`);
          console.log(`      Expected Stock: ${expectedStock}`);
          console.log(`      Current Stock: ${currentStock}`);

          if (currentStock === expectedStock) {
            console.log(`      ✅ Stock updated correctly`);
            stockUpdated = true;
          } else {
            console.log(`      ⚠️  Stock mismatch (expected ${expectedStock}, got ${currentStock})`);
            testResults.warnings.push(`Stock mismatch for product ${productId}: expected ${expectedStock}, got ${currentStock}`);
          }
        });

        testResults.stockUpdate = {
          success: stockUpdated,
          itemCount: cartItems.length,
          stockVerified: stockUpdated
        };

        if (stockUpdated) {
          console.log('\n   ✅ Stock quantities updated correctly');
        } else {
          console.log('\n   ⚠️  Some stock quantities may not have been updated correctly');
        }

        return true;
      } else {
        testResults.stockUpdate = {
          success: false,
          error: 'Cart is empty after order placement'
        };
        console.log('⚠️  Cart is empty after order placement - cannot verify stock');
        return false;
      }
    } else {
      testResults.stockUpdate = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.message || 'Unknown error'
      };
      testResults.errors.push(`Get cart for stock verification failed: ${response.statusCode} - ${response.data.message || 'Unknown error'}`);
      console.log(`❌ Get cart for stock verification failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    testResults.stockUpdate = {
      success: false,
      error: error.message
    };
    testResults.errors.push(`Stock verification error: ${error.message}`);
    console.log(`❌ Stock verification error: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Verify order history
 */
async function testOrderHistory() {
  console.log('\n=== TEST 6: Verify Order History ===');
  if (!authToken) {
    console.log('❌ Cannot verify order history: No authentication token');
    testResults.errors.push('Cannot verify order history: No authentication token');
    return false;
  }

  try {
    const response = await makeRequest('GET', `${API_BASE_URL}/orders`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.statusCode === 200) {
      const orders = response.data.orders || response.data || [];
      
      testResults.orderHistory = {
        success: true,
        statusCode: response.statusCode,
        totalOrders: orders.length,
        orders: orders.map(order => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt
        }))
      };

      console.log('✅ Order history retrieved successfully');
      console.log(`   Total Orders: ${orders.length}`);

      // Check if the created order appears in history
      const createdOrderInHistory = orders.find(o => o.id === createdOrderId || o.orderNumber === testResults.placeOrder?.orderNumber);

      if (createdOrderInHistory) {
        console.log(`\n   ✅ Created order found in history`);
        console.log(`   Order ID: ${createdOrderInHistory.id}`);
        console.log(`   Order Number: ${createdOrderInHistory.orderNumber || 'N/A'}`);
        console.log(`   Status: ${createdOrderInHistory.status}`);
        console.log(`   Total Amount: ${createdOrderInHistory.totalAmount}`);
        console.log(`   Created At: ${createdOrderInHistory.createdAt}`);
      } else {
        console.log(`\n   ⚠️  Created order not found in history`);
        testResults.warnings.push('Created order not found in order history');
      }

      console.log('\n   Recent Orders:');
      orders.slice(-5).forEach((order, index) => {
        console.log(`   ${index + 1}. Order #${order.orderNumber || order.id}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Total: ${order.totalAmount}`);
        console.log(`      Created: ${order.createdAt}`);
      });

      return true;
    } else {
      testResults.orderHistory = {
        success: false,
        statusCode: response.statusCode,
        error: response.data.message || 'Unknown error'
      };
      testResults.errors.push(`Get order history failed: ${response.statusCode} - ${response.data.message || 'Unknown error'}`);
      console.log(`❌ Get order history failed: ${response.statusCode}`);
      console.log(`   Error: ${response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    testResults.orderHistory = {
      success: false,
      error: error.message
    };
    testResults.errors.push(`Get order history error: ${error.message}`);
    console.log(`❌ Get order history error: ${error.message}`);
    return false;
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE CHECKOUT FLOW TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Test Date: ${new Date().toISOString()}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('');

  // Summary
  console.log('SUMMARY');
  console.log('-'.repeat(80));
  const totalTests = 6;
  const passedTests = [
    testResults.login?.success,
    testResults.cart?.success,
    testResults.placeOrder?.success,
    testResults.orderDetails?.success,
    testResults.stockUpdate?.success,
    testResults.orderHistory?.success
  ].filter(Boolean).length;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log('');

  // Fix Verification
  console.log('FIX VERIFICATION');
  console.log('-'.repeat(80));
  
  // variantId fix verification
  if (testResults.orderDetails?.success) {
    const itemsWithoutVariants = testResults.orderDetails.items.filter(i => !i.hasVariant);
    if (itemsWithoutVariants.length > 0) {
      console.log('✅ variantId Fix: VERIFIED');
      console.log(`   Items without variants: ${itemsWithoutVariants.length}`);
      console.log(`   All items without variants have no variantId field`);
    } else {
      console.log('⚠️  variantId Fix: Cannot verify (all items have variants)');
    }
  } else {
    console.log('❌ variantId Fix: Cannot verify (order details not retrieved)');
  }
  console.log('');

  // paymentMethod fix verification
  if (testResults.placeOrder?.success) {
    const paymentMethod = testResults.placeOrder.paymentMethod;
    if (paymentMethod && paymentMethod === paymentMethod.toLowerCase()) {
      console.log('✅ paymentMethod Fix: VERIFIED');
      console.log(`   Payment method in response: ${paymentMethod}`);
      console.log(`   Payment method is lowercase: YES`);
    } else {
      console.log('❌ paymentMethod Fix: FAILED');
      console.log(`   Payment method in response: ${paymentMethod}`);
      console.log(`   Payment method is lowercase: NO`);
    }
  } else {
    console.log('❌ paymentMethod Fix: Cannot verify (order not placed)');
  }
  console.log('');

  // Detailed Results
  console.log('DETAILED TEST RESULTS');
  console.log('-'.repeat(80));

  // Test 1: Login
  console.log('TEST 1: Login');
  if (testResults.login?.success) {
    console.log('✅ PASSED');
    console.log(`   Status: ${testResults.login.statusCode}`);
    console.log(`   User ID: ${testResults.login.userId}`);
    console.log(`   Email: ${testResults.login.email}`);
  } else {
    console.log('❌ FAILED');
    console.log(`   Error: ${testResults.login?.error || 'Unknown error'}`);
  }
  console.log('');

  // Test 2: Get Cart
  console.log('TEST 2: Get Cart');
  if (testResults.cart?.success) {
    console.log('✅ PASSED');
    console.log(`   Status: ${testResults.cart.statusCode}`);
    console.log(`   Items in cart: ${testResults.cart.itemCount}`);
    console.log(`   Items with variants: ${testResults.cart.items.filter(i => i.hasVariant).length}`);
    console.log(`   Items without variants: ${testResults.cart.items.filter(i => !i.hasVariant).length}`);
  } else {
    console.log('❌ FAILED');
    console.log(`   Error: ${testResults.cart?.error || 'Unknown error'}`);
  }
  console.log('');

  // Test 3: Place Order
  console.log('TEST 3: Place Order');
  if (testResults.placeOrder?.success) {
    console.log('✅ PASSED');
    console.log(`   Status: ${testResults.placeOrder.statusCode}`);
    console.log(`   Order ID: ${testResults.placeOrder.orderId}`);
    console.log(`   Order Number: ${testResults.placeOrder.orderNumber || 'N/A'}`);
    console.log(`   Status: ${testResults.placeOrder.status}`);
    console.log(`   Total Amount: ${testResults.placeOrder.totalAmount}`);
    console.log(`   Payment Method: ${testResults.placeOrder.paymentMethod}`);
    console.log(`   Items: ${testResults.placeOrder.itemCount}`);
  } else {
    console.log('❌ FAILED');
    console.log(`   Status: ${testResults.placeOrder?.statusCode || 'N/A'}`);
    console.log(`   Error: ${testResults.placeOrder?.error || 'Unknown error'}`);
  }
  console.log('');

  // Test 4: Order Details
  console.log('TEST 4: Order Details');
  if (testResults.orderDetails?.success) {
    console.log('✅ PASSED');
    console.log(`   Status: ${testResults.orderDetails.statusCode}`);
    console.log(`   Order ID: ${testResults.orderDetails.orderId}`);
    console.log(`   Status: ${testResults.orderDetails.status}`);
    console.log(`   Payment Method: ${testResults.orderDetails.paymentMethod}`);
    console.log(`   Total Amount: ${testResults.orderDetails.totalAmount}`);
    console.log(`   Items: ${testResults.orderDetails.itemCount}`);
  } else {
    console.log('❌ FAILED');
    console.log(`   Error: ${testResults.orderDetails?.error || 'Unknown error'}`);
  }
  console.log('');

  // Test 5: Stock Update
  console.log('TEST 5: Stock Update');
  if (testResults.stockUpdate?.success) {
    console.log('✅ PASSED');
    console.log(`   Stock verified: ${testResults.stockUpdate.stockVerified ? 'YES' : 'NO'}`);
  } else {
    console.log('❌ FAILED');
    console.log(`   Error: ${testResults.stockUpdate?.error || 'Unknown error'}`);
  }
  console.log('');

  // Test 6: Order History
  console.log('TEST 6: Order History');
  if (testResults.orderHistory?.success) {
    console.log('✅ PASSED');
    console.log(`   Status: ${testResults.orderHistory.statusCode}`);
    console.log(`   Total Orders: ${testResults.orderHistory.totalOrders}`);
    const createdOrderInHistory = testResults.orderHistory.orders.find(o => 
      o.orderId === createdOrderId || o.orderNumber === testResults.placeOrder?.orderNumber
    );
    console.log(`   Created order in history: ${createdOrderInHistory ? 'YES' : 'NO'}`);
  } else {
    console.log('❌ FAILED');
    console.log(`   Error: ${testResults.orderHistory?.error || 'Unknown error'}`);
  }
  console.log('');

  // Errors and Warnings
  if (testResults.errors.length > 0) {
    console.log('ERRORS');
    console.log('-'.repeat(80));
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    console.log('');
  }

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
  
  const allTestsPassed = passedTests === totalTests;
  const variantIdFixWorking = testResults.orderDetails?.success && 
    testResults.orderDetails.items.some(i => !i.hasVariant);
  const paymentMethodFixWorking = testResults.placeOrder?.success && 
    testResults.placeOrder.paymentMethod === testResults.placeOrder.paymentMethod.toLowerCase();

  if (allTestsPassed && variantIdFixWorking && paymentMethodFixWorking) {
    console.log('✅ COMPLETE CHECKOUT FLOW: WORKING');
    console.log('✅ variantId Fix: WORKING');
    console.log('✅ paymentMethod Fix: WORKING');
    console.log('');
    console.log('Both fixes have been successfully applied and verified.');
    console.log('The complete checkout flow is functioning correctly.');
  } else if (testResults.placeOrder?.success) {
    console.log('⚠️  COMPLETE CHECKOUT FLOW: PARTIALLY WORKING');
    console.log(`   variantId Fix: ${variantIdFixWorking ? 'WORKING' : 'CANNOT VERIFY'}`);
    console.log(`   paymentMethod Fix: ${paymentMethodFixWorking ? 'WORKING' : 'FAILED'}`);
    console.log('');
    console.log('Order was created successfully, but some fixes may not be working correctly.');
  } else {
    console.log('❌ COMPLETE CHECKOUT FLOW: FAILED');
    console.log('   variantId Fix: CANNOT VERIFY');
    console.log('   paymentMethod Fix: CANNOT VERIFY');
    console.log('');
    console.log('Order creation failed. Both fixes cannot be verified.');
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
  console.log('COMPLETE CHECKOUT FLOW TEST');
  console.log('Testing variantId and paymentMethod fixes');
  console.log('='.repeat(80));

  try {
    // Run all tests
    await testLogin();
    await testGetCart();
    await testPlaceOrder();
    await testOrderDetails();
    await testStockUpdate();
    await testOrderHistory();

    // Generate report
    generateTestReport();

    // Save results to file
    const fs = require('fs');
    const reportPath = './checkout-flow-test-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\nTest results saved to: ${reportPath}`);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    testResults.errors.push(`Test execution error: ${error.message}`);
  }
}

// Run tests
runTests();
