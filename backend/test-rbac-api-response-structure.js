/**
 * Diagnostic script to test RBAC API response structure
 * This will help identify the root cause of the rendering bug
 */

const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1';
const TEST_EMAIL = 'admin@smarttech.com';
const TEST_PASSWORD = 'AdminPassword123';

let authToken = null;

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
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

// Login to get auth token
async function login() {
  console.log('\n🔐 Logging in...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const response = await makeRequest(options, {
    identifier: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  console.log('Login response status:', response.statusCode);
  console.log('Login response data:', JSON.stringify(response.data, null, 2));
  
  if (response.statusCode === 200 && response.data.token) {
    authToken = response.data.token;
    console.log('✅ Auth token obtained');
    return true;
  } else {
    console.log('❌ Failed to get auth token');
    return false;
  }
}

// Test RBAC roles endpoint
async function testRolesEndpoint() {
  console.log('\n📋 Testing GET /api/v1/rbac/roles...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/rbac/roles',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  const response = await makeRequest(options);
  
  console.log('\n📊 API Response Analysis:');
  console.log('Status Code:', response.statusCode);
  console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
  console.log('\nFull Response Body:', JSON.stringify(response.data, null, 2));
  
  console.log('\n🔍 Response Structure Analysis:');
  console.log('- Has "success" property:', 'success' in response.data);
  console.log('- Has "message" property:', 'message' in response.data);
  console.log('- Has "data" property:', 'data' in response.data);
  console.log('- Has "count" property:', 'count' in response.data);
  
  if (response.data && 'data' in response.data) {
    console.log('\n✅ Response has "data" property');
    console.log('- data type:', typeof response.data.data);
    console.log('- data is array:', Array.isArray(response.data.data));
    console.log('- data length:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\nFirst role sample:', JSON.stringify(response.data.data[0], null, 2));
    }
  } else {
    console.log('\n❌ Response does NOT have "data" property');
    console.log('- Response is array:', Array.isArray(response.data));
    console.log('- Response length:', response.data?.length || 0);
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('\nFirst role sample:', JSON.stringify(response.data[0], null, 2));
    }
  }
  
  console.log('\n🎯 Frontend Expectation Analysis:');
  console.log('Frontend expects: response.data to be an array of roles');
  console.log('Backend returns: { success: true, message: "...", data: [...roles], count: N }');
  console.log('API client unwraps: { success: true, data: [...] } → returns [...roles]');
  
  console.log('\n⚠️  ROOT CAUSE IDENTIFICATION:');
  if (response.data && 'data' in response.data) {
    console.log('✅ Backend returns correct structure with "data" property');
    console.log('✅ API client unwraps the response');
    console.log('❌ Frontend code tries to access response.data AFTER unwrapping');
    console.log('❌ This causes response.data to be undefined');
    console.log('\n📍 Problem Location: frontend/src/app/admin/rbac/roles/page.tsx:92');
    console.log('   Code: setRoles(response.data || []);');
    console.log('   Issue: response is already the roles array, so response.data is undefined');
  } else {
    console.log('❓ Unexpected response structure - needs further investigation');
  }
  
  return response;
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('RBAC API Response Structure Diagnostic');
  console.log('========================================');
  
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  await testRolesEndpoint();
  
  console.log('\n========================================');
  console.log('Diagnostic Complete');
  console.log('========================================');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
