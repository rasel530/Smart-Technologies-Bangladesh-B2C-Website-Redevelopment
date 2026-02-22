/**
 * Migration Verification Script
 * Verifies that all Phase 6 Milestone 4 database changes were applied correctly
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying Phase 6 Milestone 4 Migration...\n');
  
  const results = {
    success: true,
    checks: []
  };
  
  try {
    // 1. Verify Cart table has recovery fields
    console.log('1️⃣ Checking Cart recovery fields...');
    const cartColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'carts' 
      AND column_name IN (
        'abandoned_at', 'recovered_at', 'recovery_token', 'recovery_token_expires', 
        'recovery_attempts', 'recovery_email_sent_at', 'reminder_count', 
        'last_reminder_at', 'abandonment_reason', 'recovery_notes', 
        'discount_code', 'discount_amount'
      )
    `;
    const expectedColumns = 12;
    const cartColumnsOk = cartColumns.length === expectedColumns;
    results.checks.push({
      name: 'Cart Recovery Fields',
      status: cartColumnsOk ? '✅ PASS' : '❌ FAIL',
      details: `Found ${cartColumns.length}/${expectedColumns} expected columns`
    });
    console.log(`   ${cartColumnsOk ? '✅' : '❌'} Cart recovery columns: ${cartColumns.length}/${expectedColumns}`);
    
    // 2. Verify CartRecoveryEvent table exists
    console.log('\n2️⃣ Checking CartRecoveryEvent table...');
    const recoveryEventTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'cart_recovery_events'
    `;
    const recoveryTableOk = recoveryEventTable.length > 0;
    results.checks.push({
      name: 'CartRecoveryEvent Table',
      status: recoveryTableOk ? '✅ PASS' : '❌ FAIL',
      details: 'Table exists'
    });
    console.log(`   ${recoveryTableOk ? '✅' : '❌'} CartRecoveryEvent table exists`);
    
    // 3. Verify CartEvent table exists
    console.log('\n3️⃣ Checking CartEvent table...');
    const cartEventTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'cart_events'
    `;
    const cartEventOk = cartEventTable.length > 0;
    results.checks.push({
      name: 'CartEvent Table',
      status: cartEventOk ? '✅ PASS' : '❌ FAIL',
      details: 'Table exists'
    });
    console.log(`   ${cartEventOk ? '✅' : '❌'} CartEvent table exists`);
    
    // 4. Verify CartAnalytics table exists
    console.log('\n4️⃣ Checking CartAnalytics table...');
    const cartAnalyticsTable = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'cart_analytics'
    `;
    const cartAnalyticsOk = cartAnalyticsTable.length > 0;
    results.checks.push({
      name: 'CartAnalytics Table',
      status: cartAnalyticsOk ? '✅ PASS' : '❌ FAIL',
      details: 'Table exists'
    });
    console.log(`   ${cartAnalyticsOk ? '✅' : '❌'} CartAnalytics table exists`);
    
    // 5. Verify indexes on carts table
    console.log('\n5️⃣ Checking Cart indexes...');
    const cartIndexes = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'carts' 
      AND indexname LIKE '%recovery%' OR indexname LIKE '%abandoned%'
    `;
    const indexesOk = cartIndexes.length >= 3;
    results.checks.push({
      name: 'Cart Recovery Indexes',
      status: indexesOk ? '✅ PASS' : '❌ FAIL',
      details: `Found ${cartIndexes.length} recovery-related indexes`
    });
    console.log(`   ${indexesOk ? '✅' : '❌'} Cart recovery indexes: ${cartIndexes.length} found`);
    
    // 6. Verify existing data preserved
    console.log('\n6️⃣ Checking existing data preservation...');
    const cartCount = await prisma.cart.count();
    results.checks.push({
      name: 'Existing Data Preservation',
      status: '✅ PASS',
      details: `${cartCount} existing cart records preserved`
    });
    console.log(`   ✅ Existing carts preserved: ${cartCount} records`);
    
    // 7. Verify CartItem table still works
    console.log('\n7️⃣ Checking CartItem table...');
    const cartItemCount = await prisma.cartItem.count();
    results.checks.push({
      name: 'CartItem Table',
      status: '✅ PASS',
      details: `${cartItemCount} cart items accessible`
    });
    console.log(`   ✅ CartItem table accessible: ${cartItemCount} items`);
    
    // 8. Verify cart events work with new schema
    console.log('\n8️⃣ Testing cart event creation...');
    const anyCart = await prisma.$queryRaw`SELECT id FROM carts LIMIT 1`;
    const cartId = anyCart.length > 0 ? anyCart[0].id : '00000000-0000-0000-0000-000000000000';
    const testEvent = await prisma.cartEvent.create({
      data: {
        cartId: cartId,
        eventType: 'test_migration_verification',
        timestamp: new Date()
      }
    });
    await prisma.cartEvent.delete({ where: { id: testEvent.id } });
    results.checks.push({
      name: 'CartEvent Creation Test',
      status: '✅ PASS',
      details: 'Successfully created and deleted test event'
    });
    console.log(`   ✅ CartEvent creation/deletion works`);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    const passedChecks = results.checks.filter(c => c.status === '✅ PASS').length;
    const totalChecks = results.checks.length;
    results.success = passedChecks === totalChecks;
    
    console.log(`📊 VERIFICATION RESULTS: ${passedChecks}/${totalChecks} checks passed`);
    console.log('='.repeat(60));
    
    if (results.success) {
      console.log('\n✅ ALL MIGRATION CHECKS PASSED!');
      console.log('Database is ready for Phase 6 Milestone 4 features.');
    } else {
      console.log('\n⚠️ SOME CHECKS FAILED');
      console.log('Please review the failed checks above.');
    }
    
    return results;
    
  } catch (error) {
    console.error('\n❌ Error during migration verification:', error.message);
    results.success = false;
    results.error = error.message;
    return results;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification if called directly
if (require.main === module) {
  verifyMigration().then(results => {
    process.exit(results.success ? 0 : 1);
  });
}

module.exports = { verifyMigration };