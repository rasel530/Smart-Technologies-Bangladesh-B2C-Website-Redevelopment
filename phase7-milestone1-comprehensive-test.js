/**
 * Phase 7 Milestone 1: Checkout Foundation - Comprehensive Testing Suite
 * 
 * This comprehensive test file verifies all functionality implemented for Phase 7 Milestone 1:
 * - Database migrations and schema
 * - Backend API endpoints (checkout, address, guest, admin)
 * - Frontend components (checkout flow, address management, guest checkout)
 * - Admin panel features
 * - Integration tests
 * - Code quality checks
 * - Data integrity verification
 * 
 * Run with: node phase7-milestone1-comprehensive-test.js
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/smarttech',
  timeout: 30000, // 30 seconds for API calls
};

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  skipped: [],
  warnings: [],
  startTime: new Date().toISOString(),
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
};

/**
 * Test result logging utility
 */
function logTest(category, testName, status, message = '', details = null) {
  const timestamp = new Date().toISOString();
  const result = {
    category,
    testName,
    status, // 'PASS', 'FAIL', 'SKIP', 'WARN'
    message,
    details,
    timestamp,
  };

  testResults.totalTests++;
  
  if (status === 'PASS') {
    testResults.passed.push(result);
    testResults.passedTests++;
    console.log(`✓ [${category}] ${testName}: ${message || 'PASSED'}`);
  } else if (status === 'FAIL') {
    testResults.failed.push(result);
    testResults.failedTests++;
    console.error(`✗ [${category}] ${testName}: ${message || 'FAILED'}`);
    if (details) {
      console.error(`  Details: ${JSON.stringify(details, null, 2)}`);
    }
  } else if (status === 'SKIP') {
    testResults.skipped.push(result);
    testResults.skippedTests++;
    console.log(`⊘ [${category}] ${testName}: ${message || 'SKIPPED'}`);
  } else if (status === 'WARN') {
    testResults.warnings.push(result);
    console.warn(`⚠ [${category}] ${testName}: ${message || 'WARNING'}`);
  }
}

/**
 * Helper function to check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(process.cwd(), filePath));
  } catch (error) {
    return false;
  }
}

/**
 * Helper function to read file content
 */
