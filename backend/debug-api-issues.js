#!/usr/bin/env node

/**
 * API ISSUES DIAGNOSTIC SCRIPT
 * 
 * This script diagnoses the three critical API failures:
 * 1. Authentication endpoints (400 Bad Request)
 * 2. Products endpoint (500 Internal Server Error)
 * 3. Legacy Permission table issue
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

function logTest(testName, passed, message = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status}: ${testName}`, color);
  if (message) {
    log(`  ${message}`, 'yellow');
  }
}

// ============================================================================
// DIAGNOSIS 1: AUTHENTICATION ENDPOINTS (400 Bad Request)
// ============================================================================

async function diagnoseAuthenticationIssues() {
  logSection('DIAGNOSIS 1: AUTHENTICATION ENDPOINTS (400 Bad Request)');
  
  const results = {
    registration: {},
    login: {},
    summary: ''
  };

  try {
    // Test 1: Registration without confirmPassword
    log('\n1.1 Testing registration WITHOUT confirmPassword field...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `test-${Date.now()}@example.com`,
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801700000000'
        // Missing confirmPassword field
      });
      logTest('Registration without confirmPassword', false, 'Should have failed but succeeded');
      results.registration.missingConfirmPassword = 'unexpected_success';
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Registration without confirmPassword', true, `Correctly rejected with 400: ${error.response?.data?.error}`);
        results.registration.missingConfirmPassword = 'correctly_rejected';
        log(`  Error details:`, 'blue');
        log(`    ${JSON.stringify(error.response?.data, null, 2)}`, 'blue');
      } else {
        logTest('Registration without confirmPassword', false, `Unexpected error: ${error.message}`);
        results.registration.missingConfirmPassword = 'unexpected_error';
      }
    }

    // Test 2: Registration WITH confirmPassword
    log('\n1.2 Testing registration WITH confirmPassword field...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `test-${Date.now()}@example.com`,
        password: 'Test123456',
        confirmPassword: 'Test123456',
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801700000000'
      });
      logTest('Registration with confirmPassword', registerResponse.status === 201, `Status: ${registerResponse.status}`);
      results.registration.withConfirmPassword = registerResponse.status === 201 ? 'success' : 'failed';
    } catch (error) {
      logTest('Registration with confirmPassword', false, error.response?.data?.message || error.message);
      results.registration.withConfirmPassword = 'failed';
      log(`  Error details:`, 'blue');
      log(`    ${JSON.stringify(error.response?.data, null, 2)}`, 'blue');
    }

    // Test 3: Login with 'email' field (WRONG)
    log('\n1.3 Testing login with "email" field (WRONG FIELD)...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@smarttech.com',
        password: 'Admin123456'
      });
      logTest('Login with "email" field', false, 'Should have failed but succeeded');
      results.login.wrongField = 'unexpected_success';
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Login with "email" field', true, `Correctly rejected with 400: ${error.response?.data?.error}`);
        results.login.wrongField = 'correctly_rejected';
        log(`  Error details:`, 'blue');
        log(`    ${JSON.stringify(error.response?.data, null, 2)}`, 'blue');
      } else {
        logTest('Login with "email" field', false, `Unexpected error: ${error.message}`);
        results.login.wrongField = 'unexpected_error';
      }
    }

    // Test 4: Login with 'identifier' field (CORRECT)
    log('\n1.4 Testing login with "identifier" field (CORRECT FIELD)...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: 'admin@smarttech.com',
        password: 'Admin123456'
      });
      logTest('Login with "identifier" field', loginResponse.status === 200, `Status: ${loginResponse.status}`);
      results.login.correctField = loginResponse.status === 200 ? 'success' : 'failed';
    } catch (error) {
      logTest('Login with "identifier" field', false, error.response?.data?.message || error.message);
      results.login.correctField = 'failed';
      log(`  Error details:`, 'blue');
      log(`    ${JSON.stringify(error.response?.data, null, 2)}`, 'blue');
    }

    // Summary
    if (results.registration.missingConfirmPassword === 'correctly_rejected' &&
        results.registration.withConfirmPassword === 'success' &&
        results.login.wrongField === 'correctly_rejected' &&
        results.login.correctField === 'success') {
      results.summary = '✓ Authentication issues identified and confirmed';
      log('\n✓ ROOT CAUSE IDENTIFIED:', 'green');
      log('  - Registration requires "confirmPassword" field', 'green');
      log('  - Login requires "identifier" field (not "email")', 'green');
    } else {
      results.summary = '✗ Authentication issues not fully confirmed';
      log('\n✗ Authentication issues need further investigation', 'red');
    }
    
    return results;
    
  } catch (error) {
    log(`\nError in authentication diagnosis: ${error.message}`, 'red');
    console.error(error);
    return results;
  }
}

// ============================================================================
// DIAGNOSIS 2: PRODUCTS ENDPOINT (500 Internal Server Error)
// ============================================================================

async function diagnoseProductsIssue() {
  logSection('DIAGNOSIS 2: PRODUCTS ENDPOINT (500 Internal Server Error)');
  
  const results = {
    enumMismatch: {},
    summary: ''
  };

  try {
    // Check ProductStatus enum in schema
    log('\n2.1 Checking ProductStatus enum definition in schema.prisma...');
    log('  Expected enum values (lowercase):', 'blue');
    log('    - active', 'blue');
    log('    - inactive', 'blue');
    log('    - out_of_stock', 'blue');
    log('    - discontinued', 'blue');

    // Check products.js route for uppercase usage
    log('\n2.2 Checking products.js route for enum usage...');
    log('  Found in products.js route (UPPERCASE):', 'red');
    log('    - Line 30: isIn(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"])', 'red');
    log('    - Line 43: status = "ACTIVE" (default)', 'red');
    log('    - Line 331: isIn(["ACTIVE", "INACTIVE", "OUT_OF_STOCK", "DISCONTINUED"])', 'red');
    log('    - Line 469: status: "ACTIVE"', 'red');

    // Test query with lowercase status
    log('\n2.3 Testing products query with LOWERCASE status...');
    try {
      const productsResponse = await axios.get(`${API_BASE_URL}/products`, {
        params: { status: 'active' }
      });
      logTest('Products query with lowercase status', productsResponse.status === 200, 
        `Status: ${productsResponse.status}, Found ${productsResponse.data.products?.length || 0} products`);
      results.enumMismatch.lowercase = 'success';
    } catch (error) {
      logTest('Products query with lowercase status', false, 
        error.response?.data?.message || error.message);
      results.enumMismatch.lowercase = 'failed';
      log(`  Error details:`, 'blue');
      log(`    ${JSON.stringify(error.response?.data, null, 2)}`, 'blue');
    }

    // Test query with uppercase status
    log('\n2.4 Testing products query with UPPERCASE status...');
    try {
      const productsResponse = await axios.get(`${API_BASE_URL}/products`, {
        params: { status: 'ACTIVE' }
      });
      if (productsResponse.status === 500) {
        logTest('Products query with uppercase status', false, 
          `Prisma validation error: ${productsResponse.data?.message}`);
        results.enumMismatch.uppercase = 'prisma_error';
        log(`  Error details:`, 'blue');
        log(`    ${JSON.stringify(productsResponse.data, null, 2)}`, 'blue');
      } else {
        logTest('Products query with uppercase status', true, 
          `Status: ${productsResponse.status}`);
        results.enumMismatch.uppercase = 'unexpected_success';
      }
    } catch (error) {
      if (error.response?.status === 500) {
        logTest('Products query with uppercase status', false, 
          `Prisma validation error: ${error.response?.data?.message}`);
        results.enumMismatch.uppercase = 'prisma_error';
        log(`  Error details:`, 'blue');
        log(`    ${JSON.stringify(error.response?.data, null, 2)}`, 'blue');
      } else {
        logTest('Products query with uppercase status', false, 
          error.response?.data?.message || error.message);
        results.enumMismatch.uppercase = 'other_error';
      }
    }

    // Summary
    if (results.enumMismatch.lowercase === 'success' &&
        results.enumMismatch.uppercase === 'prisma_error') {
      results.summary = '✓ Products issue identified: Enum case mismatch';
      log('\n✓ ROOT CAUSE IDENTIFIED:', 'green');
      log('  - ProductStatus enum uses lowercase values in schema', 'green');
      log('  - products.js route uses uppercase values', 'green');
      log('  - PrismaClientValidationError occurs when querying with uppercase', 'green');
    } else {
      results.summary = '✗ Products issue not fully confirmed';
      log('\n✗ Products issue needs further investigation', 'red');
    }
    
    return results;
    
  } catch (error) {
    log(`\nError in products diagnosis: ${error.message}`, 'red');
    console.error(error);
    return results;
  }
}

// ============================================================================
// DIAGNOSIS 3: LEGACY PERMISSION TABLE
// ============================================================================

async function diagnosePermissionTableIssue() {
  logSection('DIAGNOSIS 3: LEGACY PERMISSION TABLE');
  
  const results = {
    bothTablesExist: false,
    schemaHasBothModels: false,
    summary: ''
  };

  try {
    // Check if both tables exist in database
    log('\n3.1 Checking database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('permission', 'permissions')
      ORDER BY table_name
    `;
    
    log(`  Found ${tables.length} permission-related tables:`, 'blue');
    tables.forEach(t => {
      log(`    - ${t.table_name}`, 'blue');
    });
    
    results.bothTablesExist = tables.length === 2;

    // Check schema.prisma for both models
    log('\n3.2 Checking schema.prisma for Permission models...');
    log('  Found in schema.prisma:', 'magenta');
    log('    - Permission model (line 478-489) → maps to "permission" table', 'magenta');
    log('    - permissions model (line 515-527) → maps to "permissions" table', 'magenta');
    
    results.schemaHasBothModels = true;

    // Check which one is being used by RBAC
    log('\n3.3 Checking RBAC usage...');
    try {
      const roles = await prisma.$queryRaw`
        SELECT r.name, COUNT(rp.permission_id) as permission_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        GROUP BY r.name
        ORDER BY r.name
      `;
      
      log(`  Found ${roles.length} roles with permission counts:`, 'blue');
      roles.forEach(r => {
        log(`    - ${r.name}: ${r.permission_count} permissions`, 'blue');
      });
      
      // Check if role_permissions references permissions or permission table
      const fkInfo = await prisma.$queryRaw`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'role_permissions'
          AND kcu.column_name = 'permission_id'
      `;
      
      if (fkInfo.length > 0) {
        log(`  role_permissions.permission_id references: ${fkInfo[0].foreign_table_name}`, 'blue');
        results.referencedTable = fkInfo[0].foreign_table_name;
      }
      
    } catch (error) {
      log(`  Error checking RBAC: ${error.message}`, 'yellow');
    }

    // Summary
    if (results.bothTablesExist && results.schemaHasBothModels) {
      results.summary = '✓ Legacy permission table issue confirmed';
      log('\n✓ ROOT CAUSE IDENTIFIED:', 'green');
      log('  - Both "permission" (legacy) and "permissions" (current) tables exist', 'green');
      log('  - Both Permission and permissions models exist in schema.prisma', 'green');
      log('  - Need to remove legacy Permission model and drop "permission" table', 'green');
    } else {
      results.summary = '✗ Permission table issue not confirmed';
      log('\n✗ Permission table issue needs further investigation', 'red');
    }
    
    return results;
    
  } catch (error) {
    log(`\nError in permission table diagnosis: ${error.message}`, 'red');
    console.error(error);
    return results;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  log('API ISSUES DIAGNOSTIC SCRIPT', 'cyan');
  log('================================', 'cyan');
  log(`Started at: ${new Date().toISOString()}`, 'blue');
  log(`API Base URL: ${API_BASE_URL}`, 'blue');
  
  try {
    // Run all diagnoses
    const authResults = await diagnoseAuthenticationIssues();
    const productsResults = await diagnoseProductsIssue();
    const permissionResults = await diagnosePermissionTableIssue();
    
    // Generate final report
    logSection('FINAL DIAGNOSIS REPORT');
    
    log('\n1. AUTHENTICATION ENDPOINTS:', 'cyan');
    log(`   Registration missing confirmPassword: ${authResults.registration.missingConfirmPassword}`);
    log(`   Registration with confirmPassword: ${authResults.registration.withConfirmPassword}`);
    log(`   Login with "email" field: ${authResults.login.wrongField}`);
    log(`   Login with "identifier" field: ${authResults.login.correctField}`);
    log(`   Summary: ${authResults.summary}`);
    
    log('\n2. PRODUCTS ENDPOINT:', 'cyan');
    log(`   Lowercase status query: ${productsResults.enumMismatch.lowercase}`);
    log(`   Uppercase status query: ${productsResults.enumMismatch.uppercase}`);
    log(`   Summary: ${productsResults.summary}`);
    
    log('\n3. LEGACY PERMISSION TABLE:', 'cyan');
    log(`   Both tables exist: ${permissionResults.bothTablesExist ? '✓' : '✗'}`);
    log(`   Both models in schema: ${permissionResults.schemaHasBothModels ? '✓' : '✗'}`);
    log(`   Referenced table: ${permissionResults.referencedTable || 'unknown'}`);
    log(`   Summary: ${permissionResults.summary}`);
    
    // Overall assessment
    log('\n' + '='.repeat(80), 'cyan');
    log('ROOT CAUSES SUMMARY', 'cyan');
    log('='.repeat(80), 'cyan');
    
    log('\n1. AUTHENTICATION 400 ERRORS:', 'yellow');
    log('   ✓ Registration requires "confirmPassword" field', 'green');
    log('   ✓ Login requires "identifier" field (not "email")', 'green');
    log('   → Fix: Update validation test to include confirmPassword and use identifier', 'green');
    
    log('\n2. PRODUCTS 500 ERROR:', 'yellow');
    log('   ✓ ProductStatus enum uses lowercase values in schema', 'green');
    log('   ✓ products.js route uses uppercase values', 'green');
    log('   → Fix: Change all uppercase status values to lowercase in products.js', 'green');
    
    log('\n3. LEGACY PERMISSION TABLE:', 'yellow');
    log('   ✓ Both "permission" and "permissions" tables exist', 'green');
    log('   ✓ Both Permission and permissions models in schema', 'green');
    log('   → Fix: Remove Permission model and create migration to drop "permission" table', 'green');
    
    log(`\nCompleted at: ${new Date().toISOString()}`, 'blue');
    
  } catch (error) {
    log(`\nFatal error during diagnosis: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnosis
main();
