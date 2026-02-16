// Test script for order creation endpoint
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testOrderCreation() {
  console.log('=== Testing Order Creation Endpoint ===\n');

  // Step 1: Login to get a token
  console.log('Step 1: Logging in to get authentication token...');
  let token;
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

      if (!demoLoginResponse.ok) {
        console.error('Demo login also failed. Cannot proceed with test.');
        return;
      }

      token = demoLoginData.data?.token || demoLoginData.token;
    } else {
      token = loginData.data?.token || loginData.token;
    }

    if (!token) {
      console.error('No token found in login response');
      return;
    }

    console.log('Token obtained:', token.substring(0, 20) + '...\n');

    // Step 2: Get user's addresses
    console.log('Step 2: Fetching user addresses...');
    // Need to get userId from login response first
    const userId = loginData.user?.id || loginData.data?.user?.id;
    console.log('User ID:', userId);
    
    const addressesResponse = await fetch(`${API_BASE_URL}/users/${userId}/addresses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Addresses response status:', addressesResponse.status);
    const addressesData = await addressesResponse.json();
    console.log('Addresses response:', JSON.stringify(addressesData, null, 2));

    let addressId;
    if (addressesData.addresses && addressesData.addresses.length > 0) {
      addressId = addressesData.addresses[0].id;
      console.log('Using address ID:', addressId);
    } else {
      console.error('No addresses found. Cannot create order without address.');
      return;
    }

    // Step 3: Get user's cart
    console.log('\nStep 3: Fetching user cart...');
    const cartResponse = await fetch(`${API_BASE_URL}/cart`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Cart response status:', cartResponse.status);
    const cartData = await cartResponse.json();
    console.log('Cart response:', JSON.stringify(cartData, null, 2));

    // Handle different cart response formats
    let cartItems;
    if (cartData.success && cartData.data && cartData.data.items) {
      cartItems = cartData.data.items;
    } else if (cartData.items) {
      cartItems = cartData.items;
    } else {
      console.error('No items in cart. Cannot create order.');
      return;
    }
    const orderItems = cartItems.map(item => ({
      productId: item.product.id,
      variantId: item.variantId || null,
      quantity: item.quantity
    }));

    console.log('Order items to create:', JSON.stringify(orderItems, null, 2));

    // Step 4: Create an order
    console.log('\nStep 4: Creating order...');
    const orderPayload = {
      addressId: addressId,
      items: orderItems,
      paymentMethod: 'CASH_ON_DELIVERY',
      notes: 'Test order'
    };

    console.log('Order payload:', JSON.stringify(orderPayload, null, 2));

    const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload)
    });

    console.log('\nOrder creation response status:', orderResponse.status);
    console.log('Order creation response status text:', orderResponse.statusText);

    const orderData = await orderResponse.json();
    console.log('Order creation response:', JSON.stringify(orderData, null, 2));

    if (!orderResponse.ok) {
      console.error('\n=== ORDER CREATION FAILED ===');
      console.error('Status:', orderResponse.status);
      console.error('Error:', orderData);
    } else {
      console.log('\n=== ORDER CREATED SUCCESSFULLY ===');
      console.log('Order ID:', orderData.order?.id);
    }

  } catch (error) {
    console.error('\nError during test:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testOrderCreation();
