/**
 * Check Demo Users in Database
 * 
 * This script checks what users exist in the database and their credentials
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDemoUsers() {
  console.log('=== CHECKING DEMO USERS ===');
  console.log('');

  try {
    // Get all users
    const users = await prisma.user.findMany({
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
        password: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${users.length} users in database:`);
    console.log('');

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email || 'N/A'}`);
      console.log(`  Phone: ${user.phone || 'N/A'}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`  Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
      console.log(`  Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });

    // Check for demo user specifically
    const demoUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'demo@smarttechnologies-bd.com' },
          { email: { contains: 'demo' } }
        ]
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
        password: true,
        createdAt: true
      }
    });

    if (demoUser) {
      console.log('=== DEMO USER FOUND ===');
      console.log('Demo User Details:');
      console.log(`  ID: ${demoUser.id}`);
      console.log(`  Email: ${demoUser.email}`);
      console.log(`  Phone: ${demoUser.phone}`);
      console.log(`  Name: ${demoUser.firstName} ${demoUser.lastName}`);
      console.log(`  Role: ${demoUser.role}`);
      console.log(`  Status: ${demoUser.status}`);
      console.log(`  Email Verified: ${demoUser.emailVerified ? 'Yes' : 'No'}`);
      console.log(`  Phone Verified: ${demoUser.phoneVerified ? 'Yes' : 'No'}`);
      console.log(`  Has Password: ${demoUser.password ? 'Yes' : 'No'}`);
      console.log('');
    } else {
      console.log('=== NO DEMO USER FOUND ===');
      console.log('No demo user found in database. You may need to create one.');
      console.log('');
    }

  } catch (error) {
    console.error('Error checking demo users:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }

  console.log('=== CHECK COMPLETE ===');
}

// Run check
checkDemoUsers();
