/**
 * Test Checkout Settings Endpoint with Real Authentication
 * 
 * This script tests the checkout settings endpoint using a real admin user token
 * to identify what's causing the "Failed to load checkout settings" error.
 */

const http = require('http');
const jwt = require('jsonwebtoken');

// Configuration
const BACKEND_URL = 'localhost';
const BACKEND_PORT = 3001;
const BASE_API_URL = `http://${BACKEND_URL}:${BACKEND_PORT}/api/v1`;
const JWT_SECRET = 'c9480d1bfc9f8ca930e635dbeeb9c76a52ae468bc3d2433ec7403831559f269776f672bf960fb370025d4da6e2a1fb9ebc01730290398faa096131605e30aa29';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
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

async function testWithRealAdminUser() {
  logSection('TESTING CHECKOUT SETTINGS WITH REAL ADMIN USER');

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Get admin user
    log('Fetching admin user from database...', colors.blue);
    const adminUser = await prisma.$queryRaw`
      SELECT u.id, u.email
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'ADMIN'
      LIMIT 1
    `;

    if (!adminUser || adminUser.length === 0) {
      log('✗ No admin user found in database', colors.red);
      return;
    }

    const user = adminUser[0];
    log(`✓ Found admin user: ${user.email} (ID: ${user.id})`, colors.green);

    // Get user's roles
    const roles = await prisma.$queryRaw`
      SELECT r.name, r.hierarchy_level
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ${user.id}
    `;

    log(`\n✓ User has ${roles.length} role(s):`, colors.green);
    roles.forEach(r => {
      log(`  - ${r.name} (level: ${r.hierarchy_level})`, colors.green);
    });

    // Get user's permissions
    const permissions = await prisma.$queryRaw`
      SELECT p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ${user.id}
      ORDER BY p.name
    `;

    log(`\n✓ User has ${permissions.length} permission(s):`, colors.green);
    permissions.forEach(p => {
      log(`  - ${p.name}`, colors.green);
    });

    // Check if user has checkout:read permission
    const hasCheckoutRead = permissions.some(p => p.name === 'checkout:read');
    if (hasCheckoutRead) {
      log(`\n✓ User HAS checkout:read permission`, colors.green);
    } else {
      log(`\n✗ User DOES NOT have checkout:read permission`, colors.red);
      log('This is the root cause!', colors.yellow);
      return;
    }

    // Create a JWT token for the user
    log('\nCreating JWT token for user...', colors.blue);
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: roles[0]?.name || 'ADMIN'
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: '1h',
      issuer: 'smart-ecommerce-api',
      audience: 'smart-ecommerce-clients'
    });
    log(`✓ Token created successfully`, colors.green);
    log(`Token preview: ${token.substring(0, 50)}...`, colors.blue);

    // Test checkout settings endpoint with the token
    logSection('TEST: Checkout Settings Endpoint with Valid Token');
    try {
      const response = await makeRequest({
        hostname: BACKEND_URL,
        port: BACKEND_PORT,
        path: '/api/v1/admin/checkout/settings',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      log(`Status Code: ${response.statusCode}`, 
        response.statusCode === 200 ? colors.green : 
        response.statusCode === 403 ? colors.red : 
        response.statusCode === 401 ? colors.yellow : colors.reset);
      log(`Status Message: ${response.statusMessage}`, colors.reset);
      
      if (response.data) {
        log('\nResponse Data:', colors.reset);
        log(JSON.stringify(response.data, null, 2), colors.reset);
      }

      if (response.statusCode === 200) {
        log('\n✓ SUCCESS! Checkout settings endpoint is working correctly', colors.green);
        log('The issue is likely on the frontend or with user session', colors.yellow);
      } else if (response.statusCode === 403) {
        log('\n✗ PERMISSION DENIED (403 Forbidden)', colors.red);
        log('This indicates the permission check is failing despite database showing permission exists', colors.yellow);
        log('\nPossible causes:', colors.yellow);
        log('1. JWT token payload does not include role information', colors.reset);
        log('2. RBAC middleware is checking permissions differently than expected', colors.reset);
        log('3. Token was issued before permissions were assigned', colors.reset);
      } else if (response.statusCode === 401) {
        log('\n✗ UNAUTHORIZED (401)', colors.yellow);
        log('Token authentication failed', colors.yellow);
      } else if (response.statusCode === 500) {
        log('\n✗ SERVER ERROR (500 Internal Server Error)', colors.red);
        log('This indicates a backend error, not a permission issue', colors.yellow);
      }

    } catch (error) {
      log(`✗ Request failed: ${error.message}`, colors.red);
    }

    // Test the user_has_permission function directly
    logSection('TEST: user_has_permission Database Function');
    const permissionResult = await prisma.$queryRaw`
      SELECT user_has_permission(${user.id}, 'checkout:read') as has_permission
    `;

    if (permissionResult && permissionResult.length > 0) {
      const hasPermission = permissionResult[0].has_permission;
      if (hasPermission) {
        log('✓ user_has_permission() returns TRUE', colors.green);
      } else {
        log('✗ user_has_permission() returns FALSE', colors.red);
        log('This is inconsistent with the role_permissions table!', colors.yellow);
      }
    }

  } catch (error) {
    log(`✗ Test failed: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  logSection('DIAGNOSTIC SUMMARY');
  log('Based on the tests above, here are the possible issues:', colors.blue);
  log('');
  log('1. If endpoint returned 200:', colors.green);
  log('   - Backend is working correctly');
  log('   - Issue is likely frontend session/token not being refreshed');
  log('   - User needs to log out and log back in');
  log('');
  log('2. If endpoint returned 403:', colors.red);
  log('   - Permission check is failing');
  log('   - Check JWT token payload structure');
  log('   - Check RBAC middleware implementation');
  log('   - Check if permissions are cached somewhere');
  log('');
  log('3. If endpoint returned 500:', colors.red);
  log('   - Backend error occurred');
  log('   - Check backend logs for stack trace');
  log('   - May be unrelated to permissions');
  log('');
  log('RECOMMENDED NEXT STEPS:', colors.cyan);
  log('- Check browser console for actual error message', colors.reset);
  log('- Check browser Network tab for actual HTTP response', colors.reset);
  log('- If 403, try logging out and logging back in', colors.reset);
  log('- If still failing, check backend logs for permission check failures', colors.reset);
}

// Run the test
testWithRealAdminUser().catch(error => {
  log(`\n✗ Test failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
