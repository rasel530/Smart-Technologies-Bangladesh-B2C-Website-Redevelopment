// Test script to verify registration with all fields including address
const http = require('http');

const testData = {
  email: `fulltest${Date.now()}@example.com`,
  password: 'SecureP@ssw0rd!',
  confirmPassword: 'SecureP@ssw0rd!',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: `+880171234${Math.floor(1000 + Math.random() * 9000)}`,
  dateOfBirth: '1995-06-15',
  gender: 'female',
  division: 'DHAKA',
  district: 'Dhaka',
  upazila: 'Dhaka',
  addressLine1: '456 Main Road',
  addressLine2: 'Floor 3, Apt A',
  postalCode: '1205',
  preferredLanguage: 'en',
  marketingConsent: true,
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
      console.log('✅ Registration with full data successful!');
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
