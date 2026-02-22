/**
 * Test script to verify the GET /api/v1/admin/local-payment/methods endpoint WITHOUT authentication
 * This tests if the endpoint works when bypassing authentication
 */

const http = require('http');

// Test configuration
const config = {
  host: 'localhost',
  port: 3001,
  path: '/api/v1/admin/local-payment/methods',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('='.repeat(80));
console.log('LOCAL PAYMENT METHODS ENDPOINT TEST (NO AUTH)');
console.log('='.repeat(80));
console.log('Testing GET /api/v1/admin/local-payment/methods endpoint WITHOUT auth');
console.log('Host:', config.host);
console.log('Port:', config.port);
console.log('Path:', config.path);
console.log('Method:', config.method);
console.log('Timeout: 15000ms (15 seconds)');
console.log('='.repeat(80));

var req = http.request(config, (res) => {
  console.log('\nResponse received:');
  console.log('Status Code:', res.statusCode);
  console.log('Status Message:', res.statusMessage);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    console.log('='.repeat(80));
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      console.log('='.repeat(80));
      
      // Analyze response
      console.log('\nAnalysis:');
      console.log('-'.repeat(80));
      
      if (res.statusCode === 401) {
        console.log('✓ Status code is 401 (Unauthorized)');
        console.log('This is expected - endpoint requires authentication');
        console.log('But the endpoint is responding (not hanging!)');
        console.log('\n' + '='.repeat(80));
        console.log('TEST RESULT: PARTIAL SUCCESS');
        console.log('='.repeat(80));
        console.log('The endpoint exists and is responding.');
        console.log('The timeout issue is likely in the authentication middleware.');
      } else if (res.statusCode === 200) {
        console.log('✓ Status code is 200 (OK)');
        console.log('\n' + '='.repeat(80));
        console.log('TEST RESULT: SUCCESS');
        console.log('='.repeat(80));
        console.log('The endpoint is working correctly!');
      } else {
        console.log('Status code:', res.statusCode);
        console.log('\n' + '='.repeat(80));
        console.log('TEST RESULT: PARTIAL SUCCESS');
        console.log('='.repeat(80));
        console.log('The endpoint is responding with status code:', res.statusCode);
      }
    } catch (error) {
      console.log('✗ Failed to parse JSON response');
      console.log('Raw response:', data);
      console.log('Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('TEST COMPLETED');
    console.log('='.repeat(80));
  });
});

req.on('error', (error) => {
  console.error('\nRequest Error:');
  console.error('Error:', error.message);
  console.error('Error code:', error.code);
  console.error('\n' + '='.repeat(80));
  console.log('TEST RESULT: FAILED');
  console.log('='.repeat(80));
  console.log('Failed to connect to the server.');
  console.log('Make sure the backend server is running on port 3001');
});

req.setTimeout(15000, () => {
  console.error('\nRequest Timeout:');
  console.error('The request timed out after 15 seconds');
  console.error('This indicates the endpoint is still hanging');
  console.error('\n' + '='.repeat(80));
  console.log('TEST RESULT: FAILED');
  console.log('='.repeat(80));
  console.log('The endpoint is still timing out.');
  req.abort();
});

req.end();

console.log('\nRequest sent. Waiting for response...');
