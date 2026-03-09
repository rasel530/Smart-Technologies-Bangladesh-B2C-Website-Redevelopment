const { body, validationResult } = require('express-validator');

// Test different values for isURL validation
const testValues = [
  'test',
  'http://test.com',
  'https://api.example.com',
  'https://pathao.com/api',
  'https://api.pathao.com',
  'http://localhost:3000',
  '',
  null,
  undefined
];

console.log('Testing isURL() validation behavior:\n');

testValues.forEach(async (value) => {
  const req = { body: { apiEndpoint: value } };
  
  // Create validation chain similar to the one in courier.js
  const validationChain = body('apiEndpoint').optional().isURL();
  
  // Run validation
  await validationChain.run(req);
  
  const errors = validationResult(req);
  
  console.log(`Value: "${value}"`);
  console.log(`Type: ${typeof value}`);
  console.log(`Valid: ${errors.isEmpty() ? 'YES' : 'NO'}`);
  
  if (!errors.isEmpty()) {
    console.log(`Error: ${JSON.stringify(errors.array()[0])}`);
  }
  console.log('---');
});
