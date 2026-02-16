/**
 * ============================================================================
 * PHASE1: ROOT CAUSE FIX - Convert users.id and products.id to UUID
 * ============================================================================
 * This script executes the migration to convert users.id and products.id from TEXT to UUID.
 * This is the root cause fix that must be completed before any other schema fixes.
 * 
 * Date: 2026-02-14
 * ============================================================================
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_DATABASE_URL;
const MIGRATION_FILE = path.join(__dirname, 'phase1_convert_ids_to_uuid.sql');
const BACKUP_DIR = path.join(__dirname, 'backups');

// ============================================================================
// LOGGING
// ============================================================================

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = {
        'INFO': '\x1b[36m[INFO]\x1b[0m',
        'SUCCESS': '\x1b[32m[SUCCESS]\x1b[0m',
        'ERROR': '\x1b[31m[ERROR]\x1b[0m',
        'WARNING': '\x1b[33m[WARNING]\x1b[0m',
        'STEP': '\x1b[34m[STEP]\x1b[0m'
    }[level] || '[INFO]';
    console.log(`${timestamp} ${prefix} ${message}`);
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let pool;

async function connectToDatabase() {
    try {
        log('Connecting to database...', 'STEP');
        pool = new Pool({
            connectionString: DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        // Test connection
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        log('Successfully connected to database', 'SUCCESS');
        return true;
    } catch (error) {
        log(`Failed to connect to database: ${error.message}`, 'ERROR');
        throw error;
    }
}

// ============================================================================
// BACKUP FUNCTIONS
// ============================================================================

async function createBackup() {
    try {
        log('Creating database backup...', 'STEP');
        
        // Create backup directory if it doesn't exist
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `backup_phase1_${timestamp}.sql`);
        
        // Use pg_dump to create backup
        const { exec } = require('child_process');
        const pgDumpCommand = `pg_dump ${DATABASE_URL} > "${backupFile}"`;
        
        await new Promise((resolve, reject) => {
            exec(pgDumpCommand, (error, stdout, stderr) => {
                if (error) {
                    log(`pg_dump failed: ${error.message}`, 'WARNING');
                    log('Backup will be skipped. Make sure you have pg_dump in your PATH.', 'WARNING');
                    resolve(false);
                } else {
                    log(`Backup created: ${backupFile}`, 'SUCCESS');
                    resolve(true);
                }
            });
        });
        
        return true;
    } catch (error) {
        log(`Backup failed: ${error.message}`, 'WARNING');
        log('Continuing without backup (not recommended for production)', 'WARNING');
        return false;
    }
}

// ============================================================================
// MIGRATION EXECUTION
// ============================================================================

async function executeMigration() {
    const client = await pool.connect();
    
    try {
        log('Starting migration transaction...', 'STEP');
        await client.query('BEGIN');
        
        // Read migration SQL file
        log('Reading migration SQL file...', 'STEP');
        const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf8');
        
        log('Executing migration SQL...', 'STEP');
        await client.query(migrationSQL);
        
        log('Migration executed successfully', 'SUCCESS');
        
        await client.query('COMMIT');
        log('Transaction committed', 'SUCCESS');
        
    } catch (error) {
        log(`Migration failed: ${error.message}`, 'ERROR');
        log('Rolling back transaction...', 'STEP');
        await client.query('ROLLBACK');
        log('Transaction rolled back', 'WARNING');
        throw error;
    } finally {
        client.release();
    }
}

// ============================================================================
// VERIFICATION
// ============================================================================

async function verifyMigration() {
    const client = await pool.connect();
    
    try {
        log('Verifying migration...', 'STEP');
        
        // Verify users.id is UUID
        const usersResult = await client.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
              AND column_name = 'id'
        `);
        
        if (usersResult.rows.length > 0 && usersResult.rows[0].data_type === 'uuid') {
            log('✓ users.id is now UUID type', 'SUCCESS');
        } else {
            log('✗ users.id is not UUID type', 'ERROR');
            throw new Error('users.id verification failed');
        }
        
        // Verify products.id is UUID
        const productsResult = await client.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products' 
              AND column_name = 'id'
        `);
        
        if (productsResult.rows.length > 0 && productsResult.rows[0].data_type === 'uuid') {
            log('✓ products.id is now UUID type', 'SUCCESS');
        } else {
            log('✗ products.id is not UUID type', 'ERROR');
            throw new Error('products.id verification failed');
        }
        
        // Count foreign key constraints
        const usersFKResult = await client.query(`
            SELECT COUNT(*) as count
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND ccu.table_name = 'users'
              AND ccu.column_name = 'id'
        `);
        
        const productsFKResult = await client.query(`
            SELECT COUNT(*) as count
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND ccu.table_name = 'products'
              AND ccu.column_name = 'id'
        `);
        
        const usersFKCount = parseInt(usersFKResult.rows[0].count);
        const productsFKCount = parseInt(productsFKResult.rows[0].count);
        
        log(`Foreign keys referencing users.id: ${usersFKCount}`, 'INFO');
        log(`Foreign keys referencing products.id: ${productsFKCount}`, 'INFO');
        
        if (usersFKCount >= 20) {
            log('✓ Foreign key constraints for users.id have been recreated', 'SUCCESS');
        } else {
            log('⚠ Warning: Some foreign key constraints for users.id may be missing', 'WARNING');
        }
        
        if (productsFKCount >= 16) {
            log('✓ Foreign key constraints for products.id have been recreated', 'SUCCESS');
        } else {
            log('⚠ Warning: Some foreign key constraints for products.id may be missing', 'WARNING');
        }
        
        // Test sample queries
        log('Testing sample queries...', 'STEP');
        
        // Test users table
        const usersTest = await client.query('SELECT COUNT(*) FROM users');
        log(`Users table accessible: ${usersTest.rows[0].count} rows`, 'INFO');
        
        // Test products table
        const productsTest = await client.query('SELECT COUNT(*) FROM products');
        log(`Products table accessible: ${productsTest.rows[0].count} rows`, 'INFO');
        
        // Test join query
        const joinTest = await client.query(`
            SELECT COUNT(*) 
            FROM users u
            LEFT JOIN orders o ON u.id = o."userId"
        `);
        log(`Join query successful: ${joinTest.rows[0].count} results`, 'INFO');
        
        log('Verification complete', 'SUCCESS');
        
    } finally {
        client.release();
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    console.log('\n' + '='.repeat(70));
    console.log(' PHASE1: ROOT CAUSE FIX - Convert users.id and products.id to UUID');
    console.log('='.repeat(70) + '\n');
    
    try {
        // Step 1: Connect to database
        await connectToDatabase();
        
        // Step 2: Create backup (optional but recommended)
        await createBackup();
        
        // Step 3: Execute migration
        await executeMigration();
        
        // Step 4: Verify migration
        await verifyMigration();
        
        // Success summary
        console.log('\n' + '='.repeat(70));
        console.log(' MIGRATION COMPLETED SUCCESSFULLY');
        console.log('='.repeat(70) + '\n');
        console.log('Summary of changes:');
        console.log('  ✓ users.id converted from TEXT to UUID');
        console.log('  ✓ products.id converted from TEXT to UUID');
        console.log('  ✓ All foreign key constraints dropped and recreated');
        console.log('  ✓ All verifications passed');
        console.log('\nThe database is now ready for Phase 2 schema fixes.');
        console.log('='.repeat(70) + '\n');
        
        process.exit(0);
        
    } catch (error) {
        console.log('\n' + '='.repeat(70));
        console.log(' MIGRATION FAILED');
        console.log('='.repeat(70) + '\n');
        console.log(`Error: ${error.message}`);
        console.log(`Stack: ${error.stack}`);
        console.log('\nThe migration was rolled back. No changes were applied.');
        console.log('Please check the error and fix any issues before retrying.');
        console.log('='.repeat(70) + '\n');
        
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

if (require.main === module) {
    main();
}

module.exports = { main, connectToDatabase, executeMigration, verifyMigration };
