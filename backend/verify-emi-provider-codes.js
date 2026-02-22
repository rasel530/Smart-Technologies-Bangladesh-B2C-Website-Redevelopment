const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('Verifying EMI Provider codes...\n');
    
    const providers = await prisma.emiProvider.findMany({
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log('All EMI Providers:');
    providers.forEach(p => {
      console.log(`  - ${p.name} (code: ${p.code}, id: ${p.id})`);
    });
    
    console.log(`\nTotal providers: ${providers.length}`);
    console.log('Providers with codes:', providers.filter(p => p.code).length);
    console.log('Providers without codes:', providers.filter(p => !p.code).length);
    
    console.log('\nVerification completed successfully!');
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verify();
