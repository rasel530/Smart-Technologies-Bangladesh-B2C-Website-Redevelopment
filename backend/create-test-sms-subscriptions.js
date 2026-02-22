/**
 * Create Test Active SMS Subscriptions
 * 
 * This script creates test SMS subscriptions to demonstrate the admin page functionality.
 * It creates:
 * - 2-3 active SMS subscriptions with different payment methods (bkash, nagad, rocket)
 * - 1 pending SMS subscription
 * - Different users and phone numbers
 * - Realistic amounts (100, 200, 300 BDT)
 */

const { databaseService } = require('./services/database');
const { localPaymentService } = require('./services/localPaymentService');
const prisma = databaseService.getClient();

// Test data for SMS subscriptions
const TEST_SUBSCRIPTIONS = [
  {
    // Active subscription with bKash
    status: 'active',
    paymentMethod: 'bkash',
    amount: 100,
    phoneNumber: '01712345678',
    userData: {
      firstName: 'Rahim',
      lastName: 'Ahmed',
      email: 'rahim.ahmed@example.com',
      phone: '01712345678'
    }
  },
  {
    // Active subscription with Nagad
    status: 'active',
    paymentMethod: 'nagad',
    amount: 200,
    phoneNumber: '01823456789',
    userData: {
      firstName: 'Fatima',
      lastName: 'Begum',
      email: 'fatima.begum@example.com',
      phone: '01823456789'
    }
  },
  {
    // Active subscription with Rocket
    status: 'active',
    paymentMethod: 'rocket',
    amount: 300,
    phoneNumber: '01634567890',
    userData: {
      firstName: 'Karim',
      lastName: 'Hossain',
      email: 'karim.hossain@example.com',
      phone: '01634567890'
    }
  },
  {
    // Pending subscription with bKash
    status: 'pending',
    paymentMethod: 'bkash',
    amount: 100,
    phoneNumber: '01945678901',
    userData: {
      firstName: 'Ayesha',
      lastName: 'Khan',
      email: 'ayesha.khan@example.com',
      phone: '01945678901'
    }
  }
];

/**
 * Create a test user if it doesn't exist
 */
async function createTestUser(userData) {
  try {
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`  User already exists: ${existingUser.id} (${userData.email})`);
      return existingUser;
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        password: '$2a$10$placeholder', // Placeholder password hash
        status: 'active',
        emailVerified: new Date() // DateTime value
      }
    });

    console.log(`  Created new user: ${newUser.id} (${userData.email})`);
    return newUser;
  } catch (error) {
    console.error(`  Error creating user: ${error.message}`);
    throw error;
  }
}

/**
 * Create SMS subscription with direct database insertion
 */
