/**
 * Script to create a SUPER_ADMIN user in the database
 * Usage: node create-super-admin.js [password]
 * If no password is provided, a random password will be generated
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Database configuration (same as backend)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://smarttech_user:smarttech_password@localhost:5432/smarttech_db';

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

    // Hash the password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Generate UUID for user
    const userId = uuidv4();

    // Insert SUPER_ADMIN user
    console.log('👤 Creating SUPER_ADMIN user...');
    const insertQuery = `
      INSERT INTO users (
        id,
        email,
        password_hash,
        role,
        is_email_verified,
        is_phone_verified,
        created_at,
        updated_at
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
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
      'SUPER_ADMIN',
      true,
      false,
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
      console.log('📧 Existing User Details:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Role: ${result.rows[0].role}`);
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
