/**
 * Test script to verify Local Payment API endpoint
 * This script tests the API endpoint directly without authentication
 * to verify the endpoint is working correctly.
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/admin/local-payment/methods',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('========================================');
console.log('Testing Local Payment API Endpoint');
console.log('========================================\n');

console.log('Request details:');
console.log(`  URL: http://localhost:3001/api/v1/admin/local-payment/methods`);
console.log(`  Method: GET`);
console.log(`  Headers: Content-Type: application/json\n`);

const req = http.request(options, (res) => {
  console.log('Response received:');
  console.log(`  Status: ${res.statusCode}`);
  console.log(`  Status Message: ${res.statusMessage}`);
  console.log(`  Headers:`, res.headers);
  console.log('');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('Response body:');
      console.log(JSON.stringify(jsonData, null, 2));

      if (jsonData.success === true && jsonData.data) {
        console.log(`\n✓ API returned success with ${jsonData.data.length} payment methods`);
        console.log(`  Methods:`, jsonData.data.map(m => `${m.displayName} (${m.code})`));
      } else if (jsonData.success === false) {
        console.log('\n✗ API returned error:');
        console.log(`  Error: ${jsonData.error || 'Unknown error'}`);
        console.log(`  Message: ${jsonData.message || 'No message'}`);
        if (jsonData.details) {
          console.log(`  Details:`, jsonData.details);
        }
      } else {
        console.log('\n⚠️  Unexpected response format');
      }
    } catch (e) {
      console.log('\n✗ Failed to parse response as JSON:');
      console.log('  Error:', e.message);
      console.log('  Raw response:', data);
    }

    console.log('\n========================================');
  });
});

req.on('error', (error) => {
  console.log('\n========================================');
  console.log('✗ Request failed:');
  console.log('========================================');
  console.log('Error:', error.message);
  console.log('Code:', error.code);
  console.log('');
  console.log('Possible causes:');
  console.log('  1. Backend server is not running');
  console.log('  2. Backend is running on a different port');
  console.log('  3. Firewall or network issue');
  console.log('  4. Port 3001 is blocked');
  console.log('');
  console.log('Solutions:');
  console.log('  1. Start the backend server: cd backend && npm start');
  console.log('  2. Check if backend is running on correct port');
  console.log('  3. Check backend logs for errors');
  console.log('========================================');
});

req.setTimeout(10000, () => {
  req.destroy();
  console.log('\n========================================');
  console.log('✗ Request timeout after 10 seconds');
  console.log('========================================');
  console.log('The backend server may be unresponsive or not running.');
  console.log('========================================');
});

req.end();
