/**
 * Elasticsearch Setup Test Script
 * 
 * This script tests the Elasticsearch setup for Phase 5 Milestone 1, including:
 * - Client connection
 * - Index creation with mappings
 * - Synonym management
 * - Cache operations
 * - Query optimization
 * - Performance monitoring
 * 
 * Usage: node scripts/test-elasticsearch-setup.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Add backend to path
process.env.NODE_PATH = path.join(__dirname, '..', 'backend');
require('module').Module._initPaths();

// Test configuration
const TEST_CONFIG = {
  elasticsearchNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  testIndexPrefix: 'test-',
  verbose: process.env.VERBOSE === 'true'
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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
 * Test 1: Environment Configuration
 */
async function testEnvironmentConfiguration() {
  printSection('TEST 1: Environment Configuration');
  
  // Check required environment variables
  const requiredVars = [
    'ELASTICSEARCH_NODE',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const passed = value !== undefined && value !== '';
    logTest(
      `Environment variable ${varName} is set`,
      passed,
      passed ? `Value: ${value}` : 'Variable is missing or empty'
    );
  }
  
  // Check environment variable formats
  const urlVars = ['ELASTICSEARCH_NODE', 'DATABASE_URL'];
  for (const varName of urlVars) {
    const value = process.env[varName];
    if (value) {
      const isValidUrl = value.startsWith('http://') || value.startsWith('https://');
      logTest(
        `Environment variable ${varName} has valid URL format`,
        isValidUrl,
        isValidUrl ? `URL: ${value}` : 'Invalid URL format'
      );
    }
  }
}

/**
 * Test 2: Elasticsearch Client Connection
 */
async function testElasticsearchClient() {
  printSection('TEST 2: Elasticsearch Client Connection');
  
  try {
    const { elasticsearchConfig } = require('../backend/config/elasticsearch');
    
    // Test client initialization
    logTest(
      'Elasticsearch client initialized',
      elasticsearchConfig.getClient() !== null,
      'Client instance created successfully'
    );
    
    // Test health check
    const healthResult = await elasticsearchConfig.checkHealth();
    logTest(
      'Elasticsearch cluster health check',
      healthResult.success,
      healthResult.success 
        ? `Status: ${healthResult.status}, Nodes: ${healthResult.numberOfNodes}`
        : `Error: ${healthResult.error}`
    );
    
    // Test connection status
    const connectionStatus = elasticsearchConfig.getConnectionStatus();
    logTest(
      'Elasticsearch connection status',
      connectionStatus.isConnected,
      connectionStatus.isConnected
        ? `Connected to ${connectionStatus.node}`
        : 'Not connected'
    );
    
    // Test ping
    const pingResult = await elasticsearchConfig.ping();
    logTest(
      'Elasticsearch ping',
      pingResult,
      pingResult ? 'Ping successful' : 'Ping failed'
    );
    
    // Test cluster info
    const clusterInfo = await elasticsearchConfig.getClusterInfo();
    logTest(
      'Elasticsearch cluster information',
      clusterInfo.success,
      clusterInfo.success
        ? `Version: ${clusterInfo.version}, Name: ${clusterInfo.name}`
        : `Error: ${clusterInfo.error}`
    );
    
  } catch (error) {
    logTest(
      'Elasticsearch client tests',
      false,
      `Failed to load elasticsearch config: ${error.message}`
    );
  }
}

/**
 * Test 3: Index Mappings
 */
