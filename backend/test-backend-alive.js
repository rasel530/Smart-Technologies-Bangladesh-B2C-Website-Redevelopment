const http = require('http');

// Simple test to check if backend is responding
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/health',
  method: 'GET',
  timeout: 5000
};

console.log('Testing backend health...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    console.log('✅ Backend is responding!');
  });
});

req.on('error', (error) => {
  console.error('❌ Backend error:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('Connection refused - backend may not be running');
  }
});

req.on('timeout', () => {
  console.error('❌ Request timeout');
  req.destroy();
});

req.end();
