/**
 * PRODUCT IMAGE UPLOAD - ADMIN AUTHORIZATION FIX TEST
 * 
 * This script specifically tests the fix for adminOnly() middleware
 * to verify it properly handles both legacy role and RBAC role systems.
 * 
 * Tests:
 * 1. Legacy admin user can upload images (role='ADMIN')
 * 2. RBAC admin user can upload images (rbacRole='admin')
 * 3. Non-admin user receives 403 (not 500)
 * 4. Error handling scenarios work correctly
 * 5. No 500 Internal Server Errors occur
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_PRODUCT_ID = '01d8b914-2213-4388-a24d-d547f20e29d6'; // Product ID from original error

// Test results tracking
const testResults = {
  middlewareFix: {
    name: 'Admin Authorization Fix for Product Image Upload',
    tests: [],
    passed: 0,
    failed: 0
  }
};

// Helper function to log test results
function logTest(category, testName, passed, message, details = {}) {
  const result = {
    testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults[category].tests.push(result);
  
  if (passed) {
    testResults[category].passed++;
    console.log(`✅ PASS [${category}] ${testName}`);
  } else {
    testResults[category].failed++;
    console.log(`❌ FAIL [${category}] ${testName}: ${message}`);
    if (Object.keys(details).length > 0) {
      console.log(`   Details:`, details);
    }
  }
}

// Helper function to create a test image file
function createTestImage(filename = 'test-product-image.jpg') {
  const testImagePath = path.join(__dirname, filename);
  if (!fs.existsSync(testImagePath)) {
    // Create a simple test image (1x1 pixel JPEG)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x01, 0xFF, 0xC0, 0x00,
      0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
      0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x09, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00,
      0x00, 0x3F, 0x00, 0x37, 0xFF, 0xD9
    ]);
    fs.writeFileSync(testImagePath, jpegHeader);
  }
  return testImagePath;
}

// Helper function to get auth token
async function getAuthToken(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.token || data.token;
    } else {
      const error = await response.json();
      console.log(`Login failed for ${email}:`, error);
    }
  } catch (error) {
    console.log(`Error logging in ${email}:`, error.message);
  }
  return null;
}

// Helper function to verify user role from database
async function verifyUserRole(email) {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    });
    
    if (user) {
      // Get RBAC roles
      const userRoles = await prisma.$queryRaw`
        SELECT r.name, r.hierarchy_level
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ${user.id}
        ORDER BY r.hierarchy_level DESC
        LIMIT 1
      `;
      
      return {
        ...user,
        rbacRole: userRoles.length > 0 ? userRoles[0].name : null,
        rbacRoleLevel: userRoles.length > 0 ? userRoles[0].hierarchy_level : 0
      };
    }
  } catch (error) {
    console.log('Error verifying user role:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  return null;
}

// Helper function to upload product image
async function uploadProductImage(productId, token, imagePath, altText = 'Test image') {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath), 'test-product.jpg');
    formData.append('alt', altText);
    
    const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    return {
      ok: response.ok,
      status: response.status,
      data: await response.json()
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

// ============================================
// TEST 1: VERIFY ADMIN ONLY MIDDLEWARE FIX
// ============================================
async function testAdminOnlyMiddlewareFix() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING ADMIN ONLY MIDDLEWARE FIX FOR PRODUCT IMAGE UPLOAD');
  console.log('='.repeat(80));
  
  const prisma = new PrismaClient();
  let testUsers = {
    legacyAdmin: null,
    rbacAdmin: null,
    nonAdmin: null
  };
  
  try {
    // Find or create test users
    console.log('\n[Setup] Finding/Creating test users...');
    
    // Check for legacy admin user
    testUsers.legacyAdmin = await prisma.user.findFirst({
      where: {
        role: 'admin',
        status: 'active'
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    if (testUsers.legacyAdmin) {
      console.log(`✓ Found legacy admin: ${testUsers.legacyAdmin.email}`);
    } else {
      console.log('⚠ No legacy admin user found');
    }
    
    // Check for RBAC admin user
    const rbacAdminUsers = await prisma.$queryRaw`
      SELECT u.id, u.email, u.role, r.role_name as rbac_role
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.role_name = 'admin' AND u.status = 'active'
      LIMIT 1
    `;
    
    if (rbacAdminUsers.length > 0) {
      testUsers.rbacAdmin = rbacAdminUsers[0];
      console.log(`✓ Found RBAC admin: ${testUsers.rbacAdmin.email}`);
    } else {
      console.log('⚠ No RBAC admin user found');
    }
    
    // Check for non-admin user
    testUsers.nonAdmin = await prisma.user.findFirst({
      where: {
        role: {
          not: 'ADMIN'
        },
        status: 'active'
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    if (testUsers.nonAdmin) {
      console.log(`✓ Found non-admin user: ${testUsers.nonAdmin.email}`);
    } else {
      console.log('⚠ No non-admin user found');
    }
    
    console.log();
    
    // Verify test product exists
    console.log('[Setup] Verifying test product exists...');
    const testProduct = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_ID },
      select: {
        id: true,
        name: true,
        sku: true
      }
    });
    
    if (testProduct) {
      console.log(`✓ Test product found: ${testProduct.name} (${testProduct.sku})`);
    } else {
      console.log(`⚠ Test product not found: ${TEST_PRODUCT_ID}`);
      console.log('   Tests will use a different product ID...');
      
      // Get any available product
      const anyProduct = await prisma.product.findFirst({
        select: {
          id: true,
          name: true,
          sku: true
        }
      });
      
      if (anyProduct) {
        console.log(`✓ Using alternative product: ${anyProduct.name} (${anyProduct.sku})`);
      }
    }
    console.log();
    
    // Test 1.1: Verify middleware implementation
    console.log('[Test 1.1] Verifying adminOnly() middleware implementation...');
    try {
      const authMiddlewarePath = path.join(__dirname, '../middleware/auth.js');
      const authContent = fs.readFileSync(authMiddlewarePath, 'utf8');
      
      const hasLegacyCheck = authContent.includes('req.user.role?.toUpperCase() === \'ADMIN\'');
      const hasRbacCheck = authContent.includes('req.user.rbacRole?.toLowerCase() === \'admin\'');
      const hasProperError = authContent.includes('error: \'Access denied\'');
      const has403Status = authContent.includes('status(403)');
      
      if (hasLegacyCheck && hasRbacCheck && hasProperError && has403Status) {
        logTest('middlewareFix', 'Middleware implementation check', true,
          'adminOnly() middleware properly checks both legacy and RBAC roles',
          {
            hasLegacyCheck,
            hasRbacCheck,
            hasProperError,
            has403Status
          });
      } else {
        logTest('middlewareFix', 'Middleware implementation check', false,
          'adminOnly() middleware is missing required checks',
          {
            hasLegacyCheck,
            hasRbacCheck,
            hasProperError,
            has403Status
          });
      }
    } catch (error) {
      logTest('middlewareFix', 'Middleware implementation check', false,
        `Error reading middleware file: ${error.message}`);
    }
    
    // Test 1.2: Test legacy admin user can upload images
    if (testUsers.legacyAdmin) {
      console.log(`\n[Test 1.2] Testing legacy admin user: ${testUsers.legacyAdmin.email}`);
      
      const userInfo = await verifyUserRole(testUsers.legacyAdmin.email);
      console.log(`   User role: ${userInfo.role}, RBAC role: ${userInfo.rbacRole || 'none'}`);
      
      const token = await getAuthToken(testUsers.legacyAdmin.email, 'admin123'); // Default password
      if (token) {
        const testImagePath = createTestImage('legacy-admin-test.jpg');
        const productId = testProduct ? testProduct.id : TEST_PRODUCT_ID;
        
        const result = await uploadProductImage(productId, token, testImagePath, 'Legacy admin test');
        
        if (result.ok && result.data.image) {
          logTest('middlewareFix', 'Legacy admin can upload images', true,
            'User with legacy role ADMIN can successfully upload product images',
            {
              status: result.status,
              imageId: result.data.image.id,
              imageUrl: result.data.image.url
            });
          
          // Clean up uploaded image
          try {
            await prisma.productImage.delete({
              where: { id: result.data.image.id }
            });
            const imagePath = path.join(__dirname, '..', 'uploads', 'products', result.data.image.url.split('/').pop());
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (cleanupError) {
            console.log('   Warning: Could not clean up test image');
          }
        } else if (result.status === 403) {
          logTest('middlewareFix', 'Legacy admin can upload images', false,
            'Legacy admin user received 403 Forbidden',
            { status: result.status, error: result.data });
        } else if (result.status === 500) {
          logTest('middlewareFix', 'Legacy admin can upload images', false,
            'CRITICAL: Legacy admin user received 500 Internal Server Error',
            { status: result.status, error: result.data });
        } else {
          logTest('middlewareFix', 'Legacy admin can upload images', false,
            `Unexpected status code: ${result.status}`,
            { status: result.status, error: result.data });
        }
      } else {
        logTest('middlewareFix', 'Legacy admin can upload images', false,
          'Could not authenticate legacy admin user',
          { email: testUsers.legacyAdmin.email });
      }
    } else {
      logTest('middlewareFix', 'Legacy admin can upload images', false,
        'No legacy admin user available for testing',
        {});
    }
    
    // Test 1.3: Test RBAC admin user can upload images
    if (testUsers.rbacAdmin) {
      console.log(`\n[Test 1.3] Testing RBAC admin user: ${testUsers.rbacAdmin.email}`);
      
      const userInfo = await verifyUserRole(testUsers.rbacAdmin.email);
      console.log(`   User role: ${userInfo.role}, RBAC role: ${userInfo.rbacRole || 'none'}`);
      
      const token = await getAuthToken(testUsers.rbacAdmin.email, 'admin123'); // Default password
      if (token) {
        const testImagePath = createTestImage('rbac-admin-test.jpg');
        const productId = testProduct ? testProduct.id : TEST_PRODUCT_ID;
        
        const result = await uploadProductImage(productId, token, testImagePath, 'RBAC admin test');
        
        if (result.ok && result.data.image) {
          logTest('middlewareFix', 'RBAC admin can upload images', true,
            'User with RBAC role admin can successfully upload product images',
            {
              status: result.status,
              imageId: result.data.image.id,
              imageUrl: result.data.image.url
            });
          
          // Clean up uploaded image
          try {
            await prisma.productImage.delete({
              where: { id: result.data.image.id }
            });
            const imagePath = path.join(__dirname, '..', 'uploads', 'products', result.data.image.url.split('/').pop());
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (cleanupError) {
            console.log('   Warning: Could not clean up test image');
          }
        } else if (result.status === 403) {
          logTest('middlewareFix', 'RBAC admin can upload images', false,
            'RBAC admin user received 403 Forbidden',
            { status: result.status, error: result.data });
        } else if (result.status === 500) {
          logTest('middlewareFix', 'RBAC admin can upload images', false,
            'CRITICAL: RBAC admin user received 500 Internal Server Error',
            { status: result.status, error: result.data });
        } else {
          logTest('middlewareFix', 'RBAC admin can upload images', false,
            `Unexpected status code: ${result.status}`,
            { status: result.status, error: result.data });
        }
      } else {
        logTest('middlewareFix', 'RBAC admin can upload images', false,
          'Could not authenticate RBAC admin user',
          { email: testUsers.rbacAdmin.email });
      }
    } else {
      logTest('middlewareFix', 'RBAC admin can upload images', false,
        'No RBAC admin user available for testing',
        {});
    }
    
    // Test 1.4: Test non-admin user receives 403 (not 500)
    if (testUsers.nonAdmin) {
      console.log(`\n[Test 1.4] Testing non-admin user: ${testUsers.nonAdmin.email}`);
      
      const userInfo = await verifyUserRole(testUsers.nonAdmin.email);
      console.log(`   User role: ${userInfo.role}, RBAC role: ${userInfo.rbacRole || 'none'}`);
      
      const token = await getAuthToken(testUsers.nonAdmin.email, 'user123'); // Default password
      if (token) {
        const testImagePath = createTestImage('non-admin-test.jpg');
        const productId = testProduct ? testProduct.id : TEST_PRODUCT_ID;
        
        const result = await uploadProductImage(productId, token, testImagePath, 'Non-admin test');
        
        if (result.status === 403) {
          logTest('middlewareFix', 'Non-admin receives 403 (not 500)', true,
            'Non-admin user correctly receives 403 Forbidden error',
            {
              status: result.status,
              error: result.data.error || result.data.message
            });
        } else if (result.status === 500) {
          logTest('middlewareFix', 'Non-admin receives 403 (not 500)', false,
            'CRITICAL: Non-admin user received 500 Internal Server Error instead of 403',
            { status: result.status, error: result.data });
        } else if (result.ok) {
          logTest('middlewareFix', 'Non-admin receives 403 (not 500)', false,
            'SECURITY ISSUE: Non-admin user was able to upload image',
            { status: result.status, data: result.data });
        } else {
          logTest('middlewareFix', 'Non-admin receives 403 (not 500)', false,
            `Unexpected status code: ${result.status}`,
            { status: result.status, error: result.data });
        }
      } else {
        logTest('middlewareFix', 'Non-admin receives 403 (not 500)', false,
          'Could not authenticate non-admin user',
          { email: testUsers.nonAdmin.email });
      }
    } else {
      logTest('middlewareFix', 'Non-admin receives 403 (not 500)', false,
        'No non-admin user available for testing',
        {});
    }
    
    // Test 1.5: Test error handling for invalid product ID
    console.log('\n[Test 1.5] Testing error handling for invalid product ID...');
    
    const adminToken = testUsers.legacyAdmin 
      ? await getAuthToken(testUsers.legacyAdmin.email, 'admin123')
      : (testUsers.rbacAdmin ? await getAuthToken(testUsers.rbacAdmin.email, 'admin123') : null);
    
    if (adminToken) {
      const testImagePath = createTestImage('invalid-product-test.jpg');
      const fakeProductId = '00000000-0000-0000-0000-000000000000';
      
      const result = await uploadProductImage(fakeProductId, adminToken, testImagePath, 'Invalid product test');
      
      if (result.status === 404) {
        logTest('middlewareFix', 'Error handling for invalid product ID', true,
          'Properly returns 404 for non-existent product',
          { status: result.status, error: result.data.error || result.data.message });
      } else if (result.status === 500) {
        logTest('middlewareFix', 'Error handling for invalid product ID', false,
          'CRITICAL: Received 500 for invalid product ID',
          { status: result.status, error: result.data });
      } else {
        logTest('middlewareFix', 'Error handling for invalid product ID', false,
          `Unexpected status code: ${result.status}`,
          { status: result.status, error: result.data });
      }
    } else {
      logTest('middlewareFix', 'Error handling for invalid product ID', false,
        'No admin token available for testing',
        {});
    }
    
    // Test 1.6: Test error handling for missing file
    console.log('\n[Test 1.6] Testing error handling for missing file...');
    
    if (adminToken) {
      try {
        const formData = new FormData();
        formData.append('alt', 'Test alt text');
        
        const productId = testProduct ? testProduct.id : TEST_PRODUCT_ID;
        
        const response = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          },
          body: formData
        });
        
        const data = await response.json();
        
        if (response.status === 400 && (data.error || data.message)) {
          logTest('middlewareFix', 'Error handling for missing file', true,
            'Properly returns 400 for missing file',
            { status: response.status, error: data.error || data.message });
        } else if (response.status === 500) {
          logTest('middlewareFix', 'Error handling for missing file', false,
            'CRITICAL: Received 500 for missing file',
            { status: response.status, error: data });
        } else {
          logTest('middlewareFix', 'Error handling for missing file', false,
            `Unexpected status code: ${response.status}`,
            { status: response.status, error: data });
        }
      } catch (error) {
        logTest('middlewareFix', 'Error handling for missing file', false,
          `Error: ${error.message}`,
          { error: error.message });
      }
    } else {
      logTest('middlewareFix', 'Error handling for missing file', false,
        'No admin token available for testing',
        {});
    }
    
    // Test 1.7: Verify no 500 errors occur in any scenario
    console.log('\n[Test 1.7] Verifying no 500 Internal Server Errors occur...');
    
    const has500Errors = testResults.middlewareFix.tests.some(test => 
      !test.passed && test.details && test.details.status === 500
    );
    
    if (!has500Errors) {
      logTest('middlewareFix', 'No 500 errors occur', true,
        'No 500 Internal Server Errors detected in any test scenario',
        {});
    } else {
      const failed500Tests = testResults.middlewareFix.tests.filter(test => 
        !test.passed && test.details && test.details.status === 500
      );
      
      logTest('middlewareFix', 'No 500 errors occur', false,
        `CRITICAL: ${failed500Tests.length} test(s) resulted in 500 errors`,
        { failedTests: failed500Tests.map(t => t.testName) });
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR DURING TEST EXECUTION:', error);
    logTest('middlewareFix', 'Test execution', false,
      `Fatal error: ${error.message}`,
      { error: error.message, stack: error.stack });
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// GENERATE TEST REPORT
// ============================================
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('PRODUCT IMAGE UPLOAD - ADMIN AUTHORIZATION FIX TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Test completed at: ${new Date().toISOString()}\n`);
  
  const category = testResults.middlewareFix;
  
  console.log(`${category.name}`);
  console.log('-'.repeat(80));
  console.log(`Tests Passed: ${category.passed}`);
  console.log(`Tests Failed: ${category.failed}`);
  console.log(`Total Tests: ${category.tests.length}`);
  console.log(`Success Rate: ${((category.passed / category.tests.length) * 100).toFixed(2)}%\n`);
  
  category.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.testName}`);
    if (!test.passed) {
      console.log(`   Message: ${test.message}`);
      if (Object.keys(test.details).length > 0) {
        console.log(`   Details:`, test.details);
      }
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('FIX VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  
  // Check critical tests
  const criticalTests = [
    'Middleware implementation check',
    'Legacy admin can upload images',
    'RBAC admin can upload images',
    'Non-admin receives 403 (not 500)',
    'No 500 errors occur'
  ];
  
  const criticalTestResults = category.tests.filter(test => 
    criticalTests.includes(test.testName)
  );
  
  const allCriticalPassed = criticalTestResults.every(test => test.passed);
  
  if (allCriticalPassed) {
    console.log('✅ ALL CRITICAL TESTS PASSED');
    console.log('✅ The adminOnly() middleware fix is working correctly');
    console.log('✅ Both legacy and RBAC admin users can upload images');
    console.log('✅ Non-admin users receive proper 403 errors (not 500)');
    console.log('✅ No 500 Internal Server Errors occur');
  } else {
    console.log('❌ SOME CRITICAL TESTS FAILED');
    console.log('❌ The adminOnly() middleware fix may not be working correctly');
    
    const failedCriticalTests = criticalTestResults.filter(test => !test.passed);
    failedCriticalTests.forEach(test => {
      console.log(`❌ ${test.testName}`);
    });
  }
  
  console.log('='.repeat(80));
  
  // Save report to file
  const reportPath = path.join(__dirname, 'product-image-upload-admin-fix-test-results.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPassed: category.passed,
      totalFailed: category.failed,
      totalTests: category.tests.length,
      successRate: ((category.passed / category.tests.length) * 100).toFixed(2) + '%',
      allCriticalPassed,
      criticalTestsPassed: criticalTestResults.filter(t => t.passed).length,
      criticalTestsTotal: criticalTestResults.length
    },
    tests: category.tests
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\nDetailed test report saved to: ${reportPath}`);
}

// ============================================
// MAIN TEST EXECUTION
// ============================================
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('PRODUCT IMAGE UPLOAD - ADMIN AUTHORIZATION FIX TEST');
  console.log('='.repeat(80));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Test Product ID: ${TEST_PRODUCT_ID}`);
  console.log(`Test Start Time: ${new Date().toISOString()}`);
  
  try {
    await testAdminOnlyMiddlewareFix();
    generateTestReport();
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR DURING TEST EXECUTION:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests().then(() => {
  console.log('\n' + '='.repeat(80));
  console.log('TEST EXECUTION COMPLETED');
  console.log('='.repeat(80));
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
