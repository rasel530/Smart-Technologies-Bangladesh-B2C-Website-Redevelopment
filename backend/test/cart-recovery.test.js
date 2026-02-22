/**
 * Cart Recovery System Test Suite
 * Phase 6, Milestone 4 - Task 3
 * 
 * Tests all cart recovery functionality including:
 * - Recovery token generation
 * - Email sending
 * - Recovery via token
 * - Scheduled reminders
 * - Admin statistics
 */

const { PrismaClient } = require('@prisma/client');
const { cartRecoveryService } = require('../services/cartRecoveryService');
const { cartReminderService } = require('../services/cartReminderService');
const cartAnalyticsService = require('../services/cartAnalyticsService');

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  testEmail: 'test@example.com',
  testUserId: 'test-user-id',
  testCartId: null, // Will be created
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

// Test results accumulator
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Test helper functions
 */
async function setupTestData() {
  console.log('Setting up test data...');
  
  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: TEST_CONFIG.testEmail },
    update: {},
    create: {
      email: TEST_CONFIG.testEmail,
      name: 'Test Recovery User',
      password: 'test-password-hash'
    }
  });
  
  TEST_CONFIG.testUserId = testUser.id;
  
  // Create test cart
  const testCart = await prisma.cart.create({
    data: {
      userId: testUser.id,
      status: 'active',
      total: 25000,
      items: {
        create: [
          {
            productId: 'test-product-1',
            quantity: 2,
            price: 10000,
            total: 20000
          },
          {
            productId: 'test-product-2',
            quantity: 1,
            price: 5000,
            total: 5000
          }
        ]
      }
    }
  });
  
  TEST_CONFIG.testCartId = testCart.id;
  console.log(`✓ Test cart created: ${testCart.id}`);
  
  return { testUser, testCart };
}

async function cleanupTestData() {
  console.log('\nCleaning up test data...');
  
  // Clean up in correct order
  await prisma.cartRecoveryEvent.deleteMany({
    where: {
      cartId: TEST_CONFIG.testCartId
    }
  });
  
  await prisma.cartItem.deleteMany({
    where: {
      cartId: TEST_CONFIG.testCartId
    }
  });
  
  await prisma.cart.deleteMany({
    where: {
      id: TEST_CONFIG.testCartId
    }
  });
  
  await prisma.user.deleteMany({
    where: {
      email: TEST_CONFIG.testEmail
    }
  });
  
  console.log('✓ Test data cleaned up');
}

function recordTest(name, passed, error = null, details = {}) {
  testResults.tests.push({
    name,
    passed,
    error: error?.message || error,
    details,
    timestamp: new Date().toISOString()
  });
  
  if (passed) {
    testResults.passed++;
    console.log(`  ✓ ${name}`);
  } else {
    testResults.failed++;
    console.log(`  ✗ ${name}`);
    if (error) {
      console.log(`    Error: ${error.message || error}`);
    }
  }
}

/**
 * Test Suite: Recovery Token Generation
 */
async function testRecoveryTokenGeneration() {
  console.log('\n📋 Testing: Recovery Token Generation');
  
  try {
    const result = await cartRecoveryService.generateRecoveryToken(TEST_CONFIG.testCartId);
    
    recordTest('Token generation returns success', result.success === true, null, { token: result.token?.substring(0, 10) + '...' });
    recordTest('Token is generated', result.token && result.token.length > 20, null);
    recordTest('Token expiry is set', result.expiresAt instanceof Date || typeof result.expiresAt === 'string', null);
    recordTest('Recovery URL is generated', result.recoveryUrl && result.recoveryUrl.includes('/cart/recover/'), null);
    
    // Verify token in database
    const cart = await prisma.cart.findUnique({
      where: { id: TEST_CONFIG.testCartId }
    });
    
    recordTest('Token stored in database', cart.recoveryToken === result.token, null);
    recordTest('Token expiry stored', cart.recoveryTokenExpires !== null, null);
    
    return result.token;
  } catch (error) {
    recordTest('Token generation', false, error);
    return null;
  }
}

/**
 * Test Suite: Email Preparation
 */
