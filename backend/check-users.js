const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('=== USER DATABASE CHECK ===\n');

  const testUsers = [
    { email: 'raselbepari88@gmail.com', password: '74Vfo^71~_oY' },
    { email: 'test.superadmin@smarttech.com', password: 'dpWcQf*YH2mwKSXd' },
    { email: 'admin@smarttech.com', password: 'AdminPassword123' },
    { email: 'admin2@smarttech.com', password: 'Xz@4@GvJA@zLduAb' }
  ];

  for (const testUser of testUsers) {
    console.log(`\n--- Checking user: ${testUser.email} ---`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: testUser.email }
    });

    if (!user) {
      console.log(`❌ User NOT FOUND in database`);
      continue;
    }

    console.log(`✅ User FOUND`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Has Password: ${!!user.password}`);
    console.log(`   Email Verified: ${!!user.emailVerified}`);
    console.log(`   Phone Verified: ${!!user.phoneVerified}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log(`   Password Hash: ${user.password ? user.password.substring(0, 30) + '...' : 'NULL'}`);

    // Check if password is bcrypt hash
    const isBcryptHash = user.password && user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    console.log(`   Is Bcrypt Hash: ${isBcryptHash}`);

    // Test password verification
    if (user.password) {
      try {
        const isValid = await bcrypt.compare(testUser.password, user.password);
        console.log(`   Password Match: ${isValid ? '✅ YES' : '❌ NO'}`);

        if (!isValid) {
          console.log(`   ⚠️  Password verification FAILED`);
          console.log(`   Trying to hash password and compare...`);
          const testHash = await bcrypt.hash(testUser.password, 12);
          console.log(`   Test Hash: ${testHash.substring(0, 30)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Password verification ERROR: ${error.message}`);
      }
    } else {
      console.log(`   ❌ No password stored for user`);
    }
  }

  console.log('\n=== END OF USER CHECK ===');

  await prisma.$disconnect();
}

checkUsers().catch(console.error);
