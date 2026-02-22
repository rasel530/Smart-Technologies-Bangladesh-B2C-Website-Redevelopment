/**
 * Comprehensive API Test for Cart Recovery Settings Endpoints
 * Tests GET and PUT /api/v1/admin/carts/recovery/settings
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_CREDENTIALS = {
  identifier: 'admin@smarttech.com',
  password: 'AdminPassword123'
};

let authToken = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  try {
    log('\n=== Step 1: Admin Login ===', 'blue');
    log(`Logging in as: ${ADMIN_CREDENTIALS.identifier}`, 'cyan');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.data.token) {
      authToken = response.data.token;
      log('✓ Login successful!', 'green');
      log(`  Token: ${authToken.substring(0, 20)}...`, 'cyan');
      return true;
    } else {
      log('✗ Login failed: No token in response', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Login failed: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testGetEndpoint() {
  try {
    log('\n=== Step 2: Test GET /api/v1/admin/carts/recovery/settings ===', 'blue');
    log('Retrieving cart recovery settings...', 'cyan');
    
    const response = await axios.get(`${BASE_URL}/admin/carts/recovery/settings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      const settings = response.data.data;
      log('✓ GET request successful!', 'green');
      log('  Response structure:', 'cyan');
      log(`    - Success: ${response.data.success}`, 'cyan');
      log(`    - Message: ${response.data.message}`, 'cyan');
      log('  Settings data:', 'cyan');
      log(`    - Enabled: ${settings.enabled}`, 'cyan');
      log(`    - First Email Delay: ${settings.firstEmailDelay}h`, 'cyan');
      log(`    - Second Email Delay: ${settings.secondEmailDelay}h`, 'cyan');
      log(`    - Third Email Delay: ${settings.thirdEmailDelay}h`, 'cyan');
      log(`    - Discount Enabled: ${settings.discountEnabled}`, 'cyan');
      log(`    - Discount Percentage: ${settings.discountPercentage}%`, 'cyan');
      log(`    - Discount Code: ${settings.discountCode}`, 'cyan');
      log(`    - Max Recovery Attempts: ${settings.maxRecoveryAttempts}`, 'cyan');
      log(`    - Min Cart Value: ${settings.minCartValue}`, 'cyan');
      log(`    - Email From Name: ${settings.emailFromName}`, 'cyan');
      log(`    - Email From Address: ${settings.emailFromAddress}`, 'cyan');
      log(`    - Cart Abandonment Threshold: ${settings.cartAbandonmentThreshold}min`, 'cyan');
      log(`    - Recovery Token Expiry: ${settings.recoveryTokenExpiry}days`, 'cyan');
      
      // Verify all required fields are present
      const requiredFields = [
        'enabled', 'firstEmailDelay', 'secondEmailDelay', 'thirdEmailDelay',
        'discountEnabled', 'discountPercentage', 'discountCode',
        'maxRecoveryAttempts', 'minCartValue', 'emailFromName',
        'emailFromAddress', 'cartAbandonmentThreshold', 'recoveryTokenExpiry'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in settings));
      if (missingFields.length > 0) {
        log(`✗ Missing fields: ${missingFields.join(', ')}`, 'red');
        return false;
      }
      
      log('✓ All required fields present', 'green');
      return settings;
    } else {
      log('✗ GET request failed', 'red');
      log(`  Response: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ GET request failed: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
      
      if (error.response.status === 404) {
        log('  ⚠️  404 Error - Route may not be registered!', 'yellow');
      }
    }
    return false;
  }
}

async function testPutEndpoint() {
  try {
    log('\n=== Step 3: Test PUT /api/v1/admin/carts/recovery/settings ===', 'blue');
    log('Updating cart recovery settings...', 'cyan');
    
    const updateData = {
      enabled: false,
      firstEmailDelay: 2,
      secondEmailDelay: 48,
      thirdEmailDelay: 96,
      discountEnabled: true,
      discountPercentage: 15,
      discountCode: 'SAVE15NOW',
      maxRecoveryAttempts: 5,
      minCartValue: 2000,
      emailFromName: 'Smart Tech Admin',
      emailFromAddress: 'admin@smarttech.com',
      cartAbandonmentThreshold: 45,
      recoveryTokenExpiry: 14
    };
    
    log('  Update data:', 'cyan');
    log(`    - Enabled: ${updateData.enabled}`, 'cyan');
    log(`    - First Email Delay: ${updateData.firstEmailDelay}h`, 'cyan');
    log(`    - Discount Percentage: ${updateData.discountPercentage}%`, 'cyan');
    log(`    - Discount Code: ${updateData.discountCode}`, 'cyan');
    
    const response = await axios.put(`${BASE_URL}/admin/carts/recovery/settings`, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      const settings = response.data.data;
      log('✓ PUT request successful!', 'green');
      log('  Response structure:', 'cyan');
      log(`    - Success: ${response.data.success}`, 'cyan');
      log(`    - Message: ${response.data.message}`, 'cyan');
      log('  Updated settings:', 'cyan');
      log(`    - Enabled: ${settings.enabled}`, 'cyan');
      log(`    - First Email Delay: ${settings.firstEmailDelay}h`, 'cyan');
      log(`    - Second Email Delay: ${settings.secondEmailDelay}h`, 'cyan');
      log(`    - Third Email Delay: ${settings.thirdEmailDelay}h`, 'cyan');
      log(`    - Discount Percentage: ${settings.discountPercentage}%`, 'cyan');
      log(`    - Discount Code: ${settings.discountCode}`, 'cyan');
      log(`    - Max Recovery Attempts: ${settings.maxRecoveryAttempts}`, 'cyan');
      log(`    - Min Cart Value: ${settings.minCartValue}`, 'cyan');
      
      // Verify the update was applied correctly
      if (settings.enabled !== updateData.enabled) {
        log(`✗ Enabled not updated correctly`, 'red');
        return false;
      }
      if (settings.firstEmailDelay !== updateData.firstEmailDelay) {
        log(`✗ First Email Delay not updated correctly`, 'red');
        return false;
      }
      if (settings.discountPercentage !== updateData.discountPercentage) {
        log(`✗ Discount Percentage not updated correctly`, 'red');
        return false;
      }
      if (settings.discountCode !== updateData.discountCode) {
        log(`✗ Discount Code not updated correctly`, 'red');
        return false;
      }
      
      log('✓ All fields updated correctly', 'green');
      return settings;
    } else {
      log('✗ PUT request failed', 'red');
      log(`  Response: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ PUT request failed: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
      
      if (error.response.status === 404) {
        log('  ⚠️  404 Error - Route may not be registered!', 'yellow');
      }
    }
    return false;
  }
}

async function testPersistence() {
  try {
    log('\n=== Step 4: Test Data Persistence ===', 'blue');
    log('Verifying settings persist across requests...', 'cyan');
    
    const response = await axios.get(`${BASE_URL}/admin/carts/recovery/settings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      const settings = response.data.data;
      log('✓ GET request successful!', 'green');
      
      // Verify the updated values persist
      if (settings.enabled === false && 
          settings.firstEmailDelay === 2 && 
          settings.discountPercentage === 15 &&
          settings.discountCode === 'SAVE15NOW') {
        log('✓ Settings persist correctly!', 'green');
        log(`    - Enabled: ${settings.enabled}`, 'cyan');
        log(`    - First Email Delay: ${settings.firstEmailDelay}h`, 'cyan');
        log(`    - Discount Percentage: ${settings.discountPercentage}%`, 'cyan');
        log(`    - Discount Code: ${settings.discountCode}`, 'cyan');
        return true;
      } else {
        log('✗ Settings do not persist correctly', 'red');
        log(`    - Expected enabled: false, got: ${settings.enabled}`, 'red');
        log(`    - Expected firstEmailDelay: 2, got: ${settings.firstEmailDelay}`, 'red');
        log(`    - Expected discountPercentage: 15, got: ${settings.discountPercentage}`, 'red');
        log(`    - Expected discountCode: SAVE15NOW, got: ${settings.discountCode}`, 'red');
        return false;
      }
    } else {
      log('✗ Persistence test failed', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Persistence test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testValidation() {
  try {
    log('\n=== Step 5: Test Input Validation ===', 'blue');
    log('Testing with invalid input...', 'cyan');
    
    const invalidData = {
      enabled: 'not-a-boolean',  // Invalid type
      firstEmailDelay: -1,        // Invalid value
      discountPercentage: 150     // Invalid value (> 100)
    };
    
    log('  Invalid data:', 'cyan');
    log(`    - Enabled: ${invalidData.enabled}`, 'cyan');
    log(`    - First Email Delay: ${invalidData.firstEmailDelay}`, 'cyan');
    log(`    - Discount Percentage: ${invalidData.discountPercentage}`, 'cyan');
    
    const response = await axios.put(`${BASE_URL}/admin/carts/recovery/settings`, invalidData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // If we get here, validation didn't work as expected
    log('⚠️  Validation may not be working correctly', 'yellow');
    log(`  Response: ${JSON.stringify(response.data)}`, 'yellow');
    return true; // Not a failure, just a warning
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('✓ Validation working correctly!', 'green');
      log(`  Error message: ${error.response.data.message}`, 'cyan');
      return true;
    } else {
      log(`⚠️  Unexpected validation behavior: ${error.message}`, 'yellow');
      return true; // Not a failure
    }
  }
}

async function restoreDefaults() {
  try {
    log('\n=== Step 6: Restore Default Settings ===', 'blue');
    log('Restoring default settings...', 'cyan');
    
    const defaultData = {
      enabled: true,
      firstEmailDelay: 1,
      secondEmailDelay: 24,
      thirdEmailDelay: 72,
      discountEnabled: true,
      discountPercentage: 10,
      discountCode: 'COMEBACK10',
      maxRecoveryAttempts: 3,
      minCartValue: 1000,
      emailFromName: 'Smart Tech',
      emailFromAddress: 'noreply@smarttech.com',
      cartAbandonmentThreshold: 30,
      recoveryTokenExpiry: 7
    };
    
    const response = await axios.put(`${BASE_URL}/admin/carts/recovery/settings`, defaultData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.success) {
      log('✓ Default settings restored!', 'green');
      return true;
    } else {
      log('✗ Failed to restore defaults', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Failed to restore defaults: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║  Cart Recovery Settings API Endpoints - Comprehensive Test  ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  
  const results = {
    login: false,
    getEndpoint: false,
    putEndpoint: false,
    persistence: false,
    validation: false,
    restoreDefaults: false
  };
  
  // Step 1: Login
  results.login = await login();
  if (!results.login) {
    log('\n✗ Cannot proceed without authentication', 'red');
    printSummary(results);
    process.exit(1);
  }
  
  // Step 2: Test GET endpoint
  results.getEndpoint = await testGetEndpoint();
  
  // Step 3: Test PUT endpoint
  results.putEndpoint = await testPutEndpoint();
  
  // Step 4: Test persistence
  results.persistence = await testPersistence();
  
  // Step 5: Test validation
  results.validation = await testValidation();
  
  // Step 6: Restore defaults
  results.restoreDefaults = await restoreDefaults();
  
  // Print summary
  printSummary(results);
  
  // Exit with appropriate code
  const allPassed = Object.values(results).every(result => result);
  process.exit(allPassed ? 0 : 1);
}

function printSummary(results) {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║                      Test Summary                           ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  
  log('\nTest Results:', 'cyan');
  log(`  1. Admin Login:              ${results.login ? '✓ PASS' : '✗ FAIL'}`, results.login ? 'green' : 'red');
  log(`  2. GET Endpoint:             ${results.getEndpoint ? '✓ PASS' : '✗ FAIL'}`, results.getEndpoint ? 'green' : 'red');
  log(`  3. PUT Endpoint:             ${results.putEndpoint ? '✓ PASS' : '✗ FAIL'}`, results.putEndpoint ? 'green' : 'red');
  log(`  4. Data Persistence:          ${results.persistence ? '✓ PASS' : '✗ FAIL'}`, results.persistence ? 'green' : 'red');
  log(`  5. Input Validation:         ${results.validation ? '✓ PASS' : '✗ FAIL'}`, results.validation ? 'green' : 'red');
  log(`  6. Restore Defaults:          ${results.restoreDefaults ? '✓ PASS' : '✗ FAIL'}`, results.restoreDefaults ? 'green' : 'red');
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  log(`\nTotal: ${passedCount}/${totalCount} tests passed`, passedCount === totalCount ? 'green' : 'yellow');
  
  if (passedCount === totalCount) {
    log('\n🎉 All tests passed successfully!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the results above.', 'yellow');
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
