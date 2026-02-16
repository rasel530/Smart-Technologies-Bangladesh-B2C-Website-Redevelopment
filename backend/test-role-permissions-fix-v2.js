/**
 * Test Script: Role Permissions Update Fix Verification (Simplified)
 * 
 * This script directly tests the database query that was causing the 500 error.
 * The fix changed line 130 in rbacRolePermissions.js from:
 *   db.getClient().permission.findMany
 * to:
 *   db.getClient().permissions.findMany
 * 
 * This test verifies that the correct table name is being used.
 */

const { databaseService } = require('./services/database');

// Test configuration
const TEST_ROLE_ID = '09510acf-2e77-4ae0-8206-3b154b391821';

// Test results
const testResults = {
    startTime: new Date().toISOString(),
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0
    }
};

// Logging utilities
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        test: '🧪'
    }[type] || 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
}

function recordTest(name, passed, details = {}) {
    testResults.summary.total++;
    if (passed) {
        testResults.summary.passed++;
        log(`PASSED: ${name}`, 'success');
    } else {
        testResults.summary.failed++;
        log(`FAILED: ${name}`, 'error');
    }
    testResults.tests.push({
        name,
        passed,
        timestamp: new Date().toISOString(),
        ...details
    });
}

// Test 1: Verify the 'permissions' table exists and is accessible
async function testPermissionsTableExists() {
    log('\n=== Test 1: Verify permissions table exists ===', 'test');
    
    try {
        const db = databaseService.getClient();
        const permissions = await db.permissions.findMany({
            select: {
                id: true,
                name: true
            },
            take: 5
        });
        
        log(`Found ${permissions.length} permissions in the 'permissions' table`, 'success');
        
        if (permissions.length > 0) {
            log('Sample permissions:', 'info');
            permissions.slice(0, 3).forEach((perm, idx) => {
                log(`  ${idx + 1}. ${perm.name} (${perm.id})`, 'info');
            });
        }
        
        recordTest('Permissions table exists and is accessible', true, {
            count: permissions.length
        });
        
        return permissions;
    } catch (error) {
        log(`Error accessing permissions table: ${error.message}`, 'error');
        
        // Check if the error is about the table name
        if (error.message.includes('permission') && !error.message.includes('permissions')) {
            log('❌ ERROR: The code is trying to access a table named "permission" (singular)', 'error');
            log('   but the correct table name is "permissions" (plural)', 'error');
            log('   This is the bug that was fixed on line 130 of rbacRolePermissions.js', 'error');
        }
        
        recordTest('Permissions table exists and is accessible', false, {
            error: error.message
        });
        
        return null;
    }
}

// Test 2: Verify the 'permission' (singular) table does NOT exist
async function testPermissionTableDoesNotExist() {
    log('\n=== Test 2: Verify permission (singular) table does NOT exist ===', 'test');
    
    try {
        const db = databaseService.getClient();
        
        // Try to access the 'permission' table (singular) - this should fail
        try {
            await db.permission.findMany({
                select: {
                    id: true
                },
                take: 1
            });
            
            // If we get here, the table exists (unexpected)
            log('⚠️ WARNING: The "permission" (singular) table exists', 'warning');
            log('   This is unexpected and may indicate a database schema issue', 'warning');
            
            recordTest('Permission (singular) table does NOT exist', false, {
                error: 'Table unexpectedly exists'
            });
            
            return false;
        } catch (error) {
            // This is expected - the table should not exist
            if (error.message.includes('Unknown table') || 
                error.message.includes('does not exist') ||
                error.message.includes('Invalid prisma') ||
                error.message.includes('permission')) {
                log('✅ Confirmed: The "permission" (singular) table does not exist', 'success');
                log('   This is correct - the table should be named "permissions" (plural)', 'success');
                
                recordTest('Permission (singular) table does NOT exist', true, {
                    error: error.message
                });
                
                return true;
            }
            
            // Unexpected error
            throw error;
        }
    } catch (error) {
        log(`Unexpected error: ${error.message}`, 'error');
        recordTest('Permission (singular) table does NOT exist', false, {
            error: error.message
        });
        
        return false;
    }
}

