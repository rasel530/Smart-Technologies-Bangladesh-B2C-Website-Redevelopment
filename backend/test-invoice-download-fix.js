/**
 * Test Invoice Download Fix
 * 
 * This test verifies that the invoice download endpoint works correctly
 * after fixing the Prisma client initialization issue.
 */

const request = require('supertest');
const express = require('express');
const { databaseService } = require('./services/database');
const orderConfirmationRoutes = require('./routes/orderConfirmation');
const authMiddleware = require('./middleware/auth');

// Create test app
const app = express();
app.use(express.json());

// Initialize database connection
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database connection...');
    await databaseService.connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Setup routes with authentication bypass for testing
app.use('/api/v1/orders', (req, res, next) => {
  // Mock authenticated user for testing
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'ADMIN'
  };
  next();
}, orderConfirmationRoutes);

// Test helper functions
async function createTestOrder() {
  const prisma = databaseService.getClient();
  
  try {
    // Create test user
    const user = await prisma.user.upsert({
      where: { email: 'invoice-test@example.com' },
      update: {},
      create: {
        email: 'invoice-test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
        phone: '+8801700000000',
        isEmailVerified: true,
        isPhoneVerified: true
      }
    });

    // Create test address
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801700000000',
        address: '123 Test Street',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        postalCode: '1000',
        country: 'Bangladesh'
      }
    });

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: 'Test Product for Invoice',
        sku: 'TEST-INV-001',
        regularPrice: 1000,
        salePrice: 900,
        description: 'Test product description',
        status: 'active',
        stock: 100
      }
    });

    // Create test order
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        addressId: address.id,
        orderNumber: `INV-TEST-${Date.now()}`,
        status: 'confirmed',
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'paid',
        subtotal: 900,
        tax: 90,
        shippingCost: 60,
        discount: 0,
        total: 1050,
        confirmedAt: new Date()
      }
    });

    // Create order item
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity: 1,
        unitPrice: 900,
        totalPrice: 900
      }
    });

    console.log(`✅ Test order created: ${order.id} (${order.orderNumber})`);
    return order;
  } catch (error) {
    console.error('❌ Failed to create test order:', error.message);
    throw error;
  }
}

async function generateInvoice(orderId) {
  const prisma = databaseService.getClient();
  
  try {
    // Check if invoice already exists
    const existingInvoice = await prisma.order_invoices.findFirst({
      where: { order_id: orderId }
    });

    if (existingInvoice) {
      console.log(`ℹ️ Invoice already exists: ${existingInvoice.id}`);
      return existingInvoice;
    }

    // Generate invoice number
    const invoiceNumber = `INV${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-TEST`;

    // Create invoice record
    const invoice = await prisma.order_invoices.create({
      data: {
        order_id: orderId,
        invoice_number: invoiceNumber,
        generated_at: new Date(),
        metadata: {
          test: true
        }
      }
    });

    console.log(`✅ Invoice generated: ${invoice.id} (${invoiceNumber})`);
    return invoice;
  } catch (error) {
    console.error('❌ Failed to generate invoice:', error.message);
    throw error;
  }
}

