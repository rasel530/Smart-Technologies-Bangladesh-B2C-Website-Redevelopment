/**
 * Test SMS Subscriptions Frontend Flow
 * 
 * This script simulates the exact flow that the frontend uses:
 * 1. Login as admin
 * 2. Call the GET /api/v1/admin/local-payment/sms-subscriptions endpoint
 * 3. Check the response structure to see if it matches frontend expectations
 */

const http = require('http');

// Login credentials
const LOGIN_CREDENTIALS = {
  identifier: 'admin@smarttech.com',
  password: 'AdminPassword123'
};

// Make HTTP request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${jsonData.message || jsonData.error || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

(async () => {
  try {
    console.log('Testing SMS Subscriptions Frontend Flow');
    console.log('='.repeat(80));
    console.log('');

    // Step 1: Login to get token
    console.log('Step 1: Logging in as admin...');
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginResponse = await makeRequest(loginOptions, LOGIN_CREDENTIALS);
    const token = loginResponse.token;
    console.log('  Login successful!');
    console.log('  Token:', token.substring(0, 20) + '...');
    console.log('');

    // Step 2: Get SMS subscriptions (simulating frontend API call)
    console.log('Step 2: Fetching SMS subscriptions (simulating frontend API call)...');
    const subscriptionsOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/admin/local-payment/sms-subscriptions',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const subscriptionsResponse = await makeRequest(subscriptionsOptions);
    console.log('  Subscriptions fetched successfully!');
    console.log('');

    // Step 3: Analyze response structure
    console.log('Step 3: Analyzing response structure...');
    console.log('='.repeat(80));
    console.log('');

    console.log('Full Response Structure:');
    console.log(JSON.stringify(subscriptionsResponse, null, 2));
    console.log('');

    console.log('Response Analysis:');
    console.log('  - Has success property:', 'success' in subscriptionsResponse);
    console.log('  - Success value:', subscriptionsResponse.success);
    console.log('  - Has data property:', 'data' in subscriptionsResponse);
    console.log('  - Data type:', typeof subscriptionsResponse.data);
    console.log('  - Data is array:', Array.isArray(subscriptionsResponse.data));
    console.log('  - Data length:', Array.isArray(subscriptionsResponse.data) ? subscriptionsResponse.data.length : 'N/A');
    console.log('');

    // Step 4: Simulate frontend behavior
    console.log('Step 4: Simulating frontend behavior...');
    console.log('='.repeat(80));
    console.log('');

    console.log('Frontend Code:');
    console.log('  const response = await apiClient.get<{ data: SmsSubscription[] }>(...);');
    console.log('  setSubscriptions(response.data || []);');
    console.log('');

    console.log('API Client Behavior (auto-unwrapping):');
    console.log('  If response = { success: true, data: [...] }');
    console.log('  API client unwraps and returns: [...]');
    console.log('  So response = [...], not { success: true, data: [...] }');
    console.log('');

    console.log('Frontend Issue:');
    console.log('  Frontend expects: response.data = [...]');
    console.log('  But response is already: [...]');
    console.log('  So response.data = undefined');
    console.log('  setSubscriptions(undefined || []) = []');
    console.log('');

    console.log('Expected Result:');
    console.log('  Frontend will set subscriptions to empty array []');
    console.log('  This explains why no data shows on the page!');
    console.log('');

    // Step 5: Verify the issue
    console.log('Step 5: Verification...');
    console.log('='.repeat(80));
    console.log('');

    const simulatedResponse = subscriptionsResponse.data; // This is what API client returns after unwrapping
    console.log('Simulated API client return value (after unwrapping):');
    console.log('  Type:', typeof simulatedResponse);
    console.log('  Is array:', Array.isArray(simulatedResponse));
    console.log('  Length:', Array.isArray(simulatedResponse) ? simulatedResponse.length : 'N/A');
    console.log('');

    const frontendAccess = simulatedResponse.data; // This is what frontend tries to access
    console.log('Frontend access (response.data):');
    console.log('  Value:', frontendAccess);
    console.log('  Type:', typeof frontendAccess);
    console.log('');

    const resultState = frontendAccess || [];
    console.log('Final state set by frontend:');
    console.log('  Value:', resultState);
    console.log('  Length:', resultState.length);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Root Cause Identified:');
    console.log('='.repeat(80));
    console.log('');
    console.log('The frontend code incorrectly accesses response.data, but the API');
    console.log('client already unwraps the response. This causes the subscriptions');
    console.log('state to be set to an empty array, even though the API returns data.');
    console.log('');
    console.log('Fix:');
    console.log('  Change line 44 in page.tsx from:');
    console.log('    setSubscriptions(response.data || []);');
    console.log('  To:');
    console.log('    setSubscriptions(response || []);');
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
