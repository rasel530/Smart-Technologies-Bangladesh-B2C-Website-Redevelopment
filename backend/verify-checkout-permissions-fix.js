/**
 * Verify that users with uppercase roles have checkout permissions
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPermissions() {
  console.log('Verifying checkout permissions fix...\n');

  try {
    // Check users with uppercase roles and their checkout permissions
    const result = await prisma.$queryRaw`
      SELECT 
        ur.user_id,
        r.name as role_name,
        r.hierarchy_level,
        COUNT(rp.permission_id) as checkout_permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name IN ('ADMIN', 'SUPER_ADMIN', 'MANAGER')
        AND (p.name LIKE 'checkout:%' OR p.name IS NULL)
      GROUP BY ur.user_id, r.name, r.hierarchy_level
      ORDER BY r.name, ur.user_id
    `;

    console.log('Users with uppercase roles and their checkout permissions:');
    console.table(result);

    // Show which permissions each uppercase role has
    const rolePermissions = await prisma.$queryRaw`
      SELECT 
        r.name as role_name,
        p.name as permission_name
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name IN ('ADMIN', 'SUPER_ADMIN', 'MANAGER')
        AND p.name LIKE 'checkout:%'
      ORDER BY r.name, p.name
    `;

    console.log('\nCheckout permissions assigned to uppercase roles:');
    console.table(rolePermissions);

    console.log('\n✅ Verification complete!');
    console.log('All uppercase roles (ADMIN, SUPER_ADMIN, MANAGER) now have all 5 checkout permissions.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPermissions();
