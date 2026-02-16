/**
 * User Existence Verification Script
 * 
 * This script verifies if a specific user exists in database and checks their role.
 * It connects to the PostgreSQL database and runs diagnostic queries.
 * 
 * Usage: node verify-user-exists.js
 */

const { Pool } = require('pg');

// Database configuration from docker-compose.yml
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'smart_ecommerce_dev',
  user: 'smart_dev',
  password: 'smart_dev_password_2024',
};

// User to verify
const targetUser = {
  id: 'ea59bf47-4b66-431d-ba63-a0a69437798f',
  email: 'admin@smarttech.com',
  role: 'admin',
};

async function verifyUser() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('='.repeat(80));
    console.log('USER EXISTENCE VERIFICATION REPORT');
    console.log('='.repeat(80));
    console.log('');
    
    // Test database connection
    console.log('Step 1: Testing database connection...');
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    console.log('');
    
    // Check if users table exists
    console.log('Step 2: Checking database schema...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user%'
      ORDER BY table_name;
    `;
    const tablesResult = await client.query(tablesQuery);
    console.log('Found user-related tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');
    
    // Check the structure of the users table
    console.log('Step 3: Checking users table structure...');
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    const columnsResult = await client.query(columnsQuery);
    console.log('Users table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    console.log('');
    
    // Query for the specific user by ID
    console.log(`Step 4: Checking for user with ID: ${targetUser.id}...`);
    const userByIdQuery = `
      SELECT id, email, role, status, "createdAt", "updatedAt"
      FROM users
      WHERE id = $1;
    `;
    const userByIdResult = await client.query(userByIdQuery, [targetUser.id]);
    
    if (userByIdResult.rows.length > 0) {
      const user = userByIdResult.rows[0];
      console.log('✓ User found!');
      console.log('');
      console.log('User Details:');
      console.log(`  ID:       ${user.id}`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Role:     ${user.role}`);
      console.log(`  Status:   ${user.status}`);
      console.log(`  Created:  ${user.createdAt}`);
      console.log(`  Updated:  ${user.updatedAt}`);
      console.log('');
      
      // Verify email matches
      console.log('Step 5: Verifying email...');
      if (user.email.toLowerCase() === targetUser.email.toLowerCase()) {
        console.log(`✓ Email matches: ${user.email}`);
      } else {
        console.log(`✗ Email mismatch!`);
        console.log(`  Expected: ${targetUser.email}`);
        console.log(`  Found:    ${user.email}`);
      }
      console.log('');
      
      // Verify role
      console.log('Step 6: Verifying role...');
      if (user.role === targetUser.role || user.role === 'SUPER_ADMIN') {
        console.log(`✓ Role is valid: ${user.role}`);
      } else {
        console.log(`✗ Role is invalid!`);
        console.log(`  Expected: ${targetUser.role} or SUPER_ADMIN`);
        console.log(`  Found:    ${user.role}`);
      }
      console.log('');
      
      // Verify status
      console.log('Step 7: Verifying status...');
      if (user.status === 'ACTIVE') {
        console.log(`✓ Status is ACTIVE`);
      } else {
        console.log(`✗ Status is not ACTIVE!`);
        console.log(`  Expected: ACTIVE`);
        console.log(`  Found:    ${user.status}`);
      }
      console.log('');
      
    } else {
      console.log('✗ User not found with the specified ID');
      console.log('');
      
      // Query for user by email
      console.log(`Step 5: Checking for user with email: ${targetUser.email}...`);
      const userByEmailQuery = `
        SELECT id, email, role, status, "createdAt", "updatedAt"
        FROM users
        WHERE email = $1;
      `;
      const userByEmailResult = await client.query(userByEmailQuery, [targetUser.email]);
      
      if (userByEmailResult.rows.length > 0) {
        const user = userByEmailResult.rows[0];
        console.log('✓ User found by email!');
        console.log('');
        console.log('User Details:');
        console.log(`  ID:       ${user.id}`);
        console.log(`  Email:    ${user.email}`);
        console.log(`  Role:     ${user.role}`);
        console.log(`  Status:   ${user.status}`);
        console.log(`  Created:  ${user.createdAt}`);
        console.log(`  Updated:  ${user.updatedAt}`);
        console.log('');
        console.log('⚠ Note: User ID mismatch!');
        console.log(`  Expected ID: ${targetUser.id}`);
        console.log(`  Found ID:    ${user.id}`);
        console.log('');
      } else {
        console.log('✗ User not found by email either');
        console.log('');
        
        // Check for any admin users
        console.log('Step 6: Checking for any admin users in database...');
        const adminUsersQuery = `
          SELECT id, email, role, status, "createdAt", "updatedAt"
          FROM users
          WHERE role IN ('admin', 'SUPER_ADMIN')
          ORDER BY "createdAt";
        `;
        const adminUsersResult = await client.query(adminUsersQuery);
        
        if (adminUsersResult.rows.length > 0) {
          console.log(`✓ Found ${adminUsersResult.rows.length} admin user(s):`);
          console.log('');
          adminUsersResult.rows.forEach((user, index) => {
            console.log(`Admin User #${index + 1}:`);
            console.log(`  ID:       ${user.id}`);
            console.log(`  Email:    ${user.email}`);
            console.log(`  Role:     ${user.role}`);
            console.log(`  Status:   ${user.status}`);
            console.log(`  Created:  ${user.createdAt}`);
            console.log(`  Updated:  ${user.updatedAt}`);
            console.log('');
          });
        } else {
          console.log('✗ No admin users found in the database');
          console.log('');
        }
      }
    }
    
    // Check total user count
    console.log('Step 8: Checking total user count...');
    const countQuery = 'SELECT COUNT(*) as count FROM users;';
    const countResult = await client.query(countQuery);
    console.log(`Total users in database: ${countResult.rows[0].count}`);
    console.log('');
    
    // Check for any users with similar email pattern
    console.log('Step 9: Checking for users with @smarttech.com email...');
    const similarUsersQuery = `
      SELECT id, email, role, status
      FROM users
      WHERE email LIKE '%@smarttech.com'
      ORDER BY email;
    `;
    const similarUsersResult = await client.query(similarUsersQuery);
    
    if (similarUsersResult.rows.length > 0) {
      console.log(`✓ Found ${similarUsersResult.rows.length} user(s) with @smarttech.com email:`);
      similarUsersResult.rows.forEach(user => {
        console.log(`  - ${user.email} (Role: ${user.role}, Status: ${user.status})`);
      });
    } else {
      console.log('✗ No users found with @smarttech.com email');
    }
    console.log('');
    
    client.release();
    
  } catch (error) {
    console.error('');
    console.error('✗ ERROR occurred during verification:');
    console.error('');
    console.error('Error Details:');
    console.error(`  Message: ${error.message}`);
    console.error(`  Code: ${error.code}`);
    if (error.hint) {
      console.error(`  Hint: ${error.hint}`);
    }
    if (error.detail) {
      console.error(`  Detail: ${error.detail}`);
    }
    console.error('');
    console.error('Stack Trace:');
    console.error(error.stack);
    console.error('');
  } finally {
    await pool.end();
  }
  
  console.log('='.repeat(80));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(80));
}

// Run the verification
verifyUser().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
