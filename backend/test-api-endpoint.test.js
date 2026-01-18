/**
 * Simple test to check if notification preferences endpoint is accessible
 */

const http = require('http');

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkY2JmMTgwMC03Njk1LTQzY2ItYjE1OC1iNDVmYzhhNDkzOWIiLCJlbWFpbCI6InJhc2VsYmVwYXJpODhAZ21haWwuY29tIiwicGhvbmUiOiIrODgwMTkxNDI4NzUzMCIsInJvbGUiOiJjdXN0b21lciIsInNlc3Npb25JZCI6ImI5Mjg4OTRjZjViNzFkYzUyNzhkMDIxNzliNGI2M2QyMjczODBkNjlkNjIxMWZjMmVhZGJkYzZjOGFmMTgxNjkiLCJpYXQiOjE3Njg1Nzg1OTQsImV4cCI6MTc2OTE4MzM5NCwiYXVkIjoic21hcnQtZWNvbW1lcmNlLWNsaWVudHMiLCJpc3MiOiJzbWFydC1lY29tbWVyY2UtYXBpIn0.N2DSXR1P9Mb4kwVfRl3A1V4bvmuYkrzZabC_gfDsxGk';

const testData = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  orderUpdates: true,
  securityAlerts: true
};

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            body: parsedBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testNotificationPreferences() {
  console.log('Testing PUT /api/v1/profile/preferences/notifications');
  console.log('Request data:', JSON.stringify(testData, null, 2));

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/profile/preferences/notifications',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    }
  };

  try {
    const response = await makeRequest(options, testData);
    
    console.log('\nResponse Status:', response.statusCode);
    console.log('Response Body:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 500) {
      console.log('\n❌ FAILED: 500 Internal Server Error');
    } else if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('\n✅ PASSED: Request successful');
      
      if (response.body && response.body.data && response.body.data.preferences) {
        const prefs = response.body.data.preferences;
        console.log('\nNew fields check:');
        console.log('  pushNotifications:', prefs.pushNotifications !== undefined ? '✓ Present' : '✗ Missing');
        console.log('  orderUpdates:', prefs.orderUpdates !== undefined ? '✓ Present' : '✗ Missing');
        console.log('  securityAlerts:', prefs.securityAlerts !== undefined ? '✓ Present' : '✗ Missing');
      }
    } else {
      console.log('\n⚠️  Unexpected status code:', response.statusCode);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNotificationPreferences();
