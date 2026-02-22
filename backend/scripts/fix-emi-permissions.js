/**
 * EMI Permissions Fix Script
 * 
 * This script fixes EMI permissions by:
 * 1. Creating missing EMI permissions (emi:update)
 * 2. Assigning all EMI permissions to admin and super_admin roles
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEMIPermissions() {
  console.log('='.repeat(80));
  console.log('EMI PERMISSIONS FIX SCRIPT');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Step 1: Create missing emi:update permission
    console.log('STEP 1: Creating missing EMI permissions');
    console.log('-'.repeat(80));
    
    // Check if emi:update exists
    const existingUpdatePermission = await prisma.$queryRaw`
      SELECT id FROM permissions WHERE name = 'emi:update'
    `;
    
    if (existingUpdatePermission.length === 0) {
      console.log('Creating emi:update permission...');
      
      await prisma.$queryRaw`
        INSERT INTO permissions (id, name, resource, action, description, created_at)
        VALUES (gen_random_uuid(), 'emi:update', 'emi', 'update', 'Update EMI providers and plans', NOW())
      `;
      
      console.log(`✅ Created emi:update permission`);
    } else {
      console.log('ℹ️  emi:update permission already exists');
    }
    console.log('');

    // Step 2: Get all EMI permissions
    console.log('STEP 2: Getting all EMI permissions');
    console.log('-'.repeat(80));
    
    const emiPermissions = await prisma.$queryRaw`
      SELECT id, name FROM permissions WHERE resource = 'emi' OR name LIKE 'emi:%'
    `;
    
    console.log(`Found ${emiPermissions.length} EMI permissions:`);
    emiPermissions.forEach(p => console.log(`   - ${p.name}`));
    console.log('');

    // Step 3: Get admin and super_admin roles
    console.log('STEP 3: Getting admin roles');
    console.log('-'.repeat(80));
    
    const adminRoles = await prisma.$queryRaw`
      SELECT id, name FROM roles WHERE name IN ('admin', 'super_admin')
    `;
    
    console.log(`Found ${adminRoles.length} admin roles:`);
    adminRoles.forEach(r => console.log(`   - ${r.name}`));
    console.log('');

    // Step 4: Assign EMI permissions to admin and super_admin roles
    console.log('STEP 4: Assigning EMI permissions to admin roles');
    console.log('-'.repeat(80));
    
    let assignmentsCreated = 0;
    let assignmentsAlreadyExist = 0;
    
    for (const role of adminRoles) {
      console.log(`\nProcessing role: ${role.name}`);
      
      for (const permission of emiPermissions) {
        // Check if this role-permission mapping already exists
        const existingMapping = await prisma.$queryRaw`
          SELECT id FROM role_permissions
          WHERE role_id = ${role.id}::uuid AND permission_id = ${permission.id}::uuid
        `;
        
        if (existingMapping.length === 0) {
          // Create the role-permission mapping
          await prisma.$queryRaw`
            INSERT INTO role_permissions (id, role_id, permission_id, granted_at, granted_by)
            VALUES (gen_random_uuid(), ${role.id}::uuid, ${permission.id}::uuid, NOW(), 'system')
          `;
          
          console.log(`   ✅ Assigned ${permission.name} to ${role.name}`);
          assignmentsCreated++;
        } else {
          console.log(`   ℹ️  ${permission.name} already assigned to ${role.name}`);
          assignmentsAlreadyExist++;
        }
      }
    }
    console.log('');
    
    // Step 5: Summary
    console.log('STEP 5: Summary');
    console.log('-'.repeat(80));
    console.log(`New assignments created: ${assignmentsCreated}`);
    console.log(`Assignments already existed: ${assignmentsAlreadyExist}`);
    console.log('');
    
    console.log('✅ EMI PERMISSIONS FIX COMPLETE');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run verification script: node backend/scripts/verify-emi-permissions.js');
    console.log('2. Test the admin EMI page at http://localhost:3000/admin/emi');
    console.log('3. Verify that all statistics are displaying correctly');
    console.log('');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixEMIPermissions();
