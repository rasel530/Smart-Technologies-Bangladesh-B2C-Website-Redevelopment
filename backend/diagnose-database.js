#!/usr/bin/env node

/**
 * Database Diagnostic Script
 * 
 * This script diagnoses the state of the smart_ecommerce_dev database:
 * - Checks database connection
 * - Lists all tables
 * - Verifies migration history
 * - Checks data counts in key tables
 * - Identifies missing tables or data
 */

const { PrismaClient } = require('@prisma/client');

console.log('🔍 Starting Database Diagnostics...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@postgres:5432/smart_ecommerce_dev'
    }
  }
});

// Expected tables based on schema.prisma
const EXPECTED_TABLES = [
  'users',
  'addresses',
  'user_sessions',
  'user_social_accounts',
  'brands',
  'categories',
  'products',
  'product_images',
  'product_specifications',
  'product_variants',
  'carts',
  'cart_items',
  'wishlists',
  'wishlist_items',
  'orders',
  'order_items',
  'transactions',
  'reviews',
  'coupons',
  'email_verification_tokens',
  'phone_otps',
  'password_history',
  'user_notification_preferences',
  'user_communication_preferences',
  'user_privacy_settings',
  'account_deletion_requests',
  'user_data_exports',
  '_prisma_migrations'
];

async function diagnoseDatabase() {
  try {
    // Test connection
    console.log('1️⃣ Testing Database Connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Get list of tables
    console.log('2️⃣ Listing Database Tables...');
    const tablesResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const existingTables = tablesResult.map(t => t.table_name);
    console.log(`📊 Found ${existingTables.length} tables in database:`);
    existingTables.forEach(table => console.log(`   ✓ ${table}`));
    console.log('');

    // Check for missing tables
    console.log('3️⃣ Checking for Missing Tables...');
    const missingTables = EXPECTED_TABLES.filter(table => !existingTables.includes(table));
    if (missingTables.length > 0) {
      console.log(`❌ Missing ${missingTables.length} tables:`);
      missingTables.forEach(table => console.log(`   ✗ ${table}`));
    } else {
      console.log('✅ All expected tables are present');
    }
    console.log('');

    // Check migration history
    console.log('4️⃣ Checking Migration History...');
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, started_at, finished_at, applied_steps_count
        FROM _prisma_migrations
        ORDER BY started_at DESC
      `;
      
      if (migrations.length === 0) {
        console.log('❌ No migrations have been applied!');
      } else {
        console.log(`✅ Found ${migrations.length} applied migrations:`);
        migrations.forEach(m => {
          console.log(`   - ${m.migration_name}`);
          console.log(`     Started: ${m.started_at}`);
          console.log(`     Finished: ${m.finished_at}`);
          console.log(`     Steps: ${m.applied_steps_count}`);
        });
      }
    } catch (error) {
      console.log('❌ Could not read migration history:', error.message);
    }
    console.log('');

    // Check data counts in key tables
    console.log('5️⃣ Checking Data Counts in Key Tables...');
    const keyTables = ['users', 'products', 'categories', 'brands', 'orders', 'carts'];
    
    for (const tableName of keyTables) {
      if (existingTables.includes(tableName)) {
        try {
          const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
          const count = result[0].count;
          console.log(`   ${tableName}: ${count} rows`);
        } catch (error) {
          console.log(`   ${tableName}: ERROR - ${error.message}`);
        }
      } else {
        console.log(`   ${tableName}: TABLE MISSING`);
      }
    }
    console.log('');

    // Check for Prisma migration lock
    console.log('6️⃣ Checking Migration Lock Status...');
    try {
      const lockResult = await prisma.$queryRaw`
        SELECT is_locked 
        FROM _prisma_migrations_lock
      `;
      const isLocked = lockResult[0]?.is_locked;
      console.log(`   Migration lock: ${isLocked ? 'LOCKED' : 'UNLOCKED'}`);
      if (isLocked) {
        console.log('   ⚠️  Migration lock is set! This may prevent new migrations.');
      }
    } catch (error) {
      console.log('   ℹ️  No migration lock found (this is normal if no migrations run yet)');
    }
    console.log('');

    // Check database size
    console.log('7️⃣ Checking Database Size...');
    try {
      const sizeResult = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size('smart_ecommerce_dev')) as size
      `;
      console.log(`   Database size: ${sizeResult[0].size}`);
    } catch (error) {
      console.log(`   ERROR: ${error.message}`);
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total tables found: ${existingTables.length}`);
    console.log(`Expected tables: ${EXPECTED_TABLES.length}`);
    console.log(`Missing tables: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('');
      console.log('⚠️  ISSUES FOUND:');
      console.log('   - Some tables are missing');
      console.log('   - This may indicate migrations have not been run');
      console.log('   - Or the database was reset/cleared');
    }
    
    if (existingTables.length > 0 && missingTables.length === 0) {
      console.log('');
      console.log('✅ Schema appears complete');
      console.log('   Check data counts above to verify if data is missing');
    }
    
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnostics
diagnoseDatabase()
  .then(() => {
    console.log('\n✅ Diagnostics completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostics failed:', error);
    process.exit(1);
  });
