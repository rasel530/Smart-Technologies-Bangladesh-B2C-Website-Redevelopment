const jwt = require('jsonwebtoken');

const JWT_SECRET = 'smarttech-super-secret-jwt-key-change-in-production-2024';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYTU5YmY0Ny00YjY2LTQzMWQtYmE2My1hMGE2OTQzNzc5OGYiLCJlbWFpbCI6ImFkbWluQHNtYXJ0dGVjaC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzA1NTQ2NDMsImV4cCI6MTc3MTE1OTQ0MywiYXVkIjoic21hcnQtZWNvbW1lcmNlLWNsaWVudHMiLCJpc3MiOiJzbWFydC1lY29tbWVyY2UtYXBpIn0.aW-y4OcW88nKIesu7ZOf0_21KaE0n-t1p6uXnUxgHAw';

console.log('Token to verify:', token);
console.log('');

// Decode without verification
const decoded = jwt.decode(token);
console.log('Decoded (no verify):', JSON.stringify(decoded, null, 2));
console.log('');

// Try to verify
try {
  const verified = jwt.verify(token, JWT_SECRET, {
    issuer: 'smart-ecommerce-api',
    audience: 'smart-ecommerce-clients'
  });
  console.log('Verification successful!');
  console.log('Verified:', JSON.stringify(verified, null, 2));
} catch (error) {
  console.log('Verification failed:', error.message);
  console.log('Error name:', error.name);
}
