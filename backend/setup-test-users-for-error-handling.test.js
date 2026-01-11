/**
 * Setup script for login error handling tests
 * Creates test users with various states for comprehensive testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTestUsers() {
  try {
    console.log('Setting up test users for error handling tests...\n');

    // Test user 1: Verified user with email
    const hashedPassword1 = await bcrypt.hash('TestPassword123!', 10);
    const user1 = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        password: hashedPassword1,
        status: 'ACTIVE',
        emailVerified: new Date()
      },
      create: {
        email: 'test@example.com',
        password: hashedPassword1,
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    });
    console.log('✓ Created/Updated verified email user:', user1.email);

    // Test user 2: Verified user with phone
    const hashedPassword2 = await bcrypt.hash('TestPassword123!', 10);
    const user2 = await prisma.user.upsert({
      where: { email: 'testphone@example.com' },
      update: {
        phone: '01712345678',
        password: hashedPassword2,
        status: 'ACTIVE',
        phoneVerified: new Date()
      },
      create: {
        email: 'testphone@example.com',
        phone: '01712345678',
        password: hashedPassword2,
        firstName: 'Test',
        lastName: 'PhoneUser',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        phoneVerified: new Date()
      }
    });
    console.log('✓ Created/Updated verified phone user:', user2.phone);

    // Test user 3: Unverified user with email (PENDING status)
    const hashedPassword3 = await bcrypt.hash('TestPassword123!', 10);
    const user3 = await prisma.user.upsert({
      where: { email: 'pending@example.com' },
      update: {
        password: hashedPassword3,
        status: 'PENDING',
        emailVerified: null
      },
      create: {
        email: 'pending@example.com',
        password: hashedPassword3,
        firstName: 'Pending',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'PENDING'
      }
    });
    console.log('✓ Created/Updated unverified email user:', user3.email);

    // Test user 4: Unverified user with phone (PENDING status)
    const hashedPassword4 = await bcrypt.hash('TestPassword123!', 10);
    const user4 = await prisma.user.upsert({
      where: { email: 'pendingphone@example.com' },
      update: {
        phone: '01812345678',
        password: hashedPassword4,
        status: 'PENDING',
        phoneVerified: null
      },
      create: {
        email: 'pendingphone@example.com',
        phone: '01812345678',
        password: hashedPassword4,
        firstName: 'Pending',
        lastName: 'PhoneUser',
        role: 'CUSTOMER',
        status: 'PENDING'
      }
    });
    console.log('✓ Created/Updated unverified phone user:', user4.phone);

    console.log('\n✓ All test users setup complete!\n');
    console.log('Test credentials:');
    console.log('  Verified Email: test@example.com / TestPassword123!');
    console.log('  Verified Phone: 01712345678 / TestPassword123!');
    console.log('  Unverified Email: pending@example.com / TestPassword123!');
    console.log('  Unverified Phone: 01812345678 / TestPassword123!');
    console.log('\nNote: Phone users also have associated emails for database requirements');

  } catch (error) {
    console.error('Failed to setup test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestUsers();
