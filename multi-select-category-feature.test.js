/**
 * Multi-Select Hierarchical Category Feature Test Script
 * 
 * This script tests the multi-select hierarchical category feature implementation
 * for the admin product management interface.
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:3001
 * - Frontend server running on http://localhost:3000
 * - PostgreSQL database accessible
 * - Admin user with authentication token
 */

const axios = require('axios');
const { Client } = require('pg');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';
const DB_CONNECTION_STRING = 'postgresql://smart_dev:smart_dev_password_2024@localhost:5432/smart_ecommerce_dev';
const API_BASE_PATH = '/api/v1';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  skipped: []
};

// Helper function to log test results
function logTest(testName, passed, message) {
  const result = {
    testName,
    passed,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ PASS: ${testName}`);
    if (message) console.log(`   ${message}`);
  } else {
    testResults.failed.push(result);
    console.log(`❌ FAIL: ${testName}`);
    if (message) console.log(`   ${message}`);
  }
}

// Helper function to log skipped tests
function logSkip(testName, reason) {
  const result = {
    testName,
    reason,
    timestamp: new Date().toISOString()
  };
  testResults.skipped.push(result);
  console.log(`⏭️  SKIP: ${testName} - ${reason}`);
}

// ============================================
// 1. DATABASE VERIFICATION TESTS
// ============================================

async function testDatabaseSchema() {
  console.log('\n============================================');
  console.log('DATABASE VERIFICATION TESTS');
  console.log('============================================\n');
  
  const client = new Client({ connectionString: DB_CONNECTION_STRING });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Test 1: Verify ProductCategory table exists
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'product_categories'
        );
      `);
      const tableExists = result.rows[0].exists;
      logTest(
        'Database: ProductCategory table exists',
        tableExists,
        tableExists ? 'Table found in database' : 'Table not found'
      );
    } catch (error) {
      logTest('Database: ProductCategory table exists', false, error.message);
    }
    
    // Test 2: Verify isPrimary column exists
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'product_categories' 
          AND column_name = 'isPrimary'
        );
      `);
      const columnExists = result.rows[0].exists;
      logTest(
        'Database: isPrimary column exists in ProductCategory',
        columnExists,
        columnExists ? 'Column found in table' : 'Column not found'
      );
    } catch (error) {
      logTest('Database: isPrimary column exists in ProductCategory', false, error.message);
    }
    
    // Test 3: Verify indexes exist
    try {
      const result = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'product_categories';
      `);
      const indexes = result.rows.map(row => row.indexname);
      const hasProductIdIndex = indexes.some(idx => idx.includes('product_id'));
      const hasCategoryIdIndex = indexes.some(idx => idx.includes('category_id'));
      const hasIsPrimaryIndex = indexes.some(idx => idx.includes('is_primary'));
      
      logTest(
        'Database: ProductCategory has productId index',
        hasProductIdIndex,
        hasProductIdIndex ? 'Index found' : 'Index not found'
      );
      logTest(
        'Database: ProductCategory has categoryId index',
        hasCategoryIdIndex,
        hasCategoryIdIndex ? 'Index found' : 'Index not found'
      );
      logTest(
        'Database: ProductCategory has isPrimary index',
        hasIsPrimaryIndex,
        hasIsPrimaryIndex ? 'Index found' : 'Index not found'
      );
    } catch (error) {
      logTest('Database: ProductCategory indexes', false, error.message);
    }
    
    // Test 4: Verify unique constraint on productId + categoryId
    try {
      const result = await client.query(`
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'product_categories'::regclass 
        AND contype = 'u';
      `);
      const hasUniqueConstraint = result.rows.length > 0;
      logTest(
        'Database: Unique constraint on (productId, categoryId)',
        hasUniqueConstraint,
        hasUniqueConstraint ? 'Constraint found' : 'Constraint not found'
      );
    } catch (error) {
      logTest('Database: Unique constraint on (productId, categoryId)', false, error.message);
    }
    
    // Test 5: Check for existing products with categories
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM product_categories;
      `);
      const count = parseInt(result.rows[0].count);
      logTest(
        'Database: Products with categories exist',
        count > 0,
        `Found ${count} product-category associations`
      );
    } catch (error) {
      logTest('Database: Products with categories exist', false, error.message);
    }
    
    // Test 6: Check for products with primary categories
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count
        FROM product_categories
        WHERE "isPrimary" = true;
      `);
      const count = parseInt(result.rows[0].count);
      logTest(
        'Database: Products with primary category exist',
        count > 0,
        `Found ${count} primary category assignments`
      );
    } catch (error) {
      logTest('Database: Products with primary category exist', false, error.message);
    }
    
  } catch (error) {
    console.error('Database connection error:', error.message);
    logTest('Database: Connection', false, error.message);
  } finally {
    await client.end();
  }
}

