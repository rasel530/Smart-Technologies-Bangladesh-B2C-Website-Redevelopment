/**
 * Admin Navigation Comprehensive Test
 * 
 * This test script verifies the admin navigation functionality including:
 * - All 14 admin pages are accessible
 * - Sidebar is present on all pages
 * - Navigation links work correctly
 * - Active page highlighting
 * - Menu categories and items
 * - Icons and badges
 * - Missing menu items from previous dashboard
 * - Logout button presence
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_PAGES = [
  { path: '/admin', name: 'Dashboard Overview', category: 'dashboard' },
  { path: '/admin/orders', name: 'All Orders', category: 'orders' },
  { path: '/admin/orders/modifications', name: 'Order Modifications', category: 'orders' },
  { path: '/admin/orders/cancellations', name: 'Order Cancellations', category: 'orders' },
  { path: '/admin/orders/fulfillments', name: 'Order Fulfillments', category: 'orders' },
  { path: '/admin/courier-services', name: 'Manage Couriers', category: 'couriers' },
  { path: '/admin/notifications', name: 'All Notifications', category: 'notifications' },
  { path: '/admin/notifications/stats', name: 'Notification Statistics', category: 'notifications' },
  { path: '/admin/invoices', name: 'Invoice Management', category: 'invoices' },
  { path: '/admin/orders/sharing', name: 'Order Sharing', category: 'orders' },
  { path: '/admin/tracking/analytics', name: 'Tracking Analytics', category: 'tracking' },
  { path: '/admin/tracking/issues', name: 'Tracking Issues', category: 'tracking' },
  { path: '/admin/delivery/performance', name: 'Delivery Performance', category: 'tracking' },
  { path: '/admin/tracking/sync', name: 'Tracking Sync', category: 'tracking' },
  { path: '/admin/delivery/confirmations', name: 'Delivery Confirmations', category: 'tracking' },
];

// Expected menu items from AdminSidebar.tsx
const EXPECTED_MENU_CATEGORIES = [
  { id: 'dashboard', title: 'Dashboard', items: ['Dashboard Overview'] },
  { id: 'orders', title: 'Orders', items: ['All Orders', 'Order Modifications', 'Order Cancellations', 'Order Fulfillments', 'Order Sharing'] },
  { id: 'tracking', title: 'Tracking & Delivery', items: ['Tracking Analytics', 'Tracking Issues', 'Tracking Sync', 'Delivery Performance', 'Delivery Confirmations'] },
  { id: 'couriers', title: 'Courier Services', items: ['Manage Couriers'] },
  { id: 'notifications', title: 'Notifications', items: ['All Notifications', 'Notification Statistics'] },
  { id: 'invoices', title: 'Invoices', items: ['Invoice Management'] },
  { id: 'system', title: 'System', items: ['RBAC Management', 'Product Management', 'User Management', 'Settings'] },
];

// Expected icons (from lucide-react)
const EXPECTED_ICONS = [
  'LayoutDashboard', 'ShoppingCart', 'FileEdit', 'XCircle', 'Package',
  'Share2', 'BarChart3', 'AlertTriangle', 'RefreshCw', 'TrendingUp',
  'CheckCircle', 'Truck', 'Bell', 'PieChart', 'FileText', 'Shield',
  'Users', 'Settings', 'ChevronDown', 'ChevronRight', 'Menu', 'X', 'Home'
];

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  pageTests: [],
  sidebarTests: [],
  missingItems: [],
  issues: []
};

/**
 * Helper function to make HTTP request
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          content: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Test a single admin page
 */
