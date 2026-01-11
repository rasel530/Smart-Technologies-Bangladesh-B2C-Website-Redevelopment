const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.id);
      console.log('   Email:', existingUser.email);
      console.log('   Status:', existingUser.status);
      return existingUser;
    }

    // Create test user
    console.log('Creating test user...');
    const hashedPassword = await bcrypt.hash('Test123456!', 10);
    
    const newUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        status: 'ACTIVE',
        role: 'CUSTOMER'
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('   ID:', newUser.id);
    console.log('   Email:', newUser.email);
    console.log('   Password: Test123456!');
    console.log('   Status:', newUser.status);

    // Initialize default preferences for user
    const { accountPreferencesService } = require('./services/accountPreferences.service');
    await accountPreferencesService.initializeDefaultNotificationPreferences(newUser.id);
    await accountPreferencesService.initializeDefaultCommunicationPreferences(newUser.id);
    await accountPreferencesService.initializeDefaultPrivacySettings(newUser.id);
    console.log('✅ Default preferences initialized');

    return newUser;
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
