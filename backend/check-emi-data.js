/**
 * Diagnostic script to check EMI data in the database
 * Run with: node check-emi-data.js
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmiData() {
  console.log('=== EMI DATA DIAGNOSTIC CHECK ===\n');

  try {
    // Check EMI Providers
    console.log('1. Checking EMI Providers...');
    const providersCount = await prisma.emiProvider.count();
    console.log(`   Total providers: ${providersCount}`);

    if (providersCount > 0) {
      const providers = await prisma.emiProvider.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
      console.log('   Sample providers:');
      providers.forEach(p => {
        console.log(`     - ${p.name} (ID: ${p.id})`);
        console.log(`       Active: ${p.isActive}, Range: ${p.minAmount}-${p.maxAmount} BDT`);
        console.log(`       Created: ${p.createdAt}`);
      });
    } else {
      console.log('   ⚠️  No EMI providers found in database!');
    }

    console.log('');

    // Check EMI Plans
    console.log('2. Checking EMI Plans...');
    const plansCount = await prisma.emiPlan.count();
    console.log(`   Total plans: ${plansCount}`);

    if (plansCount > 0) {
      const plans = await prisma.emiPlan.findMany({
        take: 5,
        include: { provider: true },
        orderBy: { createdAt: 'desc' }
      });
      console.log('   Sample plans:');
      plans.forEach(p => {
        console.log(`     - ${p.name} (ID: ${p.id})`);
        console.log(`       Provider: ${p.provider?.name || 'N/A'}`);
        console.log(`       Active: ${p.isActive}, Duration: ${p.duration} months, Interest: ${p.interestRate}%`);
        console.log(`       Created: ${p.createdAt}`);
      });
    } else {
      console.log('   ⚠️  No EMI plans found in database!');
    }

    console.log('');

    // Check table structures
    console.log('3. Checking table structures...');
    try {
      const providerColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'emi_providers'
        ORDER BY ordinal_position;
      `;
      console.log('   emi_providers columns:', providerColumns.map(c => c.column_name).join(', '));
    } catch (e) {
      console.log('   ⚠️  Could not check emi_providers columns:', e.message);
    }

    try {
      const planColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'emi_plans'
        ORDER BY ordinal_position;
      `;
      console.log('   emi_plans columns:', planColumns.map(c => c.column_name).join(', '));
    } catch (e) {
      console.log('   ⚠️  Could not check emi_plans columns:', e.message);
    }

    console.log('\n=== DIAGNOSTIC COMPLETE ===');
    console.log('\nSUMMARY:');
    console.log(`- EMI Providers: ${providersCount} records`);
    console.log(`- EMI Plans: ${plansCount} records`);
    
    if (providersCount === 0 && plansCount === 0) {
      console.log('\n⚠️  ROOT CAUSE IDENTIFIED: Database has no EMI data!');
      console.log('   The EMI tables exist but are empty.');
    }

  } catch (error) {
    console.error('\n❌ Error checking EMI data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmiData();
