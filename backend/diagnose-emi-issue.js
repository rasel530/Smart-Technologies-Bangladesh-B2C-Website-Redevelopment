/**
 * EMI Issue Diagnostic Script
 * 
 * This script diagnoses why EMI providers are not showing in the cart page.
 * It checks:
 * 1. Database connection
 * 2. EMI providers in database
 * 3. EMI plans in database
 * 4. Active providers and plans
 * 5. Test EMI API endpoints
 */

const { PrismaClient } = require('@prisma/client');
const { emiService } = require('./services/emiService');

const prisma = new PrismaClient();

console.log('='.repeat(80));
console.log('EMI ISSUE DIAGNOSTIC REPORT');
console.log('='.repeat(80));

async function diagnoseEmiIssue() {
  try {
    console.log('\n[1] Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connection successful');

    console.log('\n[2] Checking EMI providers in database...');
    const allProviders = await prisma.emiProvider.findMany();
    console.log(`Total providers in database: ${allProviders.length}`);
    
    if (allProviders.length === 0) {
      console.log('❌ NO EMI PROVIDERS FOUND IN DATABASE');
      console.log('   This is likely the root cause!');
    } else {
      console.log('✓ EMI providers found:');
      allProviders.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id}, Active: ${p.isActive})`);
      });
    }

    console.log('\n[3] Checking active EMI providers...');
    const activeProviders = await prisma.emiProvider.findMany({
      where: { isActive: true }
    });
    console.log(`Active providers: ${activeProviders.length}`);
    
    if (activeProviders.length === 0) {
      console.log('❌ NO ACTIVE EMI PROVIDERS');
      console.log('   All providers are inactive. This is likely the root cause!');
    }

    console.log('\n[4] Checking EMI plans in database...');
    const allPlans = await prisma.emiPlan.findMany({
      include: { provider: true }
    });
    console.log(`Total plans in database: ${allPlans.length}`);
    
    if (allPlans.length === 0) {
      console.log('❌ NO EMI PLANS FOUND IN DATABASE');
      console.log('   This is likely the root cause!');
    } else {
      console.log('✓ EMI plans found:');
      allPlans.forEach(p => {
        console.log(`   - ${p.name} (${p.provider.name}) - ${p.duration} months, ${p.interestRate}% (Active: ${p.isActive}, Min: ${p.minAmount}, Max: ${p.maxAmount})`);
      });
    }

    console.log('\n[5] Checking active EMI plans...');
    const activePlans = await prisma.emiPlan.findMany({
      where: { isActive: true },
      include: { provider: true }
    });
    console.log(`Active plans: ${activePlans.length}`);
    
    if (activePlans.length === 0) {
      console.log('❌ NO ACTIVE EMI PLANS');
      console.log('   All plans are inactive. This is likely the root cause!');
    }

    console.log('\n[6] Testing emiService.getEmiProviders()...');
    try {
      const providers = await emiService.getEmiProviders();
      console.log(`✓ Service returned ${providers.length} providers`);
    } catch (error) {
      console.log(`❌ Service error: ${error.message}`);
    }

    console.log('\n[7] Testing emiService.getEmiPlans()...');
    try {
      const plans = await emiService.getEmiPlans();
      console.log(`✓ Service returned ${plans.length} plans`);
    } catch (error) {
      console.log(`❌ Service error: ${error.message}`);
    }

    console.log('\n[8] Testing emiService.getAvailableEmiPlans() with different amounts...');
    const testAmounts = [1000, 5000, 10000, 50000, 100000];
    
    for (const amount of testAmounts) {
      try {
        const availablePlans = await emiService.getAvailableEmiPlans(amount);
        console.log(`   Amount BDT ${amount.toLocaleString()}: ${availablePlans.length} plans available`);
        
        if (amount >= 5000 && availablePlans.length === 0 && activePlans.length > 0) {
          console.log(`   ⚠️  WARNING: ${activePlans.length} active plans exist but none support amount ${amount}`);
        }
      } catch (error) {
        console.log(`   Amount BDT ${amount.toLocaleString()}: ❌ Error - ${error.message}`);
      }
    }

    console.log('\n[9] Checking EMI configuration...');
    try {
      const config = await emiService.getEmiConfiguration();
      console.log(`✓ Configuration loaded:`);
      console.log(`   - Min Amount: BDT ${config.minAmount.toLocaleString()}`);
      console.log(`   - Max Amount: BDT ${config.maxAmount.toLocaleString()}`);
      console.log(`   - Providers: ${config.providers.length}`);
      console.log(`   - Total Plans: ${config.providers.reduce((sum, p) => sum + p.plans.length, 0)}`);
    } catch (error) {
      console.log(`❌ Configuration error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('DIAGNOSIS SUMMARY');
    console.log('='.repeat(80));
    
    if (allProviders.length === 0) {
      console.log('❌ ROOT CAUSE IDENTIFIED: No EMI providers in database');
      console.log('   SOLUTION: Create EMI providers using the admin panel or seed script');
    } else if (activeProviders.length === 0) {
      console.log('❌ ROOT CAUSE IDENTIFIED: No active EMI providers');
      console.log('   SOLUTION: Activate at least one EMI provider');
    } else if (allPlans.length === 0) {
      console.log('❌ ROOT CAUSE IDENTIFIED: No EMI plans in database');
      console.log('   SOLUTION: Create EMI plans for the providers');
    } else if (activePlans.length === 0) {
      console.log('❌ ROOT CAUSE IDENTIFIED: No active EMI plans');
      console.log('   SOLUTION: Activate at least one EMI plan');
    } else {
      console.log('✓ Database has EMI providers and plans');
      console.log('   The issue might be:');
      console.log('   - Cart amount is below minimum (BDT 5,000)');
      console.log('   - No plans support the cart amount');
      console.log('   - Frontend API call failing');
      console.log('   - Component not rendering properly');
    }

  } catch (error) {
    console.error('\n❌ Diagnostic error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseEmiIssue();
