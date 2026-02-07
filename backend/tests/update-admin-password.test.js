const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email: 'admin@smarttech.com' } 
    });
    
    if (user) {
      const hashedPassword = await bcrypt.hash('AdminPassword123', 12);
      await prisma.user.update({ 
        where: { email: 'admin@smarttech.com' }, 
        data: { password: hashedPassword } 
      });
      console.log('Admin password updated successfully to: AdminPassword123');
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error updating admin password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
