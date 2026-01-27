const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrismaClient() {
  try {
    console.log('Testing Prisma Client...');
    
    // Test 1: Check if Product model has reviews relation
    const product = await prisma.product.findFirst({
      where: { status: 'active' },
      include: {
        _count: {
          reviews: true
        }
      }
    });
    
    console.log('✓ Test 1 passed: Product model has reviews relation in _count');
    console.log('Product:', product);
    
  } catch (error) {
    console.error('✗ Test 1 failed:', error.message);
  }
  
  await prisma.$disconnect();
}

testPrismaClient();
