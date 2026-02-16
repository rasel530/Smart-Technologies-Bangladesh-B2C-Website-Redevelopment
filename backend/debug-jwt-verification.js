const jwt = require('jsonwebtoken');
const { authMiddleware } = require('./middleware/auth');

console.log('=== JWT VERIFICATION DIAGNOSTIC ===\n');

// Step 1: Generate a test token
console.log('Step 1: Generating test token...');
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

console.log('✓ Token generated successfully');
console.log('  Token length:', token.length);
console.log('  Token prefix:', token.substring(0, 30) + '...\n');

// Step 2: Decode token without verification (to see payload)
console.log('Step 2: Decoding token without verification...');
const decodedWithoutVerify = jwt.decode(token);
console.log('✓ Token decoded');
console.log('  Payload:', JSON.stringify(decodedWithoutVerify, null, 2));
console.log('  userId exists:', !!decodedWithoutVerify.userId);
console.log('  userId value:', decodedWithoutVerify.userId);
console.log('  userId type:', typeof decodedWithoutVerify.userId);
console.log('');

// Step 3: Verify token using authMiddleware.verifyToken (WITHOUT await - simulating the bug)
console.log('Step 3: Calling verifyToken WITHOUT await (simulating the bug)...');
try {
  const decodedWithoutAwait = authMiddleware.verifyToken(token);
  console.log('✓ verifyToken called (without await)');
  console.log('  Return type:', typeof decodedWithoutAwait);
  console.log('  Is Promise?:', decodedWithoutAwait instanceof Promise);
  console.log('  Has userId property?:', decodedWithoutAwait.hasOwnProperty('userId'));
  console.log('  userId value:', decodedWithoutAwait.userId);
  console.log('  userId type:', typeof decodedWithoutAwait.userId);
  console.log('');

  // Step 4: Try to use decodedWithoutAwait.userId in a Prisma query simulation
  console.log('Step 4: Simulating Prisma query with decodedWithoutAwait.userId...');
  console.log('  Attempting to access decodedWithoutAwait.userId:', decodedWithoutAwait.userId);
  console.log('  Result: userId is', decodedWithoutAwait.userId === undefined ? 'UNDEFINED' : 'defined');
  console.log('');

} catch (error) {
  console.error('✗ Error:', error.message);
  console.log('');
}

// Step 5: Verify token using authMiddleware.verifyToken (WITH await - correct approach)
console.log('Step 5: Calling verifyToken WITH await (correct approach)...');
(async () => {
  try {
    const decodedWithAwait = await authMiddleware.verifyToken(token);
    console.log('✓ verifyToken called (with await)');
    console.log('  Return type:', typeof decodedWithAwait);
    console.log('  Is Promise?:', decodedWithAwait instanceof Promise);
    console.log('  Has userId property?:', decodedWithAwait.hasOwnProperty('userId'));
    console.log('  userId value:', decodedWithAwait.userId);
    console.log('  userId type:', typeof decodedWithAwait.userId);
    console.log('');

    // Step 6: Try to use decodedWithAwait.userId in a Prisma query simulation
    console.log('Step 6: Simulating Prisma query with decodedWithAwait.userId...');
    console.log('  Attempting to access decodedWithAwait.userId:', decodedWithAwait.userId);
    console.log('  Result: userId is', decodedWithAwait.userId === undefined ? 'UNDEFINED' : 'defined');
    console.log('');

    console.log('=== DIAGNOSTIC COMPLETE ===');
    console.log('\nCONCLUSION:');
    console.log('When verifyToken() is called WITHOUT await:');
    console.log('  - Returns a Promise object, not the decoded token');
    console.log('  - decoded.userId is undefined (Promise objects don\'t have a userId property)');
    console.log('  - This causes Prisma query to fail with "id: undefined"');
    console.log('\nWhen verifyToken() is called WITH await:');
    console.log('  - Returns the actual decoded token object');
    console.log('  - decoded.userId contains the user ID');
    console.log('  - Prisma query works correctly');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();
