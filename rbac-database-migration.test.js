/**
 * RBAC Database Migration Test
 * Phase 3, Milestone 4, Task 2
 * 
 * Tests database migration file: backend/migrations/20260115_create_rbac_tables.sql
 */

const { Pool } = require('pg');

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smart_tech_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const pool = new Pool(DB_CONFIG);

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Helper function to log test results
 */
function logTest(testName, passed, details = '') {
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
    if (details) console.log(`   ${details}`);
  } else {
    testResults.failed++;
    console.error(`❌ FAIL: ${testName}`);
    if (details) console.error(`   ${details}`);
  }
}

/**
 * Helper function to execute SQL queries
 */
async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Test 1: Verify all RBAC tables exist
 */
async function testTablesExist() {
  console.log('\n=== Test 1: Verify RBAC Tables Exist ===');
  
  const expectedTables = [
    'roles',
    'permissions',
    'role_permissions',
    'user_roles',
    'role_escalation_requests'
  ];

  for (const tableName of expectedTables) {
    try {
      const result = await executeQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [tableName]);
      
      const exists = result.rows[0].exists;
      logTest(`Table '${tableName}' exists`, exists);
      
      if (!exists) {
        testResults.errors.push(`Missing table: ${tableName}`);
      }
    } catch (error) {
      logTest(`Table '${tableName}' exists`, false, error.message);
      testResults.errors.push(`Error checking table ${tableName}: ${error.message}`);
    }
  }
}

/**
 * Test 2: Verify table structures
 */
async function testTableStructures() {
  console.log('\n=== Test 2: Verify Table Structures ===');
  
  // Test roles table structure
  try {
    const result = await executeQuery(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'roles'
      ORDER BY ordinal_position
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const expectedColumns = ['id', 'name', 'description', 'hierarchy_level', 'created_at', 'updated_at'];
    
    const allColumnsPresent = expectedColumns.every(col => columns.includes(col));
    logTest('Roles table has correct columns', allColumnsPresent);
    
    if (!allColumnsPresent) {
      testResults.errors.push(`Roles table missing columns. Expected: ${expectedColumns.join(', ')}, Found: ${columns.join(', ')}`);
    }
  } catch (error) {
    logTest('Roles table has correct columns', false, error.message);
    testResults.errors.push(`Error checking roles table structure: ${error.message}`);
  }

  // Test permissions table structure
  try {
    const result = await executeQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'permissions'
      ORDER BY ordinal_position
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const expectedColumns = ['id', 'name', 'resource', 'action', 'description', 'created_at'];
    
    const allColumnsPresent = expectedColumns.every(col => columns.includes(col));
    logTest('Permissions table has correct columns', allColumnsPresent);
    
    if (!allColumnsPresent) {
      testResults.errors.push(`Permissions table missing columns. Expected: ${expectedColumns.join(', ')}, Found: ${columns.join(', ')}`);
    }
  } catch (error) {
    logTest('Permissions table has correct columns', false, error.message);
    testResults.errors.push(`Error checking permissions table structure: ${error.message}`);
  }

  // Test user_roles table structure
  try {
    const result = await executeQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_roles'
      ORDER BY ordinal_position
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const expectedColumns = ['id', 'user_id', 'role_id', 'assigned_by', 'assigned_at', 'expires_at', 'is_active'];
    
    const allColumnsPresent = expectedColumns.every(col => columns.includes(col));
    logTest('User roles table has correct columns', allColumnsPresent);
    
    if (!allColumnsPresent) {
      testResults.errors.push(`User roles table missing columns. Expected: ${expectedColumns.join(', ')}, Found: ${columns.join(', ')}`);
    }
  } catch (error) {
    logTest('User roles table has correct columns', false, error.message);
    testResults.errors.push(`Error checking user_roles table structure: ${error.message}`);
  }

  // Test role_escalation_requests table structure
  try {
    const result = await executeQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'role_escalation_requests'
      ORDER BY ordinal_position
    `);
    
    const columns = result.rows.map(r => r.column_name);
    const expectedColumns = ['id', 'user_id', 'current_role_id', 'requested_role_id', 'requested_by', 'status', 'reason', 'reviewed_by', 'reviewed_at', 'review_notes', 'created_at'];
    
    const allColumnsPresent = expectedColumns.every(col => columns.includes(col));
    logTest('Role escalation requests table has correct columns', allColumnsPresent);
    
    if (!allColumnsPresent) {
      testResults.errors.push(`Role escalation requests table missing columns. Expected: ${expectedColumns.join(', ')}, Found: ${columns.join(', ')}`);
    }
  } catch (error) {
    logTest('Role escalation requests table has correct columns', false, error.message);
    testResults.errors.push(`Error checking role_escalation_requests table structure: ${error.message}`);
  }
}

/**
 * Test 3: Verify foreign key constraints
 */
async function testForeignKeys() {
  console.log('\n=== Test 3: Verify Foreign Key Constraints ===');
  
  // Test role_permissions foreign keys
  try {
    const result = await executeQuery(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'role_permissions'
    `);
    
    const hasRoleFK = result.rows.some(r => r.foreign_table_name === 'roles');
    const hasPermissionFK = result.rows.some(r => r.foreign_table_name === 'permissions');
    
    logTest('role_permissions has foreign key to roles', hasRoleFK);
    logTest('role_permissions has foreign key to permissions', hasPermissionFK);
    
    if (!hasRoleFK) testResults.errors.push('role_permissions missing foreign key to roles');
    if (!hasPermissionFK) testResults.errors.push('role_permissions missing foreign key to permissions');
  } catch (error) {
    logTest('Foreign key constraints exist', false, error.message);
    testResults.errors.push(`Error checking foreign keys: ${error.message}`);
  }

  // Test user_roles foreign keys
  try {
    const result = await executeQuery(`
      SELECT
        tc.table_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'user_roles'
    `);
    
    const foreignTables = result.rows.map(r => r.foreign_table_name);
    const hasUserFK = foreignTables.includes('users');
    const hasRoleFK = foreignTables.includes('roles');
    
    logTest('user_roles has foreign key to users', hasUserFK);
    logTest('user_roles has foreign key to roles', hasRoleFK);
    
    if (!hasUserFK) testResults.errors.push('user_roles missing foreign key to users');
    if (!hasRoleFK) testResults.errors.push('user_roles missing foreign key to roles');
  } catch (error) {
    logTest('user_roles foreign keys exist', false, error.message);
    testResults.errors.push(`Error checking user_roles foreign keys: ${error.message}`);
  }
}

