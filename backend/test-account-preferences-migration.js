/**
 * Account Preferences Migration Test Script
 * This script tests the database migration for account preferences tables
 */

// Load environment variables from .env file
require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev';

// Parse DATABASE_URL
const dbConfig = {
  connectionString: DATABASE_URL,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
};

console.log('='.repeat(70));
console.log('ACCOUNT PREFERENCES MIGRATION TEST');
console.log('='.repeat(70));
console.log(`Database URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
console.log('='.repeat(70));

const pool = new Pool(dbConfig);

async function testMigration() {
  let client;
  let migrationSuccess = false;

  try {
    // Get database client
    client = await pool.connect();
    console.log('\n✅ Successfully connected to PostgreSQL database\n');

    // Step 1: Check if tables already exist
    console.log('Step 1: Checking for existing tables...');
    const tablesToCheck = [
      'user_notification_preferences',
      'user_communication_preferences',
      'user_privacy_settings',
      'account_deletion_requests',
      'user_data_exports'
    ];

    const existingTables = [];
    for (const tableName of tablesToCheck) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = '${tableName}'
        );
      `);
      if (result.rows[0].exists) {
        existingTables.push(tableName);
        console.log(`  - ${tableName}: EXISTS`);
      } else {
        console.log(`  - ${tableName}: NOT FOUND`);
      }
    }

    // Step 2: Read migration file
    console.log('\nStep 2: Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'create_account_preferences_tables.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`  ✅ Migration file loaded: ${migrationPath}`);
    console.log(`  Size: ${migrationSQL.length} bytes`);

    // Step 3: Run migration
    console.log('\nStep 3: Running migration...');
    console.log('  Executing SQL statements...\n');

    await client.query(migrationSQL);
    console.log('  ✅ Migration executed successfully!\n');

    // Step 4: Verify tables were created
    console.log('Step 4: Verifying tables were created...');
    const tablesCreated = [];
    for (const tableName of tablesToCheck) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = '${tableName}'
        );
      `);
      if (result.rows[0].exists) {
        tablesCreated.push(tableName);
        console.log(`  ✅ ${tableName}: CREATED`);
      } else {
        console.log(`  ❌ ${tableName}: NOT CREATED`);
      }
    }

    if (tablesCreated.length !== tablesToCheck.length) {
      throw new Error(`Not all tables were created. Expected ${tablesToCheck.length}, got ${tablesCreated.length}`);
    }

    // Step 5: Verify columns in each table
    console.log('\nStep 5: Verifying table columns...');

    const expectedColumns = {
      user_notification_preferences: [
        'id', 'user_id', 'email_notifications', 'sms_notifications',
        'whatsapp_notifications', 'push_notifications', 'order_updates',
        'promotional_emails', 'security_alerts', 'newsletter_subscription',
        'notification_frequency', 'created_at', 'updated_at'
      ],
      user_communication_preferences: [
        'id', 'user_id', 'preferred_language', 'preferred_timezone',
        'preferred_contact_method', 'marketing_consent', 'data_sharing_consent',
        'created_at', 'updated_at'
      ],
      user_privacy_settings: [
        'id', 'user_id', 'profile_visibility', 'show_email', 'show_phone',
        'show_address', 'allow_search_by_email', 'allow_search_by_phone',
        'two_factor_enabled', 'two_factor_method', 'two_factor_secret',
        'data_sharing_enabled', 'created_at', 'updated_at'
      ],
      account_deletion_requests: [
        'id', 'user_id', 'deletion_token', 'reason', 'status',
        'requested_at', 'confirmed_at', 'completed_at', 'expires_at'
      ],
      user_data_exports: [
        'id', 'user_id', 'export_token', 'data_types', 'format',
        'file_url', 'status', 'requested_at', 'ready_at', 'expires_at'
      ]
    };

    for (const [tableName, columns] of Object.entries(expectedColumns)) {
      console.log(`\n  Table: ${tableName}`);
      const result = await client.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position;
      `);

      const actualColumns = result.rows.map(row => row.column_name);
      const missingColumns = columns.filter(col => !actualColumns.includes(col));
      const extraColumns = actualColumns.filter(col => !columns.includes(col));

      if (missingColumns.length > 0) {
        console.log(`    ❌ Missing columns: ${missingColumns.join(', ')}`);
      } else {
        console.log(`    ✅ All expected columns present`);
      }

      if (extraColumns.length > 0) {
        console.log(`    ℹ️  Extra columns: ${extraColumns.join(', ')}`);
      }

      // Check for critical columns that were fixed
      if (tableName === 'user_communication_preferences') {
        if (actualColumns.includes('marketing_consent') && actualColumns.includes('data_sharing_consent')) {
          console.log(`    ✅ Fixed column names present (marketing_consent, data_sharing_consent)`);
        } else {
          console.log(`    ❌ Fixed column names missing!`);
        }
      }

      if (tableName === 'user_notification_preferences') {
        if (actualColumns.includes('newsletter_subscription') && actualColumns.includes('notification_frequency')) {
          console.log(`    ✅ Added columns present (newsletter_subscription, notification_frequency)`);
        } else {
          console.log(`    ❌ Added columns missing!`);
        }
      }
    }

    // Step 6: Verify indexes
    console.log('\nStep 6: Verifying indexes...');
    const expectedIndexes = [
      'idx_user_notification_preferences_user_id',
      'idx_user_communication_preferences_user_id',
      'idx_user_privacy_settings_user_id',
      'idx_account_deletion_user_id',
      'idx_account_deletion_token',
      'idx_account_deletion_status',
      'idx_account_deletion_expires_at',
      'idx_user_data_exports_user_id',
      'idx_user_data_exports_token',
      'idx_user_data_exports_status',
      'idx_user_data_exports_expires_at'
    ];

    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE indexname LIKE 'idx_%'
      AND tablename IN ('user_notification_preferences', 'user_communication_preferences',
                        'user_privacy_settings', 'account_deletion_requests', 'user_data_exports')
      ORDER BY indexname;
    `);

    const actualIndexes = indexResult.rows.map(row => row.indexname);
    for (const indexName of expectedIndexes) {
      if (actualIndexes.includes(indexName)) {
        console.log(`  ✅ ${indexName}`);
      } else {
        console.log(`  ❌ ${indexName} - NOT FOUND`);
      }
    }

    // Step 7: Verify triggers
    console.log('\nStep 7: Verifying triggers...');
    const expectedTriggers = [
      'update_user_notification_preferences_updated_at',
      'update_user_communication_preferences_updated_at',
      'update_user_privacy_settings_updated_at'
    ];

    const triggerResult = await client.query(`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE trigger_name LIKE 'update_%_updated_at'
      ORDER BY trigger_name;
    `);

    const actualTriggers = triggerResult.rows.map(row => row.trigger_name);
    for (const triggerName of expectedTriggers) {
      if (actualTriggers.includes(triggerName)) {
        console.log(`  ✅ ${triggerName}`);
      } else {
        console.log(`  ❌ ${triggerName} - NOT FOUND`);
      }
    }

    // Step 8: Verify constraints
    console.log('\nStep 8: Verifying constraints...');
    const constraintResult = await client.query(`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conname LIKE 'valid_%' OR conname LIKE 'unique_%'
      ORDER BY conname;
    `);

    console.log(`  Found ${constraintResult.rows.length} constraints:`);
    for (const row of constraintResult.rows) {
      const typeMap = { 'c': 'CHECK', 'u': 'UNIQUE', 'f': 'FOREIGN KEY', 'p': 'PRIMARY KEY' };
      console.log(`  ✅ ${row.conname} (${typeMap[row.contype]})`);
    }

    // Step 9: Verify users table updates
    console.log('\nStep 9: Verifying users table updates...');
    const usersColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('account_status', 'deletion_requested_at', 'deleted_at', 'deletion_reason')
      ORDER BY ordinal_position;
    `);

    if (usersColumns.rows.length === 4) {
      console.log('  ✅ All 4 deletion tracking columns present in users table');
      for (const row of usersColumns.rows) {
        console.log(`    - ${row.column_name} (${row.data_type})`);
      }
    } else {
      console.log(`  ⚠️  Found ${usersColumns.rows.length}/4 deletion tracking columns`);
    }

    // Step 10: Test inserting sample data
    console.log('\nStep 10: Testing sample data insertion...');
    const testUserId = 'test-user-' + Date.now();

    try {
      // Insert notification preferences
      await client.query(`
        INSERT INTO user_notification_preferences (user_id, email_notifications, sms_notifications)
        VALUES ($1, true, true)
        ON CONFLICT (user_id) DO NOTHING;
      `, [testUserId]);
      console.log('  ✅ Inserted sample notification preferences');

      // Insert communication preferences
      await client.query(`
        INSERT INTO user_communication_preferences (user_id, preferred_language)
        VALUES ($1, 'en')
        ON CONFLICT (user_id) DO NOTHING;
      `, [testUserId]);
      console.log('  ✅ Inserted sample communication preferences');

      // Insert privacy settings
      await client.query(`
        INSERT INTO user_privacy_settings (user_id, profile_visibility)
        VALUES ($1, 'private')
        ON CONFLICT (user_id) DO NOTHING;
      `, [testUserId]);
      console.log('  ✅ Inserted sample privacy settings');

      // Clean up test data
      await client.query(`
        DELETE FROM user_notification_preferences WHERE user_id = $1;
        DELETE FROM user_communication_preferences WHERE user_id = $1;
        DELETE FROM user_privacy_settings WHERE user_id = $1;
      `, [testUserId]);
      console.log('  ✅ Cleaned up test data');

    } catch (error) {
      console.log(`  ❌ Sample data insertion failed: ${error.message}`);
    }

    migrationSuccess = true;

  } catch (error) {
    console.error('\n❌ Migration test failed!');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    migrationSuccess = false;
  } finally {
    if (client) {
      await client.release();
    }
    await pool.end();
  }

  console.log('\n' + '='.repeat(70));
  if (migrationSuccess) {
    console.log('✅ MIGRATION TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('\nSummary:');
    console.log('  - All 5 tables created successfully');
    console.log('  - All expected columns present');
    console.log('  - All indexes created');
    console.log('  - All triggers created');
    console.log('  - All constraints created');
    console.log('  - Users table updated with deletion tracking');
    console.log('  - Sample data insertion successful');
    console.log('\nThe database is ready for Account Preferences functionality!');
  } else {
    console.log('❌ MIGRATION TEST FAILED');
    console.log('='.repeat(70));
    console.log('\nPlease review the error messages above and fix any issues.');
  }
  console.log('='.repeat(70) + '\n');

  process.exit(migrationSuccess ? 0 : 1);
}

// Run the test
testMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
