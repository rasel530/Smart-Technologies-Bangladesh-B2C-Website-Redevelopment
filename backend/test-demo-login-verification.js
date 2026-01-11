/**
 * Demo Login Verification Script
 * 
 * This script tests login functionality with demo users created during database seeding.
 */

const axios = require('axios');

// Use different URL based on whether running inside Docker or not
const BASE_URL = process.env.DOCKER_ENV === 'true'
  ? 'http://backend:3000/api/v1'
  : 'http://localhost:3001/api/v1';

// Demo users from seed.js
const DEMO_USERS = {
  admin: {
    email: 'admin@smarttech.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  customer: {
    email: 'customer@example.com',
    password: 'customer123',
    role: 'CUSTOMER'
  }
};

async function testLogin(userType, userData) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing ${userType} Login`);
  console.log(`📧 Email: ${userData.email}`);
  console.log(`🔒 Password: ${userData.password}`);
  console.log(`👤 Role: ${userData.role}`);
  console.log('='.repeat(60));

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: userData.email,
      password: userData.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Login successful!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📦 Response Data:`);
    
    if (response.data) {
      console.log(JSON.stringify(response.data, null, 2));
      
      // Check if token is returned
      if (response.data.token) {
        console.log(`🔑 Token received: ${response.data.token.substring(0, 50)}...`);
      }
      
      // Check if user data is returned
      if (response.data.user) {
        console.log(`👤 User ID: ${response.data.user.id}`);
        console.log(`📧 Email: ${response.data.user.email}`);
        console.log(`👤 Role: ${response.data.user.role}`);
        console.log(`📊 Status: ${response.data.user.status}`);
      }
    }
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error('❌ Login failed!');
    
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error(`📦 Error Data:`, error.response.data);
    } else if (error.request) {
      console.error('🌐 No response received');
      console.error('📝 Request details:', error.request);
    } else {
      console.error('⚠️ Request setup error:', error.message);
    }
    
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting Demo Login Verification');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log(`🌐 Backend URL: ${BASE_URL}`);
  
  // Test admin login first
  const adminResult = await testLogin('Admin', DEMO_USERS.admin);
  
  // Wait a moment before testing customer login
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test customer login
  const customerResult = await testLogin('Customer', DEMO_USERS.customer);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Admin Login: ${adminResult.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Customer Login: ${customerResult.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(60));
  
  if (adminResult.success && customerResult.success) {
    console.log('🎉 All demo logins successful!');
    console.log('\n📝 Demo Credentials:');
    console.log('   Admin: admin@smarttech.com / admin123');
    console.log('   Customer: customer@example.com / customer123');
  } else {
    console.log('⚠️ Some logins failed. Check backend logs for details.');
  }
}

// Run the tests
main()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
