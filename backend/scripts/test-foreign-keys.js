const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testForeignKeys() {
  console.log('=== Testing Foreign Key Constraints ===\n');

  const results = [];

  // Test 1: emi_plan.providerId references emi_provider.id
  console.log('Test 1: emi_plan.providerId -> emi_provider.id');
  try {
    const fkInfo = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema='public'
        AND tc.table_name='emi_plans'
        AND kcu.column_name='provider_id';
    `);
    
    if (fkInfo.length > 0) {
      const fk = fkInfo[0];
      console.log(`  ✓ Foreign key exists: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      results.push({ test: 'emi_plan.providerId', status: 'PASS' });
    } else {
      console.log(`  ✗ Foreign key NOT found`);
      results.push({ test: 'emi_plan.providerId', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'emi_plan.providerId', status: 'ERROR' });
  }

  // Test 2: sms_subscription.userId references users.id
  console.log('\nTest 2: sms_subscription.userId -> users.id');
  try {
    const fkInfo = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema='public'
        AND tc.table_name='sms_subscriptions'
        AND kcu.column_name='userId';
    `);
    
    if (fkInfo.length > 0) {
      const fk = fkInfo[0];
      console.log(`  ✓ Foreign key exists: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      results.push({ test: 'sms_subscription.userId', status: 'PASS' });
    } else {
      console.log(`  ✗ Foreign key NOT found`);
      results.push({ test: 'sms_subscription.userId', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'sms_subscription.userId', status: 'ERROR' });
  }

  // Test 3: cart_offline_sync.cartId references carts.id
  console.log('\nTest 3: cart_offline_sync.cartId -> carts.id');
  try {
    const fkInfo = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema='public'
        AND tc.table_name='cart_offline_sync'
        AND kcu.column_name='cart_id';
    `);
    
    if (fkInfo.length > 0) {
      const fk = fkInfo[0];
      console.log(`  ✓ Foreign key exists: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      results.push({ test: 'cart_offline_sync.cartId', status: 'PASS' });
    } else {
      console.log(`  ✗ Foreign key NOT found`);
      results.push({ test: 'cart_offline_sync.cartId', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'cart_offline_sync.cartId', status: 'ERROR' });
  }

  // Test 4: cart_sms_log.subscriptionId references cart_sms_subscription.id
  console.log('\nTest 4: cart_sms_log.subscriptionId -> cart_sms_subscription.id');
  try {
    const fkInfo = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema='public'
        AND tc.table_name='cart_sms_log'
        AND kcu.column_name='subscription_id';
    `);
    
    if (fkInfo.length > 0) {
      const fk = fkInfo[0];
      console.log(`  ✓ Foreign key exists: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      results.push({ test: 'cart_sms_log.subscriptionId', status: 'PASS' });
    } else {
      console.log(`  ✗ Foreign key NOT found`);
      results.push({ test: 'cart_sms_log.subscriptionId', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'cart_sms_log.subscriptionId', status: 'ERROR' });
  }

  // Additional tests for other foreign keys
  console.log('\nTest 5: cart_sms_subscription.userId -> users.id');
  try {
    const fkInfo = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema='public'
        AND tc.table_name='cart_sms_subscription'
        AND kcu.column_name='user_id';
    `);
    
    if (fkInfo.length > 0) {
      const fk = fkInfo[0];
      console.log(`  ✓ Foreign key exists: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      results.push({ test: 'cart_sms_subscription.userId', status: 'PASS' });
    } else {
      console.log(`  ✗ Foreign key NOT found`);
      results.push({ test: 'cart_sms_subscription.userId', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'cart_sms_subscription.userId', status: 'ERROR' });
  }

  console.log('\nTest 6: cart_offline_sync.userId -> users.id');
  try {
    const fkInfo = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema='public'
        AND tc.table_name='cart_offline_sync'
        AND kcu.column_name='user_id';
    `);
    
    if (fkInfo.length > 0) {
      const fk = fkInfo[0];
      console.log(`  ✓ Foreign key exists: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      results.push({ test: 'cart_offline_sync.userId', status: 'PASS' });
    } else {
      console.log(`  ✗ Foreign key NOT found`);
      results.push({ test: 'cart_offline_sync.userId', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'cart_offline_sync.userId', status: 'ERROR' });
  }

  console.log('\nTest 7: cart_sms_log.userId -> users.id');
  try {
    const fkInfo = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema='public'
        AND tc.table_name='cart_sms_log'
        AND kcu.column_name='user_id';
    `);
    
    if (fkInfo.length > 0) {
      const fk = fkInfo[0];
      console.log(`  ✓ Foreign key exists: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      results.push({ test: 'cart_sms_log.userId', status: 'PASS' });
    } else {
      console.log(`  ✗ Foreign key NOT found`);
      results.push({ test: 'cart_sms_log.userId', status: 'FAIL' });
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    results.push({ test: 'cart_sms_log.userId', status: 'ERROR' });
  }

  console.log('\n=== Summary ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  console.log(`Foreign key tests passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✓ All foreign key constraints are properly configured!');
  } else {
    console.log('✗ Some foreign key constraints are missing or misconfigured!');
  }

  await prisma.$disconnect();
}

testForeignKeys().catch(console.error);
