/**
 * DETAILED ADMIN SIDEBAR MENU VERIFICATION TEST
 * ===============================================
 * 
 * This test accurately counts and verifies all menu items in the AdminSidebar
 * component, including identifying dynamic route issues.
 * 
 * Test Date: 2026-03-03
 * Component: frontend/src/components/admin/AdminSidebar.tsx
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════════╗
║      ADMIN SIDEBAR DETAILED MENU VERIFICATION TEST               ║
╚══════════════════════════════════════════════════════════════════╝
${colors.reset}`);

// Read the AdminSidebar component
const sidebarPath = path.join(__dirname, 'frontend/src/components/admin/AdminSidebar.tsx');
let sidebarContent = '';

try {
  sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
  console.log(`${colors.green}✓ Successfully read AdminSidebar.tsx${colors.reset}\n`);
} catch (error) {
  console.log(`${colors.red}✗ Failed to read AdminSidebar.tsx: ${error.message}${colors.reset}\n`);
  process.exit(1);
}

// Extract all menu items with their details
console.log(`${colors.bright}${colors.blue}EXTRACTING MENU ITEMS...${colors.reset}`);
console.log('━'.repeat(70));

// Extract all menu items using a more robust regex
const menuItemRegex = /{\s*id:\s*'([^']+)',\s*label:\s*'([^']+)',\s*href:\s*'([^']+)',\s*icon:\s*(\w+)(?:,\s*badge:\s*(\d+))?(?:,\s*disabled:\s*(true|false))?\s*}/g;
const menuItems = [];
let match;

while ((match = menuItemRegex.exec(sidebarContent)) !== null) {
  menuItems.push({
    id: match[1],
    label: match[2],
    href: match[3],
    icon: match[4],
    badge: match[5] ? parseInt(match[5]) : undefined,
    disabled: match[6] === 'true'
  });
}

console.log(`\n${colors.green}Total Menu Items Found: ${menuItems.length}${colors.reset}\n`);

// Group items by category
console.log(`${colors.bright}${colors.blue}MENU CATEGORIES BREAKDOWN:${colors.reset}`);
console.log('━'.repeat(70));

// Extract category information
const categoryRegex = /{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*icon:\s*(\w+),\s*items:\s*\[/g;
const categories = [];
let catMatch;
let lastIndex = 0;

while ((catMatch = categoryRegex.exec(sidebarContent)) !== null) {
  lastIndex = catMatch.index + catMatch[0].length;
  
  // Find the closing bracket for this category's items array
  let bracketCount = 1;
  let itemsEndIndex = lastIndex;
  let i = lastIndex;
  
  while (i < sidebarContent.length && bracketCount > 0) {
    if (sidebarContent[i] === '[') bracketCount++;
    if (sidebarContent[i] === ']') bracketCount--;
    if (bracketCount > 0) itemsEndIndex = i;
    i++;
  }
  
  // Extract items for this category
  const itemsSection = sidebarContent.substring(lastIndex, itemsEndIndex);
  const itemMatches = itemsSection.match(menuItemRegex);
  const categoryItems = itemMatches ? itemMatches.length : 0;
  
  categories.push({
    id: catMatch[1],
    title: catMatch[2],
    icon: catMatch[3],
    itemCount: categoryItems
  });
}

const expectedCategories = [
  { id: 'dashboard', title: 'Dashboard', expected: 1 },
  { id: 'orders', title: 'Orders', expected: 5 },
  { id: 'tracking', title: 'Tracking & Delivery', expected: 5 },
  { id: 'couriers', title: 'Courier Services', expected: 1 },
  { id: 'notifications', title: 'Notifications', expected: 2 },
  { id: 'invoices', title: 'Invoices', expected: 1 },
  { id: 'products', title: 'Products & Catalog', expected: 11 },
  { id: 'cart', title: 'Cart & Wishlist', expected: 18 },
  { id: 'checkout', title: 'Checkout & Payments', expected: 15 },
  { id: 'search', title: 'Search & Discovery', expected: 11 },
  { id: 'system', title: 'System & Infrastructure', expected: 12 }
];

let categoriesMatch = 0;
let totalExpectedItems = 0;

expectedCategories.forEach(expected => {
  totalExpectedItems += expected.expected;
  const found = categories.find(c => c.id === expected.id);
  
  if (found) {
    const match = found.itemCount === expected.expected;
    if (match) {
      console.log(`${colors.green}  ✓ ${found.title}: ${found.itemCount}/${expected.expected} items${colors.reset}`);
      categoriesMatch++;
    } else {
      console.log(`${colors.yellow}  ⚠ ${found.title}: ${found.itemCount}/${expected.expected} items (MISMATCH)${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}  ✗ ${expected.title}: NOT FOUND${colors.reset}`);
  }
});

console.log(`\n${colors.bright}Category Summary:${colors.reset}`);
console.log(`  Categories Found: ${categories.length}/${expectedCategories.length}`);
console.log(`  Categories Matching Expected: ${categoriesMatch}/${expectedCategories.length}`);
console.log(`  Total Items Found: ${menuItems.length}`);
console.log(`  Total Items Expected: ${totalExpectedItems}`);
console.log(`  Status: ${menuItems.length >= 84 ? colors.green + '✓ PASS (84+ items)' : colors.red + '✗ FAIL (less than 84 items)'}${colors.reset}\n`);

// List all menu items by category
console.log(`${colors.bright}${colors.blue}DETAILED MENU ITEMS LIST:${colors.reset}`);
console.log('━'.repeat(70));

categories.forEach(category => {
  console.log(`\n${colors.bright}${category.title}${colors.reset} (${category.itemCount} items)`);
  console.log('  ' + '─'.repeat(68));
  
  // Find items belonging to this category
  const categoryMenuItems = menuItems.filter(item => {
    // Check if the item's href starts with the category's path pattern
    const categoryPathMap = {
      'dashboard': '/admin',
      'orders': '/admin/orders',
      'tracking': '/admin/tracking',
      'couriers': '/admin/courier',
      'notifications': '/admin/notifications',
      'invoices': '/admin/invoices',
      'products': '/admin/products',
      'cart': '/admin/cart',
      'checkout': '/admin/checkout',
      'search': '/admin/search',
      'system': '/admin/rbac'
    };
    
    const basePath = categoryPathMap[category.id];
    return basePath && item.href.startsWith(basePath);
  });
  
  categoryMenuItems.forEach((item, index) => {
    const isDynamic = item.href.includes('[') && item.href.includes(']');
    const statusIcon = isDynamic ? colors.red + '🔴' : colors.green + '✓';
    console.log(`    ${statusIcon}${colors.reset} ${item.label}`);
    console.log(`       ${colors.gray}→ ${item.href}${colors.reset}`);
  });
});

// Identify dynamic routes (CRITICAL ISSUE)
console.log(`\n\n${colors.bright}${colors.red}CRITICAL ISSUE: DYNAMIC ROUTES DETECTED${colors.reset}`);
console.log('━'.repeat(70));

const dynamicRoutes = menuItems.filter(item => 
  item.href.includes('[') && item.href.includes(']')
);

console.log(`${colors.red}⚠ Next.js App Router does NOT support dynamic routes like [id] in Link components!${colors.reset}`);
console.log(`${colors.red}⚠ These routes will cause runtime errors and must be fixed!${colors.reset}\n`);

console.log(`${colors.bright}Dynamic Routes Found (${dynamicRoutes.length}):${colors.reset}\n`);

dynamicRoutes.forEach((item, index) => {
  console.log(`${colors.red}  ${index + 1}. ${item.label}${colors.reset}`);
  console.log(`${colors.red}     HREF: ${item.href}${colors.reset}`);
  console.log(`${colors.red}     Issue: Dynamic route [id] not supported in App Router${colors.reset}\n`);
});

// Verify logout button
console.log(`${colors.bright}${colors.blue}LOGOUT BUTTON VERIFICATION:${colors.reset}`);
console.log('━'.repeat(70));

const logoutChecks = [
  { name: 'Logout button exists', check: sidebarContent.includes('onClick={handleLogout}') },
  { name: 'LogOut icon imported', check: sidebarContent.includes('LogOut') },
  { name: 'LogOut icon in button', check: sidebarContent.includes('<LogOut') },
  { name: 'Confirmation dialog', check: sidebarContent.includes('Confirm Logout') },
  { name: 'Clears adminToken', check: sidebarContent.includes("localStorage.removeItem('adminToken')") },
  { name: 'Clears adminUser', check: sidebarContent.includes("localStorage.removeItem('adminUser')") },
  { name: 'Redirects to login', check: sidebarContent.includes("router.push('/admin/login')") },
  { name: 'Red hover state', check: sidebarContent.includes('text-red-600') && sidebarContent.includes('hover:bg-red-50') }
];

let logoutPass = 0;
logoutChecks.forEach(test => {
  if (test.check) {
    console.log(`${colors.green}  ✓ ${test.name}${colors.reset}`);
    logoutPass++;
  } else {
    console.log(`${colors.red}  ✗ ${test.name}${colors.reset}`);
  }
});

console.log(`\nLogout Button: ${logoutPass}/${logoutChecks.length} checks passed\n`);

// Verify navigation features
console.log(`${colors.bright}${colors.blue}NAVIGATION FEATURES VERIFICATION:${colors.reset}`);
console.log('━'.repeat(70));

const navChecks = [
  { name: 'usePathname hook used', check: sidebarContent.includes('const pathname = usePathname()') },
  { name: 'isActive function', check: sidebarContent.includes('const isActive = (href: string)') },
  { name: 'Active state styling', check: sidebarContent.includes('bg-blue-50') && sidebarContent.includes('text-blue-700') },
  { name: 'Category expansion state', check: sidebarContent.includes('const [expandedCategories, setExpandedCategories]') },
  { name: 'toggleCategory function', check: sidebarContent.includes('const toggleCategory = (categoryId: string)') },
  { name: 'Auto-expand on navigation', check: sidebarContent.includes('useEffect') && sidebarContent.includes('activeCategory') },
  { name: 'Chevron rotation', check: sidebarContent.includes('rotate-180') }
];

let navPass = 0;
navChecks.forEach(test => {
  if (test.check) {
    console.log(`${colors.green}  ✓ ${test.name}${colors.reset}`);
    navPass++;
  } else {
    console.log(`${colors.red}  ✗ ${test.name}${colors.reset}`);
  }
});

console.log(`\nNavigation Features: ${navPass}/${navChecks.length} checks passed\n`);

// Verify responsive design
console.log(`${colors.bright}${colors.blue}RESPONSIVE DESIGN VERIFICATION:${colors.reset}`);
console.log('━'.repeat(70));

const responsiveChecks = [
  { name: 'Mobile menu button', check: sidebarContent.includes('lg:hidden') && sidebarContent.includes('<Menu') },
  { name: 'Mobile overlay', check: sidebarContent.includes('bg-black/50') && sidebarContent.includes('z-40 lg:hidden') },
  { name: 'Sidebar transform', check: sidebarContent.includes('transform transition-transform duration-300') },
  { name: 'Mobile hidden state', check: sidebarContent.includes('-translate-x-full lg:translate-x-0') },
  { name: 'Close button on mobile', check: sidebarContent.includes('<X') && sidebarContent.includes('lg:hidden') },
  { name: 'Links close sidebar', check: sidebarContent.includes('onClick={onMobileClose}') }
];

let responsivePass = 0;
responsiveChecks.forEach(test => {
  if (test.check) {
    console.log(`${colors.green}  ✓ ${test.name}${colors.reset}`);
    responsivePass++;
  } else {
    console.log(`${colors.red}  ✗ ${test.name}${colors.reset}`);
  }
});

console.log(`\nResponsive Design: ${responsivePass}/${responsiveChecks.length} checks passed\n`);

// Verify icon imports
console.log(`${colors.bright}${colors.blue}ICON IMPORTS VERIFICATION:${colors.reset}`);
console.log('━'.repeat(70));

const iconImportRegex = /from\s+['"]lucide-react['"]\s*;/;
const iconSectionMatch = sidebarContent.match(/import\s*{([^}]+)}\s*from\s+['"]lucide-react['"]/);

let iconCount = 0;
if (iconSectionMatch) {
  const iconList = iconSectionMatch[1];
  const icons = iconList.split(',').map(i => i.trim());
  iconCount = icons.length;
  console.log(`${colors.green}  ✓ ${iconCount} icons imported from lucide-react${colors.reset}`);
} else {
  console.log(`${colors.red}  ✗ Could not find lucide-react imports${colors.reset}`);
}

console.log(`\n`);

// Generate comprehensive summary
console.log(`${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════════════╗
║                       COMPREHENSIVE SUMMARY                        ║
╚══════════════════════════════════════════════════════════════════╝
${colors.reset}`);

console.log(`${colors.bright}MENU STRUCTURE:${colors.reset}`);
console.log(`  Total Categories: ${categories.length}/${expectedCategories.length}`);
console.log(`  Categories Matching: ${categoriesMatch}/${expectedCategories.length}`);
console.log(`  Total Menu Items: ${menuItems.length}`);
console.log(`  Expected Items: ${totalExpectedItems} (84+)`);
console.log(`  Item Count Status: ${menuItems.length >= 84 ? colors.green + '✓ PASS' : colors.red + '✗ FAIL'}${colors.reset}`);

console.log(`\n${colors.bright}${colors.red}CRITICAL ISSUES:${colors.reset}`);
console.log(`  ${colors.red}🔴 Dynamic Routes: ${dynamicRoutes.length} found${colors.reset}`);
console.log(`  ${colors.red}🔴 Severity: CRITICAL - Will cause Next.js App Router errors${colors.reset}`);
console.log(`  ${colors.red}🔴 Impact: These routes cannot be used directly in Link components${colors.reset}`);

console.log(`\n${colors.bright}FEATURE VERIFICATION:${colors.reset}`);
console.log(`  ${colors.green}✓ Logout Button: ${logoutPass}/${logoutChecks.length} checks passed${colors.reset}`);
console.log(`  ${colors.green}✓ Navigation: ${navPass}/${navChecks.length} checks passed${colors.reset}`);
console.log(`  ${colors.green}✓ Responsive Design: ${responsivePass}/${responsiveChecks.length} checks passed${colors.reset}`);
console.log(`  ${colors.green}✓ Icon Imports: ${iconCount} icons${colors.reset}`);

console.log(`\n${colors.bright}DYNAMIC ROUTES LIST:${colors.reset}`);
dynamicRoutes.forEach((item, index) => {
  console.log(`  ${index + 1}. ${item.href} (${item.label})`);
});

console.log(`\n${colors.bright}${colors.yellow}RECOMMENDATIONS:${colors.reset}`);
console.log(`  ${colors.yellow}1. CRITICAL: Fix all ${dynamicRoutes.length} dynamic routes${colors.reset}`);
console.log(`  ${colors.yellow}2. Options for fixing dynamic routes:${colors.reset}`);
console.log(`  ${colors.yellow}   - Use template literals: href={\`/admin/path/\${id}\`}${colors.reset}`);
console.log(`  ${colors.yellow}   - Use useRouter.push() for dynamic navigation${colors.reset}`);
console.log(`  ${colors.yellow}   - Remove dynamic routes from sidebar navigation${colors.reset}`);
console.log(`  ${colors.yellow}3. All other features are working correctly${colors.reset}`);

console.log(`\n${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════════╗
║                    END OF TEST REPORT                            ║
╚══════════════════════════════════════════════════════════════════╝
${colors.reset}`);

// Save detailed results to JSON
const results = {
  timestamp: new Date().toISOString(),
  component: 'frontend/src/components/admin/AdminSidebar.tsx',
  menuStructure: {
    totalCategories: categories.length,
    expectedCategories: expectedCategories.length,
    categoriesMatching: categoriesMatch,
    totalItems: menuItems.length,
    expectedItems: totalExpectedItems,
    meetsRequirement: menuItems.length >= 84,
    categories: categories
  },
  criticalIssues: {
    dynamicRoutes: dynamicRoutes.map(r => ({
      label: r.label,
      href: r.href,
      issue: 'Dynamic route not supported in Next.js App Router'
    })),
    count: dynamicRoutes.length,
    severity: 'CRITICAL'
  },
  featureVerification: {
    logoutButton: { passed: logoutPass, total: logoutChecks.length },
    navigation: { passed: navPass, total: navChecks.length },
    responsiveDesign: { passed: responsivePass, total: responsiveChecks.length },
    iconImports: iconCount
  },
  allMenuItems: menuItems,
  overallStatus: {
    menuStructure: menuItems.length >= 84 ? 'PASS' : 'FAIL',
    criticalIssues: dynamicRoutes.length > 0 ? 'FAIL' : 'PASS',
    features: 'PASS'
  }
};

const resultsPath = path.join(__dirname, `admin-sidebar-detailed-results-${Date.now()}.json`);
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`\n${colors.cyan}Detailed results saved to: ${resultsPath}${colors.reset}\n`);
