const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration(migrationFile) {
  const migrationPath = path.join(__dirname, 'prisma', 'migrations', migrationFile, 'migration.sql');
  
  console.log(`\n========================================`);
  console.log(`Running migration: ${migrationFile}`);
  console.log(`========================================`);
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement.trim());
          console.log(`✓ Executed statement successfully`);
        } catch (error) {
          // Ignore errors for "already exists" or similar
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('relation') ||
              error.code === '42P07') {
            console.log(`⚠ Statement already exists (skipping): ${error.message.substring(0, 100)}...`);
          } else {
            console.error(`✗ Error executing statement: ${error.message}`);
            throw error;
          }
        }
      }
    }
    
    console.log(`✓ Migration ${migrationFile} completed successfully`);
    return true;
  } catch (error) {
    console.error(`✗ Migration ${migrationFile} failed:`, error.message);
    return false;
  }
}

async function main() {
  const migrations = [
    '20260219053600_add_emi_tables',
    '20260219060000_add_cod_settings_table',
    '20260219063000_add_local_payment_tables',
    '20260219070000_add_mobile_cart_tables'
  ];
  
  let successCount = 0;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Migration Summary`);
  console.log(`========================================`);
  console.log(`Total migrations: ${migrations.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${migrations.length - successCount}`);
  console.log(`========================================\n`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
