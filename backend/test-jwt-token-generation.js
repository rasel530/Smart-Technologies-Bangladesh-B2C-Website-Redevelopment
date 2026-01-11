/**
 * Test JWT Token Generation with New Configuration
 * 
 * This test verifies that JWT tokens are generated correctly
 * with the new JWT_EXPIRES_IN=7d configuration
 */

const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

console.log('=== JWT Token Generation Test ===\n');

// Check environment variables
console.log('Environment Configuration:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? `${process.env.JWT_SECRET.substring(0, 20)}...` : 'NOT SET');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'NOT SET (will use default)');
console.log('');

// Test token generation
const testPayload = {
    userId: 'test-user-123',
    email: 'test@example.com',
    phone: '+1234567890',
    role: 'CUSTOMER',
    sessionId: 'session-123'
};

console.log('Test Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('');

try {
    const token = jwt.sign(
        testPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('✓ Token generated successfully');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    console.log('');

    // Decode token to verify payload
    const decoded = jwt.decode(token);
    console.log('Decoded Token:');
    console.log('Payload:', JSON.stringify(decoded, null, 2));
    console.log('');

    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✓ Token verified successfully');
    console.log('Verified payload:', JSON.stringify(verified, null, 2));
    console.log('');

    // Check if token length is acceptable
    if (token.length >= 150) {
        console.log('✓ Token length is acceptable (>= 150 characters)');
    } else {
        console.log('✗ Token length is too short (< 150 characters)');
        console.log('  This may cause "Invalid token" errors during authentication');
    }

} catch (error) {
    console.error('✗ Token generation failed:', error.message);
    console.error('Error details:', error);
}

console.log('\n=== Test Complete ===');
