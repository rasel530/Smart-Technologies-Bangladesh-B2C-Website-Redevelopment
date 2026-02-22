/**
 * Debug script to check EMI plans in database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkEmiPlans() {
  try {
    console.log('Checking EMI plans in database...\n');
    
    // Check providers
    const providers = await prisma.emiProvider.findMany({
      include: {
        emiPlans: {
          where: { isActive: true }
        }
      }
    });
    
    console.log(`Found ${providers.length} EMI providers:\n`);
    
    providers.forEach(provider => {
      console.log(`Provider: ${provider.name}`);
      console.log(`  ID: ${provider.id} (type: ${typeof provider.id})`);
      console.log(`  Active: ${provider.isActive}`);
      console.log(`  Plans: ${provider.emiPlans.length}`);
      
      provider.emiPlans.forEach(plan => {
        console.log(`    Plan: ${plan.name}`);
        console.log(`      ID: ${plan.id} (type: ${typeof plan.id})`);
        console.log(`      Duration: ${plan.duration} months`);
        console.log(`      Interest Rate: ${plan.interestRate}%`);
        console.log(`      Min Amount: ${plan.minAmount}`);
        console.log(`      Max Amount: ${plan.maxAmount}`);
        console.log(`      Active: ${plan.isActive}`);
      });
      console.log('');
    });
    
    // Check if plan IDs are UUIDs
    console.log('\n--- Plan ID Format Analysis ---');
    const allPlans = await prisma.emiPlan.findMany();
    allPlans.forEach(plan => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan.id);
      console.log(`Plan ID: ${plan.id} - Valid UUID: ${isUUID}`);
    });
    
  } catch (error) {
    console.error('Error checking EMI plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmiPlans();
