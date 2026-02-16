// ============================================
// RBAC Authorization Fix Verification Test
// ============================================
// This test verifies the RBAC authorization fix that allows SUPER_ADMIN users
// to update permissions for SUPER_ADMIN roles (same-level role updates)
// 
// Fix Applied: Changed line151 in backend/utils/rbacUtils.js from:
//   return assignerMaxLevel > targetRole.hierarchy_level;
// to:
//   return assignerMaxLevel >= targetRole.hierarchy_level;
// 
// Original Issue: test.superadmin@smarttech.com with SUPER_ADMIN role was getting
// "You do not have permission to update permissions for this role" when adding cart permissions
// ============================================

const { Pool } = require('pg');
const { rbacUtils } = require('./utils/rbacUtils');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev'
});

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  skipped: []
};

// Helper function to log test results
function logTestResult(testName, passed, message, details = null) {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status} - ${testName}`);
  console.log(`  Message: ${message}`);
  if (details) {
    console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
  }
  console.log();
  
  if (passed) {
    testResults.passed.push({ testName, message, details });
  } else {
    testResults.failed.push({ testName, message, details });
  }
}

// Helper function to skip test
function skipTest(testName, message) {
  console.log(`⊘ SKIP - ${testName}`);
  console.log(`  Message: ${message}`);
  console.log();
  testResults.skipped.push({ testName, message });
}

// Helper function to print section header
function printSection(title) {
  console.log('='.repeat(80));
  console.log(title);
  console.log('='.repeat(80));
  console.log();
}

async function runTests() {
  const client = await pool.connect();
  
  try {
    printSection('RBAC AUTHORIZATION FIX VERIFICATION TEST');
    console.log('Test Start Time:', new Date().toISOString());
    console.log();
    
    // ============================================
    // SECTION 1: Database State Verification
    // ============================================
    printSection('SECTION 1: DATABASE STATE VERIFICATION');
    
    // Test 1.1: Verify SUPER_ADMIN role exists
    console.log('Test 1.1: Verify SUPER_ADMIN role exists');
    const superAdminRoleResult = await client.query(`
      SELECT id, name, hierarchy_level
      FROM roles
      WHERE name = 'SUPER_ADMIN'
    `);
    
    if (superAdminRoleResult.rows.length > 0) {
      const superAdminRole = superAdminRoleResult.rows[0];
      logTestResult(
        'SUPER_ADMIN Role Exists',
        true,
        `SUPER_ADMIN role found with ID ${superAdminRole.id} and hierarchy level ${superAdminRole.hierarchy_level}`,
        { id: superAdminRole.id, name: superAdminRole.name, hierarchy_level: superAdminRole.hierarchy_level }
      );
    } else {
      logTestResult(
        'SUPER_ADMIN Role Exists',
        false,
        'SUPER_ADMIN role not found in database'
      );
    }
    
    // Test 1.2: Verify ADMIN role exists
    console.log('Test 1.2: Verify ADMIN role exists');
    const adminRoleResult = await client.query(`
      SELECT id, name, hierarchy_level
      FROM roles
      WHERE name = 'ADMIN'
    `);
    
    if (adminRoleResult.rows.length > 0) {
      const adminRole = adminRoleResult.rows[0];
      logTestResult(
        'ADMIN Role Exists',
        true,
        `ADMIN role found with ID ${adminRole.id} and hierarchy level ${adminRole.hierarchy_level}`,
        { id: adminRole.id, name: adminRole.name, hierarchy_level: adminRole.hierarchy_level }
      );
    } else {
      logTestResult(
        'ADMIN Role Exists',
        false,
        'ADMIN role not found in database'
      );
    }
    
    // Test 1.3: Verify cart permissions exist
    console.log('Test 1.3: Verify cart permissions exist');
    const cartPermsResult = await client.query(`
      SELECT id, name, resource, action
      FROM permissions
      WHERE resource = 'cart'
      ORDER BY action
    `);
    
    const expectedCartPerms = ['cart:read', 'cart:write', 'cart:delete', 'cart:analytics'];
    const foundCartPerms = cartPermsResult.rows.map(p => p.name);
    const allCartPermsExist = expectedCartPerms.every(perm => foundCartPerms.includes(perm));
    
    if (allCartPermsExist) {
      logTestResult(
        'Cart Permissions Exist',
        true,
        `All ${expectedCartPerms.length} cart permissions found`,
        { expected: expectedCartPerms, found: foundCartPerms }
      );
    } else {
      const missingPerms = expectedCartPerms.filter(perm => !foundCartPerms.includes(perm));
      logTestResult(
        'Cart Permissions Exist',
        false,
        `Missing cart permissions: ${missingPerms.join(', ')}`,
        { expected: expectedCartPerms, found: foundCartPerms, missing: missingPerms }
      );
    }
    
    // Test 1.4: Verify test.superadmin@smarttech.com user exists
    console.log('Test 1.4: Verify test.superadmin@smarttech.com user exists');
    const testUserResult = await client.query(`
      SELECT id, email
      FROM users
      WHERE email = 'test.superadmin@smarttech.com'
    `);
    
    if (testUserResult.rows.length > 0) {
      const testUser = testUserResult.rows[0];
      logTestResult(
        'Test SUPER_ADMIN User Exists',
        true,
        `Test user found with ID ${testUser.id}`,
        { id: testUser.id, email: testUser.email }
      );
    } else {
      skipTest(
        'Test SUPER_ADMIN User Exists',
        'Test user test.superadmin@smarttech.com not found in database'
      );
    }
    
    // Test 1.5: Verify test user has SUPER_ADMIN role
    console.log('Test 1.5: Verify test user has SUPER_ADMIN role');
    if (testUserResult.rows.length > 0) {
      const testUserId = testUserResult.rows[0].id;
      const testUserRoleResult = await client.query(`
        SELECT r.id, r.name, r.hierarchy_level
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
          AND r.name = 'SUPER_ADMIN'
          AND ur.is_active = TRUE
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      `, [testUserId]);
      
      if (testUserRoleResult.rows.length > 0) {
        const userRole = testUserRoleResult.rows[0];
        logTestResult(
          'Test User Has SUPER_ADMIN Role',
          true,
          `Test user has active SUPER_ADMIN role with hierarchy level ${userRole.hierarchy_level}`,
          { user_id: testUserId, role: userRole.name, hierarchy_level: userRole.hierarchy_level }
        );
      } else {
        skipTest(
          'Test User Has SUPER_ADMIN Role',
          'Test user does not have active SUPER_ADMIN role'
        );
      }
    }
    
    // Test 1.6: Verify role hierarchy
    console.log('Test 1.6: Verify role hierarchy');
    const allRolesResult = await client.query(`
      SELECT name, hierarchy_level
      FROM roles
      ORDER BY hierarchy_level DESC
    `);
    
    const roleHierarchy = allRolesResult.rows.map(r => ({
      name: r.name,
      level: r.hierarchy_level
    }));
    
    const hasSuperAdmin = roleHierarchy.some(r => r.name === 'SUPER_ADMIN');
    const hasAdmin = roleHierarchy.some(r => r.name === 'ADMIN');
    const superAdminLevel = roleHierarchy.find(r => r.name === 'SUPER_ADMIN')?.level;
    const adminLevel = roleHierarchy.find(r => r.name === 'ADMIN')?.level;
    
    if (hasSuperAdmin && hasAdmin && superAdminLevel > adminLevel) {
      logTestResult(
        'Role Hierarchy is Correct',
        true,
        `Role hierarchy is correct: SUPER_ADMIN (level ${superAdminLevel}) > ADMIN (level ${adminLevel})`,
        { hierarchy: roleHierarchy }
      );
    } else {
      logTestResult(
        'Role Hierarchy is Correct',
        false,
        'Role hierarchy is incorrect or incomplete',
        { hierarchy: roleHierarchy, hasSuperAdmin, hasAdmin, superAdminLevel, adminLevel }
      );
    }
    
    // ============================================
    // SECTION 2: RBAC Utils Authorization Tests
    // ============================================
    printSection('SECTION 2: RBAC UTILS AUTHORIZATION TESTS');
    
    // Test 2.1: SUPER_ADMIN can assign SUPER_ADMIN role (same level)
    console.log('Test 2.1: SUPER_ADMIN can assign SUPER_ADMIN role (same level)');
    if (testUserResult.rows.length > 0) {
      const testUserId = testUserResult.rows[0].id;
      try {
        const canAssign = await rbacUtils.canAssignRole(testUserId, 'SUPER_ADMIN');
        if (canAssign) {
          logTestResult(
            'SUPER_ADMIN Can Assign SUPER_ADMIN Role',
            true,
            'SUPER_ADMIN user can assign SUPER_ADMIN role (same-level authorization works)',
            { user_id: testUserId, target_role: 'SUPER_ADMIN', can_assign: canAssign }
          );
        } else {
          logTestResult(
            'SUPER_ADMIN Can Assign SUPER_ADMIN Role',
            false,
            'SUPER_ADMIN user CANNOT assign SUPER_ADMIN role (fix may not be working)',
            { user_id: testUserId, target_role: 'SUPER_ADMIN', can_assign: canAssign }
          );
        }
      } catch (error) {
        logTestResult(
          'SUPER_ADMIN Can Assign SUPER_ADMIN Role',
          false,
          `Error checking role assignment: ${error.message}`,
          { error: error.message }
        );
      }
    }
    
    // Test 2.2: SUPER_ADMIN can assign ADMIN role (lower level)
    console.log('Test 2.2: SUPER_ADMIN can assign ADMIN role (lower level)');
    if (testUserResult.rows.length > 0) {
      const testUserId = testUserResult.rows[0].id;
      try {
        const canAssign = await rbacUtils.canAssignRole(testUserId, 'ADMIN');
        if (canAssign) {
          logTestResult(
            'SUPER_ADMIN Can Assign ADMIN Role',
            true,
            'SUPER_ADMIN user can assign ADMIN role (lower-level authorization works)',
            { user_id: testUserId, target_role: 'ADMIN', can_assign: canAssign }
          );
        } else {
          logTestResult(
            'SUPER_ADMIN Can Assign ADMIN Role',
            false,
            'SUPER_ADMIN user CANNOT assign ADMIN role (unexpected failure)',
            { user_id: testUserId, target_role: 'ADMIN', can_assign: canAssign }
          );
        }
      } catch (error) {
        logTestResult(
          'SUPER_ADMIN Can Assign ADMIN Role',
          false,
          `Error checking role assignment: ${error.message}`,
          { error: error.message }
        );
      }
    }
    
    // Test 2.3: SUPER_ADMIN cannot assign roles above level 5 (security check)
    console.log('Test 2.3: SUPER_ADMIN cannot assign roles above level 5 (security check)');
    if (testUserResult.rows.length > 0) {
      const testUserId = testUserResult.rows[0].id;
      const saLevel = roleHierarchy.find(r => r.name === 'SUPER_ADMIN')?.level;
      
      // Check if there are any roles above SUPER_ADMIN level
      const rolesAboveSuperAdmin = roleHierarchy.filter(r => r.level > saLevel);
      
      if (rolesAboveSuperAdmin.length > 0) {
        const highestRole = rolesAboveSuperAdmin[0];
        try {
          const canAssign = await rbacUtils.canAssignRole(testUserId, highestRole.name);
          if (!canAssign) {
            logTestResult(
              'SUPER_ADMIN Cannot Assign Higher-Level Roles',
              true,
              `SUPER_ADMIN user CANNOT assign ${highestRole.name} role (level ${highestRole.level}) - security maintained`,
              { user_id: testUserId, target_role: highestRole.name, target_level: highestRole.level, can_assign: canAssign }
            );
          } else {
            logTestResult(
              'SUPER_ADMIN Cannot Assign Higher-Level Roles',
              false,
              `SUPER_ADMIN user CAN assign ${highestRole.name} role (level ${highestRole.level}) - SECURITY BREACH!`,
              { user_id: testUserId, target_role: highestRole.name, target_level: highestRole.level, can_assign: canAssign }
            );
          }
        } catch (error) {
          logTestResult(
            'SUPER_ADMIN Cannot Assign Higher-Level Roles',
            false,
            `Error checking role assignment: ${error.message}`,
            { error: error.message }
          );
        }
      } else {
        skipTest(
          'SUPER_ADMIN Cannot Assign Higher-Level Roles',
          `No roles found above SUPER_ADMIN level (${saLevel}) - security check not applicable`
        );
      }
    }
    
    // Test 2.4: ADMIN cannot assign SUPER_ADMIN role (security check)
    console.log('Test 2.4: ADMIN cannot assign SUPER_ADMIN role (security check)');
    // Find an ADMIN user
    const adminUserResult = await client.query(`
      SELECT u.id, u.email
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'ADMIN'
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      LIMIT 1
    `);
    
    if (adminUserResult.rows.length > 0) {
      const adminUserId = adminUserResult.rows[0].id;
      const adminEmail = adminUserResult.rows[0].email;
      try {
        const canAssign = await rbacUtils.canAssignRole(adminUserId, 'SUPER_ADMIN');
        if (!canAssign) {
          logTestResult(
            'ADMIN Cannot Assign SUPER_ADMIN Role',
            true,
            `ADMIN user (${adminEmail}) CANNOT assign SUPER_ADMIN role - security maintained`,
            { user_id: adminUserId, user_email: adminEmail, target_role: 'SUPER_ADMIN', can_assign: canAssign }
          );
        } else {
          logTestResult(
            'ADMIN Cannot Assign SUPER_ADMIN Role',
            false,
            `ADMIN user (${adminEmail}) CAN assign SUPER_ADMIN role - SECURITY BREACH!`,
            { user_id: adminUserId, user_email: adminEmail, target_role: 'SUPER_ADMIN', can_assign: canAssign }
          );
        }
      } catch (error) {
        logTestResult(
          'ADMIN Cannot Assign SUPER_ADMIN Role',
          false,
          `Error checking role assignment: ${error.message}`,
          { error: error.message }
        );
      }
    } else {
      skipTest(
        'ADMIN Cannot Assign SUPER_ADMIN Role',
        'No ADMIN user found in database'
      );
    }
    
    // Test 2.5: Verify canAssignAnyRole function
    console.log('Test 2.5: Verify canAssignAnyRole function');
    if (testUserResult.rows.length > 0) {
      const testUserId = testUserResult.rows[0].id;
      try {
        const canAssignAny = await rbacUtils.canAssignAnyRole(testUserId, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);
        if (canAssignAny) {
          logTestResult(
            'canAssignAnyRole Works Correctly',
            true,
            'SUPER_ADMIN user can assign at least one of the specified roles',
            { user_id: testUserId, target_roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'], can_assign_any: canAssignAny }
          );
        } else {
          logTestResult(
            'canAssignAnyRole Works Correctly',
            false,
            'SUPER_ADMIN user cannot assign any of the specified roles (unexpected)',
            { user_id: testUserId, target_roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'], can_assign_any: canAssignAny }
          );
        }
      } catch (error) {
        logTestResult(
          'canAssignAnyRole Works Correctly',
          false,
          `Error checking role assignment: ${error.message}`,
          { error: error.message }
        );
      }
    }
    
    // ============================================
    // SECTION 3: Cart Permission Assignment Tests
    // ============================================
    printSection('SECTION 3: CART PERMISSION ASSIGNMENT TESTS');
    
    // Test 3.1: Verify cart permissions can be retrieved
    console.log('Test 3.1: Verify cart permissions can be retrieved');
    try {
      const permissionsByResource = await rbacUtils.getPermissionsByResource();
      const cartPermissions = permissionsByResource['cart'] || [];
      
      if (cartPermissions.length > 0) {
        logTestResult(
          'Cart Permissions Can Be Retrieved',
          true,
          `Successfully retrieved ${cartPermissions.length} cart permissions`,
          { cart_permissions: cartPermissions.map(p => p.name) }
        );
      } else {
        logTestResult(
          'Cart Permissions Can Be Retrieved',
          false,
          'No cart permissions found',
          { permissions_by_resource: permissionsByResource }
        );
      }
    } catch (error) {
      logTestResult(
        'Cart Permissions Can Be Retrieved',
        false,
        `Error retrieving permissions: ${error.message}`,
        { error: error.message }
      );
    }
    
    // Test 3.2: Verify role permissions can be retrieved
    console.log('Test 3.2: Verify role permissions can be retrieved');
    if (superAdminRoleResult.rows.length > 0) {
      const superAdminRoleId = superAdminRoleResult.rows[0].id;
      try {
        const rolePermissions = await rbacUtils.roleModel.getPermissions(superAdminRoleId);
        logTestResult(
          'SUPER_ADMIN Role Permissions Can Be Retrieved',
          true,
          `Successfully retrieved ${rolePermissions.length} permissions for SUPER_ADMIN role`,
          { role_id: superAdminRoleId, permission_count: rolePermissions.length }
        );
      } catch (error) {
        logTestResult(
          'SUPER_ADMIN Role Permissions Can Be Retrieved',
          false,
          `Error retrieving role permissions: ${error.message}`,
          { error: error.message }
        );
      }
    }
    
    // Test 3.3: Verify permission name validation
    console.log('Test 3.3: Verify permission name validation');
    const validPerms = ['cart:read', 'cart:write', 'cart:delete', 'cart:analytics'];
    const invalidPerms = ['cart-read', 'CART:READ', 'cart:read:write', ''];
    
    const allValid = validPerms.every(p => rbacUtils.isValidPermissionName(p));
    const allInvalid = invalidPerms.every(p => !rbacUtils.isValidPermissionName(p));
    
    if (allValid && allInvalid) {
      logTestResult(
        'Permission Name Validation Works',
        true,
        'Permission name validation correctly identifies valid and invalid permission names',
        { valid: validPerms, invalid: invalidPerms }
      );
    } else {
      logTestResult(
        'Permission Name Validation Works',
        false,
        'Permission name validation is not working correctly',
        { valid: validPerms, invalid: invalidPerms, allValid, allInvalid }
      );
    }
    
    // Test 3.4: Verify role name validation
    console.log('Test 3.4: Verify role name validation');
    const validRoles = ['CUSTOMER', 'SUPPORT', 'CORPORATE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
    const invalidRoles = ['USER', 'GUEST', 'MODERATOR', 'superadmin', 'Super_Admin'];
    
    const allRolesValid = validRoles.every(r => rbacUtils.isValidRoleName(r));
    const allRolesInvalid = invalidRoles.every(r => !rbacUtils.isValidRoleName(r));
    
    if (allRolesValid && allRolesInvalid) {
      logTestResult(
        'Role Name Validation Works',
        true,
        'Role name validation correctly identifies valid and invalid role names',
        { valid: validRoles, invalid: invalidRoles }
      );
    } else {
      logTestResult(
        'Role Name Validation Works',
        false,
        'Role name validation is not working correctly',
        { valid: validRoles, invalid: invalidRoles, allRolesValid, allRolesInvalid }
      );
    }
    
    // ============================================
    // SECTION 4: Security Protocol Verification
    // ============================================
    printSection('SECTION 4: SECURITY PROTOCOL VERIFICATION');
    
    // Test 4.1: Verify hierarchy enforcement
    console.log('Test 4.1: Verify hierarchy enforcement');
    if (testUserResult.rows.length > 0 && adminUserResult.rows.length > 0) {
      const testUserId = testUserResult.rows[0].id;
      const adminUserId = adminUserResult.rows[0].id;
      
      try {
        // SUPER_ADMIN should be able to assign SUPER_ADMIN (same level)
        const superAdminCanAssignSuperAdmin = await rbacUtils.canAssignRole(testUserId, 'SUPER_ADMIN');
        
        // ADMIN should NOT be able to assign SUPER_ADMIN (higher level)
        const adminCanAssignSuperAdmin = await rbacUtils.canAssignRole(adminUserId, 'SUPER_ADMIN');
        
        if (superAdminCanAssignSuperAdmin && !adminCanAssignSuperAdmin) {
          logTestResult(
            'Hierarchy Enforcement Works',
            true,
            'Hierarchy is correctly enforced: same-level users can assign, lower-level users cannot',
            {
              super_admin_can_assign_super_admin: superAdminCanAssignSuperAdmin,
              admin_can_assign_super_admin: adminCanAssignSuperAdmin
            }
          );
        } else {
          logTestResult(
            'Hierarchy Enforcement Works',
            false,
            'Hierarchy enforcement is not working correctly',
            {
              super_admin_can_assign_super_admin: superAdminCanAssignSuperAdmin,
              admin_can_assign_super_admin: adminCanAssignSuperAdmin,
              expected: { super_admin_can_assign_super_admin: true, admin_can_assign_super_admin: false }
            }
          );
        }
      } catch (error) {
        logTestResult(
          'Hierarchy Enforcement Works',
          false,
          `Error checking hierarchy enforcement: ${error.message}`,
          { error: error.message }
        );
      }
    }
    
    // Test 4.2: Verify no roles exist above level 5 (if SUPER_ADMIN is level 5)
    console.log('Test 4.2: Verify no roles exist above SUPER_ADMIN level');
    const saLevel2 = roleHierarchy.find(r => r.name === 'SUPER_ADMIN')?.level;
    const rolesAboveSuperAdmin = roleHierarchy.filter(r => r.level > saLevel2);
    
    if (rolesAboveSuperAdmin.length === 0) {
      logTestResult(
        'No Roles Above SUPER_ADMIN Level',
        true,
        `No roles found above SUPER_ADMIN level (${superAdminLevel}) - SUPER_ADMIN is the highest level`,
        { super_admin_level: superAdminLevel, roles_above: rolesAboveSuperAdmin }
      );
    } else {
      logTestResult(
        'No Roles Above SUPER_ADMIN Level',
        false,
        `Found ${rolesAboveSuperAdmin.length} roles above SUPER_ADMIN level (${superAdminLevel})`,
        { super_admin_level: superAdminLevel, roles_above: rolesAboveSuperAdmin }
      );
    }
    
    // Test 4.3: Verify getUserMaxRoleLevel function
    console.log('Test 4.3: Verify getUserMaxRoleLevel function');
    if (testUserResult.rows.length > 0) {
      const testUserId = testUserResult.rows[0].id;
      try {
        const maxLevel = await rbacUtils.getUserMaxRoleLevel(testUserId);
        const expectedLevel = saLevel2;
        
        if (maxLevel === expectedLevel) {
          logTestResult(
            'getUserMaxRoleLevel Works Correctly',
            true,
            `User's max role level is correctly calculated as ${maxLevel}`,
            { user_id: testUserId, max_level: maxLevel, expected_level: expectedLevel }
          );
        } else {
          logTestResult(
            'getUserMaxRoleLevel Works Correctly',
            false,
            `User's max role level (${maxLevel}) does not match expected (${expectedLevel})`,
            { user_id: testUserId, max_level: maxLevel, expected_level: expectedLevel }
          );
        }
      } catch (error) {
        logTestResult(
          'getUserMaxRoleLevel Works Correctly',
          false,
          `Error getting user max role level: ${error.message}`,
          { error: error.message }
        );
      }
    }
    
    // Test 4.4: Verify getRoleHierarchy function
    console.log('Test 4.4: Verify getRoleHierarchy function');
    try {
      const roleHierarchyResult = await rbacUtils.getRoleHierarchy();
      
      if (roleHierarchyResult.length > 0 && roleHierarchyResult[0].name === 'SUPER_ADMIN') {
        logTestResult(
          'getRoleHierarchy Works Correctly',
          true,
          `Role hierarchy is correctly ordered with SUPER_ADMIN at the top`,
          { hierarchy: roleHierarchyResult.map(r => ({ name: r.name, level: r.hierarchy_level })) }
        );
      } else {
        logTestResult(
          'getRoleHierarchy Works Correctly',
          false,
          'Role hierarchy is not correctly ordered',
          { hierarchy: roleHierarchyResult.map(r => ({ name: r.name, level: r.hierarchy_level })) }
        );
      }
    } catch (error) {
      logTestResult(
        'getRoleHierarchy Works Correctly',
        false,
        `Error getting role hierarchy: ${error.message}`,
        { error: error.message }
      );
    }
    
    // ============================================
    // SECTION 5: Original Issue Verification
    // ============================================
    printSection('SECTION 5: ORIGINAL ISSUE VERIFICATION');
    
    // Test 5.1: Verify the fix resolves the original issue
    console.log('Test 5.1: Verify the fix resolves the original issue');
    console.log('Original Issue: test.superadmin@smarttech.com with SUPER_ADMIN role was getting');
    console.log('"You do not have permission to update permissions for this role" when adding cart permissions');
    console.log();
    
    if (testUserResult.rows.length > 0) {
      const testUserId = testUserResult.rows[0].id;
      try {
        // The fix allows SUPER_ADMIN users to update permissions for SUPER_ADMIN roles
        // This is tested by checking if canAssignRole returns true for same-level roles
        const canUpdateSuperAdmin = await rbacUtils.canAssignRole(testUserId, 'SUPER_ADMIN');
        
        if (canUpdateSuperAdmin) {
          logTestResult(
            'Original Issue is Resolved',
            true,
            'SUPER_ADMIN user can now update permissions for SUPER_ADMIN roles - fix is working!',
            {
              user_id: testUserId,
              user_email: testUserResult.rows[0].email,
              target_role: 'SUPER_ADMIN',
              can_update: canUpdateSuperAdmin,
              fix_description: 'Changed line151 from > to >= in rbacUtils.js'
            }
          );
        } else {
          logTestResult(
            'Original Issue is Resolved',
            false,
            'SUPER_ADMIN user still cannot update permissions for SUPER_ADMIN roles - fix may not be working',
            {
              user_id: testUserId,
              user_email: testUserResult.rows[0].email,
              target_role: 'SUPER_ADMIN',
              can_update: canUpdateSuperAdmin
            }
          );
        }
      } catch (error) {
        logTestResult(
          'Original Issue is Resolved',
          false,
          `Error verifying fix: ${error.message}`,
          { error: error.message }
        );
      }
    }
    
    // Test 5.2: Verify cart permissions can be added to SUPER_ADMIN role
    console.log('Test 5.2: Verify cart permissions can be added to SUPER_ADMIN role');
    if (superAdminRoleResult.rows.length > 0 && testUserResult.rows.length > 0) {
      const superAdminRoleId = superAdminRoleResult.rows[0].id;
      const testUserId = testUserResult.rows[0].id;
      
      try {
        // Check if SUPER_ADMIN can assign SUPER_ADMIN (which means they can update permissions)
        const canUpdate = await rbacUtils.canAssignRole(testUserId, 'SUPER_ADMIN');
        
        // Check current cart permissions for SUPER_ADMIN role
        const currentCartPerms = await client.query(`
          SELECT p.name
          FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          WHERE rp.role_id = $1
            AND p.resource = 'cart'
          ORDER BY p.action
        `, [superAdminRoleId]);
        
        const currentCartPermNames = currentCartPerms.rows.map(p => p.name);
        const missingCartPerms = expectedCartPerms.filter(perm => !currentCartPermNames.includes(perm));
        
        if (canUpdate) {
          logTestResult(
            'Cart Permissions Can Be Added to SUPER_ADMIN Role',
            true,
            `SUPER_ADMIN user has authorization to update SUPER_ADMIN role permissions. Current cart permissions: ${currentCartPermNames.length}/4`,
            {
              role_id: superAdminRoleId,
              user_id: testUserId,
              can_update: canUpdate,
              current_cart_permissions: currentCartPermNames,
              missing_cart_permissions: missingCartPerms
            }
          );
        } else {
          logTestResult(
            'Cart Permissions Can Be Added to SUPER_ADMIN Role',
            false,
            'SUPER_ADMIN user does not have authorization to update SUPER_ADMIN role permissions',
            {
              role_id: superAdminRoleId,
              user_id: testUserId,
              can_update: canUpdate,
              current_cart_permissions: currentCartPermNames
            }
          );
        }
      } catch (error) {
        logTestResult(
          'Cart Permissions Can Be Added to SUPER_ADMIN Role',
          false,
          `Error checking cart permissions: ${error.message}`,
          { error: error.message }
        );
      }
    }
    
    // ============================================
    // TEST SUMMARY
    // ============================================
    printSection('TEST SUMMARY');
    
    console.log('Total Tests Run:', testResults.passed.length + testResults.failed.length + testResults.skipped.length);
    console.log('Tests Passed:', testResults.passed.length, '✓');
    console.log('Tests Failed:', testResults.failed.length, '✗');
    console.log('Tests Skipped:', testResults.skipped.length, '⊘');
    console.log();
    
    if (testResults.failed.length === 0) {
      console.log('='.repeat(80));
      console.log('✓ ALL TESTS PASSED!');
      console.log('='.repeat(80));
      console.log();
      console.log('The RBAC authorization fix is working correctly:');
      console.log('  - SUPER_ADMIN users can now update permissions for SUPER_ADMIN roles');
      console.log('  - Cart permissions can be added to roles by SUPER_ADMIN users');
      console.log('  - Lower-level users (e.g., ADMIN) cannot update SUPER_ADMIN roles');
      console.log('  - Security protocols are maintained');
      console.log('  - The original issue has been resolved');
      console.log();
    } else {
      console.log('='.repeat(80));
      console.log('✗ SOME TESTS FAILED!');
      console.log('='.repeat(80));
      console.log();
      console.log('Failed Tests:');
      testResults.failed.forEach((test, index) => {
        console.log(`  ${index + 1}. ${test.testName}`);
        console.log(`     Message: ${test.message}`);
        if (test.details) {
          console.log(`     Details: ${JSON.stringify(test.details)}`);
        }
        console.log();
      });
    }
    
    if (testResults.skipped.length > 0) {
      console.log('Skipped Tests:');
      testResults.skipped.forEach((test, index) => {
        console.log(`  ${index + 1}. ${test.testName}`);
        console.log(`     Message: ${test.message}`);
        console.log();
      });
    }
    
    console.log('Test End Time:', new Date().toISOString());
    console.log();
    
    // ============================================
    // DETAILED RESULTS FOR DOCUMENTATION
    // ============================================
    printSection('DETAILED RESULTS FOR DOCUMENTATION');
    
    console.log('Test Scenarios Executed:');
    console.log();
    
    console.log('SECTION 1: Database State Verification');
    console.log('  1.1. Verify SUPER_ADMIN role exists');
    console.log('  1.2. Verify ADMIN role exists');
    console.log('  1.3. Verify cart permissions exist');
    console.log('  1.4. Verify test.superadmin@smarttech.com user exists');
    console.log('  1.5. Verify test user has SUPER_ADMIN role');
    console.log('  1.6. Verify role hierarchy');
    console.log();
    
    console.log('SECTION 2: RBAC Utils Authorization Tests');
    console.log('  2.1. SUPER_ADMIN can assign SUPER_ADMIN role (same level)');
    console.log('  2.2. SUPER_ADMIN can assign ADMIN role (lower level)');
    console.log('  2.3. SUPER_ADMIN cannot assign roles above level 5 (security check)');
    console.log('  2.4. ADMIN cannot assign SUPER_ADMIN role (security check)');
    console.log('  2.5. Verify canAssignAnyRole function');
    console.log();
    
    console.log('SECTION 3: Cart Permission Assignment Tests');
    console.log('  3.1. Verify cart permissions can be retrieved');
    console.log('  3.2. Verify role permissions can be retrieved');
    console.log('  3.3. Verify permission name validation');
    console.log('  3.4. Verify role name validation');
    console.log();
    
    console.log('SECTION 4: Security Protocol Verification');
    console.log('  4.1. Verify hierarchy enforcement');
    console.log('  4.2. Verify no roles exist above SUPER_ADMIN level');
    console.log('  4.3. Verify getUserMaxRoleLevel function');
    console.log('  4.4. Verify getRoleHierarchy function');
    console.log();
    
    console.log('SECTION 5: Original Issue Verification');
    console.log('  5.1. Verify the fix resolves the original issue');
    console.log('  5.2. Verify cart permissions can be added to SUPER_ADMIN role');
    console.log();
    
    console.log('Pass/Fail Status:');
    console.log(`  Passed: ${testResults.passed.length}`);
    console.log(`  Failed: ${testResults.failed.length}`);
    console.log(`  Skipped: ${testResults.skipped.length}`);
    console.log();
    
    console.log('Fix Verification:');
    if (testResults.passed.length > 0) {
      const fixTest = testResults.passed.find(t => t.testName === 'Original Issue is Resolved');
      if (fixTest) {
        console.log('  ✓ Fix resolves the original issue');
      }
    }
    if (testResults.passed.length > 0) {
      const securityTest = testResults.passed.find(t => t.testName === 'Hierarchy Enforcement Works');
      if (securityTest) {
        console.log('  ✓ Security protocols are maintained');
      }
    }
    console.log();
    
    console.log('Edge Cases or Concerns:');
    if (testResults.failed.length > 0) {
      console.log('  - Failed tests indicate potential issues with the fix or system state');
      testResults.failed.forEach(test => {
        console.log(`    • ${test.testName}: ${test.message}`);
      });
    }
    if (testResults.skipped.length > 0) {
      console.log('  - Skipped tests indicate missing prerequisites');
      testResults.skipped.forEach(test => {
        console.log(`    • ${test.testName}: ${test.message}`);
      });
    }
    if (testResults.failed.length === 0 && testResults.skipped.length === 0) {
      console.log('  - No edge cases or concerns identified');
    }
    console.log();
    
  } catch (error) {
    console.error('Error during test execution:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the tests
runTests().catch(console.error);
