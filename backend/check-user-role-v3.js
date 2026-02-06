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

    // Check RBAC roles from user_roles table with join to roles table
    try {
      const userRoles = await prisma.$queryRaw`
        SELECT ur.user_id, ur.role_id, r.name as role_name, r.hierarchy_level
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${user.id}
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND ur.is_active = true
      `;

      console.log('');
      console.log('RBAC Roles (user_roles + roles tables):');
      console.log('=========================================');
      if (userRoles.length === 0) {
        console.log('No active RBAC roles assigned');
      } else {
        userRoles.forEach(role => {
          console.log(`Role ID: ${role.role_id}, Name: ${role.role_name}, Level: ${role.hierarchy_level}`);
        });
      }
    } catch (error) {
      console.log('');
      console.log('RBAC Roles (user_roles + roles tables):');
      console.log('=========================================');
      console.log('Error querying RBAC roles:', error.message);
    }

  } catch (error) {
    console.error('Error checking user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