async function testIndexMappings() {
  printSection('TEST 3: Index Mappings');
  
  try {
    const { 
      productIndexMapping,
      categoryIndexMapping,
      brandIndexMapping,
      getMapping,
      getAllMappings,
      validateMapping
    } = require('../backend/services/elasticsearch/mappings');
    
    // Test product index mapping
    logTest(
      'Product index mapping exists',
      productIndexMapping && productIndexMapping.mappings,
      'Product mapping has required structure'
    );
    
    // Test category index mapping
    logTest(
      'Category index mapping exists',
      categoryIndexMapping && categoryIndexMapping.mappings,
      'Category mapping has required structure'
    );
    
    // Test brand index mapping
    logTest(
      'Brand index mapping exists',
      brandIndexMapping && brandIndexMapping.mappings,
      'Brand mapping has required structure'
    );
    
    // Test getMapping function
    try {
      const productMapping = getMapping('product');
      logTest(
        'getMapping("product") returns valid mapping',
        productMapping && productMapping.mappings,
        'Product mapping retrieved successfully'
      );
    } catch (error) {
      logTest('getMapping("product") returns valid mapping', false, error.message);
    }
    
    // Test getAllMappings function
    const allMappings = getAllMappings();
    logTest(
      'getAllMappings returns all mappings',
      allMappings && allMappings.product && allMappings.category && allMappings.brand,
      'All three mappings retrieved successfully'
    );
    
    // Test validateMapping function
    const isValid = validateMapping(productIndexMapping);
    logTest(
      'validateMapping validates mapping structure',
      isValid,
      isValid ? 'Mapping structure is valid' : 'Mapping structure is invalid'
    );
    
    // Test invalid mapping validation
    const invalidMapping = { invalid: 'structure' };
    const isInvalidValid = validateMapping(invalidMapping);
    logTest(
      'validateMapping rejects invalid mapping',
      !isInvalidValid,
      'Invalid mapping correctly rejected'
    );
    
  } catch (error) {
    logTest(
      'Index mappings tests',
      false,
      `Failed to load mappings: ${error.message}`
    );
  }
}

/**
 * Test 4: Index Manager Service
 */
async function testIndexManager() {
  printSection('TEST 4: Index Manager Service');
  
  try {
    const { elasticsearchConfig } = require('../backend/config/elasticsearch');
    const { IndexManagerService, getIndexName, getAliasName, INDEX_NAMES } = 
      require('../backend/services/elasticsearch/indexManager');
    
    const client = elasticsearchConfig.getClient();
    const indexManager = new IndexManagerService(client);
    
    // Test getIndexName function
    try {
      const productIndexName = getIndexName('product');
      logTest(
        'getIndexName("product") returns correct index name',
        productIndexName === INDEX_NAMES.products,
        `Expected: ${INDEX_NAMES.products}, Got: ${productIndexName}`
      );
    } catch (error) {
      logTest('getIndexName("product") returns correct index name', false, error.message);
    }
    
    // Test getAliasName function
    try {
      const productAliasName = getAliasName('product');
      logTest(
        'getAliasName("product") returns correct alias name',
        productAliasName === INDEX_NAMES.productsAlias,
        `Expected: ${INDEX_NAMES.productsAlias}, Got: ${productAliasName}`
      );
    } catch (error) {
      logTest('getAliasName("product") returns correct alias name', false, error.message);
    }
    
    // Test getAllIndices
    const allIndicesResult = await indexManager.getAllIndices();
    logTest(
      'getAllIndices retrieves indices',
      allIndicesResult.success,
      allIndicesResult.success
        ? `Found ${allIndicesResult.count} indices`
        : `Error: ${allIndicesResult.error}`
    );
    
    // Test checkIndexExists for system indices
    const productExistsResult = await indexManager.checkIndexExists(INDEX_NAMES.products);
    logTest(
      `checkIndexExists("${INDEX_NAMES.products}")`,
      productExistsResult.success,
      productExistsResult.success
        ? `Exists: ${productExistsResult.exists}`
        : `Error: ${productExistsResult.error}`
    );
    
    // Test getIndexStats if index exists
    if (productExistsResult.success && productExistsResult.exists) {
      const statsResult = await indexManager.getIndexStats(INDEX_NAMES.products);
      logTest(
        `getIndexStats("${INDEX_NAMES.products}")`,
        statsResult.success,
        statsResult.success
          ? 'Index statistics retrieved successfully'
          : `Error: ${statsResult.error}`
      );
    } else {
      logSkipped(
        `getIndexStats("${INDEX_NAMES.products}")`,
        'Index does not exist'
      );
    }
    
  } catch (error) {
    logTest(
      'Index manager service tests',
      false,
      `Failed to load index manager: ${error.message}`
    );
  }
}

/**
 * Test 5: Synonym Management
 */
