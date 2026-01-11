const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  try {
    const TEST_EMAIL = 'testuser1768054053393@example.com';
    const TEST_PASSWORD = 'Test123456!';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    
    // Update the user with the hashed password
    const user = await prisma.user.update({
      where: { email: TEST_EMAIL },
      data: { password: hashedPassword }
    });
    
    console.log('Test user password updated successfully:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
