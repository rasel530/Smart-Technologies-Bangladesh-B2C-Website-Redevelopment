/**
 * Comprehensive Test Script for EMI Provider and Plan Deletion Fix
 * 
 * This script tests the fix for the EMI Provider and Plan Deletion Validation Error.
 * It verifies that deletion endpoints work correctly with both UUID and code identifiers.
 * 
 * Test Coverage:
 * 1. Admin Authentication
 * 2. List EMI Providers (to get codes and UUIDs)
 * 3. Delete Provider by Code
 * 4. Delete Provider by UUID
 * 5. Delete Plan by UUID
 * 6. Edge Cases:
 *    - Delete non-existent provider
 *    - Delete with invalid identifier format
 *    - Cascade delete (provider with associated plans)
 */

const http = require('http');

// Configuration
const config = {
  host: 'localhost',
  port: 3001,
  adminEmail: 'admin@smarttech.com',
  adminPassword: 'AdminPassword123'
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: {
    backend: `http://${config.host}:${config.port}`,
    frontend: 'http://localhost:3000'
  },
  tests: []
};

// Helper function to make HTTP requests
function makeRequest(options, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'emi-deletion-test/1.0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request({
      ...options,
      headers
    }, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            duration
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            duration
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout after 10 seconds'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Helper function to record test results
function recordTest(testName, passed, details) {
  const result = {
    test: testName,
    passed,
    timestamp: new Date().toISOString(),
    ...details
  };
  testResults.tests.push(result);
  
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${testName}`);
  if (details.message) {
    console.log(`  ${details.message}`);
  }
  if (details.statusCode) {
    console.log(`  Status Code: ${details.statusCode}`);
  }
  if (details.response) {
    console.log(`  Response: ${JSON.stringify(details.response).substring(0, 200)}...`);
  }
  console.log('');
}

// Test 1: Admin Authentication
async function testAdminAuthentication() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: Admin Authentication');
  console.log('='.repeat(80));
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: '/api/v1/auth/login',
      method: 'POST'
    }, {
      identifier: config.adminEmail,
      password: config.adminPassword
    });
    
    if (result.statusCode === 200 && result.data.token) {
      recordTest('Admin Authentication', true, {
        message: 'Successfully authenticated admin user',
        statusCode: result.statusCode,
        response: { token: result.data.token.substring(0, 20) + '...' }
      });
      return result.data.token;
    } else {
      recordTest('Admin Authentication', false, {
        message: 'Failed to authenticate admin user',
        statusCode: result.statusCode,
        response: result.data
      });
      return null;
    }
  } catch (error) {
    recordTest('Admin Authentication', false, {
      message: `Request failed: ${error.message}`,
      error: error.message
    });
    return null;
  }
}

// Test 2: List EMI Providers
async function testListProviders(token) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: List EMI Providers');
  console.log('='.repeat(80));
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: '/api/v1/admin/emi/providers?limit=20',
      method: 'GET'
    }, null, token);
    
    if (result.statusCode === 200 && result.data.success) {
      const providers = result.data.data.providers;
      recordTest('List EMI Providers', true, {
        message: `Successfully retrieved ${providers.length} providers`,
        statusCode: result.statusCode,
        response: { count: providers.length }
      });
      return providers;
    } else {
      recordTest('List EMI Providers', false, {
        message: 'Failed to list EMI providers',
        statusCode: result.statusCode,
        response: result.data
      });
      return [];
    }
  } catch (error) {
    recordTest('List EMI Providers', false, {
      message: `Request failed: ${error.message}`,
      error: error.message
    });
    return [];
  }
}

// Test 3: List EMI Plans
async function testListPlans(token) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: List EMI Plans');
  console.log('='.repeat(80));
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: '/api/v1/admin/emi/plans?limit=20',
      method: 'GET'
    }, null, token);
    
    if (result.statusCode === 200 && result.data.success) {
      const plans = result.data.data.plans;
      recordTest('List EMI Plans', true, {
        message: `Successfully retrieved ${plans.length} plans`,
        statusCode: result.statusCode,
        response: { count: plans.length }
      });
      return plans;
    } else {
      recordTest('List EMI Plans', false, {
        message: 'Failed to list EMI plans',
        statusCode: result.statusCode,
        response: result.data
      });
      return [];
    }
  } catch (error) {
    recordTest('List EMI Plans', false, {
      message: `Request failed: ${error.message}`,
      error: error.message
    });
    return [];
  }
}

// Test 4: Delete Provider by Code
async function testDeleteProviderByCode(token, providerCode) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 4: Delete Provider by Code');
  console.log('='.repeat(80));
  
  if (!providerCode) {
    recordTest('Delete Provider by Code', false, {
      message: 'No provider code available for testing'
    });
    return false;
  }
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: `/api/v1/admin/emi/providers/${providerCode}`,
      method: 'DELETE'
    }, null, token);
    
    if (result.statusCode === 200 && result.data.success) {
      recordTest('Delete Provider by Code', true, {
        message: `Successfully deleted provider with code: ${providerCode}`,
        statusCode: result.statusCode,
        response: { code: providerCode }
      });
      return true;
    } else {
      recordTest('Delete Provider by Code', false, {
        message: `Failed to delete provider with code: ${providerCode}`,
        statusCode: result.statusCode,
        response: result.data
      });
      return false;
    }
  } catch (error) {
    recordTest('Delete Provider by Code', false, {
      message: `Request failed: ${error.message}`,
      error: error.message
    });
    return false;
  }
}

// Test 5: Delete Provider by UUID
async function testDeleteProviderByUUID(token, providerUUID) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 5: Delete Provider by UUID');
  console.log('='.repeat(80));
  
  if (!providerUUID) {
    recordTest('Delete Provider by UUID', false, {
      message: 'No provider UUID available for testing'
    });
    return false;
  }
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: `/api/v1/admin/emi/providers/${providerUUID}`,
      method: 'DELETE'
    }, null, token);
    
    if (result.statusCode === 200 && result.data.success) {
      recordTest('Delete Provider by UUID', true, {
        message: `Successfully deleted provider with UUID: ${providerUUID.substring(0, 8)}...`,
        statusCode: result.statusCode,
        response: { uuid: providerUUID.substring(0, 8) + '...' }
      });
      return true;
    } else {
      recordTest('Delete Provider by UUID', false, {
        message: `Failed to delete provider with UUID: ${providerUUID.substring(0, 8)}...`,
        statusCode: result.statusCode,
        response: result.data
      });
      return false;
    }
  } catch (error) {
    recordTest('Delete Provider by UUID', false, {
      message: `Request failed: ${error.message}`,
      error: error.message
    });
    return false;
  }
}

// Test 6: Delete Plan by UUID
async function testDeletePlanByUUID(token, planUUID) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 6: Delete Plan by UUID');
  console.log('='.repeat(80));
  
  if (!planUUID) {
    recordTest('Delete Plan by UUID', false, {
      message: 'No plan UUID available for testing'
    });
    return false;
  }
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: `/api/v1/admin/emi/plans/${planUUID}`,
      method: 'DELETE'
    }, null, token);
    
    if (result.statusCode === 200 && result.data.success) {
      recordTest('Delete Plan by UUID', true, {
        message: `Successfully deleted plan with UUID: ${planUUID.substring(0, 8)}...`,
        statusCode: result.statusCode,
        response: { uuid: planUUID.substring(0, 8) + '...' }
      });
      return true;
    } else {
      recordTest('Delete Plan by UUID', false, {
        message: `Failed to delete plan with UUID: ${planUUID.substring(0, 8)}...`,
        statusCode: result.statusCode,
        response: result.data
      });
      return false;
    }
  } catch (error) {
    recordTest('Delete Plan by UUID', false, {
      message: `Request failed: ${error.message}`,
      error: error.message
    });
    return false;
  }
}

// Test 7: Delete Non-existent Provider
async function testDeleteNonExistentProvider(token) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 7: Delete Non-existent Provider');
  console.log('='.repeat(80));
  
  const fakeCode = 'non-existent-provider-code-12345';
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: `/api/v1/admin/emi/providers/${fakeCode}`,
      method: 'DELETE'
    }, null, token);
    
    if (result.statusCode === 404) {
      recordTest('Delete Non-existent Provider', true, {
        message: `Correctly returned 404 for non-existent provider: ${fakeCode}`,
        statusCode: result.statusCode,
        response: { code: fakeCode }
      });
      return true;
    } else {
      recordTest('Delete Non-existent Provider', false, {
        message: `Expected 404 but got ${result.statusCode} for non-existent provider`,
        statusCode: result.statusCode,
        response: result.data
      });
      return false;
    }
  } catch (error) {
    recordTest('Delete Non-existent Provider', false, {
      message: `Request failed: ${error.message}`,
      error: error.message
    });
    return false;
  }
}

// Test 8: Delete with Invalid Identifier Format
async function testDeleteInvalidIdentifier(token) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 8: Delete with Invalid Identifier Format');
  console.log('='.repeat(80));
  
  const invalidId = 'invalid@identifier#format';
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: `/api/v1/admin/emi/providers/${invalidId}`,
      method: 'DELETE'
    }, null, token);
    
    if (result.statusCode === 400) {
      recordTest('Delete with Invalid Identifier Format', true, {
        message: `Correctly returned 400 for invalid identifier format: ${invalidId}`,
        statusCode: result.statusCode,
        response: { identifier: invalidId }
      });
      return true;
    } else {
      recordTest('Delete with Invalid Identifier Format', false, {
        message: `Expected 400 but got ${result.statusCode} for invalid identifier`,
        statusCode: result.statusCode,
        response: result.data
      });
      return false;
    }
  } catch (error) {
    recordTest('Delete with Invalid Identifier Format', false, {
      message: `Request failed: ${error.message}`,
      error: error.message
    });
    return false;
  }
}

// Test 9: Cascade Delete (Provider with Plans)
async function testCascadeDelete(token, providers) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 9: Cascade Delete (Provider with Associated Plans)');
  console.log('='.repeat(80));
  
  // Find a provider with associated plans
  const providerWithPlans = providers.find(p => p.emiPlans && p.emiPlans.length > 0);
  
  if (!providerWithPlans) {
    recordTest('Cascade Delete', false, {
      message: 'No provider with associated plans found for testing'
    });
    return false;
  }
  
  const planCount = providerWithPlans.emiPlans.length;
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: `/api/v1/admin/emi/providers/${providerWithPlans.code}`,
      method: 'DELETE'
    }, null, token);
    
    if (result.statusCode === 200 && result.data.success) {
      recordTest('Cascade Delete', true, {
        message: `Successfully deleted provider with ${planCount} associated plans (cascade delete)`,
        statusCode: result.statusCode,
        response: { 
          code: providerWithPlans.code,
          plansDeleted: planCount 
        }
      });
      return true;
    } else {
      recordTest('Cascade Delete', false, {
        message: `Failed to cascade delete provider with plans`,
        statusCode: result.statusCode,
        response: result.data
      });
      return false;
    }
  } catch (error) {
    recordTest('Cascade Delete', false, {
      message: `Request failed: ${error.message}`,
      error: error.message
    });
    return false;
  }
}

// Test 10: Health Check
async function testHealthCheck() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 0: Health Check');
  console.log('='.repeat(80));
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: '/api/v1/health',
      method: 'GET'
    });
    
    if (result.statusCode === 200 && result.data.status === 'OK') {
      recordTest('Health Check', true, {
        message: 'Backend server is healthy and responding',
        statusCode: result.statusCode,
        response: { status: result.data.status }
      });
      return true;
    } else {
      recordTest('Health Check', false, {
        message: 'Backend server returned unexpected response',
        statusCode: result.statusCode,
        response: result.data
      });
      return false;
    }
  } catch (error) {
    recordTest('Health Check', false, {
      message: `Health check failed: ${error.message}`,
      error: error.message
    });
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('EMI PROVIDER AND PLAN DELETION FIX - COMPREHENSIVE TEST');
  console.log('='.repeat(80));
  console.log(`Test started at: ${new Date().toISOString()}`);
  console.log(`Backend: http://${config.host}:${config.port}`);
  console.log(`Frontend: http://localhost:3000`);
  console.log('='.repeat(80));
  
  // Test 0: Health check
  await testHealthCheck();
  
  // Test 1: Authenticate admin
  const token = await testAdminAuthentication();
  
  if (!token) {
    console.log('\n' + '='.repeat(80));
    console.log('CRITICAL: Admin authentication failed. Cannot proceed with further tests.');
    console.log('='.repeat(80));
    await saveTestResults();
    return;
  }
  
  // Test 2: List providers
  const providers = await testListProviders(token);
  
  // Test 3: List plans
  const plans = await testListPlans(token);
  
  // Get sample identifiers for testing
  const firstProvider = providers.length > 0 ? providers[0] : null;
  const secondProvider = providers.length > 1 ? providers[1] : null;
  const firstPlan = plans.length > 0 ? plans[0] : null;
  
  // Test 4: Delete provider by code
  if (firstProvider && firstProvider.code) {
    await testDeleteProviderByCode(token, firstProvider.code);
  }
  
  // Test 5: Delete provider by UUID
  if (secondProvider && secondProvider.id) {
    await testDeleteProviderByUUID(token, secondProvider.id);
  }
  
  // Test 6: Delete plan by UUID
  if (firstPlan && firstPlan.id) {
    await testDeletePlanByUUID(token, firstPlan.id);
  }
  
  // Test 7: Delete non-existent provider
  await testDeleteNonExistentProvider(token);
  
  // Test 8: Delete with invalid identifier format
  await testDeleteInvalidIdentifier(token);
  
  // Test 9: Cascade delete
  if (providers.length > 2) {
    await testCascadeDelete(token, providers.slice(2));
  }
  
  // Save test results
  await saveTestResults();
  
  // Print summary
  printTestSummary();
}

