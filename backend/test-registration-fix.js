// Test script to verify registration endpoint is working
const http = require('http');

const testData = {
  email: `testuser${Date.now()}@example.com`,
  password: 'SecureP@ssw0rd!',
  confirmPassword: 'SecureP@ssw0rd!',
  firstName: 'John',
  lastName: 'Doe',
  phone: `+880171234${Math.floor(1000 + Math.random() * 9000)}`,
  dateOfBirth: '1990-01-01',
  gender: 'male',
  division: 'DHAKA',
  district: 'Dhaka',
  upazila: 'Dhaka',
  addressLine1: '123 Test Street',
  addressLine2: 'Apt 4B',
  postalCode: '1000',
  preferredLanguage: 'en',
  marketingConsent: false,
  termsAccepted: true
};

const options = {
  host: 'localhost',
  port: 3001,
  path: '/api/v1/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(testData))
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 201) {
      console.log('✅ Registration successful!');
      process.exit(0);
    } else {
      console.log('❌ Registration failed');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(JSON.stringify(testData));
req.end();
