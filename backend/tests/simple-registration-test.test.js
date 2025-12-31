const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';

async function testSimpleRegistration() {
    console.log('🔍 Testing Simple Registration...\n');

    // Test 1: Registration with missing confirmPassword
    try {
        console.log('1. Testing registration without confirmPassword...');
        const userData = {
            email: 'test@example.com',
            password: 'Test123456!',
            firstName: 'Test',
            lastName: 'User'
        };

        console.log(`   📤 Sending request to: ${BASE_URL}/api/v1/auth/register`);
        console.log(`   📦 Request data: ${JSON.stringify(userData, null, 2)}`);

        const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, userData);
        console.log(`   ✅ Registration successful: ${JSON.stringify(response.data, null, 2)}\n`);
    } catch (error) {
        console.log(`   ❌ Registration failed:`);

        if (error.response) {
            console.log(`      Status: ${error.response.status}`);
            console.log(`      Status Text: ${error.response.statusText}`);
            console.log(`      Response Data: ${JSON.stringify(error.response.data, null, 2)}`);

            if (error.response.status === 500) {
                console.log(`      🚨 Internal Server Error - Check server logs for details`);
            }
        } else {
            console.log(`      Error: ${error.message}`);
        }

        console.log();
    }

    // Test 2: Registration with confirmPassword
    try {
        console.log('2. Testing registration with confirmPassword...');
        const userData = {
            email: `test${Date.now()}@example.com`,
            password: 'Test123456!',
            confirmPassword: 'Test123456!',
            firstName: 'Test',
            lastName: 'User'
        };

        console.log(`   📤 Sending request to: ${BASE_URL}/api/v1/auth/register`);
        console.log(`   📦 Request data: ${JSON.stringify(userData, null, 2)}`);

        const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, userData);
        console.log(`   ✅ Registration successful: ${JSON.stringify(response.data, null, 2)}\n`);
    } catch (error) {
        console.log(`   ❌ Registration failed:`);

        if (error.response) {
            console.log(`      Status: ${error.response.status}`);
            console.log(`      Status Text: ${error.response.statusText}`);
            console.log(`      Response Data: ${JSON.stringify(error.response.data, null, 2)}`);

            if (error.response.status === 500) {
                console.log(`      🚨 Internal Server Error - Check server logs for details`);
            }
        } else {
            console.log(`      Error: ${error.message}`);
        }

        console.log();
    }

    // Test 3: Registration with phone and confirmPassword
    try {
        console.log('3. Testing phone-based registration with confirmPassword...');
        const userData = {
            phone: '+8801700000000',
            password: 'Test123456!',
            confirmPassword: 'Test123456!',
            firstName: 'Test',
            lastName: 'User'
        };

        console.log(`   📤 Sending request to: ${BASE_URL}/api/v1/auth/register`);
        console.log(`   📦 Request data: ${JSON.stringify(userData, null, 2)}`);

        const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, userData);
        console.log(`   ✅ Registration successful: ${JSON.stringify(response.data, null, 2)}\n`);
    } catch (error) {
        console.log(`   ❌ Registration failed:`);

        if (error.response) {
            console.log(`      Status: ${error.response.status}`);
            console.log(`      Status Text: ${error.response.statusText}`);
            console.log(`      Response Data: ${JSON.stringify(error.response.data, null, 2)}`);

            if (error.response.status === 500) {
                console.log(`      🚨 Internal Server Error - Check server logs for details`);
            }
        } else {
            console.log(`      Error: ${error.message}`);
        }

        console.log();
    }
}

testSimpleRegistration().catch(console.error);