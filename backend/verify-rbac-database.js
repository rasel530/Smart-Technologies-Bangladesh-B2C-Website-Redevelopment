/**
 * RBAC Database Verification Script
 * 
 * This script verifies that all RBAC tables exist in the database and checks their structure.
 * It also provides detailed information about the current state of the RBAC database.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smart_ecommerce',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// RBAC tables that should exist
const RBAC_TABLES = [
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  'role_escalation_requests'
];

// Helper function to log with timestamp
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// Check if a table exists
async function tableExists(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    log(`Error checking table ${tableName}: ${error.message}`, 'error');
    return false;
  }
}

// Get table row count
async function getTableRowCount(tableName) {
  try {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    log(`Error getting row count for ${tableName}: ${error.message}`, 'error');
    return null;
  }
}

// Get table structure
async function getTableStructure(tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    return result.rows;
  } catch (error) {
    log(`Error getting structure for ${tableName}: ${error.message}`, 'error');
    return null;
  }
}

// Check if indexes exist
async function checkIndexes(tableName) {
  try {
    const result = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = $1 AND schemaname = 'public';
    `, [tableName]);
    return result.rows;
  } catch (error) {
    log(`Error checking indexes for ${tableName}: ${error.message}`, 'error');
    return null;
  }
}

// Main verification function
async function verifyRBACDatabase() {
  log('========================================', 'info');
  log('RBAC DATABASE VERIFICATION', 'info');
  log('========================================', 'info');
  log('', 'info');

  try {
    // Test database connection
    log('Testing database connection...', 'info');
    await pool.query('SELECT NOW()');
    log('✓ Database connection successful', 'success');
    log('', 'info');

    // Verify each RBAC table
    let allTablesExist = true;
    const tableResults = [];

    for (const tableName of RBAC_TABLES) {
      log(`Checking table: ${tableName}`, 'info');
      
      const exists = await tableExists(tableName);
      
      if (exists) {
        const rowCount = await getTableRowCount(tableName);
        const structure = await getTableStructure(tableName);
        const indexes = await checkIndexes(tableName);
        
        log(`✓ Table exists with ${rowCount} rows`, 'success');
        log(`  Columns: ${structure.length}`, 'info');
        log(`  Indexes: ${indexes.length}`, 'info');
        
        tableResults.push({
          table: tableName,
          exists: true,
          rowCount,
          columnCount: structure.length,
          indexCount: indexes.length
        });
      } else {
        log(`✗ Table does NOT exist`, 'error');
        allTablesExist = false;
        tableResults.push({
          table: tableName,
          exists: false,
          rowCount: 0,
          columnCount: 0,
          indexCount: 0
        });
      }
      log('', 'info');
    }

    // Check for helper functions
    log('Checking helper functions...', 'info');
    const functions = [
      'user_has_permission',
      'get_user_permissions',
      'get_user_roles',
      'user_has_minimum_role_level',
      'update_updated_at_column'
    ];

    for (const funcName of functions) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc
          WHERE proname = $1
        );
      `, [funcName]);
      
      if (result.rows[0].exists) {
        log(`✓ Function exists: ${funcName}`, 'success');
      } else {
        log(`✗ Function missing: ${funcName}`, 'error');
        allTablesExist = false;
      }
    }
    log('', 'info');

    // Summary
    log('========================================', 'info');
    log('VERIFICATION SUMMARY', 'info');
    log('========================================', 'info');
    
    if (allTablesExist) {
      log('✓ ALL RBAC TABLES AND FUNCTIONS EXIST', 'success');
      log('Database migration is complete and verified', 'success');
    } else {
      log('✗ SOME TABLES OR FUNCTIONS ARE MISSING', 'error');
      log('Database migration needs to be applied', 'warning');
    }
    
    log('', 'info');
    log('Table Status:', 'info');
    tableResults.forEach(result => {
      const status = result.exists ? '✓' : '✗';
      log(`  ${status} ${result.table}: ${result.exists ? `${result.rowCount} rows` : 'MISSING'}`, 
          result.exists ? 'success' : 'error');
    });
    log('', 'info');

    // Save results to file
    const reportPath = path.join(__dirname, 'rbac-database-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      allTablesExist,
      tables: tableResults,
      functions: functions
    }, null, 2));
    
    log(`Detailed report saved to: ${reportPath}`, 'info');

    return allTablesExist;

  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error');
    log(error.stack, 'error');
    return false;
  } finally {
    await pool.end();
  }
}

// Run verification
verifyRBACDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
