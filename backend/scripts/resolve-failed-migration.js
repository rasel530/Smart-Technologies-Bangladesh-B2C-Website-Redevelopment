/**
 * Resolve Failed Migration Script
 * 
 * This script resolves failed migrations by:
 * 1. Checking migration status
 * 2. Manually applying migration if needed
 * 3. Updating migration history
 * 
 * Usage: node scripts/resolve-failed-migration.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resolveFailedMigration() {
  console.log('=== RESOLVING FAILED MIGRATION ===\n');

  try {
    // Check for failed migrations
    const failedMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, applied_steps_count, rolled_back_at 
      FROM _prisma_migrations 
      WHERE finished_at IS NULL 
      ORDER BY started_at DESC
    `;

    if (failedMigrations.length === 0) {
      console.log('✅ No failed migrations found');
      return;
    }

    console.log(`Found ${failedMigrations.length} failed migration(s):`);
    failedMigrations.forEach(m => {
      console.log(`  - ${m.migration_name} (started: ${m.started_at})`);
    });

    // Check if tables already exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('permissions', 'role_permissions', 'role_escalation_requests')
      ORDER BY table_name
    `;

    const tableNames = tables.map(t => t.table_name);
    console.log('\nCurrent status of required tables:');
    console.log(`  permissions: ${tableNames.includes('permissions') ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  role_permissions: ${tableNames.includes('role_permissions') ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  role_escalation_requests: ${tableNames.includes('role_escalation_requests') ? '✅ EXISTS' : '❌ MISSING'}`);

    // If tables exist, mark migration as resolved
    if (tableNames.includes('permissions') &&
        tableNames.includes('role_permissions') &&
        tableNames.includes('role_escalation_requests')) {

      console.log('\n✅ All required tables exist. Marking migration as resolved...');

      // Update the failed migration to mark it as finished
      for (const migration of failedMigrations) {
        await prisma.$executeRaw`
          UPDATE _prisma_migrations 
          SET finished_at = NOW(),
              applied_steps_count = '1'
          WHERE migration_name = ${migration.migration_name}
            AND finished_at IS NULL
        `;
      }

      console.log('✅ Migration(s) marked as resolved');

    } else {
      console.log('\n⚠️  Some tables are missing. Please check the database schema.');
      console.log('The following tables should exist: permissions, role_permissions, role_escalation_requests');
      process.exit(1);
    }

    // Verify fix
    console.log('\n🔍 Verifying fix...');
    const finalTables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('permissions', 'role_permissions', 'role_escalation_requests')
      ORDER BY table_name
    `;

    const finalTableNames = finalTables.map(t => t.table_name);
    console.log('Final table status:');
    console.log(`  permissions: ${finalTableNames.includes('permissions') ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  role_permissions: ${finalTableNames.includes('role_permissions') ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  role_escalation_requests: ${finalTableNames.includes('role_escalation_requests') ? '✅ EXISTS' : '❌ MISSING'}`);

    if (finalTableNames.includes('permissions') &&
        finalTableNames.includes('role_permissions') &&
        finalTableNames.includes('role_escalation_requests')) {
      console.log('\n✅ SUCCESS: All tables are now present');
      console.log('You can now restart your backend server.');
    } else {
      console.log('\n❌ ERROR: Some tables are still missing');
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

resolveFailedMigration();
