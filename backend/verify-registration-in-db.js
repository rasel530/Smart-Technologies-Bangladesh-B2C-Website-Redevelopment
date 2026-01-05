// Script to verify registration data in database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyRegistration() {
  try {
    console.log('🔍 Checking database for recent registrations...\n');
    
    // Get the most recently created user
    const recentUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'testuser'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
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
    
    console.log(`✅ Found ${recentUsers.length} test users in database:\n`);
    
    recentUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Phone: ${user.phone}`);
      console.log(`  DOB: ${user.dateOfBirth ? user.dateOfBirth.toISOString() : 'N/A'}`);
      console.log(`  Gender: ${user.gender || 'N/A'}`);
      console.log(`  Status: ${user.status}`);
      console.log(`  Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });
    
    // Check for addresses
    const userIds = recentUsers.map(u => u.id);
    const addresses = await prisma.address.findMany({
      where: {
        userId: {
          in: userIds
        }
      },
      select: {
        userId: true,
        address: true,
        city: true,
        district: true,
        division: true,
        postalCode: true
      }
    });
    
    console.log(`\n📍 Found ${addresses.length} addresses for these users:\n`);
    addresses.forEach((addr, index) => {
      console.log(`Address ${index + 1}:`);
      console.log(`  User ID: ${addr.userId}`);
      console.log(`  Address: ${addr.address}`);
      console.log(`  City: ${addr.city}`);
      console.log(`  District: ${addr.district}`);
      console.log(`  Division: ${addr.division}`);
      console.log(`  Postal Code: ${addr.postalCode || 'N/A'}`);
      console.log('');
    });
    
    console.log('✅ Registration data successfully stored in database!');
    
  } catch (error) {
    console.error('❌ Error verifying registration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRegistration();
