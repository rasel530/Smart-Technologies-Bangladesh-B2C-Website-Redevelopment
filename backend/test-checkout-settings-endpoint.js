/**
 * Diagnostic Script for Checkout Settings Endpoint
 * 
 * This script tests the /api/v1/admin/checkout/settings endpoint to identify
 * why the error persists despite the RBAC permission fix.
 */

const http = require('http');

// Configuration
const BACKEND_URL = 'localhost';
const BACKEND_PORT = 3001;
const BASE_API_URL = `http://${BACKEND_URL}:${BACKEND_PORT}/api/v1`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data: parsedData,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testEndpoint() {
  logSection('CHECKOUT SETTINGS ENDPOINT DIAGNOSTIC');
  log(`Backend URL: ${BASE_API_URL}`, colors.blue);
  log(`Timestamp: ${new Date().toISOString()}`, colors.blue);

  // Test 1: Check if backend is running
  logSection('TEST 1: Backend Health Check');
  try {
    const healthResponse = await makeRequest({
      hostname: BACKEND_URL,
      port: BACKEND_PORT,
      path: '/api/v1/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (healthResponse.statusCode === 200) {
      log('✓ Backend is running and accessible', colors.green);
      log(`Status: ${healthResponse.statusCode} ${healthResponse.statusMessage}`, colors.green);
    } else {
      log(`✗ Backend returned unexpected status: ${healthResponse.statusCode}`, colors.red);
    }
  } catch (error) {
    log(`✗ Backend health check failed: ${error.message}`, colors.red);
    log('This indicates the backend server is not running or not accessible', colors.yellow);
    return;
  }

  // Test 2: Test checkout settings endpoint without authentication
  logSection('TEST 2: Checkout Settings Endpoint (No Auth)');
  try {
    const response = await makeRequest({
      hostname: BACKEND_URL,
      port: BACKEND_PORT,
      path: '/api/v1/admin/checkout/settings',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    log(`Status Code: ${response.statusCode}`, response.statusCode === 401 ? colors.yellow : colors.red);
    log(`Status Message: ${response.statusMessage}`, colors.reset);
    
    if (response.data) {
      log('Response Data:', colors.reset);
      log(JSON.stringify(response.data, null, 2), colors.reset);
    }

    if (response.statusCode === 401) {
      log('✓ Correctly requires authentication (401 Unauthorized)', colors.green);
    } else if (response.statusCode === 403) {
      log('✗ Returned 403 Forbidden (should be 401 for no auth)', colors.red);
    } else if (response.statusCode === 500) {
      log('✗ Server error (500 Internal Server Error)', colors.red);
      log('This indicates a backend error, not a permission issue', colors.yellow);
    } else {
      log(`? Unexpected status code: ${response.statusCode}`, colors.yellow);
    }
  } catch (error) {
    log(`✗ Request failed: ${error.message}`, colors.red);
  }

  // Test 3: Test checkout settings endpoint with invalid token
  logSection('TEST 3: Checkout Settings Endpoint (Invalid Token)');
  try {
    const response = await makeRequest({
      hostname: BACKEND_URL,
      port: BACKEND_PORT,
      path: '/api/v1/admin/checkout/settings',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid.token.here'
      }
    });

    log(`Status Code: ${response.statusCode}`, colors.reset);
    log(`Status Message: ${response.statusMessage}`, colors.reset);
    
    if (response.data) {
      log('Response Data:', colors.reset);
      log(JSON.stringify(response.data, null, 2), colors.reset);
    }

    if (response.statusCode === 401) {
      log('✓ Correctly rejects invalid token (401 Unauthorized)', colors.green);
    } else if (response.statusCode === 403) {
      log('✗ Returned 403 Forbidden (should be 401 for invalid token)', colors.red);
    } else if (response.statusCode === 500) {
      log('✗ Server error (500 Internal Server Error)', colors.red);
      log('This indicates a backend error, not a permission issue', colors.yellow);
    }
  } catch (error) {
    log(`✗ Request failed: ${error.message}`, colors.red);
  }

  // Test 4: Check database for permissions
  logSection('TEST 4: Database Permission Check');
  log('Checking if checkout:read permission exists in database...', colors.blue);
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Check if checkout:read permission exists
    const permission = await prisma.$queryRaw`
      SELECT * FROM permissions WHERE name = 'checkout:read'
    `;

    if (permission && permission.length > 0) {
      log('✓ Permission "checkout:read" exists in database', colors.green);
      log(JSON.stringify(permission[0], null, 2), colors.reset);
    } else {
      log('✗ Permission "checkout:read" NOT found in database', colors.red);
      log('This is the root cause of the issue!', colors.yellow);
    }

    // Check all checkout permissions
    const allCheckoutPermissions = await prisma.$queryRaw`
      SELECT * FROM permissions WHERE name LIKE 'checkout:%'
    `;

    if (allCheckoutPermissions && allCheckoutPermissions.length > 0) {
      log(`\n✓ Found ${allCheckoutPermissions.length} checkout permissions:`, colors.green);
      allCheckoutPermissions.forEach(p => {
        log(`  - ${p.name} (ID: ${p.id})`, colors.green);
      });
    } else {
      log('\n✗ No checkout permissions found in database', colors.red);
    }

    // Check role permissions for ADMIN role
    const adminPermissions = await prisma.$queryRaw`
      SELECT p.name as permission_name, r.name as role_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN roles r ON rp.role_id = r.id
      WHERE r.name = 'ADMIN' AND p.name LIKE 'checkout:%'
    `;

    if (adminPermissions && adminPermissions.length > 0) {
      log(`\n✓ ADMIN role has ${adminPermissions.length} checkout permissions:`, colors.green);
      adminPermissions.forEach(p => {
        log(`  - ${p.permission_name}`, colors.green);
      });
    } else {
      log('\n✗ ADMIN role has NO checkout permissions assigned', colors.red);
      log('This is likely the root cause of the issue!', colors.yellow);
    }

    // Check if there are any users with ADMIN role
    const adminUsers = await prisma.$queryRaw`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'ADMIN'
      LIMIT 5
    `;

    if (adminUsers && adminUsers.length > 0) {
      log(`\n✓ Found ${adminUsers.length} users with ADMIN role:`, colors.green);
      adminUsers.forEach(u => {
        log(`  - ${u.email} (ID: ${u.id})`, colors.green);
      });
    } else {
      log('\n✗ No users found with ADMIN role', colors.yellow);
    }

  } catch (error) {
    log(`✗ Database query failed: ${error.message}`, colors.red);
  } finally {
    await prisma.$disconnect();
  }

  // Test 5: Test user_has_permission function
  logSection('TEST 5: Database Function Test');
  log('Testing user_has_permission database function...', colors.blue);

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Get first admin user
    const adminUser = await prisma.$queryRaw`
      SELECT u.id, u.email
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'ADMIN'
      LIMIT 1
    `;

    if (adminUser && adminUser.length > 0) {
      const userId = adminUser[0].id;
      const userEmail = adminUser[0].email;
      log(`Testing with admin user: ${userEmail} (ID: ${userId})`, colors.blue);

      // Test permission check
      const result = await prisma.$queryRaw`
        SELECT user_has_permission(${userId}, 'checkout:read') as has_permission
      `;

      if (result && result.length > 0) {
        const hasPermission = result[0].has_permission;
        if (hasPermission) {
          log('✓ user_has_permission function returned TRUE', colors.green);
          log('The admin user DOES have checkout:read permission', colors.green);
        } else {
          log('✗ user_has_permission function returned FALSE', colors.red);
          log('The admin user DOES NOT have checkout:read permission', colors.red);
          log('This is the root cause of the issue!', colors.yellow);
        }
      }
    } else {
      log('✗ No admin user found to test permissions', colors.yellow);
    }

    await prisma.$disconnect();
  } catch (error) {
    log(`✗ Database function test failed: ${error.message}`, colors.red);
  }

  // Summary
  logSection('DIAGNOSTIC SUMMARY');
  log('Please review the results above to identify the issue:', colors.blue);
  log('');
  log('Common causes:', colors.yellow);
  log('1. Permission "checkout:read" does not exist in database', colors.reset);
  log('2. Permission exists but is not assigned to ADMIN role', colors.reset);
  log('3. User does not have ADMIN role assigned', colors.reset);
  log('4. Backend server error (500) unrelated to permissions', colors.reset);
  log('5. Session/token needs to be refreshed after permission assignment', colors.reset);
  log('');
  log('Next steps:', colors.blue);
  log('- Review the test results above', colors.reset);
  log('- Check browser console for detailed error messages', colors.reset);
  log('- Verify backend logs for permission check failures', colors.reset);
  log('- If permissions are missing, run the RBAC fix script again', colors.reset);
  log('- If permissions exist, try logging out and back in to refresh session', colors.reset);
}

// Run the diagnostic
testEndpoint().catch(error => {
  log(`\n✗ Diagnostic script failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
