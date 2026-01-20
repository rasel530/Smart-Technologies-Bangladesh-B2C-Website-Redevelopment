const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'super_admin' }
        ]
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('Admin users found:', adminUsers.length);
    console.log(JSON.stringify(adminUsers, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();
