/**
 * Admin Permission Fix Script
 * 
 * This script fixes the 403 Forbidden errors for admin endpoints by:
 * 1. Adding missing COD and EMI permissions to the permissions table
 * 2. Assigning these permissions to the ADMIN role
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPermissions() {
  console.log('='.repeat(80));
  console.log('ADMIN PERMISSION FIX - Adding COD and EMI Permissions');
  console.log('='.repeat(80));
  console.log();

  // Define missing permissions
  const missingPermissions = [
    {
      name: 'cod:read',
      resource: 'cod',
      action: 'read',
      description: 'View COD (Cash on Delivery) settings and configuration'
    },
    {
      name: 'cod:write',
      resource: 'cod',
      action: 'write',
      description: 'Update COD (Cash on Delivery) settings and configuration'
    },
    {
      name: 'emi:read',
      resource: 'emi',
      action: 'read',
      description: 'View EMI (Equated Monthly Installment) providers and plans'
    },
    {
      name: 'emi:write',
      resource: 'emi',
      action: 'write',
      description: 'Create and update EMI providers and plans'
    },
    {
      name: 'emi:delete',
      resource: 'emi',
      action: 'delete',
      description: 'Delete EMI providers and plans'
    }
  ];

  let addedPermissions = [];
  let skippedPermissions = [];

  // Step 1: Add missing permissions
  console.log('STEP 1: Adding missing permissions to database');
  console.log('-'.repeat(80));
  
  for (const perm of missingPermissions) {
    try {
      // Check if permission already exists
      const existing = await prisma.$queryRaw`
        SELECT id FROM permissions WHERE name = ${perm.name}
      `;
      
      if (existing.length > 0) {
        console.log(`⏭️  SKIPPED: ${perm.name} - Already exists`);
        skippedPermissions.push(perm.name);
        continue;
      }
      
      // Insert the permission
      await prisma.$queryRaw`
        INSERT INTO permissions (name, resource, action, description)
        VALUES (${perm.name}, ${perm.resource}, ${perm.action}, ${perm.description})
      `;
      
      console.log(`✅ ADDED:   ${perm.name} - ${perm.description}`);
      addedPermissions.push(perm.name);
    } catch (error) {
      console.log(`❌ ERROR:   ${perm.name} - ${error.message}`);
    }
  }
  
  console.log();
  console.log(`Summary: ${addedPermissions.length} added, ${skippedPermissions.length} skipped`);
  console.log();

  // Step 2: Get ADMIN and SUPER_ADMIN role IDs
  console.log('STEP 2: Getting ADMIN and SUPER_ADMIN role IDs');
  console.log('-'.repeat(80));
  
  const rolesToAssign = ['ADMIN', 'SUPER_ADMIN'];
  
  for (const roleName of rolesToAssign) {
    try {
      const role = await prisma.$queryRaw`
        SELECT id, name FROM roles WHERE name = ${roleName}
      `;
      
      if (role.length === 0) {
        console.log(`❌ ERROR: ${roleName} role not found!`);
        continue;
      }
      
      console.log(`✅ Found ${roleName} role: ${role[0].name} (ID: ${role[0].id})`);
    } catch (error) {
      console.log(`❌ ERROR getting ${roleName} role: ${error.message}`);
    }
  }
  console.log();

  // Step 3: Assign permissions to ADMIN and SUPER_ADMIN roles
  console.log('STEP 3: Assigning permissions to ADMIN and SUPER_ADMIN roles');
  console.log('-'.repeat(80));
  
  let assignedPermissions = [];
  let alreadyAssignedPermissions = [];
  
  for (const roleName of rolesToAssign) {
    for (const permName of missingPermissions.map(p => p.name)) {
      try {
        // Check if permission is already assigned to the role
        const existingAssignment = await prisma.$queryRaw`
          SELECT rp.id 
          FROM role_permissions rp
          JOIN roles r ON rp.role_id = r.id
          JOIN permissions p ON rp.permission_id = p.id
          WHERE r.name = ${roleName} AND p.name = ${permName}
        `;
        
        if (existingAssignment.length > 0) {
          console.log(`⏭️  SKIPPED: ${permName} - Already assigned to ${roleName}`);
          alreadyAssignedPermissions.push(`${permName} (${roleName})`);
          continue;
        }
        
        // Assign permission to the role
        await prisma.$queryRaw`
          INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at)
          SELECT 
            (SELECT id FROM roles WHERE name = ${roleName}),
            id,
            'fix-admin-permissions.js',
            NOW()
          FROM permissions
          WHERE name = ${permName}
        `;
        
        console.log(`✅ ASSIGNED: ${permName} - Assigned to ${roleName} role`);
        assignedPermissions.push(`${permName} (${roleName})`);
      } catch (error) {
        console.log(`❌ ERROR:   ${permName} (${roleName}) - ${error.message}`);
      }
    }
  }
  
  console.log();
  console.log(`Summary: ${assignedPermissions.length} assigned, ${alreadyAssignedPermissions.length} already assigned`);
  console.log();

  // Step 4: Verify the fix
  console.log('STEP 4: Verifying the fix');
  console.log('-'.repeat(80));
  
  const testUserId = 'ea59bf47-4b66-431d-ba63-a0a69437798f';
  const requiredPermissions = ['cod:read', 'cod:write', 'emi:read', 'emi:write', 'emi:delete'];
  
  console.log(`Testing user: ${testUserId}`);
  console.log();
  
  let allGranted = true;
  for (const permName of requiredPermissions) {
    try {
      const result = await prisma.$queryRaw`
        SELECT user_has_permission(${testUserId}, ${permName}) as has_permission
      `;
      
      if (result[0].has_permission) {
        console.log(`✅ GRANTED: ${permName}`);
      } else {
        console.log(`❌ DENIED:  ${permName}`);
        allGranted = false;
      }
    } catch (error) {
      console.log(`❌ ERROR:   ${permName} - ${error.message}`);
      allGranted = false;
    }
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log('FIX SUMMARY');
  console.log('='.repeat(80));
  console.log();
  
  if (allGranted) {
    console.log('✅ SUCCESS: All required permissions are now granted to the user!');
    console.log();
    console.log('The admin endpoints should now work:');
    console.log('  - GET  /api/v1/admin/cod/settings');
    console.log('  - PUT  /api/v1/admin/cod/settings');
    console.log('  - GET  /api/v1/admin/cod/configuration');
    console.log('  - GET  /api/v1/admin/emi/providers');
    console.log('  - POST /api/v1/admin/emi/providers');
    console.log('  - PUT  /api/v1/admin/emi/providers/:id');
    console.log('  - DELETE /api/v1/admin/emi/providers/:id');
    console.log('  - GET  /api/v1/admin/emi/plans');
    console.log('  - POST /api/v1/admin/emi/plans');
    console.log('  - PUT  /api/v1/admin/emi/plans/:id');
    console.log('  - DELETE /api/v1/admin/emi/plans/:id');
  } else {
    console.log('❌ PARTIAL SUCCESS: Some permissions are still missing or not assigned');
    console.log();
    console.log('Please check the errors above and run the script again.');
  }
  
  console.log();
  console.log('='.repeat(80));
}

fixPermissions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
