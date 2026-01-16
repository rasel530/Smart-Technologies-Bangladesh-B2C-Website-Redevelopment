const http = require('http');

async function testRBACFunctionality() {
  const testUserId = 'fe73940c-9719-4767-9a49-c70abcd316e7';

  console.log('[TEST] Testing RBAC functionality for user:', testUserId);

  // Test 1: Get user roles
  console.log('\n[TEST] === Test 1: Get User Roles ===');
  await makeRequest('GET', `/api/v1/rbac/users/${testUserId}/roles`);

  // Test 2: Get user permissions
  console.log('\n[TEST] === Test 2: Get User Permissions ===');
  await makeRequest('GET', `/api/v1/rbac/users/${testUserId}/permissions`);

  // Test 3: Get role hierarchy
  console.log('\n[TEST] === Test 3: Get Role Hierarchy ===');
  await makeRequest('GET', '/api/v1/rbac/roles/hierarchy');

  console.log('\n[TEST] ✓ All RBAC functionality tests completed');
}

function makeRequest(method, path, query = {}) {
  return new Promise((resolve, reject) => {
    const queryString = Object.keys(query)
      .map(key => `${key}=${encodeURIComponent(query[key])}`)
      .join('&');

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `${path}${queryString ? '?' + queryString : ''}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`[TEST] ${method} ${path} - Status: ${res.statusCode}`);
        try {
          const result = JSON.parse(data);
          console.log(`[TEST] Response:`, JSON.stringify(result, null, 2));
          resolve(result);
        } catch (parseError) {
          console.error('[TEST] Failed to parse response:', parseError.message);
          reject(parseError);
        }
      });
    });

    req.on('error', (error) => {
      console.error('[TEST] Request error:', error.message);
      reject(error);
    });

    if (method === 'POST') {
      req.write('{}');
    }
    req.end();
  });
}

testRBACFunctionality()
  .then(() => console.log('\n[TEST] All tests completed successfully'))
  .catch((err) => console.error('\n[TEST] Tests failed:', err));
