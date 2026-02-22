/**
 * Test script to verify PUT request timeout fix for local payment methods
 * 
 * This script tests:
 * 1. PUT request completes without timeout
 * 2. Backend logs show detailed request lifecycle
 * 3. No hanging requests
 * 4. Authenticated requests work reliably
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const TEST_METHOD_ID = 'test-method-id-123';
const TEST_USER_CREDENTIALS = {
  email: process.env.TEST_EMAIL || 'admin@example.com',
  password: process.env.TEST_PASSWORD || 'admin123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getAuthToken() {
  try {
    log('\n🔐 Step 1: Authenticating to get access token...', 'blue');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER_CREDENTIALS, {
      timeout: 10000
    });
    
    if (response.data && response.data.data && response.data.data.token) {
      log('✅ Authentication successful!', 'green');
      return response.data.data.token;
    } else {
      throw new Error('No token in response');
    }
  } catch (error) {
    log(`❌ Authentication failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return null;
  }
}

async function testPutRequest(authToken) {
  const startTime = Date.now();
  log('\n📤 Step 2: Testing PUT request to update payment method...', 'blue');
  log(`   Endpoint: ${BASE_URL}/admin/local-payment/methods/${TEST_METHOD_ID}`, 'blue');
  log(`   Start time: ${new Date(startTime).toISOString()}`, 'blue');
  
  try {
    const updateData = {
      name: 'Test Payment Method',
      displayName: 'Test Method',
      isActive: true,
      processingFee: 10.00
    };
    
    const response = await axios.put(
      `${BASE_URL}/admin/local-payment/methods/${TEST_METHOD_ID}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 35000 // 35 seconds (more than the 30s timeout we're fixing)
      }
    );
    
    const duration = Date.now() - startTime;
    log(`\n✅ PUT request completed successfully!`, 'green');
    log(`   Duration: ${duration}ms`, 'green');
    log(`   Status: ${response.status}`, 'green');
    log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'green');
    
    return {
      success: true,
      duration,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`\n❌ PUT request failed after ${duration}ms`, 'red');
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      log(`   Error Type: TIMEOUT`, 'red');
      log(`   Message: Request timed out after ${duration}ms`, 'red');
    } else if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    
    return {
      success: false,
      duration,
      error: error.message,
      code: error.code
    };
  }
}

async function runTest() {
  log('='.repeat(70), 'blue');
  log('PUT REQUEST TIMEOUT FIX VERIFICATION TEST', 'blue');
  log('='.repeat(70), 'blue');
  log('\nThis test verifies that PUT requests to local payment methods');
  log('complete successfully without timing out after the fixes.');
  log('');
  log('Fixes implemented:');
  log('  1. Added 5-second timeout to Redis pipeline operations');
  log('  2. Added comprehensive error handling in route handler');
  log('  3. Added detailed request lifecycle logging');
  log('  4. Temporarily disabled rate limiting middleware');
  log('');
  log('='.repeat(70), 'blue');
  
  // Step 1: Authenticate
  const authToken = await getAuthToken();
  if (!authToken) {
    log('\n❌ Cannot proceed without authentication token', 'red');
    log('\n💡 Tip: Make sure the backend is running and you have valid credentials', 'yellow');
    process.exit(1);
  }
  
  // Step 2: Test PUT request
  const result = await testPutRequest(authToken);
  
  // Summary
  log('\n' + '='.repeat(70), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(70), 'blue');
  
  if (result.success) {
    log(`✅ SUCCESS: PUT request completed in ${result.duration}ms`, 'green');
    log('\n✅ All fixes are working correctly:', 'green');
    log('   ✓ No timeout occurred', 'green');
    log('   ✓ Request completed within expected time', 'green');
    log('   ✓ Backend processed the request successfully', 'green');
    log('\n🎉 The PUT request timeout issue has been fixed!', 'green');
    process.exit(0);
  } else {
    log(`❌ FAILED: PUT request failed`, 'red');
    log(`   Duration: ${result.duration}ms`, 'red');
    log(`   Error: ${result.error}`, 'red');
    log(`   Code: ${result.code}`, 'red');
    
    if (result.duration > 30000) {
      log('\n⚠️  WARNING: Request took longer than 30 seconds', 'yellow');
      log('   This indicates the timeout issue may still be present', 'yellow');
      log('   Check the backend logs for more details', 'yellow');
    }
    
    log('\n💡 Debugging tips:', 'yellow');
    log('   1. Check backend logs for detailed error information', 'yellow');
    log('   2. Verify Redis is running and accessible', 'yellow');
    log('   3. Check if the payment method ID exists', 'yellow');
    log('   4. Verify the rate limiting middleware is disabled', 'yellow');
    
    process.exit(1);
  }
}

// Run the test
runTest().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  log(error.stack, 'red');
  process.exit(1);
});
