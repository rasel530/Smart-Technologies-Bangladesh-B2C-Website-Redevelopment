const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.findUnique({
    where: { email: 'raselbepari88@gmail.com' }
  });

  if (!user) {
    console.log('User not found!');
    process.exit(1);
  }

  console.log('Email:', user.email);
  console.log('CreatedAt (raw):', user.createdAt);
  console.log('CreatedAt (ISO):', user.createdAt.toISOString());
  console.log('CreatedAt (local):', user.createdAt.toLocaleString());

  await prisma.$disconnect();
})();
