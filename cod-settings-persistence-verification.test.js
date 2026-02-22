/**
 * COD Settings Persistence Verification Test
 * 
 * This script verifies that the COD settings endpoints are working correctly
 * and that settings persist to the database after being saved.
 * 
 * Test Scope:
 * 1. Login to get authentication token
 * 2. GET endpoint - fetch COD settings
 * 3. PUT endpoint - save COD settings
 * 4. Persistence verification - confirm settings are saved and retrieved
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_ENDPOINT = '/api/v1/admin/cod/settings';
const LOGIN_ENDPOINT = '/api/v1/auth/login';
const ADMIN_CREDENTIALS = {
  identifier: 'admin@smarttech.com',
  password: 'AdminPassword123'
};

// Test data
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
  availableDivisions: ['dhaka', 'chittagong'],
  unavailableDivisions: [],
  notes: 'Test settings for persistence verification'
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  overallStatus: 'PENDING',
  authToken: null
};

/**
 * Make an HTTP request
 */
function makeRequest(method, path, data = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add authorization header if token is provided
    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (error) {
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

/**
 * Record test result
 */
function recordTestResult(testName, status, details, error = null) {
  const result = {
    testName,
    status, // 'PASS', 'FAIL', 'ERROR'
    details,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  testResults.tests.push(result);
  console.log(`[${status}] ${testName}`);
  if (error) {
    console.log(`  Error: ${error.message}`);
  }
  console.log(`  Details: ${details}`);
  console.log('');
}

/**
 * Login to get authentication token
 */
async function login() {
  console.log('='.repeat(60));
  console.log('AUTHENTICATION: Login as Admin');
  console.log('='.repeat(60));
  
  try {
    const response = await makeRequest('POST', LOGIN_ENDPOINT, ADMIN_CREDENTIALS);
    
    if (response.statusCode === 200 && response.body && response.body.token) {
      testResults.authToken = response.body.token;
      recordTestResult(
        'Admin Authentication',
        'PASS',
        `Successfully authenticated. Token received (first 20 chars: ${response.body.token.substring(0, 20)}...)`,
        null
      );
      return response.body.token;
    } else {
      recordTestResult(
        'Admin Authentication',
        'FAIL',
        `Login failed. Status: ${response.statusCode}, Body: ${JSON.stringify(response.body)}`,
        null
      );
      return null;
    }
  } catch (error) {
    recordTestResult(
      'Admin Authentication',
      'ERROR',
      'Login request failed',
      error
    );
    return null;
  }
}

/**
 * Test 1: GET endpoint - Fetch COD settings
 */
async function testGetEndpoint(authToken) {
  console.log('='.repeat(60));
  console.log('TEST 1: GET Endpoint - Fetch COD Settings');
  console.log('='.repeat(60));
  
  try {
    const response = await makeRequest('GET', API_ENDPOINT, null, authToken);
    
    if (response.statusCode === 200) {
      recordTestResult(
        'GET /api/v1/admin/cod/settings',
        'PASS',
        `Successfully retrieved COD settings. Status: ${response.statusCode}`,
        null
      );
      return response.body;
    } else {
      recordTestResult(
        'GET /api/v1/admin/cod/settings',
        'FAIL',
        `Unexpected status code: ${response.statusCode}, Body: ${JSON.stringify(response.body)}`,
        null
      );
      return null;
    }
  } catch (error) {
    recordTestResult(
      'GET /api/v1/admin/cod/settings',
      'ERROR',
      'Request failed',
      error
    );
    return null;
  }
}

/**
 * Test 2: PUT endpoint - Save COD settings
 */
async function testPutEndpoint(authToken) {
  console.log('='.repeat(60));
  console.log('TEST 2: PUT Endpoint - Save COD Settings');
  console.log('='.repeat(60));
  
  try {
    const response = await makeRequest('PUT', API_ENDPOINT, TEST_SETTINGS, authToken);
    
    if (response.statusCode === 200) {
      recordTestResult(
        'PUT /api/v1/admin/cod/settings',
        'PASS',
        `Successfully saved COD settings. Status: ${response.statusCode}`,
        null
      );
      return response.body;
    } else {
      recordTestResult(
        'PUT /api/v1/admin/cod/settings',
        'FAIL',
        `Unexpected status code: ${response.statusCode}, Body: ${JSON.stringify(response.body)}`,
        null
      );
      return null;
    }
  } catch (error) {
    recordTestResult(
      'PUT /api/v1/admin/cod/settings',
      'ERROR',
      'Request failed',
      error
    );
    return null;
  }
}

/**
 * Test 3: Verify persistence
 */
async function testPersistence(authToken) {
  console.log('='.repeat(60));
  console.log('TEST 3: Verify Persistence - Fetch Saved Settings');
  console.log('='.repeat(60));
  
  try {
    const response = await makeRequest('GET', API_ENDPOINT, null, authToken);
    
    if (response.statusCode !== 200) {
      recordTestResult(
        'Persistence Verification - GET after PUT',
        'FAIL',
        `Failed to retrieve settings after save. Status: ${response.statusCode}, Body: ${JSON.stringify(response.body)}`,
        null
      );
      return false;
    }
    
    const retrievedSettings = response.body.data || response.body;
    
    // Handle both camelCase and snake_case property names
    // The database stores in snake_case, but API may return in either format
    const normalizeSettings = (settings) => {
      if (!settings) return {};
      
      // Convert snake_case to camelCase if needed
      const normalized = {};
      for (const key in settings) {
        if (key.includes('_')) {
          // Convert snake_case to camelCase
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          normalized[camelKey] = settings[key];
        } else {
          normalized[key] = settings[key];
        }
      }
      return normalized;
    };
    
    const normalizedRetrievedSettings = normalizeSettings(retrievedSettings);
    
    // Log the retrieved settings for debugging
    console.log('[DEBUG] Retrieved settings from GET endpoint:', JSON.stringify(retrievedSettings, null, 2));
    console.log('[DEBUG] Normalized settings:', JSON.stringify(normalizedRetrievedSettings, null, 2));
    console.log('[DEBUG] Expected settings:', JSON.stringify(TEST_SETTINGS, null, 2));
    
    // Compare key fields
    const fieldsToCheck = [
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
      'notes'
    ];
    
    let allMatch = true;
    const mismatches = [];
    
    for (const field of fieldsToCheck) {
      const retrievedValue = normalizedRetrievedSettings[field];
      const expectedValue = TEST_SETTINGS[field];
      
      // Convert string numbers to numbers for comparison
      const normalizedRetrievedValue = typeof retrievedValue === 'string' && !isNaN(retrievedValue)
        ? parseFloat(retrievedValue)
        : retrievedValue;
      
      if (normalizedRetrievedValue !== expectedValue) {
        allMatch = false;
        mismatches.push({
          field,
          expected: expectedValue,
          actual: normalizedRetrievedValue,
          rawValue: retrievedValue
        });
      }
    }
    
    // Check arrays
    const retrievedAvailable = normalizedRetrievedSettings.availableDivisions || retrievedSettings.available_divisions;
    const retrievedUnavailable = normalizedRetrievedSettings.unavailableDivisions || retrievedSettings.unavailable_divisions;
    
    if (JSON.stringify(retrievedAvailable) !== JSON.stringify(TEST_SETTINGS.availableDivisions)) {
      allMatch = false;
      mismatches.push({
        field: 'availableDivisions',
        expected: TEST_SETTINGS.availableDivisions,
        actual: retrievedAvailable
      });
    }
    
    if (JSON.stringify(retrievedUnavailable) !== JSON.stringify(TEST_SETTINGS.unavailableDivisions)) {
      allMatch = false;
      mismatches.push({
        field: 'unavailableDivisions',
        expected: TEST_SETTINGS.unavailableDivisions,
        actual: retrievedUnavailable
      });
    }
    
    if (allMatch) {
      recordTestResult(
        'Persistence Verification - GET after PUT',
        'PASS',
        'All settings match. Data persisted correctly to database.',
        null
      );
      return true;
    } else {
      recordTestResult(
        'Persistence Verification - GET after PUT',
        'FAIL',
        `Settings mismatch detected. ${mismatches.length} field(s) do not match.`,
        null
      );
      console.log('Mismatches:', JSON.stringify(mismatches, null, 2));
      return false;
    }
  } catch (error) {
    recordTestResult(
      'Persistence Verification - GET after PUT',
      'ERROR',
      'Request failed',
      error
    );
    return false;
  }
}

/**
 * Generate and display test report
 */
function generateTestReport() {
  console.log('');
  console.log('='.repeat(80));
  console.log('COD SETTINGS PERSISTENCE VERIFICATION TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Test Run: ${testResults.timestamp}`);
  console.log('');
  
  // Calculate statistics
  const totalTests = testResults.tests.length;
  const passedTests = testResults.tests.filter(t => t.status === 'PASS').length;
  const failedTests = testResults.tests.filter(t => t.status === 'FAIL').length;
  const errorTests = testResults.tests.filter(t => t.status === 'ERROR').length;
  
  // Determine overall status
  if (errorTests > 0) {
    testResults.overallStatus = 'ERROR';
  } else if (failedTests > 0) {
    testResults.overallStatus = 'FAIL';
  } else {
    testResults.overallStatus = 'PASS';
  }
  
  // Display summary
  console.log('SUMMARY:');
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Errors: ${errorTests}`);
  console.log(`  Overall Status: ${testResults.overallStatus}`);
  console.log('');
  
  // Display detailed results
  console.log('DETAILED RESULTS:');
  console.log('-'.repeat(80));
  testResults.tests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.testName}`);
    console.log(`   Status: ${test.status}`);
    console.log(`   Details: ${test.details}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
    console.log(`   Time: ${test.timestamp}`);
  });
  
  console.log('');
  console.log('='.repeat(80));
  
  // Save results to file
  const filename = `cod-settings-persistence-verification-results-${Date.now()}.json`;
  require('fs').writeFileSync(filename, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${filename}`);
  console.log('');
  
  return testResults.overallStatus;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         COD SETTINGS PERSISTENCE VERIFICATION TEST SUITE                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Configuration:');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  API Endpoint: ${API_ENDPOINT}`);
  console.log(`  Login Endpoint: ${LOGIN_ENDPOINT}`);
  console.log(`  Admin Email: ${ADMIN_CREDENTIALS.email}`);
  console.log('');
  
  // Step 0: Login to get auth token
  const authToken = await login();
  
  if (!authToken) {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.');
    generateTestReport();
    process.exit(1);
  }
  
  // Wait a moment between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 1: GET endpoint
  const initialSettings = await testGetEndpoint(authToken);
  
  // Wait a moment between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: PUT endpoint
  const savedSettings = await testPutEndpoint(authToken);
  
  // Wait a moment between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Verify persistence
  const persistenceVerified = await testPersistence(authToken);
  
  // Generate report
  const overallStatus = generateTestReport();
  
  console.log(`\n╔══════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║  VERIFICATION COMPLETE: ${overallStatus.padStart(40)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  process.exit(overallStatus === 'PASS' ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
