const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function insertSampleData() {
  console.log('=== Inserting Sample Data ===\n');

  try {
    // 1. Create EMI Providers
    console.log('Creating EMI Providers...');
    const providers = await prisma.emiProvider.createMany({
      data: [
        {
          name: 'City Bank EMI',
          logoUrl: 'https://example.com/logos/citybank.png',
          website: 'https://citybank.com',
          isActive: true,
          minAmount: 5000,
          maxAmount: 500000,
          processingFee: 0,
          interestRate: 0,
        },
        {
          name: 'Brac Bank EMI',
          logoUrl: 'https://example.com/logos/bracbank.png',
          website: 'https://bracbank.com',
          isActive: true,
          minAmount: 10000,
          maxAmount: 1000000,
          processingFee: 1.5,
          interestRate: 12.5,
        },
        {
          name: 'Dutch-Bangla Bank EMI',
          logoUrl: 'https://example.com/logos/dbbl.png',
          website: 'https://dbbl.com',
          isActive: true,
          minAmount: 3000,
          maxAmount: 300000,
          processingFee: 0,
          interestRate: 0,
        },
      ],
    });
    console.log(`  ✓ Created ${providers.count} EMI providers`);

    // Get the providers to create plans
    const allProviders = await prisma.emiProvider.findMany();

    // 2. Create EMI Plans for each provider
    console.log('\nCreating EMI Plans...');
    const planData = [];
    allProviders.forEach((provider, index) => {
      const durations = [3, 6, 9, 12];
      durations.forEach((duration, i) => {
        planData.push({
          providerId: provider.id,
          name: `${duration} Months EMI`,
          duration: duration,
          interestRate: provider.interestRate,
          minAmount: provider.minAmount,
          maxAmount: provider.maxAmount,
          processingFee: provider.processingFee,
          downPayment: 0,
          isActive: true,
          displayOrder: i + 1,
        });
      });
    });

    const plans = await prisma.emiPlan.createMany({
      data: planData,
    });
    console.log(`  ✓ Created ${plans.count} EMI plans`);

    // 3. Create COD Settings
    console.log('\nCreating COD Settings...');
    const codSettings = await prisma.codSettings.create({
      data: {
        is_enabled: true,
        min_amount: 100,
        max_amount: 50000,
        available_divisions: ['dhaka', 'chittagong', 'khulna', 'rajshahi', 'sylhet', 'barishal', 'rangpur', 'mymensingh'],
        unavailable_divisions: [],
        additional_fee: 50,
        free_above_amount: 2000,
        require_phone_verification: true,
        require_address_verification: false,
        max_daily_orders: 5,
        max_weekly_orders: 10,
        delivery_days: 3,
        notes: 'Cash on delivery available for all major divisions',
        updated_at: new Date(),
      },
    });
    console.log(`  ✓ Created COD settings`);

    // 4. Create Local Payment Methods
    console.log('\nCreating Local Payment Methods...');
    const existingMethods = await prisma.localPaymentMethod.findMany();
    const existingCodes = existingMethods.map(m => m.code);

    const paymentMethodData = [
      {
        name: 'bKash',
        code: 'bkash',
        displayName: 'bKash Payment',
        logoUrl: 'https://example.com/logos/bkash.png',
        isActive: true,
        minAmount: 10,
        maxAmount: 200000,
        processingFee: 0,
        processingFeePercent: 0,
        requiresPhone: true,
        requiresPin: false,
        description: 'Pay with bKash mobile financial service',
        instructions: 'Enter your bKash number and follow the payment instructions',
        supportedNetworks: ['bKash'],
      },
      {
        name: 'Nagad',
        code: 'nagad',
        displayName: 'Nagad Payment',
        logoUrl: 'https://example.com/logos/nagad.png',
        isActive: true,
        minAmount: 10,
        maxAmount: 200000,
        processingFee: 0,
        processingFeePercent: 0,
        requiresPhone: true,
        requiresPin: false,
        description: 'Pay with Nagad mobile financial service',
        instructions: 'Enter your Nagad number and follow the payment instructions',
        supportedNetworks: ['Nagad'],
      },
      {
        name: 'Rocket',
        code: 'rocket',
        displayName: 'Rocket Payment',
        logoUrl: 'https://example.com/logos/rocket.png',
        isActive: true,
        minAmount: 10,
        maxAmount: 200000,
        processingFee: 0,
        processingFeePercent: 0,
        requiresPhone: true,
        requiresPin: false,
        description: 'Pay with Dutch-Bangla Bank Rocket',
        instructions: 'Enter your Rocket number and follow the payment instructions',
        supportedNetworks: ['Rocket'],
      },
      {
        name: 'SureCash',
        code: 'surecash',
        displayName: 'SureCash Payment',
        logoUrl: 'https://example.com/logos/surecash.png',
        isActive: true,
        minAmount: 10,
        maxAmount: 100000,
        processingFee: 0,
        processingFeePercent: 0,
        requiresPhone: true,
        requiresPin: false,
        description: 'Pay with SureCash mobile financial service',
        instructions: 'Enter your SureCash number and follow the payment instructions',
        supportedNetworks: ['SureCash'],
      },
    ];

    const newMethods = paymentMethodData.filter(m => !existingCodes.includes(m.code));
    let paymentMethods;
    if (newMethods.length > 0) {
      paymentMethods = await prisma.localPaymentMethod.createMany({
        data: newMethods,
      });
      console.log(`  ✓ Created ${paymentMethods.count} new local payment methods`);
    } else {
      console.log(`  ✓ All local payment methods already exist (${existingMethods.length} total)`);
    }

    // 5. Get a test user to create SMS subscription
    console.log('\nFinding a test user for SMS subscription...');
    const testUser = await prisma.user.findFirst({
      where: {
        email: {
          contains: '@',
        },
      },
    });

    if (testUser) {
      console.log(`  ✓ Found test user: ${testUser.email}`);

      // 6. Create SMS Subscription
      console.log('\nCreating SMS Subscription...');
      const smsSubscription = await prisma.smsSubscription.create({
        data: {
          userId: testUser.id,
          phoneNumber: '+8801700000000',
          paymentMethod: 'bkash',
          isSubscribed: true,
          transactionId: 'TXN' + Date.now(),
          lastPaymentAt: new Date(),
          nextPaymentAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          amount: 100,
          status: 'active',
        },
      });
      console.log(`  ✓ Created SMS subscription for user ${testUser.email}`);

      // 7. Create Cart SMS Subscription
      console.log('\nCreating Cart SMS Subscription...');
      const cartSmsSubscription = await prisma.cartSmsSubscription.create({
        data: {
          userId: testUser.id,
          phoneNumber: '+8801700000000',
          events: ['cart_abandoned', 'cart_recovered', 'order_placed'],
          isActive: true,
        },
      });
      console.log(`  ✓ Created Cart SMS subscription for user ${testUser.email}`);

      // 8. Create Cart for the user if not exists
      console.log('\nCreating Cart...');
      let cart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            userId: testUser.id,
            sessionId: 'session_' + Date.now(),
            status: 'active',
          },
        });
        console.log(`  ✓ Created new cart for user ${testUser.email}`);
      } else {
        console.log(`  ✓ Using existing cart for user ${testUser.email}`);
      }

      // 9. Create Cart Offline Sync
      console.log('\nCreating Cart Offline Sync...');
      const cartOfflineSync = await prisma.cartOfflineSync.create({
        data: {
          userId: testUser.id,
          cartId: cart.id,
          deviceId: 'device_' + Date.now(),
          lastSyncAt: new Date(),
          version: 1,
          syncedItemsCount: 0,
          conflictsResolved: 0,
          syncStatus: 'idle',
        },
      });
      console.log(`  ✓ Created Cart Offline Sync for user ${testUser.email}`);

      // 10. Create Cart SMS Log
      console.log('\nCreating Cart SMS Log...');
      const cartSmsLog = await prisma.cartSmsLog.create({
        data: {
          userId: testUser.id,
          subscriptionId: cartSmsSubscription.id,
          eventType: 'cart_abandoned',
          phoneNumber: '+8801700000000',
          messageId: 'MSG' + Date.now(),
          status: 'sent',
          sentAt: new Date(),
        },
      });
      console.log(`  ✓ Created Cart SMS Log for user ${testUser.email}`);

    } else {
      console.log('  ⚠ No test user found. Skipping user-related sample data.');
    }

    console.log('\n=== Sample Data Insertion Complete ===');
    console.log('Summary:');
    console.log('  - EMI Providers: 3');
    console.log('  - EMI Plans: 12 (4 per provider)');
    console.log('  - COD Settings: 1');
    console.log('  - Local Payment Methods: 4 (bKash, Nagad, Rocket, SureCash)');
    console.log('  - SMS Subscription: 1 (if test user exists)');
    console.log('  - Cart SMS Subscription: 1 (if test user exists)');
    console.log('  - Cart Offline Sync: 1 (if test user exists)');
    console.log('  - Cart SMS Log: 1 (if test user exists)');

  } catch (error) {
    console.error('Error inserting sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertSampleData().catch(console.error);
