const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLocalPaymentMethods() {
  console.log('========================================');
  console.log('Checking Local Payment Methods');
  console.log('========================================\n');

  try {
    const methods = await prisma.localPaymentMethod.findMany();
    console.log('Local Payment Methods Count:', methods.length);
    console.log('\nMethods:');
    methods.forEach((method, index) => {
      console.log(`\n${index + 1}. ${method.displayName} (${method.code})`);
      console.log(`   ID: ${method.id}`);
      console.log(`   Active: ${method.isActive}`);
      console.log(`   Min Amount: ${method.minAmount}`);
      console.log(`   Max Amount: ${method.maxAmount}`);
      console.log(`   Processing Fee: ${method.processingFee}`);
      console.log(`   Processing Fee %: ${method.processingFeePercent}`);
      console.log(`   Requires Phone: ${method.requiresPhone}`);
      console.log(`   Requires PIN: ${method.requiresPin}`);
      console.log(`   Supported Networks: ${method.supportedNetworks ? method.supportedNetworks.join(', ') : 'N/A'}`);
    });

    if (methods.length === 0) {
      console.log('\n⚠️  No Local Payment Methods found in database!');
      console.log('   You may need to run: node backend/insert-payment-methods.js');
    } else {
      console.log(`\n✓ Found ${methods.length} Local Payment Methods`);
    }

    console.log('\n========================================');
  } catch (error) {
    console.error('\n========================================');
    console.error('✗ Error checking Local Payment Methods:');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocalPaymentMethods();
