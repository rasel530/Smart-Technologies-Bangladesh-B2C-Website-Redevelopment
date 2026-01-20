#!/usr/bin/env node

/**
 * ENDPOINT VERIFICATION TEST
 * Quick verification of key API endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

const endpoints = [
  { method: 'GET', path: '/health', description: 'Health check' },
  { method: 'GET', path: '/products', description: 'Products list' },
  { method: 'GET', path: '/categories', description: 'Categories list' },
  { method: 'GET', path: '/brands', description: 'Brands list' },
  { method: 'POST', path: '/auth/register', description: 'User registration', data: { email: `test-${Date.now()}@example.com`, password: 'Test123456', firstName: 'Test', lastName: 'User', phone: '+8801700000000' } },
];

async function testEndpoint(endpoint) {
  try {
    const config = {
      method: endpoint.method,
      url: `${API_BASE_URL}${endpoint.path}`,
    };

    if (endpoint.data) {
      config.data = endpoint.data;
    }

    const response = await axios(config);
    console.log(`✓ PASS: ${endpoint.description} (${endpoint.method} ${endpoint.path}) - Status: ${response.status}`);
    return { endpoint: endpoint.path, status: 'pass', statusCode: response.status };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.log(`✗ FAIL: ${endpoint.description} (${endpoint.method} ${endpoint.path}) - ${errorMsg}`);
    return { endpoint: endpoint.path, status: 'fail', error: errorMsg };
  }
}

async function main() {
  console.log('ENDPOINT VERIFICATION TEST');
  console.log('=========================\n');

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const successRate = ((passed / results.length) * 100).toFixed(2);

  console.log('\n=========================');
  console.log('SUMMARY');
  console.log('=========================');
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${successRate}%`);

  if (successRate >= 80) {
    console.log('\n✓ SYSTEM STATUS: HEALTHY');
  } else if (successRate >= 60) {
    console.log('\n⚠ SYSTEM STATUS: MOSTLY HEALTHY');
  } else {
    console.log('\n✗ SYSTEM STATUS: NEEDS ATTENTION');
  }
}

main().catch(console.error);
