const http = require('http');

const API_BASE_URL = 'localhost';
const API_PORT = 3001;

// Test 1: Login with rememberMe: true
const loginData1 = {
  identifier: 'test@example.com',
  password: 'TestPassword123!',
  rememberMe: true
};

console.log('\n=== Test 1: Login with rememberMe: true ===');
console.log('Request body:', JSON.stringify(loginData1, null, 2));

makeRequest(loginData1, (res1) => {
  console.log('\nResponse 1:');
  console.log('Status:', res1.statusCode);
  console.log('Body:', JSON.stringify(JSON.parse(res1.body), null, 2));
  
  // Test 2: Login with rememberMe: false
  const loginData2 = {
    identifier: 'test@example.com',
    password: 'TestPassword123!',
    rememberMe: false
  };
  
  console.log('\n=== Test 2: Login with rememberMe: false ===');
  console.log('Request body:', JSON.stringify(loginData2, null, 2));
  
  makeRequest(loginData2, (res2) => {
    console.log('\nResponse 2:');
    console.log('Status:', res2.statusCode);
    console.log('Body:', JSON.stringify(JSON.parse(res2.body), null, 2));
  });
});

function makeRequest(data, callback) {
  const postData = JSON.stringify(data);
  
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
    
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      callback({
        statusCode: res.statusCode,
        headers: res.headers,
        body: responseData
      });
    });
  });
  
  req.on('error', (error) => {
    console.error('Error:', error.message);
  });
  
  req.write(postData);
  req.end();
}
