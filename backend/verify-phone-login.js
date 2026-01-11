/**
 * Verify phone number login works with test credentials
 */

const http = require('http');

const BACKEND_URL = 'http://localhost:3001/api/v1';
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const testCredentials = {
  phone: '+8801700000000',
  password: 'TestPassword123!'
};

console.log('=== Verifying Phone Number Login ===\n');
console.log('Test credentials:');
console.log('  Phone:', testCredentials.phone);
console.log('  Password:', testCredentials.password);
console.log('\nSending login request to:', `${BACKEND_URL}/auth/login`);
console.log('');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
    console.log('\nResponse Body:');
    
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✓ SUCCESS: Phone number login works!');
        console.log('  Status Code:', res.statusCode);
        console.log('  Token received:', jsonData.token ? 'Yes' : 'No');
        console.log('  User ID:', jsonData.user?.id || 'N/A');
        console.log('  User Email:', jsonData.user?.email || 'N/A');
        console.log('  User Phone:', jsonData.user?.phone || 'N/A');
      } else {
        console.log('\n✗ FAILED: Phone number login did not return 200');
        console.log('  Status Code:', res.statusCode);
        console.log('  Error:', jsonData.message || jsonData.error || 'Unknown error');
      }
    } catch (error) {
      console.log('Raw response:', data);
      console.log('\n✗ ERROR: Failed to parse response as JSON');
      console.log('  Error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('\n✗ Request failed:');
  console.error('  Error:', error.message);
  console.error('\nMake sure the backend server is running on http://localhost:3000');
  process.exit(1);
});

req.write(JSON.stringify(testCredentials));
req.end();
