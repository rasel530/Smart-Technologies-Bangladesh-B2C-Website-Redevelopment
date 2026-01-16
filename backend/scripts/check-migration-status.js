/**
 * Check Migration Status
 * 
 * This script checks which migrations have been applied to the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  console.log('=== CHECKING MIGRATION STATUS ===\n');

  try {
    // Check if _prisma_migrations table exists
    const migrationsTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = '_prisma_migrations'
      )
    `;
    
    if (migrationsTableExists[0].exists) {
      console.log('✓ _prisma_migrations table exists\n');
      
      // Get all applied migrations
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, started_at, finished_at, applied_steps_count
        FROM "_prisma_migrations"
        ORDER BY started_at
      `;
      
      console.log('Applied migrations:');
      console.table(migrations);
      
      console.log(`\nTotal migrations applied: ${migrations.length}`);
    } else {
      console.log('✗ _prisma_migrations table does NOT exist');
      console.log('\nThis means no migrations have been tracked.');
      console.log('The database may have been created manually or with a different method.');
    }
    
    console.log('\n=== MIGRATION STATUS CHECK COMPLETE ===');
    
  } catch (error) {
    console.error('Error checking migration status:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();
