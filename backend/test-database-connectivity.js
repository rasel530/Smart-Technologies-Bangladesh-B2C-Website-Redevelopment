/**
 * Database Connectivity Test
 * Tests if the database connection is working properly
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    // Test user table access
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible, total users: ${userCount}`);
    
    // Disconnect
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
    
    return {
      success: true,
      message: 'Database connectivity test passed',
      userCount
    };
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      meta: error.meta
    });
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('❌ Disconnect failed:', disconnectError.message);
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// Run test
testDatabaseConnection()
  .then(result => {
    console.log('\n=== TEST RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
