/**
 * Test Script: Role Permissions Update Fix Verification
 * 
 * This script tests the PUT endpoint for updating role permissions
 * to verify that the fix for the 500 Internal Server Error is working.
 * 
 * The fix changed line 130 in rbacRolePermissions.js from:
 *   db.getClient().permission.findMany
 * to:
 *   db.getClient().permissions.findMany
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { databaseService } = require('./services/database');

// Configuration
const TEST_ROLE_ID = '09510acf-2e77-4ae0-8206-3b154b391821';
const API_BASE_URL = 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Test results tracking
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

// Helper function to create a test JWT token
function createTestToken(userId) {
    return jwt.sign(
        { id: userId, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

// Step 1: Fetch available permissions from database
async function fetchAvailablePermissions() {
    log('\n=== Step 1: Fetching Available Permissions ===', 'test');
    
    try {
        const db = databaseService.getClient();
        const permissions = await db.permissions.findMany({
            select: {
                id: true,
                name: true,
                description: true
            },
            take: 10 // Limit to first 10 for testing
        });
        
        log(`Found ${permissions.length} permissions in database`, 'info');
        
        if (permissions.length === 0) {
            log('WARNING: No permissions found in database', 'warning');
            return null;
        }
        
        // Display first few permissions
        log('Sample permissions:', 'info');
        permissions.slice(0, 5).forEach((perm, idx) => {
            log(`  ${idx + 1}. ${perm.name} (${perm.id})`, 'info');
        });
        
        recordTest('Fetch available permissions from database', true, {
            count: permissions.length
        });
        
        return permissions;
    } catch (error) {
        log(`Error fetching permissions: ${error.message}`, 'error');
        recordTest('Fetch available permissions from database', false, {
            error: error.message
        });
        return null;
    }
}

// Step 2: Check if the test role exists
async function checkRoleExists() {
    log('\n=== Step 2: Checking Test Role Exists ===', 'test');
    
    try {
        const db = databaseService.getClient();
        const role = await db.roles.findUnique({
            where: { id: TEST_ROLE_ID },
            select: {
                id: true,
                name: true,
                description: true
            }
        });
        
        if (!role) {
            log(`Role with ID ${TEST_ROLE_ID} not found`, 'warning');
            recordTest('Check if test role exists', false, {
                error: 'Role not found'
            });
            return null;
        }
        
        log(`Found role: ${role.name} (${role.id})`, 'success');
        recordTest('Check if test role exists', true, {
            roleId: role.id,
            roleName: role.name
        });
        
        return role;
    } catch (error) {
        log(`Error checking role: ${error.message}`, 'error');
        recordTest('Check if test role exists', false, {
            error: error.message
        });
        return null;
    }
}

// Step 3: Get current permissions for the role
async function getCurrentRolePermissions() {
    log('\n=== Step 3: Getting Current Role Permissions ===', 'test');
    
    try {
        const db = databaseService.getClient();
        const rolePermissions = await db.role_permissions.findMany({
            where: { role_id: TEST_ROLE_ID },
            include: {
                permission: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        
        const currentPermissionIds = rolePermissions.map(rp => rp.permission_id);
        
        log(`Role currently has ${rolePermissions.length} permissions`, 'info');
        
        if (rolePermissions.length > 0) {
            log('Current permissions:', 'info');
            rolePermissions.slice(0, 5).forEach((rp, idx) => {
                log(`  ${idx + 1}. ${rp.permission.name} (${rp.permission.id})`, 'info');
            });
        }
        
        recordTest('Get current role permissions', true, {
            count: rolePermissions.length,
            permissionIds: currentPermissionIds
        });
        
        return currentPermissionIds;
    } catch (error) {
        log(`Error getting current permissions: ${error.message}`, 'error');
        recordTest('Get current role permissions', false, {
            error: error.message
        });
        return [];
    }
}

// Step 4: Test the PUT endpoint with valid permission IDs
async function testUpdateRolePermissions(availablePermissions, currentPermissionIds) {
    log('\n=== Step 4: Testing PUT /api/v1/rbac/roles/:roleId/permissions ===', 'test');
    
    if (!availablePermissions || availablePermissions.length === 0) {
        log('Cannot test endpoint - no permissions available', 'error');
        recordTest('Test PUT endpoint update', false, {
            error: 'No permissions available'
        });
        return null;
    }
    
    // Select some permissions to assign (first 3 from available)
    const permissionsToAssign = availablePermissions.slice(0, 3).map(p => p.id);
    
    log(`Attempting to update role with ${permissionsToAssign.length} permissions`, 'info');
    log(`Permission IDs: ${permissionsToAssign.join(', ')}`, 'info');
    
    // Create a test user token (you may need to adjust this based on your auth setup)
    const testUserId = 'test-user-id';
    const testToken = createTestToken(testUserId);
    
    try {
        const response = await request(API_BASE_URL)
            .put(`/api/v1/rbac/roles/${TEST_ROLE_ID}/permissions`)
            .set('Authorization', `Bearer ${testToken}`)
            .send({
                permissions: permissionsToAssign
            })
            .expect('Content-Type', /json/);
        
        log(`Response Status: ${response.status}`, 'info');
        log(`Response Body: ${JSON.stringify(response.body, null, 2)}`, 'info');
        
        // Check for 500 Internal Server Error (the bug we're testing for)
        if (response.status === 500) {
            log('❌ FAILED: Received 500 Internal Server Error', 'error');
            log('The fix did NOT work - endpoint still returns 500', 'error');
            recordTest('Test PUT endpoint update', false, {
                status: 500,
                error: 'Internal Server Error',
                body: response.body
            });
            return { success: false, status: 500, body: response.body };
        }
        
        // Check for success (200 OK)
        if (response.status === 200) {
            log('✅ SUCCESS: Received 200 OK', 'success');
            log('The fix is working - endpoint returns 200 OK', 'success');
            
            if (response.body.success) {
                log(`Response message: ${response.body.message}`, 'success');
                
                const addedCount = response.body.data?.addedCount || 0;
                const removedCount = response.body.data?.removedCount || 0;
                const finalPermissions = response.body.data?.permissions?.length || 0;
                
                log(`Added: ${addedCount}, Removed: ${removedCount}, Final: ${finalPermissions}`, 'info');
                
                recordTest('Test PUT endpoint update', true, {
                    status: 200,
                    addedCount,
                    removedCount,
                    finalPermissions,
                    body: response.body
                });
                
                return { success: true, status: 200, body: response.body };
            }
        }
        
        // Handle other status codes
        log(`Received status ${response.status}`, 'warning');
        recordTest('Test PUT endpoint update', false, {
            status: response.status,
            body: response.body
        });
        
        return { success: false, status: response.status, body: response.body };
        
    } catch (error) {
        log(`Request failed with error: ${error.message}`, 'error');
        
        if (error.response) {
            log(`Error response status: ${error.response.status}`, 'error');
            log(`Error response body: ${JSON.stringify(error.response.body, null, 2)}`, 'error');
            
            if (error.response.status === 500) {
                log('❌ FAILED: Received 500 Internal Server Error', 'error');
                log('The fix did NOT work - endpoint still returns 500', 'error');
            }
        }
        
        recordTest('Test PUT endpoint update', false, {
            error: error.message,
            status: error.response?.status
        });
        
        return { success: false, error: error.message };
    }
}

// Step 5: Verify the permissions were actually updated in the database
async function verifyPermissionsUpdated(expectedPermissionIds) {
    log('\n=== Step 5: Verifying Permissions Were Updated ===', 'test');
    
    try {
        const db = databaseService.getClient();
        const rolePermissions = await db.role_permissions.findMany({
            where: { role_id: TEST_ROLE_ID },
            include: {
                permission: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        
        const actualPermissionIds = rolePermissions.map(rp => rp.permission_id);
        
        log(`Role now has ${rolePermissions.length} permissions`, 'info');
        
        // Check if the permissions match
        const allExpectedPresent = expectedPermissionIds.every(id => 
            actualPermissionIds.includes(id)
        );
        
        if (allExpectedPresent) {
            log('✅ All expected permissions are present in the role', 'success');
            recordTest('Verify permissions updated in database', true, {
                expectedCount: expectedPermissionIds.length,
                actualCount: actualPermissionIds.length,
                permissionIds: actualPermissionIds
            });
            return true;
        } else {
            log('⚠️ Some expected permissions are missing', 'warning');
            recordTest('Verify permissions updated in database', false, {
                expectedCount: expectedPermissionIds.length,
                actualCount: actualPermissionIds.length,
                missing: expectedPermissionIds.filter(id => !actualPermissionIds.includes(id))
            });
            return false;
        }
    } catch (error) {
        log(`Error verifying permissions: ${error.message}`, 'error');
        recordTest('Verify permissions updated in database', false, {
            error: error.message
        });
        return false;
    }
}

// Main test execution
async function runTests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'info');
    log('║  ROLE PERMISSIONS UPDATE FIX VERIFICATION TEST           ║', 'info');
    log('╚════════════════════════════════════════════════════════════╝', 'info');
    log(`Test Role ID: ${TEST_ROLE_ID}`, 'info');
    log(`Started at: ${testResults.startTime}`, 'info');
    
    try {
        // Initialize database connection
        log('\nInitializing database connection...', 'info');
        await databaseService.connect();
        log('Database connected successfully', 'success');
        
        // Step 1: Fetch available permissions
        const availablePermissions = await fetchAvailablePermissions();
        
        // Step 2: Check if role exists
        const role = await checkRoleExists();
        
        if (!role) {
            log('\n⚠️ Test role does not exist. Cannot proceed with endpoint test.', 'warning');
            log('Please ensure the role exists or update TEST_ROLE_ID in the script.', 'warning');
        } else {
            // Step 3: Get current permissions
            const currentPermissionIds = await getCurrentRolePermissions();
            
            // Step 4: Test the PUT endpoint
            const updateResult = await testUpdateRolePermissions(
                availablePermissions, 
                currentPermissionIds
            );
            
            // Step 5: Verify permissions were updated (if update was successful)
            if (updateResult && updateResult.success) {
                const permissionsToAssign = availablePermissions.slice(0, 3).map(p => p.id);
                await verifyPermissionsUpdated(permissionsToAssign);
            }
        }
        
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
            log(`   Error: ${test.error}`, 'error');
        }
    });
    
    // Final verdict on the fix
    log('\n╔════════════════════════════════════════════════════════════╗', 'info');
    log('║  FIX VERDICT                                               ║', 'info');
    log('╚════════════════════════════════════════════════════════════╝', 'info');
    
    const endpointTest = testResults.tests.find(t => t.name === 'Test PUT endpoint update');
    
    if (endpointTest) {
        if (endpointTest.passed && endpointTest.status === 200) {
            log('\n✅✅✅ FIX VERIFIED ✅✅✅', 'success');
            log('The Role Permissions update endpoint is working correctly!', 'success');
            log('The fix changed db.getClient().permission.findMany to', 'info');
            log('db.getClient().permissions.findMany on line 130.', 'info');
            log('The endpoint now returns 200 OK instead of 500 Internal Server Error.', 'success');
        } else if (endpointTest.status === 500) {
            log('\n❌❌❌ FIX NOT WORKING ❌❌❌', 'error');
            log('The endpoint still returns 500 Internal Server Error.', 'error');
            log('Please verify that line 130 in rbacRolePermissions.js has been corrected.', 'error');
        } else {
            log('\n⚠️ INCONCLUSIVE RESULTS ⚠️', 'warning');
            log(`The endpoint returned status ${endpointTest.status}.`, 'warning');
            log('This may be due to authentication or other issues.', 'warning');
            log('Please check the detailed results above.', 'warning');
        }
    } else {
        log('\n⚠️ Could not verify fix - endpoint test was not executed', 'warning');
    }
    
    log(`\nTest completed at: ${new Date().toISOString()}`, 'info');
    
    // Save results to file
    const resultsFile = './test-role-permissions-fix-results.json';
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