async function testSynonymManagement() {
  printSection('TEST 5: Synonym Management');
  
  try {
    const {
      getAllSynonyms,
      getCategorySynonyms,
      getAllCategories,
      searchSynonyms,
      addSynonym,
      removeSynonym,
      validateSynonymRule,
      exportSynonymsToFile,
      importSynonymsFromFile,
      getSynonymStatistics
    } = require('../backend/services/elasticsearch/synonyms');
    
    // Test getAllSynonyms
    const allSynonyms = getAllSynonyms();
    logTest(
      'getAllSynonyms returns array of synonyms',
      Array.isArray(allSynonyms) && allSynonyms.length > 0,
      `Found ${allSynonyms.length} synonym rules`
    );
    
    // Test getAllCategories
    const categories = getAllCategories();
    logTest(
      'getAllCategories returns array of categories',
      Array.isArray(categories) && categories.length > 0,
      `Found ${categories.length} categories`
    );
    
    // Test getCategorySynonyms
    try {
      const computingSynonyms = getCategorySynonyms('computing');
      logTest(
        'getCategorySynonyms("computing") returns synonyms',
        Array.isArray(computingSynonyms) && computingSynonyms.length > 0,
        `Found ${computingSynonyms.length} computing synonyms`
      );
    } catch (error) {
      logTest('getCategorySynonyms("computing") returns synonyms', false, error.message);
    }
    
    // Test searchSynonyms
    const searchResults = searchSynonyms('laptop');
    logTest(
      'searchSynonyms("laptop") finds matching rules',
      Array.isArray(searchResults) && searchResults.length > 0,
      `Found ${searchResults.length} matching rules`
    );
    
    // Test validateSynonymRule
    const validRule = 'laptop, notebook, portable computer';
    const isValid = validateSynonymRule(validRule);
    logTest(
      'validateSynonymRule validates correct rule',
      isValid,
      'Valid synonym rule accepted'
    );
    
    // Test validateSynonymRule with invalid rule
    const invalidRule = 'single';
    const isInvalidValid = validateSynonymRule(invalidRule);
    logTest(
      'validateSynonymRule rejects invalid rule',
      !isInvalidValid,
      'Invalid synonym rule rejected'
    );
    
    // Test addSynonym
    const addResult = addSynonym('computing', 'test device, testing equipment');
    logTest(
      'addSynonym adds new synonym rule',
      addResult.success,
      addResult.success
        ? `Rule added, total: ${addResult.totalRules}`
        : `Error: ${addResult.error}`
    );
    
    // Test removeSynonym (cleanup)
    if (addResult.success) {
      const removeResult = removeSynonym('computing', 'test device, testing equipment');
      logTest(
        'removeSynonym removes synonym rule',
        removeResult.success,
        removeResult.success
          ? `Rule removed, total: ${removeResult.totalRules}`
          : `Error: ${removeResult.error}`
      );
    }
    
    // Test exportSynonymsToFile
    const exportedContent = exportSynonymsToFile();
    logTest(
      'exportSynonymsToFile exports synonyms',
      typeof exportedContent === 'string' && exportedContent.length > 0,
      `Exported ${exportedContent.split('\n').length} lines`
    );
    
    // Test importSynonymsFromFile
    const importContent = 'test1, test2, test3\ntest4, test5';
    const importResult = importSynonymsFromFile(importContent, 'test');
    logTest(
      'importSynonymsFromFile imports synonyms',
      importResult.success,
      importResult.success
        ? `Imported ${importResult.successCount} rules`
        : `Error: ${importResult.error}`
    );
    
    // Test getSynonymStatistics
    const stats = getSynonymStatistics();
    logTest(
      'getSynonymStatistics returns statistics',
      stats && typeof stats.totalRules === 'number',
      `Total rules: ${stats.totalRules}, Categories: ${stats.totalCategories}`
    );
    
  } catch (error) {
    logTest(
      'Synonym management tests',
      false,
      `Failed to load synonyms: ${error.message}`
    );
  }
}

/**
 * Test 6: Cache Service
 */
