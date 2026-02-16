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
    const deletedRequests = await prisma.roleEscalationRequest.deleteMany({
      where: {
        userId: adminUser.id,
        status: 'PENDING'
      }
    });

    console.log(`Deleted ${deletedRequests.count} pending role escalation requests for admin user`);

    // Also check user_roles table for any issues
    const userRoles = await prisma.userRole.findMany({
      where: { userId: adminUser.id }
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
