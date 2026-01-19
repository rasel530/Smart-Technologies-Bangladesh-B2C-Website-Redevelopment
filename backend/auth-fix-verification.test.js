/**
 * Test Authentication Fix Verification
 * 
 * This script verifies:
 * 1. Database state for user raselbepari88@gmail.com
 * 2. Case-sensitivity fix in auth.js
 * 3. Complete authentication flow
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'smarttech_b2c'
};

// Load environment variables from .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (!process.env[key]) {
        process.env[key] = value.trim();
      }
    }
  });
}

const testUserId = '252a92b9-25be-4f07-9c32-db217727c16f';
const testEmail = 'raselbepari88@gmail.com';

async function verifyDatabaseState() {
  console.log('\n=== TEST 1: Database State Verification ===\n');
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Query user status
    const [users] = await connection.execute(
      'SELECT id, email, status, emailVerified, phoneVerified, createdAt, updatedAt FROM users WHERE id = ? OR email = ?',
      [testUserId, testEmail]
    );
    
    if (users.length === 0) {
      console.log('❌ FAILED: User not found in database');
      console.log(`   User ID: ${testUserId}`);
      console.log(`   Email: ${testEmail}`);
      return false;
    }
    
    const user = users[0];
    console.log('✅ User found in database:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    console.log(`   Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log(`   Updated At: ${user.updatedAt}`);
    
    // Verify status is 'active' (lowercase)
    if (user.status !== 'active') {
      console.log(`\n❌ FAILED: User status is '${user.status}', expected 'active'`);
      return false;
    }
    
    console.log('\n✅ PASSED: User status is correctly set to "active"');
    
    // Check if emailVerified and phoneVerified are set
    if (!user.emailVerified) {
      console.log('\n⚠️  WARNING: emailVerified is not set');
    } else {
      console.log('\n✅ PASSED: emailVerified is set');
    }
    
    if (!user.phoneVerified) {
      console.log('⚠️  WARNING: phoneVerified is not set');
    } else {
      console.log('✅ PASSED: phoneVerified is set');
    }
    
    return true;
    
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    return false;
  } finally {
    await connection.end();
  }
}

async function verifyCodeFix() {
  console.log('\n=== TEST 2: Code Fix Verification ===\n');
  
  const authJsPath = path.join(__dirname, 'routes', 'auth.js');
  
  if (!fs.existsSync(authJsPath)) {
    console.log('❌ FAILED: auth.js not found');
    return false;
  }
  
  const authJsContent = fs.readFileSync(authJsPath, 'utf8');
  
  // Check for the case-sensitivity fix
  const hasPendingLowercase = authJsContent.includes("'pending'");
  const hasPendingUppercase = authJsContent.includes("'PENDING'");
  
  console.log('Checking auth.js for case-sensitivity fix:');
  console.log(`   Contains 'pending' (lowercase): ${hasPendingLowercase ? '✅ Yes' : '❌ No'}`);
  console.log(`   Contains 'PENDING' (uppercase): ${hasPendingUppercase ? '❌ Yes (should be removed)' : '✅ No'}`);
  
  if (hasPendingLowercase && !hasPendingUppercase) {
    console.log('\n✅ PASSED: Case-sensitivity fix is correctly applied');
    return true;
  } else if (hasPendingUppercase) {
    console.log('\n❌ FAILED: Still contains uppercase "PENDING"');
    return false;
  } else {
    console.log('\n⚠️  WARNING: Neither "pending" nor "PENDING" found');
    return false;
  }
}

async function testBackendAPI() {
  console.log('\n=== TEST 3: Backend API Authentication Test ===\n');
  
  // This test requires a valid JWT token
  // We'll need to login first to get a token
  
  console.log('Note: This test requires manual login to obtain JWT token');
  console.log('Please:');
  console.log('1. Login at http://localhost:3000 with raselbepari88@gmail.com');
  console.log('2. Open browser DevTools (F12)');
  console.log('3. Go to Application > Local Storage > http://localhost:3000');
  console.log('4. Copy the JWT token value');
  console.log('5. Run: node backend/test-auth-api.js <token>');
  
  return null;
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Authentication Fix Verification Test Suite            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nTest Time: ${new Date().toISOString()}`);
  console.log(`User Email: ${testEmail}`);
  console.log(`User ID: ${testUserId}\n`);
  
  const results = {
    databaseState: null,
    codeFix: null,
    backendAPI: null
  };
  
  // Test 1: Database State
  results.databaseState = await verifyDatabaseState();
  
  // Test 2: Code Fix
  results.codeFix = await verifyCodeFix();
  
  // Test 3: Backend API (requires manual step)
  results.backendAPI = await testBackendAPI();
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('Test Results:');
  console.log(`  1. Database State Verification: ${results.databaseState ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  2. Code Fix Verification: ${results.codeFix ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  3. Backend API Authentication: ${results.backendAPI === null ? '⏸️  SKIPPED (requires manual token)' : (results.backendAPI ? '✅ PASSED' : '❌ FAILED')}`);
  
  const passedCount = [results.databaseState, results.codeFix].filter(r => r === true).length;
  const totalCount = [results.databaseState, results.codeFix].filter(r => r !== null).length;
  
  console.log(`\nOverall: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('\n✅ All automated tests passed!');
    console.log('Next steps:');
    console.log('  1. Test login flow in browser at http://localhost:3000');
    console.log('  2. Test backend API with profile endpoint');
    console.log('  3. Verify no "Account is deactivated" errors');
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
  }
  
  return results;
}

// Run tests
runAllTests()
  .then(results => {
    process.exit(results.databaseState && results.codeFix ? 0 : 1);
  })
  .catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
