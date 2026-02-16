/**
 * Diagnostic Script for Login Authentication Failure
 * 
 * This script tests the backend login endpoint directly to identify the root cause
 * of the authentication failure.
 */

const fetch = require('node-fetch');

// Configuration
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001/api/v1';

async function testLoginEndpoint() {
  console.log('='.repeat(80));
  console.log('LOGIN ENDPOINT DIAGNOSTIC TEST');
  console.log('='.repeat(80));
  console.log('');

  console.log('[CONFIG] Backend URL:', BACKEND_URL);
  console.log('[CONFIG] Login Endpoint:', `${BACKEND_URL}/auth/login`);
  console.log('');

  // Test 1: Check if backend is accessible
  console.log('[TEST 1] Checking backend health...');
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('[TEST 1] ✓ Backend is accessible');
      console.log('[TEST 1] Health status:', healthData.status);
    } else {
      console.log('[TEST 1] ✗ Backend health check failed');
      console.log('[TEST 1] Status:', healthResponse.status);
    }
  } catch (error) {
    console.log('[TEST 1] ✗ Cannot connect to backend');
    console.log('[TEST 1] Error:', error.message);
  }
  console.log('');

  // Test 2: Test login with admin credentials
  console.log('[TEST 2] Testing login with admin@smarttech.com...');
  try {
    const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'admin@smarttech.com',
        password: 'admin123', // Default admin password
        rememberMe: false,
      }),
    });

    console.log('[TEST 2] Response status:', loginResponse.status);
    console.log('[TEST 2] Response statusText:', loginResponse.statusText);
    console.log('[TEST 2] Response ok:', loginResponse.ok);

    const responseText = await loginResponse.text();
    console.log('[TEST 2] Response body (raw):', responseText.substring(0, 500));

    try {
      const responseData = JSON.parse(responseText);
      console.log('[TEST 2] Response data (parsed):', JSON.stringify(responseData, null, 2));
      
      if (loginResponse.ok) {
        console.log('[TEST 2] ✓ Login successful');
        console.log('[TEST 2] User ID:', responseData.user?.id);
        console.log('[TEST 2] User Email:', responseData.user?.email);
        console.log('[TEST 2] User Role:', responseData.user?.role);
        console.log('[TEST 2] Token:', responseData.token ? 'Present' : 'Missing');
      } else {
        console.log('[TEST 2] ✗ Login failed');
        console.log('[TEST 2] Error:', responseData.error);
        console.log('[TEST 2] Message:', responseData.message);
      }
    } catch (parseError) {
      console.log('[TEST 2] ✗ Failed to parse JSON response');
      console.log('[TEST 2] Parse error:', parseError.message);
    }
  } catch (error) {
    console.log('[TEST 2] ✗ Login request failed');
    console.log('[TEST 2] Error:', error.message);
    console.log('[TEST 2] Error stack:', error.stack);
  }
  console.log('');

  // Test 3: Test with invalid credentials to see error handling
  console.log('[TEST 3] Testing login with invalid credentials...');
  try {
    const invalidLoginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'nonexistent@test.com',
        password: 'wrongpassword',
        rememberMe: false,
      }),
    });

    console.log('[TEST 3] Response status:', invalidLoginResponse.status);
    console.log('[TEST 3] Response ok:', invalidLoginResponse.ok);

    const invalidResponseText = await invalidLoginResponse.text();
    console.log('[TEST 3] Response body (raw):', invalidResponseText.substring(0, 500));

    try {
      const invalidResponseData = JSON.parse(invalidResponseText);
      console.log('[TEST 3] Error:', invalidResponseData.error);
      console.log('[TEST 3] Message:', invalidResponseData.message);
    } catch (parseError) {
      console.log('[TEST 3] Failed to parse JSON response');
    }
  } catch (error) {
    console.log('[TEST 3] ✗ Invalid login request failed');
    console.log('[TEST 3] Error:', error.message);
  }
  console.log('');

  // Test 4: Test with missing identifier field (validation error)
  console.log('[TEST 4] Testing validation - missing identifier...');
  try {
    const validationResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        password: 'testpassword',
        rememberMe: false,
      }),
    });

    console.log('[TEST 4] Response status:', validationResponse.status);
    console.log('[TEST 4] Response ok:', validationResponse.ok);

    const validationResponseText = await validationResponse.text();
    console.log('[TEST 4] Response body (raw):', validationResponseText.substring(0, 500));
  } catch (error) {
    console.log('[TEST 4] ✗ Validation test request failed');
    console.log('[TEST 4] Error:', error.message);
  }
  console.log('');

  // Test 5: Test with missing password field (validation error)
  console.log('[TEST 5] Testing validation - missing password...');
  try {
    const validationResponse2 = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'test@test.com',
        rememberMe: false,
      }),
    });

    console.log('[TEST 5] Response status:', validationResponse2.status);
    console.log('[TEST 5] Response ok:', validationResponse2.ok);

    const validationResponseText2 = await validationResponse2.text();
    console.log('[TEST 5] Response body (raw):', validationResponseText2.substring(0, 500));
  } catch (error) {
    console.log('[TEST 5] ✗ Validation test request failed');
    console.log('[TEST 5] Error:', error.message);
  }
  console.log('');

  console.log('='.repeat(80));
  console.log('DIAGNOSTIC TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run the diagnostic test
testLoginEndpoint().catch(error => {
  console.error('[FATAL] Diagnostic test failed:', error);
  process.exit(1);
});
