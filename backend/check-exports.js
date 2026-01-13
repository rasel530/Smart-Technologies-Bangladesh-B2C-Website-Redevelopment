const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const exps = await prisma.userDataExports.findMany({
      select: {
        id: true,
        status: true,
        userId: true,
        requestedAt: true,
        fileUrl: true,
        readyAt: true,
        errorMessage: true
      },
      orderBy: { requestedAt: 'desc' },
      take: 10
    });

    console.log('Recent exports:');
    console.log('ID | Status | User ID | Requested At | File URL | Ready At | Error');
    console.log('---|--------|---------|--------------|----------|----------|-------');
    exps.forEach(e => {
      console.log(`${e.id} | ${e.status} | ${e.userId} | ${e.requestedAt} | ${e.fileUrl || 'NULL'} | ${e.readyAt || 'NULL'} | ${e.errorMessage || 'NULL'}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
