/**
 * Simple OAuth Routes Verification Script
 * Checks if OAuth routes are loaded and accessible
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function verifyRoutes() {
  console.log('\n' + '='.repeat(60));
  console.log('OAUTH ROUTES VERIFICATION');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const tests = [
    {
      name: 'GET /api/v1/oauth/providers',
      method: 'GET',
      url: `${API_URL}/api/v1/oauth/providers`
    },
    {
      name: 'GET /api/v1/oauth/accounts',
      method: 'GET',
      url: `${API_URL}/api/v1/oauth/accounts`,
      headers: { 'Authorization': 'Bearer test-token' }
    },
    {
      name: 'POST /api/v1/oauth/callback/google',
      method: 'POST',
      url: `${API_URL}/api/v1/oauth/callback/google`,
      data: { profile: { id: 'test', email: 'test@test.com' } }
    },
    {
      name: 'POST /api/v1/oauth/callback/facebook',
      method: 'POST',
      url: `${API_URL}/api/v1/oauth/callback/facebook`,
      data: { profile: { id: 'test', email: 'test@test.com' } }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: test.url,
        headers: test.headers || {}
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);

      if (response.status >= 200 && response.status < 300) {
        console.log(`✓ ${test.name} - ${response.status}`);
        passed++;
      } else {
        console.log(`✗ ${test.name} - ${response.status}`);
        failed++;
      }
    } catch (error) {
      if (error.response) {
        console.log(`✗ ${test.name} - ${error.response.status}`);
        failed++;
      } else {
        console.log(`✗ ${test.name} - Connection Error`);
        failed++;
      }
    }
  }

  console.log('\n' + '-'.repeat(60));
  console.log('SUMMARY');
  console.log('-'.repeat(60));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️  Some routes are not accessible.');
    console.log('   Make sure the backend server is running.');
    console.log('   The server may need to be restarted to load new routes.');
    console.log('\n   To restart the server:');
    console.log('   1. Stop the current server (Ctrl+C)');
    console.log('   2. Run: cd backend && npm start');
  } else {
    console.log('\n✅ All OAuth routes are accessible!');
    console.log('   The OAuth integration is ready for testing.');
  }
}

verifyRoutes().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});