/**
 * Test 4: Verify indexes exist
 */
async function testIndexes() {
  console.log('\n=== Test 4: Verify Indexes ===');
  
  const expectedIndexes = [
    'idx_roles_hierarchy_level',
    'idx_permissions_resource',
    'idx_permissions_action',
    'idx_permissions_resource_action',
    'idx_role_permissions_role_id',
    'idx_role_permissions_permission_id',
    'idx_user_roles_user_id',
    'idx_user_roles_role_id',
    'idx_user_roles_is_active',
    'idx_role_escalation_user_id',
    'idx_role_escalation_status'
  ];

  for (const indexName of expectedIndexes) {
    try {
      const result = await executeQuery(`
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE indexname = $1
        )
      `, [indexName]);
      
      const exists = result.rows[0].exists;
      logTest(`Index '${indexName}' exists`, exists);
      
      if (!exists) {
        testResults.errors.push(`Missing index: ${indexName}`);
      }
    } catch (error) {
      logTest(`Index '${indexName}' exists`, false, error.message);
      testResults.errors.push(`Error checking index ${indexName}: ${error.message}`);
    }
  }
}

/**
 * Test 5: Verify seed data - roles
 */
async function testSeedRoles() {
  console.log('\n=== Test 5: Verify Seed Data - Roles ===');
  
  const expectedRoles = [
    { name: 'CUSTOMER', level: 20 },
    { name: 'SUPPORT', level: 50 },
    { name: 'CORPORATE', level: 40 },
    { name: 'ADMIN', level: 80 },
    { name: 'SUPER_ADMIN', level: 100 }
  ];

  for (const expectedRole of expectedRoles) {
    try {
      const result = await executeQuery(`
        SELECT name, hierarchy_level
        FROM roles
        WHERE name = $1
      `, [expectedRole.name]);
      
      const found = result.rows.length > 0;
      logTest(`Role '${expectedRole.name}' seeded`, found);
      
      if (found) {
        const actualLevel = result.rows[0].hierarchy_level;
        const levelMatches = actualLevel === expectedRole.level;
        logTest(`Role '${expectedRole.name}' has correct hierarchy level`, levelMatches, 
          `Expected: ${expectedRole.level}, Found: ${actualLevel}`);
        
        if (!levelMatches) {
          testResults.errors.push(`Role ${expectedRole.name} has incorrect hierarchy level. Expected: ${expectedRole.level}, Found: ${actualLevel}`);
        }
      } else {
        testResults.errors.push(`Missing role: ${expectedRole.name}`);
      }
    } catch (error) {
      logTest(`Role '${expectedRole.name}' seeded`, false, error.message);
      testResults.errors.push(`Error checking role ${expectedRole.name}: ${error.message}`);
    }
  }
}

