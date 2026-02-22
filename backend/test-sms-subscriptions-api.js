/**
 * Test script for SMS Subscriptions API endpoints
 * Tests GET, PUT, DELETE endpoints for admin SMS subscriptions
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_EMAIL = 'admin@smarttech.com';
const ADMIN_PASSWORD = 'AdminPassword123';

// Store authentication token
let authToken = null;

/**
 * Login as admin to get authentication token
 */
async function loginAsAdmin() {
  try {
    console.log('[LOGIN] Attempting to login as admin...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    // The token is directly in response.data.token
    if (response.data.token) {
      authToken = response.data.token;
      console.log('[LOGIN] ✓ Successfully logged in as admin');
      console.log('[LOGIN] Token:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.error('[LOGIN] ✗ Login failed - no token in response');
      console.error('[LOGIN] Response structure:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('[LOGIN] ✗ Login failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test GET /api/v1/admin/local-payment/sms-subscriptions
 */
async function testGetSmsSubscriptions() {
  try {
    console.log('\n[TEST 1] GET /admin/local-payment/sms-subscriptions');
    console.log('[TEST 1] Testing fetch all SMS subscriptions...');
    
    const response = await axios.get(
      `${API_BASE_URL}/admin/local-payment/sms-subscriptions`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('[TEST 1] ✓ GET request successful');
    console.log('[TEST 1] Status:', response.status);
    console.log('[TEST 1] Success:', response.data.success);
    console.log('[TEST 1] Message:', response.data.message);
    console.log('[TEST 1] Count:', response.data.meta?.count || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('[TEST 1] Sample subscription:', JSON.stringify(response.data.data[0], null, 2));
    }

    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('[TEST 1] ✗ GET request failed');
    console.error('[TEST 1] Error:', error.response?.data || error.message);
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Test GET /api/v1/admin/local-payment/sms-subscriptions with filters
 */
async function testGetSmsSubscriptionsWithFilters() {
  try {
    console.log('\n[TEST 2] GET /admin/local-payment/sms-subscriptions?status=active');
    console.log('[TEST 2] Testing fetch SMS subscriptions with status filter...');
    
    const response = await axios.get(
      `${API_BASE_URL}/admin/local-payment/sms-subscriptions?status=active`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('[TEST 2] ✓ GET request with filter successful');
    console.log('[TEST 2] Status:', response.status);
    console.log('[TEST 2] Count:', response.data.meta?.count || 0);

    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('[TEST 2] ✗ GET request with filter failed');
    console.error('[TEST 2] Error:', error.response?.data || error.message);
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Test PUT /api/v1/admin/local-payment/sms-subscriptions/:id
 */
async function testUpdateSmsSubscription(subscriptionId) {
  if (!subscriptionId) {
    console.log('\n[TEST 3] PUT /admin/local-payment/sms-subscriptions/:id');
    console.log('[TEST 3] ⚠ Skipping - no subscription ID available');
    return { success: false, skipped: true };
  }

  try {
    console.log('\n[TEST 3] PUT /admin/local-payment/sms-subscriptions/:id');
    console.log('[TEST 3] Testing update SMS subscription status...');
    
    const response = await axios.put(
      `${API_BASE_URL}/admin/local-payment/sms-subscriptions/${subscriptionId}`,
      {
        status: 'cancelled'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[TEST 3] ✓ PUT request successful');
    console.log('[TEST 3] Status:', response.status);
    console.log('[TEST 3] Message:', response.data.message);
    console.log('[TEST 3] Updated subscription:', JSON.stringify(response.data.data, null, 2));

    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('[TEST 3] ✗ PUT request failed');
    console.error('[TEST 3] Error:', error.response?.data || error.message);
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Test DELETE /api/v1/admin/local-payment/sms-subscriptions/:id
 */
async function testDeleteSmsSubscription(subscriptionId) {
  if (!subscriptionId) {
    console.log('\n[TEST 4] DELETE /admin/local-payment/sms-subscriptions/:id');
    console.log('[TEST 4] ⚠ Skipping - no subscription ID available');
    return { success: false, skipped: true };
  }

  try {
    console.log('\n[TEST 4] DELETE /admin/local-payment/sms-subscriptions/:id');
    console.log('[TEST 4] Testing cancel SMS subscription...');
    
    const response = await axios.delete(
      `${API_BASE_URL}/admin/local-payment/sms-subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log('[TEST 4] ✓ DELETE request successful');
    console.log('[TEST 4] Status:', response.status);
    console.log('[TEST 4] Message:', response.data.message);

    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('[TEST 4] ✗ DELETE request failed');
    console.error('[TEST 4] Error:', error.response?.data || error.message);
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Test unauthorized access (no token)
 */
async function testUnauthorizedAccess() {
  try {
    console.log('\n[TEST 5] GET /admin/local-payment/sms-subscriptions (unauthorized)');
    console.log('[TEST 5] Testing unauthorized access (no token)...');
    
    const response = await axios.get(
      `${API_BASE_URL}/admin/local-payment/sms-subscriptions`
    );

    console.log('[TEST 5] ✗ Unauthorized access should have been blocked');
    return { success: false, status: response.status };
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('[TEST 5] ✓ Unauthorized access correctly blocked (401)');
      return { success: true, status: 401 };
    } else {
      console.error('[TEST 5] ✗ Unexpected error:', error.response?.data || error.message);
      return { success: false, status: error.response?.status };
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('SMS Subscriptions API Test Suite');
  console.log('='.repeat(80));
  console.log('API Base URL:', API_BASE_URL);
  console.log('Admin Email:', ADMIN_EMAIL);
  console.log('='.repeat(80));

  // Login first
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.error('\n✗ Cannot proceed without authentication token');
    process.exit(1);
  }

  // Run tests
  const results = [];

  // Test 1: GET all subscriptions
  const test1Result = await testGetSmsSubscriptions();
  results.push({ name: 'GET all subscriptions', ...test1Result });

  // Get subscription ID for update/delete tests
  let subscriptionId = null;
  if (test1Result.success && test1Result.data.data.length > 0) {
    subscriptionId = test1Result.data.data[0].id;
  }

  // Test 2: GET with filters
  const test2Result = await testGetSmsSubscriptionsWithFilters();
  results.push({ name: 'GET with filters', ...test2Result });

  // Test 3: PUT update subscription
  const test3Result = await testUpdateSmsSubscription(subscriptionId);
  results.push({ name: 'PUT update subscription', ...test3Result });

  // Test 4: DELETE cancel subscription
  const test4Result = await testDeleteSmsSubscription(subscriptionId);
  results.push({ name: 'DELETE cancel subscription', ...test4Result });

  // Test 5: Unauthorized access
  const test5Result = await testUnauthorizedAccess();
  results.push({ name: 'Unauthorized access blocked', ...test5Result });

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  results.forEach((result, index) => {
    const status = result.skipped ? '⚠ SKIPPED' : (result.success ? '✓ PASSED' : '✗ FAILED');
    console.log(`Test ${index + 1}: ${result.name} - ${status}`);
    
    if (result.skipped) skipped++;
    else if (result.success) passed++;
    else failed++;
  });

  console.log('='.repeat(80));
  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log('='.repeat(80));

  // Exit with appropriate code
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n✗ Test suite failed with error:', error);
  process.exit(1);
});
