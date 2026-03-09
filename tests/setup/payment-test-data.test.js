/**
 * Payment Test Data Setup
 * 
 * This module provides utilities for setting up test data for payment gateway integration tests.
 * It creates test orders, users, and payment gateway configurations.
 */

const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const bcrypt = require('../backend/node_modules/bcryptjs');
const { v4: uuidv4 } = require('../backend/node_modules/uuid');

const prisma = new PrismaClient();

/**
 * Test data constants
 */
const TEST_DATA = {
  users: [],
  orders: [],
  addresses: [],
  paymentTransactions: [],
  cleanup: []
};

/**
 * Create a test user
 */
async function createTestUser(userData = {}) {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    password: await bcrypt.hash('Test123456', 10),
    role: 'customer',
    status: 'active',
    phone: `017${Math.floor(10000000 + Math.random() * 90000000)}`
  };

  const user = await prisma.user.create({
    data: { ...defaultData, ...userData }
  });

  TEST_DATA.users.push(user);
  TEST_DATA.cleanup.push(() => prisma.user.delete({ where: { id: user.id } }));
  
  return user;
}

/**
 * Create a test admin user
 */
async function createTestAdmin() {
  const admin = await createTestUser({
    email: `admin-${Date.now()}@example.com`,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  });
  
  return admin;
}

/**
 * Create a test address
 */
async function createTestAddress(userId, addressData = {}) {
  const defaultData = {
    userId,
    type: 'shipping',
    firstName: 'Test',
    lastName: 'User',
    phone: '01712345678',
    address: '123 Test Street',
    addressLine2: 'Apt 4B',
    city: 'Dhaka',
    district: 'Dhaka',
    division: 'dhaka',
    postalCode: '1000',
    isDefault: true
  };

  const address = await prisma.address.create({
    data: { ...defaultData, ...addressData }
  });

  TEST_DATA.addresses.push(address);
  TEST_DATA.cleanup.push(() => prisma.address.delete({ where: { id: address.id } }));
  
  return address;
}

/**
 * Create a test product
 */
async function createTestProduct(productData = {}) {
  const defaultData = {
    sku: `TEST-${Date.now()}`,
    name: 'Test Product',
    nameEn: 'Test Product',
    slug: `test-product-${Date.now()}`,
    shortDescription: 'A test product',
    description: 'This is a test product for payment testing',
    brandId: null,
    regularPrice: 1000.00,
    salePrice: 900.00,
    costPrice: 500.00,
    taxRate: 0,
    stockQuantity: 100,
    lowStockThreshold: 10,
    status: 'active',
    visibility: 'public'
  };

  // Create a test brand first if needed
  if (!defaultData.brandId) {
    const brand = await prisma.brand.create({
      data: {
        name: 'Test Brand',
        slug: `test-brand-${Date.now()}`,
        status: 'active'
      }
    });
    defaultData.brandId = brand.id;
    TEST_DATA.cleanup.push(() => prisma.brand.delete({ where: { id: brand.id } }));
  }

  const product = await prisma.product.create({
    data: defaultData
  });

  TEST_DATA.cleanup.push(() => prisma.product.delete({ where: { id: product.id } }));
  
  return product;
}

/**
 * Create a test order
 */
async function createTestOrder(userId, addressId, orderData = {}) {
  const defaultData = {
    userId,
    addressId,
    orderNumber: `ORD-${Date.now()}`,
    subtotal: 1000.00,
    tax: 0,
    shippingCost: 50.00,
    discount: 0,
    total: 1050.00,
    paymentMethod: 'credit_card',
    paymentStatus: 'pending',
    status: 'pending',
    notes: 'Test order for payment testing'
  };

  const order = await prisma.order.create({
    data: defaultData
  });

  TEST_DATA.orders.push(order);
  TEST_DATA.cleanup.push(() => prisma.order.delete({ where: { id: order.id } }));
  
  return order;
}

/**
 * Create a test order with items
 */
async function createTestOrderWithItems(userId, addressId) {
  const product = await createTestProduct();
  const order = await createTestOrder(userId, addressId);

  const orderItem = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      quantity: 1,
      unitPrice: 1000.00,
      totalPrice: 1000.00
    }
  });

  TEST_DATA.cleanup.push(() => prisma.orderItem.delete({ where: { id: orderItem.id } }));
  
  return order;
}

/**
 * Setup payment gateway settings for testing
 */