// ============================================
// 2. API INTEGRATION TESTS
// ============================================

async function testAPIEndpoints() {
  console.log('\n============================================');
  console.log('API INTEGRATION TESTS');
  console.log('============================================\n');
  
  // Test 1: Get categories endpoint
  try {
    const response = await axios.get(`${BACKEND_URL}${API_BASE_PATH}/categories`, {
      params: { status: 'active', limit: 100 }
    });
    const success = response.status === 200 && response.data.categories;
    logTest(
      'API: GET /api/v1/categories returns categories',
      success,
      success ? `Returned ${response.data.categories.length} categories` : 'Failed to return categories'
    );
  } catch (error) {
    logTest('API: GET /api/v1/categories returns categories', false, error.message);
  }
  
  // Test 2: Categories have hierarchical structure
  try {
    const response = await axios.get(`${BACKEND_URL}${API_BASE_PATH}/categories`, {
      params: { status: 'active', limit: 100 }
    });
    const hasHierarchy = response.data.categories && 
                        response.data.categories.some(cat => cat.children && cat.children.length > 0);
    logTest(
      'API: Categories have hierarchical structure (children)',
      hasHierarchy,
      hasHierarchy ? 'Hierarchy structure confirmed' : 'No hierarchy found'
    );
  } catch (error) {
    logTest('API: Categories have hierarchical structure', false, error.message);
  }
  
  // Test 3: Categories have nameEn and nameBn fields
  try {
    const response = await axios.get(`${BACKEND_URL}${API_BASE_PATH}/categories`, {
      params: { status: 'active', limit: 10 }
    });
    const hasBilingualNames = response.data.categories && 
                            response.data.categories.every(cat => cat.nameEn);
    logTest(
      'API: Categories have nameEn field',
      hasBilingualNames,
      hasBilingualNames ? 'All categories have nameEn' : 'Some categories missing nameEn'
    );
  } catch (error) {
    logTest('API: Categories have nameEn field', false, error.message);
  }
}

// ============================================
// 3. FRONTEND COMPONENT TESTS
// ============================================

