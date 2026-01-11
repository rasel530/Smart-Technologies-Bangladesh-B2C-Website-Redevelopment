/**
 * Diagnostic script to investigate why login shows success message with incorrect credentials
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test cases to diagnose the bug
const testCases = [
  {
    name: 'Valid credentials',
    identifier: 'demo.user1@smarttech.bd',
    password: 'DemoUser123!',
    expectedStatus: 200,
    expectedSuccess: true
  },
  {
    name: 'Invalid email',
    identifier: 'nonexistent@example.com',
    password: 'wrongpassword',
    expectedStatus: 401,
    expectedSuccess: false
  },
  {
    name: 'Valid email, wrong password',
    identifier: 'demo.user1@smarttech.bd',
    password: 'wrongpassword',
    expectedStatus: 401,
    expectedSuccess: false
  },
  {
    name: 'Invalid phone',
    identifier: '01700000000',
    password: 'wrongpassword',
    expectedStatus: 401,
    expectedSuccess: false
  },
  {
    name: 'Empty identifier',
    identifier: '',
    password: 'password',
    expectedStatus: 400,
    expectedSuccess: false
  }
];

async function diagnoseLoginBug() {
  console.log('=== LOGIN BUG DIAGNOSIS ===\n');

  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log(`   Identifier: ${testCase.identifier}`);
    console.log(`   Password: ${testCase.password ? '***' : '(empty)'}`);
    console.log(`   Expected Status: ${testCase.expectedStatus}`);
    console.log(`   Expected Success: ${testCase.expectedSuccess}`);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: testCase.identifier,
        password: testCase.password
      }, {
        validateStatus: () => true // Accept any status code to see full response
      });

      console.log(`\n   ✅ Request completed`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Status Text: ${response.statusText}`);
      console.log(`   Response Data:`, JSON.stringify(response.data, null, 2));

      // Check if response has token and user (frontend success condition)
      const hasToken = !!response.data.token;
      const hasUser = !!response.data.user;
      const frontendWouldTreatAsSuccess = hasToken && hasUser;

      console.log(`\n   🔍 Frontend Success Check:`);
      console.log(`      Has token: ${hasToken}`);
      console.log(`      Has user: ${hasUser}`);
      console.log(`      Frontend would treat as SUCCESS: ${frontendWouldTreatAsSuccess}`);
      console.log(`      Expected: ${testCase.expectedSuccess}`);

      if (frontendWouldTreatAsSuccess !== testCase.expectedSuccess) {
        console.log(`   ⚠️  BUG DETECTED! Frontend logic is incorrect for this case!`);
      } else {
        console.log(`   ✅ Frontend logic is correct for this case`);
      }

    } catch (error) {
      console.log(`\n   ❌ Request failed with exception`);
      console.log(`   Error:`, error.message);
      if (error.response) {
        console.log(`   Response Status: ${error.response.status}`);
        console.log(`   Response Data:`, JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log('\n' + '='.repeat(60));
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===\n');
}

// Run the diagnosis
diagnoseLoginBug().catch(error => {
  console.error('Diagnostic script failed:', error);
  process.exit(1);
});
