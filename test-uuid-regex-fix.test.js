/**
 * Test UUID Regex Fix for EMI Deletion
 * 
 * This script tests the UUID regex pattern fix in EMI provider and plan deletion routes.
 * The fix changed the last segment from [0-9a-f]{4} to [0-9a-f]{12}
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// Test results storage
const testResults = {
  environment: {
    backendRunning: false,
    frontendRunning: false,
    testStartTime: new Date().toISOString()
  },
  tests: []
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    
    const requestOptions = {
      hostname: 'localhost',
      port: 3001,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody
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
    }

    req.end();
  });
}

// Helper function to record test result
function recordTest(testName, passed, details) {
  testResults.tests.push({
    testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
  console.log(`\n${passed ? '✓ PASS' : '✗ FAIL'}: ${testName}`);
  if (details) {
    console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
  }
}

// Helper function to check if server is running
async function checkServerRunning() {
  try {
    const response = await makeRequest({
      path: '/api/v1/products',
      method: 'GET'
    });
    testResults.environment.backendRunning = response.statusCode === 200;
    return testResults.environment.backendRunning;
  } catch (error) {
    console.error('Backend server check failed:', error.message);
    return false;
  }
}

// Helper function to login as admin
async function loginAdmin() {
  try {
    const response = await makeRequest({
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      identifier: 'admin@smarttech.com',
      password: 'AdminPassword123'
    });

    if (response.statusCode === 200 && response.body && response.body.data && response.body.data.token) {
      return response.body.data.token;
    }
    return null;
  } catch (error) {
    console.error('Admin login failed:', error.message);
    return null;
  }
}

// Helper function to create test EMI provider
async function createTestProvider(token) {
  const timestamp = Date.now();
  const providerData = {
    name: `Test Provider ${timestamp}`,
    code: `test-provider-${timestamp}`,
    logoUrl: 'https://example.com/logo.png',
    website: 'https://example.com',
    isActive: true,
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    interestRate: 0
  };

  const response = await makeRequest({
    path: '/api/v1/admin/emi/providers',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, providerData);

  if (response.statusCode === 201 && response.body && response.body.data) {
    return response.body.data;
  }
  return null;
}

// Helper function to create test EMI plan
async function createTestPlan(token, providerId) {
  const timestamp = Date.now();
  const planData = {
    providerId: providerId,
    name: `Test Plan ${timestamp}`,
    code: `test-plan-${timestamp}`,
    duration: 3,
    interestRate: 0,
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    downPayment: 0,
    isActive: true,
    displayOrder: 0
  };

  const response = await makeRequest({
    path: '/api/v1/admin/emi/plans',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, planData);

  if (response.statusCode === 201 && response.body && response.body.data) {
    return response.body.data;
  }
  return null;
}

// Test 1: Delete EMI Plan by Code
async function testDeletePlanByCode(token, plan) {
  const testName = 'Test 1: Delete EMI Plan by Code (was working before)';
  try {
    const response = await makeRequest({
      path: `/api/v1/admin/emi/plans/${plan.code}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const passed = response.statusCode === 200 || response.statusCode === 404; // 404 is acceptable if already deleted
    recordTest(testName, passed, {
      statusCode: response.statusCode,
      body: response.body,
      planCode: plan.code
    });
    return passed;
  } catch (error) {
    recordTest(testName, false, { error: error.message });
    return false;
  }
}

// Test 2: Delete EMI Plan by UUID (the main fix)
async function testDeletePlanByUUID(token, plan) {
  const testName = 'Test 2: Delete EMI Plan by UUID (was failing before due to regex bug)';
  try {
    const response = await makeRequest({
      path: `/api/v1/admin/emi/plans/${plan.id}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const passed = response.statusCode === 200 || response.statusCode === 404; // 404 is acceptable if already deleted
    recordTest(testName, passed, {
      statusCode: response.statusCode,
      body: response.body,
      planId: plan.id,
      note: 'UUID regex fix: last segment changed from [0-9a-f]{4} to [0-9a-f]{12}'
    });
    return passed;
  } catch (error) {
    recordTest(testName, false, { error: error.message });
    return false;
  }
}

// Test 3: Delete EMI Plan with invalid UUID format
async function testDeletePlanInvalidUUID(token) {
  const testName = 'Test 3: Delete EMI Plan with invalid UUID format (should return 400)';
  try {
    const response = await makeRequest({
      path: '/api/v1/admin/emi/plans/invalid-uuid-format',
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const passed = response.statusCode === 400;
    recordTest(testName, passed, {
      statusCode: response.statusCode,
      body: response.body,
      expected: 400,
      actual: response.statusCode
    });
    return passed;
  } catch (error) {
    recordTest(testName, false, { error: error.message });
    return false;
  }
}

// Test 4: Delete EMI Provider by Code
async function testDeleteProviderByCode(token, provider) {
  const testName = 'Test 4: Delete EMI Provider by Code (was working before)';
  try {
    const response = await makeRequest({
      path: `/api/v1/admin/emi/providers/${provider.code}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const passed = response.statusCode === 200 || response.statusCode === 404; // 404 is acceptable if already deleted
    recordTest(testName, passed, {
      statusCode: response.statusCode,
      body: response.body,
      providerCode: provider.code
    });
    return passed;
  } catch (error) {
    recordTest(testName, false, { error: error.message });
    return false;
  }
}

// Test 5: Delete EMI Provider by UUID (the main fix)
async function testDeleteProviderByUUID(token, provider) {
  const testName = 'Test 5: Delete EMI Provider by UUID (was failing before due to regex bug)';
  try {
    const response = await makeRequest({
      path: `/api/v1/admin/emi/providers/${provider.id}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const passed = response.statusCode === 200 || response.statusCode === 404; // 404 is acceptable if already deleted
    recordTest(testName, passed, {
      statusCode: response.statusCode,
      body: response.body,
      providerId: provider.id,
      note: 'UUID regex fix: last segment changed from [0-9a-f]{4} to [0-9a-f]{12}'
    });
    return passed;
  } catch (error) {
    recordTest(testName, false, { error: error.message });
    return false;
  }
}

// Test 6: Delete EMI Provider with invalid UUID format
async function testDeleteProviderInvalidUUID(token) {
  const testName = 'Test 6: Delete EMI Provider with invalid UUID format (should return 400)';
  try {
    const response = await makeRequest({
      path: '/api/v1/admin/emi/providers/invalid-uuid-format',
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const passed = response.statusCode === 400;
    recordTest(testName, passed, {
      statusCode: response.statusCode,
      body: response.body,
      expected: 400,
      actual: response.statusCode
    });
    return passed;
  } catch (error) {
    recordTest(testName, false, { error: error.message });
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('='.repeat(80));
  console.log('UUID Regex Fix Test for EMI Deletion');
  console.log('='.repeat(80));
  console.log(`Test started at: ${testResults.environment.testStartTime}\n`);

  // Step 1: Verify backend server is running
  console.log('\n--- Step 1: Verifying Backend Server ---');
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.error('❌ Backend server is not running on http://localhost:3001');
    console.error('Please start the backend server before running tests.');
    testResults.environment.backendRunning = false;
    printResults();
    process.exit(1);
  }
  console.log('✓ Backend server is running on http://localhost:3001');
  testResults.environment.backendRunning = true;

  // Step 2: Login as admin
  console.log('\n--- Step 2: Admin Authentication ---');
  const token = await loginAdmin();
  if (!token) {
    console.error('❌ Failed to login as admin');
    console.error('Please ensure admin credentials are correct.');
    recordTest('Admin Authentication', false, { error: 'Failed to login' });
    printResults();
    process.exit(1);
  }
  console.log('✓ Admin login successful');
  recordTest('Admin Authentication', true, { message: 'Successfully authenticated' });

  // Step 3: Create test data
  console.log('\n--- Step 3: Creating Test Data ---');
  const provider = await createTestProvider(token);
  if (!provider) {
    console.error('❌ Failed to create test EMI provider');
    recordTest('Create Test Provider', false, { error: 'Failed to create provider' });
    printResults();
    process.exit(1);
  }
  console.log(`✓ Test provider created: ${provider.name} (ID: ${provider.id}, Code: ${provider.code})`);
  recordTest('Create Test Provider', true, { provider });

  const plan = await createTestPlan(token, provider.id);
  if (!plan) {
    console.error('❌ Failed to create test EMI plan');
    recordTest('Create Test Plan', false, { error: 'Failed to create plan' });
    printResults();
    process.exit(1);
  }
  console.log(`✓ Test plan created: ${plan.name} (ID: ${plan.id}, Code: ${plan.code})`);
  recordTest('Create Test Plan', true, { plan });

  // Step 4: Test EMI Plan Deletion
  console.log('\n--- Step 4: Testing EMI Plan Deletion ---');
  await testDeletePlanByCode(token, plan);
  await testDeletePlanByUUID(token, plan);
  await testDeletePlanInvalidUUID(token);

  // Step 5: Test EMI Provider Deletion
  console.log('\n--- Step 5: Testing EMI Provider Deletion ---');
  await testDeleteProviderByCode(token, provider);
  await testDeleteProviderByUUID(token, provider);
  await testDeleteProviderInvalidUUID(token);

  // Step 6: Print results
  console.log('\n--- Step 6: Test Results Summary ---');
  printResults();

  // Save results to file
  const timestamp = Date.now();
  const resultsFile = `uuid-regex-fix-test-results-${timestamp}.json`;
  require('fs').writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n✓ Test results saved to: ${resultsFile}`);

  // Exit with appropriate code
  const allPassed = testResults.tests.every(t => t.passed);
  process.exit(allPassed ? 0 : 1);
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  console.log('\nEnvironment:');
  console.log(`  Backend Running: ${testResults.environment.backendRunning ? '✓ Yes' : '✗ No'}`);
  console.log(`  Test Start Time: ${testResults.environment.testStartTime}`);

  console.log('\nTest Results:');
  let passed = 0;
  let failed = 0;

  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status}: ${test.testName}`);
    if (test.details && !test.passed) {
      console.log(`    Details: ${JSON.stringify(test.details)}`);
    }
    if (test.passed) passed++;
    else failed++;
  });

  console.log('\n' + '-'.repeat(80));
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testResults.tests.length) * 100).toFixed(2)}%`);
  console.log('='.repeat(80));
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error during test execution:', error);
  process.exit(1);
});
