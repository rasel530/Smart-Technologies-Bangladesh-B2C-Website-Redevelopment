/**
 * Simple test to verify routes are loaded
 */
const http = require('http');

async function testRoute() {
  console.log('Testing route: /api/v1/user/preferences/notifications');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/user/preferences/notifications',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9c2VyZXNzaWl'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response body:', body);
        
        if (res.statusCode === 200) {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(body)
          });
        } else {
          reject({
            statusCode: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject({
        error: err.message
      });
    });

    req.end();
  });
}

testRoute().then(result => {
  console.log('Test result:', result);
  console.log('Route is working!' + (result.statusCode === 200));
}).catch(error => {
  console.error('Test failed:', error);
});
