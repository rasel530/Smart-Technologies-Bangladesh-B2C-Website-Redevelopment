const http = require('http');

async function testRBACRegistration() {
  const userData = {
    email: `rbac-test-${Date.now()}@test.com`,
    password: 'SecureP@ssw0rd!',
    confirmPassword: 'SecureP@ssw0rd!',
    firstName: 'RBAC',
    lastName: 'TestUser'
  };

  console.log('[TEST] Testing RBAC registration with user:', userData.email);

  const postData = JSON.stringify(userData);

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('[TEST] Response status:', res.statusCode);
        console.log('[TEST] Response body:', data);

        try {
          const result = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log('[TEST] ✓ Registration successful!');
            console.log('[TEST] User ID:', result.user?.id);
            resolve(result);
          } else {
            console.log('[TEST] ✗ Registration failed:', result.error);
            reject(result);
          }
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

    req.write(postData);
    req.end();
  });
}

testRBACRegistration()
  .then(() => console.log('[TEST] Test completed'))
  .catch((err) => console.error('[TEST] Test failed:', err));
