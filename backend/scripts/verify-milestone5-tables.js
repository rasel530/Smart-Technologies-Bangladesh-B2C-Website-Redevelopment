const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTables() {
  console.log('=== Milestone 5 Table Verification ===\n');

  const tables = [
    'emi_providers',
    'emi_plans',
    'cod_settings',
    'local_payment_methods',
    'sms_subscriptions',
    'cart_sms_subscription',
    'cart_offline_sync',
    'cart_sms_log'
  ];

  const results = [];

  for (const tableName of tables) {
    try {
      // Try to query the table to verify it exists
      const result = await prisma.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );
      `);
      
      const exists = result[0].exists;
      results.push({ table: tableName, exists, status: exists ? '✓ OK' : '✗ MISSING' });
      
      if (exists) {
        // Get column information
        const columns = await prisma.$queryRawUnsafe(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `);
        
        console.log(`\n${tableName}:`);
        console.log(`  Status: ✓ EXISTS`);
        console.log(`  Columns:`);
        columns.forEach(col => {
          console.log(`    - ${col.column_name}: ${col.data_type}${col.is_nullable === 'YES' ? ' (nullable)' : ''}`);
        });
      } else {
        console.log(`\n${tableName}:`);
        console.log(`  Status: ✗ MISSING`);
      }
    } catch (error) {
      results.push({ table: tableName, exists: false, status: `✗ ERROR: ${error.message}` });
      console.log(`\n${tableName}:`);
      console.log(`  Status: ✗ ERROR: ${error.message}`);
    }
  }

  console.log('\n=== Summary ===');
  const existing = results.filter(r => r.exists).length;
  const total = results.length;
  console.log(`Tables created: ${existing}/${total}`);
  
  if (existing === total) {
    console.log('✓ All tables created successfully!');
  } else {
    console.log('✗ Some tables are missing!');
  }

  await prisma.$disconnect();
}

verifyTables().catch(console.error);