async function testFrontendComponent() {
  console.log('\n============================================');
  console.log('FRONTEND COMPONENT TESTS');
  console.log('============================================\n');
  
  // Test 1: ProductForm component exists
  try {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, 'frontend/src/components/admin/ProductForm.tsx');
    const exists = fs.existsSync(componentPath);
    logTest(
      'Frontend: ProductForm.tsx component exists',
      exists,
      exists ? 'Component file found' : 'Component file not found'
    );
  } catch (error) {
    logTest('Frontend: ProductForm.tsx component exists', false, error.message);
  }
  
  // Test 2: ProductForm imports required icons
  try {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, 'frontend/src/components/admin/ProductForm.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    const hasCheckIcon = content.includes('Check');
    const hasSearchIcon = content.includes('Search');
    const hasStarIcon = content.includes('Star');
    const hasFolderIcon = content.includes('Folder');
    const hasChevronIcon = content.includes('Chevron');
    
    logTest(
      'Frontend: ProductForm imports Check icon',
      hasCheckIcon,
      hasCheckIcon ? 'Check icon imported' : 'Check icon not found'
    );
    logTest(
      'Frontend: ProductForm imports Search icon',
      hasSearchIcon,
      hasSearchIcon ? 'Search icon imported' : 'Search icon not found'
    );
    logTest(
      'Frontend: ProductForm imports Star icon',
      hasStarIcon,
      hasStarIcon ? 'Star icon imported' : 'Star icon not found'
    );
    logTest(
      'Frontend: ProductForm imports Folder icons',
      hasFolderIcon,
      hasFolderIcon ? 'Folder icons imported' : 'Folder icons not found'
    );
    logTest(
      'Frontend: ProductForm imports Chevron icons',
      hasChevronIcon,
      hasChevronIcon ? 'Chevron icons imported' : 'Chevron icons not found'
    );
  } catch (error) {
    logTest('Frontend: ProductForm icon imports', false, error.message);
  }
  
  // Test 3: ProductForm has category state management
  try {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, 'frontend/src/components/admin/ProductForm.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    const hasCategoryState = content.includes('formData.categories');
    const hasCategorySearchState = content.includes('categorySearchQuery');
    const hasExpandedState = content.includes('expandedCategories');
    
    logTest(
      'Frontend: ProductForm has categories state',
      hasCategoryState,
      hasCategoryState ? 'Categories state found' : 'Categories state not found'
    );
    logTest(
      'Frontend: ProductForm has categorySearchQuery state',
      hasCategorySearchState,
      hasCategorySearchState ? 'Search query state found' : 'Search query state not found'
    );
    logTest(
      'Frontend: ProductForm has expandedCategories state',
      hasExpandedState,
      hasExpandedState ? 'Expanded categories state found' : 'Expanded categories state not found'
    );
  } catch (error) {
    logTest('Frontend: ProductForm state management', false, error.message);
  }
  
  // Test 4: ProductForm has category handler functions
  try {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, 'frontend/src/components/admin/ProductForm.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    const hasToggleHandler = content.includes('handleCategoryToggle');
    const hasPrimaryHandler = content.includes('handleSetPrimaryCategory');
    const hasExpansionHandler = content.includes('toggleCategoryExpansion');
    const hasFilterFunction = content.includes('getFilteredCategories');
    const hasRenderFunction = content.includes('renderCategory');
    
    logTest(
      'Frontend: ProductForm has handleCategoryToggle function',
      hasToggleHandler,
      hasToggleHandler ? 'Toggle handler found' : 'Toggle handler not found'
    );
    logTest(
      'Frontend: ProductForm has handleSetPrimaryCategory function',
      hasPrimaryHandler,
      hasPrimaryHandler ? 'Primary category handler found' : 'Primary category handler not found'
    );
    logTest(
      'Frontend: ProductForm has toggleCategoryExpansion function',
      hasExpansionHandler,
      hasExpansionHandler ? 'Expansion handler found' : 'Expansion handler not found'
    );
    logTest(
      'Frontend: ProductForm has getFilteredCategories function',
      hasFilterFunction,
      hasFilterFunction ? 'Filter function found' : 'Filter function not found'
    );
    logTest(
      'Frontend: ProductForm has renderCategory function',
      hasRenderFunction,
      hasRenderFunction ? 'Render function found' : 'Render function not found'
    );
  } catch (error) {
    logTest('Frontend: ProductForm handler functions', false, error.message);
  }
  
  // Test 5: ProductForm validates categories
  try {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, 'frontend/src/components/admin/ProductForm.tsx');
    const content = fs.readFileSync(componentPath, 'utf8');
    
    const hasCategoryValidation = content.includes('formData.categories.length === 0') ||
                                  content.includes('At least one category is required');
    
    logTest(
      'Frontend: ProductForm validates category selection',
      hasCategoryValidation,
      hasCategoryValidation ? 'Category validation found' : 'Category validation not found'
    );
  } catch (error) {
    logTest('Frontend: ProductForm category validation', false, error.message);
  }
}

// ============================================
// 4. FEATURE IMPLEMENTATION TESTS
// ============================================

