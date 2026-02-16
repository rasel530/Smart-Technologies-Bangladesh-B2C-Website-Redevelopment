#!/usr/bin/env node

/**
 * Database Backup Script for Wishlist Migration
 * 
 * This script creates a comprehensive backup of the database before
 * executing the wishlist migration. It backs up both schema and data.
 * 
 * Usage: node backend/migrations/backup_database.js
 * 
 * Environment Variables Required:
 * - DATABASE_URL: PostgreSQL connection string
 * - BACKUP_DIR: Directory to store backups (optional, defaults to ./backups)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const BACKUP_NAME = `wishlist_migration_backup_${TIMESTAMP}`;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    logSuccess(`Created backup directory: ${BACKUP_DIR}`);
  } else {
    log(`Using existing backup directory: ${BACKUP_DIR}`, 'blue');
  }
}

/**
 * Get database connection info from DATABASE_URL
 */
function parseDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Parse connection string: postgresql://user:password@host:port/database
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}

/**
 * Create schema backup using pg_dump
 */
async function createSchemaBackup(dbInfo, backupPath) {
  logStep('1', 'Creating schema backup...');

  const schemaBackupPath = path.join(backupPath, `${BACKUP_NAME}_schema.sql`);

  try {
    // Use pg_dump to create schema backup
    const pgDumpCommand = `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} --schema-only --no-owner --no-privileges --file="${schemaBackupPath}"`;

    // Set PGPASSWORD environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: dbInfo.password };

    execSync(pgDumpCommand, { env, stdio: 'inherit' });

    const stats = fs.statSync(schemaBackupPath);
    logSuccess(`Schema backup created: ${schemaBackupPath}`);
    log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`, 'blue');

    return schemaBackupPath;
  } catch (error) {
    throw new Error(`Failed to create schema backup: ${error.message}`);
  }
}

/**
 * Create data backup using pg_dump
 */
async function createDataBackup(dbInfo, backupPath) {
  logStep('2', 'Creating data backup...');

  const dataBackupPath = path.join(backupPath, `${BACKUP_NAME}_data.sql`);

  try {
    // Use pg_dump to create data backup
    const pgDumpCommand = `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} --data-only --no-owner --no-privileges --file="${dataBackupPath}"`;

    // Set PGPASSWORD environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: dbInfo.password };

    execSync(pgDumpCommand, { env, stdio: 'inherit' });

    const stats = fs.statSync(dataBackupPath);
    logSuccess(`Data backup created: ${dataBackupPath}`);
    log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`, 'blue');

    return dataBackupPath;
  } catch (error) {
    throw new Error(`Failed to create data backup: ${error.message}`);
  }
}

/**
 * Create complete backup using pg_dump
 */
async function createCompleteBackup(dbInfo, backupPath) {
  logStep('3', 'Creating complete backup (schema + data)...');

  const completeBackupPath = path.join(backupPath, `${BACKUP_NAME}_complete.sql`);

  try {
    // Use pg_dump to create complete backup
    const pgDumpCommand = `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} --no-owner --no-privileges --file="${completeBackupPath}"`;

    // Set PGPASSWORD environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: dbInfo.password };

    execSync(pgDumpCommand, { env, stdio: 'inherit' });

    const stats = fs.statSync(completeBackupPath);
    logSuccess(`Complete backup created: ${completeBackupPath}`);
    log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`, 'blue');

    return completeBackupPath;
  } catch (error) {
    throw new Error(`Failed to create complete backup: ${error.message}`);
  }
}

/**
 * Verify backup integrity
 */
async function verifyBackup(backupPath) {
  logStep('4', 'Verifying backup integrity...');

  try {
    const content = fs.readFileSync(backupPath, 'utf8');

    // Check if backup contains essential PostgreSQL markers
    const hasPostgresHeader = content.includes('PostgreSQL database dump');
    const hasSchemaStatements = content.includes('CREATE TABLE') || content.includes('CREATE SCHEMA');
    const hasDataStatements = content.includes('INSERT INTO') || content.includes('COPY');

    if (!hasPostgresHeader) {
      throw new Error('Backup does not appear to be a valid PostgreSQL dump');
    }

    logSuccess('Backup integrity verified');
    log(`  Contains schema statements: ${hasSchemaStatements ? 'Yes' : 'No'}`, 'blue');
    log(`  Contains data statements: ${hasDataStatements ? 'Yes' : 'No'}`, 'blue');

    return true;
  } catch (error) {
    throw new Error(`Backup verification failed: ${error.message}`);
  }
}

/**
 * Create backup metadata file
 */
function createBackupMetadata(backupPath, dbInfo, schemaBackup, dataBackup, completeBackup) {
  logStep('5', 'Creating backup metadata...');

  const metadata = {
    backupName: BACKUP_NAME,
    timestamp: new Date().toISOString(),
    database: {
      host: dbInfo.host,
      port: dbInfo.port,
      database: dbInfo.database,
      user: dbInfo.user,
    },
    files: {
      schema: schemaBackup,
      data: dataBackup,
      complete: completeBackup,
    },
    purpose: 'Pre-migration backup for Phase 6, Milestone 2: Wishlist Management',
    restoreInstructions: `
# Restore Instructions

## Option 1: Restore Complete Backup
psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} -f "${completeBackup}"

## Option 2: Restore Schema Only
psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} -f "${schemaBackup}"