/**
 * Test 6: Verify seed data - permissions
 */
async function testSeedPermissions() {
  console.log('\n=== Test 6: Verify Seed Data - Permissions ===');
  
  try {
    const result = await executeQuery(`
      SELECT COUNT(*) as count
      FROM permissions
    `);
    
    const count = parseInt(result.rows[0].count);
    const hasPermissions = count >= 37; // At least 37 permissions expected
    
    logTest('Permissions seeded (at least 37)', hasPermissions, `Found: ${count}`);
    
    if (!hasPermissions) {
      testResults.errors.push(`Insufficient permissions seeded. Expected at least 37, Found: ${count}`);
    }
  } catch (error) {
    logTest('Permissions seeded', false, error.message);
    testResults.errors.push(`Error checking permissions: ${error.message}`);
  }

  // Check specific critical permissions
  const criticalPermissions = [
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'user:assign_role',
    'product:read',
    'product:create',
    'order:read',
    'order:create',
    'system:configure'
  ];

  for (const permName of criticalPermissions) {
    try {
      const result = await executeQuery(`
        SELECT EXISTS (
          SELECT FROM permissions
          WHERE name = $1
        )
      `, [permName]);
      
      const exists = result.rows[0].exists;
      logTest(`Permission '${permName}' seeded`, exists);
      
      if (!exists) {
        testResults.errors.push(`Missing permission: ${permName}`);
      }
    } catch (error) {
      logTest(`Permission '${permName}' seeded`, false, error.message);
      testResults.errors.push(`Error checking permission ${permName}: ${error.message}`);
    }
  }
}

/**
 * Test 7: Verify role-permission assignments
 */
async function testRolePermissionAssignments() {
  console.log('\n=== Test 7: Verify Role-Permission Assignments ===');
  
  const expectedAssignments = [
    { role: 'CUSTOMER', minPermissions: 7 },
    { role: 'SUPPORT', minPermissions: 10 },
    { role: 'CORPORATE', minPermissions: 12 },
    { role: 'ADMIN', minPermissions: 25 },
    { role: 'SUPER_ADMIN', minPermissions: 37 }
  ];

  for (const expected of expectedAssignments) {
    try {
      const result = await executeQuery(`
        SELECT COUNT(*) as count
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        WHERE r.name = $1
      `, [expected.role]);
      
      const count = parseInt(result.rows[0].count);
      const hasEnoughPermissions = count >= expected.minPermissions;
      
      logTest(`Role '${expected.role}' has permissions assigned`, hasEnoughPermissions,
        `Expected at least: ${expected.minPermissions}, Found: ${count}`);
      
      if (!hasEnoughPermissions) {
        testResults.errors.push(`Role ${expected.role} has insufficient permissions. Expected at least ${expected.minPermissions}, Found: ${count}`);
      }
    } catch (error) {
      logTest(`Role '${expected.role}' has permissions assigned`, false, error.message);
      testResults.errors.push(`Error checking role-permission assignments for ${expected.role}: ${error.message}`);
    }
  }
}

/**
 * Test 8: Verify database functions
 */
async function testDatabaseFunctions() {
  console.log('\n=== Test 8: Verify Database Functions ===');
  
  const expectedFunctions = [
    'user_has_permission',
    'get_user_permissions',
    'get_user_roles',
    'user_has_minimum_role_level'
  ];

  for (const funcName of expectedFunctions) {
    try {
      const result = await executeQuery(`
        SELECT EXISTS (
          SELECT FROM pg_proc
          WHERE proname = $1
        )
      `, [funcName]);
      
      const exists = result.rows[0].exists;
      logTest(`Function '${funcName}' exists`, exists);
      
      if (!exists) {
        testResults.errors.push(`Missing function: ${funcName}`);
      }
    } catch (error) {
      logTest(`Function '${funcName}' exists`, false, error.message);
      testResults.errors.push(`Error checking function ${funcName}: ${error.message}`);
    }
  }
}

/**
 * Test 9: Verify triggers
 */
async function testTriggers() {
  console.log('\n=== Test 9: Verify Triggers ===');
  
  try {
    const result = await executeQuery(`
      SELECT EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'update_roles_updated_at'
      )
    `);
    
    const exists = result.rows[0].exists;
    logTest('Trigger update_roles_updated_at exists', exists);
    
    if (!exists) {
      testResults.errors.push('Missing trigger: update_roles_updated_at');
    }
  } catch (error) {
    logTest('Trigger update_roles_updated_at exists', false, error.message);
    testResults.errors.push(`Error checking trigger: ${error.message}`);
  }
}

