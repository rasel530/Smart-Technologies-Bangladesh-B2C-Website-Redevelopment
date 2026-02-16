/**
 * Diagnostic script to investigate PUT request body issue
 * 
 * This script tests:
 * 1. Frontend API client PUT request with body
 * 2. Backend authentication for PUT requests
 * 3. Request body transmission
 */

const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3001/api/v1';
const TEST_CREDENTIALS = {
  admin: {
    identifier: 'admin@smarttech.com',
    password: 'AdminPassword123'
  }
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const fullPath = API_BASE + options.path;
    const url = new URL(fullPath);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    console.log('\n=== Making Request ===');
    console.log('URL:', fullPath);
    console.log('Method:', requestOptions.method);
    console.log('Headers:', JSON.stringify(requestOptions.headers, null, 2));
    if (data) {
      console.log('Body:', JSON.stringify(data, null, 2));
    }

    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('\n=== Response ===');
        console.log('Status:', res.statusCode);
        console.log('Status Text:', res.statusMessage);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
      console.log('Body written to request');
    } else {
      console.log('No body to write');
    }
    req.end();
  });
}

// Helper function to login and get token
async function login(identifier, password) {
  console.log('\n=== Logging in ===');
  console.log('Identifier:', identifier);
  
  const response = await makeRequest({
    path: '/auth/login',
    method: 'POST'
  }, { identifier, password });

  if (response.statusCode === 200 && response.body && response.body.token) {
    console.log('✅ Login successful');
    console.log('Token length:', response.body.token.length);
    console.log('Token preview:', response.body.token.substring(0, 30) + '...');
    return response.body.token;
  }
  
  console.log('❌ Login failed');
  console.log('Response:', JSON.stringify(response.body, null, 2));
  throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
}

// Test 1: Login and get token
async function testLogin() {
  console.log('\n========================================');
  console.log('TEST 1: Login');
  console.log('========================================');
  
  try {
    const token = await login(TEST_CREDENTIALS.admin.identifier, TEST_CREDENTIALS.admin.password);
    return token;
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    throw error;
  }
}

// Test 2: Get orders to find one to update
async function testGetOrders(adminToken) {
  console.log('\n========================================');
  console.log('TEST 2: Get Orders');
  console.log('========================================');
  
  try {
    const response = await makeRequest({
      path: '/orders',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.statusCode === 200) {
      console.log('✅ Orders retrieved successfully');
      console.log('Orders count:', response.body.orders?.length || 0);
      return response.body.orders || [];
    } else {
      console.log('❌ Failed to get orders');
      console.log('Response:', JSON.stringify(response.body, null, 2));
      throw new Error(`Failed to get orders: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    throw error;
  }
}

// Test 3: Update order status with PUT request and body
async function testUpdateOrderStatus(adminToken, orderId, newStatus) {
  console.log('\n========================================');
  console.log('TEST 3: Update Order Status (PUT with body)');
  console.log('========================================');
  console.log('Order ID:', orderId);
  console.log('New Status:', newStatus);
  
  try {
    const response = await makeRequest({
      path: `/orders/${orderId}/status`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: newStatus });

    if (response.statusCode === 200) {
      console.log('✅ Order status updated successfully');
      console.log('Response:', JSON.stringify(response.body, null, 2));
      return true;
    } else {
      console.log('❌ Failed to update order status');
      console.log('Response:', JSON.stringify(response.body, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    throw error;
  }
}

// Test 4: Verify the status was actually updated
async function testVerifyOrderStatus(adminToken, orderId, expectedStatus) {
  console.log('\n========================================');
  console.log('TEST 4: Verify Order Status');
  console.log('========================================');
  
  try {
    const response = await makeRequest({
      path: `/orders/${orderId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (response.statusCode === 200) {
      const actualStatus = response.body.order?.status;
      console.log('Expected Status:', expectedStatus);
      console.log('Actual Status:', actualStatus);
      
      if (actualStatus === expectedStatus) {
        console.log('✅ Status verified successfully');
        return true;
      } else {
        console.log('❌ Status does not match');
        return false;
      }
    } else {
      console.log('❌ Failed to get order');
      console.log('Response:', JSON.stringify(response.body, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
    throw error;
  }
}

// Main test runner
async function runDiagnostics() {
  console.log('========================================');
  console.log('API Client PUT Request Diagnostic');
  console.log('========================================');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    // Test 1: Login
    const adminToken = await testLogin();
    
    // Test 2: Get orders
    const orders = await testGetOrders(adminToken);
    
    if (orders.length === 0) {
      console.log('\n⚠️  No orders available to test status update');
      console.log('Skipping remaining tests');
      return;
    }
    
    const orderId = orders[0].id;
    const originalStatus = orders[0].status;
    const newStatus = originalStatus === 'pending' ? 'confirmed' : 'pending';
    
    console.log('\nSelected order for testing:');
    console.log('Order ID:', orderId);
    console.log('Current Status:', originalStatus);
    console.log('Target Status:', newStatus);
    
    // Test 3: Update order status
    const updateSuccess = await testUpdateOrderStatus(adminToken, orderId, newStatus);
    
    if (updateSuccess) {
      // Test 4: Verify status
      await testVerifyOrderStatus(adminToken, orderId, newStatus);
      
      // Restore original status
      console.log('\n=== Restoring original status ===');
      await testUpdateOrderStatus(adminToken, orderId, originalStatus);
    }
    
    console.log('\n========================================');
    console.log('DIAGNOSTIC COMPLETE');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ Fatal error during diagnostics:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);
