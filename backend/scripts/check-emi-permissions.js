/**
 * EMI Permissions Diagnostic Script
 * 
 * This script checks the current state of EMI permissions in the database
 * and identifies what needs to be fixed.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEMIPermissions() {
  console.log('='.repeat(80));
  console.log('EMI PERMISSIONS DIAGNOSTIC REPORT');
  console.log('='.repeat(80));
  console.log('');

  try {
    // 1. Check all EMI-related permissions
    console.log('1. CHECKING EMI PERMISSIONS IN DATABASE');
    console.log('-'.repeat(80));
    
    const emiPermissions = await prisma.$queryRaw`
      SELECT id, name, resource, action, description, created_at
      FROM permissions
      WHERE resource = 'emi' OR name LIKE 'emi:%'
      ORDER BY name
    `;
    
    if (emiPermissions.length === 0) {
      console.log('❌ NO EMI PERMISSIONS FOUND IN DATABASE');
      console.log('   The following permissions need to be created:');
      console.log('   - emi:read (Read EMI providers and plans)');
      console.log('   - emi:write (Create EMI providers and plans)');
      console.log('   - emi:update (Update EMI providers and plans)');
      console.log('   - emi:delete (Delete EMI providers and plans)');
    } else {
      console.log(`✅ FOUND ${emiPermissions.length} EMI PERMISSION(S):`);
      emiPermissions.forEach(p => {
        console.log(`   - ${p.name} (${p.resource}:${p.action})`);
        console.log(`     ID: ${p.id}`);
        console.log(`     Description: ${p.description || 'N/A'}`);
      });
    }
    console.log('');

    // 2. Check admin and super_admin roles
    console.log('2. CHECKING ADMIN ROLES');
    console.log('-'.repeat(80));
    
    const adminRoles = await prisma.$queryRaw`
      SELECT id, name, description, hierarchy_level
      FROM roles
      WHERE name IN ('admin', 'super_admin')
      ORDER BY hierarchy_level DESC
    `;
    
    if (adminRoles.length === 0) {
      console.log('❌ NO ADMIN ROLES FOUND');
    } else {
      console.log(`✅ FOUND ${adminRoles.length} ADMIN ROLE(S):`);
      adminRoles.forEach(r => {
        console.log(`   - ${r.name} (Level: ${r.hierarchy_level})`);
        console.log(`     ID: ${r.id}`);
      });
    }
    console.log('');

    // 3. Check role-permission mappings for EMI
    console.log('3. CHECKING ROLE-PERMISSION MAPPINGS FOR EMI');
    console.log('-'.repeat(80));
    
    const rolePermissions = await prisma.$queryRaw`
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        rp.granted_at
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE (r.name IN ('admin', 'super_admin') 
        AND (p.resource = 'emi' OR p.name LIKE 'emi:%'))
      ORDER BY r.hierarchy_level DESC, p.name
    `;
    
    if (rolePermissions.length === 0) {
      console.log('❌ NO EMI PERMISSIONS ASSIGNED TO ADMIN ROLES');
      console.log('   Admin and super_admin roles do not have any EMI permissions.');
    } else {
      console.log(`✅ FOUND ${rolePermissions.length} ROLE-PERMISSION MAPPING(S):`);
      rolePermissions.forEach(rp => {
        console.log(`   - ${rp.role_name} has ${rp.permission_name}`);
        console.log(`     Granted at: ${rp.granted_at}`);
      });
    }
    console.log('');

    // 4. Check test-superadmin-001 user
    console.log('4. CHECKING TEST SUPERADMIN USER');
    console.log('-'.repeat(80));
    
    const testUser = await prisma.$queryRaw`
      SELECT id, email, role, status
      FROM users
      WHERE id = 'test-superadmin-001'
    `;
    
    if (testUser.length === 0) {
      console.log('❌ TEST SUPERADMIN USER NOT FOUND');
    } else {
      console.log(`✅ FOUND TEST SUPERADMIN USER:`);
      console.log(`   - Email: ${testUser[0].email}`);
      console.log(`   - Legacy Role: ${testUser[0].role}`);
      console.log(`   - Status: ${testUser[0].status}`);
      
      // Check RBAC roles
      const userRoles = await prisma.$queryRaw`
        SELECT 
          r.name as role_name,
          r.hierarchy_level,
          ur.is_active,
          ur.expires_at
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = 'test-superadmin-001'
        ORDER BY r.hierarchy_level DESC
      `;
      
      console.log(`   - RBAC Roles: ${userRoles.map(ur => ur.role_name).join(', ') || 'None'}`);
    }
    console.log('');

    // 5. Summary and Recommendations
    console.log('5. SUMMARY AND RECOMMENDATIONS');
    console.log('-'.repeat(80));
    
    const missingPermissions = ['emi:read', 'emi:write', 'emi:update', 'emi:delete']
      .filter(p => !emiPermissions.find(ep => ep.name === p));
    
    if (missingPermissions.length > 0) {
      console.log('❌ MISSING PERMISSIONS:');
      missingPermissions.forEach(p => console.log(`   - ${p}`));
    }
    
    const rolesWithoutEMI = adminRoles
      .filter(r => !rolePermissions.find(rp => rp.role_name === r.name))
      .map(r => r.name);
    
    if (rolesWithoutEMI.length > 0) {
      console.log('❌ ROLES WITHOUT EMI PERMISSIONS:');
      rolesWithoutEMI.forEach(r => console.log(`   - ${r}`));
    }
    
    if (missingPermissions.length === 0 && rolesWithoutEMI.length === 0) {
      console.log('✅ ALL EMI PERMISSIONS ARE PROPERLY CONFIGURED');
      console.log('   The admin EMI page should work correctly.');
    } else {
      console.log('');
      console.log('🔧 RECOMMENDED ACTIONS:');
      if (missingPermissions.length > 0) {
        console.log('   1. Create missing EMI permissions');
      }
      if (rolesWithoutEMI.length > 0) {
        console.log('   2. Assign EMI permissions to admin and super_admin roles');
      }
      console.log('   3. Run the fix script: node backend/scripts/fix-emi-permissions.js');
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('DIAGNOSTIC COMPLETE');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkEMIPermissions();
