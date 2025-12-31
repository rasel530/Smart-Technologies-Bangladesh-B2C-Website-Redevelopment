const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001';

async function debugRegistrationEndpoint() {
    console.log('🔍 Debugging Registration Endpoint...\n');

    // Test 1: Check if server is running
    try {
        console.log('1. Testing server health...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log(`   ✅ Server is running: ${healthResponse.data.status}`);
        console.log(`   📊 Database: ${healthResponse.data.database}\n`);
    } catch (error) {
        console.log(`   ❌ Server health check failed: ${error.message}\n`);
        return;
    }

    // Test 2: Check API routes
    try {
        console.log('2. Testing API routes...');
        const apiResponse = await axios.get(`${BASE_URL}/api`);
        console.log(`   ✅ API routes available: ${JSON.stringify(apiResponse.data.endpoints, null, 2)}\n`);
    } catch (error) {
        console.log(`   ❌ API routes check failed: ${error.message}\n`);
    }

    // Test 3: Test registration with minimal data
    try {
        console.log('3. Testing registration with minimal data...');
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
        } else if (error.request) {
            console.log(`      No response received: ${error.message}`);
        } else {
            console.log(`      Request setup error: ${error.message}`);
        }

        console.log();
    }

    // Test 4: Test with different endpoint path
    try {
        console.log('4. Testing alternative endpoint path...');
        const userData = {
            email: 'test2@example.com',
            password: 'Test123456!',
            firstName: 'Test',
            lastName: 'User'
        };

        console.log(`   📤 Sending request to: ${BASE_URL}/api/auth/register`);

        const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
        console.log(`   ✅ Registration successful: ${JSON.stringify(response.data, null, 2)}\n`);
    } catch (error) {
        console.log(`   ❌ Alternative endpoint failed:`);

        if (error.response) {
            console.log(`      Status: ${error.response.status}`);
            console.log(`      Status Text: ${error.response.statusText}`);
            console.log(`      Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`      Error: ${error.message}`);
        }

        console.log();
    }
}

debugRegistrationEndpoint().catch(console.error);