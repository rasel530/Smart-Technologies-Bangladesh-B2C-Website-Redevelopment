/**
 * Privacy Settings Fix Verification Test
 * 
 * This test verifies that the privacy settings endpoint now works correctly
 * with the case sensitivity fix and the profileVisibility column addition.
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkY2JmMTgwMC03Njk1LTQzY2ItYjE1OC1iNDVmYzhhNDkzOWIiLCJlbWFpbCI6InJhc2VsYmVwYXJpODhAZ21haWwuY29tIiwicGhvbmUiOiIrODgwMTkxNDI4NzUzMCIsInJvbGUiOiJDVVNUT01FUiIsInNlc3Npb25JZCI6IjJmYzMxNWFiNTkzOGFhMzUxMjU3OWYxNDZhODFhN2IyYTM2ZmE2NTI1Yjc3YWZiMjFiZDM3YTJjOWFmMzY5Y2EiLCJpYXQiOjE3NjgyODgyNDYsImV4cCI6MTc2ODg5MzA0NiwiYXVkIjoic21hcnQtZWNvbW1lcmNlLWNsaWVudHMiLCJpc3MiOiJzbWFydC1lY29tbWVyY2UtYXBpIn0.IhnsHpW_oun03QfACKN6N49XsMjrAMzQ36aqpsFRFE0';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: response,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: body,
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

// Test cases
const testCases = [
  {
    name: 'GET privacy settings',
    method: 'GET',
    path: '/api/v1/profile/preferences/privacy',
    expectedStatus: 200,
    validate: (response) => {
      if (!response.data.success) return 'Response should have success: true';
      if (!response.data.data?.settings) return 'Response should have settings object';
      if (typeof response.data.data.settings.profileVisibility !== 'string') return 'profileVisibility should be a string';
      if (!['public', 'private', 'friends_only'].includes(response.data.data.settings.profileVisibility)) {
        return `profileVisibility should be one of: public, private, friends_only. Got: ${response.data.data.settings.profileVisibility}`;
      }
      return null;
    },
  },
  {
    name: 'PUT privacy settings with "public" visibility',
    method: 'PUT',
    path: '/api/v1/profile/preferences/privacy',
    data: {
      profileVisibility: 'public',
      showEmail: true,
      showPhone: true,
      showAddress: true,
      allowSearchByEmail: true,
      allowSearchByPhone: true,
      dataSharingEnabled: true,
    },
    expectedStatus: 200,
    validate: (response) => {
      if (!response.data.success) return 'Response should have success: true';
      if (response.data.data.settings.profileVisibility !== 'public') {
        return `Expected profileVisibility to be "public", got "${response.data.data.settings.profileVisibility}"`;
      }
      return null;
    },
  },
  {
    name: 'PUT privacy settings with "private" visibility',
    method: 'PUT',
    path: '/api/v1/profile/preferences/privacy',
    data: {
      profileVisibility: 'private',
      showEmail: false,
      showPhone: false,
      showAddress: false,
      allowSearchByEmail: false,
      allowSearchByPhone: false,
      dataSharingEnabled: false,
    },
    expectedStatus: 200,
    validate: (response) => {
      if (!response.data.success) return 'Response should have success: true';
      if (response.data.data.settings.profileVisibility !== 'private') {
        return `Expected profileVisibility to be "private", got "${response.data.data.settings.profileVisibility}"`;
      }
      return null;
    },
  },
  {
    name: 'PUT privacy settings with "friends_only" visibility',
    method: 'PUT',
    path: '/api/v1/profile/preferences/privacy',
    data: {
      profileVisibility: 'friends_only',
      showEmail: false,
      showPhone: false,
      showAddress: false,
      allowSearchByEmail: false,
      allowSearchByPhone: false,
      dataSharingEnabled: false,
    },
    expectedStatus: 200,
    validate: (response) => {
      if (!response.data.success) return 'Response should have success: true';
      if (response.data.data.settings.profileVisibility !== 'friends_only') {
        return `Expected profileVisibility to be "friends_only", got "${response.data.data.settings.profileVisibility}"`;
      }
      return null;
    },
  },
  {
    name: 'PUT privacy settings with invalid visibility',
    method: 'PUT',
    path: '/api/v1/profile/preferences/privacy',
    data: {
      profileVisibility: 'invalid_value',
    },
    expectedStatus: 400,
    validate: (response) => {
      if (response.data.success) return 'Response should have success: false for invalid input';
      return null;
    },
  },
];

// Run tests
async function runTests() {
  console.log('🧪 Privacy Settings Fix Verification Test\n');
  console.log('=' .repeat(80));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log('-'.repeat(80));

    try {
      const response = await makeRequest(
        testCase.method,
        testCase.path,
        testCase.data
      );

      console.log(`   Status: ${response.statusCode} (expected: ${testCase.expectedStatus})`);

      // Check status code
      if (response.statusCode !== testCase.expectedStatus) {
        console.log(`   ❌ FAILED: Status code mismatch`);
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
        failed++;
        continue;
      }

      // Validate response
      if (testCase.validate) {
        const error = testCase.validate(response);
        if (error) {
          console.log(`   ❌ FAILED: ${error}`);
          console.log(`   Response:`, JSON.stringify(response.data, null, 2));
          failed++;
          continue;
        }
      }

      console.log(`   ✅ PASSED`);
      if (response.data.data?.settings) {
        console.log(`   profileVisibility: ${response.data.data.settings.profileVisibility}`);
      }
      passed++;

    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Test Results:`);
  console.log(`   Total: ${testCases.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! The privacy settings fix is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
