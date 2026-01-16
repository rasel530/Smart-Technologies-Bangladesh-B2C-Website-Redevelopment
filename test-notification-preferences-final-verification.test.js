/**
 * Final Verification Test for Notification Preferences Endpoint
 * 
 * This test verifies that all fixes have been applied successfully and the
 * PUT /api/v1/profile/preferences/notifications endpoint is working correctly.
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3001';
const ENDPOINT = '/api/v1/profile/preferences/notifications';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkY2JmMTgwMC03Njk1LTQzY2ItYjE1OC1iNDVmYzhhNDkzOWIiLCJlbWFpbCI6InJhc2VsYmVwYXJpODhAZ21haWwuY29tIiwicGhvbmUiOiIrODgwMTkxNDI4NzUzMCIsInJvbGUiOiJjdXN0b21lciIsInNlc3Npb25JZCI6ImI5Mjg4OTRjZjViNzFkYzUyNzhkMDIxNzliNGI2M2QyMjczODBkNjlkNjIxMWZjMmVhZGJkYzZjOGFmMTgxNjkiLCJpYXQiOjE3Njg1Nzg1OTQsImV4cCI6MTc2OTE4MzM5NCwiYXVkIjoic21hcnQtZWNvbW1lcmNlLWNsaWVudHMiLCJpc3MiOiJzbWFydC1lY29tbWVyY2UtYXBpIn0.N2DSXR1P9Mb4kwVfRl3A1V4bvmuYkrzZabC_gfDsxGk';

// Test data
const TEST_PREFERENCES = {
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: true,
  promotionalEmails: true,
  newsletterSubscription: false,
  notificationFrequency: 'daily'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
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

async function runTests() {
  log('\n' + '='.repeat(80), colors.cyan);
  log('FINAL VERIFICATION TEST: Notification Preferences Endpoint', colors.cyan);
  log('='.repeat(80) + '\n', colors.cyan);

  let allTestsPassed = true;

  // Test 1: PUT Request to update notification preferences
  log('TEST 1: PUT Request - Update Notification Preferences', colors.blue);
  log('-'.repeat(80), colors.blue);
  
  try {
    log(`Sending PUT request to ${ENDPOINT}`, colors.yellow);
    log(`Request body: ${JSON.stringify(TEST_PREFERENCES, null, 2)}`, colors.yellow);
    
    const putResponse = await makeRequest('PUT', ENDPOINT, TEST_PREFERENCES);
    
    log(`\nResponse Status Code: ${putResponse.statusCode}`, 
      putResponse.statusCode >= 200 && putResponse.statusCode < 300 ? colors.green : colors.red);
    log(`Response Body: ${JSON.stringify(putResponse.body, null, 2)}`, colors.yellow);
    
    if (putResponse.statusCode === 500) {
      log('\n❌ FAILED: 500 error still present!', colors.red);
      allTestsPassed = false;
    } else if (putResponse.statusCode >= 200 && putResponse.statusCode < 300) {
      log('\n✓ PASSED: Request succeeded (status code: ' + putResponse.statusCode + ')', colors.green);
      
      // Check if promotionalEmails field is present
      if (putResponse.body && putResponse.body.promotionalEmails !== undefined) {
        log(`✓ PASSED: promotionalEmails field present with value: ${putResponse.body.promotionalEmails}`, colors.green);
      } else {
        log('❌ FAILED: promotionalEmails field missing from response', colors.red);
        allTestsPassed = false;
      }
    } else {
      log(`\n⚠ WARNING: Unexpected status code: ${putResponse.statusCode}`, colors.yellow);
      allTestsPassed = false;
    }
  } catch (error) {
    log(`\n❌ FAILED: Request error - ${error.message}`, colors.red);
    allTestsPassed = false;
  }

  // Test 2: GET Request to verify data persistence
  log('\n\n' + '='.repeat(80), colors.cyan);
  log('TEST 2: GET Request - Verify Data Persistence', colors.blue);
  log('-'.repeat(80), colors.blue);
  
  try {
    log(`Sending GET request to ${ENDPOINT}`, colors.yellow);
    
    const getResponse = await makeRequest('GET', ENDPOINT);
    
    log(`\nResponse Status Code: ${getResponse.statusCode}`, 
      getResponse.statusCode >= 200 && getResponse.statusCode < 300 ? colors.green : colors.red);
    log(`Response Body: ${JSON.stringify(getResponse.body, null, 2)}`, colors.yellow);
    
    if (getResponse.statusCode >= 200 && getResponse.statusCode < 300) {
      log('\n✓ PASSED: GET request succeeded', colors.green);
      
      // Verify all fields match
      let allFieldsMatch = true;
      const fieldsToCheck = [
        'emailNotifications',
        'smsNotifications',
        'whatsappNotifications',
        'promotionalEmails',
        'newsletterSubscription',
        'notificationFrequency'
      ];
      
      log('\nVerifying field values match...', colors.yellow);
      fieldsToCheck.forEach(field => {
        const expected = TEST_PREFERENCES[field];
        const actual = getResponse.body[field];
        const match = expected === actual;
        
        log(`${match ? '✓' : '❌'} ${field}: expected=${expected}, actual=${actual}`, 
          match ? colors.green : colors.red);
        
        if (!match) {
          allFieldsMatch = false;
        }
      });
      
      if (allFieldsMatch) {
        log('\n✓ PASSED: All fields match the data sent in PUT request', colors.green);
      } else {
        log('\n❌ FAILED: Some fields do not match', colors.red);
        allTestsPassed = false;
      }
      
      // Specifically check promotionalEmails field
      if (getResponse.body.promotionalEmails !== undefined) {
        log(`\n✓ PASSED: promotionalEmails field is present with value: ${getResponse.body.promotionalEmails}`, colors.green);
      } else {
        log('\n❌ FAILED: promotionalEmails field is missing from GET response', colors.red);
        allTestsPassed = false;
      }
    } else {
      log(`\n❌ FAILED: GET request failed with status code: ${getResponse.statusCode}`, colors.red);
      allTestsPassed = false;
    }
  } catch (error) {
    log(`\n❌ FAILED: Request error - ${error.message}`, colors.red);
    allTestsPassed = false;
  }

  // Final Summary
  log('\n\n' + '='.repeat(80), colors.cyan);
  log('FINAL TEST SUMMARY', colors.cyan);
  log('='.repeat(80), colors.cyan);
  
  if (allTestsPassed) {
    log('\n✓✓✓ ALL TESTS PASSED ✓✓✓', colors.green);
    log('\nThe 500 error has been successfully resolved!', colors.green);
    log('The PUT endpoint is working correctly.', colors.green);
    log('Data is being persisted correctly.', colors.green);
    log('The promotionalEmails field is present and working as expected.', colors.green);
  } else {
    log('\n❌❌❌ SOME TESTS FAILED ❌❌❌', colors.red);
    log('\nPlease review the test results above for details.', colors.red);
  }
  
  log('\n' + '='.repeat(80) + '\n', colors.cyan);
  
  return allTestsPassed;
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`\nFatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  });
