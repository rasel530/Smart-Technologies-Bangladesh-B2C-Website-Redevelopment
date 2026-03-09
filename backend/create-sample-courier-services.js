/**
 * Create Sample Courier Services
 * 
 * This script creates sample courier services in the database for testing
 * the bulk tracking sync functionality.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleCourierServices = [
  {
    name: 'Steadfast Courier',
    code: 'STEADFAST',
    apiEndpoint: 'https://steadfast.com.bd/api',
    trackingUrl: 'https://steadfast.com.bd/track/{tracking_number}',
    isActive: true,
    coverageAreas: ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Barisal', 'Rangpur', 'Comilla'],
    baseRate: 60,
    ratePerKg: 10
  },
  {
    name: 'Pathao Parcel',
    code: 'PATHAO',
    apiEndpoint: 'https://api.pathao.com/v1/parcel',
    trackingUrl: 'https://pathao.com/track/{tracking_number}',
    isActive: true,
    coverageAreas: ['Dhaka', 'Chittagong', 'Sylhet', 'Khulna', 'Rajshahi'],
    baseRate: 50,
    ratePerKg: 8
  },
  {
    name: 'RedX Courier',
    code: 'REDX',
    apiEndpoint: 'https://redx.com.bd/api',
    trackingUrl: 'https://redx.com.bd/track/{tracking_number}',
    isActive: true,
    coverageAreas: ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet'],
    baseRate: 55,
    ratePerKg: 9
  },
  {
    name: 'Paperfly',
    code: 'PAPERFLY',
    apiEndpoint: 'https://paperfly.com.bd/api',
    trackingUrl: 'https://paperfly.com.bd/track/{tracking_number}',
    isActive: true,
    coverageAreas: ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi'],
    baseRate: 65,
    ratePerKg: 11
  }
];

async function createSampleCourierServices() {
  try {
    console.log('[Sample Courier Services] Starting to create sample courier services...');

    for (const courierData of sampleCourierServices) {
      // Check if courier service already exists
      const existing = await prisma.courierService.findFirst({
        where: { code: courierData.code }
      });

      if (existing) {
        console.log(`[Sample Courier Services] Courier service already exists: ${courierData.name} (${courierData.code})`);
        continue;
      }

      // Create new courier service
      const courierService = await prisma.courierService.create({
        data: courierData
      });

      console.log(`[Sample Courier Services] Created courier service: ${courierService.name} (${courierService.code})`);
    }

    console.log('[Sample Courier Services] Sample courier services created successfully!');
    
    // Display summary
    const totalCouriers = await prisma.courierService.count();
    const activeCouriers = await prisma.courierService.count({ where: { isActive: true } });
    
    console.log(`\n[Sample Courier Services] Summary:`);
    console.log(`  - Total courier services: ${totalCouriers}`);
    console.log(`  - Active courier services: ${activeCouriers}`);
    
  } catch (error) {
    console.error('[Sample Courier Services] Error creating sample courier services:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleCourierServices();
