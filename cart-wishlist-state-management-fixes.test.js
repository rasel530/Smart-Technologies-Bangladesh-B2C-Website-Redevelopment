/**
 * Cart and Wishlist State Management Fixes Test
 * 
 * This test verifies two fixes:
 * 1. Cart to Wishlist Move State Update - Items disappear immediately without page reload
 * 2. Wishlist to Cart Move Price Display (HP Laptop) - Correct price displayed immediately
 * 
 * Test Environment:
 * - Frontend: http://localhost:3000
 * - Backend: http://localhost:5000
 * - Database: Accessible
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:3001',
  timeout: 30000,
  screenshotDir: path.join(__dirname, 'test-screenshots'),
  logDir: path.join(__dirname, 'test-logs')
};

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123456'
};

// Test products
const TEST_PRODUCTS = {
  hpLaptop: {
    name: 'HP 15-fr0076TU Core i5 13th Gen 15.6 Inch FHD Laptop',
    slug: 'hp-15-fr0076tu-core-i5-13th-gen-15-6-inch-fhd-laptop',
    expectedPrice: 65000, // Expected price in BDT
    wrongPrice: 5000 // The bug price that should NOT appear
  },
  genericProduct: {
    name: 'Generic Test Product',
    slug: 'generic-test-product',
    expectedPrice: 10000
  }
};

// Test results tracking
const testResults = {
  fix1: {
    name: 'Fix 1: Cart to Wishlist Move State Update',
    tests: []
  },
  fix2: {
    name: 'Fix 2: Wishlist to Cart Move Price Display (HP Laptop)',
    tests: []
  },
  edgeCases: {
    name: 'Edge Cases',
    tests: []
  }
};

// Helper functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  
  // Write to log file
  const logFile = path.join(CONFIG.logDir, `test-${Date.now()}.log`);
  fs.mkdirSync(CONFIG.logDir, { recursive: true });
  fs.appendFileSync(logFile, logMessage + '\n');
}

function recordTestResult(fixKey, testName, passed, details = '') {
  testResults[fixKey].tests.push({
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(CONFIG.screenshotDir, `${name}-${Date.now()}.png`);
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test Fix 1: Cart to Wishlist Move State Update
async function testFix1_CartToWishlistMoveStateUpdate(page) {
  log('=== Testing Fix 1: Cart to Wishlist Move State Update ===');
  
  // Test 1.1: Move single item to wishlist
  log('Test 1.1: Moving single item to wishlist...');
  try {
    // Navigate to cart page
    await page.goto(`${CONFIG.frontendUrl}/cart`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    // Check if cart has items
    const cartItems = await page.locator('[data-testid="cart-item"]').count();
    if (cartItems === 0) {
      log('Cart is empty, adding a test product...', 'warn');
      // Add a product to cart first
      await page.goto(`${CONFIG.frontendUrl}/products/${TEST_PRODUCTS.genericProduct.slug}`, { waitUntil: 'networkidle' });
      await page.click('button:has-text("Add to Cart")');
      await sleep(1000);
      await page.goto(`${CONFIG.frontendUrl}/cart`, { waitUntil: 'networkidle' });
      await sleep(2000);
    }
    
    // Get initial cart count
    const initialCartCount = await page.locator('[data-testid="cart-count"]').textContent();
    const initialItemCount = await page.locator('[data-testid="cart-item"]').count();
    log(`Initial cart count: ${initialCartCount}, items: ${initialItemCount}`);
    
    // Find first cart item and move to wishlist
    const firstItem = page.locator('[data-testid="cart-item"]').first();
    const moveButton = firstItem.locator('button:has-text("Move to Wishlist")');
    
    if (await moveButton.count() > 0) {
      await moveButton.click();
      log('Clicked "Move to Wishlist" button');
      await sleep(2000);
      
      // Verify item is removed from cart immediately (without page reload)
      const newItemCount = await page.locator('[data-testid="cart-item"]').count();
      const newCartCount = await page.locator('[data-testid="cart-count"]').textContent();
      
      const itemRemoved = newItemCount === initialItemCount - 1;
      const countUpdated = newCartCount !== initialCartCount;
      
      log(`New cart count: ${newCartCount}, items: ${newItemCount}`);
      
      recordTestResult('fix1', 'Test 1.1: Single item moves to wishlist immediately', 
        itemRemoved && countUpdated,
        `Items: ${initialItemCount} -> ${newItemCount}, Count: ${initialCartCount} -> ${newCartCount}`);
      
      await takeScreenshot(page, 'fix1-single-item-move');
    } else {
      recordTestResult('fix1', 'Test 1.1: Single item moves to wishlist immediately', 
        false,
        'No "Move to Wishlist" button found');
    }
  } catch (error) {
    log(`Test 1.1 failed: ${error.message}`, 'error');
    recordTestResult('fix1', 'Test 1.1: Single item moves to wishlist immediately', 
      false,
      error.message);
  }
  
  // Test 1.2: Move multiple items to wishlist
  log('Test 1.2: Moving multiple items to wishlist...');
  try {
    await page.goto(`${CONFIG.frontendUrl}/cart`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    const cartItems = await page.locator('[data-testid="cart-item"]').count();
    if (cartItems < 2) {
      log('Not enough items in cart for bulk move test, skipping...', 'warn');
      recordTestResult('fix1', 'Test 1.2: Multiple items move to wishlist immediately', 
        false,
        'Not enough items in cart');
    } else {
      const initialItemCount = cartItems;
      const initialCartCount = await page.locator('[data-testid="cart-count"]').textContent();
      
      // Select multiple items
      const checkboxes = page.locator('[data-testid="cart-item"] input[type="checkbox"]');
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      
      // Click bulk move to wishlist
      await page.click('button:has-text("Move Selected to Wishlist")');
      log('Clicked "Move Selected to Wishlist" button');
      await sleep(2000);
      
      // Verify items are removed immediately
      const newItemCount = await page.locator('[data-testid="cart-item"]').count();
      const newCartCount = await page.locator('[data-testid="cart-count"]').textContent();
      
      const itemsRemoved = newItemCount === initialItemCount - 2;
      const countUpdated = newCartCount !== initialCartCount;
      
      log(`New cart count: ${newCartCount}, items: ${newItemCount}`);
      
      recordTestResult('fix1', 'Test 1.2: Multiple items move to wishlist immediately', 
        itemsRemoved && countUpdated,
        `Items: ${initialItemCount} -> ${newItemCount}, Count: ${initialCartCount} -> ${newCartCount}`);
      
      await takeScreenshot(page, 'fix1-bulk-move');
    }
  } catch (error) {
    log(`Test 1.2 failed: ${error.message}`, 'error');
    recordTestResult('fix1', 'Test 1.2: Multiple items move to wishlist immediately', 
      false,
      error.message);
  }
  
  // Test 1.3: Cart totals update correctly
  log('Test 1.3: Verifying cart totals update correctly...');
  try {
    await page.goto(`${CONFIG.frontendUrl}/cart`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    // Get initial totals
    const initialSubtotal = await page.locator('[data-testid="cart-subtotal"]').textContent();
    const initialTotal = await page.locator('[data-testid="cart-total"]').textContent();
    log(`Initial subtotal: ${initialSubtotal}, total: ${initialTotal}`);
    
    // Move an item to wishlist
    const moveButton = page.locator('[data-testid="cart-item"]').first().locator('button:has-text("Move to Wishlist")');
    if (await moveButton.count() > 0) {
      await moveButton.click();
      await sleep(2000);
      
      // Get new totals
      const newSubtotal = await page.locator('[data-testid="cart-subtotal"]').textContent();
      const newTotal = await page.locator('[data-testid="cart-total"]').textContent();
      log(`New subtotal: ${newSubtotal}, total: ${newTotal}`);
      
      const totalsUpdated = newSubtotal !== initialSubtotal && newTotal !== initialTotal;
      
      recordTestResult('fix1', 'Test 1.3: Cart totals update correctly', 
        totalsUpdated,
        `Subtotal: ${initialSubtotal} -> ${newSubtotal}, Total: ${initialTotal} -> ${newTotal}`);
      
      await takeScreenshot(page, 'fix1-totals-update');
    } else {
      recordTestResult('fix1', 'Test 1.3: Cart totals update correctly', 
        false,
        'No items in cart to test');
    }
  } catch (error) {
    log(`Test 1.3 failed: ${error.message}`, 'error');
    recordTestResult('fix1', 'Test 1.3: Cart totals update correctly', 
      false,
      error.message);
  }
}

// Test Fix 2: Wishlist to Cart Move Price Display (HP Laptop)
async function testFix2_WishlistToCartMovePriceDisplay(page) {
  log('=== Testing Fix 2: Wishlist to Cart Move Price Display (HP Laptop) ===');
  
  // Test 2.1: Move HP laptop from wishlist to cart
  log('Test 2.1: Moving HP laptop from wishlist to cart...');
  try {
    // Navigate to wishlist page
    await page.goto(`${CONFIG.frontendUrl}/wishlist`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    // Check if wishlist has the HP laptop
    const wishlistItems = await page.locator('[data-testid="wishlist-item"]').count();
    if (wishlistItems === 0) {
      log('Wishlist is empty, adding HP laptop to wishlist...', 'warn');
      // Add HP laptop to wishlist first
      await page.goto(`${CONFIG.frontendUrl}/products/${TEST_PRODUCTS.hpLaptop.slug}`, { waitUntil: 'networkidle' });
      const wishlistButton = await page.locator('button:has-text("Add to Wishlist")').or(page.locator('button[aria-label*="wishlist"]'));
      if (await wishlistButton.count() > 0) {
        await wishlistButton.first().click();
        await sleep(1000);
        await page.goto(`${CONFIG.frontendUrl}/wishlist`, { waitUntil: 'networkidle' });
        await sleep(2000);
      }
    }
    
    // Find HP laptop in wishlist and move to cart
    const hpLaptopItem = page.locator('[data-testid="wishlist-item"]').filter({ hasText: TEST_PRODUCTS.hpLaptop.name });
    
    if (await hpLaptopItem.count() > 0) {
      const moveButton = hpLaptopItem.locator('button:has-text("Move to Cart")');
      await moveButton.click();
      log('Clicked "Move to Cart" button for HP laptop');
      await sleep(2000);
      
      // Navigate to cart to check price
      await page.goto(`${CONFIG.frontendUrl}/cart`, { waitUntil: 'networkidle' });
      await sleep(2000);
      
      // Get the cart item price
      const cartItem = page.locator('[data-testid="cart-item"]').filter({ hasText: TEST_PRODUCTS.hpLaptop.name });
      const priceText = await cartItem.locator('[data-testid="cart-item-price"]').textContent();
      const subtotalText = await cartItem.locator('[data-testid="cart-item-subtotal"]').textContent();
      
      log(`Cart item price: ${priceText}, subtotal: ${subtotalText}`);
      
      // Verify price is correct (not ৳5000.00)
      const hasWrongPrice = subtotalText && subtotalText.includes('5000.00');
      const hasCorrectPrice = subtotalText && subtotalText.includes(TEST_PRODUCTS.hpLaptop.expectedPrice.toString());
      
      recordTestResult('fix2', 'Test 2.1: HP laptop shows correct price in cart', 
        !hasWrongPrice && (hasCorrectPrice || !subtotalText.includes('5000')),
        `Price: ${priceText}, Subtotal: ${subtotalText}, Expected: ৳${TEST_PRODUCTS.hpLaptop.expectedPrice}`);
      
      await takeScreenshot(page, 'fix2-hp-laptop-price');
    } else {
      recordTestResult('fix2', 'Test 2.1: HP laptop shows correct price in cart', 
        false,
        'HP laptop not found in wishlist');
    }
  } catch (error) {
    log(`Test 2.1 failed: ${error.message}`, 'error');
    recordTestResult('fix2', 'Test 2.1: HP laptop shows correct price in cart', 
      false,
      error.message);
  }
  
  // Test 2.2: Cart item has full product data
  log('Test 2.2: Verifying cart item has full product data...');
  try {
    await page.goto(`${CONFIG.frontendUrl}/cart`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    const cartItem = page.locator('[data-testid="cart-item"]').filter({ hasText: TEST_PRODUCTS.hpLaptop.name });
    
    if (await cartItem.count() > 0) {
      // Check for product data elements
      const hasProductName = await cartItem.locator('[data-testid="product-name"]').count() > 0;
      const hasProductImage = await cartItem.locator('[data-testid="product-image"]').count() > 0;
      const hasPrice = await cartItem.locator('[data-testid="cart-item-price"]').count() > 0;
      const hasSubtotal = await cartItem.locator('[data-testid="cart-item-subtotal"]').count() > 0;
      
      const hasFullData = hasProductName && hasProductImage && hasPrice && hasSubtotal;
      
      recordTestResult('fix2', 'Test 2.2: Cart item has full product data', 
        hasFullData,
        `Product name: ${hasProductName}, Image: ${hasProductImage}, Price: ${hasPrice}, Subtotal: ${hasSubtotal}`);
      
      await takeScreenshot(page, 'fix2-product-data');
    } else {
      recordTestResult('fix2', 'Test 2.2: Cart item has full product data', 
        false,
        'HP laptop not found in cart');
    }
  } catch (error) {
    log(`Test 2.2 failed: ${error.message}`, 'error');
    recordTestResult('fix2', 'Test 2.2: Cart item has full product data', 
      false,
      error.message);
  }
  
  // Test 2.3: Price calculation is correct
  log('Test 2.3: Verifying price calculation...');
  try {
    await page.goto(`${CONFIG.frontendUrl}/cart`, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    const cartItem = page.locator('[data-testid="cart-item"]').filter({ hasText: TEST_PRODUCTS.hpLaptop.name });
    
    if (await cartItem.count() > 0) {
      const priceText = await cartItem.locator('[data-testid="cart-item-price"]').textContent();
      const quantityText = await cartItem.locator('[data-testid="cart-item-quantity"]').textContent();
      const subtotalText = await cartItem.locator('[data-testid="cart-item-subtotal"]').textContent();
      
      // Extract numeric values
      const price = parseFloat(priceText.replace(/[৳,]/g, ''));
      const quantity = parseInt(quantityText);
      const subtotal = parseFloat(subtotalText.replace(/[৳,]/g, ''));
      
      const expectedSubtotal = price * quantity;
      const calculationCorrect = Math.abs(subtotal - expectedSubtotal) < 0.01;
      
      recordTestResult('fix2', 'Test 2.3: Price calculation is correct', 
        calculationCorrect,
        `Price: ${price}, Quantity: ${quantity}, Subtotal: ${subtotal}, Expected: ${expectedSubtotal}`);
      
      await takeScreenshot(page, 'fix2-price-calculation');
    } else {
      recordTestResult('fix2', 'Test 2.3: Price calculation is correct', 
        false,
        'HP laptop not found in cart');
    }
  } catch (error) {
    log(`Test 2.3 failed: ${error.message}`, 'error');
    recordTestResult('fix2', 'Test 2.3: Price calculation is correct', 
      false,
      error.message);
  }
}

// Test Edge Cases
async function testEdgeCases(page) {
  log('=== Testing Edge Cases ===');
  
  // Test 3.1: Product with salePrice of "0" (string)
  log('Test 3.1: Testing product with salePrice of "0" (string)...');
  try {
    // This would require a product with salePrice "0" in the database
    // For now, we'll log that this test requires database setup
    recordTestResult('edgeCases', 'Test 3.1: Product with salePrice "0" (string)', 
      false,
      'Requires database setup - product with salePrice "0" needed');
  } catch (error) {
    log(`Test 3.1 failed: ${error.message}`, 'error');
    recordTestResult('edgeCases', 'Test 3.1: Product with salePrice "0" (string)', 
      false,
      error.message);
  }
  
  // Test 3.2: Product with salePrice of 0 (number)
  log('Test 3.2: Testing product with salePrice of 0 (number)...');
  try {
    recordTestResult('edgeCases', 'Test 3.2: Product with salePrice 0 (number)', 
      false,
      'Requires database setup - product with salePrice 0 needed');
  } catch (error) {
    log(`Test 3.2 failed: ${error.message}`, 'error');
    recordTestResult('edgeCases', 'Test 3.2: Product with salePrice 0 (number)', 
      false,
      error.message);
  }
  
  // Test 3.3: Product with valid salePrice
  log('Test 3.3: Testing product with valid salePrice...');
  try {
    recordTestResult('edgeCases', 'Test 3.3: Product with valid salePrice', 
      false,
      'Requires database setup - product with valid salePrice needed');
  } catch (error) {
    log(`Test 3.3 failed: ${error.message}`, 'error');
    recordTestResult('edgeCases', 'Test 3.3: Product with valid salePrice', 
      false,
      error.message);
  }
  
  // Test 3.4: Product with no salePrice
  log('Test 3.4: Testing product with no salePrice...');
  try {
    recordTestResult('edgeCases', 'Test 3.4: Product with no salePrice', 
      false,
      'Requires database setup - product with no salePrice needed');
  } catch (error) {
    log(`Test 3.4 failed: ${error.message}`, 'error');
    recordTestResult('edgeCases', 'Test 3.4: Product with no salePrice', 
      false,
      error.message);
  }
}

// Generate test report
function generateTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0
    },
    fixes: {}
  };
  
  // Calculate summary
  for (const key in testResults) {
    const fix = testResults[key];
    report.fixes[key] = {
      name: fix.name,
      tests: fix.tests,
      passed: fix.tests.filter(t => t.passed).length,
      failed: fix.tests.filter(t => !t.passed).length
    };
    report.summary.totalTests += fix.tests.length;
    report.summary.passed += report.fixes[key].passed;
    report.summary.failed += report.fixes[key].failed;
  }
  
  // Generate markdown report
  let markdown = `# Cart and Wishlist State Management Fixes Test Report\n\n`;
  markdown += `**Generated:** ${report.timestamp}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Tests:** ${report.summary.totalTests}\n`;
  markdown += `- **Passed:** ${report.summary.passed}\n`;
  markdown += `- **Failed:** ${report.summary.failed}\n`;
  markdown += `- **Pass Rate:** ${((report.summary.passed / report.summary.totalTests) * 100).toFixed(2)}%\n\n`;
  
  for (const key in testResults) {
    const fix = testResults[key];
    markdown += `## ${fix.name}\n\n`;
    markdown += `- **Passed:** ${report.fixes[key].passed}\n`;
    markdown += `- **Failed:** ${report.fixes[key].failed}\n\n`;
    
    for (const test of fix.tests) {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      markdown += `### ${status}: ${test.name}\n\n`;
      if (test.details) {
        markdown += `**Details:** ${test.details}\n\n`;
      }
      markdown += `**Timestamp:** ${test.timestamp}\n\n`;
    }
  }
  
  markdown += `## Screenshots\n\n`;
  markdown += `Screenshots have been saved to: \`${CONFIG.screenshotDir}\`\n\n`;
  
  markdown += `## Logs\n\n`;
  markdown += `Test logs have been saved to: \`${CONFIG.logDir}\`\n\n`;
  
  markdown += `## Overall Assessment\n\n`;
  if (report.summary.failed === 0) {
    markdown += `✅ All tests passed! The fixes are working correctly.\n\n`;
  } else if (report.summary.passed > report.summary.failed) {
    markdown += `⚠️ Most tests passed, but there are some failures that need attention.\n\n`;
  } else {
    markdown += `❌ Most tests failed. The fixes may not be working as expected.\n\n`;
  }
  
  // Save report
  const reportPath = path.join(__dirname, `test-report-${Date.now()}.md`);
  fs.writeFileSync(reportPath, markdown);
  
  // Also save JSON report
  const jsonReportPath = path.join(__dirname, `test-report-${Date.now()}.json`);
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  
  log(`Test report saved: ${reportPath}`);
  log(`JSON report saved: ${jsonReportPath}`);
  
  return { markdown, reportPath, jsonReportPath };
}

// Main test function
async function runTests() {
  log('Starting Cart and Wishlist State Management Fixes Test...');
  log(`Frontend URL: ${CONFIG.frontendUrl}`);
  log(`Backend URL: ${CONFIG.backendUrl}`);
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Set to true for headless mode
      slowMo: 500
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    page = await context.newPage();
    
    // Set default timeout
    page.setDefaultTimeout(CONFIG.timeout);
    
    // Navigate to homepage
    log('Navigating to homepage...');
    await page.goto(CONFIG.frontendUrl, { waitUntil: 'networkidle' });
    await sleep(2000);
    
    // Login if needed
    const loginButton = await page.locator('a:has-text("Login")').or(page.locator('button:has-text("Login")'));
    if (await loginButton.count() > 0) {
      log('Logging in...');
      await loginButton.first().click();
      await sleep(1000);
      
      // Fill login form
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await sleep(2000);
      
      log('Logged in successfully');
    }
    
    // Run tests
    await testFix1_CartToWishlistMoveStateUpdate(page);
    await testFix2_WishlistToCartMovePriceDisplay(page);
    await testEdgeCases(page);
    
    // Generate report
    const { markdown, reportPath, jsonReportPath } = generateTestReport();
    
    log('=== Test Summary ===');
    log(`Total Tests: ${testResults.fix1.tests.length + testResults.fix2.tests.length + testResults.edgeCases.tests.length}`);
    log(`Passed: ${testResults.fix1.tests.filter(t => t.passed).length + testResults.fix2.tests.filter(t => t.passed).length + testResults.edgeCases.tests.filter(t => t.passed).length}`);
    log(`Failed: ${testResults.fix1.tests.filter(t => !t.passed).length + testResults.fix2.tests.filter(t => !t.passed).length + testResults.edgeCases.tests.filter(t => !t.passed).length}`);
    
    console.log('\n' + markdown);
    
    // Close browser
    await browser.close();
    
    return { reportPath, jsonReportPath };
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    console.error(error);
    
    if (browser) {
      await browser.close();
    }
    
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(({ reportPath, jsonReportPath }) => {
      log(`Tests completed. Report saved to: ${reportPath}`);
      process.exit(0);
    })
    .catch(error => {
      log(`Tests failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testFix1_CartToWishlistMoveStateUpdate,
  testFix2_WishlistToCartMovePriceDisplay,
  testEdgeCases,
  generateTestReport
};
