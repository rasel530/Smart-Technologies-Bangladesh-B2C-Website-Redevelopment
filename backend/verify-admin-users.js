/**
 * Script to verify admin users in the database
 */

const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config();

async function verifyAdminUsers() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Verifying admin users in database...');
    console.log('========================================');
    console.log('');

    const adminEmails = [
      'test.superadmin@smarttech.com',
      'admin@smarttech.com',
      'admin2@smarttech.com'
    ];

    for (const email of adminEmails) {
      console.log(`📧 Checking user: ${email}`);
      console.log('----------------------------------------');

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          user_roles: {
            include: {
              roles: true
            }
          }
        }
      });

      if (!user) {
        console.log('❌ User NOT found in database');
        console.log('');
        continue;
      }

      console.log('✅ User found in database');
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);

      if (user.user_roles && user.user_roles.length > 0) {
        console.log(`   RBAC Roles (${user.user_roles.length}):`);
        for (const userRole of user.user_roles) {
          console.log(`      - ${userRole.roles.name} (Active: ${userRole.is_active})`);
        }
      } else {
        console.log('   RBAC Roles: None assigned');
      }

      console.log('');
    }

    console.log('========================================');
    console.log('✅ Verification complete!');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Error verifying admin users:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
verifyAdminUsers();
