/**
 * Comprehensive Login API Test Script
 * Tests multiple login scenarios with demo users
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

const TEST_USERS = [
  {
    identifier: 'demo.user1@smarttech.bd',
    password: 'Demo123456',
    expectedName: 'Rahim Ahmed'
  },
  {
    identifier: 'demo.user2@smarttech.bd',
    password: 'Demo123456',
    expectedName: 'Fatima Begum'
  },
  {
    identifier: 'demo.user3@smarttech.bd',
    password: 'Demo123456',
    expectedName: 'Karim Hossain'
  }
];

const NEGATIVE_TEST_CASES = [
  {
    name: 'Invalid email',
    identifier: 'nonexistent@smarttech.bd',
    password: 'Demo123456',
    expectedStatus: 401
  },
  {
    name: 'Invalid password',
    identifier: 'demo.user1@smarttech.bd',
    password: 'WrongPassword123',
    expectedStatus: 401
  },
  {
    name: 'Missing identifier',
    identifier: '',
    password: 'Demo123456',
    expectedStatus: 400
  },
  {
    name: 'Missing password',
    identifier: 'demo.user1@smarttech.bd',
    password: '',
    expectedStatus: 400
  }
];

async function testLogin(testCase) {
  try {
    console.log(`\n📝 Testing: ${testCase.name || testCase.identifier}`);
    console.log(`   URL: ${API_BASE_URL}/auth/login`);
    console.log(`   Payload: ${JSON.stringify({ identifier: testCase.identifier, password: testCase.password ? '***' : '' })}`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: testCase.identifier,
      password: testCase.password
    }, {
      timeout: 10000
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    
    if (response.data?.user?.id && response.data?.token) {
      console.log(`   ✅ User ID: ${response.data.user.id}`);
      console.log(`   ✅ User Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
      console.log(`   ✅ Token: ${response.data.token.substring(0, 30)}...`);
      
      if (testCase.expectedName) {
        const fullName = `${response.data.user.firstName} ${response.data.user.lastName}`;
        if (fullName === testCase.expectedName) {
          console.log(`   ✅ User name matches expected: ${testCase.expectedName}`);
        } else {
          console.log(`   ⚠️  User name mismatch. Expected: ${testCase.expectedName}, Got: ${fullName}`);
        }
      }
      
      return { success: true, status: response.status, data: response.data };
    } else {
      console.log(`   ❌ Invalid response structure`);
      return { success: false, error: 'Invalid response structure' };
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      
      if (testCase.expectedStatus && error.response.status === testCase.expectedStatus) {
        console.log(`   ✅ Expected error status received`);
        return { success: true, expectedError: true, status: error.response.status };
      }
    }
    
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTests() {
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE LOGIN API TEST SUITE');
  console.log('='.repeat(80));
  console.log(`\n📅 Date: ${new Date().toISOString()}`);
  console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);
  
  // Test positive cases
  console.log('\n' + '='.repeat(80));
  console.log('POSITIVE TEST CASES - Valid Login Attempts');
  console.log('='.repeat(80));
  
  let positiveResults = [];
  for (const user of TEST_USERS) {
    const result = await testLogin(user);
    positiveResults.push({ user: user.identifier, ...result });
  }
  
  // Test negative cases
  console.log('\n' + '='.repeat(80));
  console.log('NEGATIVE TEST CASES - Invalid Login Attempts');
  console.log('='.repeat(80));
  
  let negativeResults = [];
  for (const testCase of NEGATIVE_TEST_CASES) {
    const result = await testLogin(testCase);
    negativeResults.push({ test: testCase.name, ...result });
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  const positiveSuccess = positiveResults.filter(r => r.success).length;
  const negativeSuccess = negativeResults.filter(r => r.success).length;
  
  console.log(`\n✅ Positive Tests: ${positiveSuccess}/${positiveResults.length} passed`);
  console.log(`✅ Negative Tests: ${negativeSuccess}/${negativeResults.length} passed`);
  console.log(`\n📊 Total Success Rate: ${((positiveSuccess + negativeSuccess) / (positiveResults.length + negativeResults.length) * 100).toFixed(1)}%`);
  
  if (positiveSuccess === positiveResults.length && negativeSuccess === negativeResults.length) {
    console.log('\n🎉 ALL TESTS PASSED! Login API is working correctly.\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Please review the results above.\n');
  }
  
  console.log('='.repeat(80));
}

runComprehensiveTests().catch(console.error);