async function testPage(page) {
  const url = `${BASE_URL}${page.path}`;
  const result = {
    page: page.name,
    path: page.path,
    category: page.category,
    status: 'PENDING',
    statusCode: null,
    hasSidebar: false,
    hasNavigation: false,
    hasAdminLayout: false,
    hasActiveHighlight: false,
    contentLength: 0,
    issues: []
  };

  try {
    const response = await makeRequest(page.path);
    result.statusCode = response.statusCode;
    result.contentLength = response.content.length;

    // Check if page is accessible
    if (response.statusCode === 200) {
      result.status = 'PASS';
      testResults.summary.passed++;
    } else if (response.statusCode === 307 || response.statusCode === 308) {
      result.status = 'PASS (Redirect)';
      testResults.summary.passed++;
    } else {
      result.status = 'FAIL';
      result.issues.push(`Unexpected status code: ${response.statusCode}`);
      testResults.summary.failed++;
    }

    // Check for AdminLayout presence
    const hasAdminLayout = response.content.includes('AdminLayout') || 
                           response.content.includes('min-h-screen bg-gray-50');
    result.hasAdminLayout = hasAdminLayout;

    // Check for sidebar presence
    const hasSidebar = response.content.includes('AdminSidebar') ||
                      response.content.includes('fixed top-0 left-0 h-full w-64');
    result.hasSidebar = hasSidebar;

    // Check for navigation menu
    const hasNavigation = response.content.includes('menuCategories') ||
                         response.content.includes('Dashboard Overview');
    result.hasNavigation = hasNavigation;

    // Check for active page highlighting
    const hasActiveHighlight = response.content.includes('bg-blue-50 text-blue-700') ||
                               response.content.includes('border-blue-600');
    result.hasActiveHighlight = hasActiveHighlight;

    // Verify sidebar elements
    if (!hasSidebar) {
      result.issues.push('Sidebar not found in page');
      testResults.summary.warnings++;
    }

    if (!hasAdminLayout) {
      result.issues.push('AdminLayout not found in page');
      testResults.summary.warnings++;
    }

  } catch (error) {
    result.status = 'ERROR';
    result.issues.push(`Request failed: ${error.message}`);
    testResults.summary.failed++;
  }

  testResults.summary.total++;
  return result;
}

/**
 * Test sidebar structure and components
 */
async function testSidebarStructure() {
  console.log('\n=== Testing Sidebar Structure ===\n');
  
  const sidebarTests = {
    hasCategories: false,
    hasIcons: false,
    hasChevronIndicators: false,
    hasMenuButton: false,
    hasCloseButton: false,
    hasBackToWebsite: false,
    hasLogoutButton: false,
    hasComingSoonBadge: false,
    issues: []
  };

  try {
    // Test admin home page for sidebar structure
    const response = await makeRequest('/admin');
    const content = response.content;

    // Check for menu categories
    const hasCategories = EXPECTED_MENU_CATEGORIES.every(cat => 
      content.includes(cat.title)
    );
    sidebarTests.hasCategories = hasCategories;
    if (!hasCategories) {
      sidebarTests.issues.push('Not all menu categories are present');
      testResults.summary.warnings++;
    }

    // Check for icons (lucide-react icons)
    const hasIcons = EXPECTED_ICONS.some(icon => 
      content.includes(icon)
    );
    sidebarTests.hasIcons = hasIcons;
    if (!hasIcons) {
      sidebarTests.issues.push('Icons not found in sidebar');
      testResults.summary.warnings++;
    }

    // Check for chevron indicators (expand/collapse)
    const hasChevronIndicators = content.includes('ChevronDown') || 
                                  content.includes('ChevronRight');
    sidebarTests.hasChevronIndicators = hasChevronIndicators;
    if (!hasChevronIndicators) {
      sidebarTests.issues.push('Chevron indicators not found');
      testResults.summary.warnings++;
    }

    // Check for mobile menu button
    const hasMenuButton = content.includes('Menu') && 
                         content.includes('lg:hidden');
    sidebarTests.hasMenuButton = hasMenuButton;
    if (!hasMenuButton) {
      sidebarTests.issues.push('Mobile menu button not found');
      testResults.summary.warnings++;
    }

    // Check for close button
    const hasCloseButton = content.includes('X') && 
                          content.includes('lg:hidden');
    sidebarTests.hasCloseButton = hasCloseButton;
    if (!hasCloseButton) {
      sidebarTests.issues.push('Close button not found');
      testResults.summary.warnings++;
    }

    // Check for "Back to Website" link
    const hasBackToWebsite = content.includes('Back to Website');
    sidebarTests.hasBackToWebsite = hasBackToWebsite;
    if (!hasBackToWebsite) {
      sidebarTests.issues.push('"Back to Website" link not found');
      testResults.summary.warnings++;
    }

    // Check for logout button (CRITICAL - user mentioned it's missing)
    const hasLogoutButton = content.includes('Logout') || 
                           content.includes('Sign Out') ||
                           content.includes('logout');
    sidebarTests.hasLogoutButton = hasLogoutButton;
    if (!hasLogoutButton) {
      sidebarTests.issues.push('LOGOUT BUTTON IS MISSING - CRITICAL ISSUE');
      testResults.summary.warnings++;
    }

    // Check for "Coming Soon" badge
    const hasComingSoonBadge = content.includes('Soon') || 
                              content.includes('Coming Soon');
    sidebarTests.hasComingSoonBadge = hasComingSoonBadge;
    if (!hasComingSoonBadge) {
      sidebarTests.issues.push('"Coming Soon" badge not found');
      testResults.summary.warnings++;
    }

  } catch (error) {
    sidebarTests.issues.push(`Sidebar structure test failed: ${error.message}`);
    testResults.summary.failed++;
  }

  testResults.sidebarTests.push(sidebarTests);
  return sidebarTests;
}

