const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMigrations() {
  console.log('========================================');
  console.log('Verifying Database Migrations');
  console.log('========================================\n');

  try {
    // Check EMI tables
    console.log('1. Checking EMI tables...');
    const emiProviders = await prisma.emiProvider.findMany();
    console.log(`   ✓ emi_providers: ${emiProviders.length} records`);
    emiProviders.forEach(provider => {
      console.log(`     - ${provider.name} (${provider.id})`);
    });

    const emiPlans = await prisma.emiPlan.findMany();
    console.log(`   ✓ emi_plans: ${emiPlans.length} records`);

    // Check COD settings
    console.log('\n2. Checking COD settings...');
    const codSettings = await prisma.codSettings.findFirst();
    if (codSettings) {
      console.log(`   ✓ cod_settings: Found`);
      console.log(`     - Enabled: ${codSettings.is_enabled}`);
      console.log(`     - Available divisions: ${codSettings.available_divisions.join(', ')}`);
      console.log(`     - Additional fee: ${codSettings.additional_fee}`);
      console.log(`     - Free above: ${codSettings.free_above_amount}`);
    } else {
      console.log(`   ✗ cod_settings: Not found`);
    }

    // Check local payment methods
    console.log('\n3. Checking local payment methods...');
    const paymentMethods = await prisma.localPaymentMethod.findMany();
    console.log(`   ✓ local_payment_methods: ${paymentMethods.length} records`);
    paymentMethods.forEach(method => {
      console.log(`     - ${method.displayName} (${method.code})`);
    });

    // Check SMS subscriptions
    const smsSubscriptions = await prisma.smsSubscription.findMany();
    console.log(`   ✓ sms_subscriptions: ${smsSubscriptions.length} records`);

    // Check mobile cart tables
    console.log('\n4. Checking mobile cart tables...');
    const offlineCartChanges = await prisma.offlineCartChange.findMany();
    console.log(`   ✓ offline_cart_changes: ${offlineCartChanges.length} records`);

    const cartAnalyticsBd = await prisma.cartAnalyticsBd.findMany();
    console.log(`   ✓ cart_analytics_bd: ${cartAnalyticsBd.length} records`);

    console.log('\n========================================');
    console.log('✓ All migrations verified successfully!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('✗ Verification failed:');
    console.error('========================================');
    console.error(error.message);
    console.error('\n');
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigrations();
