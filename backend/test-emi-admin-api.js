/**
 * Test script to verify EMI admin API responses
 * This will help diagnose why the frontend is showing zeros
 */

const http = require('http');

// Admin credentials
const ADMIN_EMAIL = 'admin@smarttech.com';
const ADMIN_PASSWORD = 'AdminPassword123';

let authToken = null;

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
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

async function login() {
  console.log('\n=== Step 1: Login as Admin ===');
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const response = await makeRequest(options, {
    identifier: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (response.statusCode === 200) {
    authToken = response.data.token;
    console.log('✓ Login successful');
    console.log('  Token:', authToken.substring(0, 50) + '...');
  } else {
    console.log('✗ Login failed');
    console.log('  Status:', response.statusCode);
    console.log('  Response:', response.data);
    throw new Error('Login failed');
  }
}

async function testProvidersEndpoint() {
  console.log('\n=== Step 2: Test GET /api/v1/admin/emi/providers ===');
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/admin/emi/providers?page=1&limit=5',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  const response = await makeRequest(options);
  console.log('Status:', response.statusCode);
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  return response.data;
}

async function testPlansEndpoint() {
  console.log('\n=== Step 3: Test GET /api/v1/admin/emi/plans ===');
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/admin/emi/plans?page=1&limit=5',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  const response = await makeRequest(options);
  console.log('Status:', response.statusCode);
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  return response.data;
}

async function analyzeResponse() {
  console.log('\n=== Step 4: Analyze Response Structure ===');
  
  const providersResponse = await testProvidersEndpoint();
  const plansResponse = await testPlansEndpoint();
  
  console.log('\n=== Analysis ===');
  
  // Check providers response
  if (providersResponse.success && providersResponse.data) {
    const providers = providersResponse.data.providers || [];
    const pagination = providersResponse.data.pagination || {};
    
    console.log('\nProviders Response:');
    console.log('  - providers array length:', providers.length);
    console.log('  - providers content:', JSON.stringify(providers, null, 2));
    console.log('  - pagination.total:', pagination.total);
    console.log('  - pagination.page:', pagination.page);
    console.log('  - pagination.limit:', pagination.limit);
    
    console.log('\n  What frontend expects:');
    console.log('    - response.data.providers (array)');
    console.log('    - response.data.pagination.total (total count)');
  }
  
  // Check plans response
  if (plansResponse.success && plansResponse.data) {
    const plans = plansResponse.data.plans || [];
    const pagination = plansResponse.data.pagination || {};
    
    console.log('\nPlans Response:');
    console.log('  - plans array length:', plans.length);
    console.log('  - plans content:', JSON.stringify(plans, null, 2));
    console.log('  - pagination.total:', pagination.total);
    console.log('  - pagination.page:', pagination.page);
    console.log('  - pagination.limit:', pagination.limit);
    
    console.log('\n  What frontend expects:');
    console.log('    - response.data.plans (array)');
    console.log('    - response.data.pagination.total (total count)');
  }
  
  console.log('\n=== Diagnosis ===');
  console.log('The frontend code does:');
  console.log('  const providers = providersResponse.data?.providers || [];');
  console.log('  const plans = plansResponse.data?.plans || [];');
  console.log('  totalProviders: providers.length,  // This is WRONG!');
  console.log('  totalPlans: plans.length,          // This is WRONG!');
  console.log('');
  console.log('The problem: frontend uses providers.length instead of pagination.total');
  console.log('Since limit=5, it only counts the first 5 items, not the total!');
}

async function main() {
  try {
    await login();
    await analyzeResponse();
    console.log('\n=== Test Complete ===\n');
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
