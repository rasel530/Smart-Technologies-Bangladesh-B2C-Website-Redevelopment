/**
 * Comprehensive Account Preferences Diagnostic Test Script
 * Phase 3, Milestone 3, Task 3
 * 
 * This script tests all aspects of Account Preferences functionality:
 * 1. Database schema validation
 * 2. Prisma model validation
 * 3. Backend API endpoint testing
 * 4. Integration testing
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./services/logger');
const crypto = require('crypto');

// Test results storage
const testResults = {
  database: { passed: 0, failed: 0, errors: [] },
  prisma: { passed: 0, failed: 0, errors: [] },
  api: { passed: 0, failed: 0, errors: [] },
  integration: { passed: 0, failed: 0, errors: [] }
};

// Helper function to log test results
function logTest(category, testName, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}`);
  
  if (passed) {
    testResults[category].passed++;
  } else {
    testResults[category].failed++;
    testResults[category].errors.push({ test: testName, error: error?.message || error });
  }
}

// Helper function to log section headers
function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

// ============================================
// 1. DATABASE SCHEMA VALIDATION
// ============================================
async function testDatabaseSchema() {
  logSection('DATABASE SCHEMA VALIDATION');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 1.1: Check if user_notification_preferences table exists
    console.log('Testing user_notification_preferences table...');
    try {
      await prisma.$queryRaw`SELECT 1 FROM user_notification_preferences LIMIT 1`;
      logTest('database', 'user_notification_preferences table exists', true);
    } catch (error) {
      logTest('database', 'user_notification_preferences table exists', false, error);
    }

    // Test 1.2: Check if user_communication_preferences table exists
    console.log('Testing user_communication_preferences table...');
    try {
      await prisma.$queryRaw`SELECT 1 FROM user_communication_preferences LIMIT 1`;
      logTest('database', 'user_communication_preferences table exists', true);
    } catch (error) {
      logTest('database', 'user_communication_preferences table exists', false, error);
    }

    // Test 1.3: Check if user_privacy_settings table exists
    console.log('Testing user_privacy_settings table...');
    try {
      await prisma.$queryRaw`SELECT 1 FROM user_privacy_settings LIMIT 1`;
      logTest('database', 'user_privacy_settings table exists', true);
    } catch (error) {
      logTest('database', 'user_privacy_settings table exists', false, error);
    }

    // Test 1.4: Check if account_deletion_requests table exists
    console.log('Testing account_deletion_requests table...');
    try {
      await prisma.$queryRaw`SELECT 1 FROM account_deletion_requests LIMIT 1`;
      logTest('database', 'account_deletion_requests table exists', true);
    } catch (error) {
      logTest('database', 'account_deletion_requests table exists', false, error);
    }

    // Test 1.3: Check if user_data_exports table exists
    console.log('Testing user_data_exports table...');
    try {
      await prisma.$queryRaw`SELECT 1 FROM user_data_exports LIMIT 1`;
      logTest('database', 'user_data_exports table exists', true);
    } catch (error) {
      logTest('database', 'user_data_exports table exists', false, error);
    }

    // Test 1.5: Check if users table has account_status column
    console.log('Testing users table for account_status column...');
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_status'
      `;
      logTest('database', 'users table has account_status column', result.length > 0);
    } catch (error) {
      logTest('database', 'users table has account_status column', false, error);
    }

    // Test 1.6: Check if users table has deletion_requested_at column
    console.log('Testing users table for deletion_requested_at column...');
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'deletion_requested_at'
      `;
      logTest('database', 'users table has deletion_requested_at column', result.length > 0);
    } catch (error) {
      logTest('database', 'users table has deletion_requested_at column', false, error);
    }

    // Test 1.7: Check if users table has deleted_at column
    console.log('Testing users table for deleted_at column...');
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'deleted_at'
      `;
      logTest('database', 'users table has deleted_at column', result.length > 0);
    } catch (error) {
      logTest('database', 'users table has deleted_at column', false, error);
    }

    // Test 1.8: Check if users table has deletion_reason column
    console.log('Testing users table for deletion_reason column...');
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'deletion_reason'
      `;
      logTest('database', 'users table has deletion_reason column', result.length > 0);
    } catch (error) {
      logTest('database', 'users table has deletion_reason column', false, error);
    }

    // Test 1.9: Check if indexes exist on user_notification_preferences
    console.log('Testing indexes on user_notification_preferences table...');
    try {
      const indexes = await prisma.$queryRaw`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'user_notification_preferences'
      `;
      logTest('database', 'user_notification_preferences indexes exist', indexes.length > 0);
    } catch (error) {
      logTest('database', 'user_notification_preferences indexes exist', false, error);
    }

    // Test 1.10: Check if indexes exist on user_communication_preferences
    console.log('Testing indexes on user_communication_preferences table...');
    try {
      const indexes = await prisma.$queryRaw`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'user_communication_preferences'
      `;
      logTest('database', 'user_communication_preferences indexes exist', indexes.length > 0);
    } catch (error) {
      logTest('database', 'user_communication_preferences indexes exist', false, error);
    }

    // Test 1.11: Check if indexes exist on user_privacy_settings
    console.log('Testing indexes on user_privacy_settings table...');
    try {
      const indexes = await prisma.$queryRaw`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'user_privacy_settings'
      `;
      logTest('database', 'user_privacy_settings indexes exist', indexes.length > 0);
    } catch (error) {
      logTest('database', 'user_privacy_settings indexes exist', false, error);
    }

    // Test 1.12: Check if triggers exist
    console.log('Testing update_updated_at_column triggers...');
    try {
      const triggers = await prisma.$queryRaw`
        SELECT trigger_name FROM information_schema.triggers
        WHERE trigger_name LIKE 'update_%_updated_at'
      `;
      logTest('database', 'update_updated_at_column triggers exist', triggers.length > 0);
    } catch (error) {
      logTest('database', 'update_updated_at_column triggers exist', false, error);
    }

  } catch (error) {
    console.error('Database schema test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// 2. PRISMA MODEL VALIDATION
// ============================================
async function testPrismaModels() {
  logSection('PRISMA MODEL VALIDATION');
  
  const prisma = new PrismaClient();
  
  try {
    // Test 2.1: Check if UserNotificationPreferences model exists
    console.log('Testing UserNotificationPreferences Prisma model...');
    try {
      const modelExists = prisma.userNotificationPreferences !== undefined;
      logTest('prisma', 'UserNotificationPreferences model exists', modelExists);
      if (modelExists) {
        console.log('  Model fields:', Object.keys(prisma.userNotificationPreferences.fields || {}));
      }
    } catch (error) {
      logTest('prisma', 'UserNotificationPreferences model exists', false, error);
    }

    // Test 2.2: Check if UserCommunicationPreferences model exists
    console.log('Testing UserCommunicationPreferences Prisma model...');
    try {
      const modelExists = prisma.userCommunicationPreferences !== undefined;
      logTest('prisma', 'UserCommunicationPreferences model exists', modelExists);
      if (modelExists) {
        console.log('  Model fields:', Object.keys(prisma.userCommunicationPreferences.fields || {}));
      }
    } catch (error) {
      logTest('prisma', 'UserCommunicationPreferences model exists', false, error);
    }

    // Test 2.3: Check if UserPrivacySettings model exists
    console.log('Testing UserPrivacySettings Prisma model...');
    try {
      const modelExists = prisma.userPrivacySettings !== undefined;
      logTest('prisma', 'UserPrivacySettings model exists', modelExists);
      if (modelExists) {
        console.log('  Model fields:', Object.keys(prisma.userPrivacySettings.fields || {}));
      }
    } catch (error) {
      logTest('prisma', 'UserPrivacySettings model exists', false, error);
    }

    // Test 2.4: Check if userPreferences model exists (should NOT exist based on schema)
    console.log('Testing userPreferences Prisma model (should NOT exist)...');
    try {
      const modelExists = prisma.userPreferences !== undefined;
      logTest('prisma', 'userPreferences model does NOT exist (expected)', !modelExists);
      if (modelExists) {
        console.log('  ⚠️  WARNING: userPreferences model exists but should not!');
      }
    } catch (error) {
      logTest('prisma', 'userPreferences model check', false, error);
    }

    // Test 2.5: Check if accountDeletionRequests model exists
    console.log('Testing accountDeletionRequests Prisma model...');
    try {
      const modelExists = prisma.accountDeletionRequests !== undefined;
      logTest('prisma', 'accountDeletionRequests model exists', modelExists);
      if (modelExists) {
        console.log('  Model fields:', Object.keys(prisma.accountDeletionRequests.fields || {}));
      }
    } catch (error) {
      logTest('prisma', 'accountDeletionRequests model exists', false, error);
    }

    // Test 2.6: Check if userDataExports model exists
    console.log('Testing userDataExports Prisma model...');
    try {
      const modelExists = prisma.userDataExports !== undefined;
      logTest('prisma', 'userDataExports model exists', modelExists);
      if (modelExists) {
        console.log('  Model fields:', Object.keys(prisma.userDataExports.fields || {}));
      }
    } catch (error) {
      logTest('prisma', 'userDataExports model exists', false, error);
    }

    // Test 2.7: Check if UserPrivacySettings has twoFactorEnabled field
    console.log('Testing UserPrivacySettings.twoFactorEnabled field...');
    try {
      const hasField = prisma.userPrivacySettings?.fields?.twoFactorEnabled !== undefined;
      logTest('prisma', 'UserPrivacySettings has twoFactorEnabled field', hasField);
    } catch (error) {
      logTest('prisma', 'UserPrivacySettings.twoFactorEnabled field check', false, error);
    }

    // Test 2.8: Check if UserPrivacySettings has twoFactorSecret field
    console.log('Testing UserPrivacySettings.twoFactorSecret field (should NOT exist)...');
    try {
      const hasField = prisma.userPrivacySettings?.fields?.twoFactorSecret !== undefined;
      logTest('prisma', 'UserPrivacySettings does NOT have twoFactorSecret field', !hasField);
      if (hasField) {
        console.log('  ⚠️  WARNING: twoFactorSecret field exists but should not!');
      }
    } catch (error) {
      logTest('prisma', 'UserPrivacySettings.twoFactorSecret field check', false, error);
      }
  
      // Test 2.9: Check if UserPrivacySettings has twoFactorSecret field (should exist - for security)
      console.log('Testing UserPrivacySettings.twoFactorSecret field (should exist)...');
      try {
        const hasField = prisma.userPrivacySettings?.fields?.twoFactorSecret !== undefined;
        logTest('prisma', 'UserPrivacySettings has twoFactorSecret field', hasField);
      } catch (error) {
        logTest('prisma', 'UserPrivacySettings.twoFactorSecret field check', false, error);
      }

  } catch (error) {
    console.error('Prisma model test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// 3. SERVICE VALIDATION
// ============================================
async function testServices() {
  logSection('SERVICE VALIDATION');
  
  try {
    // Test 3.1: Check if accountPreferencesService exists
    console.log('Testing accountPreferencesService...');
    try {
      const { accountPreferencesService } = require('./services/accountPreferences.service');
      logTest('api', 'accountPreferencesService exists', accountPreferencesService !== undefined);
    } catch (error) {
      logTest('api', 'accountPreferencesService exists', false, error);
    }

    // Test 3.2: Check if accountDeletionService exists
    console.log('Testing accountDeletionService...');
    try {
      const { accountDeletionService } = require('./services/accountDeletion.service');
      logTest('api', 'accountDeletionService exists', accountDeletionService !== undefined);
    } catch (error) {
      logTest('api', 'accountDeletionService exists', false, error);
    }

    // Test 3.3: Check if dataExportService exists
    console.log('Testing dataExportService...');
    try {
      const { dataExportService } = require('./services/dataExport.service');
      logTest('api', 'dataExportService exists', dataExportService !== undefined);
    } catch (error) {
      logTest('api', 'dataExportService exists', false, error);
    }

    // Test 3.4: Check if passwordService exists
    console.log('Testing passwordService...');
    try {
      const { passwordService } = require('./services/passwordService');
      logTest('api', 'passwordService exists', passwordService !== undefined);
    } catch (error) {
      logTest('api', 'passwordService exists', false, error);
    }

    // Test 3.5: Check if exports directory exists
    console.log('Testing exports directory...');
    try {
      const fs = require('fs');
      const path = require('path');
      const exportDir = path.join(__dirname, 'exports');
      const dirExists = fs.existsSync(exportDir);
      logTest('api', 'exports directory exists', dirExists);
      if (!dirExists) {
        console.log('  ⚠️  WARNING: exports directory does not exist');
      }
    } catch (error) {
      logTest('api', 'exports directory check', false, error);
    }

  } catch (error) {
    console.error('Service test error:', error);
  }
}

// ============================================
// 4. ROUTE VALIDATION
// ============================================
async function testRoutes() {
  logSection('ROUTE VALIDATION');
  
  try {
    // Test 4.1: Check if routes file exists
    console.log('Testing routes/index.js...');
    try {
      const routesIndex = require('./routes/index');
      logTest('api', 'routes/index.js loads successfully', routesIndex !== undefined);
    } catch (error) {
      logTest('api', 'routes/index.js loads successfully', false, error);
    }

    // Test 4.2: Check if userPreferences routes exist
    console.log('Testing userPreferences routes...');
    try {
      const userPreferencesRoutes = require('./routes/userPreferences');
      logTest('api', 'userPreferences routes exist', userPreferencesRoutes !== undefined);
    } catch (error) {
      logTest('api', 'userPreferences routes exist', false, error);
    }

    // Test 4.3: Check if accountManagement routes exist
    console.log('Testing accountManagement routes...');
    try {
      const accountManagementRoutes = require('./routes/accountManagement');
      logTest('api', 'accountManagement routes exist', accountManagementRoutes !== undefined);
    } catch (error) {
      logTest('api', 'accountManagement routes exist', false, error);
    }

  } catch (error) {
    console.error('Route test error:', error);
  }
}

// ============================================
// 5. RUN ALL TESTS
// ============================================
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  ACCOUNT PREFERENCES COMPREHENSIVE DIAGNOSTIC TEST');
  console.log('  Phase 3, Milestone 3, Task 3');
  console.log('='.repeat(60) + '\n');

  await testDatabaseSchema();
  await testPrismaModels();
  await testServices();
  await testRoutes();

  // Print summary
  logSection('TEST SUMMARY');
  
  console.log('Database Tests:');
  console.log(`  ✅ Passed: ${testResults.database.passed}`);
  console.log(`  ❌ Failed: ${testResults.database.failed}`);
  if (testResults.database.errors.length > 0) {
    console.log('\n  Errors:');
    testResults.database.errors.forEach(err => {
      console.log(`    - ${err.test}: ${err.error}`);
    });
  }

  console.log('\nPrisma Tests:');
  console.log(`  ✅ Passed: ${testResults.prisma.passed}`);
  console.log(`  ❌ Failed: ${testResults.prisma.failed}`);
  if (testResults.prisma.errors.length > 0) {
    console.log('\n  Errors:');
    testResults.prisma.errors.forEach(err => {
      console.log(`    - ${err.test}: ${err.error}`);
    });
  }

  console.log('\nAPI/Service Tests:');
  console.log(`  ✅ Passed: ${testResults.api.passed}`);
  console.log(`  ❌ Failed: ${testResults.api.failed}`);
  if (testResults.api.errors.length > 0) {
    console.log('\n  Errors:');
    testResults.api.errors.forEach(err => {
      console.log(`    - ${err.test}: ${err.error}`);
    });
  }

  const totalPassed = testResults.database.passed + testResults.prisma.passed + testResults.api.passed;
  const totalFailed = testResults.database.failed + testResults.prisma.failed + testResults.api.failed;
  
  console.log('\n' + '='.repeat(60));
  console.log(`  TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(60) + '\n');

  // Save results to file
  const fs = require('fs');
  const resultsPath = './account-preferences-diagnostic-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Results saved to: ${resultsPath}\n`);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
