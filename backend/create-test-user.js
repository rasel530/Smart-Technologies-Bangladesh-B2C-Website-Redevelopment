/**
 * Create test user for Remember Me functionality testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    
    // Create or update test user
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {
        password: hashedPassword,
        status: 'ACTIVE',
        emailVerified: new Date()
      },
      create: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: new Date()
      }
    });
    
    console.log('✓ Test user created/updated:', user.email);
    console.log('  Email:', user.email);
    console.log('  Name:', user.firstName, user.lastName);
    console.log('  Status:', user.status);
    console.log('\nYou can now login with:');
    console.log('  Email: test@example.com');
    console.log('  Password: TestPassword123!');
    
  } catch (error) {
    console.error('Failed to create test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
