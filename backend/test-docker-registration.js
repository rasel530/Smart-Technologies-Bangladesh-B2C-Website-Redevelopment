const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDockerRegistration() {
  try {
    console.log('🔍 Checking Docker registration data...\n');
    
    // Get the most recent user
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'dockertest'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    
    if (user) {
      console.log('✅ User found in database:\n');
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Phone: ${user.phone}`);
      console.log(`DOB: ${user.dateOfBirth ? user.dateOfBirth.toISOString() : 'N/A'}`);
      console.log(`Gender: ${user.gender || 'N/A'}`);
      console.log(`Status: ${user.status}`);
      console.log(`Created: ${user.createdAt.toISOString()}`);
      
      // Check for address
      const address = await prisma.address.findFirst({
        where: { userId: user.id },
        select: {
          address: true,
          city: true,
          district: true,
          division: true,
          postalCode: true
        }
      });
      
      if (address) {
        console.log('\n📍 Address found:\n');
        console.log(`Address: ${address.address}`);
        console.log(`City: ${address.city}`);
        console.log(`District: ${address.district}`);
        console.log(`Division: ${address.division}`);
        console.log(`Postal Code: ${address.postalCode || 'N/A'}`);
      } else {
        console.log('\n⚠️ No address found');
      }
      
      console.log('\n✅ Docker registration data successfully stored in database!');
    } else {
      console.log('❌ No Docker test user found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking Docker registration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDockerRegistration();
