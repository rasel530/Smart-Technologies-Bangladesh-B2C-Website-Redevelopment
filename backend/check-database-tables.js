const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Query PostgreSQL information_schema to list all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('========================================');
    console.log('DATABASE TABLES');
    console.log('========================================\n');
    
    console.log(`Total tables found: ${tables.length}\n`);
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    console.log('\n========================================');
    
    // Check for role-related tables specifically
    const roleTables = tables.filter(t => 
      t.table_name.toLowerCase().includes('role') || 
      t.table_name.toLowerCase().includes('permission') ||
      t.table_name.toLowerCase().includes('hierarchy')
    );
    
    if (roleTables.length > 0) {
      console.log('\n✓ Role-related tables found:');
      roleTables.forEach(t => console.log(`  - ${t.table_name}`));
    } else {
      console.log('\n❌ No role-related tables found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
