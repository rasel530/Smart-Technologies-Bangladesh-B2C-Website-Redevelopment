/**
 * Simple test to verify authentication fix
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_EMAIL = `test.auth.fix.${Date.now()}@smarttech.bd`;
const TEST_USER_PASSWORD = 'Test123456';

async function testAuth() {
  console.log('='.repeat(80));
  console.log('AUTHENTICATION FIX VERIFICATION TEST');
  console.log('='.repeat(80));

  try {
    // Create test user
    console.log('\n👤 Creating test user...');
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 12);
    const user = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801712345678',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: new Date(),
        phoneVerified: new Date()
      }
    });
    console.log(`✅ Test user created: ${user.email} (ID: ${user.id})`);

    // Login to get token
    console.log('\n🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
    });

    const loginResult = await loginResponse.json();
    console.log(`Login status: ${loginResponse.status}`);
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginResult)}`);
    }

    const token = loginResult.token || loginResult.data?.token;
    if (!token) {
      throw new Error('No token in login response');
    }
    console.log(`✅ Token received: ${token.substring(0, 30)}...`);

    // Test 1: Create Address
    console.log('\n📝 Test 1: Create Address');
    const newAddress = {
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
      isDefault: false
    };

    const createResponse = await fetch(`${API_BASE_URL}/api/v1/users/${user.id}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newAddress)
    });

    const createResult = await createResponse.json();
    console.log(`Create address status: ${createResponse.status}`);
    
    if (createResponse.status === 201) {
      console.log('✅ Create address: SUCCESS');
      console.log(`   Address ID: ${createResult.address?.id}`);
    } else {
      console.log('❌ Create address: FAILED');
      console.log(`   Error: ${createResult.error || createResult.message}`);
    }

    // Test 2: Get Addresses
    console.log('\n📋 Test 2: Get Addresses');
    const getResponse = await fetch(`${API_BASE_URL}/api/v1/users/${user.id}/addresses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const getResult = await getResponse.json();
    console.log(`Get addresses status: ${getResponse.status}`);
    
    if (getResponse.status === 200) {
      const addresses = getResult.addresses || [];
      console.log(`✅ Get addresses: SUCCESS (${addresses.length} addresses)`);
      if (addresses.length > 0) {
        console.log(`   First address: ${addresses[0].firstName} ${addresses[0].lastName}`);
      }
    } else {
      console.log('❌ Get addresses: FAILED');
      console.log(`   Error: ${getResult.error || getResult.message}`);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await prisma.address.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('✅ Cleanup completed');

    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Create Address: ${createResponse.status === 201 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Get Addresses: ${getResponse.status === 200 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    
    // Try to cleanup on error
    try {
      await prisma.user.deleteMany({ where: { email: TEST_USER_EMAIL } });
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
