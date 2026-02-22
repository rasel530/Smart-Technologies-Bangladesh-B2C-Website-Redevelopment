/**
 * Resolve Mobile Optimization Migration Script
 * 
 * This script resolves the failed 20250219_mobile_optimization_tables migration
 * by marking it as completed since the tables already exist.
 * 
 * Usage: node scripts/resolve-mobile-migration.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resolveMobileMigration() {
  console.log('=== RESOLVING MOBILE OPTIMIZATION MIGRATION ===\n');

  try {
    // Check for failed migrations
    const failedMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, applied_steps_count, rolled_back_at 
      FROM _prisma_migrations 
      WHERE migration_name = '20250219_mobile_optimization_tables'
      AND finished_at IS NULL
    `;

    if (failedMigrations.length === 0) {
      console.log('✅ No failed mobile optimization migration found');
      console.log('Migration may have already been resolved');
      return;
    }

    console.log(`Found ${failedMigrations.length} failed mobile optimization migration(s):`);
    failedMigrations.forEach(m => {
      console.log(`  - ${m.migration_name} (started: ${m.started_at})`);
    });

    // Check if the tables already exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'cart_sms_subscription',
        'cart_sms_log',
        'cart_offline_sync',
        'cart_recovery_events',
        'cart_recovery_settings',
        'cart_share_tokens',
        'cart_wishlist_move_history',
        'cart_wishlist_sync',
        'cart_cleanup_audit',
        'cart_events',
        'cart_analytics_bd'
      )
      ORDER BY table_name
    `;

    const tableNames = tables.map(t => t.table_name);
    console.log('\nCurrent status of mobile optimization tables:');
    const requiredTables = [
      'cart_sms_subscription',
      'cart_sms_log',
      'cart_offline_sync',
      'cart_recovery_events',
      'cart_recovery_settings',
      'cart_share_tokens',
      'cart_wishlist_move_history',
      'cart_wishlist_sync',
      'cart_cleanup_audit',
      'cart_events',
      'cart_analytics_bd'
    ];

    requiredTables.forEach(table => {
      console.log(`  ${table}: ${tableNames.includes(table) ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    // If tables exist, mark migration as resolved
    const allTablesExist = requiredTables.every(table => tableNames.includes(table));

    if (allTablesExist) {
      console.log('\n✅ All required tables exist. Marking migration as resolved...');

      // Update the failed migration to mark it as finished
      await prisma.$executeRaw`
        UPDATE _prisma_migrations 
        SET finished_at = NOW(),
            applied_steps_count = '1'
        WHERE migration_name = '20250219_mobile_optimization_tables'
          AND finished_at IS NULL
      `;

      console.log('✅ Migration marked as resolved');

    } else {
      console.log('\n⚠️  Some tables are missing.');
      console.log('The migration needs to be applied properly.');
      console.log('Missing tables:');
      requiredTables.forEach(table => {
        if (!tableNames.includes(table)) {
          console.log(`  - ${table}`);
        }
      });
      process.exit(1);
    }

    // Verify fix
    console.log('\n🔍 Verifying fix...');
    const finalMigrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      WHERE migration_name = '20250219_mobile_optimization_tables'
    `;

    if (finalMigrations.length > 0 && finalMigrations[0].finished_at) {
      console.log('✅ SUCCESS: Migration is now marked as completed');
      console.log('\nNext Steps:');
      console.log('1. Restart your backend server');
      console.log('2. Verify all services are running');
      console.log('3. Test the mobile optimization features');
    } else {
      console.log('❌ ERROR: Migration was not properly resolved');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Failed to resolve migration:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resolveMobileMigration();
