const { databaseService } = require('./services/database');
const prisma = databaseService.getClient();

(async () => {
  try {
    console.log('Checking SMS subscription and user details...');
    console.log('='.repeat(80));
    
    // Get the subscription
    const subscription = await prisma.smsSubscription.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!subscription) {
      console.log('No SMS subscriptions found.');
      await prisma.$disconnect();
      return;
    }
    
    console.log('Subscription found:');
    console.log(`  ID: ${subscription.id}`);
    console.log(`  User ID: ${subscription.userId}`);
    console.log(`  Phone: ${subscription.phoneNumber}`);
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Amount: ${subscription.amount}`);
    console.log(`  Is Subscribed: ${subscription.isSubscribed}`);
    console.log(`  Payment Method: ${subscription.paymentMethod}`);
    console.log(`  Last Payment At: ${subscription.lastPaymentAt}`);
    console.log(`  Next Payment At: ${subscription.nextPaymentAt}`);
    console.log('');
    
    console.log('='.repeat(80));
    console.log('Checking user details for userId:', subscription.userId);
    console.log('='.repeat(80));
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: subscription.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });
    
    if (!user) {
      console.log('User NOT found in the database!');
      console.log('This could cause issues with the frontend display.');
    } else {
      console.log('User found:');
      console.log(`  ID: ${user.id}`);
      console.log(`  First Name: ${user.firstName || '(null)'}`);
      console.log(`  Last Name: ${user.lastName || '(null)'}`);
      console.log(`  Email: ${user.email || '(null)'}`);
      console.log(`  Phone: ${user.phone || '(null)'}`);
    }
    
    console.log('='.repeat(80));
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
