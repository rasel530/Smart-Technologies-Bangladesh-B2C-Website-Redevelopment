/**
 * Fix checkout permissions by assigning them to uppercase roles
 * This script addresses the case-sensitivity issue where:
 * - Users have uppercase roles (ADMIN, SUPER_ADMIN, MANAGER)
 * - Permissions were assigned to lowercase roles (admin, super_admin)
 * - PostgreSQL string comparison is case-sensitive
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCheckoutPermissions() {
  console.log('Starting checkout permissions fix for uppercase roles...\n');

  try {
    // Define checkout permissions
    const checkoutPermissions = [
      { name: 'checkout:read', resource: 'checkout', action: 'read', description: 'View checkout sessions and analytics' },
      { name: 'checkout:write', resource: 'checkout', action: 'write', description: 'Manage checkout sessions and settings' },
      { name: 'checkout:edit', resource: 'checkout', action: 'edit', description: 'Edit checkout sessions and settings' },
      { name: 'checkout:delete', resource: 'checkout', action: 'delete', description: 'Delete checkout sessions' },
      { name: 'checkout:update', resource: 'checkout', action: 'update', description: 'Update checkout sessions and settings' }
    ];

    // Define uppercase roles to assign permissions to
    const uppercaseRoles = ['ADMIN', 'SUPER_ADMIN', 'MANAGER'];

    // Step 1: Ensure checkout permissions exist
    console.log('=== Step 1: Ensuring checkout permissions exist ===');
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

    // Step 2: Check which uppercase roles exist
    console.log('\n=== Step 2: Checking uppercase roles ===');
    const roleIds = {};
    for (const roleName of uppercaseRoles) {
      const role = await prisma.$queryRaw`
        SELECT id, name, hierarchy_level FROM roles WHERE name = ${roleName}
      `;

      if (role.length === 0) {
        console.log(`  ⚠ Role not found: ${roleName} (will skip)`);
      } else {
        roleIds[roleName] = role[0].id;
        console.log(`  ✓ Found role: ${roleName} (id: ${role[0].id}, level: ${role[0].hierarchy_level})`);
      }
    }

    if (Object.keys(roleIds).length === 0) {
      console.error('\n❌ ERROR: No uppercase roles found in database!');
      console.error('Available roles:');
      const allRoles = await prisma.$queryRaw`
        SELECT name FROM roles ORDER BY name
      `;
      console.table(allRoles);
      return;
    }

    // Step 3: Assign permissions to each uppercase role
    console.log('\n=== Step 3: Assigning permissions to uppercase roles ===');
    for (const roleName of Object.keys(roleIds)) {
      const roleId = roleIds[roleName];
      console.log(`\nProcessing role: ${roleName}`);

      for (const perm of checkoutPermissions) {
        // Get permission ID
        const permission = await prisma.$queryRaw`
          SELECT id FROM permissions WHERE name = ${perm.name}
        `;

        if (permission.length === 0) {
          console.log(`  ⚠ Permission not found: ${perm.name} (skipping)`);
          continue;
        }

        // Check if assignment already exists
        const existingAssignment = await prisma.$queryRaw`
          SELECT id FROM role_permissions 
          WHERE role_id::text = ${roleId}::text AND permission_id::text = ${permission[0].id}::text
        `;

        if (existingAssignment.length === 0) {
          await prisma.$queryRaw`
            INSERT INTO role_permissions (role_id, permission_id, granted_at, granted_by)
            VALUES (${roleId}::uuid, ${permission[0].id}::uuid, NOW(), 'system')
          `;
          console.log(`  ✓ Assigned ${perm.name} to ${roleName}`);
        } else {
          console.log(`  - ${perm.name} already assigned to ${roleName}`);
        }
      }
    }

    // Step 4: Verify the permissions were assigned correctly
    console.log('\n=== Step 4: Verification ===');
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

    console.log('\nAll checkout permissions in database:');
    console.table(result);

    // Show only uppercase roles
    console.log('\nCheckout permissions for uppercase roles:');
    const uppercaseResult = await prisma.$queryRaw`
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.resource,
        p.action
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.name LIKE 'checkout:%' 
        AND r.name IN ('ADMIN', 'SUPER_ADMIN', 'MANAGER')
      ORDER BY r.name, p.name
    `;
    console.table(uppercaseResult);

    // Count permissions per role
    console.log('\nPermission count per role:');
    const countResult = await prisma.$queryRaw`
      SELECT 
        r.name as role_name,
        COUNT(rp.permission_id) as permission_count
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.name LIKE 'checkout:%'
      GROUP BY r.name
      ORDER BY r.name
    `;
    console.table(countResult);

    console.log('\n✅ Checkout permissions fix completed successfully!');
    console.log('\nUsers with uppercase roles (ADMIN, SUPER_ADMIN, MANAGER) can now access all checkout pages:');
    console.log('  - Checkout Sessions');
    console.log('  - Abandoned Checkouts');
    console.log('  - Guest Checkout');
    console.log('  - Checkout Analytics');
    console.log('  - Checkout Settings');

  } catch (error) {
    console.error('\n❌ Error fixing checkout permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixCheckoutPermissions()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
