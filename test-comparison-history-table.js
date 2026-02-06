const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testComparisonHistory() {
  try {
    console.log('Testing ComparisonHistory table...');

    // Try to count records
    const count = await prisma.comparisonHistory.count();
    console.log('ComparisonHistory count:', count);

    // Try to find all records
    const allRecords = await prisma.comparisonHistory.findMany({
      take: 5
    });
    console.log('First 5 records:', JSON.stringify(allRecords, null, 2));

    // Try groupBy
    console.log('Testing groupBy...');
    const grouped = await prisma.comparisonHistory.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      },
      take: 10
    });
    console.log('Grouped by userId:', JSON.stringify(grouped, null, 2));

  } catch (error) {
    console.error('Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testComparisonHistory();
