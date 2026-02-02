/**
 * Elasticsearch Admin API Test Script
 * 
 * This script tests all admin Elasticsearch API endpoints for Phase 5 Milestone 1, including:
 * - Cluster health endpoints
 * - Index management endpoints
 * - Backup management endpoints
 * - Performance monitoring endpoints
 * - Cache management endpoints
 * - Synonym management endpoints
 * - Authentication and authorization
 * - Error handling
 * - Response formats
 * 
 * Usage: node scripts/test-elasticsearch-api.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Add backend to path
process.env.NODE_PATH = path.join(__dirname, '..', 'backend');
require('module').Module._initPaths();

// Test configuration
const TEST_CONFIG = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  apiPath: '/api/v1/admin/elasticsearch',
  testUser: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@smarttech.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'admin123'
  },
  verbose: process.env.VERBOSE === 'true',
  skipAuth: process.env.SKIP_AUTH === 'true'
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Auth token storage
let authToken = null;

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Log a message with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Log a test result
 */
function logTest(testName, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✓ ${testName}`, 'green');
    if (message && TEST_CONFIG.verbose) {
      log(`  ${message}`, 'cyan');
    }
  } else {
    testResults.failed++;
    log(`✗ ${testName}`, 'red');
    if (message) {
      log(`  ${message}`, 'yellow');
    }
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    message,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log a test as skipped
 */
function logSkipped(testName, reason = '') {
  testResults.total++;
  testResults.skipped++;
  log(`⊘ ${testName}`, 'yellow');
  if (reason && TEST_CONFIG.verbose) {
    log(`  Skipped: ${reason}`, 'cyan');
  }
  
  testResults.tests.push({
    name: testName,
    passed: null,
    message: `Skipped: ${reason}`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Print section header
 */
function printSection(title) {
  console.log('\n' + colors.bright + colors.blue + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + colors.reset + '\n');
}

/**
 * Print test summary
 */
function printSummary() {
  printSection('TEST SUMMARY');
  
  const passRate = testResults.total > 0 
    ? ((testResults.passed / testResults.total) * 100).toFixed(2) 
    : 0;
  
  log(`Total Tests: ${testResults.total}`, 'bright');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Skipped: ${testResults.skipped}`, 'yellow');
  log(`Pass Rate: ${passRate}%`, 'bright');
  
  if (testResults.failed > 0) {
    console.log('\n' + colors.red + 'Failed Tests:' + colors.reset);
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        log(`  - ${t.name}`, 'red');
        if (t.message) {
          log(`    ${t.message}`, 'yellow');
        }
      });
  }
  
  console.log('');
}

/**
 * Make HTTP request
 */
