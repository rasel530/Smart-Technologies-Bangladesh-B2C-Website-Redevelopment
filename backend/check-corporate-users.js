const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCorporateUsers() {
  try {
    const corporateUsers = await prisma.corporateUser.findMany({
      select: {
        id: true,
        corporateAccountId: true,
        userId: true,
        role: true,
        isActive: true,
        assignedAt: true,
        expiresAt: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });
    
    console.log('Corporate users found:', corporateUsers.length);
    console.log(JSON.stringify(corporateUsers, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCorporateUsers();
