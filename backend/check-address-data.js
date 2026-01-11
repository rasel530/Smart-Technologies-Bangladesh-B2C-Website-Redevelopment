const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAddressData() {
  try {
    const addresses = await prisma.address.findMany({
      take: 1
    });

    if (addresses.length > 0) {
      const address = addresses[0];
      console.log('Sample address from database:');
      console.log(JSON.stringify(address, null, 2));
      console.log('\nDivision:', address.division, 'Type:', typeof address.division);
      console.log('District:', address.district, 'Type:', typeof address.district);
      console.log('Upazila:', address.upazila, 'Type:', typeof address.upazila);
    } else {
      console.log('No addresses found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAddressData();
