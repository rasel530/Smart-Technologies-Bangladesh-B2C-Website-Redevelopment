const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function verifyNotifications() {
  try {
    const total = await prisma.orderNotification.count();
    const failed = await prisma.orderNotification.count({ where: { status: 'failed' } });
    const delivered = await prisma.orderNotification.count({ where: { status: 'delivered' } });
    const pending = await prisma.orderNotification.count({ where: { status: 'pending' } });
    const sent = await prisma.orderNotification.count({ where: { status: 'sent' } });

    console.log('='.repeat(60));
    console.log('Notification Verification');
    console.log('='.repeat(60));
    console.log(`Total notifications: ${total}`);
    console.log(`Failed notifications: ${failed}`);
    console.log(`Delivered notifications: ${delivered}`);
    console.log(`Pending notifications: ${pending}`);
    console.log(`Sent notifications: ${sent}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNotifications();
