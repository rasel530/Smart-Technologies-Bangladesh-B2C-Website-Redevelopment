/**
 * Fix admin user - set verified email and known password
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAdminUser() {
  console.log('Fixing admin user...\n');

  try {
    const adminEmail = 'admin@smarttech.com';
    const newPassword = 'Admin123456';

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update admin user
    const updatedAdmin = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        emailVerified: new Date(),
        status: 'ACTIVE'
      }
    });

    console.log('✅ Admin user updated successfully!');
    console.log(`   Email: ${updatedAdmin.email}`);
    console.log(`   Name: ${updatedAdmin.firstName} ${updatedAdmin.lastName}`);
    console.log(`   Role: ${updatedAdmin.role}`);
    console.log(`   Status: ${updatedAdmin.status}`);
    console.log(`   Email Verified: ${updatedAdmin.emailVerified ? 'Yes' : 'No'}`);
    console.log(`   New Password: ${newPassword}`);
    console.log('\nYou can now login with:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${newPassword}`);

  } catch (error) {
    console.error('Error fixing admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminUser();
