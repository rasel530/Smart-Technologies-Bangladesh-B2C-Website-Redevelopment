/**
 * Script to create a SUPER_ADMIN user in the database
 * Usage: node create-super-admin.js [password]
 * If no password is provided, a random password will be generated
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Database configuration (same as backend)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev';

async function createSuperAdmin(password = null) {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    console.log('🔐 Connecting to database...');
    
    // Generate password if not provided
    if (!password) {
      password = generateRandomPassword();
      console.log(`📝 Generated password: ${password}`);
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Generate UUID for user
    const userId = crypto.randomUUID();

    // Insert SUPER_ADMIN user
    console.log('👤 Creating SUPER_ADMIN user...');
    const insertQuery = `
      INSERT INTO users (
        id,
        email,
        password,
        role,
        "firstName",
        "lastName",
        "emailVerified",
        "phoneVerified",
        "createdAt",
        "updatedAt"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role;
    `;

    const result = await client.query(insertQuery, [
      userId,
      'test.superadmin@smarttech.com',
      passwordHash,
      'super_admin',
      'Super',
      'Admin',
      new Date(),
      null,
    ]);

    if (result.rows.length > 0) {
      console.log('✅ SUPER_ADMIN user created successfully!');
      console.log('📧 User Details:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Role: ${result.rows[0].role}`);
      console.log(`   Password: ${password}`);
      console.log('');
      console.log('🔑 You can now login with:');
      console.log(`   Email: test.superadmin@smarttech.com`);
      console.log(`   Password: ${password}`);
      console.log('');
      console.log('🌐 Access the application at: http://localhost:3000');
    } else {
      console.log('⚠️  User already exists with this email');
      // Query existing user details
      const existingUser = await client.query(
        'SELECT id, email, role FROM users WHERE email = $1',
        ['test.superadmin@smarttech.com']
      );
      if (existingUser.rows.length > 0) {
        console.log('📧 Existing User Details:');
        console.log(`   ID: ${existingUser.rows[0].id}`);
        console.log(`   Email: ${existingUser.rows[0].email}`);
        console.log(`   Role: ${existingUser.rows[0].role}`);
        console.log('');
        console.log('🔑 Login with:');
        console.log(`   Email: test.superadmin@smarttech.com`);
        console.log(`   Password: (use your existing password or reset it)`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating SUPER_ADMIN user:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

function generateRandomPassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Run the script
const passwordArg = process.argv[2];
createSuperAdmin(passwordArg);
