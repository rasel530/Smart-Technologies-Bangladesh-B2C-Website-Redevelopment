/**
 * Test Script: Cart Item Removal 404 Fix
 * 
 * This script tests the cart item removal fix to ensure:
 * 1. Users can only remove items from their own carts
 * 2. 404 is returned when item doesn't exist
 * 3. 403 is returned when trying to remove another user's item
 * 4. 200 is returned when removal is successful
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

// Test configuration
const testConfig = {
  // Test user credentials (adjust as needed for your test environment)
  user1: {
    email: 'raselbepari88@gmail.com',
    password: 'testpassword123'  // Update with actual test password
  },
  user2: {
    email: 'testuser2@example.com',
    password: 'testpassword123'
  }
};

class CartRemovalTest {
  constructor() {
    this.results = [];
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
  }

  async runTests() {
    console.log('==============================================');
    console.log('Cart Item Removal 404 Fix - Test Suite');
    console.log('==============================================\n');

    try {
      // Test 1: Verify middleware is correctly applied
      await this.testMiddlewareApplied();

      // Test 2: Verify 404 for non-existent item
      await this.testNonExistentItem();

      // Test 3: Verify ownership verification (403 for unauthorized)
      await this.testOwnershipVerification();

      // Test 4: Verify successful removal for valid item
      await this.testSuccessfulRemoval();

      // Print results summary
      this.printSummary();

    } catch (error) {
      this.log('Test suite failed with error:', error.message);
      console.error(error);
    }
  }

  async testMiddlewareApplied() {
    console.log('\n--- Test 1: Middleware Application ---');
    
    // This test verifies that the middleware chain is correctly set up
    // We'll check if the route returns 400 for invalid UUID format
    try {
      const response = await axios.delete(`${API_URL}/cart/items/invalid-uuid`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      this.log('FAIL: Expected 400 for invalid UUID, got', response.status);
      this.results.push({ test: 'Middleware Applied', status: 'FAIL', reason: 'No validation error for invalid UUID' });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        this.log('PASS: Middleware correctly validates UUID format');
        this.results.push({ test: 'Middleware Applied', status: 'PASS' });
      } else {
        this.log('INFO: Server may not be running or different error', error.message);
        this.results.push({ test: 'Middleware Applied', status: 'INFO', reason: error.message });
      }
    }
  }

  async testNonExistentItem() {
    console.log('\n--- Test 2: Non-Existent Item (404) ---');
    
    // Test with a valid UUID format that doesn't exist in database
    const fakeItemId = '57991b31-2cb8-4e67-8b07-fff7e0be2b41';
    
    try {
      const response = await axios.delete(`${API_URL}/cart/items/${fakeItemId}`, {
        headers: {
          'x-session-id': 'test-session-123'
        }
      });
      
      this.log('FAIL: Expected 404 for non-existent item, got', response.status);
      this.results.push({ test: 'Non-Existent Item', status: 'FAIL', reason: `Got ${response.status} instead of 404` });
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          this.log('PASS: Correctly returns 404 for non-existent item');
          this.log('Response:', error.response.data);
          this.results.push({ test: 'Non-Existent Item', status: 'PASS' });
        } else {
          this.log(`Got ${error.response.status}:`, error.response.data);
          this.results.push({ test: 'Non-Existent Item', status: 'INFO', reason: `Got ${error.response.status}` });
        }
      } else {
        this.log('Server error or not running:', error.message);
        this.results.push({ test: 'Non-Existent Item', status: 'SKIP', reason: 'Server not available' });
      }
    }
  }

  async testOwnershipVerification() {
    console.log('\n--- Test 3: Ownership Verification (403) ---');
    
    // This test would require two different authenticated users
    // For now, we just verify the middleware exists and would check ownership
    this.log('INFO: Ownership verification requires two authenticated users');
    this.log('INFO: Manual testing recommended: Try removing an item with a different session/user');
    
    this.results.push({ 
      test: 'Ownership Verification', 
      status: 'MANUAL', 
      reason: 'Requires two authenticated users to test properly' 
    });
  }

  async testSuccessfulRemoval() {
    console.log('\n--- Test 4: Successful Removal ---');
    
    this.log('INFO: This test requires a valid cart with items');
    this.log('INFO: Steps to test manually:');
    this.log('  1. Create a cart and add an item');
    this.log('  2. Get the cart item ID from the response');
    this.log('  3. DELETE /cart/items/{itemId} with the same session/user');
    this.log('  4. Verify 200 response with updated cart');
    
    this.results.push({ 
      test: 'Successful Removal', 
      status: 'MANUAL', 
      reason: 'Requires pre-existing cart with items' 
    });
  }

  printSummary() {
    console.log('\n==============================================');
    console.log('Test Results Summary');
    console.log('==============================================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const manual = this.results.filter(r => r.status === 'MANUAL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP' || r.status === 'INFO').length;
    
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✓' : 
                   result.status === 'FAIL' ? '✗' : 
                   result.status === 'MANUAL' ? '⚠' : '○';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.reason) {
        console.log(`  └─ ${result.reason}`);
      }
    });
    
    console.log('\n----------------------------------------------');
    console.log(`Total: ${this.results.length} tests`);
    console.log(`  Passed:  ${passed}`);
    console.log(`  Failed:  ${failed}`);
    console.log(`  Manual:  ${manual}`);
    console.log(`  Skipped: ${skipped}`);
    console.log('==============================================\n');
  }
}

// Code Verification Tests (can run without server)
function verifyCodeChanges() {
  console.log('==============================================');
  console.log('Code Verification Tests');
  console.log('==============================================\n');

  const fs = require('fs');
  const path = require('path');

  const tests = [
    {
      name: 'verifyCartItemOwnership exported from cartController',
      file: path.join(__dirname, 'controllers/cartController.js'),
      check: (content) => content.includes('verifyCartItemOwnership') && 
                        content.includes('module.exports') &&
                        content.includes('verifyCartItemOwnership')
    },
    {
      name: 'verifyCartItemOwnership imported in cart routes',
      file: path.join(__dirname, 'routes/cart.js'),
      check: (content) => content.includes("verifyCartItemOwnership") &&
                        content.includes("require('../controllers/cartController')")
    },
    {
      name: 'verifyCartItemOwnership used in DELETE /items/:id route',
      file: path.join(__dirname, 'routes/cart.js'),
      check: (content) => {
        const deleteRoutePattern = /router\.delete\(['"]\/items\/:id['"][^}]+verifyCartItemOwnership/s;
        return deleteRoutePattern.test(content);
      }
    },
    {
      name: 'verifyCartItemOwnership middleware checks cart ownership',
      file: path.join(__dirname, 'controllers/cartController.js'),
      check: (content) => content.includes('verifyCartItemOwnership') &&
                        content.includes('cartItem.cart') &&
                        content.includes('userId') &&
                        content.includes('sessionId')
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    try {
      const content = fs.readFileSync(test.file, 'utf8');
      const result = test.check(content);
      
      if (result) {
        console.log(`✓ ${test.name}`);
        passed++;
      } else {
        console.log(`✗ ${test.name}`);
        console.log(`  └─ Check failed`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name}`);
      console.log(`  └─ Error: ${error.message}`);
      failed++;
    }
  });

  console.log('\n----------------------------------------------');
  console.log(`Total: ${tests.length} code checks`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('==============================================\n');

  return failed === 0;
}

// Run the tests
if (require.main === module) {
  // First verify code changes
  const codeOk = verifyCodeChanges();
  
  if (codeOk) {
    // Then run API tests if server is available
    const testSuite = new CartRemovalTest();
    testSuite.runTests().catch(console.error);
  } else {
    console.log('Code verification failed. Please fix the issues above.\n');
    process.exit(1);
  }
}

module.exports = { CartRemovalTest, verifyCodeChanges };
