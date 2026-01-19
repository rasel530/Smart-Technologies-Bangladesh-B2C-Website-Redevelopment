/**
 * Test script to verify address creation fix
 * Tests that uppercase enum values are properly normalized to lowercase
 */

const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const JWT_SECRET = 'smarttech-super-secret-jwt-key-change-in-production-2024';

// Test user ID (from the error report)
const USER_ID = '252a92b9-25be-4f07-9c32-db217727c16f';

// Generate a test JWT token
function generateTestToken(userId) {
  return jwt.sign(
    { userId: userId, email: 'raselbepari88@gmail.com' },
    JWT_SECRET,
    { 
      expiresIn: '1h',
      issuer: 'smart-ecommerce-api',
      audience: 'smart-ecommerce-clients'
    }
  );
}

// Test address data with UPPERCASE enum values (as sent by frontend)
const testAddressData = {
  type: 'SHIPPING',  // Uppercase - should be normalized to 'shipping'
  firstName: 'Rasel',
  lastName: 'Bepari',
  phone: '01914287530',
  address: 'Jahir Smart Tower',
  addressLine2: '205/1 & 205/1/A, West Kafrul, Begum Rokeya Sharani, Taltola',
  city: 'Dhaka',
  district: '301',
  division: 'DHAKA',  // Uppercase - should be normalized to 'dhaka'
  upazila: '30106',
  postalCode: '1207',
  isDefault: false
};

async function testAddressCreation() {
  console.log('='.repeat(60));
  console.log('Testing Address Creation Fix');
  console.log('='.repeat(60));
  console.log('');

  const token = generateTestToken(USER_ID);
  console.log('Test Token:', token.substring(0, 20) + '...');
  console.log('');

  console.log('Sending address data:');
  console.log(JSON.stringify(testAddressData, null, 2));
  console.log('');

  try {
    const response = await fetch(`${API_BASE_URL}/users/${USER_ID}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testAddressData)
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('');

    const contentType = response.headers.get('content-type');
    console.log('Response Content-Type:', contentType);
    console.log('');

    const responseText = await response.text();
    console.log('Response Body:');
    console.log(responseText);
    console.log('');

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ SUCCESS! Address created successfully.');
      console.log('');
      console.log('Created Address:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      
      // Verify that the enum values were normalized to lowercase
      if (data.address) {
        console.log('Verifying enum value normalization:');
        console.log(`  - type: "${data.address.type}" (expected: "shipping")`);
        console.log(`  - division: "${data.address.division}" (expected: "dhaka")`);
        console.log('');
        
        if (data.address.type === 'shipping' && data.address.division === 'dhaka') {
          console.log('✅ Enum values correctly normalized to lowercase!');
        } else {
          console.log('❌ Enum values NOT normalized correctly!');
        }
      }
      
      return true;
    } else {
      console.log('❌ FAILED! Address creation returned error.');
      console.log('');
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error Details:');
        console.log(JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Could not parse error response as JSON.');
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ ERROR! Request failed.');
    console.log('');
    console.log('Error:', error.message);
    console.log('');
    
    if (error.cause) {
      console.log('Error Cause:', error.cause);
    }
    
    return false;
  }
}

// Run the test
testAddressCreation()
  .then(success => {
    console.log('');
    console.log('='.repeat(60));
    if (success) {
      console.log('TEST RESULT: ✅ PASSED');
    } else {
      console.log('TEST RESULT: ❌ FAILED');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
