/**
 * Diagnostic Script for Authentication Issue
 * This script will help identify why JWT tokens are being rejected
 */

const jwt = require('jsonwebtoken');
const { configService } = require('./services/config');
const { authMiddleware } = require('./middleware/auth');

console.log('='.repeat(80));
console.log('AUTHENTICATION DIAGNOSTIC SCRIPT');
console.log('='.repeat(80));

// Test 1: Check JWT_SECRET configuration
console.log('\n[TEST 1] JWT_SECRET Configuration');
console.log('-'.repeat(80));
const jwtSecretFromEnv = process.env.JWT_SECRET;
const jwtSecretFromConfig = configService.get('JWT_SECRET');
const jwtSecretFromConfigMethod = configService.getJwtSecret();

console.log('JWT_SECRET from process.env:', jwtSecretFromEnv ? jwtSecretFromEnv.substring(0, 20) + '...' : 'undefined');
console.log('JWT_SECRET from config.get():', jwtSecretFromConfig ? jwtSecretFromConfig.substring(0, 20) + '...' : 'undefined');
console.log('JWT_SECRET from config.getJwtSecret():', jwtSecretFromConfigMethod ? jwtSecretFromConfigMethod.substring(0, 20) + '...' : 'undefined');

if (jwtSecretFromEnv !== jwtSecretFromConfig) {
  console.log('❌ MISMATCH: process.env.JWT_SECRET != config.get(JWT_SECRET)');
} else {
  console.log('✅ MATCH: Both sources return the same JWT_SECRET');
}

// Test 2: Generate a test token using login endpoint method
console.log('\n[TEST 2] Token Generation (Login Endpoint Method)');
console.log('-'.repeat(80));
try {
  const testPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    phone: '+8801712345678',
    role: 'CUSTOMER',
    sessionId: 'test-session-id'
  };

  // Simulate login endpoint token generation
  const tokenFromLoginMethod = jwt.sign(
    testPayload,
    jwtSecretFromEnv,
    {
      expiresIn: '7d',
      issuer: 'smart-ecommerce-api',
      audience: 'smart-ecommerce-clients'
    }
  );

  console.log('✅ Token generated successfully');
  console.log('Token length:', tokenFromLoginMethod.length);
  console.log('Token preview:', tokenFromLoginMethod.substring(0, 50) + '...');

  // Test 3: Verify the token using authentication middleware method
  console.log('\n[TEST 3] Token Verification (Auth Middleware Method)');
  console.log('-'.repeat(80));
  try {
    const decodedToken = authMiddleware.verifyToken(tokenFromLoginMethod);
    console.log('✅ Token verified successfully');
    console.log('Decoded userId:', decodedToken.userId);
    console.log('Decoded email:', decodedToken.email);
    console.log('Token issuer:', decodedToken.iss);
    console.log('Token audience:', decodedToken.aud);
    console.log('Token expires at:', new Date(decodedToken.exp * 1000).toISOString());
  } catch (verifyError) {
    console.log('❌ Token verification FAILED');
    console.log('Error name:', verifyError.name);
    console.log('Error message:', verifyError.message);
  }

  // Test 4: Verify token with direct JWT verify using config secret
  console.log('\n[TEST 4] Token Verification (Direct JWT with Config Secret)');
  console.log('-'.repeat(80));
  try {
    const decodedDirect = jwt.verify(tokenFromLoginMethod, jwtSecretFromConfig, {
      issuer: 'smart-ecommerce-api',
      audience: 'smart-ecommerce-clients'
    });
    console.log('✅ Token verified successfully with config secret');
    console.log('Decoded userId:', decodedDirect.userId);
  } catch (directError) {
    console.log('❌ Token verification FAILED with config secret');
    console.log('Error name:', directError.name);
    console.log('Error message:', directError.message);
  }

  // Test 5: Check token structure
  console.log('\n[TEST 5] Token Structure Analysis');
  console.log('-'.repeat(80));
  const parts = tokenFromLoginMethod.split('.');
  console.log('Token parts count:', parts.length);
  console.log('Header (base64):', parts[0].substring(0, 50) + '...');
  console.log('Payload (base64):', parts[1].substring(0, 50) + '...');
  console.log('Signature (base64):', parts[2].substring(0, 50) + '...');

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('\nDecoded Header:', JSON.stringify(header, null, 2));
    console.log('\nDecoded Payload:', JSON.stringify(payload, null, 2));
  } catch (decodeError) {
    console.log('❌ Failed to decode token parts:', decodeError.message);
  }

  // Test 6: Simulate API request with token
  console.log('\n[TEST 6] Simulate API Request');
  console.log('-'.repeat(80));
  const mockRequest = {
    headers: {
      authorization: `Bearer ${tokenFromLoginMethod}`
    }
  };

  const extractedToken = authMiddleware.extractToken(mockRequest);
  console.log('Extracted token:', extractedToken ? extractedToken.substring(0, 20) + '...' : 'null');

  if (extractedToken) {
    try {
      const verified = authMiddleware.verifyToken(extractedToken);
      console.log('✅ Token verified in simulated request');
      console.log('Verified userId:', verified.userId);
    } catch (verifyError) {
      console.log('❌ Token verification FAILED in simulated request');
      console.log('Error:', verifyError.message);
    }
  } else {
    console.log('❌ Failed to extract token from Authorization header');
  }

} catch (signError) {
  console.log('❌ Token generation FAILED');
  console.log('Error name:', signError.name);
  console.log('Error message:', signError.message);
  console.log('Error stack:', signError.stack);
}

// Test 7: Check environment variable loading
console.log('\n[TEST 7] Environment Variable Loading');
console.log('-'.repeat(80));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSTIC COMPLETE');
console.log('='.repeat(80));