async function testCacheService() {
  printSection('TEST 6: Cache Service');
  
  try {
    const { redisConnectionPool } = require('../backend/services/redisConnectionPool');
    const { CacheService, generateCacheKey, generateSearchCacheKey } = 
      require('../backend/services/elasticsearch/cache');
    
    // Test cache service initialization
    const cacheService = new CacheService(redisConnectionPool.getClient('cache-test'));
    const initResult = await cacheService.initialize();
    logTest(
      'Cache service initializes',
      initResult.success,
      initResult.success ? 'Cache service initialized successfully' : `Error: ${initResult.error}`
    );
    
    if (!initResult.success) {
      logSkipped('Cache service operations', 'Cache service failed to initialize');
      return;
    }
    
    // Test generateCacheKey
    const cacheKey = generateCacheKey('search', { query: 'test' });
    logTest(
      'generateCacheKey generates cache key',
      typeof cacheKey === 'string' && cacheKey.startsWith('search:'),
      `Generated key: ${cacheKey}`
    );
    
    // Test generateSearchCacheKey
    const searchKey = generateSearchCacheKey('laptop', { price: { min: 0, max: 1000 } });
    logTest(
      'generateSearchCacheKey generates search cache key',
      typeof searchKey === 'string' && searchKey.startsWith('search:'),
      `Generated key: ${searchKey}`
    );
    
    // Test cache set and get
    const testKey = 'test:cache:key';
    const testValue = { data: 'test data' };
    const setResult = await cacheService.set(testKey, testValue, 60);
    logTest(
      'Cache set operation',
      setResult,
      'Value cached successfully'
    );
    
    if (setResult) {
      const getValue = await cacheService.get(testKey);
      logTest(
        'Cache get operation',
        getValue !== null && getValue.data === testValue.data,
        `Retrieved: ${JSON.stringify(getValue)}`
      );
      
      // Test cache delete
      const deleteResult = await cacheService.delete(testKey);
      logTest(
        'Cache delete operation',
        deleteResult,
        'Value deleted from cache'
      );
      
      // Verify deletion
      const afterDelete = await cacheService.get(testKey);
      logTest(
        'Cache deletion verified',
        afterDelete === null,
        'Value no longer in cache'
      );
    }
    
    // Test cache statistics
    const stats = cacheService.getStats();
    logTest(
      'Cache statistics',
      stats && typeof stats.hits === 'number',
      `Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${stats.hitRate}`
    );
    
  } catch (error) {
    logTest(
      'Cache service tests',
      false,
      `Failed to test cache service: ${error.message}`
    );
  }
}

/**
 * Test 7: Performance Monitor Service
 */
async function testPerformanceMonitor() {
  printSection('TEST 7: Performance Monitor Service');
  
  try {
    const { elasticsearchConfig } = require('../backend/config/elasticsearch');
    const { IndexManagerService } = require('../backend/services/elasticsearch/indexManager');
    const { redisConnectionPool } = require('../backend/services/redisConnectionPool');
    const { CacheService } = require('../backend/services/elasticsearch/cache');
    const { PerformanceMonitorService, MONITOR_CONFIG } = 
      require('../backend/services/elasticsearch/performanceMonitor');
    
    const client = elasticsearchConfig.getClient();
    const indexManager = new IndexManagerService(client);
    const cacheService = new CacheService(redisConnectionPool.getClient('perf-test'));
    const performanceMonitor = new PerformanceMonitorService(client, indexManager, cacheService);
    
    // Test performance monitor initialization
    const initResult = await performanceMonitor.initialize();
    logTest(
      'Performance monitor initializes',
      initResult.success,
      initResult.success 
        ? 'Performance monitor initialized successfully' 
        : `Error: ${initResult.error}`
    );
    
    // Test trackQuery
    performanceMonitor.trackQuery('search', 'test-index', { query: 'test' }, 150, false);
    logTest(
      'Performance monitor tracks query',
      true,
      'Query tracked successfully'
    );
    
    // Test getPerformanceReport
    const report = performanceMonitor.getPerformanceReport();
    logTest(
      'Performance monitor generates report',
      report && report.summary && report.queries,
      `Total queries: ${report.summary.totalQueries}`
    );
    
    // Test getQueryPerformance
    const queryPerf = performanceMonitor.getQueryPerformance('search');
    logTest(
      'Performance monitor gets query performance',
      queryPerf && typeof queryPerf.count === 'number',
      `Search queries: ${queryPerf.count}, Avg duration: ${queryPerf.avgDuration}ms`
    );
    
    // Test getTargetsStatus
    const targetsStatus = performanceMonitor.getTargetsStatus();
    logTest(
      'Performance monitor gets targets status',
      targetsStatus && targetsStatus.searchResponseTime,
      `Search response time: ${targetsStatus.searchResponseTime.status}`
    );
    
    // Test getStatus
    const status = performanceMonitor.getStatus();
    logTest(
      'Performance monitor gets status',
      status && typeof status.isMonitoring === 'boolean',
      `Monitoring: ${status.isMonitoring}`
    );
    
    // Stop monitoring
    await performanceMonitor.stopMonitoring();
    logTest(
      'Performance monitor stops monitoring',
      true,
      'Monitoring stopped successfully'
    );
    
  } catch (error) {
    logTest(
      'Performance monitor service tests',
      false,
      `Failed to test performance monitor: ${error.message}`
    );
  }
}

