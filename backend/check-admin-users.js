/**
 * Check for admin users in database
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdminUsers() {
  console.log('Checking for admin users in database...\n');

  try {
    // Check for users with ADMIN role
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true
      }
    });

    console.log(`Found ${adminUsers.length} admin user(s):\n`);

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found.');
      console.log('\nCreating a new admin user...\n');

      const hashedPassword = await bcrypt.hash('Admin123456', 12);

      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@smarttech.bd',
          phone: '+8801000000001',
          firstName: 'System',
          lastName: 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: new Date(),
          phoneVerified: new Date()
        }
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Phone: ${newAdmin.phone}`);
      console.log(`   Name: ${newAdmin.firstName} ${newAdmin.lastName}`);
      console.log(`   Role: ${newAdmin.role}`);
      console.log(`   Status: ${newAdmin.status}`);
      console.log(`   Password: Admin123456`);
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`Admin User ${index + 1}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        console.log(`   Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    // Also check all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        role: true,
        status: true
      },
      take: 10
    });

    console.log(`\nTotal users in database: ${await prisma.user.count()}`);
    console.log('First 10 users:\n');

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || user.phone} (${user.role}) - Status: ${user.status}`);
    });

  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();
