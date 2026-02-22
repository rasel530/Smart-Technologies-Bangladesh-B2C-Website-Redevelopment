/**
 * Comprehensive test script for EMI plan and provider deletion
 * Tests both UUID and code identifiers
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_EMAIL = 'admin@smarttech.com';
const ADMIN_PASSWORD = 'AdminPassword123';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: {
    backendUrl: API_BASE_URL,
    frontendUrl: 'http://localhost:3000'
  },
  tests: []
};

// Helper function to add test result
function addTestResult(testName, passed, details, error = null) {
  testResults.tests.push({
    name: testName,
    passed,
    details,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  });
}

// Helper function to make API requests
async function makeRequest(method, endpoint, token, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  return {
    status: response.status,
    statusText: response.statusText,
    data
  };
}

// Step 1: Authenticate as admin
async function authenticateAdmin() {
  console.log('\n=== Step 1: Authenticating as admin ===');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      console.log('✓ Admin authentication successful');
      return data.token;
    } else {
      console.log('❌ Admin authentication failed:', data);
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    throw error;
  }
}

// Step 2: Fetch sample EMI plans and providers
async function fetchSampleData() {
  console.log('\n=== Step 2: Fetching sample EMI data ===');
  
  try {
    const plans = await prisma.emiPlan.findMany({
      take: 5,
      include: { provider: true },
      orderBy: { createdAt: 'desc' }
    });

    const providers = await prisma.emiProvider.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✓ Found ${plans.length} EMI plans`);
    console.log(`✓ Found ${providers.length} EMI providers`);

    if (plans.length > 0) {
      console.log('\nSample plans:');
      plans.forEach((plan, i) => {
        console.log(`  ${i + 1}. ${plan.name} (Code: ${plan.code}, UUID: ${plan.id})`);
      });
    }

    if (providers.length > 0) {
      console.log('\nSample providers:');
      providers.forEach((provider, i) => {
        console.log(`  ${i + 1}. ${provider.name} (Code: ${provider.code}, UUID: ${provider.id})`);
      });
    }

    return { plans, providers };
  } catch (error) {
    console.log('❌ Error fetching sample data:', error.message);
    throw error;
  }
}

// Step 3: Test EMI plan deletion by code
async function testPlanDeletionByCode(token, plan) {
  console.log(`\n=== Step 3: Testing EMI plan deletion by code ===`);
  console.log(`Testing plan: ${plan.name} (Code: ${plan.code})`);
  
  try {
    const response = await makeRequest(
      'DELETE',
      `/admin/emi/plans/${plan.code}`,
      token
    );

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('✓ EMI plan deleted successfully by code');
      addTestResult(
        `Delete EMI plan by code: ${plan.code}`,
        true,
        `Successfully deleted plan "${plan.name}" using code "${plan.code}"`
      );
      return true;
    } else {
      console.log('❌ EMI plan deletion by code failed');
      addTestResult(
        `Delete EMI plan by code: ${plan.code}`,
        false,
        `Failed with status ${response.status}`,
        new Error(response.data?.message || 'Unknown error')
      );
      return false;
    }
  } catch (error) {
    console.log('❌ Error deleting plan by code:', error.message);
    addTestResult(
      `Delete EMI plan by code: ${plan.code}`,
      false,
      'Request failed',
      error
    );
    return false;
  }
}

// Step 4: Test EMI plan deletion by UUID
async function testPlanDeletionByUUID(token, plan) {
  console.log(`\n=== Step 4: Testing EMI plan deletion by UUID ===`);
  console.log(`Testing plan: ${plan.name} (UUID: ${plan.id})`);
  
  try {
    const response = await makeRequest(
      'DELETE',
      `/admin/emi/plans/${plan.id}`,
      token
    );

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('✓ EMI plan deleted successfully by UUID');
      addTestResult(
        `Delete EMI plan by UUID: ${plan.id}`,
        true,
        `Successfully deleted plan "${plan.name}" using UUID "${plan.id}"`
      );
      return true;
    } else {
      console.log('❌ EMI plan deletion by UUID failed');
      addTestResult(
        `Delete EMI plan by UUID: ${plan.id}`,
        false,
        `Failed with status ${response.status}`,
        new Error(response.data?.message || 'Unknown error')
      );
      return false;
    }
  } catch (error) {
    console.log('❌ Error deleting plan by UUID:', error.message);
    addTestResult(
      `Delete EMI plan by UUID: ${plan.id}`,
      false,
      'Request failed',
      error
    );
    return false;
  }
}

// Step 5: Test EMI provider deletion by code
async function testProviderDeletionByCode(token, provider) {
  console.log(`\n=== Step 5: Testing EMI provider deletion by code ===`);
  console.log(`Testing provider: ${provider.name} (Code: ${provider.code})`);
  
  try {
    const response = await makeRequest(
      'DELETE',
      `/admin/emi/providers/${provider.code}`,
      token
    );

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('✓ EMI provider deleted successfully by code');
      addTestResult(
        `Delete EMI provider by code: ${provider.code}`,
        true,
        `Successfully deleted provider "${provider.name}" using code "${provider.code}"`
      );
      return true;
    } else {
      console.log('❌ EMI provider deletion by code failed');
      addTestResult(
        `Delete EMI provider by code: ${provider.code}`,
        false,
        `Failed with status ${response.status}`,
        new Error(response.data?.message || 'Unknown error')
      );
      return false;
    }
  } catch (error) {
    console.log('❌ Error deleting provider by code:', error.message);
    addTestResult(
      `Delete EMI provider by code: ${provider.code}`,
      false,
      'Request failed',
      error
    );
    return false;
  }
}

// Step 6: Test EMI provider deletion by UUID
async function testProviderDeletionByUUID(token, provider) {
  console.log(`\n=== Step 6: Testing EMI provider deletion by UUID ===`);
  console.log(`Testing provider: ${provider.name} (UUID: ${provider.id})`);
  
  try {
    const response = await makeRequest(
      'DELETE',
      `/admin/emi/providers/${provider.id}`,
      token
    );

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('✓ EMI provider deleted successfully by UUID');
      addTestResult(
        `Delete EMI provider by UUID: ${provider.id}`,
        true,
        `Successfully deleted provider "${provider.name}" using UUID "${provider.id}"`
      );
      return true;
    } else {
      console.log('❌ EMI provider deletion by UUID failed');
      addTestResult(
        `Delete EMI provider by UUID: ${provider.id}`,
        false,
        `Failed with status ${response.status}`,
        new Error(response.data?.message || 'Unknown error')
      );
      return false;
    }
  } catch (error) {
    console.log('❌ Error deleting provider by UUID:', error.message);
    addTestResult(
      `Delete EMI provider by UUID: ${provider.id}`,
      false,
      'Request failed',
      error
    );
    return false;
  }
}

// Step 7: Test edge cases
async function testEdgeCases(token) {
  console.log('\n=== Step 7: Testing edge cases ===');
  
  const edgeCases = [
    {
      name: 'Delete plan with invalid UUID format',
      endpoint: '/admin/emi/plans/invalid-uuid-format',
      expectedStatus: 400,
      type: 'plan'
    },
    {
      name: 'Delete plan with non-existent code',
      endpoint: '/admin/emi/plans/non-existent-plan-code-12345',
      expectedStatus: 404,
      type: 'plan'
    },
    {
      name: 'Delete provider with invalid UUID format',
      endpoint: '/admin/emi/providers/invalid-uuid-format',
      expectedStatus: 400,
      type: 'provider'
    },
    {
      name: 'Delete provider with non-existent code',
      endpoint: '/admin/emi/providers/non-existent-provider-code-12345',
      expectedStatus: 404,
      type: 'provider'
    }
  ];

  for (const testCase of edgeCases) {
    console.log(`\nTesting: ${testCase.name}`);
    
    try {
      const response = await makeRequest(
        'DELETE',
        testCase.endpoint,
        token
      );

      console.log(`Response status: ${response.status} (Expected: ${testCase.expectedStatus})`);
      console.log(`Response data:`, JSON.stringify(response.data, null, 2));

      const passed = response.status === testCase.expectedStatus;
      
      if (passed) {
        console.log('✓ Edge case handled correctly');
        addTestResult(
          testCase.name,
          true,
          `Correctly returned status ${response.status}`
        );
      } else {
        console.log('❌ Edge case not handled correctly');
        addTestResult(
          testCase.name,
          false,
          `Expected status ${testCase.expectedStatus} but got ${response.status}`,
          new Error(response.data?.message || 'Unexpected status')
        );
      }
    } catch (error) {
      console.log('❌ Error testing edge case:', error.message);
      addTestResult(
        testCase.name,
        false,
        'Request failed',
        error
      );
    }
  }
}

// Step 8: Test validation patterns
async function testValidationPatterns() {
  console.log('\n=== Step 8: Testing validation patterns ===');
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}$/i;
  const codeRegex = /^[a-z0-9-]+(-[a-z0-9-]+)*$/;

  const testCases = [
    { value: 'dutch-bangla-3m', description: 'Valid plan code', isUUID: false, isCode: true },
    { value: 'city-bank-12m', description: 'Valid plan code', isUUID: false, isCode: true },
    { value: '123e4567-e89b-12d3-a456-426614174000', description: 'Valid UUID', isUUID: true, isCode: false },
    { value: 'invalid-uuid', description: 'Invalid UUID', isUUID: false, isCode: true },
    { value: '', description: 'Empty string', isUUID: false, isCode: false },
    { value: 'UPPERCASE-CODE', description: 'Uppercase code', isUUID: false, isCode: false },
    { value: 'code with spaces', description: 'Code with spaces', isUUID: false, isCode: false },
    { value: 'test-code-123', description: 'Valid code with numbers', isUUID: false, isCode: true }
  ];

  testCases.forEach(({ value, description, isUUID, isCode }) => {
    const actualIsUUID = uuidRegex.test(value);
    const actualIsCode = codeRegex.test(value);
    const isValid = actualIsUUID || actualIsCode;
    const expectedValid = isUUID || isCode;
    
    console.log(`  ${description}: "${value}"`);
    console.log(`    Expected: UUID=${isUUID}, Code=${isCode}`);
    console.log(`    Actual: UUID=${actualIsUUID}, Code=${actualIsCode}`);
    console.log(`    ${isValid === expectedValid ? '✓' : '❌'} Validation ${isValid === expectedValid ? 'correct' : 'incorrect'}`);
    
    addTestResult(
      `Validation pattern: ${description}`,
      isValid === expectedValid,
      `UUID: ${actualIsUUID}, Code: ${actualIsCode}, Valid: ${isValid}`
    );
  });
}

// Main test function
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   EMI Plan & Provider Deletion Comprehensive Test Suite        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  try {
    // Step 1: Authenticate
    const token = await authenticateAdmin();
    
    // Step 2: Fetch sample data
    const { plans, providers } = await fetchSampleData();
    
    // Step 3: Test plan deletion by code (CRITICAL - was failing before)
    if (plans.length > 0) {
      await testPlanDeletionByCode(token, plans[0]);
    }
    
    // Step 4: Test plan deletion by UUID
    if (plans.length > 1) {
      await testPlanDeletionByUUID(token, plans[1]);
    }
    
    // Step 5: Test provider deletion by code
    if (providers.length > 0) {
      await testProviderDeletionByCode(token, providers[0]);
    }
    
    // Step 6: Test provider deletion by UUID
    if (providers.length > 1) {
      await testProviderDeletionByUUID(token, providers[1]);
    }
    
    // Step 7: Test edge cases
    await testEdgeCases(token);
    
    // Step 8: Test validation patterns
    await testValidationPatterns();
    
    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║   Test Summary                                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    const passedTests = testResults.tests.filter(t => t.passed).length;
    const failedTests = testResults.tests.filter(t => !t.passed).length;
    const totalTests = testResults.tests.length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✓`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`);
    
    // Print failed tests
    if (failedTests > 0) {
      console.log('Failed Tests:');
      testResults.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  ❌ ${test.name}`);
        console.log(`     ${test.details}`);
        if (test.error) {
          console.log(`     Error: ${test.error}`);
        }
      });
    }
    
    // Save results to file
    const resultsPath = `backend/emi-deletion-test-results-${Date.now()}.json`;
    require('fs').writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n✓ Test results saved to: ${resultsPath}`);
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    addTestResult(
      'Test Suite Execution',
      false,
      'Test suite failed to complete',
      error
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runTests();
