const jwt = require('jsonwebtoken');

const JWT_SECRET = 'smarttech-super-secret-jwt-key-change-in-production-2024';
const userId = 'ea59bf47-4b66-431d-ba63-a0a69437798f';

const token = jwt.sign(
  {
    userId: userId,
    email: 'admin@smarttech.com',
    role: 'admin'
  },
  JWT_SECRET,
  {
    expiresIn: '7d',
    issuer: 'smart-ecommerce-api',
    audience: 'smart-ecommerce-clients'
  }
);

console.log('Generated JWT token:');
console.log(token);
console.log('');
console.log('Test command:');
console.log(`curl -i -X GET http://localhost:3001/api/v1/rbac/roles -H "Authorization: Bearer ${token}"`);
