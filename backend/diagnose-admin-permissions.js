/**
 * Admin Permission 403 Error Diagnosis Script
 * 
 * This script diagnoses the 403 Forbidden errors for admin endpoints
 * by checking:
 * 1. User's role and permissions
 * 2. Existence of required permissions in database
 * 3. Role-permission assignments
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_USER_ID = 'ea59bf47-4b66-431d-ba63-a0a69437798f';

async function diagnose() {
  console.log('='.repeat(80));
  console.log('ADMIN PERMISSION 403 ERROR DIAGNOSIS');
  console.log('='.repeat(80));
  console.log();

  // 1. Check user's role
  console.log('1. CHECKING USER ROLE');
  console.log('-'.repeat(80));
  try {
    const userRoles = await prisma.$queryRaw`
      SELECT 
        ur.id,
        ur.user_id,
        ur.role_id,
        ur.is_active,
        r.name as role_name,
        r.hierarchy_level
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${TARGET_USER_ID}
    `;
    
    console.log(`User ID: ${TARGET_USER_ID}`);
    if (userRoles.length === 0) {
      console.log('❌ NO ROLES FOUND - User has no assigned roles!');
    } else {
      console.log(`✅ Found ${userRoles.length} role(s):`);
      userRoles.forEach(role => {
        console.log(`   - ${role.role_name} (Level: ${role.hierarchy_level}, Active: ${role.is_active})`);
      });
    }
  } catch (error) {
    console.log(`❌ ERROR checking user role: ${error.message}`);
  }
  console.log();

  // 2. Check if required permissions exist
  console.log('2. CHECKING REQUIRED PERMISSIONS IN DATABASE');
  console.log('-'.repeat(80));
  const requiredPermissions = [
    'cod:read',
    'cod:write',
    'emi:read',
    'emi:write',
    'emi:delete'
  ];
  
  for (const permName of requiredPermissions) {
    try {
      const permission = await prisma.$queryRaw`
        SELECT * FROM permissions WHERE name = ${permName}
      `;
      
      if (permission.length === 0) {
        console.log(`❌ MISSING: ${permName} - Permission does not exist in database`);
      } else {
        console.log(`✅ EXISTS:  ${permName} - ID: ${permission[0].id}`);
      }
    } catch (error) {
      console.log(`❌ ERROR checking ${permName}: ${error.message}`);
    }
  }
  console.log();

  // 3. Check user's permissions
  console.log('3. CHECKING USER PERMISSIONS');
  console.log('-'.repeat(80));
  try {
    const userPermissions = await prisma.$queryRaw`
      SELECT * FROM get_user_permissions(${TARGET_USER_ID})
    `;
    
    if (userPermissions.length === 0) {
      console.log('❌ NO PERMISSIONS FOUND - User has no permissions!');
    } else {
      console.log(`✅ Found ${userPermissions.length} permission(s):`);
      userPermissions.forEach(perm => {
        console.log(`   - ${perm.permission_name} (Role: ${perm.role_name})`);
      });
    }
  } catch (error) {
    console.log(`❌ ERROR checking user permissions: ${error.message}`);
  }
  console.log();

  // 4. Check if user has specific admin permissions
  console.log('4. CHECKING SPECIFIC ADMIN PERMISSIONS');
  console.log('-'.repeat(80));
  for (const permName of requiredPermissions) {
    try {
      const result = await prisma.$queryRaw`
        SELECT user_has_permission(${TARGET_USER_ID}, ${permName}) as has_permission
      `;
      
      if (result[0].has_permission) {
        console.log(`✅ GRANTED: ${permName}`);
      } else {
        console.log(`❌ DENIED:  ${permName}`);
      }
    } catch (error) {
      console.log(`❌ ERROR checking ${permName}: ${error.message}`);
    }
  }
  console.log();

  // 5. Check ADMIN role permissions
  console.log('5. CHECKING ADMIN ROLE PERMISSIONS');
  console.log('-'.repeat(80));
  try {
    const adminRolePerms = await prisma.$queryRaw`
      SELECT 
        rp.role_id,
        r.name as role_name,
        p.name as permission_name
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'ADMIN'
      ORDER BY p.resource, p.action
    `;
    
    if (adminRolePerms.length === 0) {
      console.log('❌ NO PERMISSIONS FOUND for ADMIN role!');
    } else {
      console.log(`✅ ADMIN role has ${adminRolePerms.length} permission(s):`);
      adminRolePerms.forEach(perm => {
        console.log(`   - ${perm.permission_name}`);
      });
    }
  } catch (error) {
    console.log(`❌ ERROR checking ADMIN role permissions: ${error.message}`);
  }
  console.log();

  // 6. Summary and Diagnosis
  console.log('='.repeat(80));
  console.log('DIAGNOSIS SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  let missingPermissions = [];
  for (const permName of requiredPermissions) {
    try {
      const permission = await prisma.$queryRaw`
        SELECT * FROM permissions WHERE name = ${permName}
      `;
      if (permission.length === 0) {
        missingPermissions.push(permName);
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  if (missingPermissions.length > 0) {
    console.log('🔴 ROOT CAUSE IDENTIFIED:');
    console.log(`   The following permissions are MISSING from the database:`);
    missingPermissions.forEach(perm => {
      console.log(`   - ${perm}`);
    });
    console.log();
    console.log('   These permissions are required by the admin endpoints:');
    console.log('   - /api/v1/admin/cod/settings requires cod:read');
    console.log('   - /api/v1/admin/cod/settings (PUT) requires cod:write');
    console.log('   - /api/v1/admin/emi/* requires emi:read, emi:write, or emi:delete');
    console.log();
    console.log('   FIX REQUIRED:');
    console.log('   1. Add missing permissions to the permissions table');
    console.log('   2. Assign these permissions to the ADMIN role');
  } else {
    console.log('✅ All required permissions exist in the database');
    console.log();
    console.log('   If user still gets 403 errors, check:');
    console.log('   - User has ADMIN role assigned');
    console.log('   - User role is active (is_active = true)');
    console.log('   - User role has not expired (expires_at is NULL or in the future)');
  }
  
  console.log();
  console.log('='.repeat(80));
}

diagnose()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
