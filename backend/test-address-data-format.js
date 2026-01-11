const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAddressData() {
  try {
    const addresses = await prisma.address.findMany({
      take: 3
    });

    console.log('\n=== All Addresses in Database ===');
    addresses.forEach((addr, index) => {
      console.log(`\nAddress ${index + 1}:`);
      console.log('  Division:', addr.division, '(Type:', typeof addr.division, ')');
      console.log('  District:', addr.district, '(Type:', typeof addr.district, ')');
      console.log('  Upazila:', addr.upazila, '(Type:', typeof addr.upazila, ')');
      console.log('  City:', addr.city);
      console.log('  Full address:', JSON.stringify({
        division: addr.division,
        district: addr.district,
        upazila: addr.upazila
      }, null, 2));
    });

    // Check if these are IDs or names
    const divisionIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const divisionNames = ['DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'];
    
    console.log('\n=== Analysis ===');
    addresses.forEach((addr, index) => {
      const isDivisionId = divisionIds.includes(addr.division);
      const isDivisionName = divisionNames.includes(addr.division);
      console.log(`Address ${index + 1}: Division "${addr.division}" is ID: ${isDivisionId}, is NAME: ${isDivisionName}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAddressData();
