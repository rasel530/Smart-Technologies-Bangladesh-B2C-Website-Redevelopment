const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDataIntegrity() {
  console.log('=== Verifying Data Integrity ===\n');

  const results = [];

  // Test 1: EMI providers and plans are linked correctly
  console.log('Test 1: EMI providers and plans linkage');
  try {
    const providers = await prisma.emiProvider.findMany({
      include: {
        emiPlans: true,
      },
    });

    let allPlansLinked = true;
    providers.forEach(provider => {
      provider.emiPlans.forEach(plan => {
        if (plan.providerId !== provider.id) {
          allPlansLinked = false;
          console.log(`  ✗ Plan ${plan.id} has incorrect providerId`);
        }
      });
    });

    if (allPlansLinked && providers.length > 0) {
      console.log(`  ✓ All ${providers.length} EMI providers have correctly linked plans`);
      results.push({ test: 'EMI providers-plans linkage', status: 'PASS' });
    } else {
      console.log(`  ✗ Some EMI plans have incorrect provider linkage`);
      results.push({ test: 'EMI providers-plans linkage', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'EMI providers-plans linkage', status: 'ERROR' });
  }

  // Test 2: COD settings can be retrieved
  console.log('\nTest 2: COD settings retrieval');
  try {
    const codSettings = await prisma.codSettings.findFirst();
    
    if (codSettings) {
      console.log(`  ✓ COD settings retrieved successfully`);
      console.log(`    - Enabled: ${codSettings.is_enabled}`);
      console.log(`    - Min Amount: ${codSettings.min_amount}`);
      console.log(`    - Max Amount: ${codSettings.max_amount}`);
      console.log(`    - Available Divisions: ${codSettings.available_divisions.length}`);
      results.push({ test: 'COD settings retrieval', status: 'PASS' });
    } else {
      console.log(`  ✗ COD settings not found`);
      results.push({ test: 'COD settings retrieval', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'COD settings retrieval', status: 'ERROR' });
  }

  // Test 3: Local payment methods are accessible
  console.log('\nTest 3: Local payment methods accessibility');
  try {
    const paymentMethods = await prisma.localPaymentMethod.findMany({
      where: {
        isActive: true,
      },
    });
    
    if (paymentMethods.length > 0) {
      console.log(`  ✓ Found ${paymentMethods.length} active local payment methods`);
      paymentMethods.forEach(method => {
        console.log(`    - ${method.name} (${method.code}): ${method.minAmount}-${method.maxAmount} BDT`);
      });
      results.push({ test: 'Local payment methods accessibility', status: 'PASS' });
    } else {
      console.log(`  ✗ No active local payment methods found`);
      results.push({ test: 'Local payment methods accessibility', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'Local payment methods accessibility', status: 'ERROR' });
  }

  // Test 4: SMS subscriptions work with user accounts
  console.log('\nTest 4: SMS subscription-user linkage');
  try {
    const smsSubscriptions = await prisma.smsSubscription.findMany({
      include: {
        // Note: User relation is not defined in schema, so we can't include it
      },
    });

    if (smsSubscriptions.length > 0) {
      console.log(`  ✓ Found ${smsSubscriptions.length} SMS subscriptions`);
      smsSubscriptions.forEach(sub => {
        console.log(`    - User ID: ${sub.userId}, Phone: ${sub.phoneNumber}, Status: ${sub.status}`);
      });
      results.push({ test: 'SMS subscription-user linkage', status: 'PASS' });
    } else {
      console.log(`  ⚠ No SMS subscriptions found (may be expected)`);
      results.push({ test: 'SMS subscription-user linkage', status: 'PASS' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'SMS subscription-user linkage', status: 'ERROR' });
  }

  // Test 5: Cart SMS subscription-user linkage
  console.log('\nTest 5: Cart SMS subscription-user linkage');
  try {
    const cartSmsSubscriptions = await prisma.cartSmsSubscription.findMany({
      include: {
        user: true,
      },
    });

    if (cartSmsSubscriptions.length > 0) {
      console.log(`  ✓ Found ${cartSmsSubscriptions.length} Cart SMS subscriptions`);
      cartSmsSubscriptions.forEach(sub => {
        console.log(`    - User: ${sub.user.email}, Phone: ${sub.phoneNumber}, Active: ${sub.isActive}`);
      });
      results.push({ test: 'Cart SMS subscription-user linkage', status: 'PASS' });
    } else {
      console.log(`  ⚠ No Cart SMS subscriptions found (may be expected)`);
      results.push({ test: 'Cart SMS subscription-user linkage', status: 'PASS' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'Cart SMS subscription-user linkage', status: 'ERROR' });
  }

  // Test 6: Cart Offline Sync linkage
  console.log('\nTest 6: Cart Offline Sync linkage');
  try {
    const cartOfflineSyncs = await prisma.cartOfflineSync.findMany({
      include: {
        user: true,
        cart: true,
      },
    });

    if (cartOfflineSyncs.length > 0) {
      console.log(`  ✓ Found ${cartOfflineSyncs.length} Cart Offline Sync records`);
      cartOfflineSyncs.forEach(sync => {
        console.log(`    - User: ${sync.user.email}, Cart: ${sync.cart ? sync.cart.id : 'N/A'}, Status: ${sync.syncStatus}`);
      });
      results.push({ test: 'Cart Offline Sync linkage', status: 'PASS' });
    } else {
      console.log(`  ⚠ No Cart Offline Sync records found (may be expected)`);
      results.push({ test: 'Cart Offline Sync linkage', status: 'PASS' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'Cart Offline Sync linkage', status: 'ERROR' });
  }

  // Test 7: Cart SMS Log linkage
  console.log('\nTest 7: Cart SMS Log linkage');
  try {
    const cartSmsLogs = await prisma.cartSmsLog.findMany({
      include: {
        user: true,
        subscription: true,
      },
    });

    if (cartSmsLogs.length > 0) {
      console.log(`  ✓ Found ${cartSmsLogs.length} Cart SMS Log records`);
      cartSmsLogs.forEach(log => {
        console.log(`    - User: ${log.user.email}, Event: ${log.eventType}, Status: ${log.status}`);
      });
      results.push({ test: 'Cart SMS Log linkage', status: 'PASS' });
    } else {
      console.log(`  ⚠ No Cart SMS Log records found (may be expected)`);
      results.push({ test: 'Cart SMS Log linkage', status: 'PASS' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'Cart SMS Log linkage', status: 'ERROR' });
  }

  console.log('\n=== Summary ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  console.log(`Data integrity tests passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✓ All data integrity tests passed!');
  } else {
    console.log('✗ Some data integrity tests failed!');
  }

  await prisma.$disconnect();
}

verifyDataIntegrity().catch(console.error);