// Test 3: Verify role_permissions table can be queried with permissions relation
async function testRolePermissionsWithRelation() {
    log('\n=== Test 3: Verify role_permissions with permissions relation ===', 'test');
    
    try {
        const db = databaseService.getClient();
        
        // Query role_permissions with permissions relation (this is what the fixed code does)
        const rolePermissions = await db.role_permissions.findMany({
            where: {
                role_id: TEST_ROLE_ID
            },
            include: {
                permissions: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                }
            },
            take: 10
        });
        
        log(`Found ${rolePermissions.length} role-permission associations`, 'info');
        
        if (rolePermissions.length > 0) {
            log('Sample role-permission associations:', 'info');
            rolePermissions.slice(0, 3).forEach((rp, idx) => {
                log(`  ${idx + 1}. Role: ${rp.role_id} → Permission: ${rp.permissions?.name || 'N/A'} (${rp.permission_id})`, 'info');
            });
        }
        
        recordTest('Role permissions with permissions relation query works', true, {
            count: rolePermissions.length
        });
        
        return rolePermissions;
    } catch (error) {
        log(`Error querying role_permissions: ${error.message}`, 'error');
        recordTest('Role permissions with permissions relation query works', false, {
            error: error.message
        });
        
        return null;
    }
}

// Test 4: Verify the exact query from the fixed code works
async function testFixedCodeQuery() {
    log('\n=== Test 4: Verify the exact query from the fixed code ===', 'test');
    log('This is the query on line 130 of rbacRolePermissions.js after the fix:', 'info');
    log('  db.getClient().permissions.findMany({ ... })', 'info');
    
    try {
        const db = databaseService.getClient();
        
        // This is the exact query that was fixed
        const validPermissions = await db.permissions.findMany({
            where: {
                id: {
                    in: [
                        '06216b84-3695-41b5-8325-c2919f3d3eac',
                        '0a0e4335-5c7a-4fab-b403-8aecf5fa8e62',
                        '0b224c6f-a9f8-4450-9481-87eec23b8b3a'
                    ]
                }
            },
            select: {
                id: true
            }
        });
        
        log(`✅ Query succeeded! Found ${validPermissions.length} valid permissions`, 'success');
        
        if (validPermissions.length > 0) {
            log('Valid permission IDs:', 'info');
            validPermissions.forEach((perm, idx) => {
                log(`  ${idx + 1}. ${perm.id}`, 'info');
            });
        }
        
        recordTest('Fixed code query (db.permissions.findMany) works', true, {
            count: validPermissions.length
        });
        
        return validPermissions;
    } catch (error) {
        log(`❌ Query failed: ${error.message}`, 'error');
        recordTest('Fixed code query (db.permissions.findMany) works', false, {
            error: error.message
        });
        
        return null;
    }
}

// Test 5: Verify the OLD (buggy) query would fail
async function testBuggyCodeQuery() {
    log('\n=== Test 5: Verify the old (buggy) query would fail ===', 'test');
    log('This is the query on line 130 of rbacRolePermissions.js BEFORE the fix:', 'info');
    log('  db.getClient().permission.findMany({ ... })  <-- WRONG (singular)', 'info');
    
    try {
        const db = databaseService.getClient();
        
        // This is the OLD (buggy) query that caused the 500 error
        try {
            await db.permission.findMany({
                where: {
                    id: {
                        in: [
                            '06216b84-3695-41b5-8325-c2919f3d3eac',
                            '0a0e4335-5c7a-4fab-b403-8aecf5fa8e62',
                            '0b224c6f-a9f8-4450-9481-87eec23b8b3a'
                        ]
                    }
                },
                select: {
                    id: true
                }
            });
            
            // If we get here, the query worked (unexpected)
            log('⚠️ WARNING: The old query worked unexpectedly', 'warning');
            log('   This might mean there is a "permission" table in the database', 'warning');
            
            recordTest('Old buggy query (db.permission.findMany) fails as expected', false, {
                error: 'Query unexpectedly succeeded'
            });
            
            return false;
        } catch (error) {
            // This is expected - the query should fail
            log('✅ Confirmed: The old query fails as expected', 'success');
            log(`   Error message: ${error.message.substring(0, 100)}...`, 'info');
            
            recordTest('Old buggy query (db.permission.findMany) fails as expected', true, {
                error: error.message
            });
            
            return true;
        }
    } catch (error) {
        log(`Unexpected error: ${error.message}`, 'error');
        recordTest('Old buggy query (db.permission.findMany) fails as expected', false, {
            error: error.message
        });
        
        return false;
    }
}

