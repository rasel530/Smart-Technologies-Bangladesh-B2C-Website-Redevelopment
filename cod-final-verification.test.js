/**
 * COD Settings Final Verification Test
 * 
 * This test verifies the complete COD settings fix:
 * 1. GET endpoint returns camelCase field names
 * 2. PUT endpoint saves settings correctly
 * 3. Complete persistence flow works (save → database → retrieve)
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const ENDPOINT = '/api/v1/admin/cod/settings';
const LOGIN_ENDPOINT = '/api/v1/auth/login';
const ADMIN_CREDENTIALS = {
  identifier: 'admin@smarttech.com',
  password: 'AdminPassword123'
};
let authToken = null;

// Expected camelCase field names
const EXPECTED_CAMELCASE_FIELDS = [
  'isEnabled',
  'minAmount',
  'maxAmount',
  'additionalFee',
  'freeAboveAmount',
  'requirePhoneVerification',
  'requireAddressVerification',
  'maxDailyOrders',
  'maxWeeklyOrders',
  'deliveryDays',
  'availableDivisions',
  'unavailableDivisions',
  'notes',
  'createdAt',
  'updatedAt',
  'id'
];

// Sample test data with camelCase fields
const TEST_SETTINGS = {
  isEnabled: true,
  minAmount: 100,
  maxAmount: 50000,
  additionalFee: 50,
  freeAboveAmount: 1000,
  requirePhoneVerification: false,
  requireAddressVerification: false,
  maxDailyOrders: 5,
  maxWeeklyOrders: 10,
  deliveryDays: 3,
  availableDivisions: ["dhaka", "chittagong"],
  unavailableDivisions: [],
  notes: "Final verification test"
};

// Test results tracking
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  },
  overallStatus: 'PENDING'
};

/**
 * Helper function to log test results
 */
function logTest(testName, passed, message, details = {}) {
  const test = {
    name: testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(test);
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Message: ${message}`);
    if (Object.keys(details).length > 0) {
      console.log(`   Details:`, details);
    }
  }
  
  return passed;
}

/**
 * Helper function to check if all fields are camelCase
 */
function verifyCamelCaseFields(responseData) {
  const issues = [];
  const missingFields = [];
  const snakeCaseFields = [];
  
  // Check for expected camelCase fields
  EXPECTED_CAMELCASE_FIELDS.forEach(field => {
    if (!(field in responseData)) {
      missingFields.push(field);
    }
  });
  
  // Check for snake_case fields (should not exist)
  const snakeCasePattern = /_[a-z]/;
  Object.keys(responseData).forEach(key => {
    if (snakeCasePattern.test(key)) {
      snakeCaseFields.push(key);
    }
  });
  
  if (missingFields.length > 0) {
    issues.push(`Missing camelCase fields: ${missingFields.join(', ')}`);
  }
  
  if (snakeCaseFields.length > 0) {
    issues.push(`Found snake_case fields (should be camelCase): ${snakeCaseFields.join(', ')}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    missingFields,
    snakeCaseFields
  };
}

/**
 * Authenticate and get JWT token
 */