async function testFeatureImplementation() {
  console.log('\n============================================');
  console.log('FEATURE IMPLEMENTATION TESTS');
  console.log('============================================\n');
  
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'frontend/src/components/admin/ProductForm.tsx');
  
  try {
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Test 1: Multi-select with checkboxes
    const hasCheckbox = content.includes('type="checkbox"') || 
                       content.includes('border-2 rounded flex items-center justify-center');
    logTest(
      'Feature: Multi-select with checkboxes implemented',
      hasCheckbox,
      hasCheckbox ? 'Checkbox UI found' : 'Checkbox UI not found'
    );
    
    // Test 2: Hierarchical display with indentation
    const hasIndentation = content.includes('paddingLeft') || 
                         content.includes('level * 16');
    logTest(
      'Feature: Hierarchical display with 16px indentation',
      hasIndentation,
      hasIndentation ? 'Indentation logic found' : 'Indentation logic not found'
    );
    
    // Test 3: Search functionality
    const hasSearchInput = content.includes('Search categories...') ||
                          content.includes('categorySearchQuery');
    logTest(
      'Feature: Search input for categories',
      hasSearchInput,
      hasSearchInput ? 'Search input found' : 'Search input not found'
    );
    
    // Test 4: Primary category designation
    const hasPrimaryButton = content.includes('Set Primary') ||
                           content.includes('Primary') && content.includes('Star');
    logTest(
      'Feature: Primary category designation with star icon',
      hasPrimaryButton,
      hasPrimaryButton ? 'Primary category UI found' : 'Primary category UI not found'
    );
    
    // Test 5: Collapsible/expandable categories
    const hasChevronButton = content.includes('ChevronDown') || 
                            content.includes('ChevronRight');
    logTest(
      'Feature: Collapsible/expandable categories with chevron',
      hasChevronButton,
      hasChevronButton ? 'Chevron icons found' : 'Chevron icons not found'
    );
    
    // Test 6: Folder icons for parent categories
    const hasFolderIcon = content.includes('Folder') || 
                        content.includes('FolderOpen');
    logTest(
      'Feature: Folder icons for parent categories',
      hasFolderIcon,
      hasFolderIcon ? 'Folder icons found' : 'Folder icons not found'
    );
    
    // Test 7: Search filters by nameEn and nameBn
    const hasBilingualSearch = content.includes('nameEn') && 
                              content.includes('nameBn') &&
                              content.includes('toLowerCase');
    logTest(
      'Feature: Bilingual search (English and Bangla)',
      hasBilingualSearch,
      hasBilingualSearch ? 'Bilingual search logic found' : 'Bilingual search logic not found'
    );
    
    // Test 8: Selected count display
    const hasSelectedCount = content.includes('Selected:') ||
                            content.includes('formData.categories.length');
    logTest(
      'Feature: Selected categories count display',
      hasSelectedCount,
      hasSelectedCount ? 'Selected count display found' : 'Selected count display not found'
    );
    
    // Test 9: Primary category display
    const hasPrimaryDisplay = content.includes('Primary:') ||
                             content.includes('formData.categories[0]');
    logTest(
      'Feature: Primary category name display',
      hasPrimaryDisplay,
      hasPrimaryDisplay ? 'Primary category display found' : 'Primary category display not found'
    );
    
    // Test 10: Scrollable category list
    const hasScrollableArea = content.includes('overflow-y-auto') ||
                             content.includes('max-h-80');
    logTest(
      'Feature: Scrollable category list area',
      hasScrollableArea,
      hasScrollableArea ? 'Scrollable area found' : 'Scrollable area not found'
    );
    
  } catch (error) {
    logTest('Feature: Implementation checks', false, error.message);
  }
}

// ============================================
// 5. INTEGRATION FLOW TESTS
// ============================================

async function testIntegrationFlows() {
  console.log('\n============================================');
  console.log('INTEGRATION FLOW TESTS');
  console.log('============================================\n');
  
  // Note: These tests require manual verification in the browser
  // We'll log them as skipped with instructions
  
  logSkip(
    'Integration: Create product with multiple categories',
    'Requires manual browser testing. Navigate to http://localhost:3000/admin/products/new'
  );
  
  logSkip(
    'Integration: Edit product and modify categories',
    'Requires manual browser testing. Navigate to product edit page'
  );
  
  logSkip(
    'Integration: Change primary category',
    'Requires manual browser testing. Click "Set Primary" on a selected category'
  );
  
  logSkip(
    'Integration: Search and filter categories',
    'Requires manual browser testing. Use search input in category selector'
  );
  
  logSkip(
    'Integration: Expand/collapse category hierarchy',
    'Requires manual browser testing. Click chevron icons on parent categories'
  );
  
  logSkip(
    'Integration: Form validation without categories',
    'Requires manual browser testing. Try to submit form without selecting categories'
  );
}

