const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const methods = await prisma.localPaymentMethod.findMany({
      select: {
        id: true,
        code: true,
        displayName: true,
        isActive: true
      }
    });
    console.log(JSON.stringify(methods, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
