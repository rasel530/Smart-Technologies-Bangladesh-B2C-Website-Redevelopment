const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkCurrentRoles() {
  console.log('\n=== CHECKING CURRENT USER ROLE ASSIGNMENTS ===\n');
  
  const query = `
    SELECT
      u.id,
      u.email,
      u.role as user_role,
      ur.role_id,
      r.name as role_name,
      r.hierarchy_level as role_level
    FROM users u
    LEFT JOIN "user_roles" ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.email LIKE 'test.%@smarttech.com'
    ORDER BY u.email;
  `;
  
  const result = await pool.query(query);
  
  console.log('Current Role Assignments:');
  console.log('─'.repeat(100));
  console.log('ID | Email'.padEnd(35) + ' | User Role'.padEnd(15) + ' | UserRole ID'.padEnd(12) + ' | Role Name'.padEnd(15) + ' | Level');
  console.log('─'.repeat(100));
  
  result.rows.forEach(row => {
    console.log(
      String(row.id).padEnd(2) + ' | ' +
      row.email.padEnd(30) + ' | ' +
      (row.user_role || 'NULL').padEnd(13) + ' | ' +
      String(row.role_id || 'NULL').padEnd(10) + ' | ' +
      (row.role_name || 'NULL').padEnd(13) + ' | ' +
      String(row.role_level || 'NULL')
    );
  });
  console.log('─'.repeat(100));
  
  return result.rows;
}

async function getRoleIds() {
  console.log('\n=== GETTING ROLE IDs ===\n');
  
  const query = `
    SELECT id, name, hierarchy_level
    FROM roles
    WHERE name IN ('CUSTOMER', 'ADMIN', 'SUPER_ADMIN')
    ORDER BY hierarchy_level DESC;
  `;
  
  const result = await pool.query(query);
  
  console.log('Available Roles:');
  console.log('─'.repeat(60));
  console.log('ID | Role Name'.padEnd(20) + ' | Level');
  console.log('─'.repeat(60));
  
  result.rows.forEach(row => {
    console.log(
      String(row.id).padEnd(2) + ' | ' +
      row.name.padEnd(15) + ' | ' +
      String(row.hierarchy_level)
    );
  });
  console.log('─'.repeat(60));
  
  return result.rows;
}

async function fixUserRole(userId, roleId, email) {
  console.log(`\n=== FIXING ROLE FOR ${email} ===\n`);
  
  // Check if user already has a role assignment
  const checkQuery = `
    SELECT * FROM "user_roles"
    WHERE user_id = $1;
  `;
  
  const checkResult = await pool.query(checkQuery, [userId]);
  
  if (checkResult.rows.length > 0) {
    // Update existing role
    const updateQuery = `
      UPDATE "user_roles"
      SET role_id = $1
      WHERE user_id = $2;
    `;
    
    await pool.query(updateQuery, [roleId, userId]);
    console.log(`✓ Updated role_id to ${roleId} for user_id ${userId}`);
  } else {
    // Insert new role assignment
    const insertQuery = `
      INSERT INTO "user_roles" (user_id, role_id, assigned_by, assigned_at)
      VALUES ($1, $2, 'SYSTEM', NOW());
    `;
    
    await pool.query(insertQuery, [userId, roleId]);
    console.log(`✓ Inserted role_id ${roleId} for user_id ${userId}`);
  }
}

async function main() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║           RBAC USER ROLE FIX - TEST USERS                                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    
    // Step 1: Check current role assignments
    const currentRoles = await checkCurrentRoles();
    
    // Step 2: Get role IDs
    const roles = await getRoleIds();
    
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role.id;
    });
    
    console.log('\nRole ID Mapping:');
    console.log('CUSTOMER:', roleMap['CUSTOMER']);
    console.log('ADMIN:', roleMap['ADMIN']);
    console.log('SUPER_ADMIN:', roleMap['SUPER_ADMIN']);
    
    // Step 3: Fix incorrect role assignments
    console.log('\n\n=== FIXING INCORRECT ROLE ASSIGNMENTS ===\n');
    
    for (const user of currentRoles) {
      let expectedRole;
      
      if (user.email === 'test.admin@smarttech.com') {
        expectedRole = 'ADMIN';
      } else if (user.email === 'test.superadmin@smarttech.com') {
        expectedRole = 'SUPER_ADMIN';
      } else if (user.email === 'test.customer@smarttech.com') {
        expectedRole = 'CUSTOMER';
      }
      
      if (expectedRole && user.role_name !== expectedRole) {
        console.log(`\n❌ INCORRECT: ${user.email}`);
        console.log(`   Current: ${user.role_name || 'NULL'}`);
        console.log(`   Expected: ${expectedRole}`);
        
        await fixUserRole(user.id, roleMap[expectedRole], user.email);
      } else if (expectedRole && user.role_name === expectedRole) {
        console.log(`\n✅ CORRECT: ${user.email} has role ${expectedRole}`);
      }
    }
    
    // Step 4: Verify the fixes
    console.log('\n\n=== VERIFYING FIXES ===\n');
    await checkCurrentRoles();
    
    // Step 5: Final verification
    console.log('\n\n=== FINAL VERIFICATION SUMMARY ===\n');
    const finalRoles = await pool.query(`
      SELECT
        u.email,
        r.name as role_name,
        r.hierarchy_level as level
      FROM users u
      LEFT JOIN "user_roles" ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email LIKE 'test.%@smarttech.com'
      ORDER BY r.hierarchy_level DESC;
    `);
    
    let allCorrect = true;
    finalRoles.rows.forEach(row => {
      let expectedRole;
      let expectedLevel;
      
      if (row.email === 'test.admin@smarttech.com') {
        expectedRole = 'ADMIN';
        expectedLevel = 80;
      } else if (row.email === 'test.superadmin@smarttech.com') {
        expectedRole = 'SUPER_ADMIN';
        expectedLevel = 100;
      } else if (row.email === 'test.customer@smarttech.com') {
        expectedRole = 'CUSTOMER';
        expectedLevel = 20;
      }
      
      if (row.role_name === expectedRole && row.level === expectedLevel) {
        console.log(`✅ ${row.email}: ${row.role_name} (Level ${row.level})`);
      } else {
        console.log(`❌ ${row.email}: ${row.role_name} (Level ${row.level}) - Expected ${expectedRole} (Level ${expectedLevel})`);
        allCorrect = false;
      }
    });
    
    console.log('\n' + '═'.repeat(80));
    if (allCorrect) {
      console.log('✅ ALL USER ROLES HAVE BEEN FIXED SUCCESSFULLY!');
    } else {
      console.log('❌ SOME USER ROLES ARE STILL INCORRECT!');
    }
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main();
