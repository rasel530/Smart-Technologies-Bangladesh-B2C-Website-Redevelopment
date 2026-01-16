/**
 * Generate bcrypt hashes for test user passwords
 * Run this script to generate password hashes for the test users
 */

const bcrypt = require('bcryptjs');

const testPasswords = [
  {
    email: 'test.customer@smarttech.com',
    password: 'TestCustomer123!',
    role: 'CUSTOMER'
  },
  {
    email: 'test.admin@smarttech.com',
    password: 'TestAdmin123!',
    role: 'ADMIN'
  },
  {
    email: 'test.superadmin@smarttech.com',
    password: 'TestSuperAdmin123!',
    role: 'SUPER_ADMIN'
  }
];

async function generateHashes() {
  console.log('Generating bcrypt hashes for test users...\n');

  for (const user of testPasswords) {
    try {
      const hash = await bcrypt.hash(user.password, 10);
      console.log(`${user.role} User:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Hash: ${hash}`);
      console.log('');
    } catch (error) {
      console.error(`Error generating hash for ${user.email}:`, error);
    }
  }

  console.log('Copy these hashes into insert_rbac_test_users.sql');
}

generateHashes().catch(console.error);
