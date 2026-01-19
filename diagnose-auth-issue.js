/**
 * Diagnostic Script for Authentication Issue
 * 
 * This script will:
 * 1. Query the database for user raselbepari88@gmail.com
 * 2. Check user status and other relevant fields
 * 3. Verify JWT secret configuration
 * 4. Decode the JWT token to see what data it contains
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// User information from the issue
const USER_EMAIL = 'raselbepari88@gmail.com';
const USER_ID = '252a92b9-25be-4f07-9c32-db217727c16f';

// Sample JWT token from the issue (first part only for testing)
const SAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

async function diagnoseAuthIssue() {
  console.log('='.repeat(80));
  console.log('AUTHENTICATION ISSUE DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log('');

  try {
    // 1. Query user from database
    console.log('1. CHECKING DATABASE STATE');
    console.log('-'.repeat(80));
    
    const user = await prisma.user.findUnique({
      where: { id: USER_ID },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        accountStatus: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      console.log('❌ USER NOT FOUND in database');
      console.log(`   User ID: ${USER_ID}`);
      console.log(`   User Email: ${USER_EMAIL}`);
    } else {
      console.log('✅ USER FOUND in database');
      console.log('');
      console.log('   User Details:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Phone: ${user.phone || 'N/A'}`);
      console.log(`   - Name: ${user.firstName} ${user.lastName}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Status: ${user.status} (Type: ${typeof user.status})`);
      console.log(`   - Account Status: ${user.accountStatus || 'N/A'}`);
      console.log(`   - Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   - Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
      console.log(`   - Created At: ${user.createdAt}`);
      console.log(`   - Updated At: ${user.updatedAt}`);
      console.log(`   - Last Login At: ${user.lastLoginAt || 'Never'}`);
      console.log('');
      
      // Check if status is 'active'
      if (user.status === 'active') {
        console.log('✅ User status is ACTIVE (should be able to authenticate)');
      } else {
        console.log('❌ User status is NOT ACTIVE (will fail authentication)');
        console.log(`   Expected: 'active'`);
        console.log(`   Actual: '${user.status}'`);
        console.log('');
        console.log('   POSSIBLE CAUSES:');
        console.log('   - User account was deactivated by admin');
        console.log('   - User account was suspended due to policy violation');
        console.log('   - User account is still pending verification');
        console.log('   - Database migration changed status field values');
      }
    }

    console.log('');
    console.log('2. CHECKING JWT SECRET CONFIGURATION');
    console.log('-'.repeat(80));
    
    // Check backend .env file
    const backendEnvPath = path.join(__dirname, 'backend', '.env');
    if (fs.existsSync(backendEnvPath)) {
      const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
      const jwtSecretMatch = backendEnv.match(/^JWT_SECRET=(.+)$/m);
      if (jwtSecretMatch) {
        console.log('✅ Backend JWT_SECRET found');
        console.log(`   Value: ${jwtSecretMatch[1].substring(0, 20)}...`);
      } else {
        console.log('❌ Backend JWT_SECRET not found in .env file');
      }
    } else {
      console.log('❌ Backend .env file not found');
    }

    // Check frontend .env file
    const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
    if (fs.existsSync(frontendEnvPath)) {
      const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
      const nextauthSecretMatch = frontendEnv.match(/^NEXTAUTH_SECRET=(.+)$/m);
      if (nextauthSecretMatch) {
        console.log('✅ Frontend NEXTAUTH_SECRET found');
        console.log(`   Value: ${nextauthSecretMatch[1].substring(0, 20)}...`);
      } else {
        console.log('❌ Frontend NEXTAUTH_SECRET not found in .env file');
      }
    } else {
      console.log('❌ Frontend .env file not found');
    }

    console.log('');
    console.log('3. DECODING JWT TOKEN (if provided)');
    console.log('-'.repeat(80));
    
    // Try to decode the sample token
    try {
      const decoded = jwt.decode(SAMPLE_TOKEN, { complete: true });
      if (decoded) {
        console.log('✅ Token decoded successfully');
        console.log('   Header:', JSON.stringify(decoded.header, null, 2));
        console.log('   Payload:', JSON.stringify(decoded.payload, null, 2));
      }
    } catch (error) {
      console.log('⚠️  Could not decode sample token (might be truncated)');
      console.log(`   Error: ${error.message}`);
    }

    console.log('');
    console.log('4. ANALYZING AUTHENTICATION FLOW');
    console.log('-'.repeat(80));
    console.log('');
    console.log('Expected Flow:');
    console.log('1. User logs in with credentials');
    console.log('2. NextAuth calls backend /auth/login API');
    console.log('3. Backend validates credentials and returns JWT token');
    console.log('4. NextAuth stores backend token in session');
    console.log('5. Frontend API client sends backend token to backend APIs');
    console.log('6. Backend validates token and checks user.status === "active"');
    console.log('');
    console.log('Current Issue:');
    console.log('- Step 6 is failing because user.status !== "active"');
    console.log('- Backend returns 401 with "Account is deactivated" error');
    console.log('');

    console.log('='.repeat(80));
    console.log('DIAGNOSTIC SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    
    if (user) {
      console.log('ROOT CAUSE ANALYSIS:');
      console.log('');
      console.log(`User ${USER_EMAIL} (ID: ${USER_ID}) has status: '${user.status}'`);
      console.log('');
      
      if (user.status !== 'active') {
        console.log('❌ PRIMARY ISSUE: User status is not "active"');
        console.log('');
        console.log('POSSIBLE SOLUTIONS:');
        console.log('1. Update user status to "active" in database:');
        console.log(`   UPDATE users SET status = 'active' WHERE id = '${USER_ID}';`);
        console.log('');
        console.log('2. Check if there was a recent database migration that changed status values');
        console.log('');
        console.log('3. Verify if account was intentionally deactivated');
        console.log('');
        console.log('4. Check backend authentication middleware for any recent changes');
      } else {
        console.log('✅ User status is "active" - issue may be elsewhere');
        console.log('');
        console.log('OTHER POSSIBLE ISSUES:');
        console.log('1. JWT secret mismatch between frontend and backend');
        console.log('2. Token expired or invalid');
        console.log('3. Token not being sent correctly in Authorization header');
        console.log('4. Middleware logic issue');
      }
    } else {
      console.log('❌ USER NOT FOUND - Cannot authenticate');
      console.log('');
      console.log('POSSIBLE REASONS:');
      console.log('1. User ID is incorrect');
      console.log('2. User was deleted from database');
      console.log('3. Database connection issue');
    }

  } catch (error) {
    console.error('❌ ERROR during diagnosis:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnostic
diagnoseAuthIssue();
