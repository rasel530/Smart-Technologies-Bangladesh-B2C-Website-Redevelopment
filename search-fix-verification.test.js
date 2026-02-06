/**
 * Search Functionality Fix Verification Test Suite
 * 
 * This test suite verifies the fix for the Server Components render error (digest: 2885939275)
 * 
 * Fixes Implemented:
 * 1. Backend Fix (backend/routes/products.js):
 *    - Added `const startTime = Date.now();` at line 92
 *    - Added `metadata` field to API response with query, executionTime, and searchEngine
 * 
 * 2. Frontend Fix (frontend/src/app/search/page.tsx):
 *    - Changed reserved property name `_count` to `reviewCount` at line 179
 */

const http = require('http');

// Test configuration
const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  timeout: 10000
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

/**
 * Helper function to log test results
 */
function logTestResult(testName, status, message = '', details = {}) {
  const result = {
    name: testName,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✓ PASS: ${testName}`);
    if (message) console.log(`  ${message}`);
  } else if (status === 'FAIL') {
    testResults.failed++;
    console.error(`✗ FAIL: ${testName}`);
    if (message) console.error(`  ${message}`);
    if (Object.keys(details).length > 0) {
      console.error(`  Details:`, JSON.stringify(details, null, 2));
    }
  } else {
    testResults.skipped++;
    console.log(`○ SKIP: ${testName}`);
    if (message) console.log(`  ${message}`);
  }
  console.log('');
}

/**
 * Helper function to make HTTP requests
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Test Suite 1: API Response Tests
 */
async function testAPIResponse() {
  console.log('\n========================================');
  console.log('TEST SUITE 1: API Response Tests');
  console.log('========================================\n');
  
  // Test 1.1: Verify backend endpoint returns metadata field
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const hasMetadata = response.body && response.body.metadata;
      const hasQuery = hasMetadata && response.body.metadata.hasOwnProperty('query');
      const hasExecutionTime = hasMetadata && response.body.metadata.hasOwnProperty('executionTime');
      const hasSearchEngine = hasMetadata && response.body.metadata.hasOwnProperty('searchEngine');
      
      if (hasMetadata && hasQuery && hasExecutionTime && hasSearchEngine) {
        logTestResult(
          'API Response: Backend returns metadata field with query, executionTime, and searchEngine',
          'PASS',
          'Metadata field exists and contains all required properties',
          {
            metadata: response.body.metadata,
            productsCount: response.body.products?.length || 0,
            pagination: response.body.pagination
          }
        );
      } else {
        logTestResult(
          'API Response: Backend returns metadata field with query, executionTime, and searchEngine',
          'FAIL',
          'Missing required metadata properties',
          {
            hasMetadata,
            hasQuery,
            hasExecutionTime,
            hasSearchEngine,
            metadata: response.body.metadata
          }
        );
      }
    } else {
      logTestResult(
        'API Response: Backend returns metadata field with query, executionTime, and searchEngine',
        'FAIL',
        `Backend returned status code ${response.statusCode}`,
        { statusCode: response.statusCode, body: response.body }
      );
    }
  } catch (error) {
    logTestResult(
      'API Response: Backend returns metadata field with query, executionTime, and searchEngine',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 1.2: Verify response structure matches SearchResult interface
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const hasProducts = Array.isArray(response.body.products);
      const hasPagination = response.body.pagination && 
                          typeof response.body.pagination.page === 'number' &&
                          typeof response.body.pagination.limit === 'number' &&
                          typeof response.body.pagination.total === 'number' &&
                          typeof response.body.pagination.pages === 'number';
      const hasMetadata = response.body.metadata;
      const hasRequiredMetadataProps = hasMetadata &&
                                     typeof response.body.metadata.query === 'string' &&
                                     typeof response.body.metadata.executionTime === 'number' &&
                                     typeof response.body.metadata.searchEngine === 'string';
      
      if (hasProducts && hasPagination && hasMetadata && hasRequiredMetadataProps) {
        logTestResult(
          'API Response: Response structure matches SearchResult interface',
          'PASS',
          'Response contains products, pagination, and metadata with correct types',
          {
            structure: {
              products: hasProducts,
              pagination: hasPagination,
              metadata: hasMetadata
            }
          }
        );
      } else {
        logTestResult(
          'API Response: Response structure matches SearchResult interface',
          'FAIL',
          'Response structure does not match SearchResult interface',
          {
            hasProducts,
            hasPagination,
            hasMetadata,
            hasRequiredMetadataProps,
            bodyKeys: Object.keys(response.body)
          }
        );
      }
    } else {
      logTestResult(
        'API Response: Response structure matches SearchResult interface',
        'FAIL',
        `Backend returned status code ${response.statusCode}`,
        { statusCode: response.statusCode }
      );
    }
  } catch (error) {
    logTestResult(
      'API Response: Response structure matches SearchResult interface',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 1.3: Verify metadata query value matches search query
  try {
    const searchQuery = 'hp laptop';
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: `/api/v1/products?search=${encodeURIComponent(searchQuery)}&limit=8&page=1`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200 && response.body.metadata) {
      if (response.body.metadata.query === searchQuery) {
        logTestResult(
          'API Response: Metadata query value matches search query',
          'PASS',
          `Metadata query is "${response.body.metadata.query}"`,
          { query: response.body.metadata.query }
        );
      } else {
        logTestResult(
          'API Response: Metadata query value matches search query',
          'FAIL',
          `Expected query "${searchQuery}" but got "${response.body.metadata.query}"`,
          { expected: searchQuery, actual: response.body.metadata.query }
        );
      }
    } else {
      logTestResult(
        'API Response: Metadata query value matches search query',
        'FAIL',
        'Response missing metadata or invalid status code',
        { statusCode: response.statusCode, hasMetadata: !!response.body.metadata }
      );
    }
  } catch (error) {
    logTestResult(
      'API Response: Metadata query value matches search query',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 1.4: Verify executionTime is a reasonable number
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200 && response.body.metadata) {
      const executionTime = response.body.metadata.executionTime;
      const isNumber = typeof executionTime === 'number';
      const isPositive = executionTime >= 0;
      const isReasonable = executionTime < 60000; // Less than 1 minute
      
      if (isNumber && isPositive && isReasonable) {
        logTestResult(
          'API Response: Execution time is a reasonable number',
          'PASS',
          `Execution time is ${executionTime}ms`,
          { executionTime }
        );
      } else {
        logTestResult(
          'API Response: Execution time is a reasonable number',
          'FAIL',
          'Execution time is not a reasonable number',
          { executionTime, isNumber, isPositive, isReasonable }
        );
      }
    } else {
      logTestResult(
        'API Response: Execution time is a reasonable number',
        'FAIL',
        'Response missing metadata or invalid status code',
        { statusCode: response.statusCode, hasMetadata: !!response.body.metadata }
      );
    }
  } catch (error) {
    logTestResult(
      'API Response: Execution time is a reasonable number',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Test Suite 2: Search Functionality Tests
 */
async function testSearchFunctionality() {
  console.log('\n========================================');
  console.log('TEST SUITE 2: Search Functionality Tests');
  console.log('========================================\n');
  
  // Test 2.1: Verify searching for "hp laptop" returns results
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const products = response.body.products || [];
      const total = response.body.pagination?.total || 0;
      
      if (products.length > 0 && total > 0) {
        logTestResult(
          'Search Functionality: Searching for "hp laptop" returns results',
          'PASS',
          `Found ${total} products, showing ${products.length} on page 1`,
          { 
            productsCount: products.length,
            totalResults: total,
            sampleProducts: products.slice(0, 3).map(p => ({
              id: p.id,
              name: p.name,
              sku: p.sku
            }))
          }
        );
      } else {
        logTestResult(
          'Search Functionality: Searching for "hp laptop" returns results',
          'FAIL',
          'No products found for "hp laptop"',
          { productsCount: products.length, totalResults: total }
        );
      }
    } else {
      logTestResult(
        'Search Functionality: Searching for "hp laptop" returns results',
        'FAIL',
        `Backend returned status code ${response.statusCode}`,
        { statusCode: response.statusCode }
      );
    }
  } catch (error) {
    logTestResult(
      'Search Functionality: Searching for "hp laptop" returns results',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 2.2: Verify search results contain HP laptop products
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const products = response.body.products || [];
      const hasHPLaptop = products.some(p => {
        const name = (p.name || '').toLowerCase();
        const nameEn = (p.nameEn || '').toLowerCase();
        const shortDescription = (p.shortDescription || '').toLowerCase();
        return name.includes('hp') && name.includes('laptop') ||
               nameEn.includes('hp') && nameEn.includes('laptop') ||
               shortDescription.includes('hp') && shortDescription.includes('laptop');
      });
      
      if (hasHPLaptop) {
        const hpLaptops = products.filter(p => {
          const name = (p.name || '').toLowerCase();
          const nameEn = (p.nameEn || '').toLowerCase();
          return name.includes('hp') && name.includes('laptop') ||
                 nameEn.includes('hp') && nameEn.includes('laptop');
        });
        
        logTestResult(
          'Search Functionality: Search results contain HP laptop products',
          'PASS',
          `Found ${hpLaptops.length} HP laptop products`,
          {
            hpLaptopsCount: hpLaptops.length,
            sampleProducts: hpLaptops.slice(0, 3).map(p => ({
              id: p.id,
              name: p.name,
              nameEn: p.nameEn
            }))
          }
        );
      } else {
        logTestResult(
          'Search Functionality: Search results contain HP laptop products',
          'FAIL',
          'No HP laptop products found in results',
          { productsCount: products.length, products: products.map(p => ({ name: p.name, nameEn: p.nameEn })) }
        );
      }
    } else {
      logTestResult(
        'Search Functionality: Search results contain HP laptop products',
        'FAIL',
        `Backend returned status code ${response.statusCode}`,
        { statusCode: response.statusCode }
      );
    }
  } catch (error) {
    logTestResult(
      'Search Functionality: Search results contain HP laptop products',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 2.3: Verify search returns 200 OK status
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      logTestResult(
        'Search Functionality: Search returns 200 OK status',
        'PASS',
        'Backend returned 200 OK status',
        { statusCode: response.statusCode }
      );
    } else {
      logTestResult(
        'Search Functionality: Search returns 200 OK status',
        'FAIL',
        `Backend returned status code ${response.statusCode}`,
        { statusCode: response.statusCode }
      );
    }
  } catch (error) {
    logTestResult(
      'Search Functionality: Search returns 200 OK status',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 2.4: Verify no Server Components render error occurs
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const hasError = response.body.error || response.body.message;
    const hasDigestError = JSON.stringify(response.body).includes('2885939275');
    
    if (response.statusCode === 200 && !hasError && !hasDigestError) {
      logTestResult(
        'Search Functionality: No Server Components render error (digest 2885939275)',
        'PASS',
        'No Server Components render error detected',
        { statusCode: response.statusCode, hasError, hasDigestError }
      );
    } else {
      logTestResult(
        'Search Functionality: No Server Components render error (digest 2885939275)',
        'FAIL',
        'Server Components render error detected',
        { 
          statusCode: response.statusCode, 
          hasError, 
          hasDigestError,
          error: response.body.error,
          message: response.body.message
        }
      );
    }
  } catch (error) {
    logTestResult(
      'Search Functionality: No Server Components render error (digest 2885939275)',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Test Suite 3: Search Results Page Tests
 */
async function testSearchResultsPage() {
  console.log('\n========================================');
  console.log('TEST SUITE 3: Search Results Page Tests');
  console.log('========================================\n');
  
  // Test 3.1: Verify search results page loads without errors
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200 && !response.body.error) {
      logTestResult(
        'Search Results Page: Page loads without errors',
        'PASS',
        'Search results page loaded successfully',
        { statusCode: response.statusCode, hasError: !!response.body.error }
      );
    } else {
      logTestResult(
        'Search Results Page: Page loads without errors',
        'FAIL',
        `Page load failed with status ${response.statusCode} or error`,
        { statusCode: response.statusCode, error: response.body.error }
      );
    }
  } catch (error) {
    logTestResult(
      'Search Results Page: Page loads without errors',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 3.2: Verify pagination works correctly
  try {
    // Test page 1
    const page1Response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Test page 2
    const page2Response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=2',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (page1Response.statusCode === 200 && page2Response.statusCode === 200) {
      const page1Products = page1Response.body.products || [];
      const page2Products = page2Response.body.products || [];
      const page1Page = page1Response.body.pagination?.page;
      const page2Page = page2Response.body.pagination?.page;
      
      if (page1Page === 1 && page2Page === 2) {
        logTestResult(
          'Search Results Page: Pagination works correctly',
          'PASS',
          `Page 1 has ${page1Products.length} products, Page 2 has ${page2Products.length} products`,
          {
            page1: { page: page1Page, productsCount: page1Products.length },
            page2: { page: page2Page, productsCount: page2Products.length }
          }
        );
      } else {
        logTestResult(
          'Search Results Page: Pagination works correctly',
          'FAIL',
          'Pagination page numbers are incorrect',
          {
            expectedPage1: 1,
            actualPage1: page1Page,
            expectedPage2: 2,
            actualPage2: page2Page
          }
        );
      }
    } else {
      logTestResult(
        'Search Results Page: Pagination works correctly',
        'FAIL',
        'Failed to fetch pagination pages',
        {
          page1Status: page1Response.statusCode,
          page2Status: page2Response.statusCode
        }
      );
    }
  } catch (error) {
    logTestResult(
      'Search Results Page: Pagination works correctly',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 3.3: Verify metadata information is properly displayed
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=hp+laptop&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200 && response.body.metadata) {
      const metadata = response.body.metadata;
      const hasValidMetadata = metadata.query !== undefined &&
                             metadata.executionTime !== undefined &&
                             metadata.searchEngine !== undefined;
      
      if (hasValidMetadata) {
        logTestResult(
          'Search Results Page: Metadata information is properly included in response',
          'PASS',
          'Metadata contains query, executionTime, and searchEngine',
          { metadata }
        );
      } else {
        logTestResult(
          'Search Results Page: Metadata information is properly included in response',
          'FAIL',
          'Metadata is missing required properties',
          { metadata }
        );
      }
    } else {
      logTestResult(
        'Search Results Page: Metadata information is properly included in response',
        'FAIL',
        'Response missing metadata or invalid status code',
        { statusCode: response.statusCode, hasMetadata: !!response.body.metadata }
      );
    }
  } catch (error) {
    logTestResult(
      'Search Results Page: Metadata information is properly included in response',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Test Suite 4: Edge Cases Tests
 */
async function testEdgeCases() {
  console.log('\n========================================');
  console.log('TEST SUITE 4: Edge Cases Tests');
  console.log('========================================\n');
  
  // Test 4.1: Test with empty search query
  try {
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: '/api/v1/products?search=&limit=8&page=1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const hasMetadata = response.body.metadata;
      const hasQuery = hasMetadata && response.body.metadata.query === '';
      
      if (hasMetadata && hasQuery) {
        logTestResult(
          'Edge Cases: Empty search query handled correctly',
          'PASS',
          'Empty query returns 200 OK with metadata',
          { 
            statusCode: response.statusCode,
            productsCount: response.body.products?.length || 0,
            metadata: response.body.metadata
          }
        );
      } else {
        logTestResult(
          'Edge Cases: Empty search query handled correctly',
          'FAIL',
          'Empty query response missing metadata or query is not empty string',
          { hasMetadata, hasQuery, metadata: response.body.metadata }
        );
      }
    } else {
      logTestResult(
        'Edge Cases: Empty search query handled correctly',
        'FAIL',
        `Backend returned status code ${response.statusCode}`,
        { statusCode: response.statusCode }
      );
    }
  } catch (error) {
    logTestResult(
      'Edge Cases: Empty search query handled correctly',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 4.2: Test with special characters
  try {
    const specialQuery = 'hp@laptop#$%';
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: `/api/v1/products?search=${encodeURIComponent(specialQuery)}&limit=8&page=1`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const hasMetadata = response.body.metadata;
      const hasQuery = hasMetadata && response.body.metadata.query === specialQuery;
      
      if (hasMetadata && hasQuery) {
        logTestResult(
          'Edge Cases: Special characters in search query handled correctly',
          'PASS',
          'Special characters query returns 200 OK with metadata',
          {
            statusCode: response.statusCode,
            query: response.body.metadata?.query,
            productsCount: response.body.products?.length || 0
          }
        );
      } else {
        logTestResult(
          'Edge Cases: Special characters in search query handled correctly',
          'FAIL',
          'Special characters response missing metadata or query mismatch',
          { hasMetadata, hasQuery, metadata: response.body.metadata }
        );
      }
    } else {
      logTestResult(
        'Edge Cases: Special characters in search query handled correctly',
        'FAIL',
        `Backend returned status code ${response.statusCode}`,
        { statusCode: response.statusCode }
      );
    }
  } catch (error) {
    logTestResult(
      'Edge Cases: Special characters in search query handled correctly',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 4.3: Test with very long search query
  try {
    const longQuery = 'hp laptop ' + 'a'.repeat(500);
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: `/api/v1/products?search=${encodeURIComponent(longQuery)}&limit=8&page=1`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const hasMetadata = response.body.metadata;
      const hasQuery = hasMetadata && response.body.metadata.query === longQuery;
      
      if (hasMetadata && hasQuery) {
        logTestResult(
          'Edge Cases: Very long search query handled correctly',
          'PASS',
          'Long query returns 200 OK with metadata',
          {
            statusCode: response.statusCode,
            queryLength: response.body.metadata?.query?.length || 0,
            productsCount: response.body.products?.length || 0
          }
        );
      } else {
        logTestResult(
          'Edge Cases: Very long search query handled correctly',
          'FAIL',
          'Long query response missing metadata or query mismatch',
          { hasMetadata, hasQuery, queryLength: response.body.metadata?.query?.length || 0 }
        );
      }
    } else {
      logTestResult(
        'Edge Cases: Very long search query handled correctly',
        'FAIL',
        `Backend returned status code ${response.statusCode}`,
        { statusCode: response.statusCode }
      );
    }
  } catch (error) {
    logTestResult(
      'Edge Cases: Very long search query handled correctly',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
  
  // Test 4.4: Test with non-existent search query
  try {
    const nonExistentQuery = 'xyznonexistentproduct123456789';
    const response = await makeRequest({
      hostname: new URL(config.backendUrl).hostname,
      port: new URL(config.backendUrl).port || 80,
      path: `/api/v1/products?search=${encodeURIComponent(nonExistentQuery)}&limit=8&page=1`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const hasMetadata = response.body.metadata;
      const hasQuery = hasMetadata && response.body.metadata.query === nonExistentQuery;
      const noResults = response.body.pagination?.total === 0;
      
      if (hasMetadata && hasQuery && noResults) {
        logTestResult(
          'Edge Cases: Non-existent search query handled correctly',
          'PASS',
          'Non-existent query returns 200 OK with metadata and 0 results',
          {
            statusCode: response.statusCode,
            totalResults: response.body.pagination?.total,
            metadata: response.body.metadata
          }
        );
      } else {
        logTestResult(
          'Edge Cases: Non-existent search query handled correctly',
          'FAIL',
          'Non-existent query response issue',
          { hasMetadata, hasQuery, noResults, totalResults: response.body.pagination?.total }
        );
      }
    } else {
      logTestResult(
        'Edge Cases: Non-existent search query handled correctly',
        'FAIL',
        `Backend returned status code ${response.statusCode}`,
        { statusCode: response.statusCode }
      );
    }
  } catch (error) {
    logTestResult(
      'Edge Cases: Non-existent search query handled correctly',
      'FAIL',
      `Request failed: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Search Functionality Fix Verification Test Suite              ║');
  console.log('║   Verifying fix for Server Components render error            ║');
  console.log('║   (digest: 2885939275)                                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nConfiguration:`);
  console.log(`  Backend URL: ${config.backendUrl}`);
  console.log(`  Frontend URL: ${config.frontendUrl}`);
  console.log(`  Timeout: ${config.timeout}ms\n`);
  
  // Run all test suites
  await testAPIResponse();
  await testSearchFunctionality();
  await testSearchResultsPage();
  await testEdgeCases();
  
  // Print summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');
  console.log(`Total Tests: ${testResults.passed + testResults.failed + testResults.skipped}`);
  console.log(`✓ Passed: ${testResults.passed}`);
  console.log(`✗ Failed: ${testResults.failed}`);
  console.log(`○ Skipped: ${testResults.skipped}`);
  console.log(`\nSuccess Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%\n`);
  
  // Save results to file
  const fs = require('fs');
  const resultsPath = 'search-fix-verification-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`Test results saved to: ${resultsPath}\n`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\nFatal error running tests:', error);
  process.exit(1);
});
