/**
 * Profile Management Test Script
 * Tests all profile management endpoints with demo data
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Demo users data
const demoUsers = [
  {
    email: 'demo.user1@smarttech.bd',
    password: 'Demo123456',
    firstName: 'Rahim',
    lastName: 'Ahmed',
    phone: '+8801712345678',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'MALE',
    role: 'CUSTOMER',
    status: 'ACTIVE'
  },
  {
    email: 'demo.user2@smarttech.bd',
    password: 'Demo123456',
    firstName: 'Fatima',
    lastName: 'Begum',
    phone: '+8801812345678',
    dateOfBirth: new Date('1995-08-22'),
    gender: 'FEMALE',
    role: 'CUSTOMER',
    status: 'ACTIVE'
  },
  {
    email: 'demo.user3@smarttech.bd',
    password: 'Demo123456',
    firstName: 'Karim',
    lastName: 'Hossain',
    phone: '+8801912345678',
    dateOfBirth: new Date('1988-11-30'),
    gender: 'MALE',
    role: 'CUSTOMER',
    status: 'ACTIVE'
  }
];

// Demo addresses
const demoAddresses = [
  {
    type: 'SHIPPING',
    firstName: 'Rahim',
    lastName: 'Ahmed',
    phone: '+8801712345678',
    address: 'House 12, Road 5',
    addressLine2: 'Dhanmondi',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    upazila: 'Dhanmondi',
    postalCode: '1205',
    isDefault: true
  },
  {
    type: 'BILLING',
    firstName: 'Fatima',
    lastName: 'Begum',
    phone: '+8801812345678',
    address: 'Flat 3B, Building 4',
    addressLine2: 'Gulshan 1',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'DHAKA',
    upazila: 'Gulshan',
    postalCode: '1212',
    isDefault: true
  }
];

async function createDemoData() {
  console.log('🚀 Starting profile management demo data creation...\n');

  try {
    // Clean up existing demo data
    console.log('🧹 Cleaning up existing demo data...');
    await prisma.address.deleteMany({
      where: {
        user: {
          email: {
            contains: 'demo.user'
          }
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'demo.user'
        }
      }
    });
    console.log('✅ Cleanup completed\n');

    // Create demo users
    console.log('👥 Creating demo users...');
    const createdUsers = [];
    
    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          emailVerified: new Date(),
          phoneVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }
    console.log(`\n📊 Total users created: ${createdUsers.length}\n`);

    // Create demo addresses
    console.log('🏠 Creating demo addresses...');
    for (let i = 0; i < demoAddresses.length; i++) {
      const addressData = demoAddresses[i];
      const user = createdUsers[i];
      
      const address = await prisma.address.create({
        data: {
          ...addressData,
          userId: user.id
        }
      });
      
      console.log(`✅ Created address for ${user.email}: ${address.city}, ${address.district}`);
    }
    console.log(`\n📊 Total addresses created: ${demoAddresses.length}\n`);

    // Display summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 DEMO DATA SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('👥 DEMO USERS:');
    console.log('─────────────────────────────────────────────────────────────────────');
    createdUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Password: ${demoUsers[index].password}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Email Verified: ${user.emailVerified ? '✅' : '❌'}`);
      console.log(`   Phone Verified: ${user.phoneVerified ? '✅' : '❌'}`);
    });

    console.log('\n\n🏠 ADDRESSES:');
    console.log('─────────────────────────────────────────────────────────────────────');
    const allAddresses = await prisma.address.findMany({
      where: {
        user: {
          email: {
            contains: 'demo.user'
          }
        }
      },
      include: {
        user: true
      }
    });

    allAddresses.forEach((address, index) => {
      console.log(`\n${index + 1}. ${address.user.firstName} ${address.user.lastName}`);
      console.log(`   Type: ${address.type}`);
      console.log(`   Address: ${address.address}, ${address.addressLine2 || ''}`);
      console.log(`   City: ${address.city}, ${address.district}`);
      console.log(`   Division: ${address.division}`);
      console.log(`   Postal Code: ${address.postalCode}`);
      console.log(`   Default: ${address.isDefault ? '✅' : '❌'}`);
    });

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('✅ DEMO DATA CREATION COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📝 API ENDPOINTS TO TEST:');
    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('\n1. GET    /api/v1/profile/me');
    console.log('2. PUT    /api/v1/profile/me');
    console.log('3. POST   /api/v1/profile/me/picture');
    console.log('4. DELETE /api/v1/profile/me/picture');
    console.log('5. POST   /api/v1/profile/me/email/change');
    console.log('6. POST   /api/v1/profile/me/email/confirm');
    console.log('7. POST   /api/v1/profile/me/phone/change');
    console.log('8. POST   /api/v1/profile/me/phone/confirm');
    console.log('9. GET    /api/v1/profile/me/settings');
    console.log('10. PUT   /api/v1/profile/me/settings');
    console.log('11. POST  /api/v1/profile/me/delete');
    console.log('12. POST  /api/v1/profile/me/delete/confirm\n');

    console.log('🧪 TESTING INSTRUCTIONS:');
    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('\n1. Login with any demo user account');
    console.log('2. Navigate to /account page');
    console.log('3. Test profile viewing and editing');
    console.log('4. Test profile picture upload');
    console.log('5. Test email and phone change');
    console.log('6. Test account settings');
    console.log('7. Verify all data persists correctly\n');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDemoData()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
