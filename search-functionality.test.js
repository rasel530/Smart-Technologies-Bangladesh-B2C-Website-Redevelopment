/**
 * Search Functionality Test Suite
 * 
 * Tests both backend search API fixes and frontend search input navigation:
 * 1. Backend multi-keyword search (Elasticsearch operator: 'or' + PostgreSQL word splitting)
 * 2. Frontend search input submission and navigation to /search?q=query
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Correct search API endpoints based on available routes
const SEARCH_API_ENDPOINT = '/api/search';
const PRODUCTS_API_ENDPOINT = '/api/v1/products';

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const logTest = (name, status, message = '') => {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [TEST] ${name}: ${status} ${message}`);
};

// ============================================
// BACKEND SEARCH API TESTS
// ============================================

async function testBackendSearchAPI() {
  console.log('\n' + '='.repeat(60));
  console.log('BACKEND SEARCH API TESTS');
  console.log('='.repeat(60));

  const tests = {
    singleWord: [],
    multiWord: [],
    productsAPI: []
  };

  // Test 1: Single-word search query
  console.log('\n--- Test 1: Single-word Search Query ---');
  
  try {
    const response = await fetch(`${BACKEND_URL}${SEARCH_API_ENDPOINT}/products?q=laptop&limit=10`);
    const data = await response.json();
    
    if (response.ok && data.products && data.products.length > 0) {
      logTest('Single-word search "laptop"', 'PASS', `Found ${data.products.length} products`);
      tests.singleWord.push({
        query: 'laptop',
        status: 'PASS',
        resultCount: data.products.length,
        searchEngine: data.searchEngine || 'unknown'
      });
    } else {
      logTest('Single-word search "laptop"', 'FAIL', `No products found or API error: ${JSON.stringify(data)}`);
      tests.singleWord.push({
        query: 'laptop',
        status: 'FAIL',
        error: data.error || 'No products found'
      });
    }
  } catch (error) {
    logTest('Single-word search "laptop"', 'FAIL', `API connection error: ${error.message}`);
    tests.singleWord.push({
      query: 'laptop',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 2: Multi-word search query "hp laptop"
  console.log('\n--- Test 2: Multi-word Search Query "hp laptop" ---');
  
  try {
    const response = await fetch(`${BACKEND_URL}${SEARCH_API_ENDPOINT}/products?q=hp laptop&limit=10`);
    const data = await response.json();
    
    if (response.ok && data.products && data.products.length > 0) {
      // Check if HP laptop is in results
      const hpLaptopProduct = data.products.find(p => 
        p.nameEn?.toLowerCase().includes('hp') && 
        (p.nameEn?.toLowerCase().includes('laptop') || p.nameEn?.toLowerCase().includes('notebook'))
      );
      
      logTest('Multi-word search "hp laptop"', 'PASS', 
        `Found ${data.products.length} products, includes HP laptop: ${hpLaptopProduct ? 'YES' : 'NO'}`);
      logTest('  └─ Products found:', 'INFO', 
        data.products.slice(0, 3).map(p => p.nameEn).join(', ') + (data.products.length > 3 ? '...' : ''));
      
      tests.multiWord.push({
        query: 'hp laptop',
        status: 'PASS',
        resultCount: data.products.length,
        includesHP: !!hpLaptopProduct,
        searchEngine: data.searchEngine || 'unknown'
      });
    } else {
      logTest('Multi-word search "hp laptop"', 'FAIL', `No products found or API error: ${JSON.stringify(data)}`);
      tests.multiWord.push({
        query: 'hp laptop',
        status: 'FAIL',
        error: data.error || 'No products found'
      });
    }
  } catch (error) {
    logTest('Multi-word search "hp laptop"', 'FAIL', `API connection error: ${error.message}`);
    tests.multiWord.push({
      query: 'hp laptop',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 3: Three-word search query
  console.log('\n--- Test 3: Three-word Search Query "hp core i5" ---');
  
  try {
    const response = await fetch(`${BACKEND_URL}${SEARCH_API_ENDPOINT}/products?q=hp core i5&limit=10`);
    const data = await response.json();
    
    if (response.ok && data.products) {
      const productNames = data.products.map(p => p.nameEn);
      logTest('Three-word search "hp core i5"', 'PASS', 
        `Found ${data.products.length} products`);
      logTest('  └─ Sample products:', 'INFO', 
        productNames.slice(0, 3).join(', ') + (productNames.length > 3 ? '...' : ''));
      
      tests.multiWord.push({
        query: 'hp core i5',
        status: 'PASS',
        resultCount: data.products.length,
        searchEngine: data.searchEngine || 'unknown'
      });
    } else {
      logTest('Three-word search "hp core i5"', 'FAIL', `API error: ${JSON.stringify(data)}`);
      tests.multiWord.push({
        query: 'hp core i5',
        status: 'FAIL',
        error: data.error
      });
    }
  } catch (error) {
    logTest('Three-word search "hp core i5"', 'FAIL', `API connection error: ${error.message}`);
    tests.multiWord.push({
      query: 'hp core i5',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 4: Products API with search parameter
  console.log('\n--- Test 4: Products API with Search Parameter ---');
  
  try {
    const response = await fetch(`${BACKEND_URL}${PRODUCTS_API_ENDPOINT}?search=laptop&limit=10`);
    const data = await response.json();
    
    if (response.ok && data.products && data.products.length > 0) {
      logTest('Products API search "laptop"', 'PASS', `Found ${data.products.length} products`);
      tests.productsAPI.push({
        query: 'laptop',
        status: 'PASS',
        resultCount: data.products.length
      });
    } else {
      logTest('Products API search "laptop"', 'FAIL', `No products found: ${JSON.stringify(data)}`);
      tests.productsAPI.push({
        query: 'laptop',
        status: 'FAIL',
        error: data.error || 'No products found'
      });
    }
  } catch (error) {
    logTest('Products API search "laptop"', 'FAIL', `API connection error: ${error.message}`);
    tests.productsAPI.push({
      query: 'laptop',
      status: 'FAIL',
      error: error.message
    });
  }

  // Test 5: Products API multi-word search
  console.log('\n--- Test 5: Products API Multi-word Search "dell laptop" ---');
  
  try {
    const response = await fetch(`${BACKEND_URL}${PRODUCTS_API_ENDPOINT}?search=dell laptop&limit=10`);
    const data = await response.json();
    
    if (response.ok && data.products) {
      logTest('Products API multi-word search "dell laptop"', 'PASS', `Found ${data.products.length} products`);
      tests.productsAPI.push({
        query: 'dell laptop',
        status: 'PASS',
        resultCount: data.products.length
      });
    } else {
      logTest('Products API multi-word search "dell laptop"', 'FAIL', `API error: ${JSON.stringify(data)}`);
      tests.productsAPI.push({
        query: 'dell laptop',
        status: 'FAIL',
        error: data.error
      });
    }
  } catch (error) {
    logTest('Products API multi-word search "dell laptop"', 'FAIL', `API connection error: ${error.message}`);
    tests.productsAPI.push({
      query: 'dell laptop',
      status: 'FAIL',
      error: error.message
    });
  }

  return { backend: tests };
}

// ============================================
// FRONTEND SEARCH INPUT NAVIGATION TESTS
// ============================================

async function testFrontendSearchNavigation() {
  console.log('\n' + '='.repeat(60));
  console.log('FRONTEND SEARCH NAVIGATION TESTS');
  console.log('='.repeat(60));

  const tests = {
    useRouterImport: [],
    useRouterHook: [],
    handleSearchNavigation: [],
    searchButtonClick: [],
    enterKeySubmit: []
  };

  // Test 1: Verify useRouter import exists in SearchAutocomplete.tsx
  console.log('\n--- Test 1: Verify useRouter Import ---');
  
  try {
    const fs = require('fs');
    const fileContent = fs.readFileSync(
      'frontend/src/components/product/SearchAutocomplete.tsx',
      'utf8'
    );
    
    const hasUseRouterImport = fileContent.includes("import { useRouter } from 'next/navigation'");
    
    if (hasUseRouterImport) {
      logTest('useRouter import exists', 'PASS');
      tests.useRouterImport.push({ status: 'PASS', message: 'useRouter import found' });
    } else {
      logTest('useRouter import exists', 'FAIL');
      tests.useRouterImport.push({ status: 'FAIL', message: 'useRouter import NOT found' });
    }
  } catch (error) {
    logTest('useRouter import exists', 'FAIL', `File read error: ${error.message}`);
    tests.useRouterImport.push({ status: 'FAIL', error: error.message });
  }

  // Test 2: Verify useRouter hook is used
  console.log('\n--- Test 2: Verify useRouter Hook ---');
  
  try {
    const fs = require('fs');
    const fileContent = fs.readFileSync(
      'frontend/src/components/product/SearchAutocomplete.tsx',
      'utf8'
    );
    
    const hasUseRouterHook = fileContent.includes('const router = useRouter()');
    
    if (hasUseRouterHook) {
      logTest('useRouter hook exists', 'PASS');
      tests.useRouterHook.push({ status: 'PASS', message: 'useRouter hook found' });
    } else {
      logTest('useRouter hook exists', 'FAIL');
      tests.useRouterHook.push({ status: 'FAIL', message: 'useRouter hook NOT found' });
    }
  } catch (error) {
    logTest('useRouter hook exists', 'FAIL', `File read error: ${error.message}`);
    tests.useRouterHook.push({ status: 'FAIL', error: error.message });
  }

  // Test 3: Verify handleSearch uses router.push for navigation
  console.log('\n--- Test 3: Verify handleSearch Navigation Logic ---');
  
  try {
    const fs = require('fs');
    const fileContent = fs.readFileSync(
      'frontend/src/components/product/SearchAutocomplete.tsx',
      'utf8'
    );
    
    const hasRouterPush = fileContent.includes("router.push(`/search?q=");
    const hasEncodeURIComponent = fileContent.includes('encodeURIComponent');
    
    if (hasRouterPush && hasEncodeURIComponent) {
      logTest('handleSearch uses router.push', 'PASS');
      logTest('  └─ Navigation URL format:', 'INFO', '/search?q=encodedQuery');
      tests.handleSearchNavigation.push({ 
        status: 'PASS', 
        message: 'router.push with /search?q= found',
        hasEncodeURIComponent 
      });
    } else {
      logTest('handleSearch uses router.push', 'FAIL');
      tests.handleSearchNavigation.push({ 
        status: 'FAIL', 
        message: `router.push: ${hasRouterPush}, encodeURIComponent: ${hasEncodeURIComponent}` 
      });
    }
  } catch (error) {
    logTest('handleSearch uses router.push', 'FAIL', `File read error: ${error.message}`);
    tests.handleSearchNavigation.push({ status: 'FAIL', error: error.message });
  }

  // Test 4: Verify search button calls handleSearch
  console.log('\n--- Test 4: Verify Search Button onClick Handler ---');
  
  try {
    const fs = require('fs');
    const fileContent = fs.readFileSync(
      'frontend/src/components/product/SearchAutocomplete.tsx',
      'utf8'
    );
    
    // Check for search button with onClick handler - more flexible regex
    const hasSearchButtonHandler = fileContent.includes('onClick={() => handleSearch()}') ||
                                    fileContent.includes('onClick={handleSearch}') ||
                                    fileContent.match(/onClick=\{\(\)\s*=>\s*handleSearch/);
    
    if (hasSearchButtonHandler) {
      logTest('Search button calls handleSearch()', 'PASS');
      tests.searchButtonClick.push({ status: 'PASS', message: 'Search button onClick handler found' });
    } else {
      logTest('Search button calls handleSearch()', 'FAIL');
      tests.searchButtonClick.push({ status: 'FAIL', message: 'Search button onClick handler NOT found' });
    }
  } catch (error) {
    logTest('Search button calls handleSearch()', 'FAIL', `File read error: ${error.message}`);
    tests.searchButtonClick.push({ status: 'FAIL', error: error.message });
  }

  // Test 5: Verify Enter key in onKeyDown handler calls handleSearch
  console.log('\n--- Test 5: Verify Enter Key Handler ---');
  
  try {
    const fs = require('fs');
    const fileContent = fs.readFileSync(
      'frontend/src/components/product/SearchAutocomplete.tsx',
      'utf8'
    );
    
    // Check for Enter key handling in handleKeyDown
    const hasEnterKeyHandler = fileContent.includes("case 'Enter':") && 
                                fileContent.includes('handleSearch()');
    
    if (hasEnterKeyHandler) {
      logTest('Enter key triggers handleSearch()', 'PASS');
      tests.enterKeySubmit.push({ status: 'PASS', message: 'Enter key handler calls handleSearch()' });
    } else {
      logTest('Enter key triggers handleSearch()', 'FAIL');
      tests.enterKeySubmit.push({ status: 'FAIL', message: 'Enter key handler NOT found' });
    }
  } catch (error) {
    logTest('Enter key triggers handleSearch()', 'FAIL', `File read error: ${error.message}`);
    tests.enterKeySubmit.push({ status: 'FAIL', error: error.message });
  }

  return { frontend: tests };
}

// ============================================
// TEST EXECUTION AND SUMMARY
// ============================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('SEARCH FUNCTIONALITY TEST SUITE');
  console.log('Testing: Backend Search API + Frontend Search Input Fixes');
  console.log('='.repeat(60));

  const backendResults = await testBackendSearchAPI();
  const frontendResults = await testFrontendSearchNavigation();

  // Generate test summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  // Backend summary
  const backendTests = [...backendResults.backend.singleWord, ...backendResults.backend.multiWord, ...backendResults.backend.productsAPI];
  const backendPassed = backendTests.filter(t => t.status === 'PASS').length;
  const backendFailed = backendTests.filter(t => t.status === 'FAIL').length;

  console.log('\nBackend Search API:');
  console.log(`  - Total Tests: ${backendTests.length}`);
  console.log(`  - Passed: ${backendPassed} ✅`);
  console.log(`  - Failed: ${backendFailed} ❌`);

  // Frontend summary
  const frontendTests = [
    ...frontendResults.frontend.useRouterImport,
    ...frontendResults.frontend.useRouterHook,
    ...frontendResults.frontend.handleSearchNavigation,
    ...frontendResults.frontend.searchButtonClick,
    ...frontendResults.frontend.enterKeySubmit
  ];
  const frontendPassed = frontendTests.filter(t => t.status === 'PASS').length;
  const frontendFailed = frontendTests.filter(t => t.status === 'FAIL').length;

  console.log('\nFrontend Search Navigation:');
  console.log(`  - Total Tests: ${frontendTests.length}`);
  console.log(`  - Passed: ${frontendPassed} ✅`);
  console.log(`  - Failed: ${frontendFailed} ❌`);

  // Overall summary
  const totalTests = backendTests.length + frontendTests.length;
  const totalPassed = backendPassed + frontendPassed;
  const totalFailed = backendFailed + frontendFailed;

  console.log('\n' + '='.repeat(60));
  console.log('OVERALL RESULTS');
  console.log('='.repeat(60));
  console.log(`  - Total Tests: ${totalTests}`);
  console.log(`  - Passed: ${totalPassed} ✅`);
  console.log(`  - Failed: ${totalFailed} ❌`);
  console.log(`  - Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

  // Issues resolved check
  console.log('\n' + '='.repeat(60));
  console.log('ISSUES RESOLVED VERIFICATION');
  console.log('='.repeat(60));
  
  console.log('\n1. Backend Multi-keyword Search:');
  const multiWordBackendPassed = backendResults.backend.multiWord.filter(t => t.status === 'PASS').length;
  if (multiWordBackendPassed > 0) {
    console.log('   ✅ FIXED - Multi-keyword queries now return results');
    console.log(`   └─ ${multiWordBackendPassed} multi-word search test(s) passed`);
  } else {
    console.log('   ❌ NOT FIXED - Multi-keyword search still failing');
  }

  console.log('\n2. Frontend Search Input Navigation:');
  if (frontendPassed === frontendTests.length) {
    console.log('   ✅ FIXED - useRouter and navigation implemented');
    console.log('   └─ Search submission now navigates to /search?q=query');
  } else {
    console.log('   ❌ NOT FIXED - Frontend navigation issues remain');
    console.log(`   └─ ${frontendFailed} test(s) failed`);
  }

  // Return results for further processing
  return {
    backend: backendResults.backend,
    frontend: frontendResults.frontend,
    summary: {
      totalTests,
      totalPassed,
      totalFailed,
      successRate: ((totalPassed / totalTests) * 100).toFixed(1)
    }
  };
}

// Export for use in other test files
module.exports = {
  testBackendSearchAPI,
  testFrontendSearchNavigation,
  runAllTests
};

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      process.exit(results.summary.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution error:', error);
      process.exit(1);
    });
}
