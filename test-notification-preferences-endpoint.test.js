/**
 * Test Script: Notification Preferences Endpoint Verification
 * 
 * This script verifies that the PUT /api/v1/profile/preferences/notifications
 * endpoint has been fixed and no longer returns a 500 Internal Server Error.
 */

const API_BASE_URL = 'http://localhost:3001/api/v1';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkY2JmMTgwMC03Njk1LTQzY2ItYjE1OC1iNDVmYzhhNDkzOWIiLCJlbWFpbCI6InJhc2VsYmVwYXJpODhAZ21haWwuY29tIiwicGhvbmUiOiIrODgwMTkxNDI4NzUzMCIsInJvbGUiOiJjdXN0b21lciIsInNlc3Npb25JZCI6ImI5Mjg4OTRjZjViNzFkYzUyNzhkMDIxNzliNGI2M2QyMjczODBkNjlkNjIxMWZjMmVhZGJkYzZjOGFmMTgxNjkiLCJpYXQiOjE3Njg1Nzg1OTQsImV4cCI6MTc2OTE4MzM5NCwiYXVkIjoic21hcnQtZWNvbW1lcmNlLWNsaWVudHMiLCJpc3MiOiJzbWFydC1lY29tbWVyY2UtYXBpIn0.N2DSXR1P9Mb4kwVfRl3A1V4bvmuYkrzZabC_gfDsxGk';

const testPreferences = {
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: true,
  promotionalEmails: true,
  newsletterSubscription: false,
  notificationFrequency: "daily"
};

// ANSI color codes for console output
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

async function testPutEndpoint() {
  logSection('TEST 1: PUT /api/v1/profile/preferences/notifications');
  
  const url = `${API_BASE_URL}/profile/preferences/notifications`;
  
  log(`Request URL: ${url}`, colors.blue);
  log(`Request Body:`, colors.blue);
  console.log(JSON.stringify(testPreferences, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      body: JSON.stringify(testPreferences)
    });
    
    const status = response.status;
    const statusText = response.statusText;
    const responseData = await response.json().catch(() => null);
    
    log(`Response Status: ${status} ${statusText}`, status === 200 || status === 201 ? colors.green : colors.red);
    log(`Response Body:`, colors.blue);
    console.log(JSON.stringify(responseData, null, 2));
    
    // Verify the response
    if (status === 500) {
      log('❌ FAILED: Endpoint still returns 500 Internal Server Error', colors.red);
      return { success: false, status, statusText, data: responseData };
    } else if (status === 200 || status === 201) {
      log('✅ PASSED: Endpoint returned success status', colors.green);
      
      // Verify response contains updated preferences
      if (responseData && responseData.data) {
        const preferences = responseData.data;
        const allFieldsMatch = Object.keys(testPreferences).every(key => {
          return preferences[key] === testPreferences[key];
        });
        
        if (allFieldsMatch) {
          log('✅ PASSED: Response contains all expected preferences with correct values', colors.green);
        } else {
          log('⚠️  WARNING: Response preferences do not match request', colors.yellow);
          log('Expected:', colors.yellow);
          console.log(JSON.stringify(testPreferences, null, 2));
          log('Received:', colors.yellow);
          console.log(JSON.stringify(preferences, null, 2));
        }
      } else {
        log('⚠️  WARNING: Response does not contain expected data structure', colors.yellow);
      }
      
      return { success: true, status, statusText, data: responseData };
    } else {
      log(`⚠️  WARNING: Unexpected status code ${status}`, colors.yellow);
      return { success: false, status, statusText, data: responseData };
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, colors.red);
    return { success: false, error: error.message };
  }
}

async function testGetEndpoint() {
  logSection('TEST 2: GET /api/v1/profile/preferences/notifications (Verification)');
  
  const url = `${API_BASE_URL}/profile/preferences/notifications`;
  
  log(`Request URL: ${url}`, colors.blue);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    });
    
    const status = response.status;
    const statusText = response.statusText;
    const responseData = await response.json().catch(() => null);
    
    log(`Response Status: ${status} ${statusText}`, status === 200 ? colors.green : colors.red);
    log(`Response Body:`, colors.blue);
    console.log(JSON.stringify(responseData, null, 2));
    
    if (status === 200 && responseData && responseData.data) {
      const preferences = responseData.data;
      
      // Verify that the preferences match what we sent
      const allFieldsMatch = Object.keys(testPreferences).every(key => {
        return preferences[key] === testPreferences[key];
      });
      
      if (allFieldsMatch) {
        log('✅ PASSED: Data persistence verified - preferences match exactly', colors.green);
        return { success: true, status, statusText, data: responseData, persisted: true };
      } else {
        log('⚠️  WARNING: Persisted preferences do not match sent data', colors.yellow);
        log('Expected:', colors.yellow);
        console.log(JSON.stringify(testPreferences, null, 2));
        log('Persisted:', colors.yellow);
        console.log(JSON.stringify(preferences, null, 2));
        return { success: true, status, statusText, data: responseData, persisted: false };
      }
    } else {
      log('⚠️  WARNING: Could not verify data persistence', colors.yellow);
      return { success: false, status, statusText, data: responseData, persisted: false };
    }
  } catch (error) {
    log(`❌ ERROR: ${error.message}`, colors.red);
    return { success: false, error: error.message, persisted: false };
  }
}

async function main() {
  logSection('NOTIFICATION PREFERENCES ENDPOINT VERIFICATION TEST');
  log('Testing: PUT /api/v1/profile/preferences/notifications', colors.cyan);
  log('Expected: No 500 Internal Server Error', colors.cyan);
  log('Date: ' + new Date().toISOString(), colors.cyan);
  
  // Test 1: PUT endpoint
  const putResult = await testPutEndpoint();
  
  // Test 2: GET endpoint (verification)
  const getResult = await testGetEndpoint();
  
  // Final Summary
  logSection('TEST SUMMARY');
  
  if (putResult.success && putResult.status !== 500) {
    log('✅ SUCCESS: The 500 Internal Server Error has been RESOLVED', colors.green);
    log(`   PUT Response Status: ${putResult.status} ${putResult.statusText}`, colors.green);
    
    if (getResult.persisted) {
      log('✅ SUCCESS: Data was correctly persisted to the database', colors.green);
    } else if (getResult.success) {
      log('⚠️  WARNING: Data persistence could not be fully verified', colors.yellow);
    }
  } else {
    log('❌ FAILED: The 500 Internal Server Error still exists', colors.red);
    if (putResult.status) {
      log(`   PUT Response Status: ${putResult.status} ${putResult.statusText}`, colors.red);
    }
    if (putResult.error) {
      log(`   Error: ${putResult.error}`, colors.red);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Run the tests
main().catch(error => {
  log(`Fatal Error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
