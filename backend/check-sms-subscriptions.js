const { databaseService } = require('./services/database');
const prisma = databaseService.getClient();

(async () => {
  try {
    console.log('Checking database for SMS subscriptions...');
    console.log('='.repeat(80));
    
    // Check if the SmsSubscription table exists and has data
    const subscriptions = await prisma.smsSubscription.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Total SMS subscriptions found:', subscriptions.length);
    console.log('='.repeat(80));
    
    if (subscriptions.length === 0) {
      console.log('No SMS subscriptions found in the database.');
      console.log('This explains why the frontend shows 0 statistics.');
    } else {
      console.log('SMS Subscriptions:');
      subscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. ID: ${sub.id}`);
        console.log(`     User ID: ${sub.userId}`);
        console.log(`     Phone: ${sub.phoneNumber}`);
        console.log(`     Status: ${sub.status}`);
        console.log(`     Amount: ${sub.amount}`);
        console.log(`     Is Subscribed: ${sub.isSubscribed}`);
        console.log(`     Created: ${sub.createdAt}`);
        console.log('');
      });
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
