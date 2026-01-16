/**
 * Resolve Failed Migration Script
 * 
 * This script resolves failed migrations by:
 * 1. Checking migration status
 * 2. Manually applying the migration if needed
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
      AND table_name IN ('permission', 'role_permission', 'role_hierarchy')
      ORDER BY table_name
    `;

    const tableNames = tables.map(t => t.table_name);
    console.log('\nCurrent status of required tables:');
    console.log(`  permission: ${tableNames.includes('permission') ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  role_permission: ${tableNames.includes('role_permission') ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  role_hierarchy: ${tableNames.includes('role_hierarchy') ? '✅ EXISTS' : '❌ MISSING'}`);

    // If tables exist, mark migration as resolved
    if (tableNames.includes('permission') && 
        tableNames.includes('role_permission') && 
        tableNames.includes('role_hierarchy')) {
      
      console.log('\n✅ All required tables exist. Marking migration as resolved...');
      
      // Update the failed migration to mark it as finished
      await prisma.$executeRaw`
        UPDATE _prisma_migrations 
        SET finished_at = NOW(),
            applied_steps_count = '3'
        WHERE migration_name = '20260113_rename_tables_to_snake_case'
          AND finished_at IS NULL
      `;
      
      console.log('✅ Migration marked as resolved');
      
    } else {
      console.log('\n⚠️  Some tables are missing. Creating them manually...');
      
      // Create missing tables
      if (!tableNames.includes('permission')) {
        console.log('Creating permission table...');
        await prisma.$executeRaw`
          CREATE TABLE permission (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            category TEXT NOT NULL,
            resource TEXT NOT NULL,
            action TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `;
        console.log('✅ Created permission table');
      }
      
      if (!tableNames.includes('role_permission')) {
        console.log('Creating role_permission table...');
        await prisma.$executeRaw`
          CREATE TABLE role_permission (
            role_id TEXT NOT NULL,
            permission_id TEXT NOT NULL,
            granted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            granted_by TEXT,
            PRIMARY KEY (role_id, permission_id)
          )
        `;
        console.log('✅ Created role_permission table');
      }
      
      if (!tableNames.includes('role_hierarchy')) {
        console.log('Creating role_hierarchy table...');
        await prisma.$executeRaw`
          CREATE TABLE role_hierarchy (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parent_role "UserRole" NOT NULL,
            child_role "UserRole" NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (parent_role, child_role)
          )
        `;
        console.log('✅ Created role_hierarchy table');
      }
      
      // Now mark migration as resolved
      console.log('\n✅ All tables created. Marking migration as resolved...');
      await prisma.$executeRaw`
        UPDATE _prisma_migrations 
        SET finished_at = NOW(),
            applied_steps_count = '3'
        WHERE migration_name = '20260113_rename_tables_to_snake_case'
          AND finished_at IS NULL
      `;
      
      console.log('✅ Migration marked as resolved');
    }

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('permission', 'role_permission', 'role_hierarchy')
      ORDER BY table_name
    `;
    
    const finalTableNames = finalTables.map(t => t.table_name);
    console.log('Final table status:');
    console.log(`  permission: ${finalTableNames.includes('permission') ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  role_permission: ${finalTableNames.includes('role_permission') ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  role_hierarchy: ${finalTableNames.includes('role_hierarchy') ? '✅ EXISTS' : '❌ MISSING'}`);

    if (finalTableNames.includes('permission') && 
        finalTableNames.includes('role_permission') && 
        finalTableNames.includes('role_hierarchy')) {
      console.log('\n✅ SUCCESS: All tables are now present');
      console.log('You can now run: node scripts/comprehensive-migration-solution.js');
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
