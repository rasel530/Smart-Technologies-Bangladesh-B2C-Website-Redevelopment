/**
 * Script to update password for existing SUPER_ADMIN user
 * Usage: node update-super-admin-password.js [new-password]
 * If no password is provided, a random password will be generated
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev';

async function updateSuperAdminPassword(newPassword = null) {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    console.log('🔐 Connecting to database...');
    
    // Generate password if not provided
    if (!newPassword) {
      newPassword = generateRandomPassword();
      console.log(`📝 Generated password: ${newPassword}`);
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('✅ Password hashed successfully');

    // Update SUPER_ADMIN user password
    console.log('👤 Updating SUPER_ADMIN password...');
    const updateQuery = `
      UPDATE users
      SET password = $1, "updatedAt" = NOW()
      WHERE email = $2 AND role = 'super_admin'
      RETURNING id, email, role;
    `;

    const result = await client.query(updateQuery, [
      passwordHash,
      'test.superadmin@smarttech.com',
    ]);

    if (result.rows.length > 0) {
      console.log('✅ SUPER_ADMIN password updated successfully!');
      console.log('📧 User Details:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Role: ${result.rows[0].role}`);
      console.log(`   Password: ${newPassword}`);
      console.log('');
      console.log('🔑 You can now login with:');
      console.log(`   Email: test.superadmin@smarttech.com`);
      console.log(`   Password: ${newPassword}`);
      console.log('');
      console.log('🌐 Access the application at: http://localhost:3000');
    } else {
      console.log('❌ SUPER_ADMIN user not found with email: test.superadmin@smarttech.com');
    }

  } catch (error) {
    console.error('❌ Error updating SUPER_ADMIN password:', error.message);
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
updateSuperAdminPassword(passwordArg);