/**
 * Test 8: Elasticsearch Client Service
 */
async function testElasticsearchClientService() {
  printSection('TEST 8: Elasticsearch Client Service');
  
  try {
    const { elasticsearchClientService } = require('../backend/services/elasticsearch/client');
    
    // Test client service initialization
    const initResult = await elasticsearchClientService.initialize({
      enableMonitoring: false
    });
    logTest(
      'Elasticsearch client service initializes',
      initResult.success,
      initResult.success 
        ? 'Client service initialized successfully' 
        : `Error: ${initResult.error}`
    );
    
    // Test checkHealth
    const healthResult = await elasticsearchClientService.checkHealth();
    logTest(
      'Client service checks health',
      healthResult.success,
      healthResult.success
        ? `Status: ${healthResult.status}`
        : `Error: ${healthResult.error}`
    );
    
    // Test checkConnectionStatus
    const connectionStatus = await elasticsearchClientService.checkConnectionStatus();
    logTest(
      'Client service checks connection status',
      connectionStatus.success,
      connectionStatus.success
        ? `Connected: ${connectionStatus.isConnected}`
        : `Error: ${connectionStatus.error}`
    );
    
    // Test getClusterInfo
    const clusterInfo = await elasticsearchClientService.getClusterInfo();
    logTest(
      'Client service gets cluster info',
      clusterInfo.success,
      clusterInfo.success
        ? `Version: ${clusterInfo.version}`
        : `Error: ${clusterInfo.error}`
    );
    
    // Test getServiceStatus
    const serviceStatus = await elasticsearchClientService.getServiceStatus();
    logTest(
      'Client service gets service status',
      serviceStatus.success,
      serviceStatus.success
        ? 'Service status retrieved successfully'
        : `Error: ${serviceStatus.error}`
    );
    
    // Test getHealthStatus
    const healthStatus = elasticsearchClientService.getHealthStatus();
    logTest(
      'Client service gets health status',
      typeof healthStatus === 'string',
      `Health status: ${healthStatus}`
    );
    
    // Test getClient
    const client = elasticsearchClientService.getClient();
    logTest(
      'Client service gets client instance',
      client !== null,
      'Client instance retrieved successfully'
    );
    
    // Test shutdown
    const shutdownResult = await elasticsearchClientService.shutdown();
    logTest(
      'Client service shuts down',
      shutdownResult.success,
      shutdownResult.success
        ? 'Client service shut down successfully'
        : `Error: ${shutdownResult.error}`
    );
    
  } catch (error) {
    logTest(
      'Elasticsearch client service tests',
      false,
      `Failed to test client service: ${error.message}`
    );
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + colors.bright + colors.cyan);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Phase 5 Milestone 1 - Elasticsearch Setup Tests       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  log(`Elasticsearch Node: ${TEST_CONFIG.elasticsearchNode}`, 'cyan');
  log(`Verbose Mode: ${TEST_CONFIG.verbose}`, 'cyan');
  log(`Start Time: ${new Date().toISOString()}`, 'cyan');
  
  try {
    // Run all tests
    await testEnvironmentConfiguration();
    await testElasticsearchClient();
    await testIndexMappings();
    await testIndexManager();
    await testSynonymManagement();
    await testCacheService();
    await testPerformanceMonitor();
    await testElasticsearchClientService();
    
    // Print summary
    printSummary();
    
    // Save results to file
    const resultsPath = path.join(__dirname, 'test-results', 'elasticsearch-setup-test-results.json');
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
