/**
 * Run Pending Cart Migrations
 * 
 * This script executes the pending migrations for cart_events and cart_share_tokens tables
 * using direct SQL execution via Prisma Client.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration(migrationPath, migrationName) {
  console.log(`\n🔄 Running migration: ${migrationName}`);
  console.log('='.repeat(70));

  try {
    // Read migration SQL file
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(`✅ Migration file loaded: ${migrationPath}`);
    console.log(`📝 SQL size: ${sql.length} characters`);

    // Execute migration using raw query
    // Note: We need to split the SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    let executedCount = 0;
    let skippedCount = 0;

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        executedCount++;
        console.log(`✅ Executed statement ${executedCount}/${statements.length}`);
      } catch (error) {
        // Check if it's a "already exists" error (safe to skip)
        if (error.code === '42P07' || error.message.includes('already exists')) {
          skippedCount++;
          console.log(`⏭️  Skipped (already exists): statement ${executedCount + skippedCount}/${statements.length}`);
        } else {
          console.error(`❌ Error executing statement:`, error.message);
          throw error;
        }
      }
    }

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   Executed: ${executedCount} statements`);
    console.log(`   Skipped: ${skippedCount} statements`);
    
    return { success: true, executedCount, skippedCount };

  } catch (error) {
    console.error(`\n❌ Migration failed: ${migrationName}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 Starting Pending Cart Migrations');
  console.log('='.repeat(70));

  const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
  
  const migrations = [
    {
      name: 'cart_events table',
      path: path.join(migrationsDir, '20260207140000_add_cart_event_table', 'migration.sql')
    },
    {
      name: 'cart_share_tokens table',
      path: path.join(migrationsDir, '20260207150000_add_cart_share_token_table', 'migration.sql')
    }
  ];

  const results = [];

  for (const migration of migrations) {
    // Check if migration file exists
    if (!fs.existsSync(migration.path)) {
      console.log(`\n⚠️  Migration file not found: ${migration.path}`);
      console.log(`   Skipping: ${migration.name}`);
      continue;
    }

    const result = await runMigration(migration.path, migration.name);
    results.push({ ...migration, ...result });
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => r => !r.success);

  console.log(`\nTotal Migrations: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log('\n✅ Successful Migrations:');
    successful.forEach(m => {
      console.log(`   - ${m.name} (${m.executedCount} statements executed)`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Migrations:');
    failed.forEach(m => {
      console.log(`   - ${m.name}: ${m.error.message}`);
    });
  }

  console.log('\n' + '='.repeat(70));
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