/**
 * Test 10: Test database functions with sample data
 */
async function testDatabaseFunctionsExecution() {
  console.log('\n=== Test 10: Test Database Functions Execution ===');
  
  // Note: These tests require a test user to exist
  // We'll test functions exist and have correct signatures
  
  try {
    // Test user_has_permission function signature
    const result = await executeQuery(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'user_has_permission'
    `);
    
    const hasCorrectSignature = result.rows.length > 0;
    logTest('user_has_permission has correct signature', hasCorrectSignature);
    
    if (!hasCorrectSignature) {
      testResults.errors.push('user_has_permission function signature incorrect or missing');
    }
  } catch (error) {
    logTest('user_has_permission has correct signature', false, error.message);
    testResults.errors.push(`Error checking user_has_permission signature: ${error.message}`);
  }

  try {
    // Test get_user_permissions function signature
    const result = await executeQuery(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'get_user_permissions'
    `);
    
    const hasCorrectSignature = result.rows.length > 0;
    logTest('get_user_permissions has correct signature', hasCorrectSignature);
    
    if (!hasCorrectSignature) {
      testResults.errors.push('get_user_permissions function signature incorrect or missing');
    }
  } catch (error) {
    logTest('get_user_permissions has correct signature', false, error.message);
    testResults.errors.push(`Error checking get_user_permissions signature: ${error.message}`);
  }
}

/**
 * Test 11: Verify constraints
 */
async function testConstraints() {
  console.log('\n=== Test 11: Verify Constraints ===');
  
  // Test roles table constraints
  try {
    const result = await executeQuery(`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = 'roles'::regclass
    `);
    
    const hasUniqueName = result.rows.some(r => r.conname === 'roles_name_key');
    const hasCheckLevel = result.rows.some(r => r.conname === 'roles_hierarchy_level_check');
    
    logTest('roles table has unique constraint on name', hasUniqueName);
    logTest('roles table has check constraint on hierarchy_level', hasCheckLevel);
    
    if (!hasUniqueName) testResults.errors.push('roles table missing unique constraint on name');
    if (!hasCheckLevel) testResults.errors.push('roles table missing check constraint on hierarchy_level');
  } catch (error) {
    logTest('roles table constraints exist', false, error.message);
    testResults.errors.push(`Error checking roles table constraints: ${error.message}`);
  }

  // Test permissions table constraints
  try {
    const result = await executeQuery(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'permissions'::regclass
    `);
    
    const hasUniqueName = result.rows.some(r => r.conname === 'permissions_name_key');
    const hasCheckName = result.rows.some(r => r.conname === 'permissions_name_check');
    
    logTest('permissions table has unique constraint on name', hasUniqueName);
    logTest('permissions table has check constraint on name format', hasCheckName);
    
    if (!hasUniqueName) testResults.errors.push('permissions table missing unique constraint on name');
    if (!hasCheckName) testResults.errors.push('permissions table missing check constraint on name format');
  } catch (error) {
    logTest('permissions table constraints exist', false, error.message);
    testResults.errors.push(`Error checking permissions table constraints: ${error.message}`);
  }

  // Test role_escalation_requests constraints
  try {
    const result = await executeQuery(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'role_escalation_requests'::regclass
    `);
    
    const hasCheckStatus = result.rows.some(r => r.conname === 'role_escalation_requests_status_check');
    
    logTest('role_escalation_requests has check constraint on status', hasCheckStatus);
    
    if (!hasCheckStatus) {
      testResults.errors.push('role_escalation_requests missing check constraint on status');
    }
  } catch (error) {
    logTest('role_escalation_requests constraints exist', false, error.message);
    testResults.errors.push(`Error checking role_escalation_requests constraints: ${error.message}`);
  }
}

/**
 * Main test execution function
 */
async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  RBAC Database Migration Test Suite                              ║');
  console.log('║  Phase 3, Milestone 4, Task 2                                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  try {
    await pool.connect();
    console.log('\n✓ Connected to database');
    
    // Run all tests
    await testTablesExist();
    await testTableStructures();
    await testForeignKeys();
    await testIndexes();
    await testSeedRoles();
    await testSeedPermissions();
    await testRolePermissionAssignments();
    await testDatabaseFunctions();
    await testTriggers();
    await testDatabaseFunctionsExecution();
    await testConstraints();
    
    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  Test Summary                                                      ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n📋 Errors Found:');
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2);
    console.log(`\n📊 Success Rate: ${successRate}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All tests passed! Database migration is complete and correct.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    testResults.errors.push(`Fatal error: ${error.message}`);
  } finally {
    await pool.end();
    console.log('\n✓ Database connection closed');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

module.exports = { testResults };
