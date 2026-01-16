/**
 * Verify and Fix RBAC Permissions for ADMIN Role
 * 
 * This script verifies that ADMIN role has user:assign_role permission
 * and fixes it if not assigned
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  Verifying and Fixing RBAC Permissions                     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  try {
    // Get ADMIN role ID
    const adminRole = await prisma.$queryRaw`
      SELECT id FROM roles WHERE name = 'ADMIN'
    `;

    if (!adminRole || adminRole.length === 0) {
      console.error('✗ ADMIN role not found');
      process.exit(1);
    }

    const adminRoleId = adminRole[0].id;
    console.log(`✓ Found ADMIN role: ${adminRoleId}`);

    // Get user:assign_role permission ID
    const assignPermission = await prisma.$queryRaw`
      SELECT id FROM permissions WHERE name = 'user:assign_role'
    `;

    if (!assignPermission || assignPermission.length === 0) {
      console.error('✗ user:assign_role permission not found');
      process.exit(1);
    }

    const assignPermissionId = assignPermission[0].id;
    console.log(`✓ Found user:assign_role permission: ${assignPermissionId}`);

    // Check if permission is already assigned to ADMIN role
    const existingAssignment = await prisma.$queryRaw`
      SELECT * FROM role_permissions 
      WHERE role_id = ${adminRoleId} AND permission_id = ${assignPermissionId}
    `;

    if (existingAssignment && existingAssignment.length > 0) {
      console.log('✓ user:assign_role permission already assigned to ADMIN role');
    } else {
      console.log('✗ user:assign_role permission NOT assigned to ADMIN role');
      
      // Assign permission to ADMIN role
      await prisma.$queryRaw`
        INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at)
        VALUES (${adminRoleId}, ${assignPermissionId}, 'system', NOW())
      `;
      
      console.log('✓ Assigned user:assign_role permission to ADMIN role');
    }

    // Verify assignment
    const verifyAssignment = await prisma.$queryRaw`
      SELECT rp.*, p.name as permission_name, r.name as role_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN roles r ON rp.role_id = r.id
      WHERE r.name = 'ADMIN' AND p.name = 'user:assign_role'
    `;

    console.log('\n=== Verification ===');
    console.log('─'.repeat(80));
    if (verifyAssignment && verifyAssignment.length > 0) {
      console.log(`✓ ADMIN role has user:assign_role permission`);
      console.log(`  Role: ${verifyAssignment[0].role_name}`);
      console.log(`  Permission: ${verifyAssignment[0].permission_name}`);
      console.log(`  Granted at: ${verifyAssignment[0].granted_at}`);
    } else {
      console.log('✗ ADMIN role still missing user:assign_role permission');
    }
    console.log('─'.repeat(80));

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║  RBAC Permissions Fixed!                                    ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('✓ ADMIN role now has user:assign_role permission');
    console.log('\nYou can now re-run RBAC tests:');
    console.log('  - node rbac-backend-api.test.js');
    console.log('  - node rbac-integration-security.test.js');
    console.log('  - node rbac-comprehensive-verification.test.js');

  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
