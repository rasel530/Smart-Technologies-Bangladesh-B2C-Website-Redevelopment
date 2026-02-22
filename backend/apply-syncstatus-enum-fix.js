/**
 * Script to apply the PostgreSQL enum type fix for cart_wishlist_sync and cart_wishlist_move_history tables
 * This script reads the migration SQL file and executes it against the database
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applyMigration() {
  let pool = null;
  
  try {
    log('='.repeat(60), 'cyan');
    log('PostgreSQL Enum Type Fix Migration', 'cyan');
    log('='.repeat(60), 'cyan');
    log('');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'fix_syncstatus_enum.sql');
    
    if (!fs.existsSync(migrationPath)) {
      log(`Error: Migration file not found at ${migrationPath}`, 'red');
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    log(`✓ Read migration file: ${migrationPath}`, 'green');
    log('');

    // Get database connection parameters from environment variables
    // Parse DATABASE_URL if available, otherwise use individual variables
    let dbConfig;
    
    if (process.env.DATABASE_URL) {
      // Parse DATABASE_URL: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
      const dbUrl = process.env.DATABASE_URL;
      const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      
      if (match) {
        dbConfig = {
          host: match[3],
          port: parseInt(match[4], 10),
          database: match[5],
          user: match[1],
          password: match[2]
        };
      } else {
        throw new Error('Invalid DATABASE_URL format');
      }
    } else {
      dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'smarttech_ecommerce',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
      };
    }

    log('Database Configuration:', 'blue');
    log(`  Host: ${dbConfig.host}`, 'blue');
    log(`  Port: ${dbConfig.port}`, 'blue');
    log(`  Database: ${dbConfig.database}`, 'blue');
    log(`  User: ${dbConfig.user}`, 'blue');
    log('');

    // Create connection pool
    log('Connecting to PostgreSQL database...', 'yellow');
    pool = new Pool(dbConfig);
    
    // Test connection
    const client = await pool.connect();
    log('✓ Connected to database successfully', 'green');
    log('');

    // Execute the migration
    log('Executing migration SQL...', 'yellow');
    const result = await client.query(migrationSQL);
    
    log('✓ Migration executed successfully', 'green');
    log('');

    // Display query results if any
    if (result && result.rows && result.rows.length > 0) {
      log('Verification Results:', 'cyan');
      log('-'.repeat(60), 'cyan');
      console.table(result.rows);
      log('');
    }

    log('='.repeat(60), 'green');
    log('Migration completed successfully!', 'green');
    log('='.repeat(60), 'green');
    log('');
    log('Next steps:', 'blue');
    log('  1. Run: npx prisma generate', 'blue');
    log('  2. Restart the backend server', 'blue');
    log('  3. Test the cart-wishlist sync endpoints', 'blue');
    log('');

    // Release client
    client.release();

  } catch (error) {
    log('', 'red');
    log('='.repeat(60), 'red');
    log('Migration failed!', 'red');
    log('='.repeat(60), 'red');
    log('');
    log('Error Details:', 'red');
    log(`  Message: ${error.message}`, 'red');
    
    if (error.code) {
      log(`  Code: ${error.code}`, 'red');
    }
    
    if (error.detail) {
      log(`  Detail: ${error.detail}`, 'red');
    }
    
    if (error.hint) {
      log(`  Hint: ${error.hint}`, 'red');
    }
    
    log('');
    log('Stack Trace:', 'yellow');
    console.error(error);
    log('');
    process.exit(1);
    
  } finally {
    // Close the connection pool
    if (pool) {
      await pool.end();
      log('Database connection closed', 'yellow');
    }
  }
}

// Execute the migration
applyMigration();
