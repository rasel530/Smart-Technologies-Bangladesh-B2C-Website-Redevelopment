const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearRBACDenial() {
  try {
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@smarttech.com' }
    });

    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }

    console.log('Found admin user:', adminUser.id);

    // Find and delete any pending role escalation requests for this user
    // Table name is role_escalation_requests (snake_case)
    const deletedRequests = await prisma.role_escalation_requests.deleteMany({
      where: {
        user_id: adminUser.id,
        status: 'PENDING'
      }
    });

    console.log(`Deleted ${deletedRequests.count} pending role escalation requests for admin user`);

    // Also check user_roles table for any issues
    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: adminUser.id }
    });

    console.log('Current user roles:', userRoles);

    await prisma.$disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

clearRBACDenial();
