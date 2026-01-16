/**
 * Simple admin user creation script
 * Creates admin user with uppercase ADMIN role to match current database
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('=== Admin User Creation ===\n');

  const adminEmail = 'admin@smarttech.com';
  const adminPassword = 'admin123';
  const adminPhone = '+8801000000001';

  try {
    // Check if admin user exists
    console.log('Checking for existing admin user...');
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (adminUser) {
      console.log(`✓ Found existing admin user: ${adminUser.email}`);
      console.log(`  Current role: ${adminUser.role}`);
      console.log(`  Current status: ${adminUser.status}`);
      
      // Update password and ensure role is ADMIN (uppercase)
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      adminUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: adminUser.emailVerified || new Date(),
          phoneVerified: adminUser.phoneVerified || new Date(),
          firstName: 'System',
          lastName: 'Admin'
        }
      });

      console.log('✓ Admin user updated successfully!');
    } else {
      console.log('No admin user found. Creating new admin user...');
      
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          phone: adminPhone,
          firstName: 'System',
          lastName: 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: new Date(),
          phoneVerified: new Date()
        }
      });

      console.log('✓ Admin user created successfully!');
    }

    console.log('\n=== Admin User Details ===');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Phone: ${adminUser.phone}`);
    console.log(`Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Status: ${adminUser.status}`);
    console.log(`Email Verified: ${adminUser.emailVerified ? 'Yes' : 'No'}`);
    console.log(`Phone Verified: ${adminUser.phoneVerified ? 'Yes' : 'No'}`);
    
    console.log('\n=== Login Credentials ===');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n✓ Admin user is ready for login!');
    console.log('\nNOTE: The admin page checks for lowercase "admin" role.');
    console.log('The database currently uses uppercase "ADMIN" role.');
    console.log('You may need to update the frontend to check for uppercase "ADMIN"');

  } catch (error) {
    console.error('❌ Error creating/updating admin user:', error);
    if (error.code === 'P2002') {
      console.error('Unique constraint violation. User with this email or phone already exists.');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
