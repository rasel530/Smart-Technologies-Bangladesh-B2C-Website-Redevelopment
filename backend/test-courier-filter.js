const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';

// Admin credentials
const ADMIN_EMAIL = 'admin@smarttech.com';
const ADMIN_PASSWORD = 'admin123';

async function makeRequest(method, endpoint, data = null, headers = {}) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/v1${endpoint}`,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data) {
    options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

async function testCourierFilter() {
  console.log('========================================');
  console.log('  COURIER FILTER TEST');
  console.log('========================================\n');

  // Step 1: Login as admin
  console.log('Step 1: Logging in as admin...');
  const loginResponse = await makeRequest('POST', '/auth/login', {
    identifier: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (loginResponse.status !== 200) {
    console.log('❌ Login failed');
    console.log('   Status:', loginResponse.status);
    console.log('   Response:', loginResponse.data);
    return;
  }

  const token = loginResponse.data.token;
  console.log('✓ Login successful');
  console.log('  Token:', token.substring(0, 50) + '...\n');

  // Step 2: Test analytics without courier filter
  console.log('Step 2: Testing analytics without courier filter...');
  const analyticsResponse1 = await makeRequest('GET', '/admin/tracking/analytics', null, {
    'Authorization': `Bearer ${token}`
  });

  console.log('Status:', analyticsResponse1.status);
  console.log('Response:', JSON.stringify(analyticsResponse1.data, null, 2));
  
  if (analyticsResponse1.status === 200) {
    console.log('✓ Analytics without filter works\n');
  } else {
    console.log('❌ Analytics without filter failed\n');
  }

  // Step 3: Test analytics with courier filter
  console.log('Step 3: Testing analytics with courier filter...');
  const courierServiceId = 'ea05dd1a-9bc9-4b6f-a59a-409287357b76';
  const analyticsResponse2 = await makeRequest('GET', `/admin/tracking/analytics?courierServiceId=${courierServiceId}`, null, {
    'Authorization': `Bearer ${token}`
  });

  console.log('Status:', analyticsResponse2.status);
  console.log('Response:', JSON.stringify(analyticsResponse2.data, null, 2));
  
  if (analyticsResponse2.status === 200) {
    console.log('✓ Analytics with courier filter works\n');
  } else {
    console.log('❌ Analytics with courier filter failed\n');
  }

  // Step 4: Test performance endpoint with courier filter
  console.log('Step 4: Testing performance endpoint with courier filter...');
  const performanceResponse = await makeRequest('GET', `/admin/tracking/performance?courierServiceId=${courierServiceId}`, null, {
    'Authorization': `Bearer ${token}`
  });

  console.log('Status:', performanceResponse.status);
  console.log('Response:', JSON.stringify(performanceResponse.data, null, 2));
  
  if (performanceResponse.status === 200) {
    console.log('✓ Performance with courier filter works\n');
  } else {
    console.log('❌ Performance with courier filter failed\n');
  }

  // Step 5: Test issues endpoint with courier filter
  console.log('Step 5: Testing issues endpoint with courier filter...');
  const issuesResponse = await makeRequest('GET', `/admin/tracking/issues?courierServiceId=${courierServiceId}`, null, {
    'Authorization': `Bearer ${token}`
  });

  console.log('Status:', issuesResponse.status);
  console.log('Response:', JSON.stringify(issuesResponse.data, null, 2));
  
  if (issuesResponse.status === 200) {
    console.log('✓ Issues with courier filter works\n');
  } else {
    console.log('❌ Issues with courier filter failed\n');
  }

  console.log('========================================');
  console.log('  TEST COMPLETE');
  console.log('========================================');
}

testCourierFilter().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
