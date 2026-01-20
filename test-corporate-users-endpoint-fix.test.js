/**
 * Test script to verify the corporate users endpoint fix
 * Tests the endpoint: GET /api/v1/corporate/:id/users
 * 
 * Fix: Changed `assigned_at: 'desc'` to `assignedAt: 'desc'` in backend/routes/corporate.js:713
 */

const http = require('http');

// Corporate Account ID to test
const CORPORATE_ACCOUNT_ID = '83fbff07-2859-425b-bbe2-26478d548fe0';

// Test credentials (provided by user)
const TEST_CREDENTIALS = {
  identifier: 'raselbepari88@gmail.com',
  password: '54Vfo^71~_oQ'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
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

async function login() {
  log('\n=== Step 1: Login to get authentication token ===', colors.blue);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, TEST_CREDENTIALS);
    
    if (response.statusCode === 200 && response.body.token) {
      log('✓ Login successful!', colors.green);
      log(`  User: ${response.body.user.email}`, colors.reset);
      log(`  Role: ${response.body.user.role}`, colors.reset);
      log(`  Token length: ${response.body.token.length} chars`, colors.reset);
      return response.body.token;
    } else {
      log(`✗ Login failed with status ${response.statusCode}`, colors.red);
      log(`  Response: ${JSON.stringify(response.body, null, 2)}`, colors.red);
      return null;
    }
  } catch (error) {
    log(`✗ Login request failed: ${error.message}`, colors.red);
    return null;
  }
}

async function testCorporateUsersEndpoint(token) {
  log('\n=== Step 2: Test Corporate Users Endpoint ===', colors.blue);
  log(`Endpoint: GET /api/v1/corporate/${CORPORATE_ACCOUNT_ID}/users`, colors.reset);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/v1/corporate/${CORPORATE_ACCOUNT_ID}/users`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    log(`\nResponse Status Code: ${response.statusCode}`, 
      response.statusCode === 200 ? colors.green : colors.red);
    
    if (response.statusCode === 500) {
      log('\n✗ FAILED: Received 500 Internal Server Error', colors.red);
      log('  This indicates the Prisma field name issue is NOT fixed', colors.red);
      log(`  Response: ${JSON.stringify(response.body, null, 2)}`, colors.red);
      return false;
    }
    
    if (response.statusCode === 200) {
      log('\n✓ SUCCESS: Received 200 OK', colors.green);
      log('  The Prisma field name fix is working correctly!', colors.green);
      
      // Verify response structure
      log('\n=== Step 3: Verify Response Structure ===', colors.blue);
      
      const hasSuccess = response.body.success === true;
      const hasData = Array.isArray(response.body.data);
      
      log(`  success field: ${hasSuccess ? '✓ Present and true' : '✗ Missing or incorrect'}`, 
        hasSuccess ? colors.green : colors.red);
      log(`  data field: ${hasData ? '✓ Present and is array' : '✗ Missing or not an array'}`, 
        hasData ? colors.green : colors.red);
      
      if (hasData && response.body.data.length > 0) {
        log(`  Number of corporate users: ${response.body.data.length}`, colors.reset);
        
        // Verify first user structure
        const firstUser = response.body.data[0];
        log('\n=== Step 4: Verify User Object Structure ===', colors.blue);
        
        const requiredFields = [
          'id', 'corporateAccountId', 'userId', 'role', 
          'isActive', 'assignedAt', 'expiresAt', 'users'
        ];
        
        let allFieldsPresent = true;
        for (const field of requiredFields) {
          const present = field in firstUser;
          log(`  ${field}: ${present ? '✓ Present' : '✗ Missing'}`, 
            present ? colors.green : colors.red);
          if (!present) allFieldsPresent = false;
        }
        
        // Verify users object has user details
        if (firstUser.users) {
          log('\n=== Step 5: Verify Nested User Details ===', colors.blue);
          log(`  User ID: ${firstUser.users.id}`, colors.reset);
          log(`  User Email: ${firstUser.users.email}`, colors.reset);
          log(`  User Name: ${firstUser.users.firstName} ${firstUser.users.lastName}`, colors.reset);
        }
        
        // Verify sorting by assignedAt in descending order
        log('\n=== Step 6: Verify Sorting (assignedAt descending) ===', colors.blue);
        
        if (response.body.data.length > 1) {
          let isSorted = true;
          for (let i = 0; i < response.body.data.length - 1; i++) {
            const current = new Date(response.body.data[i].assignedAt);
            const next = new Date(response.body.data[i + 1].assignedAt);
            
            if (current < next) {
              isSorted = false;
              log(`  ✗ Sort violation at index ${i}:`, colors.red);
              log(`    ${i}: ${response.body.data[i].assignedAt}`, colors.red);
              log(`    ${i + 1}: ${response.body.data[i + 1].assignedAt}`, colors.red);
              break;
            }
          }
          
          if (isSorted) {
            log('  ✓ Users are correctly sorted by assignedAt in descending order', colors.green);
            log(`    First assignedAt: ${response.body.data[0].assignedAt}`, colors.reset);
            log(`    Last assignedAt: ${response.body.data[response.body.data.length - 1].assignedAt}`, colors.reset);
          }
        } else {
          log('  ⚠ Only one user in response, cannot verify sorting', colors.yellow);
        }
        
        return allFieldsPresent;
      } else {
        log('\n⚠ Warning: No corporate users found in response', colors.yellow);
        log('  This might be expected if no users are assigned to this corporate account', colors.yellow);
        return true;
      }
    } else if (response.statusCode === 401) {
      log('\n✗ Authentication failed (401)', colors.red);
      log('  The token may be invalid or expired', colors.red);
      return false;
    } else if (response.statusCode === 403) {
      log('\n✗ Authorization failed (403)', colors.red);
      log('  The user may not have permission to access this corporate account', colors.red);
      return false;
    } else {
      log(`\n✗ Unexpected status code: ${response.statusCode}`, colors.red);
      log(`  Response: ${JSON.stringify(response.body, null, 2)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`\n✗ Request failed: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), colors.bold);
  log('  CORPORATE USERS ENDPOINT FIX VERIFICATION TEST', colors.bold);
  log('='.repeat(60), colors.bold);
  log('\nFix Details:', colors.blue);
  log('  File: backend/routes/corporate.js:713', colors.reset);
  log('  Change: assigned_at: "desc" → assignedAt: "desc"', colors.reset);
  log('  Issue: Prisma validation error causing 500 Internal Server Error', colors.reset);
  log('\nTest Details:', colors.blue);
  log(`  Corporate Account ID: ${CORPORATE_ACCOUNT_ID}`, colors.reset);
  log(`  Test User: ${TEST_CREDENTIALS.identifier}`, colors.reset);
  
  // Step 1: Login
  const token = await login();
  
  if (!token) {
    log('\n' + '='.repeat(60), colors.bold);
    log('  TEST RESULT: FAILED', colors.red);
    log('='.repeat(60), colors.bold);
    log('\nUnable to authenticate. Cannot proceed with endpoint test.', colors.red);
    process.exit(1);
  }
  
  // Step 2: Test the endpoint
  const testPassed = await testCorporateUsersEndpoint(token);
  
  // Final result
  log('\n' + '='.repeat(60), colors.bold);
  if (testPassed) {
    log('  TEST RESULT: PASSED ✓', colors.green);
  } else {
    log('  TEST RESULT: FAILED ✗', colors.red);
  }
  log('='.repeat(60), colors.bold);
  
  process.exit(testPassed ? 0 : 1);
}

// Run the test
main().catch(error => {
  log(`\n✗ Test execution failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
