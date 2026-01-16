/**
 * RBAC Database State Diagnostic Script
 * Checks current state of RBAC tables, test users, and permissions
 */

const { Pool } = require('pg');

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'smart_ecommerce_dev',
  user: 'smart_dev',
  password: 'smart_dev_password_2024'
};

const pool = new Pool(DB_CONFIG);

async function checkDatabaseState() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  RBAC Database State Diagnostic                                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    await pool.connect();
    console.log('✓ Connected to database\n');

    // 1. Check RBAC tables exist
    console.log('=== 1. Checking RBAC Tables ===');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles', 'role_escalation_requests')
      ORDER BY table_name
    `;
    const tablesResult = await pool.query(tablesQuery);
    console.log(`Found ${tablesResult.rows.length} RBAC tables:`);
    tablesResult.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    console.log('');

    // 2. Check roles
    console.log('=== 2. Checking Roles ===');
    const rolesQuery = `SELECT id, name, hierarchy_level FROM roles ORDER BY hierarchy_level`;
    const rolesResult = await pool.query(rolesQuery);
    console.log(`Found ${rolesResult.rows.length} roles:`);
    rolesResult.rows.forEach(row => {
      console.log(`  ${row.name} (Level: ${row.hierarchy_level}, ID: ${row.id})`);
    });
    console.log('');

    // 3. Check permissions
    console.log('=== 3. Checking Permissions ===');
    const permsQuery = `SELECT COUNT(*) as count FROM permissions`;
    const permsResult = await pool.query(permsQuery);
    console.log(`Found ${permsResult.rows[0].count} permissions`);
    
    // Check for specific critical permissions
    const criticalPerms = ['user:assign_role', 'user:read', 'user:create', 'user:update', 'user:delete'];
    console.log('\nCritical permissions:');
    for (const permName of criticalPerms) {
      const permQuery = `SELECT id, name FROM permissions WHERE name = $1`;
      const permResult = await pool.query(permQuery, [permName]);
      if (permResult.rows.length > 0) {
        console.log(`  ✓ ${permName} (ID: ${permResult.rows[0].id})`);
      } else {
        console.log(`  ✗ ${permName} - MISSING`);
      }
    }
    console.log('');

    // 4. Check role-permission assignments
    console.log('=== 4. Checking Role-Permission Assignments ===');
    const rolePermsQuery = `
      SELECT r.name as role_name, p.name as permission_name
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name IN ('ADMIN', 'SUPER_ADMIN', 'CUSTOMER')
      ORDER BY r.name, p.name
    `;
    const rolePermsResult = await pool.query(rolePermsQuery);
    
    // Group by role
    const rolePerms = {};
    rolePermsResult.rows.forEach(row => {
      if (!rolePerms[row.role_name]) {
        rolePerms[row.role_name] = [];
      }
      rolePerms[row.role_name].push(row.permission_name);
    });

    for (const roleName of Object.keys(rolePerms)) {
      console.log(`\n${roleName} has ${rolePerms[roleName].length} permissions:`);
      rolePerms[roleName].forEach(perm => console.log(`  - ${perm}`));
      
      // Check if admin has user:assign_role
      if (roleName === 'ADMIN' && rolePerms[roleName].includes('user:assign_role')) {
        console.log('  ✓ ADMIN has user:assign_role permission');
      } else if (roleName === 'ADMIN') {
        console.log('  ✗ ADMIN MISSING user:assign_role permission');
      }
    }
    console.log('');

    // 5. Check test users
    console.log('=== 5. Checking Test Users ===');
    const testEmails = [
      'test.customer@smarttech.com',
      'test.admin@smarttech.com',
      'test.superadmin@smarttech.com'
    ];

    for (const email of testEmails) {
      const userQuery = `SELECT id, email FROM users WHERE email = $1`;
      const userResult = await pool.query(userQuery, [email]);
      
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        console.log(`\n✓ ${email} (ID: ${userId})`);
        
        // Get user roles
        const userRolesQuery = `
          SELECT r.id, r.name, r.hierarchy_level, ur.is_active
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1
        `;
        const userRolesResult = await pool.query(userRolesQuery, [userId]);
        
        if (userRolesResult.rows.length > 0) {
          console.log(`  Roles assigned:`);
          userRolesResult.rows.forEach(role => {
            console.log(`    - ${role.name} (Level: ${role.hierarchy_level}, Active: ${role.is_active})`);
          });
        } else {
          console.log(`  ✗ No roles assigned`);
        }
      } else {
        console.log(`\n✗ ${email} - NOT FOUND in database`);
      }
    }
    console.log('');

    // 6. Check user_roles table
    console.log('=== 6. Checking User Roles Table ===');
    const userRolesCountQuery = `SELECT COUNT(*) as count FROM user_roles`;
    const userRolesCountResult = await pool.query(userRolesCountQuery);
    console.log(`Total user-role assignments: ${userRolesCountResult.rows[0].count}`);
    
    const allUserRolesQuery = `
      SELECT u.email, r.name as role_name, ur.is_active
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      ORDER BY u.email, r.hierarchy_level DESC
    `;
    const allUserRolesResult = await pool.query(allUserRolesQuery);
    console.log('\nAll user-role assignments:');
    allUserRolesResult.rows.forEach(row => {
      console.log(`  ${row.email} -> ${row.role_name} (Active: ${row.is_active})`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
    console.log('\n✓ Database connection closed');
  }
}

checkDatabaseState();
