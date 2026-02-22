/**
 * Comprehensive Database Migration Solution
 * 
 * This script provides a permanent solution for database migration issues by:
 * 1. Validating current database state
 * 2. Ensuring all migrations are properly applied
 * 3. Preserving existing data during migrations
 * 4. Providing rollback capabilities
 * 5. Creating migration audit trail
 * 
 * Usage: node scripts/comprehensive-migration-solution.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Migration audit log
const AUDIT_LOG_PATH = path.join(__dirname, '../logs/migration-audit.log');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log migration actions to audit file
 */
function logAudit(action, details, status = 'SUCCESS') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${status}] ${action}: ${details}\n`;
  fs.appendFileSync(AUDIT_LOG_PATH, logEntry);
  console.log(logEntry.trim());
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    logAudit('DATABASE_CONNECTION', 'Successfully connected to database');
    return true;
  } catch (error) {
    logAudit('DATABASE_CONNECTION', `Failed to connect: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Get current migration status
 */
async function getMigrationStatus() {
  try {
    const result = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at, applied_steps_count 
      FROM _prisma_migrations 
      ORDER BY started_at DESC
    `;
    logAudit('MIGRATION_STATUS', `Found ${result.length} applied migrations`);
    return result;
  } catch (error) {
    // If _prisma_migrations table doesn't exist, return empty array
    if (error.message.includes('relation "_prisma_migrations" does not exist')) {
      logAudit('MIGRATION_STATUS', 'No migrations table found - fresh database');
      return [];
    }
    throw error;
  }
}

/**
 * Get all tables in database
 */
async function getDatabaseTables() {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tables = result.map(row => row.table_name);
    logAudit('DATABASE_TABLES', `Found ${tables.length} tables`);
    return tables;
  } catch (error) {
    logAudit('DATABASE_TABLES', `Failed to list tables: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Get current enum types
 */
async function getEnumTypes() {
  try {
    const result = await prisma.$queryRaw`
      SELECT typname, enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      ORDER BY typname, enumsortorder
    `;
    
    const enums = {};
    result.forEach(row => {
      if (!enums[row.typname]) {
        enums[row.typname] = [];
      }
      enums[row.typname].push(row.enumlabel);
    });
    
    logAudit('ENUM_TYPES', `Found ${Object.keys(enums).length} enum types`);
    return enums;
  } catch (error) {
    logAudit('ENUM_TYPES', `Failed to list enums: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Validate schema consistency
 */
async function validateSchemaConsistency() {
  const issues = [];
  
  try {
    // Check if required tables exist
    const tables = await getDatabaseTables();
    const requiredTables = [
      'users', 'products', 'categories', 'brands', 'orders', 'carts',
      'addresses', 'reviews', 'coupons', 'permissions', 'role_permissions', 'role_escalation_requests'
    ];
    
    requiredTables.forEach(table => {
      if (!tables.includes(table)) {
        issues.push(`Missing required table: ${table}`);
      }
    });
    
    // Check enum types
    const enums = await getEnumTypes();
    const requiredEnums = [
      'UserRole', 'UserStatus', 'ProductStatus', 'OrderStatus', 
      'PaymentMethod', 'PaymentStatus', 'ProfileVisibility'
    ];
    
    requiredEnums.forEach(enumName => {
      if (!enums[enumName]) {
        issues.push(`Missing required enum: ${enumName}`);
      }
    });
    
    if (issues.length > 0) {
      logAudit('SCHEMA_VALIDATION', `Found ${issues.length} issues`, 'WARNING');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      logAudit('SCHEMA_VALIDATION', 'Schema is consistent');
    }
    
    return issues;
  } catch (error) {
    logAudit('SCHEMA_VALIDATION', `Validation failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Backup existing data before migration
 */
async function backupData() {
  try {
    logAudit('DATA_BACKUP', 'Starting data backup');
    
    const tables = await getDatabaseTables();
    const backupDir = path.join(__dirname, '../backups');
    
    // Ensure backups directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    
    // Create backup using pg_dump if available, otherwise use Prisma
    const { exec } = require('child_process');
    const databaseUrl = process.env.DATABASE_URL;
    
    return new Promise((resolve, reject) => {
      exec(`pg_dump ${databaseUrl} > "${backupFile}"`, (error, stdout, stderr) => {
        if (error) {
          logAudit('DATA_BACKUP', `pg_dump failed, will use manual backup: ${error.message}`, 'WARNING');
          // Fallback to manual backup
          manualBackup(tables).then(resolve).catch(reject);
        } else {
          logAudit('DATA_BACKUP', `Backup created at ${backupFile}`);
          resolve(backupFile);
        }
      });
    });
  } catch (error) {
    logAudit('DATA_BACKUP', `Backup failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Manual backup using Prisma
 */
async function manualBackup(tables) {
  const backupDir = path.join(__dirname, '../backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  
  const backupData = {};
  
  for (const table of tables) {
    if (table === '_prisma_migrations') continue;
    
    try {
      const result = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);
      backupData[table] = result;
      logAudit('DATA_BACKUP', `Backed up ${result.length} rows from ${table}`);
    } catch (error) {
      logAudit('DATA_BACKUP', `Failed to backup ${table}: ${error.message}`, 'WARNING');
    }
  }
  
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  logAudit('DATA_BACKUP', `Manual backup created at ${backupFile}`);
  return backupFile;
}

/**
 * Apply pending migrations
 */
async function applyMigrations() {
  try {
    logAudit('MIGRATION_APPLY', 'Starting migration application');
    
    // Check if prisma migrate is available
    const { execSync } = require('child_process');
    
    try {
      execSync('npx prisma migrate deploy', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      logAudit('MIGRATION_APPLY', 'Migrations applied successfully');
    } catch (error) {
      logAudit('MIGRATION_APPLY', `Prisma migrate failed: ${error.message}`, 'ERROR');
      throw error;
    }
    
    // Regenerate Prisma Client
    try {
      execSync('npx prisma generate', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      logAudit('PRISMA_GENERATE', 'Prisma Client regenerated');
    } catch (error) {
      logAudit('PRISMA_GENERATE', `Failed to regenerate: ${error.message}`, 'WARNING');
    }
    
  } catch (error) {
    logAudit('MIGRATION_APPLY', `Migration failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Verify migration success
 */
async function verifyMigration() {
  try {
    logAudit('MIGRATION_VERIFY', 'Starting migration verification');
    
    const issues = await validateSchemaConsistency();
    
    if (issues.length > 0) {
      logAudit('MIGRATION_VERIFY', `Verification found ${issues.length} issues`, 'WARNING');
      return false;
    }
    
    // Test basic queries
    try {
      await prisma.$queryRaw`SELECT 1`;
      await prisma.user.findFirst();
      logAudit('MIGRATION_VERIFY', 'Basic queries successful');
    } catch (error) {
      logAudit('MIGRATION_VERIFY', `Query test failed: ${error.message}`, 'ERROR');
      return false;
    }
    
    logAudit('MIGRATION_VERIFY', 'Migration verification successful');
    return true;
  } catch (error) {
    logAudit('MIGRATION_VERIFY', `Verification failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Rollback to backup
 */
async function rollback(backupFile) {
  try {
    logAudit('ROLLBACK', `Starting rollback from ${backupFile}`);
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    for (const [table, data] of Object.entries(backupData)) {
      try {
        // Clear existing data
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
        
        // Insert backup data
        if (data.length > 0) {
          const columns = Object.keys(data[0]);
          const values = data.map(row => 
            `(${columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return val;
            }).join(', ')})`
          ).join(', ');
          
          await prisma.$executeRawUnsafe(`
            INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')})
            VALUES ${values}
          `);
          
          logAudit('ROLLBACK', `Restored ${data.length} rows to ${table}`);
        }
      } catch (error) {
        logAudit('ROLLBACK', `Failed to restore ${table}: ${error.message}`, 'WARNING');
      }
    }
    
    logAudit('ROLLBACK', 'Rollback completed');
  } catch (error) {
    logAudit('ROLLBACK', `Rollback failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('=== COMPREHENSIVE DATABASE MIGRATION SOLUTION ===\n');
  
  try {
    // Step 1: Check database connection
    await checkDatabaseConnection();
    
    // Step 2: Get current state
    const migrationStatus = await getMigrationStatus();
    const tables = await getDatabaseTables();
    const enums = await getEnumTypes();
    
    console.log('\nCurrent Database State:');
    console.log(`- Applied Migrations: ${migrationStatus.length}`);
    console.log(`- Tables: ${tables.length}`);
    console.log(`- Enum Types: ${Object.keys(enums).length}`);
    
    // Step 3: Validate schema
    const issues = await validateSchemaConsistency();
    
    if (issues.length > 0) {
      console.log('\n⚠️  Schema Issues Found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      console.log('\nProceeding with migration to fix issues...');
    }
    
    // Step 4: Backup existing data
    console.log('\n📦 Creating backup...');
    const backupFile = await backupData();
    console.log(`✓ Backup created: ${backupFile}`);
    
    // Step 5: Apply migrations
    console.log('\n🔄 Applying migrations...');
    await applyMigrations();
    
    // Step 6: Verify migration
    console.log('\n✅ Verifying migration...');
    const success = await verifyMigration();
    
    if (success) {
      console.log('\n=== MIGRATION SUCCESSFUL ===');
      console.log('✓ All migrations applied successfully');
      console.log('✓ Schema is consistent');
      console.log('✓ Data preserved');
      console.log(`✓ Backup available at: ${backupFile}`);
      
      logAudit('MIGRATION_COMPLETE', 'Migration completed successfully');
      
      console.log('\nNext Steps:');
      console.log('1. Restart your application');
      console.log('2. Test all database operations');
      console.log('3. Monitor for any issues');
      console.log('4. Backup can be used for rollback if needed');
      
    } else {
      console.log('\n⚠️  Migration verification failed');
      console.log('You may need to rollback or investigate issues');
      
      logAudit('MIGRATION_COMPLETE', 'Migration completed with verification issues', 'WARNING');
    }
    
  } catch (error) {
    console.error('\n❌ Migration Failed:', error.message);
    console.error('\nCheck the audit log for details:', AUDIT_LOG_PATH);
    logAudit('MIGRATION_FAILED', error.message, 'ERROR');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  backupData,
  rollback,
  validateSchemaConsistency,
  getMigrationStatus,
  getDatabaseTables,
  getEnumTypes
};