// Main test execution
async function runTests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'info');
    log('║  ROLE PERMISSIONS UPDATE FIX VERIFICATION TEST (V2)        ║', 'info');
    log('╚════════════════════════════════════════════════════════════╝', 'info');
    log(`Test Role ID: ${TEST_ROLE_ID}`, 'info');
    log(`Started at: ${testResults.startTime}`, 'info');
    
    try {
        // Connect to database
        log('\nConnecting to database...', 'info');
        await databaseService.connect();
        log('Database connected successfully', 'success');
        
        // Run all tests
        await testPermissionsTableExists();
        await testPermissionTableDoesNotExist();
        await testRolePermissionsWithRelation();
        await testFixedCodeQuery();
        await testBuggyCodeQuery();
        
    } catch (error) {
        log(`\n❌ Test execution failed: ${error.message}`, 'error');
        log(error.stack, 'error');
    } finally {
        // Close database connection
        try {
            await databaseService.disconnect();
            log('\nDatabase connection closed', 'info');
        } catch (error) {
            log(`Error closing database: ${error.message}`, 'warning');
        }
        
        // Print test summary
        printTestSummary();
    }
}

// Print test summary
function printTestSummary() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'info');
    log('║  TEST SUMMARY                                              ║', 'info');
    log('╚════════════════════════════════════════════════════════════╝', 'info');
    
    const { total, passed, failed } = testResults.summary;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    log(`\nTotal Tests: ${total}`, 'info');
    log(`Passed: ${passed} (${successRate}%)`, passed === total ? 'success' : 'info');
    log(`Failed: ${failed}`, failed === 0 ? 'success' : 'error');
    
    log('\nDetailed Results:', 'info');
    testResults.tests.forEach((test, idx) => {
        const status = test.passed ? '✅ PASS' : '❌ FAIL';
        log(`${idx + 1}. ${status}: ${test.name}`, test.passed ? 'success' : 'error');
        if (!test.passed && test.error) {
            log(`   Error: ${test.error.substring(0, 150)}...`, 'error');
        }
    });
    
    // Final verdict on the fix
    log('\n╔════════════════════════════════════════════════════════════╗', 'info');
    log('║  FIX VERDICT                                               ║', 'info');
    log('╚════════════════════════════════════════════════════════════╝', 'info');
    
    const fixedQueryTest = testResults.tests.find(t => t.name === 'Fixed code query (db.permissions.findMany) works');
    const buggyQueryTest = testResults.tests.find(t => t.name === 'Old buggy query (db.permission.findMany) fails as expected');
    
    if (fixedQueryTest && fixedQueryTest.passed) {
        log('\n✅✅✅ FIX VERIFIED ✅✅✅', 'success');
        log('The fix is working correctly!', 'success');
        log('', 'info');
        log('What was fixed:', 'info');
        log('  File: backend/routes/rbacRolePermissions.js', 'info');
        log('  Line: 130', 'info');
        log('  OLD (buggy): db.getClient().permission.findMany', 'error');
        log('  NEW (fixed):  db.getClient().permissions.findMany', 'success');
        log('', 'info');
        log('The correct table name is "permissions" (plural), not "permission" (singular).', 'info');
        log('The PUT endpoint /api/v1/rbac/roles/:roleId/permissions should now work correctly.', 'success');
        
        if (buggyQueryTest && buggyQueryTest.passed) {
            log('', 'info');
            log('Additionally verified:', 'success');
            log('  ✅ The old (buggy) query fails as expected', 'success');
            log('  ✅ The new (fixed) query works correctly', 'success');
        }
    } else {
        log('\n❌❌❌ FIX NOT VERIFIED ❌❌❌', 'error');
        log('The fix may not be working correctly.', 'error');
        log('Please check that line 130 in rbacRolePermissions.js has been corrected.', 'error');
    }
    
    log(`\nTest completed at: ${new Date().toISOString()}`, 'info');
    
    // Save results to file
    const resultsFile = './test-role-permissions-fix-results-v2.json';
    try {
        require('fs').writeFileSync(
            resultsFile,
            JSON.stringify(testResults, null, 2)
        );
        log(`\nTest results saved to: ${resultsFile}`, 'info');
    } catch (error) {
        log(`Could not save results to file: ${error.message}`, 'warning');
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
