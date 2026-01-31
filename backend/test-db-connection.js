// Simple database connection test
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('[TEST] Starting database connection test...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('[TEST] Database connection: SUCCESS');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM _prisma_migrations`;
    console.log('[TEST] Migration history query: SUCCESS, rows:', result);
    
    // Test product table exists
    const productCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM products`;
    console.log('[TEST] Products table query: SUCCESS, count:', productCount);
    
    console.log('[TEST] All database tests: PASSED');
    process.exit(0);
    
  } catch (error) {
    console.error('[TEST] Database connection: FAILED');
    console.error('[TEST] Error details:', error.message);
    console.error('[TEST] Error code:', error.code);
    console.error('[TEST] Error meta:', error.meta);
    process.exit(1);
  }
}

testDatabaseConnection();