async function testEmailPreparation(token) {
  console.log('\n📧 Testing: Email Preparation');
  
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: TEST_CONFIG.testCartId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    });
    
    const recoveryUrl = `${TEST_CONFIG.baseUrl}/cart/recover/${token}`;
    const emailData = await cartRecoveryService.prepareEmailData(cart, recoveryUrl, 'recovery', {
      discountCode: 'RECOVER10',
      discountPercentage: 10
    });
    
    recordTest('Email data prepared', !!emailData, null);
    recordTest('Email has cart items', emailData.items && emailData.items.length > 0, null);
    recordTest('Email has recovery URL', emailData.recoveryUrl && emailData.recoveryUrl.includes(token), null);
    recordTest('Email has customer name', emailData.customerName && emailData.customerName.length > 0, null);
    recordTest('Email has cart total', typeof emailData.cartTotal === 'number' && emailData.cartTotal > 0, null);
    recordTest('Email has discount code', emailData.discountCode === 'RECOVER10', null);
    recordTest('Email has bilingual content', emailData.bilingual, null);
    recordTest('Bilingual has English text', emailData.bilingual.en && emailData.bilingual.en.length > 0, null);
    recordTest('Bilingual has Bangla text', emailData.bilingual.bn && emailData.bilingual.bn.length > 0, null);
    
  } catch (error) {
    recordTest('Email preparation', false, error);
  }
}

/**
 * Test Suite: Token Validation
 */
async function testTokenValidation(token) {
  console.log('\n🔐 Testing: Token Validation');
  
  try {
    // Valid token
    const validResult = await cartRecoveryService.validateRecoveryToken(token);
    recordTest('Valid token validation', validResult.valid === true, null, { cartId: validResult.cart?.id });
    
    // Invalid token
    const invalidResult = await cartRecoveryService.validateRecoveryToken('invalid-token-12345');
    recordTest('Invalid token rejection', invalidResult.valid === false, null);
    recordTest('Invalid token has error message', !!invalidResult.error, null);
    
  } catch (error) {
    recordTest('Token validation', false, error);
  }
}

/**
 * Test Suite: Cart Recovery
 */
async function testCartRecovery(token) {
  console.log('\n🛒 Testing: Cart Recovery Process');
  
  try {
    const result = await cartRecoveryService.recoverCartViaToken(token, {
      userAgent: 'Test Agent',
      ipAddress: '127.0.0.1'
    });
    
    recordTest('Cart recovery successful', result.success === true, null, { cartId: result.cart?.id });
    recordTest('Recovery returns cart data', !!result.cart, null);
    recordTest('Recovery returns success message', !!result.message, null);
    
    // Verify cart status in database
    const cart = await prisma.cart.findUnique({
      where: { id: TEST_CONFIG.testCartId }
    });
    
    recordTest('Cart marked as recovered', cart.recoveredAt !== null, null);
    recordTest('Cart no longer abandoned', cart.abandonedAt === null, null);
    recordTest('Recovery token cleared', cart.recoveryToken === null, null);
    
  } catch (error) {
    recordTest('Cart recovery', false, error);
  }
}

/**
 * Test Suite: Abandoned Cart Processing
 */
async function testAbandonedCartProcessing() {
  console.log('\n⏰ Testing: Abandoned Cart Processing');
  
  try {
    // First, mark cart as abandoned again
    await cartRecoveryService.markCartAsAbandoned(TEST_CONFIG.testCartId, 'user_inactivity');
    
    const cart = await prisma.cart.findUnique({
      where: { id: TEST_CONFIG.testCartId }
    });
    
    recordTest('Cart marked as abandoned', cart.abandonedAt !== null, null);
    recordTest('Abandonment reason recorded', cart.abandonmentReason === 'user_inactivity', null);
    
    // Process abandoned carts
    const result = await cartRecoveryService.processAbandonedCarts({
      minInactiveMinutes: 0, // Process immediately for testing
      excludeRecentEmails: false
    });
    
    recordTest('Process abandoned carts runs', !!result, null);
    recordTest('Returns processed count', typeof result.processed === 'number', null);
    recordTest('Returns emails sent count', typeof result.emailsSent === 'number', null);
    
  } catch (error) {
    recordTest('Abandoned cart processing', false, error);
  }
}