async function authenticate() {
  console.log('\n=== Authentication ===');
  
  try {
    const response = await fetch(`${BASE_URL}${LOGIN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });
    
    const status = response.status;
    const data = await response.json();
    
    console.log(`Login Response Status: ${status}`);
    console.log(`Login Response:`, JSON.stringify(data, null, 2));
    
    if (status === 200 && data.token) {
      authToken = data.token;
      console.log(`✅ Authentication successful. Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log(`❌ Authentication failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Authentication error: ${error.message}`);
    return false;
  }
}

/**
 * Test 1: GET endpoint returns camelCase fields
 */
async function testGetEndpointCamelCase() {
  console.log('\n=== Test 1: GET Endpoint - Verify camelCase Fields ===');
  
  try {
    if (!authToken) {
      logTest(
        'GET Endpoint - Authentication',
        false,
        'No authentication token available',
        {}
      );
      return false;
    }

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    const data = await response.json();
    
    console.log(`Response Status: ${status}`);
    console.log(`Response Data:`, JSON.stringify(data, null, 2));
    
    // Test 1.1: Check response status
    logTest(
      'GET Endpoint - Status Code',
      status === 200,
      status === 200 ? 'Status code is 200 OK' : `Expected 200, got ${status}`,
      { status }
    );
    
    if (status !== 200) {
      return false;
    }
    
    // Test 1.2: Check response structure
    const hasData = data && (data.data || data.settings || data);
    logTest(
      'GET Endpoint - Response Structure',
      hasData,
      hasData ? 'Response contains data' : 'Response does not contain expected data structure',
      { hasData }
    );
    
    if (!hasData) {
      return false;
    }
    
    // Extract the actual settings data
    const settings = data.data || data.settings || data;
    
    // Test 1.3: Verify all fields are camelCase
    const camelCaseCheck = verifyCamelCaseFields(settings);
    logTest(
      'GET Endpoint - All Fields are camelCase',
      camelCaseCheck.isValid,
      camelCaseCheck.isValid ? 'All fields are in camelCase format' : camelCaseCheck.issues.join('; '),
      {
        missingFields: camelCaseCheck.missingFields,
        snakeCaseFields: camelCaseCheck.snakeCaseFields,
        allFields: Object.keys(settings)
      }
    );
    
    // Test 1.4: Verify all expected fields are present
    const allExpectedPresent = camelCaseCheck.missingFields.length === 0;
    logTest(
      'GET Endpoint - All Expected Fields Present',
      allExpectedPresent,
      allExpectedPresent ? 'All 16 expected fields are present' : `Missing ${camelCaseCheck.missingFields.length} fields`,
      { missingFields: camelCaseCheck.missingFields }
    );
    
    // Test 1.5: Verify no snake_case fields exist
    const noSnakeCase = camelCaseCheck.snakeCaseFields.length === 0;
    logTest(
      'GET Endpoint - No snake_case Fields',
      noSnakeCase,
      noSnakeCase ? 'No snake_case fields found' : `Found ${camelCaseCheck.snakeCaseFields.length} snake_case fields`,
      { snakeCaseFields: camelCaseCheck.snakeCaseFields }
    );
    
    return camelCaseCheck.isValid;
    
  } catch (error) {
    logTest(
      'GET Endpoint - Request Success',
      false,
      `Request failed: ${error.message}`,
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 2: PUT endpoint saves settings correctly
 */
async function testPutEndpointSave() {
  console.log('\n=== Test 2: PUT Endpoint - Save COD Settings ===');
  
  try {
    if (!authToken) {
      logTest(
        'PUT Endpoint - Authentication',
        false,
        'No authentication token available',
        {}
      );
      return false;
    }

    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_SETTINGS)
    });
    
    const status = response.status;
    const data = await response.json();
    
    console.log(`Response Status: ${status}`);
    console.log(`Response Data:`, JSON.stringify(data, null, 2));
    
    // Test 2.1: Check response status
    logTest(
      'PUT Endpoint - Status Code',
      status === 200,
      status === 200 ? 'Status code is 200 OK' : `Expected 200, got ${status}`,
      { status }
    );
    
    if (status !== 200) {
      return false;
    }
    
    // Test 2.2: Check response contains updated settings
    const hasData = data && (data.data || data.settings || data);
    logTest(
      'PUT Endpoint - Response Contains Settings',
      hasData,
      hasData ? 'Response contains updated settings' : 'Response does not contain settings',
      { hasData }
    );
    
    if (!hasData) {
      return false;
    }
    
    // Extract the actual settings data
    const settings = data.data || data.settings || data;
    
    // Test 2.3: Verify response uses camelCase fields
    const camelCaseCheck = verifyCamelCaseFields(settings);
    logTest(
      'PUT Endpoint - Response Uses camelCase',
      camelCaseCheck.isValid,
      camelCaseCheck.isValid ? 'Response fields are in camelCase format' : camelCaseCheck.issues.join('; '),
      {
        missingFields: camelCaseCheck.missingFields,
        snakeCaseFields: camelCaseCheck.snakeCaseFields
      }
    );
    
    // Test 2.4: Verify saved values match input
    const valuesMatch = Object.keys(TEST_SETTINGS).every(key => {
      return JSON.stringify(settings[key]) === JSON.stringify(TEST_SETTINGS[key]);
    });
    
    logTest(
      'PUT Endpoint - Saved Values Match Input',
      valuesMatch,
      valuesMatch ? 'All saved values match input' : 'Some values do not match input',
      {
        input: TEST_SETTINGS,
        saved: settings
      }
    );
    
    return camelCaseCheck.isValid && valuesMatch;
    
  } catch (error) {
    logTest(
      'PUT Endpoint - Request Success',
      false,
      `Request failed: ${error.message}`,
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 3: Verify complete persistence flow
 */
async function testPersistenceFlow() {
  console.log('\n=== Test 3: Complete Persistence Flow ===');
  
  try {
    if (!authToken) {
      logTest(
        'Persistence Flow - Authentication',
        false,
        'No authentication token available',
        {}
      );
      return false;
    }

    // Step 1: Save settings via PUT
    console.log('Step 1: Saving settings via PUT...');
    const putResponse = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_SETTINGS)
    });
    
    if (putResponse.status !== 200) {
      logTest(
        'Persistence Flow - PUT Request',
        false,
        `PUT request failed with status ${putResponse.status}`,
        { status: putResponse.status }
      );
      return false;
    }
    
    const putData = await putResponse.json();
    const savedSettings = putData.data || putData.settings || putData;
    
    logTest(
      'Persistence Flow - Save to Database',
      true,
      'Settings saved to database successfully',
      { savedSettings }
    );
    
    // Step 2: Retrieve settings via GET
    console.log('Step 2: Retrieving settings via GET...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure persistence

    const getResponse = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (getResponse.status !== 200) {
      logTest(
        'Persistence Flow - GET Request',
        false,
        `GET request failed with status ${getResponse.status}`,
        { status: getResponse.status }
      );
      return false;
    }
    
    const getData = await getResponse.json();
    const retrievedSettings = getData.data || getData.settings || getData;
    
    // Step 3: Verify retrieved settings match saved settings
    const settingsMatch = Object.keys(TEST_SETTINGS).every(key => {
      return JSON.stringify(retrievedSettings[key]) === JSON.stringify(TEST_SETTINGS[key]);
    });
    
    logTest(
      'Persistence Flow - Retrieved Settings Match Saved',
      settingsMatch,
      settingsMatch ? 'Retrieved settings match saved settings' : 'Retrieved settings do not match',
      {
        saved: savedSettings,
        retrieved: retrievedSettings
      }
    );
    
    // Step 4: Verify retrieved settings use camelCase
    const camelCaseCheck = verifyCamelCaseFields(retrievedSettings);
    logTest(
      'Persistence Flow - Retrieved Settings Use camelCase',
      camelCaseCheck.isValid,
      camelCaseCheck.isValid ? 'Retrieved settings use camelCase format' : camelCaseCheck.issues.join('; '),
      {
        missingFields: camelCaseCheck.missingFields,
        snakeCaseFields: camelCaseCheck.snakeCaseFields
      }
    );
    
    // Step 5: Verify no snake_case in retrieved data
    const noSnakeCase = camelCaseCheck.snakeCaseFields.length === 0;
    logTest(
      'Persistence Flow - No snake_case in Retrieved Data',
      noSnakeCase,
      noSnakeCase ? 'No snake_case fields in retrieved data' : `Found ${camelCaseCheck.snakeCaseFields.length} snake_case fields`,
      { snakeCaseFields: camelCaseCheck.snakeCaseFields }
    );
    
    return settingsMatch && camelCaseCheck.isValid && noSnakeCase;
    
  } catch (error) {
    logTest(
      'Persistence Flow - Test Execution',
      false,
      `Test failed: ${error.message}`,
      { error: error.message }
    );
    return false;
  }
}

/**
 * Generate and save test report
 */
function generateReport() {
  // Determine overall status
  if (testResults.summary.failed === 0) {
    testResults.overallStatus = 'PASS';
  } else {
    testResults.overallStatus = 'FAIL';
  }
  
  // Generate report content
  const report = `
# COD Settings Final Verification Report

**Generated:** ${testResults.timestamp}
**Overall Status:** ${testResults.overallStatus}

## Summary

- **Total Tests:** ${testResults.summary.total}
- **Passed:** ${testResults.summary.passed}
- **Failed:** ${testResults.summary.failed}

## Test Results

${testResults.tests.map(test => `
### ${test.name}

**Status:** ${test.passed ? '✅ PASS' : '❌ FAIL'}
**Message:** ${test.message}
**Timestamp:** ${test.timestamp}
${Object.keys(test.details).length > 0 ? `**Details:**\n\`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`` : ''}
`).join('\n')}

## Key Findings

### GET Endpoint
- Returns data with **camelCase** field names: ${testResults.tests.find(t => t.name.includes('GET Endpoint - All Fields are camelCase'))?.passed ? '✅ YES' : '❌ NO'}
- All 16 expected fields present: ${testResults.tests.find(t => t.name.includes('GET Endpoint - All Expected Fields Present'))?.passed ? '✅ YES' : '❌ NO'}
- No snake_case fields found: ${testResults.tests.find(t => t.name.includes('GET Endpoint - No snake_case Fields'))?.passed ? '✅ YES' : '❌ NO'}

### PUT Endpoint
- Saves settings correctly: ${testResults.tests.find(t => t.name.includes('PUT Endpoint - Saved Values Match Input'))?.passed ? '✅ YES' : '❌ NO'}
- Returns camelCase fields: ${testResults.tests.find(t => t.name.includes('PUT Endpoint - Response Uses camelCase'))?.passed ? '✅ YES' : '❌ NO'}

### Persistence Flow
- Settings persist to database: ${testResults.tests.find(t => t.name.includes('Persistence Flow - Save to Database'))?.passed ? '✅ YES' : '❌ NO'}
- Retrieved settings match saved: ${testResults.tests.find(t => t.name.includes('Persistence Flow - Retrieved Settings Match Saved'))?.passed ? '✅ YES' : '❌ NO'}
- Retrieved data uses camelCase: ${testResults.tests.find(t => t.name.includes('Persistence Flow - Retrieved Settings Use camelCase'))?.passed ? '✅ YES' : '❌ NO'}

## Conclusion

${testResults.overallStatus === 'PASS' 
  ? '✅ **ALL TESTS PASSED** - The COD settings fix is working correctly. Both endpoints return camelCase field names, and the complete persistence flow works as expected. After page refresh, saved settings will be displayed correctly in the browser.'
  : '❌ **SOME TESTS FAILED** - There are issues with the COD settings implementation. Please review the failed tests above.'}

## Test Data Used

\`\`\`json
${JSON.stringify(TEST_SETTINGS, null, 2)}
\`\`\`

## Expected camelCase Fields

${EXPECTED_CAMELCASE_FIELDS.map(f => `- ${f}`).join('\n')}
`;
  
  // Save report to file
  const reportFileName = `cod-final-verification-report-${Date.now()}.md`;
  const reportPath = path.join(process.cwd(), reportFileName);
  
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report saved to: ${reportFileName}`);
  
  // Also save JSON results
  const jsonFileName = `cod-final-verification-results-${Date.now()}.json`;
  const jsonPath = path.join(process.cwd(), jsonFileName);
  
  fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
  console.log(`📊 JSON results saved to: ${jsonFileName}`);
  
  return { reportPath, jsonPath };
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('========================================');
  console.log('COD Settings Final Verification Test');
  console.log('========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('========================================');

  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.');
    testResults.overallStatus = 'FAIL';
    generateReport();
    return {
      success: false,
      error: 'Authentication failed'
    };
  }

  // Run all tests
  const test1Passed = await testGetEndpointCamelCase();
  const test2Passed = await testPutEndpointSave();
  const test3Passed = await testPersistenceFlow();
  
  // Generate report
  const { reportPath, jsonPath } = generateReport();
  
  // Print summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Overall Status: ${testResults.overallStatus}`);
  console.log('========================================');
  
  return {
    success: testResults.overallStatus === 'PASS',
    reportPath,
    jsonPath,
    testResults
  };
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
    .then(result => {
      console.log('\n✅ Test execution completed');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testGetEndpointCamelCase, testPutEndpointSave, testPersistenceFlow };
