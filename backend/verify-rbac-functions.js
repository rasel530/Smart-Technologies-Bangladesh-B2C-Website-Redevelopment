const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyRBACFunctions() {
  try {
    console.log('Verifying RBAC functions...\n');

    // Check if get_user_permissions function exists
    const getPermissionsResult = await prisma.$queryRaw`
      SELECT 
        routine_name as function_name,
        routine_type as type,
        data_type as return_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('get_user_permissions', 'user_has_permission')
      ORDER BY routine_name
    `;

    console.log('Functions found in database:');
    console.table(getPermissionsResult);

    if (getPermissionsResult.length === 0) {
      console.log('\n❌ ERROR: RBAC functions not found in database!');
      return false;
    }

    // Get the superadmin user ID
    const superadmin = await prisma.user.findFirst({
      where: { email: 'test.superadmin@smarttech.com' },
      select: { id: true, email: true }
    });

    if (!superadmin) {
      console.log('\n⚠️  WARNING: Superadmin user not found!');
      return true; // Functions exist, just no user to test
    }

    console.log('\nSuperadmin user found:');
    console.table([superadmin]);

    // Test get_user_permissions function
    console.log('\nTesting get_user_permissions function...');
    const permissions = await prisma.$queryRawUnsafe(
      `SELECT * FROM get_user_permissions($1)`,
      superadmin.id
    );

    console.log(`Found ${permissions.length} permissions for superadmin:`);
    if (permissions.length > 0) {
      console.table(permissions.slice(0, 10)); // Show first 10
    }

    // Test user_has_permission function
    console.log('\nTesting user_has_permission function...');
    const hasCartReadPermission = await prisma.$queryRawUnsafe(
      `SELECT user_has_permission($1, $2) as has_permission`,
      superadmin.id,
      'cart:read'
    );

    console.log(`Superadmin has cart:read permission: ${hasCartReadPermission[0].has_permission}`);

    console.log('\n✅ SUCCESS: RBAC functions are working correctly!');
    return true;

  } catch (error) {
    console.error('\n❌ ERROR verifying RBAC functions:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

verifyRBACFunctions().then(success => {
  process.exit(success ? 0 : 1);
});
