/**
 * Create Demo User
 * 
 * This script creates a demo user for testing login functionality
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUser() {
  console.log('=== CREATING DEMO USER ===');
  console.log('');

  try {
    // Demo user credentials
    const demoUser = {
      email: 'demo@smarttechnologies-bd.com',
      password: 'Demo@123456',
      firstName: 'Demo',
      lastName: 'User',
      phone: '+8801700000002',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    };

    console.log('Creating demo user with:');
    console.log(`  Email: ${demoUser.email}`);
    console.log(`  Password: ${demoUser.password}`);
    console.log(`  Name: ${demoUser.firstName} ${demoUser.lastName}`);
    console.log(`  Phone: ${demoUser.phone}`);
    console.log(`  Role: ${demoUser.role}`);
    console.log(`  Status: ${demoUser.status}`);
    console.log('');

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: demoUser.email },
          { phone: demoUser.phone }
        ]
      }
    });

    if (existingUser) {
      console.log('⚠️  Demo user already exists!');
      console.log(`  User ID: ${existingUser.id}`);
      console.log(`  Email: ${existingUser.email}`);
      console.log(`  Phone: ${existingUser.phone}`);
      console.log(`  Status: ${existingUser.status}`);
      console.log('');
      console.log('Updating password to match expected credentials...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(demoUser.password, 12);
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          status: 'ACTIVE',
          emailVerified: new Date(),
          phoneVerified: new Date()
        }
      });
      
      console.log('✅ Demo user password updated successfully!');
      console.log(`  User ID: ${updatedUser.id}`);
      console.log(`  Status: ${updatedUser.status}`);
      console.log(`  Email Verified: ${updatedUser.emailVerified ? 'Yes' : 'No'}`);
      console.log(`  Phone Verified: ${updatedUser.phoneVerified ? 'Yes' : 'No'}`);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(demoUser.password, 12);
      
      // Create user
      const newUser = await prisma.user.create({
        data: {
          email: demoUser.email,
          password: hashedPassword,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          phone: demoUser.phone,
          role: demoUser.role,
          status: demoUser.status,
          emailVerified: new Date(),
          phoneVerified: new Date()
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: true
        }
      });
      
      console.log('✅ Demo user created successfully!');
      console.log(`  User ID: ${newUser.id}`);
      console.log(`  Email: ${newUser.email}`);
      console.log(`  Phone: ${newUser.phone}`);
      console.log(`  Name: ${newUser.firstName} ${newUser.lastName}`);
      console.log(`  Role: ${newUser.role}`);
      console.log(`  Status: ${newUser.status}`);
      console.log(`  Email Verified: ${newUser.emailVerified ? 'Yes' : 'No'}`);
      console.log(`  Phone Verified: ${newUser.phoneVerified ? 'Yes' : 'No'}`);
      console.log(`  Created: ${newUser.createdAt}`);
    }

    console.log('');
    console.log('=== DEMO USER READY ===');
    console.log('You can now login with:');
    console.log(`  Email: ${demoUser.email}`);
    console.log(`  Password: ${demoUser.password}`);

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }

  console.log('');
  console.log('=== COMPLETE ===');
}

// Run creation
createDemoUser();
