const http = require('http');

// Simple HTTP test for login
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
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 10000
};

console.log('Testing login with demo.user1@smarttech.bd...');
console.log('Request body:', postData);

const req = http.request(options, (res) => {
  console.log(`\n✅ Response Status: ${res.statusCode}`);
  console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request Error:', error.message);
  if (error.code === 'ECONNRESET') {
    console.error('Connection reset - backend closed connection');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('Request timeout - backend did not respond in time');
  }
});

req.on('timeout', () => {
  console.error('\n❌ Request Timeout after 10 seconds');
  req.destroy();
});

req.write(postData);
req.end();
