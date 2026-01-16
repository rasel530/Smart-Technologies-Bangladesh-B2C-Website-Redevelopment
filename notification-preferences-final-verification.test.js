const http = require('http');

// Test configuration
const BASE_URL = 'localhost';
const PORT = 3001;
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkY2JmMTgwMC03Njk1LTQzY2ItYjE1OC1iNDVmYzhhNDkzOWIiLCJlbWFpbCI6InJhc2VsYmVwYXJpODhAZ21haWwuY29tIiwicGhvbmUiOiIrODgwMTkxNDI4NzUzMCIsInJvbGUiOiJjdXN0b21lciIsInNlc3Npb25JZCI6ImI5Mjg4OTRjZjViNzFkYzUyNzhkMDIxNzliNGI2M2QyMjczODBkNjlkNjIxMWZjMmVhZGJkYzZjOGFmMTgxNjkiLCJpYXQiOjE3Njg1Nzg1OTQsImV4cCI6MTc2OTE4MzM5NCwiYXVkIjoic21hcnQtZWNvbW1lcmNlLWNsaWVudHMiLCJpc3MiOiJzbWFydC1lY29tbWVyY2UtYXBpIn0.N2DSXR1P9Mb4kwVfRl3A1V4bvmuYkrzZabC_gfDsxGk';

const PUT_DATA = {
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: true,
  promotionalEmails: true,
  newsletterSubscription: false,
  notificationFrequency: 'daily'
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
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

async function runTests() {
  console.log('='.repeat(80));
  console.log('NOTIFICATION PREFERENCES FINAL VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log('');

  // Test 1: PUT request to update notification preferences
  console.log('TEST 1: PUT /api/v1/profile/preferences/notifications');
  console.log('-'.repeat(80));
  console.log('Request Body:', JSON.stringify(PUT_DATA, null, 2));
  console.log('');

  try {
    const putResponse = await makeRequest(
      'PUT',
      '/api/v1/profile/preferences/notifications',
      PUT_DATA
    );

    console.log('Response Status Code:', putResponse.statusCode);
    console.log('Response Body:', JSON.stringify(putResponse.body, null, 2));
    console.log('');

    // Check if the 500 error is resolved
    if (putResponse.statusCode === 500) {
      console.log('❌ FAILED: 500 error still present!');
    } else if (putResponse.statusCode === 200 || putResponse.statusCode === 201) {
      console.log('✓ SUCCESS: 500 error resolved! Status:', putResponse.statusCode);
    } else {
      console.log('⚠ WARNING: Unexpected status code:', putResponse.statusCode);
    }
    console.log('');

    // Test 2: GET request to verify data persistence
    console.log('TEST 2: GET /api/v1/profile/preferences/notifications');
    console.log('-'.repeat(80));

    const getResponse = await makeRequest(
      'GET',
      '/api/v1/profile/preferences/notifications'
    );

    console.log('Response Status Code:', getResponse.statusCode);
    console.log('Response Body:', JSON.stringify(getResponse.body, null, 2));
    console.log('');

    // Verify data persistence
    if (getResponse.statusCode === 200 && getResponse.body.data) {
      const data = getResponse.body.data;
      console.log('Data Persistence Verification:');
      console.log('-'.repeat(80));

      let allMatch = true;
      const fields = ['emailNotifications', 'smsNotifications', 'whatsappNotifications', 'promotionalEmails', 'newsletterSubscription', 'notificationFrequency'];

      fields.forEach(field => {
        const match = data[field] === PUT_DATA[field];
        const status = match ? '✓' : '❌';
        console.log(`${status} ${field}: Expected=${PUT_DATA[field]}, Actual=${data[field]}`);
        if (!match) allMatch = false;
      });

      console.log('');
      if (allMatch) {
        console.log('✓ SUCCESS: All data persisted correctly!');
      } else {
        console.log('❌ FAILED: Some data did not persist correctly!');
      }

      // Check for promotionalEmails field specifically
      if (data.hasOwnProperty('promotionalEmails')) {
        console.log('✓ SUCCESS: promotionalEmails field is present in response!');
        console.log(`  promotionalEmails value: ${data.promotionalEmails}`);
      } else {
        console.log('❌ FAILED: promotionalEmails field is missing from response!');
      }
    } else {
      console.log('❌ FAILED: Could not verify data persistence (GET request failed)');
    }
    console.log('');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
}

runTests();
