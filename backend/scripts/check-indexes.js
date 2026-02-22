const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIndexes() {
  console.log('=== Checking Indexes ===\n');

  const expectedIndexes = [
    { table: 'emi_providers', columns: ['is_active'], indexName: 'idx_emi_providers_is_active' },
    { table: 'emi_plans', columns: ['is_active'], indexName: 'idx_emi_plans_is_active' },
    { table: 'emi_plans', columns: ['provider_id'], indexName: 'idx_emi_plans_provider_id' },
    { table: 'local_payment_methods', columns: ['isActive'], indexName: null },
    { table: 'local_payment_methods', columns: ['code'], indexName: null },
    { table: 'sms_subscriptions', columns: ['userId'], indexName: null },
    { table: 'sms_subscriptions', columns: ['paymentMethod'], indexName: null },
    { table: 'cart_sms_subscription', columns: ['user_id'], indexName: 'idx_cart_sms_subscription_user_id' },
    { table: 'cart_sms_subscription', columns: ['phone_number'], indexName: 'idx_cart_sms_subscription_phone_number' },
    { table: 'cart_sms_subscription', columns: ['is_active'], indexName: 'idx_cart_sms_subscription_is_active' },
    { table: 'cart_sms_subscription', columns: ['created_at'], indexName: 'idx_cart_sms_subscription_created_at' },
    { table: 'cart_offline_sync', columns: ['user_id'], indexName: 'idx_cart_offline_sync_user_id' },
    { table: 'cart_offline_sync', columns: ['cart_id'], indexName: 'idx_cart_offline_sync_cart_id' },
    { table: 'cart_offline_sync', columns: ['device_id'], indexName: 'idx_cart_offline_sync_device_id' },
    { table: 'cart_offline_sync', columns: ['last_sync_at'], indexName: 'idx_cart_offline_sync_last_sync_at' },
    { table: 'cart_offline_sync', columns: ['sync_status'], indexName: 'idx_cart_offline_sync_sync_status' },
    { table: 'cart_sms_log', columns: ['user_id'], indexName: 'idx_cart_sms_log_user_id' },
    { table: 'cart_sms_log', columns: ['subscription_id'], indexName: 'idx_cart_sms_log_subscription_id' },
    { table: 'cart_sms_log', columns: ['event_type'], indexName: 'idx_cart_sms_log_event_type' },
    { table: 'cart_sms_log', columns: ['status'], indexName: 'idx_cart_sms_log_status' },
    { table: 'cart_sms_log', columns: ['sent_at'], indexName: 'idx_cart_sms_log_sent_at' },
  ];

  const results = [];

  for (const expected of expectedIndexes) {
    try {
      const indexInfo = await prisma.$queryRawUnsafe(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = '${expected.table}'
          AND indexname ${expected.indexName ? "= '" + expected.indexName + "'" : "LIKE '%" + expected.columns.join('_') + "%'"};
      `);
      
      if (indexInfo.length > 0) {
        console.log(`✓ ${expected.table}.${expected.columns.join(', ')}: EXISTS (${indexInfo[0].indexname})`);
        results.push({ table: expected.table, columns: expected.columns.join(', '), status: 'PASS', indexName: indexInfo[0].indexname });
      } else {
        console.log(`✗ ${expected.table}.${expected.columns.join(', ')}: MISSING`);
        results.push({ table: expected.table, columns: expected.columns.join(', '), status: 'FAIL', indexName: null });
      }
    } catch (error) {
      console.log(`✗ ${expected.table}.${expected.columns.join(', ')}: ERROR - ${error.message}`);
      results.push({ table: expected.table, columns: expected.columns.join(', '), status: 'ERROR', indexName: null });
    }
  }

  console.log('\n=== Summary ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  console.log(`Index checks passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✓ All indexes are properly configured!');
  } else {
    console.log('✗ Some indexes are missing!');
  }

  await prisma.$disconnect();
}

checkIndexes().catch(console.error);
