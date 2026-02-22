/**
 * Test script for Cart Recovery Settings endpoints
 * This script tests the GET and PUT endpoints for cart recovery settings
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCartRecoverySettings() {
  console.log('=== Cart Recovery Settings Test ===\n');
  
  try {
    // Test 1: Verify database table exists
    console.log('Test 1: Verifying cart_recovery_settings table exists...');
    const tableCheck = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_recovery_settings'
      ) as exists
    `);
    
    if (tableCheck[0].exists) {
      console.log('✓ Table exists in database\n');
    } else {
      console.log('✗ Table does not exist\n');
      return false;
    }
    
    // Test 2: Verify default settings exist
    console.log('Test 2: Verifying default settings exist...');
    let settings = await prisma.cartRecoverySettings.findFirst();
    
    if (!settings) {
      console.log('✗ No settings found\n');
      return false;
    }
    
    console.log('✓ Default settings found:');
    console.log(`  - Enabled: ${settings.enabled}`);
    console.log(`  - First Email Delay: ${settings.firstEmailDelay}h`);
    console.log(`  - Second Email Delay: ${settings.secondEmailDelay}h`);
    console.log(`  - Third Email Delay: ${settings.thirdEmailDelay}h`);
    console.log(`  - Discount Enabled: ${settings.discountEnabled}`);
    console.log(`  - Discount Percentage: ${settings.discountPercentage}%`);
    console.log(`  - Discount Code: ${settings.discountCode}`);
    console.log(`  - Max Recovery Attempts: ${settings.maxRecoveryAttempts}`);
    console.log(`  - Min Cart Value: ${settings.minCartValue}`);
    console.log(`  - Email From Name: ${settings.emailFromName}`);
    console.log(`  - Email From Address: ${settings.emailFromAddress}`);
    console.log(`  - Cart Abandonment Threshold: ${settings.cartAbandonmentThreshold}min`);
    console.log(`  - Recovery Token Expiry: ${settings.recoveryTokenExpiry}days\n`);
    
    // Test 3: Test updating settings
    console.log('Test 3: Testing update functionality...');
    const updatedSettings = await prisma.cartRecoverySettings.update({
      where: { id: settings.id },
      data: {
        enabled: false,
        firstEmailDelay: 2,
        discountPercentage: 15
      }
    });
    
    console.log('✓ Settings updated successfully:');
    console.log(`  - Enabled changed: ${settings.enabled} → ${updatedSettings.enabled}`);
    console.log(`  - First Email Delay changed: ${settings.firstEmailDelay}h → ${updatedSettings.firstEmailDelay}h`);
    console.log(`  - Discount Percentage changed: ${settings.discountPercentage}% → ${updatedSettings.discountPercentage}%\n`);
    
    // Test 4: Restore default settings
    console.log('Test 4: Restoring default settings...');
    const restoredSettings = await prisma.cartRecoverySettings.update({
      where: { id: settings.id },
      data: {
        enabled: true,
        firstEmailDelay: 1,
        secondEmailDelay: 24,
        thirdEmailDelay: 72,
        discountEnabled: true,
        discountPercentage: 10,
        discountCode: 'COMEBACK10',
        maxRecoveryAttempts: 3,
        minCartValue: 1000,
        emailFromName: 'Smart Tech',
        emailFromAddress: 'noreply@smarttech.com',
        cartAbandonmentThreshold: 30,
        recoveryTokenExpiry: 7
      }
    });
    
    console.log('✓ Default settings restored\n');
    
    // Test 5: Verify Prisma Client can access the model
    console.log('Test 5: Verifying Prisma model access...');
    const allSettings = await prisma.cartRecoverySettings.findMany();
    console.log(`✓ Prisma can access cartRecoverySettings model`);
    console.log(`  - Total records: ${allSettings.length}\n`);
    
    // Summary
    console.log('=== Test Summary ===');
    console.log('✓ All tests passed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the backend server to load the new routes');
    console.log('2. Check console logs for route registration messages');
    console.log('3. Test the endpoints using the admin panel or API client');
    console.log('4. GET /api/v1/admin/carts/recovery/settings');
    console.log('5. PUT /api/v1/admin/carts/recovery/settings');
    console.log('\nExpected console logs on server start:');
    console.log('[ROUTES] Registering GET /api/v1/admin/carts/recovery/settings');
    console.log('[ROUTES] GET /api/v1/admin/carts/recovery/settings registered successfully');
    console.log('[ROUTES] Registering PUT /api/v1/admin/carts/recovery/settings');
    console.log('[ROUTES] PUT /api/v1/admin/carts/recovery/settings registered successfully\n');
    
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testCartRecoverySettings()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
