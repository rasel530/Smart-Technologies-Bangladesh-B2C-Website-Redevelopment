const http = require('http');

const API_BASE_URL = 'localhost';
const API_PORT = 3001;

// Test login with remember me
const loginData = {
  identifier: 'test@example.com',
  password: 'TestPassword123!',
  rememberMe: true
};

console.log('Testing login with remember me...');
console.log('Request:', JSON.stringify(loginData, null, 2));

const postData = JSON.stringify(loginData);

const options = {
  hostname: API_BASE_URL,
  port: API_PORT,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('\nResponse Status:', res.statusCode);
  console.log('Response Headers:', JSON.stringify(res.headers, null, 2));

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      // Check for rememberToken
      if (parsed.rememberToken) {
        console.log('\n✓ rememberToken found:', parsed.rememberToken.substring(0, 30) + '...');
      } else {
        console.log('\n✗ rememberToken NOT found in response');
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();
