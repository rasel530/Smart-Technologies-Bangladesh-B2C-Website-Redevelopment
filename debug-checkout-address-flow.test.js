/**
 * Debug Checkout Address Flow Test
 * 
 * This test simulates the complete checkout flow to diagnose
 * the "Shipping address is required" error
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123456!'
};

// Test data
const TEST_ADDRESS = {
  firstName: 'John',
  lastName: 'Doe',
  phone: '01712345678',
  address: '123 Test Street',
  addressLine2: 'Apt 4B',
  city: 'Dhaka',
  district: 'Dhaka',
  division: 'Dhaka',
  upazila: 'Gulshan',
  postalCode: '1212'
};

const TEST_SHIPPING = {
  method: 'STANDARD'
};

const TEST_PAYMENT = {
  method: 'CASH_ON_DELIVERY'
};

let authToken = null;
let sessionId = null;
let cartId = null;

/**
 * Helper function to log with timestamp
 */
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Login to get authentication token
 */
async function login() {
  log('=== STEP 1: LOGIN ===');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: TEST_USER.email,
      password: TEST_USER.password
    });
    authToken = response.data.data.token;
    log('Login successful', { token: authToken.substring(0, 20) + '...' });
    return true;
  } catch (error) {
    log('Login failed', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

/**
 * Get or create cart
 */
async function getOrCreateCart() {
  log('=== STEP 2: GET CART ===');
  try {
    const response = await axios.get(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.data && response.data.data.id) {
      cartId = response.data.data.id;
      log('Cart found', { cartId, itemCount: response.data.data.items?.length || 0 });
      return cartId;
    }
    
    // Create new cart if none exists
    const createResponse = await axios.post(`${BASE_URL}/cart`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    cartId = createResponse.data.data.id;
    log('Cart created', { cartId });
    return cartId;
  } catch (error) {
    log('Cart operation failed', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
}

/**
 * Add item to cart (if empty)
 */
async function ensureCartHasItems() {
  log('=== STEP 3: ENSURE CART HAS ITEMS ===');
  try {
    const response = await axios.get(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const items = response.data.data?.items || [];
    if (items.length === 0) {
      log('Cart is empty, adding test product');
      // Try to add a product - we'll need to find a valid product ID
      try {
        const productsResponse = await axios.get(`${BASE_URL}/products?limit=1`);
        if (productsResponse.data.data && productsResponse.data.data.length > 0) {
          const productId = productsResponse.data.data[0].id;
          await axios.post(`${BASE_URL}/cart/items`, 
            { productId, quantity: 1 },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          log('Test product added to cart', { productId });
        }
      } catch (productError) {
        log('Could not add product to cart', { message: productError.message });
      }
    } else {
      log('Cart has items', { count: items.length });
    }
  } catch (error) {
    log('Failed to check cart items', { message: error.message });
  }
}

/**
 * Initiate checkout session
 */
async function initiateCheckout() {
  log('=== STEP 4: INITIATE CHECKOUT ===');
  try {
    const response = await axios.post(`${BASE_URL}/checkout/initiate`, 
      { cartId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    sessionId = response.data.data.id;
    log('Checkout session initiated', { sessionId, cartId });
    return sessionId;
  } catch (error) {
    log('Checkout initiation failed', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
}

/**
 * Save address step
 */
async function saveAddressStep() {
  log('=== STEP 5: SAVE ADDRESS STEP ===');
  try {
    const response = await axios.post(
      `${BASE_URL}/checkout/session/${sessionId}/address`,
      TEST_ADDRESS,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('Address step saved successfully', {
      sessionId,
      response: response.data.data
    });
    return true;
  } catch (error) {
    log('Address step save failed', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

/**
 * Save shipping step
 */
async function saveShippingStep() {
  log('=== STEP 6: SAVE SHIPPING STEP ===');
  try {
    const response = await axios.post(
      `${BASE_URL}/checkout/session/${sessionId}/shipping`,
      TEST_SHIPPING,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('Shipping step saved successfully', {
      sessionId,
      method: TEST_SHIPPING.method
    });
    return true;
  } catch (error) {
    log('Shipping step save failed', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

/**
 * Save payment step
 */
async function savePaymentStep() {
  log('=== STEP 7: SAVE PAYMENT STEP ===');
  try {
    const response = await axios.post(
      `${BASE_URL}/checkout/session/${sessionId}/payment`,
      TEST_PAYMENT,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('Payment step saved successfully', {
      sessionId,
      method: TEST_PAYMENT.method
    });
    return true;
  } catch (error) {
    log('Payment step save failed', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return false;
  }
}

/**
 * Get checkout session to inspect data
 */
async function getCheckoutSession() {
  log('=== STEP 8: GET CHECKOUT SESSION FOR INSPECTION ===');
  try {
    const response = await axios.get(
      `${BASE_URL}/checkout/session/${sessionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const session = response.data.data;
    log('Checkout session retrieved', {
      sessionId: session.id,
      currentStep: session.currentStep,
      status: session.status,
      hasShippingAddressId: !!session.shippingAddressId,
      shippingAddressId: session.shippingAddressId,
      hasStepData: !!session.stepData,
      stepDataKeys: session.stepData ? Object.keys(session.stepData) : [],
      hasAddressStepData: !!session.stepData?.address,
      addressStepData: session.stepData?.address,
      hasShippingStepData: !!session.stepData?.shipping,
      shippingStepData: session.stepData?.shipping,
      hasPaymentStepData: !!session.stepData?.payment,
      paymentStepData: session.stepData?.payment
    });
    return session;
  } catch (error) {
    log('Failed to get checkout session', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
}

/**
 * Complete checkout (this is where the error occurs)
 */
async function completeCheckout() {
  log('=== STEP 9: COMPLETE CHECKOUT ===');
  log('This is where the "Shipping address is required" error should occur');
  try {
    const response = await axios.post(
      `${BASE_URL}/checkout/session/${sessionId}/complete`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log('Checkout completed successfully!', {
      orderId: response.data.data.orderId,
      orderNumber: response.data.data.orderNumber,
      total: response.data.data.total
    });
    return true;
  } catch (error) {
    log('CHECKOUT COMPLETION FAILED - THIS IS THE ERROR WE ARE DEBUGGING', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      fullError: error.response?.data?.error || error.response?.data?.message
    });
    return false;
  }
}

/**
 * Main test execution
 */
async function runTest() {
  log('=== STARTING CHECKOUT ADDRESS FLOW DEBUG TEST ===');
  log('This test will simulate the complete checkout flow');
  log('and capture diagnostic logs to identify where address data is stored');
  
  // Step 1: Login
  if (!await login()) {
    log('Test aborted: Login failed');
    return;
  }
  
  // Step 2: Get cart
  if (!await getOrCreateCart()) {
    log('Test aborted: Could not get cart');
    return;
  }
  
  // Step 3: Ensure cart has items
  await ensureCartHasItems();
  
  // Step 4: Initiate checkout
  if (!await initiateCheckout()) {
    log('Test aborted: Could not initiate checkout');
    return;
  }
  
  // Step 5: Save address
  if (!await saveAddressStep()) {
    log('Test aborted: Could not save address');
    return;
  }
  
  // Step 6: Save shipping
  if (!await saveShippingStep()) {
    log('Test aborted: Could not save shipping');
    return;
  }
  
  // Step 7: Save payment
  if (!await savePaymentStep()) {
    log('Test aborted: Could not save payment');
    return;
  }
  
  // Step 8: Get checkout session for inspection
  await getCheckoutSession();
  
  // Step 9: Complete checkout (this should trigger the error)
  await completeCheckout();
  
  log('=== TEST COMPLETED ===');
  log('Check the backend logs for diagnostic information');
  log('Look for logs starting with:');
  log('  - [saveAddressStep]');
  log('  - [updateCheckoutStep]');
  log('  - [validateCheckoutStep]');
  log('  - [completeCheckoutSession]');
}

// Run the test
runTest().catch(error => {
  log('Test execution failed with unexpected error', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});