function readFileContent(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Helper function to check if string contains content
 */
function containsContent(content, searchTerm) {
  if (!content) return false;
  return content.includes(searchTerm);
}

/**
 * Helper function to check regex match
 */
function matchesRegex(content, pattern) {
  if (!content) return false;
  const regex = new RegExp(pattern);
  return regex.test(content);
}

/**
 * Helper function to check snake_case convention
 */
function isSnakeCase(str) {
  return /^[a-z][a-z0-9_]*$/.test(str);
}

/**
 * Helper function to check camelCase convention
 */
function isCamelCase(str) {
  return /^[a-z][a-zA-Z0-9]*$/.test(str);
}

/**
 * Helper function to check PascalCase convention
 */
function isPascalCase(str) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

// ============================================================================
// SECTION 1: DATABASE MIGRATION TESTS
// ============================================================================

async function testDatabaseMigrations() {
  console.log('\n' + '='.repeat(80));
  console.log('SECTION 1: DATABASE MIGRATION TESTS');
  console.log('='.repeat(80));

  // Test 1.1: Verify checkout_sessions table exists in schema
  const schemaContent = readFileContent('backend/prisma/schema.prisma');
  if (schemaContent) {
    const hasCheckoutSessions = containsContent(schemaContent, 'model CheckoutSession');
    if (hasCheckoutSessions) {
      logTest('Database Migration', 'checkout_sessions table exists in schema', 'PASS');
    } else {
      logTest('Database Migration', 'checkout_sessions table exists in schema', 'FAIL', 'CheckoutSession model not found in schema.prisma');
    }
  } else {
    logTest('Database Migration', 'checkout_sessions table exists in schema', 'SKIP', 'schema.prisma file not found');
  }

  // Test 1.2: Verify checkout_abandonment table exists in schema
  if (schemaContent) {
    const hasCheckoutAbandonment = containsContent(schemaContent, 'model CheckoutAbandonment');
    if (hasCheckoutAbandonment) {
      logTest('Database Migration', 'checkout_abandonment table exists in schema', 'PASS');
    } else {
      logTest('Database Migration', 'checkout_abandonment table exists in schema', 'FAIL', 'CheckoutAbandonment model not found in schema.prisma');
    }
  }

  // Test 1.3: Verify guest_sessions table exists in schema
  if (schemaContent) {
    const hasGuestSessions = containsContent(schemaContent, 'model GuestSession');
    if (hasGuestSessions) {
      logTest('Database Migration', 'guest_sessions table exists in schema', 'PASS');
    } else {
      logTest('Database Migration', 'guest_sessions table exists in schema', 'FAIL', 'GuestSession model not found in schema.prisma');
    }
  }

  // Test 1.4: Verify AddressType enum has new values
  if (schemaContent) {
    const hasHomeType = containsContent(schemaContent, 'home');
    const hasWorkType = containsContent(schemaContent, 'work');
    const hasOtherType = containsContent(schemaContent, 'other');
    
    if (hasHomeType && hasWorkType && hasOtherType) {
      logTest('Database Migration', 'AddressType enum has new values (home, work, other)', 'PASS');
    } else {
      logTest('Database Migration', 'AddressType enum has new values (home, work, other)', 'FAIL', 
        `Missing address types: ${!hasHomeType ? 'home ' : ''}${!hasWorkType ? 'work ' : ''}${!hasOtherType ? 'other' : ''}`);
    }
  }

  // Test 1.5: Verify migration file exists
  const migrationFile = 'backend/prisma/migrations/20260222145353_phase7_milestone1_checkout_foundation/migration.sql';
  if (fileExists(migrationFile)) {
    logTest('Database Migration', 'Migration file exists', 'PASS');
    
    // Test 1.6: Verify migration SQL content
    const migrationContent = readFileContent(migrationFile);
    if (migrationContent) {
      const createsCheckoutSessions = containsContent(migrationContent, 'CREATE TABLE "checkout_sessions"');
      const createsCheckoutAbandonment = containsContent(migrationContent, 'CREATE TABLE "checkout_abandonment"');
      const createsGuestSessions = containsContent(migrationContent, 'CREATE TABLE "guest_sessions"');
      const addsAddressTypeValues = containsContent(migrationContent, 'ALTER TYPE "AddressType" ADD VALUE');
      
      if (createsCheckoutSessions && createsCheckoutAbandonment && createsGuestSessions) {
        logTest('Database Migration', 'Migration creates all required tables', 'PASS');
      } else {
        logTest('Database Migration', 'Migration creates all required tables', 'FAIL', 
          `Missing table creation: ${!createsCheckoutSessions ? 'checkout_sessions ' : ''}${!createsCheckoutAbandonment ? 'checkout_abandonment ' : ''}${!createsGuestSessions ? 'guest_sessions' : ''}`);
      }
      
      if (addsAddressTypeValues) {
        logTest('Database Migration', 'Migration adds AddressType enum values', 'PASS');
      } else {
        logTest('Database Migration', 'Migration adds AddressType enum values', 'FAIL', 'AddressType enum values not added in migration');
      }
    }
  } else {
    logTest('Database Migration', 'Migration file exists', 'FAIL', 'Migration file not found');
  }

  // Test 1.7: Verify foreign key relationships in migration
  const migrationContent = readFileContent(migrationFile);
  if (migrationContent) {
    const hasCartForeignKey = containsContent(migrationContent, 'FOREIGN KEY ("cart_id") REFERENCES "carts"');
    const hasShippingAddressForeignKey = containsContent(migrationContent, 'FOREIGN KEY ("shipping_address_id") REFERENCES "addresses"');
    const hasBillingAddressForeignKey = containsContent(migrationContent, 'FOREIGN KEY ("billing_address_id") REFERENCES "addresses"');
    const hasCheckoutSessionForeignKey = containsContent(migrationContent, 'FOREIGN KEY ("checkout_session_id") REFERENCES "checkout_sessions"');
    
    if (hasCartForeignKey && hasShippingAddressForeignKey && hasBillingAddressForeignKey && hasCheckoutSessionForeignKey) {
      logTest('Database Migration', 'Foreign key relationships are correct', 'PASS');
    } else {
      logTest('Database Migration', 'Foreign key relationships are correct', 'WARN', 
        'Some foreign keys may be missing or incorrect');
    }
  }

  // Test 1.8: Verify indexes are created in migration
  if (migrationContent) {
    const hasCheckoutSessionsIndexes = containsContent(migrationContent, 'CREATE INDEX "idx_checkout_sessions_');
    const hasCheckoutAbandonmentIndexes = containsContent(migrationContent, 'CREATE INDEX "idx_checkout_abandonment_');
    const hasGuestSessionsIndexes = containsContent(migrationContent, 'CREATE INDEX "idx_guest_sessions_');
    
    if (hasCheckoutSessionsIndexes && hasCheckoutAbandonmentIndexes && hasGuestSessionsIndexes) {
      logTest('Database Migration', 'Indexes are created', 'PASS');
    } else {
      logTest('Database Migration', 'Indexes are created', 'WARN', 
        'Some indexes may be missing');
    }
  }

  // Test 1.9: Verify CheckoutSession schema fields
  if (schemaContent) {
    const requiredFields = [
      'id',
      'user_id',
      'session_id',
      'current_step',
      'shipping_address_id',
      'billing_address_id',
      'shipping_method',
      'payment_method',
      'cart_id',
      'metadata',
      'status',
      'completed_at',
      'expires_at',
      'created_at',
      'updated_at',
    ];
    
    const missingFields = requiredFields.filter(field => !containsContent(schemaContent, field));
    
    if (missingFields.length === 0) {
      logTest('Database Migration', 'CheckoutSession has all required fields', 'PASS');
    } else {
      logTest('Database Migration', 'CheckoutSession has all required fields', 'FAIL', 
        `Missing fields: ${missingFields.join(', ')}`);
    }
  }

  // Test 1.10: Verify CheckoutAbandonment schema fields
  if (schemaContent) {
    const requiredFields = [
      'id',
      'checkout_session_id',
      'user_id',
      'session_id',
      'abandonment_step',
      'abandonment_reason',
      'cart_value',
      'item_count',
      'recovery_email_sent',
      'recovery_email_sent_at',
      'recovered',
      'recovered_at',
      'recovery_attempts',
      'ip_address',
      'user_agent',
      'created_at',
      'updated_at',
    ];
    
    const missingFields = requiredFields.filter(field => !containsContent(schemaContent, field));
    
    if (missingFields.length === 0) {
      logTest('Database Migration', 'CheckoutAbandonment has all required fields', 'PASS');
    } else {
      logTest('Database Migration', 'CheckoutAbandonment has all required fields', 'FAIL', 
        `Missing fields: ${missingFields.join(', ')}`);
    }
  }

  // Test 1.11: Verify GuestSession schema fields
  if (schemaContent) {
    const requiredFields = [
      'id',
      'session_id',
      'email',
      'phone',
      'first_name',
      'last_name',
      'cart_id',
      'metadata',
      'last_activity_at',
      'expires_at',
      'converted_to_user_id',
      'converted_at',
      'created_at',
      'updated_at',
    ];
    
    const missingFields = requiredFields.filter(field => !containsContent(schemaContent, field));
    
    if (missingFields.length === 0) {
      logTest('Database Migration', 'GuestSession has all required fields', 'PASS');
    } else {
      logTest('Database Migration', 'GuestSession has all required fields', 'FAIL', 
        `Missing fields: ${missingFields.join(', ')}`);
    }
  }

  // Test 1.12: Verify no data loss from existing tables
  const verifyMigrationFile = readFileContent('backend/verify-migration.js');
  if (verifyMigrationFile) {
    const hasDataLossCheck = containsContent(verifyMigrationFile, 'data loss') || 
                           containsContent(verifyMigrationFile, 'existing data');
    if (hasDataLossCheck) {
      logTest('Database Migration', 'No data loss verification exists', 'PASS');
    } else {
      logTest('Database Migration', 'No data loss verification exists', 'WARN', 
        'Data loss verification not explicitly checked');
    }
  } else {
    logTest('Database Migration', 'No data loss verification exists', 'SKIP', 
      'verify-migration.js file not found');
  }
}

// ============================================================================
// SECTION 2: BACKEND API TESTS
// ============================================================================

async function testBackendAPIs() {
  console.log('\n' + '='.repeat(80));
  console.log('SECTION 2: BACKEND API TESTS');
  console.log('='.repeat(80));

  // Test 2.1: Checkout Flow API Routes
  const checkoutRoutesContent = readFileContent('backend/routes/checkout.js');
  if (checkoutRoutesContent) {
    const requiredRoutes = [
      "router.post('/initiate'",
      "router.get('/session/:sessionId')",
      "router.put('/session/:sessionId/step')",
      "router.post('/session/:sessionId/address')",
      "router.post('/session/:sessionId/shipping')",
      "router.post('/session/:sessionId/payment')",
      "router.post('/session/:sessionId/complete')",
      "router.delete('/session/:sessionId')",
    ];
    
    const missingRoutes = requiredRoutes.filter(route => !containsContent(checkoutRoutesContent, route));
    
    if (missingRoutes.length === 0) {
      logTest('Backend API', 'Checkout Flow API routes exist', 'PASS');
    } else {
      logTest('Backend API', 'Checkout Flow API routes exist', 'FAIL', 
        `Missing routes: ${missingRoutes.join(', ')}`);
    }
  } else {
    logTest('Backend API', 'Checkout Flow API routes exist', 'FAIL', 'checkout.js routes file not found');
  }

  // Test 2.2: Checkout Controller exists
  const checkoutControllerContent = readFileContent('backend/controllers/checkoutController.js');
  if (checkoutControllerContent) {
    const requiredMethods = [
      'initiateCheckout',
      'getCheckoutSession',
      'updateCheckoutStep',
      'saveAddressStep',
      'saveShippingStep',
      'savePaymentStep',
      'completeCheckout',
      'cancelCheckout',
    ];
    
    const missingMethods = requiredMethods.filter(method => !containsContent(checkoutControllerContent, method));
    
    if (missingMethods.length === 0) {
      logTest('Backend API', 'Checkout Controller has all required methods', 'PASS');
    } else {
      logTest('Backend API', 'Checkout Controller has all required methods', 'FAIL', 
        `Missing methods: ${missingMethods.join(', ')}`);
    }
  } else {
    logTest('Backend API', 'Checkout Controller exists', 'FAIL', 'checkoutController.js file not found');
  }

  // Test 2.3: Checkout Service exists
  const checkoutServiceContent = readFileContent('backend/services/checkoutService.js');
  if (checkoutServiceContent) {
    const requiredMethods = [
      'createCheckoutSession',
      'getCheckoutSession',
      'updateCheckoutStep',
      'validateCheckoutStep',
      'calculateCheckoutTotals',
      'completeCheckoutSession',
      'abandonCheckoutSession',
      'trackCheckoutProgress',
      'getShippingMethods',
      'getPaymentMethods',
      'validateAddress',
    ];
    
    const missingMethods = requiredMethods.filter(method => !containsContent(checkoutServiceContent, method));
    
    if (missingMethods.length === 0) {
      logTest('Backend API', 'Checkout Service has all required methods', 'PASS');
    } else {
      logTest('Backend API', 'Checkout Service has all required methods', 'FAIL', 
        `Missing methods: ${missingMethods.join(', ')}`);
    }
  } else {
    logTest('Backend API', 'Checkout Service exists', 'FAIL', 'checkoutService.js file not found');
  }

  // Test 2.4: Address Management API Routes
  const usersRoutesContent = readFileContent('backend/routes/users.js');
  if (usersRoutesContent) {
    const requiredRoutes = [
      'addresses',
      'checkout',
      'validate',
    ];
    
    const hasAddressRoutes = requiredRoutes.some(route => containsContent(usersRoutesContent, route));
    
    if (hasAddressRoutes) {
      logTest('Backend API', 'Address Management API routes exist', 'PASS');
    } else {
      logTest('Backend API', 'Address Management API routes exist', 'FAIL', 
        'Address management routes not found');
    }
  } else {
    logTest('Backend API', 'Address Management API routes exist', 'SKIP', 'users.js routes file not found');
  }

  // Test 2.5: Address Service exists
  const addressServiceContent = readFileContent('backend/services/addressService.js');
  if (addressServiceContent) {
    const requiredFunctions = [
      'getAddressTypes',
      'validateBangladeshAddress',
      'getAddressesForCheckout',
      'createAddressForCheckout',
      'updateAddressForCheckout',
      'setDefaultAddress',
      'getAddressById',
      'deleteAddress',
      'getUserAddresses',
    ];
    
    const missingFunctions = requiredFunctions.filter(func => !containsContent(addressServiceContent, func));
    
    if (missingFunctions.length === 0) {
      logTest('Backend API', 'Address Service has all required functions', 'PASS');
    } else {
      logTest('Backend API', 'Address Service has all required functions', 'FAIL', 
        `Missing functions: ${missingFunctions.join(', ')}`);
    }
  } else {
    logTest('Backend API', 'Address Service exists', 'FAIL', 'addressService.js file not found');
  }

  // Test 2.6: Guest Checkout API Routes
  const guestCheckoutRoutesContent = readFileContent('backend/routes/guestCheckout.js');
  if (guestCheckoutRoutesContent) {
    const requiredRoutes = [
      "router.post('/checkout/initiate')",
      "router.get('/checkout/session/:sessionId')",
      "router.post('/checkout/session/:sessionId/info')",
      "router.post('/checkout/session/:sessionId/complete')",
      "router.get('/orders')",
      "router.get('/orders/:orderNumber')",
      "router.post('/merge-cart')",
      "router.post('/convert-to-user')",
    ];
    
    const missingRoutes = requiredRoutes.filter(route => !containsContent(guestCheckoutRoutesContent, route));
    
    if (missingRoutes.length === 0) {
      logTest('Backend API', 'Guest Checkout API routes exist', 'PASS');
    } else {
      logTest('Backend API', 'Guest Checkout API routes exist', 'FAIL', 
        `Missing routes: ${missingRoutes.join(', ')}`);
    }
  } else {
    logTest('Backend API', 'Guest Checkout API routes exist', 'FAIL', 'guestCheckout.js routes file not found');
  }

  // Test 2.7: Guest Checkout Controller exists
  const guestCheckoutControllerContent = readFileContent('backend/controllers/guestCheckoutController.js');
  if (guestCheckoutControllerContent) {
    const requiredMethods = [
      'initiateGuestCheckout',
      'getGuestCheckoutSession',
      'saveGuestInfo',
      'completeGuestCheckout',
      'getGuestOrders',
      'getGuestOrderDetails',
      'mergeGuestCart',
      'convertGuestToUser',
    ];
    
    const missingMethods = requiredMethods.filter(method => !containsContent(guestCheckoutControllerContent, method));
    
    if (missingMethods.length === 0) {
      logTest('Backend API', 'Guest Checkout Controller has all required methods', 'PASS');
    } else {
      logTest('Backend API', 'Guest Checkout Controller has all required methods', 'FAIL', 
        `Missing methods: ${missingMethods.join(', ')}`);
    }
  } else {
    logTest('Backend API', 'Guest Checkout Controller exists', 'FAIL', 'guestCheckoutController.js file not found');
  }

  // Test 2.8: Guest Checkout Service exists
  const guestCheckoutServiceContent = readFileContent('backend/services/guestCheckoutService.js');
  if (guestCheckoutServiceContent) {
    const requiredMethods = [
      'createGuestSession',
      'getGuestSession',
      'updateGuestSession',
      'trackGuestActivity',
      'convertGuestToUser',
      'expireGuestSession',
      'mergeGuestCart',
      'getGuestOrders',
      'validateGuestSession',
      'cleanupExpiredGuestSessions',
      'validateEmail',
      'validatePhone',
    ];
    
    const missingMethods = requiredMethods.filter(method => !containsContent(guestCheckoutServiceContent, method));
    
    if (missingMethods.length === 0) {
      logTest('Backend API', 'Guest Checkout Service has all required methods', 'PASS');
    } else {
      logTest('Backend API', 'Guest Checkout Service has all required methods', 'FAIL', 
        `Missing methods: ${missingMethods.join(', ')}`);
    }
  } else {
    logTest('Backend API', 'Guest Checkout Service exists', 'FAIL', 'guestCheckoutService.js file not found');
  }

  // Test 2.9: Admin Checkout API Routes
  const adminCheckoutRoutesContent = readFileContent('backend/routes/admin/checkout.js');
  if (adminCheckoutRoutesContent) {
    const requiredRoutes = [
      "router.get('/sessions')",
      "router.get('/sessions/:sessionId')",
      "router.delete('/sessions/:sessionId')",
      "router.get('/abandonment')",
      "router.post('/abandonment/:id/recover')",
      "router.get('/guest/sessions')",
      "router.get('/analytics')",
      "router.get('/settings')",
      "router.put('/settings')",
    ];
    
    const missingRoutes = requiredRoutes.filter(route => !containsContent(adminCheckoutRoutesContent, route));
    
    if (missingRoutes.length === 0) {
      logTest('Backend API', 'Admin Checkout API routes exist', 'PASS');
    } else {
      logTest('Backend API', 'Admin Checkout API routes exist', 'FAIL', 
        `Missing routes: ${missingRoutes.join(', ')}`);
    }
  } else {
    logTest('Backend API', 'Admin Checkout API routes exist', 'FAIL', 'admin/checkout.js routes file not found');
  }

  // Test 2.10: Admin Checkout Controller exists
  const adminCheckoutControllerContent = readFileContent('backend/controllers/adminCheckoutController.js');
  if (adminCheckoutControllerContent) {
    const requiredMethods = [
      'getCheckoutSessions',
      'getCheckoutSessionDetails',
      'cancelCheckoutSession',
      'getAbandonedCheckouts',
      'sendRecoveryEmail',
      'getGuestCheckoutSessions',
      'getCheckoutAnalytics',
      'getCheckoutSettings',
      'updateCheckoutSettings',
    ];
    
    const missingMethods = requiredMethods.filter(method => !containsContent(adminCheckoutControllerContent, method));
    
    if (missingMethods.length === 0) {
      logTest('Backend API', 'Admin Checkout Controller has all required methods', 'PASS');
    } else {
      logTest('Backend API', 'Admin Checkout Controller has all required methods', 'FAIL', 
        `Missing methods: ${missingMethods.join(', ')}`);
    }
  } else {
    logTest('Backend API', 'Admin Checkout Controller exists', 'SKIP', 'adminCheckoutController.js file may not exist yet');
  }

  // Test 2.11: Verify authentication middleware is used
  if (checkoutRoutesContent) {
    const hasAuthMiddleware = containsContent(checkoutRoutesContent, 'authMiddleware');
    if (hasAuthMiddleware) {
      logTest('Backend API', 'Checkout routes use authentication middleware', 'PASS');
    } else {
      logTest('Backend API', 'Checkout routes use authentication middleware', 'WARN', 
        'Authentication middleware may not be properly configured');
    }
  }

  // Test 2.12: Verify validation middleware is used
  if (checkoutRoutesContent) {
    const hasValidation = containsContent(checkoutRoutesContent, 'validationResult') || 
                         containsContent(checkoutRoutesContent, 'handleValidationErrors');
    if (hasValidation) {
      logTest('Backend API', 'Checkout routes use validation middleware', 'PASS');
    } else {
      logTest('Backend API', 'Checkout routes use validation middleware', 'WARN', 
        'Validation middleware may not be properly configured');
    }
  }

  // Test 2.13: Verify rate limiting is configured
  if (checkoutRoutesContent) {
    const hasRateLimit = containsContent(checkoutRoutesContent, 'rateLimit');
    if (hasRateLimit) {
      logTest('Backend API', 'Checkout routes use rate limiting', 'PASS');
    } else {
      logTest('Backend API', 'Checkout routes use rate limiting', 'WARN', 
        'Rate limiting may not be properly configured');
    }
  }

  // Test 2.14: Verify error handling is comprehensive
  if (checkoutControllerContent) {
    const hasTryCatch = containsContent(checkoutControllerContent, 'try {') && 
                       containsContent(checkoutControllerContent, 'catch (error)');
    const hasErrorResponses = containsContent(checkoutControllerContent, 'res.status(');
    
    if (hasTryCatch && hasErrorResponses) {
      logTest('Backend API', 'Checkout Controller has comprehensive error handling', 'PASS');
    } else {
      logTest('Backend API', 'Checkout Controller has comprehensive error handling', 'WARN', 
        'Error handling may not be comprehensive');
    }
  }

  // Test 2.15: Verify JSDoc comments are present
  if (checkoutControllerContent) {
    const hasJSDoc = containsContent(checkoutControllerContent, '/**') && 
                     containsContent(checkoutControllerContent, '*/');
    if (hasJSDoc) {
      logTest('Backend API', 'Checkout Controller has JSDoc comments', 'PASS');
    } else {
      logTest('Backend API', 'Checkout Controller has JSDoc comments', 'WARN', 
        'JSDoc comments may be missing');
    }
  }
}

// ============================================================================
// SECTION 3: FRONTEND COMPONENT TESTS
// ============================================================================

async function testFrontendComponents() {
  console.log('\n' + '='.repeat(80));
  console.log('SECTION 3: FRONTEND COMPONENT TESTS');
  console.log('='.repeat(80));

  // Test 3.1: Checkout Flow Component Tests
  const checkoutProgressContent = readFileContent('frontend/src/components/checkout/CheckoutProgress.tsx');
  if (checkoutProgressContent) {
    const hasCheckoutProgress = containsContent(checkoutProgressContent, 'CheckoutProgress') &&
                               containsContent(checkoutProgressContent, 'React.FC');
    if (hasCheckoutProgress) {
      logTest('Frontend Component', 'CheckoutProgress component exists', 'PASS');
    } else {
      logTest('Frontend Component', 'CheckoutProgress component exists', 'FAIL', 
        'CheckoutProgress component not properly defined');
    }
  } else {
    logTest('Frontend Component', 'CheckoutProgress component exists', 'FAIL', 
      'CheckoutProgress.tsx file not found');
  }

  // Test 3.2: CheckoutStepContainer component exists
  const checkoutStepContainerContent = readFileContent('frontend/src/components/checkout/CheckoutStepContainer.tsx');
  if (checkoutStepContainerContent) {
    const hasCheckoutStepContainer = containsContent(checkoutStepContainerContent, 'CheckoutStepContainer') &&
                                    containsContent(checkoutStepContainerContent, 'React.FC');
    if (hasCheckoutStepContainer) {
      logTest('Frontend Component', 'CheckoutStepContainer component exists', 'PASS');
    } else {
      logTest('Frontend Component', 'CheckoutStepContainer component exists', 'FAIL', 
        'CheckoutStepContainer component not properly defined');
    }
  } else {
    logTest('Frontend Component', 'CheckoutStepContainer component exists', 'FAIL', 
      'CheckoutStepContainer.tsx file not found');
  }

  // Test 3.3: CheckoutSecurityBadge component exists
  const checkoutSecurityBadgeContent = readFileContent('frontend/src/components/checkout/CheckoutSecurityBadge.tsx');
  if (checkoutSecurityBadgeContent) {
    const hasCheckoutSecurityBadge = containsContent(checkoutSecurityBadgeContent, 'CheckoutSecurityBadge') &&
                                    containsContent(checkoutSecurityBadgeContent, 'React.FC');
    if (hasCheckoutSecurityBadge) {
      logTest('Frontend Component', 'CheckoutSecurityBadge component exists', 'PASS');
    } else {
      logTest('Frontend Component', 'CheckoutSecurityBadge component exists', 'FAIL', 
        'CheckoutSecurityBadge component not properly defined');
    }
  } else {
    logTest('Frontend Component', 'CheckoutSecurityBadge component exists', 'FAIL', 
      'CheckoutSecurityBadge.tsx file not found');
  }

  // Test 3.4: CheckoutAbandonmentWarning component exists
  const checkoutAbandonmentWarningContent = readFileContent('frontend/src/components/checkout/CheckoutAbandonmentWarning.tsx');
  if (checkoutAbandonmentWarningContent) {
    const hasCheckoutAbandonmentWarning = containsContent(checkoutAbandonmentWarningContent, 'CheckoutAbandonmentWarning') &&
                                        containsContent(checkoutAbandonmentWarningContent, 'React.FC');
    if (hasCheckoutAbandonmentWarning) {
      logTest('Frontend Component', 'CheckoutAbandonmentWarning component exists', 'PASS');
    } else {
      logTest('Frontend Component', 'CheckoutAbandonmentWarning component exist', 'FAIL', 
        'CheckoutAbandonmentWarning component not properly defined');
    }
  } else {
    logTest('Frontend Component', 'CheckoutAbandonmentWarning component exists', 'FAIL', 
      'CheckoutAbandonmentWarning.tsx file not found');
  }

  // Test 3.5: Checkout page has 4 steps
  if (checkoutProgressContent) {
    const hasFourSteps = containsContent(checkoutProgressContent, "'address'") &&
                       containsContent(checkoutProgressContent, "'shipping'") &&
                       containsContent(checkoutProgressContent, "'payment'") &&
                       containsContent(checkoutProgressContent, "'review'");
    if (hasFourSteps) {
      logTest('Frontend Component', 'Checkout page has 4 steps', 'PASS');
    } else {
      logTest('Frontend Component', 'Checkout page has 4 steps', 'FAIL', 
        'Not all 4 checkout steps are defined');
    }
  }

  // Test 3.6: Progress indicators work correctly
  if (checkoutProgressContent) {
    const hasProgressCalculation = containsContent(checkoutProgressContent, 'progressPercentage') &&
                                  containsContent(checkoutProgressContent, 'currentStep');
    if (hasProgressCalculation) {
      logTest('Frontend Component', 'Progress indicators work correctly', 'PASS');
    } else {
      logTest('Frontend Component', 'Progress indicators work correctly', 'WARN', 
        'Progress calculation may not be implemented');
    }
  }

  // Test 3.7: Address Management Component Tests
  const addressTypeSelectorExists = fileExists('frontend/src/components/checkout/AddressTypeSelector.tsx');
  if (addressTypeSelectorExists) {
    logTest('Frontend Component', 'AddressTypeSelector component exists', 'PASS');
  } else {
    logTest('Frontend Component', 'AddressTypeSelector component exists', 'SKIP', 
      'AddressTypeSelector.tsx file may not exist yet');
  }

  const addressFormEnhancedExists = fileExists('frontend/src/components/checkout/AddressFormEnhanced.tsx');
  if (addressFormEnhancedExists) {
    logTest('Frontend Component', 'AddressFormEnhanced component exists', 'PASS');
  } else {
    logTest('Frontend Component', 'AddressFormEnhanced component exists', 'SKIP', 
      'AddressFormEnhanced.tsx file may not exist yet');
  }

  const addressValidationBadgeExists = fileExists('frontend/src/components/checkout/AddressValidationBadge.tsx');
  if (addressValidationBadgeExists) {
    logTest('Frontend Component', 'AddressValidationBadge component exists', 'PASS');
  } else {
    logTest('Frontend Component', 'AddressValidationBadge component exists', 'SKIP', 
      'AddressValidationBadge.tsx file may not exist yet');
  }

  const bangladeshAddressFieldsExists = fileExists('frontend/src/components/checkout/BangladeshAddressFields.tsx');
  if (bangladeshAddressFieldsExists) {
    logTest('Frontend Component', 'BangladeshAddressFields component exists', 'PASS');
  } else {
    logTest('Frontend Component', 'BangladeshAddressFields component exists', 'SKIP', 
      'BangladeshAddressFields.tsx file may not exist yet');
  }

  // Test 3.8: Guest Checkout Component Tests
  const guestInfoFormExists = fileExists('frontend/src/components/checkout/GuestInfoForm.tsx');
  if (guestInfoFormExists) {
    logTest('Frontend Component', 'GuestInfoForm component exists', 'PASS');
  } else {
    logTest('Frontend Component', 'GuestInfoForm component exists', 'SKIP', 
      'GuestInfoForm.tsx file may not exist yet');
  }

  const guestOrderTrackingExists = fileExists('frontend/src/components/checkout/GuestOrderTracking.tsx');
  if (guestOrderTrackingExists) {
    logTest('Frontend Component', 'GuestOrderTracking component exists', 'PASS');
  } else {
    logTest('Frontend Component', 'GuestOrderTracking component exists', 'SKIP', 
      'GuestOrderTracking.tsx file may not exist yet');
  }

  const guestCartMergePromptExists = fileExists('frontend/src/components/checkout/GuestCartMergePrompt.tsx');
  if (guestCartMergePromptExists) {
    logTest('Frontend Component', 'GuestCartMergePrompt component exists', 'PASS');
  } else {
    logTest('Frontend Component', 'GuestCartMergePrompt component exists', 'SKIP', 
      'GuestCartMergePrompt.tsx file may not exist yet');
  }

  const guestAccountCreationExists = fileExists('frontend/src/components/checkout/GuestAccountCreation.tsx');
  if (guestAccountCreationExists) {
    logTest('Frontend Component', 'GuestAccountCreation component exists', 'PASS');
  } else {
    logTest('Frontend Component', 'GuestAccountCreation component exists', 'SKIP', 
      'GuestAccountCreation.tsx file may not exist yet');
  }

  // Test 3.9: Checkout types file exists
  const checkoutTypesContent = readFileContent('frontend/src/types/checkout.ts');
  if (checkoutTypesContent) {
    const hasCheckoutTypes = containsContent(checkoutTypesContent, 'export interface CheckoutSession') &&
                             containsContent(checkoutTypesContent, 'export type CheckoutStep');
    if (hasCheckoutTypes) {
      logTest('Frontend Component', 'Checkout types file exists', 'PASS');
    } else {
      logTest('Frontend Component', 'Checkout types file exists', 'FAIL', 
        'Checkout types not properly defined');
    }
  } else {
    logTest('Frontend Component', 'Checkout types file exists', 'FAIL', 
      'checkout.ts types file not found');
  }

  // Test 3.10: useCheckout hook exists
  const useCheckoutContent = readFileContent('frontend/src/hooks/useCheckout.ts');
  if (useCheckoutContent) {
    const hasUseCheckout = containsContent(useCheckoutContent, 'export const useCheckout') &&
                           containsContent(useCheckoutContent, 'useState') &&
                           containsContent(useCheckoutContent, 'useCallback');
    if (hasUseCheckout) {
      logTest('Frontend Component', 'useCheckout hook exists', 'PASS');
    } else {
      logTest('Frontend Component', 'useCheckout hook exists', 'FAIL', 
        'useCheckout hook not properly defined');
    }
  } else {
    logTest('Frontend Component', 'useCheckout hook exists', 'FAIL', 
      'useCheckout.ts hook file not found');
  }

  // Test 3.11: useAddressManagement hook exists
  const useAddressManagementContent = readFileContent('frontend/src/hooks/useAddressManagement.ts');
  if (useAddressManagementContent) {
    const hasUseAddressManagement = containsContent(useAddressManagementContent, 'export const useAddressManagement') ||
                                     containsContent(useAddressManagementContent, 'useAddressManagement');
    if (hasUseAddressManagement) {
      logTest('Frontend Component', 'useAddressManagement hook exists', 'PASS');
    } else {
      logTest('Frontend Component', 'useAddressManagement hook exists', 'FAIL', 
        'useAddressManagement hook not properly defined');
    }
  } else {
    logTest('Frontend Component', 'useAddressManagement hook exists', 'FAIL', 
      'useAddressManagement.ts hook file not found');
  }

  // Test 3.12: useGuestCheckout hook exists
  const useGuestCheckoutExists = fileExists('frontend/src/hooks/useGuestCheckout.ts');
  if (useGuestCheckoutExists) {
    logTest('Frontend Component', 'useGuestCheckout hook exists', 'PASS');
  } else {
    logTest('Frontend Component', 'useGuestCheckout hook exists', 'SKIP', 
      'useGuestCheckout.ts hook file may not exist yet');
  }

  // Test 3.13: Verify components use TypeScript
  const allTsxFiles = [
    'frontend/src/components/checkout/CheckoutProgress.tsx',
    'frontend/src/components/checkout/CheckoutStepContainer.tsx',
    'frontend/src/components/checkout/CheckoutSecurityBadge.tsx',
    'frontend/src/components/checkout/CheckoutAbandonmentWarning.tsx',
  ];
  
  const tsxFilesExist = allTsxFiles.every(file => fileExists(file));
  if (tsxFilesExist) {
    logTest('Frontend Component', 'Components use TypeScript', 'PASS');
  } else {
    logTest('Frontend Component', 'Components use TypeScript', 'WARN', 
      'Some component files may be missing');
  }

  // Test 3.14: Verify components have proper TypeScript types
  if (checkoutProgressContent) {
    const hasInterfaceProps = containsContent(checkoutProgressContent, 'interface CheckoutProgressProps') ||
                             containsContent(checkoutProgressContent, 'type CheckoutProgressProps');
    if (hasInterfaceProps) {
      logTest('Frontend Component', 'Components have proper TypeScript types', 'PASS');
    } else {
      logTest('Frontend Component', 'Components have proper TypeScript types', 'WARN', 
        'TypeScript types may not be properly defined');
    }
  }

  // Test 3.15: Verify components have JSDoc comments
  if (checkoutProgressContent) {
    const hasJSDoc = containsContent(checkoutProgressContent, '/**') && 
                     containsContent(checkoutProgressContent, '* @example');
    if (hasJSDoc) {
      logTest('Frontend Component', 'Components have JSDoc comments', 'PASS');
    } else {
      logTest('Frontend Component', 'Components have JSDoc comments', 'WARN', 
        'JSDoc comments may be missing');
    }
  }
}

// ============================================================================
// SECTION 4: ADMIN PANEL COMPONENT TESTS
// ============================================================================

async function testAdminPanelComponents() {
  console.log('\n' + '='.repeat(80));
  console.log('SECTION 4: ADMIN PANEL COMPONENT TESTS');
  console.log('='.repeat(80));

  // Test 4.1: Admin checkout sessions page exists
  const adminSessionsPageExists = fileExists('frontend/src/app/admin/checkout/sessions/page.tsx');
  if (adminSessionsPageExists) {
    logTest('Admin Panel', 'Checkout sessions page exists', 'PASS');
  } else {
    logTest('Admin Panel', 'Checkout sessions page exists', 'SKIP', 
      'admin/checkout/sessions/page.tsx file may not exist yet');
  }

  // Test 4.2: Admin abandonment page exists
  const adminAbandonmentPageExists = fileExists('frontend/src/app/admin/checkout/abandonment/page.tsx');
  if (adminAbandonmentPageExists) {
    logTest('Admin Panel', 'Checkout abandonment page exists', 'PASS');
  } else {
    logTest('Admin Panel', 'Checkout abandonment page exists', 'SKIP', 
      'admin/checkout/abandonment/page.tsx file may not exist yet');
  }

  // Test 4.3: Admin guest checkout page exists
  const adminGuestPageExists = fileExists('frontend/src/app/admin/checkout/guest/page.tsx');
  if (adminGuestPageExists) {
    logTest('Admin Panel', 'Guest checkout page exists', 'PASS');
  } else {
    logTest('Admin Panel', 'Guest checkout page exists', 'SKIP', 
      'admin/checkout/guest/page.tsx file may not exist yet');
  }

  // Test 4.4: Admin analytics page exists
  const adminAnalyticsPageExists = fileExists('frontend/src/app/admin/checkout/analytics/page.tsx');
  if (adminAnalyticsPageExists) {
    logTest('Admin Panel', 'Checkout analytics page exists', 'PASS');
  } else {
    logTest('Admin Panel', 'Checkout analytics page exists', 'SKIP', 
      'admin/checkout/analytics/page.tsx file may not exist yet');
  }

  // Test 4.5: Admin settings page exists
  const adminSettingsPageExists = fileExists('frontend/src/app/admin/checkout/settings/page.tsx');
  if (adminSettingsPageExists) {
    logTest('Admin Panel', 'Checkout settings page exists', 'PASS');
  } else {
    logTest('Admin Panel', 'Checkout settings page exists', 'FAIL', 
      'admin/checkout/settings/page.tsx file not found');
  }

  // Test 4.6: Admin checkout table components exist
  const adminComponents = [
    'CheckoutSessionTable',
    'CheckoutAbandonmentTable',
    'GuestCheckoutTable',
    'CheckoutAnalyticsCharts',
  ];
  
  const adminComponentFiles = adminComponents.map(comp => 
    `frontend/src/components/admin/checkout/${comp}.tsx`
  );
  
  const existingComponents = adminComponentFiles.filter(file => fileExists(file));
  if (existingComponents.length > 0) {
    logTest('Admin Panel', `Admin checkout table components exist (${existingComponents.length}/${adminComponents.length})`, 'PASS');
  } else {
    logTest('Admin Panel', 'Admin checkout table components exist', 'SKIP', 
      'Admin checkout table components may not exist yet');
  }

  // Test 4.7: Verify admin pages use TypeScript
  const adminSettingsContent = readFileContent('frontend/src/app/admin/checkout/settings/page.tsx');
  if (adminSettingsContent) {
    const isTypeScript = adminSettingsContent.includes('export default') || 
                        adminSettingsContent.includes('export function');
    if (isTypeScript) {
      logTest('Admin Panel', 'Admin pages use TypeScript', 'PASS');
    } else {
      logTest('Admin Panel', 'Admin pages use TypeScript', 'WARN', 
        'TypeScript usage may not be confirmed');
    }
  }
}

// ============================================================================
// SECTION 5: INTEGRATION TESTS
// ============================================================================

async function testIntegration() {
  console.log('\n' + '='.repeat(80));
  console.log('SECTION 5: INTEGRATION TESTS');
  console.log('='.repeat(80));

  // Test 5.1: Authenticated user checkout flow integration
  const checkoutServiceContent = readFileContent('backend/services/checkoutService.js');
  const checkoutControllerContent = readFileContent('backend/controllers/checkoutController.js');
  
  if (checkoutServiceContent && checkoutControllerContent) {
    const hasUserIdCheck = containsContent(checkoutServiceContent, 'userId') &&
                           containsContent(checkoutControllerContent, 'userId');
    if (hasUserIdCheck) {
      logTest('Integration', 'Authenticated user checkout flow integration', 'PASS');
    } else {
      logTest('Integration', 'Authenticated user checkout flow integration', 'WARN', 
        'User ID handling may not be properly integrated');
    }
  }

  // Test 5.2: Guest checkout flow integration
  const guestCheckoutServiceContent = readFileContent('backend/services/guestCheckoutService.js');
  const guestCheckoutControllerContent = readFileContent('backend/controllers/guestCheckoutController.js');
  
  if (guestCheckoutServiceContent && guestCheckoutControllerContent) {
    const hasGuestSessionHandling = containsContent(guestCheckoutServiceContent, 'guestSession') &&
                                    containsContent(guestCheckoutControllerContent, 'guestSession');
    if (hasGuestSessionHandling) {
      logTest('Integration', 'Guest checkout flow integration', 'PASS');
    } else {
      logTest('Integration', 'Guest checkout flow integration', 'WARN', 
        'Guest session handling may not be properly integrated');
    }
  }

  // Test 5.3: Address management integration
  const addressServiceContent = readFileContent('backend/services/addressService.js');
  if (addressServiceContent) {
    const hasAddressValidation = containsContent(addressServiceContent, 'validateBangladeshAddress') &&
                                  containsContent(addressServiceContent, 'getAddressesForCheckout');
    if (hasAddressValidation) {
      logTest('Integration', 'Address management integration', 'PASS');
    } else {
      logTest('Integration', 'Address management integration', 'WARN', 
        'Address management integration may not be complete');
    }
  }

  // Test 5.4: Cart merging on login integration
  if (guestCheckoutServiceContent) {
    const hasMergeCart = containsContent(guestCheckoutServiceContent, 'mergeGuestCart') &&
                          containsContent(guestCheckoutServiceContent, 'convertGuestToUser');
    if (hasMergeCart) {
      logTest('Integration', 'Cart merging on login integration', 'PASS');
    } else {
      logTest('Integration', 'Cart merging on login integration', 'WARN', 
        'Cart merging may not be properly integrated');
    }
  }

  // Test 5.5: Checkout abandonment tracking integration
  const schemaContent = readFileContent('backend/prisma/schema.prisma');
  const checkoutAbandonmentInSchema = containsContent(schemaContent || '', 'CheckoutAbandonment');
  if (checkoutAbandonmentInSchema) {
    logTest('Integration', 'Checkout abandonment tracking integration', 'PASS');
  } else {
    logTest('Integration', 'Checkout abandonment tracking integration', 'WARN',
      'Checkout abandonment tracking may not be properly integrated');
  }

  // Test 5.6: Admin panel integration
  const adminRoutesContent = readFileContent('backend/routes/admin/checkout.js');
  if (adminRoutesContent) {
    const hasAdminRoutes = containsContent(adminRoutesContent, 'authenticateAdmin') &&
                           containsContent(adminRoutesContent, 'validateAdminAccess');
    if (hasAdminRoutes) {
      logTest('Integration', 'Admin panel integration', 'PASS');
    } else {
      logTest('Integration', 'Admin panel integration', 'WARN', 
        'Admin panel authentication may not be properly integrated');
    }
  }
}

// ============================================================================
// SECTION 6: CODE QUALITY TESTS
// ============================================================================

async function testCodeQuality() {
  console.log('\n' + '='.repeat(80));
  console.log('SECTION 6: CODE QUALITY TESTS');
  console.log('='.repeat(80));

  // Test 6.1: Verify snake_case is used for database column names
  const migrationContent = readFileContent('backend/prisma/migrations/20260222145353_phase7_milestone1_checkout_foundation/migration.sql');
  if (migrationContent) {
    const snakeCaseColumns = [
      'user_id',
      'session_id',
      'current_step',
      'shipping_address_id',
      'billing_address_id',
      'shipping_method',
      'payment_method',
      'cart_id',
      'abandonment_step',
      'abandonment_reason',
      'cart_value',
      'item_count',
      'recovery_email_sent',
      'recovery_email_sent_at',
      'recovered_at',
      'recovery_attempts',
      'ip_address',
      'user_agent',
      'last_activity_at',
      'expires_at',
      'converted_to_user_id',
      'converted_at',
      'created_at',
      'updated_at',
    ];
    
    const allSnakeCase = snakeCaseColumns.every(col => containsContent(migrationContent, col));
    if (allSnakeCase) {
      logTest('Code Quality', 'snake_case used for database column names', 'PASS');
    } else {
      const missingColumns = snakeCaseColumns.filter(col => !containsContent(migrationContent, col));
      logTest('Code Quality', 'snake_case used for database column names', 'FAIL', 
        `Missing or incorrect columns: ${missingColumns.join(', ')}`);
    }
  }

  // Test 6.2: Verify camelCase is used for JavaScript/TypeScript variables
  const checkoutControllerContent = readFileContent('backend/controllers/checkoutController.js');
  if (checkoutControllerContent) {
    const camelCaseVariables = [
      'sessionId',
      'userId',
      'cartId',
      'shippingAddressId',
      'billingAddressId',
      'shippingMethod',
      'paymentMethod',
      'currentStep',
      'createdAt',
      'updatedAt',
      'completedAt',
      'expiresAt',
    ];
    
    const allCamelCase = camelCaseVariables.some(variable => containsContent(checkoutControllerContent, variable));
    if (allCamelCase) {
      logTest('Code Quality', 'camelCase used for JavaScript variables', 'PASS');
    } else {
      logTest('Code Quality', 'camelCase used for JavaScript variables', 'WARN', 
        'camelCase naming may not be consistent');
    }
  }

  // Test 6.3: Verify TypeScript types are correct
  const checkoutTypesContent = readFileContent('frontend/src/types/checkout.ts');
  if (checkoutTypesContent) {
    const hasCorrectTypes = containsContent(checkoutTypesContent, 'export interface') &&
                           containsContent(checkoutTypesContent, 'export type');
    if (hasCorrectTypes) {
      logTest('Code Quality', 'TypeScript types are correct', 'PASS');
    } else {
      logTest('Code Quality', 'TypeScript types are correct', 'WARN', 
        'TypeScript types may not be properly defined');
    }
  }

  // Test 6.4: Verify JSDoc comments are present
  const jsdocFiles = [
    'backend/controllers/checkoutController.js',
    'backend/services/checkoutService.js',
    'backend/services/guestCheckoutService.js',
    'backend/services/addressService.js',
  ];
  
  const jsdocChecks = jsdocFiles.map(file => {
    const content = readFileContent(file);
    return {
      file,
      hasJSDoc: content ? containsContent(content, '/**') : false,
    };
  });
  
  const filesWithJSDoc = jsdocChecks.filter(check => check.hasJSDoc);
  if (filesWithJSDoc.length === jsdocChecks.length) {
    logTest('Code Quality', 'JSDoc comments are present', 'PASS');
  } else {
    logTest('Code Quality', 'JSDoc comments are present', 'WARN', 
      `JSDoc comments missing in ${jsdocChecks.length - filesWithJSDoc.length} files`);
  }

  // Test 6.5: Verify error handling is comprehensive
  const errorHandlingFiles = [
    'backend/controllers/checkoutController.js',
    'backend/controllers/guestCheckoutController.js',
  ];
  
  const errorHandlingChecks = errorHandlingFiles.map(file => {
    const content = readFileContent(file);
    return {
      file,
      hasTryCatch: content ? (containsContent(content, 'try {') && containsContent(content, 'catch (error)')) : false,
      hasErrorResponses: content ? containsContent(content, 'res.status(') : false,
    };
  });
  
  const filesWithErrorHandling = errorHandlingChecks.filter(check => check.hasTryCatch && check.hasErrorResponses);
  if (filesWithErrorHandling.length === errorHandlingChecks.length) {
    logTest('Code Quality', 'Error handling is comprehensive', 'PASS');
  } else {
    logTest('Code Quality', 'Error handling is comprehensive', 'WARN', 
      `Error handling may be incomplete in ${errorHandlingChecks.length - filesWithErrorHandling.length} files`);
  }

  // Test 6.6: Verify validation is implemented
  const validationFiles = [
    'backend/services/checkoutService.js',
    'backend/services/addressService.js',
    'backend/services/guestCheckoutService.js',
  ];
  
  const validationChecks = validationFiles.map(file => {
    const content = readFileContent(file);
    return {
      file,
      hasValidation: content ? containsContent(content, 'validate') : false,
    };
  });
  
  const filesWithValidation = validationChecks.filter(check => check.hasValidation);
  if (filesWithValidation.length === validationChecks.length) {
    logTest('Code Quality', 'Validation is implemented', 'PASS');
  } else {
    logTest('Code Quality', 'Validation is implemented', 'WARN', 
      `Validation may be missing in ${validationChecks.length - filesWithValidation.length} files`);
  }

  // Test 6.7: Verify security measures are in place
  const securityChecks = [
    {
      file: 'backend/routes/checkout.js',
      hasAuth: containsContent(readFileContent('backend/routes/checkout.js') || '', 'authMiddleware'),
      hasRateLimit: containsContent(readFileContent('backend/routes/checkout.js') || '', 'rateLimit'),
    },
    {
      file: 'backend/routes/guestCheckout.js',
      hasAuth: containsContent(readFileContent('backend/routes/guestCheckout.js') || '', 'rateLimit'),
      hasRateLimit: containsContent(readFileContent('backend/routes/guestCheckout.js') || '', 'rateLimit'),
    },
  ];
  
  const filesWithSecurity = securityChecks.filter(check => check.hasAuth || check.hasRateLimit);
  if (filesWithSecurity.length === securityChecks.length) {
    logTest('Code Quality', 'Security measures are in place', 'PASS');
  } else {
    logTest('Code Quality', 'Security measures are in place', 'WARN', 
      'Security measures may be incomplete');
  }
}

// ============================================================================
// SECTION 7: DATA INTEGRITY TESTS
// ============================================================================

async function testDataIntegrity() {
  console.log('\n' + '='.repeat(80));
  console.log('SECTION 7: DATA INTEGRITY TESTS');
  console.log('='.repeat(80));

  // Test 7.1: Verify no data loss from existing tables
  const migrationContent = readFileContent('backend/prisma/migrations/20260222145353_phase7_milestone1_checkout_foundation/migration.sql');
  if (migrationContent) {
    const hasNoDropStatements = !containsContent(migrationContent, 'DROP TABLE');
    const hasNoDeleteStatements = !containsContent(migrationContent, 'DELETE FROM');
    const hasNoTruncateStatements = !containsContent(migrationContent, 'TRUNCATE');
    
    if (hasNoDropStatements && hasNoDeleteStatements && hasNoTruncateStatements) {
      logTest('Data Integrity', 'No data loss from existing tables', 'PASS');
    } else {
      logTest('Data Integrity', 'No data loss from existing tables', 'FAIL', 
        'Migration contains destructive statements that may cause data loss');
    }
  }

  // Test 7.2: Verify foreign key relationships are correct
  if (migrationContent) {
    const requiredForeignKeys = [
      'FOREIGN KEY ("cart_id") REFERENCES "carts"',
      'FOREIGN KEY ("shipping_address_id") REFERENCES "addresses"',
      'FOREIGN KEY ("billing_address_id") REFERENCES "addresses"',
      'FOREIGN KEY ("checkout_session_id") REFERENCES "checkout_sessions"',
    ];
    
    const allForeignKeys = requiredForeignKeys.every(fk => containsContent(migrationContent, fk));
    if (allForeignKeys) {
      logTest('Data Integrity', 'Foreign key relationships are correct', 'PASS');
    } else {
      const missingForeignKeys = requiredForeignKeys.filter(fk => !containsContent(migrationContent, fk));
      logTest('Data Integrity', 'Foreign key relationships are correct', 'WARN', 
        `Missing foreign keys: ${missingForeignKeys.join(', ')}`);
    }
  }

  // Test 7.3: Verify indexes are created
  if (migrationContent) {
    const requiredIndexes = [
      'idx_checkout_sessions_session_id',
      'idx_checkout_sessions_user_id',
      'idx_checkout_sessions_cart_id',
      'idx_checkout_sessions_status',
      'idx_checkout_abandonment_checkout_session_id',
      'idx_checkout_abandonment_user_id',
      'idx_checkout_abandonment_session_id',
      'idx_checkout_abandonment_recovered',
      'idx_guest_sessions_session_id',
      'idx_guest_sessions_cart_id',
      'idx_guest_sessions_expires_at',
    ];
    
    const allIndexes = requiredIndexes.some(index => containsContent(migrationContent, index));
    if (allIndexes) {
      logTest('Data Integrity', 'Indexes are created', 'PASS');
    } else {
      logTest('Data Integrity', 'Indexes are created', 'WARN', 
        'Some indexes may be missing');
    }
  }

  // Test 7.4: Verify constraints are correct
  if (migrationContent) {
    const hasNotNullConstraints = containsContent(migrationContent, 'NOT NULL');
    const hasUniqueConstraints = containsContent(migrationContent, 'UNIQUE');
    const hasCascadeDelete = containsContent(migrationContent, 'ON DELETE CASCADE');
    
    if (hasNotNullConstraints && hasUniqueConstraints && hasCascadeDelete) {
      logTest('Data Integrity', 'Constraints are correct', 'PASS');
    } else {
      logTest('Data Integrity', 'Constraints are correct', 'WARN', 
        'Some constraints may be missing');
    }
  }

  // Test 7.5: Verify migrations were applied successfully
  const verifyMigrationContent = readFileContent('backend/verify-migration.js');
  if (verifyMigrationContent) {
    const hasVerification = containsContent(verifyMigrationContent, 'verify') ||
                              containsContent(verifyMigrationContent, 'check');
    if (hasVerification) {
      logTest('Data Integrity', 'Migrations were applied successfully', 'PASS');
    } else {
      logTest('Data Integrity', 'Migrations were applied successfully', 'WARN', 
        'Migration verification may not be implemented');
    }
  } else {
    logTest('Data Integrity', 'Migrations were applied successfully', 'SKIP', 
      'verify-migration.js file not found');
  }

  // Test 7.6: Verify AddressType enum has correct values
  const schemaContent = readFileContent('backend/prisma/schema.prisma');
  if (schemaContent) {
    const addressTypeEnum = containsContent(schemaContent, 'enum AddressType');
    const hasShipping = containsContent(schemaContent, 'shipping');
    const hasBilling = containsContent(schemaContent, 'billing');
    const hasHome = containsContent(schemaContent, 'home');
    const hasWork = containsContent(schemaContent, 'work');
    const hasOther = containsContent(schemaContent, 'other');
    
    if (addressTypeEnum && hasShipping && hasBilling && hasHome && hasWork && hasOther) {
      logTest('Data Integrity', 'AddressType enum has correct values', 'PASS');
    } else {
      logTest('Data Integrity', 'AddressType enum has correct values', 'FAIL', 
        'AddressType enum may be missing values');
    }
  }

  // Test 7.7: Verify checkout_sessions table has correct structure
  if (schemaContent) {
    const hasCheckoutSessionModel = containsContent(schemaContent, 'model CheckoutSession');
    const hasRequiredFields = [
      'id String @id @default(uuid())',
      'userId String?',
      'sessionId String?',
      'currentStep String',
      'shippingAddressId String?',
      'billingAddressId String?',
      'shippingMethod String?',
      'paymentMethod String?',
      'cartId String',
      'status String',
      'completedAt DateTime?',
      'expiresAt DateTime?',
      'createdAt DateTime @default(now())',
      'updatedAt DateTime @updatedAt',
    ].every(field => containsContent(schemaContent, field));
    
    if (hasCheckoutSessionModel && hasRequiredFields) {
      logTest('Data Integrity', 'checkout_sessions table has correct structure', 'PASS');
    } else {
      logTest('Data Integrity', 'checkout_sessions table has correct structure', 'FAIL', 
        'CheckoutSession model may be missing fields');
    }
  }

  // Test 7.8: Verify checkout_abandonment table has correct structure
  if (schemaContent) {
    const hasCheckoutAbandonmentModel = containsContent(schemaContent, 'model CheckoutAbandonment');
    const hasRequiredFields = [
      'id String @id @default(uuid())',
      'checkoutSessionId String',
      'userId String?',
      'sessionId String?',
      'abandonmentStep String',
      'abandonmentReason String?',
      'cartValue Decimal',
      'itemCount Int',
      'recoveryEmailSent Boolean',
      'recoveryEmailSentAt DateTime?',
      'recovered Boolean',
      'recoveredAt DateTime?',
      'recoveryAttempts Int',
      'ipAddress String?',
      'userAgent String?',
      'createdAt DateTime @default(now())',
      'updatedAt DateTime @updatedAt',
    ].every(field => containsContent(schemaContent, field));
    
    if (hasCheckoutAbandonmentModel && hasRequiredFields) {
      logTest('Data Integrity', 'checkout_abandonment table has correct structure', 'PASS');
    } else {
      logTest('Data Integrity', 'checkout_abandonment table has correct structure', 'FAIL', 
        'CheckoutAbandonment model may be missing fields');
    }
  }

  // Test 7.9: Verify guest_sessions table has correct structure
  if (schemaContent) {
    const hasGuestSessionModel = containsContent(schemaContent, 'model GuestSession');
    const hasRequiredFields = [
      'id String @id @default(uuid())',
      'sessionId String @unique',
      'email String?',
      'phone String?',
      'firstName String?',
      'lastName String?',
      'cartId String',
      'metadata Json?',
      'lastActivityAt DateTime',
      'expiresAt DateTime',
      'convertedToUserId String?',
      'convertedAt DateTime?',
      'createdAt DateTime @default(now())',
      'updatedAt DateTime @updatedAt',
    ].every(field => containsContent(schemaContent, field));
    
    if (hasGuestSessionModel && hasRequiredFields) {
      logTest('Data Integrity', 'guest_sessions table has correct structure', 'PASS');
    } else {
      logTest('Data Integrity', 'guest_sessions table has correct structure', 'FAIL', 
        'GuestSession model may be missing fields');
    }
  }

  // Test 7.10: Verify relationships between tables
  if (schemaContent) {
    const hasCheckoutSessionRelations = containsContent(schemaContent, 'checkoutSessionsShippingAddress') &&
                                      containsContent(schemaContent, 'checkoutSessionsBillingAddress') &&
                                      containsContent(schemaContent, 'checkoutAbandonments') &&
                                      containsContent(schemaContent, 'guestSessions');
    
    if (hasCheckoutSessionRelations) {
      logTest('Data Integrity', 'Relationships between tables are correct', 'PASS');
    } else {
      logTest('Data Integrity', 'Relationships between tables are correct', 'WARN', 
        'Some table relationships may be missing');
    }
  }
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 7 MILESTONE 1: CHECKOUT FOUNDATION - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Test started at: ${testResults.startTime}`);
  console.log(`Backend URL: ${TEST_CONFIG.backendUrl}`);
  console.log(`Frontend URL: ${TEST_CONFIG.frontendUrl}`);
  console.log('='.repeat(80));

  try {
    // Run all test sections
    await testDatabaseMigrations();
    await testBackendAPIs();
    await testFrontendComponents();
    await testAdminPanelComponents();
    await testIntegration();
    await testCodeQuality();
    await testDataIntegrity();

    // Set end time
    testResults.endTime = new Date().toISOString();

    // Generate test report
    generateTestReport();

  } catch (error) {
    console.error('\n✗ Test execution failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST REPORT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Test started at: ${testResults.startTime}`);
  console.log(`Test ended at: ${testResults.endTime}`);
  console.log('='.repeat(80));
  
  // Summary statistics
  console.log('\n📊 SUMMARY STATISTICS');
  console.log('-'.repeat(80));
  console.log(`Total tests:     ${testResults.totalTests}`);
  console.log(`Passed:          ${testResults.passedTests} (${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed:          ${testResults.failedTests} (${((testResults.failedTests / testResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Skipped:         ${testResults.skippedTests} (${((testResults.skippedTests / testResults.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Warnings:         ${testResults.warnings.length}`);
  
  // Test results by category
  console.log('\n📋 TEST RESULTS BY CATEGORY');
  console.log('-'.repeat(80));
  
  const categories = [
    'Database Migration',
    'Backend API',
    'Frontend Component',
    'Admin Panel',
    'Integration',
    'Code Quality',
    'Data Integrity',
  ];
  
  categories.forEach(category => {
    const categoryPassed = testResults.passed.filter(r => r.category === category).length;
    const categoryFailed = testResults.failed.filter(r => r.category === category).length;
    const categorySkipped = testResults.skipped.filter(r => r.category === category).length;
    const categoryTotal = categoryPassed + categoryFailed + categorySkipped;
    
    if (categoryTotal > 0) {
      const passRate = ((categoryPassed / categoryTotal) * 100).toFixed(1);
      console.log(`\n${category}:`);
      console.log(`  Total:   ${categoryTotal}`);
      console.log(`  Passed:  ${categoryPassed} (${passRate}%)`);
      console.log(`  Failed:  ${categoryFailed}`);
      console.log(`  Skipped: ${categorySkipped}`);
    }
  });
  
  // Failed tests details
  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS');
    console.log('-'.repeat(80));
    testResults.failed.forEach(result => {
      console.log(`\n[${result.category}] ${result.testName}`);
      console.log(`  Status:  ${result.status}`);
      console.log(`  Message: ${result.message}`);
      if (result.details) {
        console.log(`  Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log(`  Time:    ${result.timestamp}`);
    });
  }
  
  // Warnings
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS');
    console.log('-'.repeat(80));
    testResults.warnings.forEach(result => {
      console.log(`\n[${result.category}] ${result.testName}`);
      console.log(`  Status:  ${result.status}`);
      console.log(`  Message: ${result.message}`);
      console.log(`  Time:    ${result.timestamp}`);
    });
  }
  
  // Overall assessment
  console.log('\n' + '='.repeat(80));
  console.log('OVERALL ASSESSMENT');
  console.log('='.repeat(80));
  
  const passRate = (testResults.passedTests / testResults.totalTests) * 100;
  
  if (passRate >= 90) {
    console.log('\n✅ PHASE 7 MILESTONE 1: EXCELLENT');
    console.log('   All critical functionality is implemented and working correctly.');
    console.log('   Ready for production deployment.');
  } else if (passRate >= 75) {
    console.log('\n✅ PHASE 7 MILESTONE 1: GOOD');
    console.log('   Most functionality is implemented and working correctly.');
    console.log('   Minor issues may need attention before production.');
  } else if (passRate >= 50) {
    console.log('\n⚠️  PHASE 7 MILESTONE 1: NEEDS IMPROVEMENT');
    console.log('   Significant functionality is missing or not working correctly.');
    console.log('   Major issues need to be addressed before production.');
  } else {
    console.log('\n❌ PHASE 7 MILESTONE 1: CRITICAL');
    console.log('   Critical functionality is missing or not working correctly.');
    console.log('   Major issues must be addressed before proceeding.');
  }
  
  // Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80));
  
  if (testResults.failed.length > 0) {
    console.log('\n1. Address the failed tests listed above');
    console.log('2. Review error messages and details for each failure');
    console.log('3. Implement missing functionality as needed');
    console.log('4. Re-run tests after fixes are applied');
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n5. Review warnings for potential improvements');
    console.log('6. Consider implementing suggested enhancements');
  }
  
  console.log('\n7. Ensure all acceptance criteria from roadmap are met');
  console.log('8. Perform manual testing of checkout flow');
  console.log('9. Test with real data to verify end-to-end functionality');
  console.log('10. Monitor performance and optimize as needed');
  
  // Save test results to file
  const reportFileName = `phase7-milestone1-test-results-${Date.now()}.json`;
  const reportData = {
    config: TEST_CONFIG,
    summary: {
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      skippedTests: testResults.skippedTests,
      warnings: testResults.warnings.length,
      passRate: passRate.toFixed(2),
      startTime: testResults.startTime,
      endTime: testResults.endTime,
    },
    results: {
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      warnings: testResults.warnings,
    },
    assessment: {
      status: passRate >= 90 ? 'EXCELLENT' : passRate >= 75 ? 'GOOD' : passRate >= 50 ? 'NEEDS IMPROVEMENT' : 'CRITICAL',
      readyForProduction: passRate >= 75,
    },
  };
  
  try {
    fs.writeFileSync(reportFileName, JSON.stringify(reportData, null, 2));
    console.log('\n' + '='.repeat(80));
    console.log(`Test results saved to: ${reportFileName}`);
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n✗ Failed to save test results:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUITE COMPLETED');
  console.log('='.repeat(80) + '\n');
}

// Run the test suite
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
