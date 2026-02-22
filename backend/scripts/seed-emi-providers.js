/**
 * Script to seed EMI providers for testing
 * Run with: node backend/scripts/seed-emi-providers.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleProviders = [
  {
    name: 'City Bank EMI',
    logoUrl: 'https://via.placeholder.com/150x150?text=CityBank',
    website: 'https://citybank.com',
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    interestRate: 12,
    isActive: true
  },
  {
    name: 'Brac Bank EMI',
    logoUrl: 'https://via.placeholder.com/150x150?text=BracBank',
    website: 'https://bracbank.com',
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    interestRate: 12,
    isActive: true
  },
  {
    name: 'Dutch Bangla EMI',
    logoUrl: 'https://via.placeholder.com/150x150?text=DBBL',
    website: 'https://dbbl.com',
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    interestRate: 12,
    isActive: true
  },
  {
    name: 'Prime Bank EMI',
    logoUrl: 'https://via.placeholder.com/150x150?text=PrimeBank',
    website: 'https://primebank.com',
    minAmount: 5000,
    maxAmount: 500000,
    processingFee: 0,
    interestRate: 12,
    isActive: true
  }
];

async function seedEmiProviders() {
  try {
    console.log('🌱 Starting EMI providers seeding...\n');

    // Check if providers already exist
    const existingProviders = await prisma.emiProvider.findMany();
    
    if (existingProviders.length > 0) {
      console.log(`⚠️  Found ${existingProviders.length} existing providers. Skipping seeding.`);
      console.log('Existing providers:', existingProviders.map(p => p.name));
      return;
    }

    // Create providers
    for (const provider of sampleProviders) {
      const createdProvider = await prisma.emiProvider.create({
        data: provider
      });
      console.log(`✅ Created provider: ${createdProvider.name} (ID: ${createdProvider.id})`);
    }

    console.log(`\n🎉 Successfully seeded ${sampleProviders.length} EMI providers!`);
    console.log('\nYou can now create EMI plans in the admin panel.\n');

  } catch (error) {
    console.error('❌ Error seeding EMI providers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedEmiProviders();
