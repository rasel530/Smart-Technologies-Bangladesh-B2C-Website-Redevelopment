const http = require('http');

// Admin credentials
const ADMIN_EMAIL = 'admin@smarttech.com';
const ADMIN_PASSWORD = 'Admin@123';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
            rawBody: body
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: body
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

async function getAdminToken() {
  try {
    console.log('Logging in as admin user...');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, {
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    console.log('Response status:', response.statusCode);
    console.log('Response body:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200 && response.body && response.body.token) {
      console.log('\nAdmin JWT token:', response.body.token);
      return response.body.token;
    } else {
      console.error('Failed to get admin token');
      return null;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

getAdminToken();