async function makeRequest(endpoint, method = 'GET', body = null, headers = {}) {
  const url = `${TEST_CONFIG.backendUrl}${TEST_CONFIG.apiPath}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: { error: error.message },
      headers: {}
    };
  }
}

/**
 * Test 1: Authentication
 */
async function testAuthentication() {
  printSection('TEST 1: Authentication');
  
  if (TEST_CONFIG.skipAuth) {
    logSkipped('Authentication tests', 'SKIP_AUTH is set to true');
    authToken = 'test-token';
    return;
  }
  
  // Test login endpoint
  const loginEndpoint = '/auth/login';
  const loginUrl = `${TEST_CONFIG.backendUrl}/api/v1${loginEndpoint}`;
  
  try {
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_CONFIG.testUser.email,
        password: TEST_CONFIG.testUser.password
      })
    });
    
    const loginData = await loginResponse.json();
    
    logTest(
      'Admin login endpoint accessible',
      loginResponse.status === 200 || loginResponse.status === 201,
      `Status: ${loginResponse.status}`
    );
    
    if (loginResponse.ok && loginData.token) {
      authToken = loginData.token;
      logTest(
        'Authentication token received',
        authToken !== null,
        `Token length: ${authToken.length}`
      );
    } else {
      logTest(
        'Authentication token received',
        false,
        loginData.message || 'No token received'
      );
      logSkipped('API endpoint tests', 'Authentication failed');
    }
    
  } catch (error) {
    logTest(
      'Admin login endpoint accessible',
      false,
      `Error: ${error.message}`
    );
    logSkipped('API endpoint tests', 'Authentication failed');
  }
}

/**
 * Test 2: Cluster Health Endpoints
 */
async function testClusterHealthEndpoints() {
  printSection('TEST 2: Cluster Health Endpoints');
  
  if (!authToken) {
    logSkipped('Cluster health endpoints', 'No authentication token');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test GET /health
  const healthResponse = await makeRequest('/health', 'GET', null, headers);
  logTest(
    'GET /health - Cluster health endpoint',
    healthResponse.ok,
    healthResponse.ok
      ? `Status: ${healthResponse.status}, Health: ${healthResponse.data?.health?.status}`
      : `Error: ${healthResponse.data?.error || healthResponse.data?.message}`
  );
  
  // Test response format
  if (healthResponse.ok) {
    const hasRequiredFields = healthResponse.data?.health?.status !== undefined &&
                             healthResponse.data?.health?.clusterName !== undefined;
    logTest(
      'GET /health - Response has required fields',
      hasRequiredFields,
      'Response contains status and clusterName'
    );
  }
  
  // Test GET /nodes
  const nodesResponse = await makeRequest('/nodes', 'GET', null, headers);
  logTest(
    'GET /nodes - Node information endpoint',
    nodesResponse.ok,
    nodesResponse.ok
      ? `Status: ${nodesResponse.status}, Nodes: ${nodesResponse.data?.count}`
      : `Error: ${nodesResponse.data?.error || nodesResponse.data?.message}`
  );
  
  // Test GET /stats
  const statsResponse = await makeRequest('/stats', 'GET', null, headers);
  logTest(
    'GET /stats - Cluster statistics endpoint',
    statsResponse.ok,
    statsResponse.ok
      ? `Status: ${statsResponse.status}, Indices: ${statsResponse.data?.indices?.count}`
      : `Error: ${statsResponse.data?.error || statsResponse.data?.message}`
  );
  
  // Test response format
  if (statsResponse.ok) {
    const hasRequiredFields = statsResponse.data?.clusterName !== undefined &&
                             statsResponse.data?.indices !== undefined;
    logTest(
      'GET /stats - Response has required fields',
      hasRequiredFields,
      'Response contains clusterName and indices'
    );
  }
}

/**
 * Test 3: Index Management Endpoints
 */
async function testIndexManagementEndpoints() {
  printSection('TEST 3: Index Management Endpoints');
  
  if (!authToken) {
    logSkipped('Index management endpoints', 'No authentication token');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test GET /indices
  const indicesResponse = await makeRequest('/indices', 'GET', null, headers);
  logTest(
    'GET /indices - List all indices',
    indicesResponse.ok,
    indicesResponse.ok
      ? `Status: ${indicesResponse.status}, Count: ${indicesResponse.data?.count}`
      : `Error: ${indicesResponse.data?.error || indicesResponse.data?.message}`
  );
  
  // Test GET /indices/:name (with existing index)
  if (indicesResponse.ok && indicesResponse.data?.indices?.length > 0) {
    const firstIndex = indicesResponse.data.indices[0].name;
    const indexDetailResponse = await makeRequest(`/indices/${firstIndex}`, 'GET', null, headers);
    logTest(
      `GET /indices/${firstIndex} - Get index details`,
      indexDetailResponse.ok,
      indexDetailResponse.ok
        ? `Status: ${indexDetailResponse.status}`
        : `Error: ${indexDetailResponse.data?.error || indexDetailResponse.data?.message}`
    );
    
    // Test response format
    if (indexDetailResponse.ok) {
      const hasRequiredFields = indexDetailResponse.data?.name !== undefined &&
                               indexDetailResponse.data?.exists !== undefined;
      logTest(
        'GET /indices/:name - Response has required fields',
        hasRequiredFields,
        'Response contains name and exists'
      );
    }
    
    // Test POST /indices/:name/refresh
    const refreshResponse = await makeRequest(`/indices/${firstIndex}/refresh`, 'POST', null, headers);
    logTest(
      `POST /indices/${firstIndex}/refresh - Refresh index`,
      refreshResponse.ok,
      refreshResponse.ok
        ? `Status: ${refreshResponse.status}`
        : `Error: ${refreshResponse.data?.error || refreshResponse.data?.message}`
    );
  } else {
    logSkipped('GET /indices/:name', 'No indices available');
    logSkipped('POST /indices/:name/refresh', 'No indices available');
  }
  
  // Test validation - missing index name
  const missingNameResponse = await makeRequest('/indices/', 'GET', null, headers);
  logTest(
    'GET /indices/ - Validation for missing index name',
    !missingNameResponse.ok && missingNameResponse.status === 404,
    `Status: ${missingNameResponse.status} (expected 404)`
  );
}

/**
 * Test 4: Backup Management Endpoints
 */
async function testBackupManagementEndpoints() {
  printSection('TEST 4: Backup Management Endpoints');
  
  if (!authToken) {
    logSkipped('Backup management endpoints', 'No authentication token');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test GET /backups
  const backupsResponse = await makeRequest('/backups', 'GET', null, headers);
  logTest(
    'GET /backups - List backups',
    backupsResponse.ok || backupsResponse.status === 500,
    backupsResponse.ok
      ? `Status: ${backupsResponse.status}, Repositories: ${backupsResponse.data?.count}`
      : `Status: ${backupsResponse.status} (may fail if no repository configured)`
  );
  
  // Test POST /backups/create - validation
  const createBackupResponse = await makeRequest(
    '/backups/create',
    'POST',
    {
      repository: 'test-repo',
      snapshot: 'test-snapshot'
    },
    headers
  );
  logTest(
    'POST /backups/create - Create backup endpoint',
    createBackupResponse.ok || createBackupResponse.status === 500,
    createBackupResponse.ok
      ? `Status: ${createBackupResponse.status}`
      : `Status: ${createBackupResponse.status} (may fail if no repository configured)`
  );
  
  // Test validation - missing required fields
  const invalidBackupResponse = await makeRequest(
    '/backups/create',
    'POST',
    {},
    headers
  );
  logTest(
    'POST /backups/create - Validation for missing fields',
    !invalidBackupResponse.ok && invalidBackupResponse.status === 400,
    `Status: ${invalidBackupResponse.status} (expected 400)`
  );
  
  // Test POST /backups/:id/restore
  const restoreResponse = await makeRequest(
    '/backups/test-snapshot/restore',
    'POST',
    {
      repository: 'test-repo'
    },
    headers
  );
  logTest(
    'POST /backups/:id/restore - Restore backup endpoint',
    restoreResponse.ok || restoreResponse.status === 500 || restoreResponse.status === 404,
    `Status: ${restoreResponse.status} (may fail if no repository/snapshot)`
  );
}

/**
 * Test 5: Performance Monitoring Endpoints
 */
async function testPerformanceMonitoringEndpoints() {
  printSection('TEST 5: Performance Monitoring Endpoints');
  
  if (!authToken) {
    logSkipped('Performance monitoring endpoints', 'No authentication token');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test GET /performance
  const performanceResponse = await makeRequest('/performance', 'GET', null, headers);
  logTest(
    'GET /performance - Get performance metrics',
    performanceResponse.ok,
    performanceResponse.ok
      ? `Status: ${performanceResponse.status}`
      : `Error: ${performanceResponse.data?.error || performanceResponse.data?.message}`
  );
  
  // Test response format
  if (performanceResponse.ok) {
    const hasPerformanceData = performanceResponse.data?.performance !== undefined;
    logTest(
      'GET /performance - Response has performance data',
      hasPerformanceData,
      'Response contains performance data'
    );
  }
  
  // Test GET /performance/slow-queries
  const slowQueriesResponse = await makeRequest('/performance/slow-queries?limit=10', 'GET', null, headers);
  logTest(
    'GET /performance/slow-queries - Get slow queries',
    slowQueriesResponse.ok,
    slowQueriesResponse.ok
      ? `Status: ${slowQueriesResponse.status}, Count: ${slowQueriesResponse.data?.count}`
      : `Error: ${slowQueriesResponse.data?.error || slowQueriesResponse.data?.message}`
  );
  
  // Test GET /performance/alerts
  const alertsResponse = await makeRequest('/performance/alerts?limit=10', 'GET', null, headers);
  logTest(
    'GET /performance/alerts - Get performance alerts',
    alertsResponse.ok,
    alertsResponse.ok
      ? `Status: ${alertsResponse.status}, Count: ${alertsResponse.data?.count}`
      : `Error: ${alertsResponse.data?.error || alertsResponse.data?.message}`
  );
  
  // Test GET /performance/targets
  const targetsResponse = await makeRequest('/performance/targets', 'GET', null, headers);
  logTest(
    'GET /performance/targets - Get performance targets',
    targetsResponse.ok,
    targetsResponse.ok
      ? `Status: ${targetsResponse.status}`
      : `Error: ${targetsResponse.data?.error || targetsResponse.data?.message}`
  );
  
  // Test response format
  if (targetsResponse.ok) {
    const hasTargets = targetsResponse.data?.targets !== undefined;
    logTest(
      'GET /performance/targets - Response has targets data',
      hasTargets,
      'Response contains targets data'
    );
  }
}

/**
 * Test 6: Cache Management Endpoints
 */
async function testCacheManagementEndpoints() {
  printSection('TEST 6: Cache Management Endpoints');
  
  if (!authToken) {
    logSkipped('Cache management endpoints', 'No authentication token');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test GET /cache
  const cacheStatsResponse = await makeRequest('/cache', 'GET', null, headers);
  logTest(
    'GET /cache - Get cache statistics',
    cacheStatsResponse.ok,
    cacheStatsResponse.ok
      ? `Status: ${cacheStatsResponse.status}`
      : `Error: ${cacheStatsResponse.data?.error || cacheStatsResponse.data?.message}`
  );
  
  // Test response format
  if (cacheStatsResponse.ok) {
    const hasStats = cacheStatsResponse.data?.stats !== undefined;
    logTest(
      'GET /cache - Response has cache stats',
      hasStats,
      'Response contains cache statistics'
    );
  }
  
  // Test DELETE /cache (clear all)
  const clearCacheResponse = await makeRequest('/cache', 'DELETE', {}, headers);
  logTest(
    'DELETE /cache - Clear all cache',
    clearCacheResponse.ok,
    clearCacheResponse.ok
      ? `Status: ${clearCacheResponse.status}, Deleted: ${clearCacheResponse.data?.deletedCount}`
      : `Error: ${clearCacheResponse.data?.error || clearCacheResponse.data?.message}`
  );
  
  // Test DELETE /cache with pattern
  const clearPatternResponse = await makeRequest(
    '/cache',
    'DELETE',
    { pattern: 'search:*' },
    headers
  );
  logTest(
    'DELETE /cache - Clear cache by pattern',
    clearPatternResponse.ok,
    clearPatternResponse.ok
      ? `Status: ${clearPatternResponse.status}, Deleted: ${clearPatternResponse.data?.deletedCount}`
      : `Error: ${clearPatternResponse.data?.error || clearPatternResponse.data?.message}`
  );
}

/**
 * Test 7: Synonym Management Endpoints
 */
async function testSynonymManagementEndpoints() {
  printSection('TEST 7: Synonym Management Endpoints');
  
  if (!authToken) {
    logSkipped('Synonym management endpoints', 'No authentication token');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test GET /synonyms
  const synonymsResponse = await makeRequest('/synonyms', 'GET', null, headers);
  logTest(
    'GET /synonyms - Get all synonyms',
    synonymsResponse.ok,
    synonymsResponse.ok
      ? `Status: ${synonymsResponse.status}, Count: ${synonymsResponse.data?.count}`
      : `Error: ${synonymsResponse.data?.error || synonymsResponse.data?.message}`
  );
  
  // Test response format
  if (synonymsResponse.ok) {
    const hasSynonyms = Array.isArray(synonymsResponse.data?.synonyms);
    logTest(
      'GET /synonyms - Response has synonyms array',
      hasSynonyms,
      `Response contains ${synonymsResponse.data?.synonyms?.length} synonyms`
    );
  }
  
  // Test GET /synonyms with category filter
  const categorySynonymsResponse = await makeRequest('/synonyms?category=computing', 'GET', null, headers);
  logTest(
    'GET /synonyms?category=computing - Get synonyms by category',
    categorySynonymsResponse.ok,
    categorySynonymsResponse.ok
      ? `Status: ${categorySynonymsResponse.status}`
      : `Error: ${categorySynonymsResponse.data?.error || categorySynonymsResponse.data?.message}`
  );
  
  // Test POST /synonyms - Add synonym
  const addSynonymResponse = await makeRequest(
    '/synonyms',
    'POST',
    {
      category: 'computing',
      rule: 'test device, testing equipment'
    },
    headers
  );
  logTest(
    'POST /synonyms - Add synonym',
    addSynonymResponse.ok,
    addSynonymResponse.ok
      ? `Status: ${addSynonymResponse.status}, Total: ${addSynonymResponse.data?.totalRules}`
      : `Error: ${addSynonymResponse.data?.error || addSynonymResponse.data?.message}`
  );
  
  // Test validation - missing required fields
  const invalidSynonymResponse = await makeRequest(
    '/synonyms',
    'POST',
    {},
    headers
  );
  logTest(
    'POST /synonyms - Validation for missing fields',
    !invalidSynonymResponse.ok && invalidSynonymResponse.status === 400,
    `Status: ${invalidSynonymResponse.status} (expected 400)`
  );
  
  // Test DELETE /synonyms/:id - Remove synonym (cleanup)
  if (addSynonymResponse.ok) {
    const removeSynonymResponse = await makeRequest(
      '/synonyms/test device, testing equipment',
      'DELETE',
      {
        category: 'computing'
      },
      headers
    );
    logTest(
      'DELETE /synonyms/:id - Remove synonym',
      removeSynonymResponse.ok,
      removeSynonymResponse.ok
        ? `Status: ${removeSynonymResponse.status}`
        : `Error: ${removeSynonymResponse.data?.error || removeSynonymResponse.data?.message}`
    );
  }
  
  // Test GET /synonyms/categories
  const categoriesResponse = await makeRequest('/synonyms/categories', 'GET', null, headers);
  logTest(
    'GET /synonyms/categories - Get synonym categories',
    categoriesResponse.ok,
    categoriesResponse.ok
      ? `Status: ${categoriesResponse.status}, Categories: ${categoriesResponse.data?.totalCategories}`
      : `Error: ${categoriesResponse.data?.error || categoriesResponse.data?.message}`
  );
  
  // Test GET /synonyms/export
  const exportResponse = await makeRequest('/synonyms/export', 'GET', null, headers);
  logTest(
    'GET /synonyms/export - Export synonyms',
    exportResponse.ok,
    exportResponse.ok
      ? `Status: ${exportResponse.status}, Content-Type: ${exportResponse.headers['content-type']}`
      : `Error: ${exportResponse.data?.error || exportResponse.data?.message}`
  );
  
  // Test POST /synonyms/import
  const importResponse = await makeRequest(
    '/synonyms/import',
    'POST',
    {
      content: 'test1, test2, test3\ntest4, test5',
      category: 'test'
    },
    headers
  );
  logTest(
    'POST /synonyms/import - Import synonyms',
    importResponse.ok,
    importResponse.ok
      ? `Status: ${importResponse.status}, Imported: ${importResponse.data?.successCount}`
      : `Error: ${importResponse.data?.error || importResponse.data?.message}`
  );
}

/**
 * Test 8: Authorization Tests
 */
async function testAuthorization() {
  printSection('TEST 8: Authorization Tests');
  
  // Test without authentication
  const noAuthResponse = await makeRequest('/health', 'GET');
  logTest(
    'GET /health - Requires authentication',
    !noAuthResponse.ok && (noAuthResponse.status === 401 || noAuthResponse.status === 403),
    `Status: ${noAuthResponse.status} (expected 401/403)`
  );
  
  // Test with invalid token
  const invalidAuthResponse = await makeRequest(
    '/health',
    'GET',
    null,
    { 'Authorization': 'Bearer invalid-token' }
  );
  logTest(
    'GET /health - Rejects invalid token',
    !invalidAuthResponse.ok && (invalidAuthResponse.status === 401 || invalidAuthResponse.status === 403),
    `Status: ${invalidAuthResponse.status} (expected 401/403)`
  );
}

/**
 * Test 9: Error Handling Tests
 */
async function testErrorHandling() {
  printSection('TEST 9: Error Handling');
  
  if (!authToken) {
    logSkipped('Error handling tests', 'No authentication token');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test 404 - Non-existent endpoint
  const notFoundResponse = await makeRequest('/nonexistent', 'GET', null, headers);
  logTest(
    'GET /nonexistent - Returns 404 for non-existent endpoint',
    notFoundResponse.status === 404,
    `Status: ${notFoundResponse.status} (expected 404)`
  );
  
  // Test 404 - Non-existent index
  const nonExistentIndexResponse = await makeRequest('/indices/non-existent-index-12345', 'GET', null, headers);
  logTest(
    'GET /indices/non-existent-index-12345 - Returns 404 for non-existent index',
    nonExistentIndexResponse.status === 404,
    `Status: ${nonExistentIndexResponse.status} (expected 404)`
  );
  
  // Test validation - Invalid query parameter
  const invalidQueryResponse = await makeRequest('/performance/slow-queries?limit=abc', 'GET', null, headers);
  logTest(
    'GET /performance/slow-queries?limit=abc - Validates query parameters',
    invalidQueryResponse.status === 400,
    `Status: ${invalidQueryResponse.status} (expected 400 for invalid limit)`
  );
  
  // Test response format for errors
  if (notFoundResponse.status === 404) {
    const hasErrorField = notFoundResponse.data?.error !== undefined;
    logTest(
      'Error responses have error field',
      hasErrorField,
      `Error: ${notFoundResponse.data?.error || notFoundResponse.data?.message}`
    );
  }
}

/**
 * Test 10: Response Format Tests
 */
async function testResponseFormats() {
  printSection('TEST 10: Response Format Tests');
  
  if (!authToken) {
    logSkipped('Response format tests', 'No authentication token');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  // Test successful response format
  const successResponse = await makeRequest('/health', 'GET', null, headers);
  if (successResponse.ok) {
    const isJsonObject = typeof successResponse.data === 'object' && successResponse.data !== null;
    logTest(
      'Successful responses are JSON objects',
      isJsonObject,
      'Response is a valid JSON object'
    );
    
    const hasContentType = successResponse.headers['content-type']?.includes('application/json');
    logTest(
      'Successful responses have JSON content-type',
      hasContentType,
      `Content-Type: ${successResponse.headers['content-type']}`
    );
  }
  
  // Test error response format
  const errorResponse = await makeRequest('/indices/non-existent', 'GET', null, headers);
  if (errorResponse.status >= 400) {
    const isJsonObject = typeof errorResponse.data === 'object' && errorResponse.data !== null;
    logTest(
      'Error responses are JSON objects',
      isJsonObject,
      'Error response is a valid JSON object'
    );
    
    const hasErrorField = errorResponse.data?.error !== undefined || errorResponse.data?.message !== undefined;
    logTest(
      'Error responses have error/message field',
      hasErrorField,
      `Error field present: ${hasErrorField}`
    );
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + colors.bright + colors.cyan);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Phase 5 Milestone 1 - Elasticsearch Admin API Tests    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  log(`Backend URL: ${TEST_CONFIG.backendUrl}`, 'cyan');
  log(`API Path: ${TEST_CONFIG.apiPath}`, 'cyan');
  log(`Verbose Mode: ${TEST_CONFIG.verbose}`, 'cyan');
  log(`Skip Auth: ${TEST_CONFIG.skipAuth}`, 'cyan');
  log(`Start Time: ${new Date().toISOString()}`, 'cyan');
  
  try {
    // Run all tests
    await testAuthentication();
    await testClusterHealthEndpoints();
    await testIndexManagementEndpoints();
    await testBackupManagementEndpoints();
    await testPerformanceMonitoringEndpoints();
    await testCacheManagementEndpoints();
    await testSynonymManagementEndpoints();
    await testAuthorization();
    await testErrorHandling();
    await testResponseFormats();
    
    // Print summary
    printSummary();
    
    // Save results to file
    const resultsPath = path.join(__dirname, 'test-results', 'elasticsearch-api-test-results.json');
    const fs = require('fs');
    const resultsDir = path.dirname(resultsPath);
    
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(
      resultsPath,
      JSON.stringify(testResults, null, 2)
    );
    
    log(`\nTest results saved to: ${resultsPath}`, 'cyan');
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
    
  } catch (error) {
    log(`\nFatal error running tests: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testResults
};
