/**
 * RBAC Endpoint Testing Script
 * 
 * This script tests all RBAC endpoints to verify they work correctly
 * with the new consistent response format.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'localhost';
const PORT = 3001;
const API_BASE = `/api/v1/rbac`;

// Test results storage
const testResults = [];

// Helper function to log with timestamp and color
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// Helper function to make HTTP request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Helper function to verify response format
function verifyResponseFormat(response, endpointName) {
  const errors = [];
  
  // Check if body exists
  if (!response.body) {
    errors.push('Response body is null or undefined');
    return { isValid: false, errors };
  }
  
  // Check for success property
  if (typeof response.body.success !== 'boolean') {
    errors.push('Missing or invalid "success" property (should be boolean)');
  }
  
  // Check for message property
  if (typeof response.body.message !== 'string') {
    errors.push('Missing or invalid "message" property (should be string)');
  }
  
  // Check for data property (should exist, can be null or array)
  if (!('data' in response.body)) {
    errors.push('Missing "data" property');
  }
  
  // Check for count property when data is an array
  if (Array.isArray(response.body.data) && typeof response.body.count !== 'number') {
    errors.push('Missing or invalid "count" property when data is an array');
  }
  
  // Verify count matches array length
  if (Array.isArray(response.body.data) && typeof response.body.count === 'number') {
    if (response.body.count !== response.body.data.length) {
      errors.push(`Count mismatch: count=${response.body.count} but data.length=${response.body.data.length}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Test function for each endpoint
async function testEndpoint(endpointName, path, method = 'GET', data = null, authToken = null) {
  log(`Testing: ${method} ${path}`, 'info');
  
  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await makeRequest(options, data);
    
    // Debug: Log actual response body
    log(`  DEBUG: Response status: ${response.statusCode}`, 'info');
    if (response.body) {
      log(`  DEBUG: Response body type: ${typeof response.body}`, 'info');
      log(`  DEBUG: Response body keys: ${Object.keys(response.body).join(', ')}`, 'info');
      if (response.body.message) {
        log(`  DEBUG: Message value: ${response.body.message}`, 'info');
      }
      if (response.body.data) {
        log(`  DEBUG: Data type: ${typeof response.body.data}`, 'info');
        if (Array.isArray(response.body.data)) {
          log(`  DEBUG: Data is array with ${response.body.data.length} items`, 'info');
        }
      }
    }
    
    // Verify response format
    const formatCheck = verifyResponseFormat(response, endpointName);
    
    const result = {
      endpoint: endpointName,
      path: path,
      method: method,
      statusCode: response.statusCode,
      success: response.body?.success,
      message: response.body?.message,
      dataCount: Array.isArray(response.body?.data) ? response.body.data.length : 'N/A',
      formatValid: formatCheck.isValid,
      formatErrors: formatCheck.errors,
      passed: response.statusCode >= 200 && response.statusCode < 300 && formatCheck.isValid
    };
    
    if (result.passed) {
      log(`  ✓ PASSED - Status: ${response.statusCode}, Count: ${result.dataCount}`, 'success');
      if (response.body?.message) {
        log(`    Message: ${response.body.message}`, 'info');
      }
    } else {
      log(`  ✗ FAILED - Status: ${response.statusCode}`, 'error');
      if (formatCheck.errors.length > 0) {
        formatCheck.errors.forEach(err => {
          log(`    Format Error: ${err}`, 'error');
        });
      }
      if (response.body?.message) {
        log(`    API Message: ${response.body.message}`, 'warning');
      }
    }
    
    testResults.push(result);
    return result;
    
  } catch (error) {
    log(`  ✗ FAILED - Error: ${error.message}`, 'error');
    
    const result = {
      endpoint: endpointName,
      path: path,
      method: method,
      statusCode: 'ERROR',
      success: false,
      message: error.message,
      dataCount: 'N/A',
      formatValid: false,
      formatErrors: [error.message],
      passed: false
    };
    
    testResults.push(result);
    return result;
  }
}

// Helper function to get admin token
async function getAdminToken() {
  log('Attempting to get admin token...', 'info');
  
  const loginData = {
    identifier: 'test.admin@smarttech.com',
    password: 'TestAdmin123!'
  };
  
  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 200 && response.body && response.body.token) {
      log('✓ Admin token obtained successfully', 'success');
      return response.body.token;
    } else {
      log('✗ Failed to get admin token', 'error');
      log(`  Response: ${JSON.stringify(response.body)}`, 'warning');
      return null;
    }
  } catch (error) {
    log(`✗ Error getting admin token: ${error.message}`, 'error');
    return null;
  }
}

// Helper function to get a test user ID
async function getTestUserId() {
  const options = {
    hostname: BASE_URL,
    port: PORT,
    path: '/api/v1/users?page=1&limit=1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body && response.body.data && response.body.data.length > 0) {
      return response.body.data[0].id;
    }
    return null;
  } catch (error) {
    log(`Error getting test user ID: ${error.message}`, 'error');
    return null;
  }
}

// Main test function
async function runRBACTests() {
  log('========================================', 'info');
  log('RBAC ENDPOINT TESTING', 'info');
  log('========================================', 'info');
  log('', 'info');
  
  // Get admin token
  const adminToken = await getAdminToken();
  log('', 'info');
  
  // Get a test user ID
  const testUserId = await getTestUserId();
  if (testUserId) {
    log(`Using test user ID: ${testUserId}`, 'info');
  } else {
    log('No test user ID found, some tests may be skipped', 'warning');
  }
  log('', 'info');
  
  // Test 1: GET /api/v1/rbac/roles
  log('--- Test 1: Get Roles ---', 'info');
  await testEndpoint(
    'GET /api/v1/rbac/roles',
    `${API_BASE}/roles`,
    'GET',
    null,
    adminToken
  );
  log('', 'info');
  
  // Test 2: GET /api/v1/rbac/permissions
  log('--- Test 2: Get Permissions ---', 'info');
  await testEndpoint(
    'GET /api/v1/rbac/permissions',
    `${API_BASE}/permissions`,
    'GET',
    null,
    adminToken
  );
  log('', 'info');
  
  // Test 3: GET /api/v1/rbac/permissions/resources
  log('--- Test 3: Get Permission Resources ---', 'info');
  await testEndpoint(
    'GET /api/v1/rbac/permissions/resources',
    `${API_BASE}/permissions/resources`,
    'GET',
    null,
    adminToken
  );
  log('', 'info');
  
  // Test 4: GET /api/v1/rbac/role-escalation-requests
  log('--- Test 4: Get Role Escalation Requests ---', 'info');
  await testEndpoint(
    'GET /api/v1/rbac/role-escalation-requests',
    `${API_BASE}/role-escalation-requests`,
    'GET',
    null,
    adminToken
  );
  log('', 'info');
  
  // Test 5: GET /api/v1/rbac/users/:userId/roles
  if (testUserId) {
    log('--- Test 5: Get User Roles ---', 'info');
    await testEndpoint(
      `GET /api/v1/rbac/users/${testUserId}/roles`,
      `${API_BASE}/users/${testUserId}/roles`,
      'GET',
      null,
      adminToken
    );
    log('', 'info');
  } else {
    log('--- Test 5: Get User Roles ---', 'info');
    log('  SKIPPED - No test user ID available', 'warning');
    log('', 'info');
  }
  
  // Test 6: GET /api/v1/rbac/permissions/check (with auth)
  if (adminToken) {
    log('--- Test 6: Check User Permissions ---', 'info');
    await testEndpoint(
      'GET /api/v1/rbac/permissions/check',
      `${API_BASE}/permissions/check?resource=user&action=read`,
      'GET',
      null,
      adminToken
    );
    log('', 'info');
  }
  
  // Test 7: GET /api/v1/rbac/roles/hierarchy
  log('--- Test 7: Get Role Hierarchy ---', 'info');
  await testEndpoint(
    'GET /api/v1/rbac/roles/hierarchy',
    `${API_BASE}/roles/hierarchy`,
    'GET',
    null,
    adminToken
  );
  log('', 'info');
  
  // Generate summary
  log('========================================', 'info');
  log('TEST SUMMARY', 'info');
  log('========================================', 'info');
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Tests: ${totalTests}`, 'info');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'success' : 'info');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'info');
  log('', 'info');
  
  if (failedTests > 0) {
    log('Failed Tests:', 'error');
    testResults.filter(r => !r.passed).forEach(result => {
      log(`  ✗ ${result.endpoint}`, 'error');
      if (result.formatErrors.length > 0) {
        result.formatErrors.forEach(err => {
          log(`    - ${err}`, 'error');
        });
      }
    });
    log('', 'info');
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'rbac-endpoint-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${((passedTests / totalTests) * 100).toFixed(2)}%`
    },
    tests: testResults
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Detailed report saved to: ${reportPath}`, 'info');
  
  // Final verdict
  log('', 'info');
  if (failedTests === 0) {
    log('✓ ALL TESTS PASSED - RBAC endpoints are working correctly!', 'success');
    return true;
  } else {
    log('✗ SOME TESTS FAILED - RBAC endpoints need attention', 'error');
    return false;
  }
}

// Run tests
runRBACTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    log(error.stack, 'error');
    process.exit(1);
  });
