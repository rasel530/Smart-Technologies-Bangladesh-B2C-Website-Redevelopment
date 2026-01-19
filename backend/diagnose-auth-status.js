/**
 * Diagnostic Script for Authentication Issue
 * 
 * This script will:
 * 1. Query the database for user raselbepari88@gmail.com
 * 2. Check user status and other relevant fields
 * 3. Verify JWT secret configuration
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// User information from the issue
const USER_EMAIL = 'raselbepari88@gmail.com';
const USER_ID = '252a92b9-25be-4f07-9c32-db217727c16f';

// Load database connection from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  return env;
}

const env = loadEnv();
const DATABASE_URL = env?.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@postgres:5432/smart_ecommerce_dev';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function diagnoseAuthIssue() {
  console.log('='.repeat(80));
  console.log('AUTHENTICATION ISSUE DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log('');

  try {
    // 1. Query user from database
    console.log('1. CHECKING DATABASE STATE');
    console.log('-'.repeat(80));
    
    const userQuery = `
      SELECT 
        id,
        email,
        phone,
        "firstName",
        "lastName",
        role,
        status,
        "accountStatus",
        "emailVerified",
        "phoneVerified",
        "createdAt",
        "updatedAt",
        "lastLoginAt"
      FROM users 
      WHERE id = $1 OR email = $2
    `;
    
    const result = await pool.query(userQuery, [USER_ID, USER_EMAIL]);
    
    if (result.rows.length === 0) {
      console.log('❌ USER NOT FOUND in database');
      console.log(`   User ID: ${USER_ID}`);
      console.log(`   User Email: ${USER_EMAIL}`);
    } else {
      const user = result.rows[0];
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
        console.log('');
        console.log('   RECOMMENDED FIX:');
        console.log(`   UPDATE users SET status = 'active' WHERE id = '${user.id}';`);
      }
    }

    console.log('');
    console.log('2. CHECKING ALL USERS STATUS DISTRIBUTION');
    console.log('-'.repeat(80));
    
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM users
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const statusResult = await pool.query(statusQuery);
    console.log('   Status distribution:');
    statusResult.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count} users`);
    });

    console.log('');
    console.log('3. CHECKING JWT SECRET CONFIGURATION');
    console.log('-'.repeat(80));
    
    // Check backend .env file
    const backendEnvPath = path.join(__dirname, '.env');
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
    const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env');
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
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('ROOT CAUSE ANALYSIS:');
      console.log('');
      console.log(`User ${USER_EMAIL} (ID: ${USER_ID}) has status: '${user.status}'`);
      console.log('');
      
      if (user.status !== 'active') {
        console.log('❌ PRIMARY ISSUE: User status is not "active"');
        console.log('');
        console.log('POSSIBLE SOLUTIONS:');
        console.log('1. Update user status to "active" in database:');
        console.log(`   UPDATE users SET status = 'active' WHERE id = '${user.id}';`);
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
    await pool.end();
  }
}

// Run diagnostic
diagnoseAuthIssue();
