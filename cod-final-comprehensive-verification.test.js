/**
 * Final Comprehensive Verification of All COD Settings Fixes
 * 
 * This test verifies:
 * 1. GET endpoint returns camelCase field names
 * 2. PUT endpoint returns camelCase field names
 * 3. Complete persistence flow works (PUT → GET)
 * 
 * Date: 2026-02-20
 */

const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_EMAIL = 'admin@smarttech.com';
const ADMIN_PASSWORD = 'AdminPassword123';

// Expected camelCase fields (16 fields)
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

// Sample test data
const TEST_COD_SETTINGS = {
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
  notes: "Final comprehensive verification test"
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    // Parse the base URL and construct full URL
    const url = new URL(API_BASE_URL);
    const fullPath = url.pathname + options.path;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: fullPath,
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
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

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const result = {
    test: testName,
    status: passed ? 'PASS' : 'FAIL',
    details: details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  
  console.log(`\n[${result.status}] ${testName}`);
  if (details) {
    console.log(`  ${details}`);
  }
}

// Helper function to verify camelCase fields
function verifyCamelCaseFields(data, context) {
  if (!data || typeof data !== 'object') {
    logTest(`${context} - Response is valid object`, false, 'Response is not a valid object');
    return false;
  }

  const actualFields = Object.keys(data);
  const missingFields = EXPECTED_CAMELCASE_FIELDS.filter(f => !actualFields.includes(f));
  const extraFields = actualFields.filter(f => !EXPECTED_CAMELCASE_FIELDS.includes(f));
  
  // Check for snake_case fields (this is what we're trying to fix)
  const snakeCaseFields = actualFields.filter(f => f.includes('_'));
  
  let allPassed = true;
  
  if (missingFields.length > 0) {
    logTest(`${context} - All expected fields present`, false, `Missing fields: ${missingFields.join(', ')}`);
    allPassed = false;
  } else {
    logTest(`${context} - All expected fields present`, true, `All ${EXPECTED_CAMELCASE_FIELDS.length} fields present`);
  }
  
  if (snakeCaseFields.length > 0) {
    logTest(`${context} - No snake_case fields`, false, `Found snake_case fields: ${snakeCaseFields.join(', ')}`);
    allPassed = false;
  } else {
    logTest(`${context} - No snake_case fields`, true, 'All fields are in camelCase format');
  }
  
  if (extraFields.length > 0) {
    logTest(`${context} - No unexpected fields`, false, `Extra fields: ${extraFields.join(', ')}`);
  } else {
    logTest(`${context} - No unexpected fields`, true, 'Only expected fields present');
  }
  
  return allPassed;
}

// Main test function
async function runTests() {
  console.log('='.repeat(80));
  console.log('FINAL COMPREHENSIVE VERIFICATION OF ALL COD SETTINGS FIXES');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  let authToken = null;

  // Step 1: Authenticate as admin
  console.log('\n\n[STEP 1] Authenticating as admin...');
  try {
    const authResponse = await makeRequest({
      method: 'POST',
      path: '/auth/login'
    }, {
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (authResponse.statusCode === 200 && authResponse.data.token) {
      authToken = authResponse.data.token;
      logTest('Admin Authentication', true, `Token received: ${authToken.substring(0, 20)}...`);
    } else {
      logTest('Admin Authentication', false, `Status: ${authResponse.statusCode}, Response: ${JSON.stringify(authResponse.data)}`);
      console.log('\n❌ Authentication failed. Cannot continue tests.');
      return generateReport();
    }
  } catch (error) {
    logTest('Admin Authentication', false, `Error: ${error.message}`);
    console.log('\n❌ Authentication error. Cannot continue tests.');
    return generateReport();
  }

  // Step 2: Test GET endpoint - verify camelCase response
  console.log('\n\n[STEP 2] Testing GET endpoint (verify camelCase response)...');
  let getResponse1 = null;
  try {
    getResponse1 = await makeRequest({
      method: 'GET',
      path: '/admin/cod/settings',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (getResponse1.statusCode === 200 && getResponse1.data.success) {
      const settings = getResponse1.data.data;
      logTest('GET Endpoint - Success response', true, `Status: ${getResponse1.statusCode}`);
      
      // Verify camelCase fields
      verifyCamelCaseFields(settings, 'GET Endpoint');
      
      // Log actual field names for verification
      console.log('\n  Actual field names in GET response:');
      Object.keys(settings).forEach(field => {
        console.log(`    - ${field}`);
      });
    } else {
      logTest('GET Endpoint - Success response', false, `Status: ${getResponse1.statusCode}, Response: ${JSON.stringify(getResponse1.data)}`);
    }
  } catch (error) {
    logTest('GET Endpoint - Success response', false, `Error: ${error.message}`);
  }

  // Step 3: Test PUT endpoint - verify camelCase response
  console.log('\n\n[STEP 3] Testing PUT endpoint (verify camelCase response)...');
  let putResponse = null;
  try {
    putResponse = await makeRequest({
      method: 'PUT',
      path: '/admin/cod/settings',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }, TEST_COD_SETTINGS);

    if (putResponse.statusCode === 200 && putResponse.data.success) {
      const settings = putResponse.data.data;
      logTest('PUT Endpoint - Success response', true, `Status: ${putResponse.statusCode}`);
      
      // Verify camelCase fields
      verifyCamelCaseFields(settings, 'PUT Endpoint');
      
      // Log actual field names for verification
      console.log('\n  Actual field names in PUT response:');
      Object.keys(settings).forEach(field => {
        console.log(`    - ${field}`);
      });
      
      // Verify data was saved correctly (handle type conversions from database)
      let dataMatches = true;
      for (const [key, value] of Object.entries(TEST_COD_SETTINGS)) {
        const received = settings[key];
        let match = false;
        
        if (Array.isArray(value) && Array.isArray(received)) {
          // Compare arrays by sorting and stringifying
          match = JSON.stringify(value.sort()) === JSON.stringify(received.sort());
        } else if (typeof value === 'number' && typeof received === 'string') {
          // Handle database returning numbers as strings
          match = parseInt(received) === value;
        } else if (typeof value === 'boolean' && typeof received === 'boolean') {
          // Compare booleans directly
          match = received === value;
        } else {
          // Compare other values directly
          match = received === value;
        }
        
        if (!match) {
          dataMatches = false;
          console.log(`    ⚠️  Field mismatch: ${key} (sent: ${JSON.stringify(value)}, received: ${JSON.stringify(received)})`);
        }
      }
      
      if (dataMatches) {
        logTest('PUT Endpoint - Data saved correctly', true, 'All test data fields match');
      } else {
        logTest('PUT Endpoint - Data saved correctly', false, 'Some fields do not match');
      }
    } else {
      logTest('PUT Endpoint - Success response', false, `Status: ${putResponse.statusCode}, Response: ${JSON.stringify(putResponse.data)}`);
    }
  } catch (error) {
    logTest('PUT Endpoint - Success response', false, `Error: ${error.message}`);
  }

  // Step 4: Verify complete persistence flow (PUT → GET)
  console.log('\n\n[STEP 4] Verifying complete persistence flow (PUT → GET)...');
  try {
    const getResponse2 = await makeRequest({
      method: 'GET',
      path: '/admin/cod/settings',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (getResponse2.statusCode === 200 && getResponse2.data.success) {
      const settings = getResponse2.data.data;
      logTest('Persistence Flow - GET after PUT', true, `Status: ${getResponse2.statusCode}`);
      
      // Verify camelCase fields in persisted data
      verifyCamelCaseFields(settings, 'Persistence Flow');
      
      // Verify persisted data matches what was sent (handle type conversions from database)
      let dataMatches = true;
      for (const [key, value] of Object.entries(TEST_COD_SETTINGS)) {
        const received = settings[key];
        let match = false;
        
        if (Array.isArray(value) && Array.isArray(received)) {
          // Compare arrays by sorting and stringifying
          match = JSON.stringify(value.sort()) === JSON.stringify(received.sort());
        } else if (typeof value === 'number' && typeof received === 'string') {
          // Handle database returning numbers as strings
          match = parseInt(received) === value;
        } else if (typeof value === 'boolean' && typeof received === 'boolean') {
          // Compare booleans directly
          match = received === value;
        } else {
          // Compare other values directly
          match = received === value;
        }
        
        if (!match) {
          dataMatches = false;
          console.log(`    ⚠️  Field mismatch: ${key} (sent: ${JSON.stringify(value)}, received: ${JSON.stringify(received)})`);
        }
      }
      
      if (dataMatches) {
        logTest('Persistence Flow - Data matches saved values', true, 'All persisted fields match');
      } else {
        logTest('Persistence Flow - Data matches saved values', false, 'Some fields do not match');
      }
      
      // Compare GET responses before and after PUT
      if (getResponse1 && getResponse1.data && getResponse1.data.data) {
        const settingsBefore = getResponse1.data.data;
        const settingsAfter = settings;
        
        // Check if settings were actually updated
        let settingsChanged = false;
        for (const [key, value] of Object.entries(TEST_COD_SETTINGS)) {
          if (settingsBefore[key] !== settingsAfter[key]) {
            settingsChanged = true;
            break;
          }
        }
        
        if (settingsChanged) {
          logTest('Persistence Flow - Settings updated', true, 'Settings were successfully updated');
        } else {
          logTest('Persistence Flow - Settings updated', false, 'Settings were not updated (may have been same as before)');
        }
      }
    } else {
      logTest('Persistence Flow - GET after PUT', false, `Status: ${getResponse2.statusCode}, Response: ${JSON.stringify(getResponse2.data)}`);
    }
  } catch (error) {
    logTest('Persistence Flow - GET after PUT', false, `Error: ${error.message}`);
  }

  // Generate and display report
  return generateReport();
}

// Generate and save test report
function generateReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`);
  
  const overallStatus = testResults.summary.failed === 0 ? 'PASS' : 'FAIL';
  console.log(`\nOverall Status: ${overallStatus}`);
  console.log('='.repeat(80));
  
  // Save results to JSON file
  const timestamp = Date.now();
  const resultsFilename = `cod-final-comprehensive-verification-results-${timestamp}.json`;
  
  const fs = require('fs');
  fs.writeFileSync(resultsFilename, JSON.stringify(testResults, null, 2));
  console.log(`\n📊 Test results saved to: ${resultsFilename}`);
  
  // Generate markdown report
  const reportFilename = `cod-final-comprehensive-verification-report-${timestamp}.md`;
  let markdown = `# Final Comprehensive Verification Report - COD Settings Fixes\n\n`;
  markdown += `**Date:** ${new Date().toISOString()}\n`;
  markdown += `**Overall Status:** ${overallStatus}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${testResults.summary.total}\n`;
  markdown += `- **Passed:** ${testResults.summary.passed}\n`;
  markdown += `- **Failed:** ${testResults.summary.failed}\n`;
  markdown += `- **Success Rate:** ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%\n\n`;
  
  markdown += `## Critical Verification Points\n\n`;
  markdown += `### ✅ GET Endpoint Returns camelCase Fields\n`;
  markdown += `The GET endpoint should return all 16 COD settings fields in camelCase format.\n\n`;
  
  markdown += `### ✅ PUT Endpoint Returns camelCase Fields\n`;
  markdown += `The PUT endpoint should return all 16 COD settings fields in camelCase format after saving.\n\n`;
  
  markdown += `### ✅ Complete Persistence Flow Works\n`;
  markdown += `Settings saved via PUT should be retrievable via GET with correct camelCase formatting.\n\n`;
  
  markdown += `## Test Results\n\n`;
  markdown += `| Test | Status | Details |\n`;
  markdown += `|------|--------|---------|\n`;
  
  testResults.tests.forEach(test => {
    const statusIcon = test.status === 'PASS' ? '✅' : '❌';
    markdown += `| ${statusIcon} ${test.test} | ${test.status} | ${test.details || ''} |\n`;
  });
  
  markdown += `\n## Expected camelCase Fields\n\n`;
  markdown += `The following 16 fields should be in camelCase format:\n\n`;
  EXPECTED_CAMELCASE_FIELDS.forEach(field => {
    markdown += `- \`${field}\`\n`;
  });
  
  markdown += `\n## Conclusion\n\n`;
  if (overallStatus === 'PASS') {
    markdown += `✅ **All COD settings fixes are working correctly!**\n\n`;
    markdown += `Both GET and PUT endpoints now return data in camelCase format, and the complete persistence flow works as expected. After page refresh, saved settings will be displayed correctly in the browser.\n`;
  } else {
    markdown += `❌ **Some tests failed. Please review the test results above.**\n\n`;
    markdown += `The most common issue is that endpoints are still returning snake_case fields instead of camelCase.\n`;
  }
  
  fs.writeFileSync(reportFilename, markdown);
  console.log(`📄 Test report saved to: ${reportFilename}`);
  
  console.log('\n' + '='.repeat(80));
  
  return testResults;
}

// Run the tests
runTests()
  .then(results => {
    const exitCode = results.summary.failed === 0 ? 0 : 1;
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });
