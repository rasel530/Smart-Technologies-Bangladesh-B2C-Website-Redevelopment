const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllTables() {
  console.log('=== Checking All Tables in Database ===\n');

  const result = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('All tables in database:');
  result.forEach(row => {
    console.log(`  - ${row.table_name}`);
  });

  await prisma.$disconnect();
}

checkAllTables().catch(console.error);