async function createSmsSubscriptionDirect(userId, subscriptionData) {
  try {
    // Check if user already has a subscription
    const existingSubscription = await prisma.smsSubscription.findUnique({
      where: { userId: userId }
    });

    const now = new Date();
    const nextPaymentAt = new Date(now);
    nextPaymentAt.setDate(nextPaymentAt.getDate() + 30);

    if (existingSubscription) {
      // Update existing subscription
      const subscription = await prisma.smsSubscription.update({
        where: { userId: userId },
        data: {
          phoneNumber: subscriptionData.phoneNumber,
          paymentMethod: subscriptionData.paymentMethod,
          isSubscribed: subscriptionData.status === 'active',
          amount: subscriptionData.amount,
          status: subscriptionData.status,
          lastPaymentAt: subscriptionData.status === 'active' ? now : null,
          nextPaymentAt: subscriptionData.status === 'active' ? nextPaymentAt : null
        }
      });

      console.log(`  Updated subscription: ${subscription.id} (${subscriptionData.status}, ${subscriptionData.paymentMethod}, ${subscriptionData.amount} BDT)`);
      return subscription;
    } else {
      // Create new subscription
      const subscription = await prisma.smsSubscription.create({
        data: {
          userId: userId,
          phoneNumber: subscriptionData.phoneNumber,
          paymentMethod: subscriptionData.paymentMethod,
          isSubscribed: subscriptionData.status === 'active',
          amount: subscriptionData.amount,
          status: subscriptionData.status,
          lastPaymentAt: subscriptionData.status === 'active' ? now : null,
          nextPaymentAt: subscriptionData.status === 'active' ? nextPaymentAt : null
        }
      });

      console.log(`  Created subscription: ${subscription.id} (${subscriptionData.status}, ${subscriptionData.paymentMethod}, ${subscriptionData.amount} BDT)`);
      return subscription;
    }
  } catch (error) {
    console.error(`  Error creating/updating subscription: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution function
 */
(async () => {
  try {
    console.log('='.repeat(80));
    console.log('Creating Test SMS Subscriptions');
    console.log('='.repeat(80));
    console.log('');

    // Step 1: Check existing subscriptions
    console.log('Step 1: Checking existing subscriptions...');
    const existingSubscriptions = await prisma.smsSubscription.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log(`  Found ${existingSubscriptions.length} existing subscription(s)`);
    console.log('');

    // Step 2: Create test subscriptions
    console.log('Step 2: Creating test subscriptions...');
    console.log('');

    const createdSubscriptions = [];
    const createdUsers = [];

    for (let i = 0; i < TEST_SUBSCRIPTIONS.length; i++) {
      const testData = TEST_SUBSCRIPTIONS[i];
      console.log(`Creating subscription ${i + 1}/${TEST_SUBSCRIPTIONS.length}:`);
      console.log(`  Payment Method: ${testData.paymentMethod}`);
      console.log(`  Status: ${testData.status}`);
      console.log(`  Amount: ${testData.amount} BDT`);
      console.log(`  Phone: ${testData.phoneNumber}`);

      // Create user
      const user = await createTestUser(testData.userData);
      createdUsers.push(user);

      // Create subscription
      const subscription = await createSmsSubscriptionDirect(user.id, testData);
      createdSubscriptions.push(subscription);

      console.log('');
    }

    // Step 3: Verify created subscriptions
    console.log('Step 3: Verifying created subscriptions...');
    console.log('');

    const allSubscriptions = await prisma.smsSubscription.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Fetch all users for the subscriptions
    const userIds = [...new Set(allSubscriptions.map(s => s.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });

    // Create a map for quick lookup
    const userMap = new Map(users.map(u => [u.id, u]));

    console.log(`Total subscriptions in database: ${allSubscriptions.length}`);
    console.log('');

    // Count by status
    const statusCounts = {
      active: allSubscriptions.filter(s => s.status === 'active').length,
      pending: allSubscriptions.filter(s => s.status === 'pending').length,
      cancelled: allSubscriptions.filter(s => s.status === 'cancelled').length,
      expired: allSubscriptions.filter(s => s.status === 'expired').length
    };

    console.log('Subscription Status Counts:');
    console.log(`  Active: ${statusCounts.active}`);
    console.log(`  Pending: ${statusCounts.pending}`);
    console.log(`  Cancelled: ${statusCounts.cancelled}`);
    console.log(`  Expired: ${statusCounts.expired}`);
    console.log('');

    // Calculate monthly revenue (active subscriptions * amount)
    const activeSubscriptions = allSubscriptions.filter(s => s.status === 'active');
    const monthlyRevenue = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);
    console.log(`Monthly Revenue: ${monthlyRevenue} BDT`);
    console.log('');

    // Display all subscriptions
    console.log('All Subscriptions:');
    console.log('='.repeat(80));
    allSubscriptions.forEach((sub, index) => {
      const user = userMap.get(sub.userId);
      console.log(`${index + 1}. Subscription ID: ${sub.id}`);
      console.log(`   User: ${user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Unknown'}`);
      console.log(`   Phone: ${sub.phoneNumber}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Payment Method: ${sub.paymentMethod}`);
      console.log(`   Amount: ${sub.amount} BDT`);
      console.log(`   Is Subscribed: ${sub.isSubscribed}`);
      console.log(`   Last Payment: ${sub.lastPaymentAt ? sub.lastPaymentAt.toISOString() : 'N/A'}`);
      console.log(`   Next Payment: ${sub.nextPaymentAt ? sub.nextPaymentAt.toISOString() : 'N/A'}`);
      console.log(`   Created: ${sub.createdAt.toISOString()}`);
      console.log('');
    });

    // Step 4: Summary
    console.log('='.repeat(80));
    console.log('Summary:');
    console.log('='.repeat(80));
    console.log(`Created ${createdSubscriptions.length} new test subscriptions`);
    console.log(`Created ${createdUsers.length} new test users`);
    console.log(`Total subscriptions in database: ${allSubscriptions.length}`);
    console.log('');
    console.log('Test Data Created:');
    createdSubscriptions.forEach((sub, index) => {
      const testData = TEST_SUBSCRIPTIONS[index];
      console.log(`  ${index + 1}. ${testData.status.toUpperCase()} - ${testData.paymentMethod} - ${testData.amount} BDT - ${testData.phoneNumber}`);
    });
    console.log('');
    console.log('Expected Statistics on Admin Page:');
    console.log(`  Active Count: ${statusCounts.active}`);
    console.log(`  Pending Count: ${statusCounts.pending}`);
    console.log(`  Monthly Revenue: ${monthlyRevenue} BDT`);
    console.log('');
    console.log('Search Test Data:');
    console.log('  Phone Numbers: ' + TEST_SUBSCRIPTIONS.map(s => s.phoneNumber).join(', '));
    console.log('  Names: ' + TEST_SUBSCRIPTIONS.map(s => `${s.userData.firstName} ${s.userData.lastName}`).join(', '));
    console.log('  Emails: ' + TEST_SUBSCRIPTIONS.map(s => s.userData.email).join(', '));
    console.log('');

    console.log('='.repeat(80));
    console.log('Test subscriptions created successfully!');
    console.log('You can now test the SMS subscriptions page at:');
    console.log('http://localhost:3000/admin/local-payment/subscriptions');
    console.log('='.repeat(80));

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
