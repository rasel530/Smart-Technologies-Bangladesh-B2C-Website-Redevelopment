const http = require('http');

// Test with minimal headers to avoid any middleware issues
const postData = JSON.stringify({
  identifier: 'demo.user1@smarttech.bd',
  password: 'Demo123456'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Accept': 'application/json'
  },
  timeout: 15000
};

console.log('Testing login with minimal headers...');
console.log('Request:', postData);

let responseData = '';
let responseReceived = false;

const req = http.request(options, (res) => {
  console.log(`\n✅ Response received!`);
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  responseReceived = true;
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      const jsonData = JSON.parse(responseData);
      console.log(JSON.stringify(jsonData, null, 2));
      console.log('\n✅ Login test completed successfully!');
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request Error:', error.message);
  console.error('Error code:', error.code);
  console.error('Error details:', error);
});

req.on('timeout', () => {
  console.error('\n❌ Request Timeout after 15 seconds');
  console.error('Response received:', responseReceived);
  req.destroy();
});

req.on('close', () => {
  console.log('\nConnection closed');
  if (!responseReceived) {
    console.error('❌ Connection closed without response');
  }
});

req.write(postData);
req.end();