/**
 * Check for missing menu items from previous admin dashboard
 */
async function checkMissingMenuItems() {
  console.log('\n=== Checking for Missing Menu Items ===\n');
  
  const missingItems = [];
  
  try {
    const response = await makeRequest('/admin');
    const content = response.content;

    // List of menu items that might be missing (based on user feedback)
    const potentialMissingItems = [
      'Dashboard Overview',
      'All Orders',
      'Order Modifications',
      'Order Cancellations',
      'Order Fulfillments',
      'Order Sharing',
      'Tracking Analytics',
      'Tracking Issues',
      'Tracking Sync',
      'Delivery Performance',
      'Delivery Confirmations',
      'Manage Couriers',
      'All Notifications',
      'Notification Statistics',
      'Invoice Management',
      'RBAC Management',
      'Product Management',
      'User Management',
      'Settings'
    ];

    potentialMissingItems.forEach(item => {
      if (!content.includes(item)) {
        missingItems.push({
          item: item,
          status: 'MISSING'
        });
        testResults.summary.warnings++;
      } else {
        missingItems.push({
          item: item,
          status: 'PRESENT'
        });
      }
    });

    // Check for system category items
    const systemItems = ['RBAC Management', 'Product Management', 'User Management', 'Settings'];
    systemItems.forEach(item => {
      const hasItem = content.includes(item);
      if (!hasItem) {
        testResults.missingItems.push({
          item: item,
          category: 'System',
          status: 'MISSING'
        });
      }
    });

  } catch (error) {
    testResults.issues.push(`Missing menu items check failed: ${error.message}`);
    testResults.summary.failed++;
  }

  return missingItems;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     ADMIN NAVIGATION COMPREHENSIVE TEST SUITE                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nTest started at: ${testResults.timestamp}\n`);

  console.log('=== Testing All Admin Pages ===\n');
  
  // Test all admin pages
  for (const page of ADMIN_PAGES) {
    console.log(`Testing: ${page.name} (${page.path})...`);
    const result = await testPage(page);
    testResults.pageTests.push(result);
    
    if (result.status === 'PASS' || result.status === 'PASS (Redirect)') {
      console.log(`  ✓ ${result.status}`);
    } else {
      console.log(`  ✗ ${result.status}`);
      result.issues.forEach(issue => console.log(`    - ${issue}`));
    }
  }

  // Test sidebar structure
  await testSidebarStructure();

  // Check for missing menu items
  await checkMissingMenuItems();

  // Generate report
  generateReport();
}

/**
 * Generate comprehensive test report
 */
function generateReport() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST REPORT SUMMARY                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('=== Overall Summary ===');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Warnings: ${testResults.summary.warnings}\n`);

  console.log('=== Page Test Results ===\n');
  testResults.pageTests.forEach(test => {
    const statusIcon = test.status === 'PASS' || test.status === 'PASS (Redirect)' ? '✓' : '✗';
    console.log(`${statusIcon} ${test.page}`);
    console.log(`  Path: ${test.path}`);
    console.log(`  Status: ${test.status}`);
    console.log(`  Status Code: ${test.statusCode}`);
    console.log(`  Has Sidebar: ${test.hasSidebar ? 'Yes' : 'No'}`);
    console.log(`  Has AdminLayout: ${test.hasAdminLayout ? 'Yes' : 'No'}`);
    console.log(`  Has Navigation: ${test.hasNavigation ? 'Yes' : 'No'}`);
    console.log(`  Has Active Highlight: ${test.hasActiveHighlight ? 'Yes' : 'No'}`);
    console.log(`  Content Length: ${test.contentLength} chars`);
    if (test.issues.length > 0) {
      console.log('  Issues:');
      test.issues.forEach(issue => console.log(`    - ${issue}`));
    }
    console.log('');
  });

  console.log('=== Sidebar Structure Tests ===\n');
  const sidebarTests = testResults.sidebarTests[0];
  console.log(`Has Menu Categories: ${sidebarTests.hasCategories ? '✓' : '✗'}`);
  console.log(`Has Icons: ${sidebarTests.hasIcons ? '✓' : '✗'}`);
  console.log(`Has Chevron Indicators: ${sidebarTests.hasChevronIndicators ? '✓' : '✗'}`);
  console.log(`Has Mobile Menu Button: ${sidebarTests.hasMenuButton ? '✓' : '✗'}`);
  console.log(`Has Close Button: ${sidebarTests.hasCloseButton ? '✓' : '✗'}`);
  console.log(`Has "Back to Website" Link: ${sidebarTests.hasBackToWebsite ? '✓' : '✗'}`);
  console.log(`Has Logout Button: ${sidebarTests.hasLogoutButton ? '✓' : '✗'} ⚠️`);
  console.log(`Has "Coming Soon" Badge: ${sidebarTests.hasComingSoonBadge ? '✓' : '✗'}`);
  
  if (sidebarTests.issues.length > 0) {
    console.log('\nIssues:');
    sidebarTests.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  console.log('');

  console.log('=== Critical Issues Found ===\n');
  const criticalIssues = [];
  
  if (!sidebarTests.hasLogoutButton) {
    criticalIssues.push({
      severity: 'CRITICAL',
      issue: 'Logout button is missing from the sidebar',
      impact: 'Users cannot log out from the admin panel',
      recommendation: 'Add a logout button in the sidebar footer area'
    });
  }

  // Check for missing menu items
  const missingMenuItems = testResults.missingItems.filter(item => item.status === 'MISSING');
  if (missingMenuItems.length > 0) {
    criticalIssues.push({
      severity: 'HIGH',
      issue: `${missingMenuItems.length} menu items are missing from the sidebar`,
      impact: 'Users cannot access all admin features',
      recommendation: 'Review and add all missing menu items from the previous admin dashboard'
    });
  }

  // Check pages without sidebar
  const pagesWithoutSidebar = testResults.pageTests.filter(test => !test.hasSidebar);
  if (pagesWithoutSidebar.length > 0) {
    criticalIssues.push({
      severity: 'HIGH',
      issue: `${pagesWithoutSidebar.length} pages do not have the sidebar`,
      impact: 'Navigation is inconsistent across admin pages',
      recommendation: 'Ensure all admin pages use AdminLayout component'
    });
  }

  // Check pages without active highlighting
  const pagesWithoutHighlight = testResults.pageTests.filter(test => !test.hasActiveHighlight);
  if (pagesWithoutHighlight.length > 0) {
    criticalIssues.push({
      severity: 'MEDIUM',
      issue: `${pagesWithoutHighlight.length} pages do not show active highlighting`,
      impact: 'Users cannot easily identify which page they are on',
      recommendation: 'Ensure active page highlighting works on all pages'
    });
  }

  if (criticalIssues.length > 0) {
    criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.issue}`);
      console.log(`   Impact: ${issue.impact}`);
      console.log(`   Recommendation: ${issue.recommendation}\n`);
    });
  } else {
    console.log('No critical issues found.\n');
  }

  console.log('=== Expected Menu Categories ===\n');
  EXPECTED_MENU_CATEGORIES.forEach(cat => {
    console.log(`${cat.title}:`);
    cat.items.forEach(item => {
      console.log(`  - ${item}`);
    });
  });

  console.log('\n=== Menu Items Status ===\n');
  const allMenuItems = EXPECTED_MENU_CATEGORIES.flatMap(cat => 
    cat.items.map(item => ({ item, category: cat.title }))
  );
  
  allMenuItems.forEach(({ item, category }) => {
    const pageTest = testResults.pageTests.find(test => test.page === item);
    const status = pageTest ? (pageTest.status === 'PASS' || pageTest.status === 'PASS (Redirect)' ? '✓' : '✗') : '?';
    console.log(`${status} [${category}] ${item}`);
  });

  console.log('\n=== Recommendations ===\n');
  console.log('1. Add a logout button to the sidebar footer area');
  console.log('2. Review and add all missing menu items from the previous admin dashboard');
  console.log('3. Ensure all admin pages use the AdminLayout component');
  console.log('4. Verify active page highlighting works correctly on all pages');
  console.log('5. Test responsive behavior on mobile devices');
  console.log('6. Verify all icons display correctly');
  console.log('7. Test menu category expand/collapse functionality');

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST COMPLETED                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Save results to JSON file
  const filename = `admin-navigation-test-results-${Date.now()}.json`;
  const fs = require('fs');
  fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
  console.log(`Detailed test results saved to: ${filename}\n`);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