/**
 * Test Suite: Recovery Statistics
 */
async function testRecoveryStatistics() {
  console.log('\n📊 Testing: Recovery Statistics');
  
  try {
    const stats = await cartAnalyticsService.getRecoveryStatistics(30);
    
    recordTest('Recovery statistics retrieved', !!stats, null);
    recordTest('Statistics has summary', !!stats.summary, null);
    recordTest('Summary has totalAbandoned', typeof stats.summary.totalAbandoned === 'number', null);
    recordTest('Summary has totalRecovered', typeof stats.summary.totalRecovered === 'number', null);
    recordTest('Summary has recoveryRate', typeof stats.summary.recoveryRate === 'number', null);
    recordTest('Summary has email metrics', typeof stats.summary.emailsSent === 'number', null);
    
    // Test daily stats
    const dailyStats = await cartAnalyticsService.getDailyRecoveryStats(7);
    recordTest('Daily stats retrieved', Array.isArray(dailyStats), null);
    recordTest('Daily stats has entries', dailyStats.length > 0, null);
    
    // Test template stats
    const templateStats = await cartAnalyticsService.getTemplateStats(30);
    recordTest('Template stats retrieved', Array.isArray(templateStats), null);
    
    // Test hourly stats
    const hourlyStats = await cartAnalyticsService.getHourlyStats(30);
    recordTest('Hourly stats retrieved', Array.isArray(hourlyStats) && hourlyStats.length === 24, null);
    
  } catch (error) {
    recordTest('Recovery statistics', false, error);
  }
}

/**
 * Test Suite: Reminder Service
 */
async function testReminderService() {
  console.log('\n🔔 Testing: Reminder Service');
  
  try {
    // Reset cart to abandoned state
    await prisma.cart.update({
      where: { id: TEST_CONFIG.testCartId },
      data: {
        abandonedAt: new Date(),
        recoveredAt: null,
        recoveryToken: null,
        reminderCount: 0,
        lastReminderAt: null
      }
    });
    
    // Schedule first reminder
    const scheduleResult = await cartReminderService.scheduleFirstReminder(TEST_CONFIG.testCartId, {
      discountCode: 'RECOVER5',
      discountPercentage: 5
    });
    
    recordTest('First reminder scheduled', scheduleResult.success === true, null);
    
    // Process due reminders (may not send if not due yet)
    const processResult = await cartReminderService.processDueReminders();
    recordTest('Process due reminders runs', !!processResult, null);
    
    // Cancel reminders
    const cancelResult = await cartReminderService.cancelReminders(TEST_CONFIG.testCartId);
    recordTest('Reminders cancelled', cancelResult.success === true, null);
    
  } catch (error) {
    recordTest('Reminder service', false, error);
  }
}

/**
 * Test Suite: Optimal Send Time
 */
async function testOptimalSendTime() {
  console.log('\n⏱️ Testing: Optimal Send Time Calculation');
  
  try {
    const optimalTime = await cartRecoveryService.calculateOptimalSendTime(TEST_CONFIG.testUserId);
    
    recordTest('Optimal time calculated', optimalTime instanceof Date, null);
    recordTest('Optimal time is in the future', optimalTime > new Date(), null);
    
  } catch (error) {
    recordTest('Optimal send time', false, error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('Cart Recovery System Test Suite');
  console.log('Phase 6, Milestone 4 - Task 3');
  console.log('='.repeat(60));
  
  let token = null;
  
  try {
    // Setup
    await setupTestData();
    
    // Run tests
    token = await testRecoveryTokenGeneration();
    
    if (token) {
      await testEmailPreparation(token);
      await testTokenValidation(token);
      await testCartRecovery(token);
    }
    
    await testAbandonedCartProcessing();
    await testRecoveryStatistics();
    await testReminderService();
    await testOptimalSendTime();
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    // Cleanup
    await cleanupTestData();
    await prisma.$disconnect();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.tests.length}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run tests
runTests();
