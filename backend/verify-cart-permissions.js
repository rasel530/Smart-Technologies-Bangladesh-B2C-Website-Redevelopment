const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyCartPermissions() {
  try {
    console.log('=== Verifying Cart Permissions ===\n');

    // Check if cart permissions exist
    const cartPermissions = await prisma.$queryRaw`
      SELECT * FROM permissions 
      WHERE name LIKE 'cart:%' 
      ORDER BY name
    `;

    console.log('Cart Permissions:');
    console.table(cartPermissions);

    // Check if permissions were assigned to roles
    const rolePermissions = await prisma.$queryRaw`
      SELECT r.name as role, p.name as permission
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.name LIKE 'cart:%'
      ORDER BY r.name, p.name
    `;

    console.log('\nRole-Permission Assignments:');
    console.table(rolePermissions);

    // Check if super_admin user has cart:read permission
    const superAdminPermission = await prisma.$queryRaw`
      SELECT 
        u.email,
        u.role as user_role,
        r.name as rbac_role,
        p.name as permission
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = 'test.superadmin@smarttech.com'
        AND p.name = 'cart:read'
    `;

    console.log('\nSuper Admin cart:read Permission Check:');
    console.table(superAdminPermission);

    console.log('\n=== Verification Complete ===');
  } catch (error) {
    console.error('Error verifying cart permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCartPermissions();