async function testInvoiceDownload(orderId, invoiceId) {
  try {
    console.log(`\n🧪 Testing invoice download endpoint...`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Invoice ID: ${invoiceId}`);

    const response = await request(app)
      .get(`/api/v1/orders/${orderId}/invoices/${invoiceId}/download`)
      .expect('Content-Type', /pdf/);

    console.log(`✅ Invoice download successful!`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    console.log(`   Content-Length: ${response.headers['content-length']} bytes`);
    
    return true;
  } catch (error) {
    console.error(`❌ Invoice download failed:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Body:`, error.response.body);
    }
    return false;
  }
}

async function testPrismaClientAccess() {
  const prisma = databaseService.getClient();
  
  console.log(`\n🔍 Testing Prisma client access...`);
  console.log(`   prisma exists: ${!!prisma}`);
  console.log(`   prisma type: ${typeof prisma}`);
  console.log(`   Has order_invoices: ${!!prisma.order_invoices}`);
  console.log(`   Has findFirst: ${typeof prisma.order_invoices?.findFirst === 'function'}`);
  
  if (!prisma || !prisma.order_invoices || typeof prisma.order_invoices.findFirst !== 'function') {
    console.error(`❌ Prisma client is not properly initialized!`);
    return false;
  }
  
  console.log(`✅ Prisma client is properly initialized`);
  return true;
}

// Main test execution
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  INVOICE DOWNLOAD FIX VERIFICATION TEST');
  console.log('═══════════════════════════════════════════════════════════\n');

  let testOrder = null;
  let testInvoice = null;
  let allTestsPassed = true;

  try {
    // Test 1: Database connection
    console.log('TEST 1: Database Connection');
    console.log('───────────────────────────────────────────────────────────────────');
    const dbConnected = await initializeDatabase();
    if (!dbConnected) {
      console.error('❌ Database connection test FAILED');
      allTestsPassed = false;
      return;
    }
    console.log('✅ Database connection test PASSED\n');

    // Test 2: Prisma client access
    console.log('TEST 2: Prisma Client Access');
    console.log('───────────────────────────────────────────────────────────────────');
    const prismaAccess = await testPrismaClientAccess();
    if (!prismaAccess) {
      console.error('❌ Prisma client access test FAILED');
      allTestsPassed = false;
      return;
    }
    console.log('✅ Prisma client access test PASSED\n');

    // Test 3: Create test order
    console.log('TEST 3: Create Test Order');
    console.log('───────────────────────────────────────────────────────────────────');
    testOrder = await createTestOrder();
    if (!testOrder) {
      console.error('❌ Test order creation FAILED');
      allTestsPassed = false;
      return;
    }
    console.log('✅ Test order creation PASSED\n');

    // Test 4: Generate invoice
    console.log('TEST 4: Generate Invoice');
    console.log('───────────────────────────────────────────────────────────────────');
    testInvoice = await generateInvoice(testOrder.id);
    if (!testInvoice) {
      console.error('❌ Invoice generation FAILED');
      allTestsPassed = false;
      return;
    }
    console.log('✅ Invoice generation PASSED\n');

    // Test 5: Download invoice
    console.log('TEST 5: Download Invoice');
    console.log('───────────────────────────────────────────────────────────────────');
    const downloadSuccess = await testInvoiceDownload(testOrder.id, testInvoice.id);
    if (!downloadSuccess) {
      console.error('❌ Invoice download test FAILED');
      allTestsPassed = false;
    }
    console.log('✅ Invoice download test PASSED\n');

  } catch (error) {
    console.error('\n❌ Test execution error:', error);
    console.error('Stack trace:', error.stack);
    allTestsPassed = false;
  } finally {
    // Cleanup
    console.log('TEST 6: Cleanup');
    console.log('───────────────────────────────────────────────────────────────────');
    
    try {
      if (testInvoice) {
        const prisma = databaseService.getClient();
        await prisma.order_invoices.deleteMany({
          where: { id: testInvoice.id }
        });
        console.log(`✅ Cleaned up test invoice: ${testInvoice.id}`);
      }
      
      if (testOrder) {
        const prisma = databaseService.getClient();
        await prisma.orderItem.deleteMany({
          where: { orderId: testOrder.id }
        });
        await prisma.order.delete({
          where: { id: testOrder.id }
        });
        console.log(`✅ Cleaned up test order: ${testOrder.id}`);
      }
    } catch (error) {
      console.error('⚠️  Cleanup error:', error.message);
    }

    // Disconnect database
    try {
      await databaseService.disconnect();
      console.log('✅ Database disconnected\n');
    } catch (error) {
      console.error('⚠️  Database disconnection error:', error.message);
    }
  }

  // Final results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('✅ Invoice download fix is working correctly!');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('❌ Invoice download fix needs further investigation');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Fatal error during test execution:', error);
  process.exit(1);
});
