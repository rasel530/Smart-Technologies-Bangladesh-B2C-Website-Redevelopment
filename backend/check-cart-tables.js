const { PrismaClient } = require('@prisma/client');

async function checkCartTables() {
  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%cart%' OR table_name LIKE '%recovery%' OR table_name LIKE '%analytics%')
      ORDER BY table_name
    `;
    console.log('Cart, recovery, and analytics tables:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCartTables();