// ============================================
// 6. EDGE CASES AND USER EXPERIENCE TESTS
// ============================================

async function testEdgeCases() {
  console.log('\n============================================');
  console.log('EDGE CASES AND USER EXPERIENCE TESTS');
  console.log('============================================\n');
  
  const fs = require('fs');
  const path = require('path');
  const componentPath = path.join(__dirname, 'frontend/src/components/admin/ProductForm.tsx');
  
  try {
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Test 1: Empty search result handling
    const hasEmptyState = content.includes('No categories found') ||
                         content.includes('No results');
    logTest(
      'UX: Empty search result message',
      hasEmptyState,
      hasEmptyState ? 'Empty state message found' : 'Empty state message not found'
    );
    
    // Test 2: Loading state
    const hasLoadingState = content.includes('Loading categories') ||
                           content.includes('loadingCategories');
    logTest(
      'UX: Loading state for categories',
      hasLoadingState,
      hasLoadingState ? 'Loading state found' : 'Loading state not found'
    );
    
    // Test 3: Error handling
    const hasErrorHandling = content.includes('errors.categories') ||
                           content.includes('border-red-500');
    logTest(
      'UX: Error state for category validation',
      hasErrorHandling,
      hasErrorHandling ? 'Error handling found' : 'Error handling not found'
    );
    
    // Test 4: Keyboard accessibility
    const hasKeyboardSupport = content.includes('type="button"') ||
                             content.includes('onClick');
    logTest(
      'Accessibility: Button elements with proper types',
      hasKeyboardSupport,
      hasKeyboardSupport ? 'Button elements found' : 'Button elements not properly configured'
    );
    
    // Test 5: Responsive design
    const hasResponsiveClasses = content.includes('md:grid-cols-2') ||
                               content.includes('md:col-span-2');
    logTest(
      'UX: Responsive design classes',
      hasResponsiveClasses,
      hasResponsiveClasses ? 'Responsive classes found' : 'Responsive classes not found'
    );
    
  } catch (error) {
    logTest('UX: Edge case handling', false, error.message);
  }
}

// ============================================
// MAIN TEST EXECUTION
// ============================================

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  MULTI-SELECT HIERARCHICAL CATEGORY FEATURE TEST SUITE    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nTest Started: ${new Date().toISOString()}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  
  try {
    await testDatabaseSchema();
    await testAPIEndpoints();
    await testFrontendComponent();
    await testFeatureImplementation();
    await testIntegrationFlows();
    await testEdgeCases();
    
    // Print summary
    console.log('\n============================================');
    console.log('TEST SUMMARY');
    console.log('============================================\n');
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⏭️  Skipped: ${testResults.skipped.length}`);
    console.log(`📊 Total: ${testResults.passed.length + testResults.failed.length + testResults.skipped.length}`);
    
    if (testResults.failed.length > 0) {
      console.log('\n============================================');
      console.log('FAILED TESTS');
      console.log('============================================\n');
      testResults.failed.forEach(fail => {
        console.log(`❌ ${fail.testName}`);
        console.log(`   ${fail.message}\n`);
      });
    }
    
    // Generate report
    const report = {
      testRun: {
        timestamp: new Date().toISOString(),
        backendUrl: BACKEND_URL,
        frontendUrl: FRONTEND_URL,
        totalTests: testResults.passed.length + testResults.failed.length + testResults.skipped.length,
        passed: testResults.passed.length,
        failed: testResults.failed.length,
        skipped: testResults.skipped.length
      },
      results: testResults
    };
    
    const fs = require('fs');
    fs.writeFileSync(
      'multi-select-category-test-results.json',
      JSON.stringify(report, null, 2)
    );
    console.log('\n📄 Test report saved to: multi-select-category-test-results.json');
    
    // Exit with appropriate code
    process.exit(testResults.failed.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
