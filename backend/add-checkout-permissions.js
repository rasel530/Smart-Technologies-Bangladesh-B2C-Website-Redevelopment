/**
 * Add checkout permissions to the database
 * This script creates checkout permissions and assigns them to admin and super_admin roles
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCheckoutPermissions() {
  console.log('Starting checkout permissions setup...\n');

  try {
    // Define checkout permissions
    const checkoutPermissions = [
      { name: 'checkout:read', resource: 'checkout', action: 'read', description: 'View checkout sessions and analytics' },
      { name: 'checkout:write', resource: 'checkout', action: 'write', description: 'Manage checkout sessions and settings' },
      { name: 'checkout:edit', resource: 'checkout', action: 'edit', description: 'Edit checkout sessions and settings' },
      { name: 'checkout:delete', resource: 'checkout', action: 'delete', description: 'Delete checkout sessions' },
      { name: 'checkout:update', resource: 'checkout', action: 'update', description: 'Update checkout sessions and settings' }
    ];

    // Insert permissions
    console.log('Creating checkout permissions...');
    for (const perm of checkoutPermissions) {
      const existing = await prisma.$queryRaw`
        SELECT id FROM permissions WHERE name = ${perm.name}
      `;

      if (existing.length === 0) {
        await prisma.$queryRaw`
          INSERT INTO permissions (name, resource, action, description, created_at)
          VALUES (${perm.name}, ${perm.resource}, ${perm.action}, ${perm.description}, NOW())
        `;
        console.log(`  ✓ Created permission: ${perm.name}`);
      } else {
        console.log(`  - Permission already exists: ${perm.name}`);
      }
    }

    // Get role IDs
    const adminRole = await prisma.$queryRaw`
      SELECT id FROM roles WHERE name = 'admin'
    `;

    const superAdminRole = await prisma.$queryRaw`
      SELECT id FROM roles WHERE name = 'super_admin'
    `;

    if (adminRole.length === 0) {
      console.error('\n❌ ERROR: admin role not found in database!');
      return;
    }

    if (superAdminRole.length === 0) {
      console.error('\n❌ ERROR: super_admin role not found in database!');
      return;
    }

    const adminRoleId = adminRole[0].id;
    const superAdminRoleId = superAdminRole[0].id;

    // Assign permissions to admin role
    console.log('\nAssigning checkout permissions to admin role...');
    for (const perm of checkoutPermissions) {
      const permission = await prisma.$queryRaw`
        SELECT id FROM permissions WHERE name = ${perm.name}
      `;

      const existingAssignment = await prisma.$queryRaw`
        SELECT id FROM role_permissions 
        WHERE role_id::text = ${adminRoleId}::text AND permission_id::text = ${permission[0].id}::text
      `;

      if (existingAssignment.length === 0) {
        await prisma.$queryRaw`
          INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
          VALUES (${adminRoleId}::uuid, ${permission[0].id}::uuid, NOW(), 'system')
        `;
        console.log(`  ✓ Assigned ${perm.name} to admin`);
      } else {
        console.log(`  - ${perm.name} already assigned to admin`);
      }
    }

    // Assign permissions to super_admin role
    console.log('\nAssigning checkout permissions to super_admin role...');
    for (const perm of checkoutPermissions) {
      const permission = await prisma.$queryRaw`
        SELECT id FROM permissions WHERE name = ${perm.name}
      `;

      const existingAssignment = await prisma.$queryRaw`
        SELECT id FROM role_permissions 
        WHERE role_id::text = ${superAdminRoleId}::text AND permission_id::text = ${permission[0].id}::text
      `;

      if (existingAssignment.length === 0) {
        await prisma.$queryRaw`
          INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
          VALUES (${superAdminRoleId}::uuid, ${permission[0].id}::uuid, NOW(), 'system')
        `;
        console.log(`  ✓ Assigned ${perm.name} to super_admin`);
      } else {
        console.log(`  - ${perm.name} already assigned to super_admin`);
      }
    }

    // Verify the permissions were added
    console.log('\n--- Verification ---');
    const result = await prisma.$queryRaw`
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.resource,
        p.action,
        p.description,
        rp.granted_at
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.name LIKE 'checkout:%'
      ORDER BY r.name, p.name
    `;

    console.log('\nCheckout permissions assigned:');
    console.table(result);

    console.log('\n✅ Checkout permissions setup completed successfully!');
    console.log('\nAdmin and super_admin users can now access all checkout pages:');
    console.log('  - Checkout Sessions');
    console.log('  - Abandoned Checkouts');
    console.log('  - Guest Checkout');
    console.log('  - Checkout Analytics');
    console.log('  - Checkout Settings');

  } catch (error) {
    console.error('\n❌ Error adding checkout permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addCheckoutPermissions()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