## Option 3: Restore Data Only
psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} -f "${dataBackup}"

## Note: Set PGPASSWORD environment variable before running restore commands
export PGPASSWORD='${dbInfo.password}'
`,
  };

  const metadataPath = path.join(backupPath, `${BACKUP_NAME}_metadata.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  logSuccess(`Backup metadata created: ${metadataPath}`);

  return metadataPath;
}

/**
 * Get table counts for verification
 */
async function getTableCounts(pool) {
  const query = `
    SELECT 
      schemaname,
      tablename,
      n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY schemaname, tablename;
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * Create pre-migration snapshot
 */
async function createPreMigrationSnapshot(pool, backupPath) {
  logStep('6', 'Creating pre-migration snapshot...');

  try {
    const tableCounts = await getTableCounts(pool);
    const snapshotPath = path.join(backupPath, `${BACKUP_NAME}_snapshot.json`);

    const snapshot = {
      timestamp: new Date().toISOString(),
      tables: tableCounts.map(row => ({
        schema: row.schemaname,
        table: row.tablename,
        rowCount: row.row_count,
      })),
    };

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

    logSuccess(`Pre-migration snapshot created: ${snapshotPath}`);
    log(`  Total tables: ${tableCounts.length}`, 'blue');
    log(`  Total rows: ${tableCounts.reduce((sum, row) => sum + (row.row_count || 0), 0)}`, 'blue');

    return snapshotPath;
  } catch (error) {
    throw new Error(`Failed to create pre-migration snapshot: ${error.message}`);
  }
}

/**
 * Main backup function
 */
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('DATABASE BACKUP SCRIPT', 'bright');
  log('Phase 6, Milestone 2: Wishlist Management', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  try {
    // Parse database URL
    const dbInfo = parseDatabaseUrl();
    log(`Database: ${dbInfo.database}`, 'blue');
    log(`Host: ${dbInfo.host}:${dbInfo.port}`, 'blue');
    log(`User: ${dbInfo.user}`, 'blue');

    // Create backup directory
    ensureBackupDir();

    // Create backup subdirectory
    const backupPath = path.join(BACKUP_DIR, BACKUP_NAME);
    fs.mkdirSync(backupPath, { recursive: true });
    log(`Backup directory: ${backupPath}`, 'blue');

    // Create database connection for snapshot
    const pool = new Pool({
      host: dbInfo.host,
      port: dbInfo.port,
      database: dbInfo.database,
      user: dbInfo.user,
      password: dbInfo.password,
    });

    try {
      // Create backups
      const schemaBackup = await createSchemaBackup(dbInfo, backupPath);
      const dataBackup = await createDataBackup(dbInfo, backupPath);
      const completeBackup = await createCompleteBackup(dbInfo, backupPath);

      // Verify backup
      await verifyBackup(completeBackup);

      // Create metadata
      createBackupMetadata(backupPath, dbInfo, schemaBackup, dataBackup, completeBackup);

      // Create pre-migration snapshot
      await createPreMigrationSnapshot(pool, backupPath);

      // Summary
      log('\n' + '='.repeat(60), 'bright');
      log('BACKUP COMPLETED SUCCESSFULLY', 'bright');
      log('='.repeat(60) + '\n', 'bright');

      log('Backup Details:', 'cyan');
      log(`  Name: ${BACKUP_NAME}`, 'blue');
      log(`  Location: ${backupPath}`, 'blue');
      log(`  Timestamp: ${TIMESTAMP}`, 'blue');

      log('\nBackup Files:', 'cyan');
      log(`  1. Schema: ${path.basename(schemaBackup)}`, 'blue');
      log(`  2. Data: ${path.basename(dataBackup)}`, 'blue');
      log(`  3. Complete: ${path.basename(completeBackup)}`, 'blue');
      log(`  4. Metadata: ${path.basename(backupPath + '/' + BACKUP_NAME + '_metadata.json')}`, 'blue');
      log(`  5. Snapshot: ${path.basename(backupPath + '/' + BACKUP_NAME + '_snapshot.json')}`, 'blue');

      log('\nNext Steps:', 'cyan');
      log('  1. Review backup files to ensure they were created correctly', 'blue');
      log('  2. Run the safe migration script', 'blue');
      log('  3. Verify migration success', 'blue');
      log('  4. Test wishlist functionality', 'blue');

      log('\nRestore Instructions:', 'cyan');
      log(`  See ${BACKUP_NAME}_metadata.json for detailed restore instructions`, 'blue');

      log('\n✓ Backup completed successfully!', 'green');
    } finally {
      await pool.end();
    }
  } catch (error) {
    logError(`Backup failed: ${error.message}`);
    log('\nTroubleshooting:', 'cyan');
    log('  1. Ensure DATABASE_URL environment variable is set', 'blue');
    log('  2. Ensure pg_dump is installed and in PATH', 'blue');
    log('  3. Ensure database is accessible', 'blue');
    log('  4. Ensure backup directory is writable', 'blue');
    process.exit(1);
  }
}

// Run backup
main();