async function setupPaymentGatewaySettings() {
  const gateways = [
    {
      gateway: 'sslcommerz',
      isActive: true,
      isTestMode: true,
      merchantId: 'TEST_MERCHANT_ID',
      storeId: 'TEST_STORE_ID',
      apiKey: 'TEST_API_KEY',
      apiSecret: 'TEST_API_SECRET',
      config: {
        testMode: true,
        currency: 'BDT',
        successUrl: 'http://localhost:3000/payment/success',
        failUrl: 'http://localhost:3000/payment/failed',
        cancelUrl: 'http://localhost:3000/payment/cancel'
      }
    },
    {
      gateway: 'bkash',
      isActive: true,
      isTestMode: true,
      merchantId: 'TEST_BKASH_MERCHANT',
      apiKey: 'TEST_BKASH_KEY',
      apiSecret: 'TEST_BKASH_SECRET',
      config: {
        testMode: true,
        currency: 'BDT',
        merchantInvoiceNumberPrefix: 'TEST'
      }
    },
    {
      gateway: 'nagad',
      isActive: true,
      isTestMode: true,
      merchantId: 'TEST_NAGAD_MERCHANT',
      apiKey: 'TEST_NAGAD_KEY',
      apiSecret: 'TEST_NAGAD_SECRET',
      config: {
        testMode: true,
        currency: 'BDT'
      }
    }
  ];

  for (const gatewayData of gateways) {
    const existing = await prisma.payment_gateway_settings.findUnique({
      where: { gateway: gatewayData.gateway }
    });

    if (existing) {
      await prisma.payment_gateway_settings.update({
        where: { gateway: gatewayData.gateway },
        data: gatewayData
      });
    } else {
      await prisma.payment_gateway_settings.create({
        data: gatewayData
      });
    }
  }
}

/**
 * Create a test payment transaction
 */
async function createTestPaymentTransaction(orderId, transactionData = {}) {
  const defaultData = {
    orderId,
    paymentMethod: 'credit_card',
    amount: 1050.00,
    currency: 'BDT',
    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    gatewayTransactionId: `GW-${Date.now()}`,
    status: 'pending',
    gatewayResponse: {
      success: true,
      message: 'Test payment response'
    }
  };

  const transaction = await prisma.payment_transaction.create({
    data: defaultData
  });

  TEST_DATA.paymentTransactions.push(transaction);
  TEST_DATA.cleanup.push(() => prisma.payment_transaction.delete({ where: { id: transaction.id } }));
  
  return transaction;
}

/**
 * Create a completed payment transaction
 */
async function createCompletedPaymentTransaction(orderId) {
  const transaction = await createTestPaymentTransaction(orderId, {
    status: 'completed',
    gatewayResponse: {
      success: true,
      message: 'Payment completed successfully'
    }
  });

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'paid', paidAt: new Date() }
  });

  return transaction;
}

/**
 * Create a failed payment transaction
 */
async function createFailedPaymentTransaction(orderId, failureReason = 'Insufficient funds') {
  const transaction = await createTestPaymentTransaction(orderId, {
    status: 'failed',
    failureReason,
    gatewayResponse: {
      success: false,
      message: failureReason
    }
  });

  return transaction;
}

/**
 * Create a refunded payment transaction
 */
async function createRefundedPaymentTransaction(orderId, refundAmount = null) {
  const transaction = await createTestPaymentTransaction(orderId, {
    status: 'refunded',
    refundAmount: refundAmount || 1050.00,
    refundedAt: new Date(),
    gatewayResponse: {
      success: true,
      message: 'Refund processed successfully'
    }
  });

  return transaction;
}

/**
 * Mock SSLCommerz response
 */
function mockSSLCommerzResponse(success = true) {
  if (success) {
    return {
      success: true,
      transactionId: `SSL-${Date.now()}`,
      paymentUrl: 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php',
      gatewayResponse: {
        tran_id: `SSL-${Date.now()}`,
        val_id: `VAL-${Date.now()}`,
        amount: '1050.00',
        card_type: 'VISA',
        card_issuer: 'Test Bank',
        card_brand: 'VISA',
        store_amount: '1039.50',
        bank_tran_id: `BANK-${Date.now()}`
      }
    };
  } else {
    return {
      success: false,
      error: 'Payment failed at gateway',
      gatewayResponse: {
        error: 'Transaction declined'
      }
    };
  }
}

/**
 * Mock bKash response
 */
function mockBkashResponse(success = true) {
  if (success) {
    return {
      success: true,
      transactionId: `BKASH-${Date.now()}`,
      paymentUrl: 'https://sandbox.bka.sh/gateway',
      gatewayResponse: {
        paymentID: `PAY-${Date.now()}`,
        createTime: new Date().toISOString(),
        transactionStatus: 'Initiated'
      }
    };
  } else {
    return {
      success: false,
      error: 'bKash payment failed',
      gatewayResponse: {
        error: 'Invalid payment request'
      }
    };
  }
}

