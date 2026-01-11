const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateTestUserPassword() {
  try {
    // Find test user
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('Found test user:', user.id);
    console.log('Current status:', user.status);

    // Update password to known value
    const hashedPassword = await bcrypt.hash('Test123456!', 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Password updated successfully!');
    console.log('   New password: Test123456!');
    console.log('   Status: ACTIVE');

    // Verify password can be verified
    const isValid = await bcrypt.compare('Test123456!', hashedPassword);
    console.log('   Password verification:', isValid ? '✅ Valid' : '❌ Invalid');

  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTestUserPassword()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
