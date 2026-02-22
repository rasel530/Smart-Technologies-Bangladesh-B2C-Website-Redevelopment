/**
 * EMI Permissions Verification Script
 * 
 * This script verifies that EMI permissions are correctly configured:
 * 1. All EMI permissions exist (emi:read, emi:write, emi:update, emi:delete)
 * 2. Admin and super_admin roles have all EMI permissions
 * 3. Test user (test-superadmin-001) has access to EMI endpoints
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyEMIPermissions() {
  console.log('='.repeat(80));
  console.log('EMI PERMISSIONS VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log('');

  let allChecksPassed = true;

  try {
    // Check 1: Verify all EMI permissions exist
    console.log('CHECK 1: Verify all EMI permissions exist');
    console.log('-'.repeat(80));
    
    const requiredPermissions = ['emi:read', 'emi:write', 'emi:update', 'emi:delete'];
    const emiPermissions = await prisma.$queryRaw`
      SELECT name FROM permissions WHERE resource = 'emi' OR name LIKE 'emi:%'
    `;
    
    const existingPermissionNames = emiPermissions.map(p => p.name);
    let allPermissionsExist = true;
    
    requiredPermissions.forEach(perm => {
      if (existingPermissionNames.includes(perm)) {
        console.log(`   ✅ ${perm} exists`);
      } else {
        console.log(`   ❌ ${perm} MISSING`);
        allPermissionsExist = false;
        allChecksPassed = false;
      }
    });
    
    if (allPermissionsExist) {
      console.log('   ✅ ALL EMI PERMISSIONS EXIST');
    } else {
      console.log('   ❌ SOME EMI PERMISSIONS ARE MISSING');
    }
    console.log('');

    // Check 2: Verify admin role has all EMI permissions
    console.log('CHECK 2: Verify admin role has all EMI permissions');
    console.log('-'.repeat(80));
    
    const adminRole = await prisma.$queryRaw`
      SELECT id, name FROM roles WHERE name = 'admin'
    `;
    
    if (adminRole.length === 0) {
      console.log('   ❌ Admin role not found');
      allChecksPassed = false;
    } else {
      const adminPermissions = await prisma.$queryRaw`
        SELECT p.name 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ${adminRole[0].id}::uuid
          AND (p.resource = 'emi' OR p.name LIKE 'emi:%')
      `;
      
      const adminPermissionNames = adminPermissions.map(p => p.name);
      let adminHasAllPermissions = true;
      
      requiredPermissions.forEach(perm => {
        if (adminPermissionNames.includes(perm)) {
          console.log(`   ✅ admin has ${perm}`);
        } else {
          console.log(`   ❌ admin MISSING ${perm}`);
          adminHasAllPermissions = false;
          allChecksPassed = false;
        }
      });
      
      if (adminHasAllPermissions) {
        console.log('   ✅ ADMIN ROLE HAS ALL EMI PERMISSIONS');
      } else {
        console.log('   ❌ ADMIN ROLE MISSING SOME EMI PERMISSIONS');
      }
    }
    console.log('');

    // Check 3: Verify super_admin role has all EMI permissions
    console.log('CHECK 3: Verify super_admin role has all EMI permissions');
    console.log('-'.repeat(80));
    
    const superAdminRole = await prisma.$queryRaw`
      SELECT id, name FROM roles WHERE name = 'super_admin'
    `;
    
    if (superAdminRole.length === 0) {
      console.log('   ❌ Super_admin role not found');
      allChecksPassed = false;
    } else {
      const superAdminPermissions = await prisma.$queryRaw`
        SELECT p.name 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ${superAdminRole[0].id}::uuid
          AND (p.resource = 'emi' OR p.name LIKE 'emi:%')
      `;
      
      const superAdminPermissionNames = superAdminPermissions.map(p => p.name);
      let superAdminHasAllPermissions = true;
      
      requiredPermissions.forEach(perm => {
        if (superAdminPermissionNames.includes(perm)) {
          console.log(`   ✅ super_admin has ${perm}`);
        } else {
          console.log(`   ❌ super_admin MISSING ${perm}`);
          superAdminHasAllPermissions = false;
          allChecksPassed = false;
        }
      });
      
      if (superAdminHasAllPermissions) {
        console.log('   ✅ SUPER_ADMIN ROLE HAS ALL EMI PERMISSIONS');
      } else {
        console.log('   ❌ SUPER_ADMIN ROLE MISSING SOME EMI PERMISSIONS');
      }
    }
    console.log('');

    // Check 4: Verify test user has EMI access
    console.log('CHECK 4: Verify test user (test-superadmin-001) has EMI access');
    console.log('-'.repeat(80));
    
    const testUser = await prisma.$queryRaw`
      SELECT id, email, status FROM users WHERE id = 'test-superadmin-001'
    `;
    
    if (testUser.length === 0) {
      console.log('   ❌ Test user not found');
      allChecksPassed = false;
    } else {
      console.log(`   ✅ Test user found: ${testUser[0].email}`);
      console.log(`   ✅ User status: ${testUser[0].status}`);
      
      // Check if user has super_admin role
      const userRoles = await prisma.$queryRaw`
        SELECT r.name 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = 'test-superadmin-001' AND ur.is_active = true
      `;
      
      const roleNames = userRoles.map(r => r.name);
      console.log(`   ✅ User roles: ${roleNames.join(', ')}`);
      
      // Check if user has emi:read permission using the database function
      const hasPermission = await prisma.$queryRaw`
        SELECT user_has_permission('test-superadmin-001', 'emi:read') as has_permission
      `;
      
      if (hasPermission[0].has_permission) {
        console.log('   ✅ User has emi:read permission');
      } else {
        console.log('   ❌ User MISSING emi:read permission');
        allChecksPassed = false;
      }
    }
    console.log('');

    // Check 5: Verify EMI data exists
    console.log('CHECK 5: Verify EMI data exists in database');
    console.log('-'.repeat(80));
    
    const providerCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "EmiProvider"
    `;
    
    const planCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "EmiPlan"
    `;
    
    console.log(`   ✅ EMI Providers: ${providerCount[0].count}`);
    console.log(`   ✅ EMI Plans: ${planCount[0].count}`);
    
    if (providerCount[0].count > 0 && planCount[0].count > 0) {
      console.log('   ✅ EMI DATA EXISTS IN DATABASE');
    } else {
      console.log('   ❌ EMI DATA MISSING FROM DATABASE');
      allChecksPassed = false;
    }
    console.log('');

    // Final Summary
    console.log('='.repeat(80));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(80));
    
    if (allChecksPassed) {
      console.log('');
      console.log('✅ ✅ ✅  ALL CHECKS PASSED  ✅ ✅ ✅');
      console.log('');
      console.log('The EMI permissions are correctly configured!');
      console.log('The admin EMI page should now display data correctly.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Navigate to http://localhost:3000/admin/emi');
      console.log('2. Verify that all statistics are displaying:');
      console.log('   - Total Providers');
      console.log('   - Active Providers');
      console.log('   - Total Plans');
      console.log('   - Active Plans');
      console.log('   - Recent Providers');
      console.log('   - Recent Plans');
    } else {
      console.log('');
      console.log('❌ ❌ ❌  SOME CHECKS FAILED  ❌ ❌ ❌');
      console.log('');
      console.log('Please review the failed checks above and run the fix script:');
      console.log('  node backend/scripts/fix-emi-permissions.js');
    }
    
    console.log('');
    console.log('='.repeat(80));
    
    process.exit(allChecksPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEMIPermissions();