/**
 * Mock Nagad response
 */
function mockNagadResponse(success = true) {
  if (success) {
    return {
      success: true,
      transactionId: `NAGAD-${Date.now()}`,
      paymentUrl: 'https://sandbox.mynagad.com/gateway',
      gatewayResponse: {
        paymentRefId: `REF-${Date.now()}`,
        invoiceNo: `INV-${Date.now()}`,
        amount: '1050.00',
        dateTime: new Date().toISOString()
      }
    };
  } else {
    return {
      success: false,
      error: 'Nagad payment failed',
      gatewayResponse: {
        error: 'Payment initialization failed'
      }
    };
  }
}

/**
 * Mock payment callback data
 */
function mockPaymentCallback(gateway, status = 'success') {
  const callbacks = {
    sslcommerz: {
      success: {
        tran_id: `SSL-${Date.now()}`,
        val_id: `VAL-${Date.now()}`,
        amount: '1050.00',
        card_type: 'VISA',
        card_issuer: 'Test Bank',
        card_brand: 'VISA',
        store_amount: '1039.50',
        bank_tran_id: `BANK-${Date.now()}`,
        status: 'VALID'
      },
      fail: {
        tran_id: `SSL-${Date.now()}`,
        status: 'FAILED',
        error: 'Payment failed'
      },
      cancel: {
        tran_id: `SSL-${Date.now()}`,
        status: 'CANCELLED'
      }
    },
    bkash: {
      success: {
        paymentID: `PAY-${Date.now()}`,
        status: 'completed',
        transactionId: `TXN-${Date.now()}`,
        amount: '1050.00'
      },
      fail: {
        paymentID: `PAY-${Date.now()}`,
        status: 'failed',
        error: 'Payment failed'
      },
      cancel: {
        paymentID: `PAY-${Date.now()}`,
        status: 'cancelled'
      }
    },
    nagad: {
      success: {
        payment_ref_id: `REF-${Date.now()}`,
        status: 'Success',
        amount: '1050.00',
        invoice_no: `INV-${Date.now()}`
      },
      fail: {
        payment_ref_id: `REF-${Date.now()}`,
        status: 'Failed',
        error: 'Payment failed'
      },
      cancel: {
        payment_ref_id: `REF-${Date.now()}`,
        status: 'Cancelled'
      }
    }
  };

  return callbacks[gateway]?.[status] || {};
}

/**
 * Setup complete test environment
 */
async function setupTestEnvironment() {
  console.log('Setting up test environment...');

  // Create test users
  const testUser = await createTestUser();
  const testAdmin = await createTestAdmin();

  // Create test addresses
  const testAddress = await createTestAddress(testUser.id);

  // Create test orders
  const pendingOrder = await createTestOrderWithItems(testUser.id, testAddress.id);
  const paidOrder = await createTestOrderWithItems(testUser.id, testAddress.id);
  const failedOrder = await createTestOrderWithItems(testUser.id, testAddress.id);

  // Create payment transactions
  await createCompletedPaymentTransaction(paidOrder.id);
  await createFailedPaymentTransaction(failedOrder.id);

  // Setup payment gateway settings
  await setupPaymentGatewaySettings();

  console.log('Test environment setup complete!');

  return {
    testUser,
    testAdmin,
    testAddress,
    pendingOrder,
    paidOrder,
    failedOrder
  };
}

/**
 * Cleanup all test data
 */
async function cleanupTestData() {
  console.log('Cleaning up test data...');

  for (const cleanupFn of TEST_DATA.cleanup) {
    try {
      await cleanupFn();
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }

  // Clear arrays
  TEST_DATA.users.length = 0;
  TEST_DATA.orders.length = 0;
  TEST_DATA.addresses.length = 0;
  TEST_DATA.paymentTransactions.length = 0;
  TEST_DATA.cleanup.length = 0;

  console.log('Test data cleanup complete!');
}

/**
 * Get test data
 */
function getTestData() {
  return TEST_DATA;
}

module.exports = {
  createTestUser,
  createTestAdmin,
  createTestAddress,
  createTestProduct,
  createTestOrder,
  createTestOrderWithItems,
  setupPaymentGatewaySettings,
  createTestPaymentTransaction,
  createCompletedPaymentTransaction,
  createFailedPaymentTransaction,
  createRefundedPaymentTransaction,
  mockSSLCommerzResponse,
  mockBkashResponse,
  mockNagadResponse,
  mockPaymentCallback,
  setupTestEnvironment,
  cleanupTestData,
  getTestData
};
