// Test script for orders endpoint
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testOrdersEndpoint() {
  console.log('=== Testing Orders Endpoint ===\n');

  // Step 1: Login to get a token
  console.log('Step 1: Logging in to get authentication token...');
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'raselbepari88@gmail.com',
        password: '74Vfo^71~_oY'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    if (!loginResponse.ok) {
      console.error('Login failed. Trying with demo user...');
      
      // Try with demo user
      const demoLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: 'demo@smarttech.com',
          password: 'demo123'
        })
      });

      const demoLoginData = await demoLoginResponse.json();
      console.log('Demo login response status:', demoLoginResponse.status);
      console.log('Demo login response:', JSON.stringify(demoLoginData, null, 2));

      if (!demoLoginResponse.ok) {
        console.error('Demo login also failed. Cannot proceed with test.');
        return;
      }

      var token = demoLoginData.data?.token || demoLoginData.token;
    } else {
      var token = loginData.data?.token || loginData.token;
    }

    if (!token) {
      console.error('No token found in login response');
      return;
    }

    console.log('Token obtained:', token.substring(0, 20) + '...\n');

    // Step 2: Fetch orders with the token
    console.log('Step 2: Fetching orders with authentication token...');
    const ordersResponse = await fetch(`${API_BASE_URL}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Orders response status:', ordersResponse.status);
    console.log('Orders response status text:', ordersResponse.statusText);

    const ordersData = await ordersResponse.json();
    console.log('Orders response:', JSON.stringify(ordersData, null, 2));

    // Step 3: Check if there are any orders in the database
    console.log('\nStep 3: Checking database for orders...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const allOrders = await prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          status: true,
          total: true,
          createdAt: true,
          _count: {
            select: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`Total orders in database: ${allOrders.length}`);
      console.log('Orders:', JSON.stringify(allOrders, null, 2));

      // Check order status values
      const uniqueStatuses = [...new Set(allOrders.map(o => o.status))];
      console.log('\nUnique order statuses in database:', uniqueStatuses);
    } catch (dbError) {
      console.error('Database query error:', dbError.message);
    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('Error during test:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testOrdersEndpoint();
