// ============================================
// RBAC Schema Investigation Script v2
// ============================================
// This script investigates the RBAC database schema to identify
// the permission structure for the authorization issue.
// ============================================

const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev'
});

async function investigateRBAC() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(80));
    console.log('RBAC SCHEMA INVESTIGATION REPORT');
    console.log('='.repeat(80));
    console.log();

    // ============================================
    // 0. CHECK USERS TABLE SCHEMA
    // ============================================
    console.log('0. USERS TABLE SCHEMA');
    console.log('-'.repeat(80));
    const usersSchemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    usersSchemaResult.rows.forEach(col => {
      console.log(`  - ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable}`);
    });
    console.log();

    // ============================================
    // 1. EXAMINE ROLES TABLE
    // ============================================
    console.log('1. ROLES TABLE DATA');
    console.log('-'.repeat(80));
    const rolesResult = await client.query(`
      SELECT id, name, description, hierarchy_level, created_at
      FROM roles
      ORDER BY hierarchy_level DESC, name
    `);
    console.log('Roles found:', rolesResult.rows.length);
    rolesResult.rows.forEach(role => {
      console.log(`  - ${role.name.padEnd(15)} | Level: ${role.hierarchy_level} | ID: ${role.id}`);
    });
    console.log();

    // ============================================
    // 2. EXAMINE PERMISSIONS TABLE
    // ============================================
    console.log('2. PERMISSIONS TABLE DATA');
    console.log('-'.repeat(80));
    const permissionsResult = await client.query(`
      SELECT id, name, resource, action, description
      FROM permissions
      ORDER BY resource, action
    `);
    console.log('Permissions found:', permissionsResult.rows.length);
    console.log();
    
    // Group by resource
    const byResource = {};
    permissionsResult.rows.forEach(p => {
      if (!byResource[p.resource]) byResource[p.resource] = [];
      byResource[p.resource].push(p);
    });
    
    Object.keys(byResource).sort().forEach(resource => {
      console.log(`  Resource: ${resource}`);
      byResource[resource].forEach(p => {
        console.log(`    - ${p.name.padEnd(30)} | ${p.description}`);
      });
    });
    console.log();

    // ============================================
    // 3. EXAMINE ROLE_PERMISSIONS TABLE
    // ============================================
    console.log('3. ROLE_PERMISSIONS TABLE DATA');
    console.log('-'.repeat(80));
    const rolePermissionsResult = await client.query(`
      SELECT r.name as role_name, p.name as permission_name, p.resource, p.action, rp.granted_at, rp.granted_by
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      ORDER BY r.hierarchy_level DESC, p.resource, p.action
    `);
    console.log('Role-Permission assignments found:', rolePermissionsResult.rows.length);
    console.log();
    
    // Group by role
    const byRole = {};
    rolePermissionsResult.rows.forEach(rp => {
      if (!byRole[rp.role_name]) byRole[rp.role_name] = [];
      byRole[rp.role_name].push(rp);
    });
    
    Object.keys(byRole).forEach(roleName => {
      console.log(`  Role: ${roleName}`);
      byRole[roleName].forEach(rp => {
        console.log(`    - ${rp.permission_name}`);
      });
    });
    console.log();

    // ============================================
    // 4. EXAMINE USER_ROLES TABLE
    // ============================================
    console.log('4. USER_ROLES TABLE DATA');
    console.log('-'.repeat(80));
    const userRolesResult = await client.query(`
      SELECT ur.user_id, r.name as role_name, r.hierarchy_level, ur.assigned_by, ur.assigned_at, ur.expires_at, ur.is_active
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      ORDER BY ur.user_id, r.hierarchy_level DESC
    `);
    console.log('User-Role assignments found:', userRolesResult.rows.length);
    console.log();
    
    // Group by user
    const byUser = {};
    userRolesResult.rows.forEach(ur => {
      if (!byUser[ur.user_id]) byUser[ur.user_id] = [];
      byUser[ur.user_id].push(ur);
    });
    
    Object.keys(byUser).forEach(userId => {
      console.log(`  User ID: ${userId}`);
      byUser[userId].forEach(ur => {
        console.log(`    - Role: ${ur.role_name.padEnd(15)} | Level: ${ur.hierarchy_level} | Active: ${ur.is_active} | Assigned: ${ur.assigned_at}`);
      });
    });
    console.log();

    // ============================================
    // 5. CHECK FOR SUPER_ADMIN ROLE AND PERMISSIONS
    // ============================================
    console.log('5. SUPER_ADMIN ROLE DETAILS');
    console.log('-'.repeat(80));
    const superAdminResult = await client.query(`
      SELECT r.id, r.name, r.description, r.hierarchy_level
      FROM roles r
      WHERE r.name = 'SUPER_ADMIN'
    `);
    
    if (superAdminResult.rows.length > 0) {
      const superAdmin = superAdminResult.rows[0];
      console.log(`Super Admin Role Found:`);
      console.log(`  ID: ${superAdmin.id}`);
      console.log(`  Name: ${superAdmin.name}`);
      console.log(`  Description: ${superAdmin.description}`);
      console.log(`  Hierarchy Level: ${superAdmin.hierarchy_level}`);
      console.log();

      // Get super_admin permissions
      const superAdminPermsResult = await client.query(`
        SELECT p.name, p.resource, p.action, p.description
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        ORDER BY p.resource, p.action
      `, [superAdmin.id]);
      
      console.log(`Super Admin Permissions (${superAdminPermsResult.rows.length}):`);
      superAdminPermsResult.rows.forEach(p => {
        console.log(`  - ${p.name.padEnd(30)} | ${p.description}`);
      });
      console.log();
    } else {
      console.log('SUPER_ADMIN role NOT found!');
      console.log();
    }

    // ============================================
    // 6. CHECK FOR test.superadmin@smarttech.com USER
    // ============================================
    console.log('6. TEST.SUPERADMIN@SMARTTECH.COM USER DETAILS');
    console.log('-'.repeat(80));
    const testUserResult = await client.query(`
      SELECT id, email, role, "createdAt"
      FROM users
      WHERE email = 'test.superadmin@smarttech.com'
    `);
    
    let userRBACRolesResult = null;
    let userPermsResult = null;
    let testUser = null;

    if (testUserResult.rows.length > 0) {
      testUser = testUserResult.rows[0];
      console.log(`Test User Found:`);
      console.log(`  ID: ${testUser.id}`);
      console.log(`  Email: ${testUser.email}`);
      console.log(`  Legacy Role: ${testUser.role}`);
      console.log(`  Created: ${testUser["createdAt"]}`);
      console.log();

      // Get user's RBAC roles
      userRBACRolesResult = await client.query(`
        SELECT r.id, r.name, r.hierarchy_level, ur.assigned_by, ur.assigned_at, ur.expires_at, ur.is_active
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
        ORDER BY r.hierarchy_level DESC
      `, [testUser.id]);
      
      console.log(`User's RBAC Roles (${userRBACRolesResult.rows.length}):`);
      if (userRBACRolesResult.rows.length > 0) {
        userRBACRolesResult.rows.forEach(ur => {
          console.log(`  - Role: ${ur.name.padEnd(15)} | Level: ${ur.hierarchy_level} | Active: ${ur.is_active}`);
        });
      } else {
        console.log('  No RBAC roles assigned to this user!');
      }
      console.log();

      // Get user's permissions
      userPermsResult = await client.query(`
        SELECT p.name, p.resource, p.action, p.description, r.name as role_name
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
          AND ur.is_active = TRUE
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ORDER BY r.hierarchy_level DESC, p.resource, p.action
      `, [testUser.id]);
      
      console.log(`User's Permissions (${userPermsResult.rows.length}):`);
      if (userPermsResult.rows.length > 0) {
        userPermsResult.rows.forEach(p => {
          console.log(`  - ${p.name.padEnd(30)} | Via: ${p.role_name}`);
        });
      } else {
        console.log('  No permissions found for this user!');
      }
      console.log();
    } else {
      console.log('test.superadmin@smarttech.com user NOT found!');
      console.log();
    }

    // ============================================
    // 7. CHECK FOR CART PERMISSIONS
    // ============================================
    console.log('7. CART PERMISSIONS DETAILS');
    console.log('-'.repeat(80));
    const cartPermsResult = await client.query(`
      SELECT id, name, resource, action, description
      FROM permissions
      WHERE resource = 'cart'
      ORDER BY action
    `);
    
    console.log(`Cart Permissions found: ${cartPermsResult.rows.length}`);
    cartPermsResult.rows.forEach(p => {
      console.log(`  - ${p.name.padEnd(30)} | ${p.description}`);
    });
    console.log();

    // ============================================
    // 8. CHECK WHICH ROLES HAVE CART PERMISSIONS
    // ============================================
    console.log('8. ROLES WITH CART PERMISSIONS');
    console.log('-'.repeat(80));
    const rolesWithCartPermsResult = await client.query(`
      SELECT r.name, r.hierarchy_level, p.name as permission_name
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.resource = 'cart'
      ORDER BY r.hierarchy_level DESC, p.action
    `);
    
    console.log(`Roles with cart permissions: ${rolesWithCartPermsResult.rows.length} assignments`);
    const cartPermsByRole = {};
    rolesWithCartPermsResult.rows.forEach(rp => {
      if (!cartPermsByRole[rp.name]) cartPermsByRole[rp.name] = [];
      cartPermsByRole[rp.name].push(rp.permission_name);
    });
    
    Object.keys(cartPermsByRole).forEach(roleName => {
      console.log(`  ${roleName}:`);
      cartPermsByRole[roleName].forEach(perm => {
        console.log(`    - ${perm}`);
      });
    });
    console.log();

    // ============================================
    // 9. CHECK FOR PERMISSION TO UPDATE ROLE PERMISSIONS
    // ============================================
    console.log('9. PERMISSION TO UPDATE ROLE PERMISSIONS');
    console.log('-'.repeat(80));
    
    // Check if there's a specific permission for updating role permissions
    const rolePermUpdateResult = await client.query(`
      SELECT id, name, resource, action, description
      FROM permissions
      WHERE name LIKE '%role%' OR name LIKE '%permission%'
      ORDER BY resource, action
    `);
    
    console.log(`Role/Permission-related permissions: ${rolePermUpdateResult.rows.length}`);
    rolePermUpdateResult.rows.forEach(p => {
      console.log(`  - ${p.name.padEnd(30)} | ${p.description}`);
    });
    console.log();

    // ============================================
    // 10. CHECK TABLE SCHEMA AND CONSTRAINTS
    // ============================================
    console.log('10. TABLE SCHEMA AND CONSTRAINTS');
    console.log('-'.repeat(80));
    
    // Check role_permissions table constraints
    const rolePermsConstraintsResult = await client.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
        AND tc.table_schema = cc.constraint_schema
      WHERE tc.table_name = 'role_permissions'
        AND tc.table_schema = 'public'
      ORDER BY tc.constraint_type, tc.constraint_name
    `);
    
    console.log('role_permissions table constraints:');
    rolePermsConstraintsResult.rows.forEach(c => {
      console.log(`  - ${c.constraint_type}: ${c.constraint_name} (${c.column_name || 'N/A'})`);
      if (c.check_clause) {
        console.log(`    CHECK: ${c.check_clause}`);
      }
    });
    console.log();

    // ============================================
    // 11. CHECK FOR TRIGGERS ON RBAC TABLES
    // ============================================
    console.log('11. TRIGGERS ON RBAC TABLES');
    console.log('-'.repeat(80));
    
    const triggersResult = await client.query(`
      SELECT
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('roles', 'permissions', 'role_permissions', 'user_roles')
        AND trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log(`Triggers found: ${triggersResult.rows.length}`);
    triggersResult.rows.forEach(t => {
      console.log(`  - ${t.trigger_name} | ${t.event_object_table}.${t.event_manipulation}`);
    });
    console.log();

    // ============================================
    // 12. CHECK FOR STORED FUNCTIONS
    // ============================================
    console.log('12. RBAC-RELATED STORED FUNCTIONS');
    console.log('-'.repeat(80));
    
    const functionsResult = await client.query(`
      SELECT
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND (
          p.proname LIKE '%permission%'
          OR p.proname LIKE '%role%'
          OR p.proname LIKE '%user%'
        )
      ORDER BY p.proname
    `);
    
    console.log(`Functions found: ${functionsResult.rows.length}`);
    functionsResult.rows.forEach(f => {
      console.log(`  - ${f.function_name}`);
    });
    console.log();

    // ============================================
    // 13. TEST PERMISSION CHECK FUNCTIONS
    // ============================================
    console.log('13. TEST PERMISSION CHECK FUNCTIONS');
    console.log('-'.repeat(80));
    
    // Test if user_has_permission function exists
    const hasPermissionFuncResult = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'user_has_permission'
      )
    `);
    
    if (hasPermissionFuncResult.rows[0].exists) {
      console.log('✓ user_has_permission function exists');
      
      // Test with the test user
      if (testUser) {
        const testUserId = testUser.id;
        
        // Test various permissions
        const testPerms = [
          'cart:read',
          'cart:write',
          'cart:delete',
          'cart:analytics',
          'user:read',
          'role:read',
          'role:update',
          'user:assign_role'
        ];
        
        console.log(`\nTesting permissions for user ${testUser.email}:`);
        for (const perm of testPerms) {
          const permCheckResult = await client.query(`
            SELECT user_has_permission($1, $2) as has_perm
          `, [testUserId, perm]);
          
          console.log(`  - ${perm.padEnd(30)} | ${permCheckResult.rows[0].has_perm ? 'GRANTED' : 'DENIED'}`);
        }
      }
    } else {
      console.log('✗ user_has_permission function does NOT exist');
    }
    console.log();

    // ============================================
    // 14. CHECK FOR ANY SPECIAL PERMISSION UPDATE LOGIC
    // ============================================
    console.log('14. CHECKING FOR SPECIAL PERMISSION UPDATE LOGIC');
    console.log('-'.repeat(80));
    
    // Look for any views or rules that might affect permission updates
    const viewsResult = await client.query(`
      SELECT
        table_name as view_name,
        view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND (table_name LIKE '%role%' OR table_name LIKE '%permission%')
    `);
    
    console.log(`Views found: ${viewsResult.rows.length}`);
    viewsResult.rows.forEach(v => {
      console.log(`  - ${v.view_name}`);
    });
    console.log();

    // ============================================
    // 15. CHECK FOR AUTHORIZATION MIDDLEWARE
    // ============================================
    console.log('15. CHECKING FOR AUTHORIZATION LOGIC IN CODE');
    console.log('-'.repeat(80));
    console.log('NOTE: This section requires examining the backend code.');
    console.log('Key files to check:');
    console.log('  - backend/middleware/auth.js');
    console.log('  - backend/controllers/rbacController.js (if exists)');
    console.log('  - backend/routes/rbacRoutes.js (if exists)');
    console.log();

    // ============================================
    // SUMMARY
    // ============================================
    console.log('='.repeat(80));
    console.log('INVESTIGATION SUMMARY');
    console.log('='.repeat(80));
    console.log();
    console.log('Key Findings:');
    console.log(`  - Total Roles: ${rolesResult.rows.length}`);
    console.log(`  - Total Permissions: ${permissionsResult.rows.length}`);
    console.log(`  - Role-Permission Assignments: ${rolePermissionsResult.rows.length}`);
    console.log(`  - User-Role Assignments: ${userRolesResult.rows.length}`);
    console.log();
    
    if (testUser) {
      console.log(`Test User Status:`);
      console.log(`  - Email: ${testUser.email}`);
      console.log(`  - Legacy Role: ${testUser.role}`);
      console.log(`  - RBAC Roles Assigned: ${userRBACRolesResult ? userRBACRolesResult.rows.length : 0}`);
      console.log(`  - Total Permissions: ${userPermsResult ? userPermsResult.rows.length : 0}`);
      console.log();
    }

    // ============================================
    // CRITICAL FINDINGS
    // ============================================
    console.log('='.repeat(80));
    console.log('CRITICAL FINDINGS');
    console.log('='.repeat(80));
    console.log();
    
    // Check if there's a permission for updating role permissions
    const roleUpdatePermResult = await client.query(`
      SELECT name, description
      FROM permissions
      WHERE name IN ('role:update', 'role:manage_permissions', 'permission:assign', 'permission:update')
    `);
    
    console.log('Permissions for updating role permissions:');
    if (roleUpdatePermResult.rows.length > 0) {
      roleUpdatePermResult.rows.forEach(p => {
        console.log(`  ✓ ${p.name}: ${p.description}`);
      });
    } else {
      console.log('  ✗ NO PERMISSION FOUND for updating role permissions!');
      console.log('  This is likely the root cause of the authorization issue.');
    }
    console.log();

    // Check if SUPER_ADMIN has role update permission
    if (superAdminResult.rows.length > 0) {
      const superAdminHasRoleUpdate = await client.query(`
        SELECT p.name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = $1
          AND p.name IN ('role:update', 'role:manage_permissions', 'permission:assign', 'permission:update')
      `, [superAdminResult.rows[0].id]);
      
      console.log('SUPER_ADMIN has permissions for updating role permissions:');
      if (superAdminHasRoleUpdate.rows.length > 0) {
        superAdminHasRoleUpdate.rows.forEach(p => {
          console.log(`  ✓ ${p.name}`);
        });
      } else {
        console.log('  ✗ SUPER_ADMIN does NOT have permission to update role permissions!');
        console.log('  This is likely the root cause of the authorization issue.');
      }
    }
    console.log();

  } catch (error) {
    console.error('Error during investigation:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

investigateRBAC().catch(console.error);