// Save test results to JSON file
async function saveTestResults() {
  const fs = require('fs');
  const path = require('path');
  
  const resultsDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const timestamp = Date.now();
  const filePath = path.join(resultsDir, `emi-deletion-test-results-${timestamp}.json`);
  
  // Calculate summary statistics
  const passedTests = testResults.tests.filter(t => t.passed).length;
  const failedTests = testResults.tests.filter(t => !t.passed).length;
  
  testResults.summary = {
    total: testResults.tests.length,
    passed: passedTests,
    failed: failedTests,
    passRate: ((passedTests / testResults.tests.length) * 100).toFixed(2) + '%'
  };
  
  fs.writeFileSync(filePath, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${filePath}`);
}

// Print test summary
function printTestSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passedTests = testResults.tests.filter(t => t.passed).length;
  const failedTests = testResults.tests.filter(t => !t.passed).length;
  
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: ${passedTests} (${((passedTests / testResults.tests.length) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${failedTests} (${((failedTests / testResults.tests.length) * 100).toFixed(2)}%)`);
  
  if (failedTests > 0) {
    console.log('\nFailed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.test}: ${t.message || t.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION OF FIX');
  console.log('='.repeat(80));
  
  const deleteProviderByCodeTest = testResults.tests.find(t => t.test === 'Delete Provider by Code');
  const deleteProviderByUUIDTest = testResults.tests.find(t => t.test === 'Delete Provider by UUID');
  const deletePlanByUUIDTest = testResults.tests.find(t => t.test === 'Delete Plan by UUID');
  
  if (deleteProviderByCodeTest?.passed && deleteProviderByUUIDTest?.passed && deletePlanByUUIDTest?.passed) {
    console.log('✓ The EMI Provider and Plan Deletion Validation Error has been FIXED');
    console.log('✓ Deletion by code works correctly');
    console.log('✓ Deletion by UUID works correctly');
    console.log('✓ Plan deletion works correctly');
  } else {
    console.log('✗ The EMI Provider and Plan Deletion Validation Error may NOT be fully fixed');
    if (!deleteProviderByCodeTest?.passed) {
      console.log('  ✗ Deletion by code failed');
    }
    if (!deleteProviderByUUIDTest?.passed) {
      console.log('  ✗ Deletion by UUID failed');
    }
    if (!deletePlanByUUIDTest?.passed) {
      console.log('  ✗ Plan deletion failed');
    }
  }
  
  console.log('='.repeat(80) + '\n');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
