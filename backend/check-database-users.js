const { PrismaClient } = require('@prisma/client');

async function checkDatabaseUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== DATABASE USER CHECK ===\n');
    
    // Check database connection
    await prisma.$connect();
    console.log('✓ Database connected\n');
    
    // Get user count
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}\n`);
    
    // Get sample users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('Sample users (latest 5):');
    console.log(JSON.stringify(users, null, 2));
    
    // Check for specific test users
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'admin' } }
        ]
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    });
    
    console.log('\nTest/Admin users found:', testUsers.length);
    console.log(JSON.stringify(testUsers, null, 2));
    
  } catch (error) {
    console.error('Database error:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✓ Database disconnected');
  }
}

checkDatabaseUsers();
