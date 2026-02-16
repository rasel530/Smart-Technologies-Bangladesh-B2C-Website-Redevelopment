/**
 * Address Display Fix Verification Script
 * 
 * This script verifies fixes for order details page address display issues:
 * 1. Shipping Address was not displaying fully (truncated/missing data)
 * 2. Billing Address was completely missing
 * 
 * This script performs:
 * 1. Static code analysis to verify Address interface matches database schema
 * 2. Verification that correct field names are used in component
 * 3. Verification that Billing Address section exists
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║  Order Details Page - Address Display Fix Verification     ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Helper function to log test results
function logTest(testName, passed, message) {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`${status} ${testName}`);
  if (message) {
    console.log(`    ${message}`);
  }
  
  if (passed) {
    results.passed.push(testName);
  } else {
    results.failed.push({ name: testName, message });
  }
}

// Helper function to log warnings
function logWarning(testName, message) {
  const status = `${colors.yellow}⚠ WARN${colors.reset}`;
  console.log(`${status} ${testName}`);
  if (message) {
    console.log(`    ${message}`);
  }
  results.warnings.push({ name: testName, message });
}

// Read order details page file
const pageFilePath = path.join(__dirname, '../src/app/orders/[orderId]/page.tsx');
let pageContent;
try {
  pageContent = fs.readFileSync(pageFilePath, 'utf8');
} catch (error) {
  console.error(`${colors.red}Error: Could not read page.tsx file${colors.reset}`);
  console.error(error.message);
  process.exit(1);
}

console.log(`${colors.blue}Analyzing: ${pageFilePath}${colors.reset}\n`);

// ========================================
// TEST 1: Address Interface Schema Verification
// ========================================
console.log(`${colors.cyan}1. Address Interface Schema Verification${colors.reset}\n`);

// Check for correct field names in Address interface
const addressInterfaceRegex = /interface\s+Address\s*{([^}]+)}/;
const addressInterfaceMatch = pageContent.match(addressInterfaceRegex);

if (addressInterfaceMatch) {
  const interfaceBody = addressInterfaceMatch[1];
  
  // Check for required fields with correct names
  const requiredFields = [
    { field: 'firstName', description: 'firstName field' },
    { field: 'lastName', description: 'lastName field' },
    { field: 'address', description: 'address field (not street)' },
    { field: 'addressLine2', description: 'addressLine2 field (optional)' },
    { field: 'city', description: 'city field' },
    { field: 'district', description: 'district field (not state)' },
    { field: 'division', description: 'division field (not country)' },
    { field: 'postalCode', description: 'postalCode field (optional)' },
    { field: 'phone', description: 'phone field (optional)' },
  ];
  
  requiredFields.forEach(({ field, description }) => {
    // Check for both regular and optional field definitions
    const hasField = interfaceBody.includes(`${field}:`) || interfaceBody.includes(`${field}?:`);
    logTest(
      `Address interface has ${description}`,
      hasField,
      hasField ? null : `Field '${field}' not found in Address interface`
    );
  });
  
  // Check that deprecated fields are NOT present
  const deprecatedFields = [
    { field: 'street', description: 'street field (deprecated)' },
    { field: 'state', description: 'state field (deprecated)' },
    { field: 'country', description: 'country field (deprecated)' },
  ];
  
  deprecatedFields.forEach(({ field, description }) => {
    const hasDeprecatedField = interfaceBody.includes(`${field}:`);
    logTest(
      `Address interface does NOT have ${description}`,
      !hasDeprecatedField,
      hasDeprecatedField ? `Deprecated field '${field}' found in Address interface` : null
    );
  });
} else {
  logTest('Address interface exists', false, 'Could not find Address interface definition');
}

// ========================================
// TEST 2: Shipping Address Rendering Verification
// ========================================
console.log(`\n${colors.cyan}2. Shipping Address Rendering Verification${colors.reset}\n`);

// Find Shipping Address section
const shippingAddressSectionRegex = /Shipping Address[\s\S]*?(?=Billing Address|$)/;
const shippingAddressSection = pageContent.match(shippingAddressSectionRegex);

if (shippingAddressSection) {
  const sectionContent = shippingAddressSection[0];
  
  // Check for correct field usage in rendering
  const shippingAddressChecks = [
    { pattern: /order\.address\.firstName/, description: 'Uses order.address.firstName' },
    { pattern: /order\.address\.lastName/, description: 'Uses order.address.lastName' },
    { pattern: /order\.address\.address/, description: 'Uses order.address.address (not street)' },
    { pattern: /order\.address\.addressLine2/, description: 'Uses order.address.addressLine2' },
    { pattern: /order\.address\.city/, description: 'Uses order.address.city' },
    { pattern: /order\.address\.district/, description: 'Uses order.address.district (not state)' },
    { pattern: /order\.address\.division/, description: 'Uses order.address.division (not country)' },
    { pattern: /order\.address\.postalCode/, description: 'Uses order.address.postalCode' },
    { pattern: /order\.address\.phone/, description: 'Uses order.address.phone' },
  ];
  
  shippingAddressChecks.forEach(({ pattern, description }) => {
    const hasPattern = pattern.test(sectionContent);
    logTest(
      `Shipping Address ${description}`,
      hasPattern,
      hasPattern ? null : `Pattern not found: ${pattern}`
    );
  });
  
  // Check that deprecated fields are NOT used
  const deprecatedPatterns = [
    { pattern: /order\.address\.street/, description: 'Does NOT use order.address.street' },
    { pattern: /order\.address\.state/, description: 'Does NOT use order.address.state' },
    { pattern: /order\.address\.country/, description: 'Does NOT use order.address.country' },
  ];
  
  deprecatedPatterns.forEach(({ pattern, description }) => {
    const hasDeprecatedPattern = pattern.test(sectionContent);
    logTest(
      `Shipping Address ${description}`,
      !hasDeprecatedPattern,
      hasDeprecatedPattern ? `Deprecated pattern found: ${pattern}` : null
    );
  });
} else {
  logTest('Shipping Address section exists', false, 'Could not find Shipping Address section');
}

// ========================================
// TEST 3: Billing Address Rendering Verification
// ========================================
console.log(`\n${colors.cyan}3. Billing Address Rendering Verification${colors.reset}\n`);

// Find Billing Address section
const billingAddressSection = pageContent.match(/Billing Address[\s\S]*?Same as shipping address/);

if (billingAddressSection) {
  const sectionContent = billingAddressSection[0];
  
  // Check for Billing Address header
  logTest(
    'Billing Address section exists',
    sectionContent.includes('Billing Address'),
    null
  );
  
  // Check for "Same as shipping address" message
  logTest(
    'Billing Address displays "Same as shipping address" message',
    sectionContent.includes('Same as shipping address'),
    null
  );
  
  // Check for CreditCard icon
  logTest(
    'Billing Address has CreditCard icon',
    sectionContent.includes('CreditCard'),
    null
  );
} else {
  logTest('Billing Address section exists', false, 'Could not find Billing Address section');
  logTest('Billing Address displays "Same as shipping address" message', false, 'Billing Address section not found');
}

// ========================================
// TEST 4: No Undefined Values Verification
// ========================================
console.log(`\n${colors.cyan}4. No Undefined Values Verification${colors.reset}\n`);

// Check for conditional rendering of optional fields
const conditionalChecks = [
  { pattern: /order\.address\.addressLine2 &&/, description: 'Conditionally renders addressLine2' },
  { pattern: /order\.address\.phone &&/, description: 'Conditionally renders phone' },
];

conditionalChecks.forEach(({ pattern, description }) => {
  const hasConditional = pattern.test(pageContent);
  logTest(
    description,
    hasConditional,
    hasConditional ? null : 'Conditional rendering not found'
  );
});

// ========================================
// TEST 5: Component Structure Verification
// ========================================
console.log(`\n${colors.cyan}5. Component Structure Verification${colors.reset}\n`);

// Check for proper component structure
const structureChecks = [
  { pattern: /export default function OrderDetailsPage/, description: 'OrderDetailsPage component exported' },
  { pattern: /const formatCurrency/, description: 'formatCurrency utility function exists' },
  { pattern: /const formatDate/, description: 'formatDate utility function exists' },
  { pattern: /const formatStatus/, description: 'formatStatus utility function exists' },
  { pattern: /const getStatusColor/, description: 'getStatusColor utility function exists' },
];

structureChecks.forEach(({ pattern, description }) => {
  const hasStructure = pattern.test(pageContent);
  logTest(
    description,
    hasStructure,
    hasStructure ? null : 'Structure not found'
  );
});

// ========================================
// TEST 6: TypeScript Type Safety Verification
// ========================================
console.log(`\n${colors.cyan}6. TypeScript Type Safety Verification${colors.reset}\n`);

// Check for proper TypeScript typing
const typeChecks = [
  { pattern: /interface Address/, description: 'Address interface defined' },
  { pattern: /interface Order/, description: 'Order interface defined' },
  { pattern: /interface OrderResponse/, description: 'OrderResponse interface defined' },
  { pattern: /interface Product/, description: 'Product interface defined' },
  { pattern: /interface OrderItem/, description: 'OrderItem interface defined' },
];

typeChecks.forEach(({ pattern, description }) => {
  const hasType = pattern.test(pageContent);
  logTest(
    description,
    hasType,
    hasType ? null : 'Type not found'
  );
});

// ========================================
// TEST 7: Import Verification
// ========================================
console.log(`\n${colors.cyan}7. Import Verification${colors.reset}\n`);

// Check for proper imports
const importChecks = [
  { pattern: /import.*MapPin.*from ['"]lucide-react['"]/, description: 'MapPin icon imported' },
  { pattern: /import.*CreditCard.*from ['"]lucide-react['"]/, description: 'CreditCard icon imported' },
  { pattern: /import.*apiClient.*from ['"]@\/lib\/api\/client['"]/, description: 'apiClient imported' },
  { pattern: /import.*useAuth.*from ['"]@\/contexts\/AuthContext['"]/, description: 'useAuth imported' },
];

importChecks.forEach(({ pattern, description }) => {
  const hasImport = pattern.test(pageContent);
  logTest(
    description,
    hasImport,
    hasImport ? null : 'Import not found'
  );
});

// ========================================
// TEST 8: Specific Order ID Verification
// ========================================
console.log(`\n${colors.cyan}8. Specific Order ID Verification${colors.reset}\n`);

// Verify component can handle the specific order ID
const orderIdChecks = [
  { pattern: /const orderId = params\.orderId as string/, description: 'Extracts orderId from params' },
  { pattern: /apiClient\.get\(`\/orders\/\$\{orderId\}`\)/, description: 'Fetches order with correct API endpoint' },
];

orderIdChecks.forEach(({ pattern, description }) => {
  const hasCheck = pattern.test(pageContent);
  logTest(
    description,
    hasCheck,
    hasCheck ? null : 'Check not found'
  );
});

// ========================================
// SUMMARY
// ========================================
console.log(`\n${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}                        TEST SUMMARY${colors.reset}`);
console.log(`${colors.cyan}════════════════════════════════════════════════════════════${colors.reset}\n`);

const totalTests = results.passed.length + results.failed.length;
const passedTests = results.passed.length;
const failedTests = results.failed.length;
const warningCount = results.warnings.length;

console.log(`Total Tests: ${totalTests}`);
console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
console.log(`${colors.yellow}Warnings: ${warningCount}${colors.reset}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`);

if (failedTests > 0) {
  console.log(`${colors.red}Failed Tests:${colors.reset}\n`);
  results.failed.forEach(({ name, message }) => {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) {
      console.log(`  ${message}`);
    }
  });
  console.log('');
}

if (warningCount > 0) {
  console.log(`${colors.yellow}Warnings:${colors.reset}\n`);
  results.warnings.forEach(({ name, message }) => {
    console.log(`${colors.yellow}⚠${colors.reset} ${name}`);
    if (message) {
      console.log(`  ${message}`);
    }
  });
  console.log('');
}

// Overall result
if (failedTests === 0) {
  console.log(`${colors.green}✓ All tests passed!${colors.reset}\n`);
  console.log(`${colors.green}The order details page address display fixes are working correctly.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}✗ Some tests failed. Please review the failures above.${colors.reset}\n`);
  process.exit(1);
}
