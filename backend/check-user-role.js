const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'raselbepari88@gmail.com' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      console.log('User not found: raselbepari88@gmail.com');
      return;
    }

    console.log('User Role Information:');
    console.log('======================');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Role Type:', typeof user.role);
    console.log('Status:', user.status);
    console.log('Name:', `${user.firstName} ${user.lastName}`);
    console.log('');
    console.log('Role Analysis:');
    console.log('Is admin (lowercase)?', user.role === 'admin');
    console.log('Is ADMIN (uppercase)?', user.role === 'ADMIN');
    console.log('Is super_admin?', user.role === 'super_admin');
    console.log('Is SUPER_ADMIN?', user.role === 'SUPER_ADMIN');

    // Check RBAC roles
    const userRoles = await prisma.$queryRaw`
      SELECT ur.user_id, ur.role_name, rh.hierarchy_level
      FROM user_roles ur
      JOIN roles_hierarchy rh ON ur.role_name = rh.role_name
      WHERE ur.user_id = ${user.id}
    `;

    console.log('');
    console.log('RBAC Roles:');
    console.log('============');
    if (userRoles.length === 0) {
      console.log('No RBAC roles assigned');
    } else {
      userRoles.forEach(role => {
        console.log(`Role: ${role.role_name}, Level: ${role.hierarchy_level}`);
      });
    }

  } catch (error) {
    console.error('Error checking user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
