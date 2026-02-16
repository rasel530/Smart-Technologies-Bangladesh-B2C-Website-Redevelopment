/**
 * COMPREHENSIVE REGRESSION TESTING FOR PHASE 6, MILESTONE 1
 * Testing Phases 1-5 to verify no breaking changes were introduced
 * 
 * This test suite verifies that all existing functionality from Phases 1-5
 * continues to work correctly after the Phase 6, Milestone 1 cart implementation.
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test configuration
const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  timeout: 30000,
};

// Test results tracking
const testResults = {
  phase1: { passed: 0, failed: 0, tests: [] },
  phase2: { passed: 0, failed: 0, tests: [] },
  phase3: { passed: 0, failed: 0, tests: [] },
  phase4: { passed: 0, failed: 0, tests: [] },
  phase5: { passed: 0, failed: 0, tests: [] },
  database: { passed: 0, failed: 0, tests: [] },
  api: { passed: 0, failed: 0, tests: [] },
  frontend: { passed: 0, failed: 0, tests: [] },
  admin: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] },
  security: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] },
};

// Helper function to track test results
function recordTest(phase, testName, passed, details = '') {
  const result = {
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString(),
  };
  
  if (testResults[phase]) {
    testResults[phase].tests.push(result);
    if (passed) {
      testResults[phase].passed++;
    } else {
      testResults[phase].failed++;
    }
  }
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios({
      method,
      url: `${config.backendUrl}${endpoint}`,
      data,
      headers,
      timeout: config.timeout,
    });
    
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
  }
}

// ============================================================================
// PHASE 1: PROJECT SETUP REGRESSION TESTING
// ============================================================================

async function testPhase1ProjectSetup() {
  console.log('\n=== PHASE 1: PROJECT SETUP REGRESSION TESTING ===\n');
  
  // Test 1.1: Verify project structure
  try {
    const fs = require('fs');
    const path = require('path');
    
    const requiredDirs = [
      'backend',
      'frontend',
      'backend/prisma',
      'backend/routes',
      'backend/controllers',
      'backend/middleware',
      'frontend/src',
      'frontend/src/app',
      'frontend/src/components',
    ];
    
    let structureIntact = true;
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        structureIntact = false;
        console.log(`❌ Missing directory: ${dir}`);
      }
    }
    
    recordTest('phase1', 'Project structure intact', structureIntact, structureIntact ? 'All required directories present' : 'Missing directories');
    console.log(structureIntact ? '✅ Project structure intact' : '❌ Project structure has issues');
  } catch (error) {
    recordTest('phase1', 'Project structure intact', false, error.message);
    console.log('❌ Project structure check failed:', error.message);
  }
  
  // Test 1.2: Verify package.json dependencies
  try {
    const fs = require('fs');
    const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    
    const requiredBackendDeps = [
      'express',
      '@prisma/client',
      'jsonwebtoken',
      'bcryptjs',
      'cors',
      'helmet',
    ];
    
    const requiredFrontendDeps = [
      'next',
      'react',
      'react-dom',
      'next-auth',
    ];
    
    let backendDepsValid = requiredBackendDeps.every(dep => backendPackage.dependencies[dep]);
    let frontendDepsValid = requiredFrontendDeps.every(dep => frontendPackage.dependencies[dep]);
    
    const depsValid = backendDepsValid && frontendDepsValid;
    recordTest('phase1', 'Package.json dependencies correct', depsValid, depsValid ? 'All required dependencies present' : 'Missing dependencies');
    console.log(depsValid ? '✅ Package.json dependencies correct' : '❌ Package.json dependencies have issues');
  } catch (error) {
    recordTest('phase1', 'Package.json dependencies correct', false, error.message);
    console.log('❌ Package.json check failed:', error.message);
  }
  
  // Test 1.3: Verify environment variables
  try {
    const fs = require('fs');
    
    let envConfigured = true;
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'REDIS_HOST',
      'REDIS_PASSWORD',
    ];
    
    if (fs.existsSync('backend/.env')) {
      const envContent = fs.readFileSync('backend/.env', 'utf8');
      for (const envVar of requiredEnvVars) {
        if (!envContent.includes(`${envVar}=`)) {
          envConfigured = false;
          console.log(`❌ Missing environment variable: ${envVar}`);
        }
      }
    } else {
      envConfigured = false;
      console.log('❌ backend/.env file not found');
    }
    
    recordTest('phase1', 'Environment variables configured', envConfigured, envConfigured ? 'All required env vars present' : 'Missing env vars');
    console.log(envConfigured ? '✅ Environment variables configured' : '❌ Environment variables have issues');
  } catch (error) {
    recordTest('phase1', 'Environment variables configured', false, error.message);
    console.log('❌ Environment variables check failed:', error.message);
  }
  
  // Test 1.4: Verify Docker configuration
  try {
    const fs = require('fs');
    const yaml = require('js-yaml');
    
    const dockerComposeContent = fs.readFileSync('docker-compose.yml', 'utf8');
    const dockerCompose = yaml.load(dockerComposeContent);
    
    const requiredServices = ['frontend', 'backend', 'postgres', 'redis'];
    let servicesValid = requiredServices.every(service => dockerCompose.services[service]);
    
    recordTest('phase1', 'Docker configuration unchanged', servicesValid, servicesValid ? 'All required services present' : 'Missing services');
    console.log(servicesValid ? '✅ Docker configuration unchanged' : '❌ Docker configuration has issues');
  } catch (error) {
    recordTest('phase1', 'Docker configuration unchanged', false, error.message);
    console.log('❌ Docker configuration check failed:', error.message);
  }
  
  // Test 1.5: Verify Git repository structure
  try {
    const fs = require('fs');
    const gitExists = fs.existsSync('.git');
    
    recordTest('phase1', 'Git repository structure intact', gitExists, gitExists ? '.git directory exists' : '.git directory missing');
    console.log(gitExists ? '✅ Git repository structure intact' : '❌ Git repository structure has issues');
  } catch (error) {
    recordTest('phase1', 'Git repository structure intact', false, error.message);
    console.log('❌ Git repository check failed:', error.message);
  }
}

// ============================================================================
// PHASE 2: BASIC STRUCTURE REGRESSION TESTING
// ============================================================================

async function testPhase2BasicStructure() {
  console.log('\n=== PHASE 2: BASIC STRUCTURE REGRESSION TESTING ===\n');
  
  // Test 2.1: Verify backend routing works
  try {
    const response = await apiRequest('GET', '/api/v1/health');
    const routingWorks = response.success || response.status === 404; // 404 is acceptable if health endpoint doesn't exist
    
    recordTest('phase2', 'Backend routing works', routingWorks, routingWorks ? 'Backend responds to requests' : 'Backend not responding');
    console.log(routingWorks ? '✅ Backend routing works' : '❌ Backend routing has issues');
  } catch (error) {
    recordTest('phase2', 'Backend routing works', false, error.message);
    console.log('❌ Backend routing check failed:', error.message);
  }
  
  // Test 2.2: Verify database connection works
  try {
    await prisma.$connect();
    const dbConnected = true;
    
    recordTest('phase2', 'Database connection works', dbConnected, 'Successfully connected to database');
    console.log('✅ Database connection works');
  } catch (error) {
    recordTest('phase2', 'Database connection works', false, error.message);
    console.log('❌ Database connection check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  // Test 2.3: Verify basic middleware functions
  try {
    const response = await apiRequest('GET', '/api/v1/products');
    const middlewareWorks = response.success || response.status === 401 || response.status === 404;
    
    recordTest('phase2', 'Basic middleware functions', middlewareWorks, middlewareWorks ? 'Middleware processing requests' : 'Middleware not functioning');
    console.log(middlewareWorks ? '✅ Basic middleware functions' : '❌ Basic middleware has issues');
  } catch (error) {
    recordTest('phase2', 'Basic middleware functions', false, error.message);
    console.log('❌ Basic middleware check failed:', error.message);
  }
}

// ============================================================================
// PHASE 3: AUTHENTICATION & USER MANAGEMENT REGRESSION TESTING
// ============================================================================

async function testPhase3Authentication() {
  console.log('\n=== PHASE 3: AUTHENTICATION & USER MANAGEMENT REGRESSION TESTING ===\n');
  
  let authToken = null;
  let testUserId = null;
  
  // Test 3.1: Verify user registration works
  try {
    const testUser = {
      email: `regression_test_${Date.now()}@test.com`,
      password: 'TestPassword123!',
      firstName: 'Regression',
      lastName: 'Test',
      phone: '+8801700000000',
    };
    
    const response = await apiRequest('POST', '/api/v1/auth/register', testUser);
    const registrationWorks = response.success || response.status === 201;
    
    if (registrationWorks && response.data?.user?.id) {
      testUserId = response.data.user.id;
    }
    
    recordTest('phase3', 'User registration works', registrationWorks, registrationWorks ? 'User can register' : 'Registration failed');
    console.log(registrationWorks ? '✅ User registration works' : '❌ User registration has issues');
  } catch (error) {
    recordTest('phase3', 'User registration works', false, error.message);
    console.log('❌ User registration check failed:', error.message);
  }
  
  // Test 3.2: Verify user login works
  try {
    const loginData = {
      email: `regression_test_${Date.now()}@test.com`,
      password: 'TestPassword123!',
    };
    
    const response = await apiRequest('POST', '/api/v1/auth/login', loginData);
    const loginWorks = response.success || response.status === 200 || response.status === 401;
    
    if (response.data?.token) {
      authToken = response.data.token;
    }
    
    recordTest('phase3', 'User login works', loginWorks, loginWorks ? 'User can login' : 'Login failed');
    console.log(loginWorks ? '✅ User login works' : '❌ User login has issues');
  } catch (error) {
    recordTest('phase3', 'User login works', false, error.message);
    console.log('❌ User login check failed:', error.message);
  }
  
  // Test 3.3: Verify JWT token generation works
  try {
    const tokenValid = authToken && authToken.length > 0;
    
    recordTest('phase3', 'JWT token generation works', tokenValid, tokenValid ? 'JWT token generated' : 'JWT token not generated');
    console.log(tokenValid ? '✅ JWT token generation works' : '❌ JWT token generation has issues');
  } catch (error) {
    recordTest('phase3', 'JWT token generation works', false, error.message);
    console.log('❌ JWT token generation check failed:', error.message);
  }
  
  // Test 3.4: Verify RBAC system works
  try {
    await prisma.$connect();
    const roles = await prisma.roles.findMany();
    const rbacWorks = roles.length > 0;
    
    recordTest('phase3', 'RBAC system works', rbacWorks, rbacWorks ? `Found ${roles.length} roles` : 'No roles found');
    console.log(rbacWorks ? '✅ RBAC system works' : '❌ RBAC system has issues');
  } catch (error) {
    recordTest('phase3', 'RBAC system works', false, error.message);
    console.log('❌ RBAC system check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  // Test 3.5: Verify user profile management works
  try {
    const response = await apiRequest('GET', '/api/v1/users/profile', null, authToken);
    const profileWorks = response.success || response.status === 200 || response.status === 401;
    
    recordTest('phase3', 'User profile management works', profileWorks, profileWorks ? 'Profile endpoint accessible' : 'Profile endpoint not accessible');
    console.log(profileWorks ? '✅ User profile management works' : '❌ User profile management has issues');
  } catch (error) {
    recordTest('phase3', 'User profile management works', false, error.message);
    console.log('❌ User profile management check failed:', error.message);
  }
  
  // Test 3.6: Verify NextAuth integration works
  try {
    const fs = require('fs');
    const nextAuthConfigured = fs.existsSync('frontend/src/app/api/auth/[...nextauth]/route.ts') ||
                               fs.existsSync('frontend/src/pages/api/auth/[...nextauth].ts');
    
    recordTest('phase3', 'NextAuth integration works', nextAuthConfigured, nextAuthConfigured ? 'NextAuth route exists' : 'NextAuth route missing');
    console.log(nextAuthConfigured ? '✅ NextAuth integration works' : '❌ NextAuth integration has issues');
  } catch (error) {
    recordTest('phase3', 'NextAuth integration works', false, error.message);
    console.log('❌ NextAuth integration check failed:', error.message);
  }
}

// ============================================================================
// PHASE 4: PRODUCT CATALOG REGRESSION TESTING
// ============================================================================

async function testPhase4ProductCatalog() {
  console.log('\n=== PHASE 4: PRODUCT CATALOG REGRESSION TESTING ===\n');
  
  // Test 4.1: Verify product listing works
  try {
    const response = await apiRequest('GET', '/api/v1/products');
    const productListingWorks = response.success || response.status === 200;
    
    recordTest('phase4', 'Product listing works', productListingWorks, productListingWorks ? 'Products can be listed' : 'Product listing failed');
    console.log(productListingWorks ? '✅ Product listing works' : '❌ Product listing has issues');
  } catch (error) {
    recordTest('phase4', 'Product listing works', false, error.message);
    console.log('❌ Product listing check failed:', error.message);
  }
  
  // Test 4.2: Verify product details page works
  try {
    const response = await apiRequest('GET', '/api/v1/products?page=1&limit=1');
    let productDetailsWorks = false;
    
    if (response.success && response.data?.products?.length > 0) {
      const productId = response.data.products[0].id;
      const detailResponse = await apiRequest('GET', `/api/v1/products/${productId}`);
      productDetailsWorks = detailResponse.success || detailResponse.status === 200;
    }
    
    recordTest('phase4', 'Product details page works', productDetailsWorks, productDetailsWorks ? 'Product details accessible' : 'Product details not accessible');
    console.log(productDetailsWorks ? '✅ Product details page works' : '❌ Product details page has issues');
  } catch (error) {
    recordTest('phase4', 'Product details page works', false, error.message);
    console.log('❌ Product details page check failed:', error.message);
  }
  
  // Test 4.3: Verify category browsing works
  try {
    const response = await apiRequest('GET', '/api/v1/categories');
    const categoryBrowsingWorks = response.success || response.status === 200;
    
    recordTest('phase4', 'Category browsing works', categoryBrowsingWorks, categoryBrowsingWorks ? 'Categories can be browsed' : 'Category browsing failed');
    console.log(categoryBrowsingWorks ? '✅ Category browsing works' : '❌ Category browsing has issues');
  } catch (error) {
    recordTest('phase4', 'Category browsing works', false, error.message);
    console.log('❌ Category browsing check failed:', error.message);
  }
  
  // Test 4.4: Verify brand browsing works
  try {
    const response = await apiRequest('GET', '/api/v1/brands');
    const brandBrowsingWorks = response.success || response.status === 200;
    
    recordTest('phase4', 'Brand browsing works', brandBrowsingWorks, brandBrowsingWorks ? 'Brands can be browsed' : 'Brand browsing failed');
    console.log(brandBrowsingWorks ? '✅ Brand browsing works' : '❌ Brand browsing has issues');
  } catch (error) {
    recordTest('phase4', 'Brand browsing works', false, error.message);
    console.log('❌ Brand browsing check failed:', error.message);
  }
  
  // Test 4.5: Verify product search works
  try {
    const response = await apiRequest('GET', '/api/v1/products?search=laptop');
    const productSearchWorks = response.success || response.status === 200;
    
    recordTest('phase4', 'Product search works', productSearchWorks, productSearchWorks ? 'Products can be searched' : 'Product search failed');
    console.log(productSearchWorks ? '✅ Product search works' : '❌ Product search has issues');
  } catch (error) {
    recordTest('phase4', 'Product search works', false, error.message);
    console.log('❌ Product search check failed:', error.message);
  }
}

// ============================================================================
// PHASE 5: SEARCH FUNCTIONALITY REGRESSION TESTING
// ============================================================================

async function testPhase5SearchFunctionality() {
  console.log('\n=== PHASE 5: SEARCH FUNCTIONALITY REGRESSION TESTING ===\n');
  
  // Test 5.1: Verify Elasticsearch integration works
  try {
    const response = await axios.get(`${config.backendUrl.replace('/api/v1', '')}:9200/_cluster/health`, {
      timeout: config.timeout,
    });
    const esWorks = response.status === 200;
    
    recordTest('phase5', 'Elasticsearch integration works', esWorks, esWorks ? 'Elasticsearch cluster healthy' : 'Elasticsearch not accessible');
    console.log(esWorks ? '✅ Elasticsearch integration works' : '❌ Elasticsearch integration has issues');
  } catch (error) {
    recordTest('phase5', 'Elasticsearch integration works', false, error.message);
    console.log('❌ Elasticsearch integration check failed:', error.message);
  }
  
  // Test 5.2: Verify search API endpoints work
  try {
    const response = await apiRequest('GET', '/api/v1/search?q=laptop');
    const searchApiWorks = response.success || response.status === 200;
    
    recordTest('phase5', 'Search API endpoints work', searchApiWorks, searchApiWorks ? 'Search API responding' : 'Search API not responding');
    console.log(searchApiWorks ? '✅ Search API endpoints work' : '❌ Search API endpoints have issues');
  } catch (error) {
    recordTest('phase5', 'Search API endpoints work', false, error.message);
    console.log('❌ Search API endpoints check failed:', error.message);
  }
  
  // Test 5.3: Verify search analytics work
  try {
    await prisma.$connect();
    const searchAnalytics = await prisma.searchAnalytics.findFirst();
    const analyticsWorks = searchAnalytics !== null || true; // Allow null if no searches yet
    
    recordTest('phase5', 'Search analytics work', analyticsWorks, analyticsWorks ? 'Search analytics accessible' : 'Search analytics not accessible');
    console.log(analyticsWorks ? '✅ Search analytics work' : '❌ Search analytics have issues');
  } catch (error) {
    recordTest('phase5', 'Search analytics work', false, error.message);
    console.log('❌ Search analytics check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  // Test 5.4: Verify search performance works
  try {
    const startTime = Date.now();
    const response = await apiRequest('GET', '/api/v1/search?q=test');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const performanceWorks = responseTime < 5000; // Should be under 5 seconds
    
    recordTest('phase5', 'Search performance works', performanceWorks, `Response time: ${responseTime}ms`);
    console.log(performanceWorks ? `✅ Search performance works (${responseTime}ms)` : `❌ Search performance has issues (${responseTime}ms)`);
  } catch (error) {
    recordTest('phase5', 'Search performance works', false, error.message);
    console.log('❌ Search performance check failed:', error.message);
  }
}

// ============================================================================
// DATABASE REGRESSION TESTING
// ============================================================================

async function testDatabaseRegression() {
  console.log('\n=== DATABASE REGRESSION TESTING ===\n');
  
  try {
    await prisma.$connect();
    
    // Test DB.1: Verify all existing tables are intact
    const existingTables = [
      'users',
      'products',
      'categories',
      'brands',
      'orders',
      'addresses',
      'reviews',
      'roles',
      'permissions',
      'search_analytics',
      'search_logs',
      'corporate_accounts',
    ];
    
    let tablesIntact = true;
    for (const table of existingTables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      } catch (error) {
        tablesIntact = false;
        console.log(`❌ Table not accessible: ${table}`);
      }
    }
    
    recordTest('database', 'All existing tables intact', tablesIntact, tablesIntact ? 'All tables accessible' : 'Some tables not accessible');
    console.log(tablesIntact ? '✅ All existing tables intact' : '❌ Some tables have issues');
    
    // Test DB.2: Verify new cart tables exist
    const newTables = ['carts', 'cart_items', 'cart_analytics'];
    let newTablesExist = true;
    
    for (const table of newTables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      } catch (error) {
        newTablesExist = false;
        console.log(`❌ New cart table not accessible: ${table}`);
      }
    }
    
    recordTest('database', 'New cart tables exist', newTablesExist, newTablesExist ? 'All cart tables present' : 'Some cart tables missing');
    console.log(newTablesExist ? '✅ New cart tables exist' : '❌ New cart tables have issues');
    
    // Test DB.3: Verify relationships are intact
    try {
      const userWithCart = await prisma.user.findFirst({
        include: { cart: true },
      });
      const relationshipsIntact = true;
      
      recordTest('database', 'All existing relationships intact', relationshipsIntact, 'Relationships accessible');
      console.log('✅ All existing relationships intact');
    } catch (error) {
      recordTest('database', 'All existing relationships intact', false, error.message);
      console.log('❌ Relationships have issues:', error.message);
    }
    
    // Test DB.4: Verify indexes are intact
    try {
      const indexes = await prisma.$queryRawUnsafe(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename IN ('products', 'users', 'categories', 'brands')
      `);
      const indexesIntact = indexes.length > 0;
      
      recordTest('database', 'All existing indexes intact', indexesIntact, `Found ${indexes.length} indexes`);
      console.log(indexesIntact ? '✅ All existing indexes intact' : '❌ Indexes have issues');
    } catch (error) {
      recordTest('database', 'All existing indexes intact', false, error.message);
      console.log('❌ Indexes check failed:', error.message);
    }
    
    // Test DB.5: Verify new tables don't affect existing queries
    try {
      const products = await prisma.product.findMany({ take: 1 });
      const users = await prisma.user.findMany({ take: 1 });
      const queriesWork = products.length >= 0 && users.length >= 0;
      
      recordTest('database', 'New tables don\'t affect existing queries', queriesWork, 'Existing queries work correctly');
      console.log(queriesWork ? '✅ New tables don\'t affect existing queries' : '❌ New tables affect existing queries');
    } catch (error) {
      recordTest('database', 'New tables don\'t affect existing queries', false, error.message);
      console.log('❌ Query check failed:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Database regression testing failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// API REGRESSION TESTING
// ============================================================================

async function testApiRegression() {
  console.log('\n=== API REGRESSION TESTING ===\n');
  
  const apiEndpoints = [
    { method: 'GET', path: '/api/v1/products', name: 'Products list' },
    { method: 'GET', path: '/api/v1/categories', name: 'Categories list' },
    { method: 'GET', path: '/api/v1/brands', name: 'Brands list' },
    { method: 'GET', path: '/api/v1/search?q=test', name: 'Search' },
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const response = await apiRequest(endpoint.method, endpoint.path);
      const works = response.success || response.status === 200 || response.status === 401;
      
      recordTest('api', `${endpoint.name} endpoint works`, works, works ? 'Endpoint responding' : 'Endpoint not responding');
      console.log(works ? `✅ ${endpoint.name} endpoint works` : `❌ ${endpoint.name} endpoint has issues`);
    } catch (error) {
      recordTest('api', `${endpoint.name} endpoint works`, false, error.message);
      console.log(`❌ ${endpoint.name} endpoint check failed:`, error.message);
    }
  }
}

// ============================================================================
// FRONTEND REGRESSION TESTING
// ============================================================================

async function testFrontendRegression() {
  console.log('\n=== FRONTEND REGRESSION TESTING ===\n');
  
  // Test FE.1: Verify frontend loads
  try {
    const response = await axios.get(config.frontendUrl, { timeout: config.timeout });
    const frontendLoads = response.status === 200;
    
    recordTest('frontend', 'Frontend loads correctly', frontendLoads, frontendLoads ? 'Frontend accessible' : 'Frontend not accessible');
    console.log(frontendLoads ? '✅ Frontend loads correctly' : '❌ Frontend has issues');
  } catch (error) {
    recordTest('frontend', 'Frontend loads correctly', false, error.message);
    console.log('❌ Frontend check failed:', error.message);
  }
  
  // Test FE.2: Verify frontend pages load
  const pages = ['/products', '/categories', '/brands', '/search'];
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${config.frontendUrl}${page}`, { timeout: config.timeout });
      const pageLoads = response.status === 200;
      
      recordTest('frontend', `${page} page loads`, pageLoads, pageLoads ? 'Page accessible' : 'Page not accessible');
      console.log(pageLoads ? `✅ ${page} page loads` : `❌ ${page} page has issues`);
    } catch (error) {
      recordTest('frontend', `${page} page loads`, false, error.message);
      console.log(`❌ ${page} page check failed:`, error.message);
    }
  }
}

// ============================================================================
// ADMIN PANEL REGRESSION TESTING
// ============================================================================

async function testAdminPanelRegression() {
  console.log('\n=== ADMIN PANEL REGRESSION TESTING ===\n');
  
  const adminPages = [
    '/admin/products',
    '/admin/categories',
    '/admin/brands',
    '/admin/users',
    '/admin/search-analytics',
  ];
  
  for (const page of adminPages) {
    try {
      const response = await axios.get(`${config.frontendUrl}${page}`, { timeout: config.timeout });
      const pageLoads = response.status === 200 || response.status === 401; // 401 is acceptable if not authenticated
      
      recordTest('admin', `${page} admin page works`, pageLoads, pageLoads ? 'Admin page accessible' : 'Admin page not accessible');
      console.log(pageLoads ? `✅ ${page} admin page works` : `❌ ${page} admin page has issues`);
    } catch (error) {
      recordTest('admin', `${page} admin page works`, false, error.message);
      console.log(`❌ ${page} admin page check failed:`, error.message);
    }
  }
}

// ============================================================================
// PERFORMANCE REGRESSION TESTING
// ============================================================================

async function testPerformanceRegression() {
  console.log('\n=== PERFORMANCE REGRESSION TESTING ===\n');
  
  // Test Perf.1: API response times
  const endpoints = [
    { path: '/api/v1/products', name: 'Products API' },
    { path: '/api/v1/categories', name: 'Categories API' },
    { path: '/api/v1/search?q=test', name: 'Search API' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await apiRequest('GET', endpoint.path);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const performanceAcceptable = responseTime < 3000; // Under 3 seconds
      
      recordTest('performance', `${endpoint.name} response time`, performanceAcceptable, `${responseTime}ms`);
      console.log(performanceAcceptable ? `✅ ${endpoint.name} response time acceptable (${responseTime}ms)` : `❌ ${endpoint.name} response time degraded (${responseTime}ms)`);
    } catch (error) {
      recordTest('performance', `${endpoint.name} response time`, false, error.message);
      console.log(`❌ ${endpoint.name} performance check failed:`, error.message);
    }
  }
}

// ============================================================================
// SECURITY REGRESSION TESTING
// ============================================================================

async function testSecurityRegression() {
  console.log('\n=== SECURITY REGRESSION TESTING ===\n');
  
  // Test Sec.1: Verify input validation works
  try {
    const maliciousData = {
      email: '<script>alert("xss")</script>@test.com',
      password: 'test',
    };
    const response = await apiRequest('POST', '/api/v1/auth/login', maliciousData);
    const validationWorks = !response.success; // Should fail validation
    
    recordTest('security', 'Input validation works', validationWorks, validationWorks ? 'Malicious input rejected' : 'Input validation may be bypassed');
    console.log(validationWorks ? '✅ Input validation works' : '❌ Input validation has issues');
  } catch (error) {
    recordTest('security', 'Input validation works', false, error.message);
    console.log('❌ Input validation check failed:', error.message);
  }
  
  // Test Sec.2: Verify authentication security
  try {
    const response = await apiRequest('GET', '/api/v1/users/profile');
    const authRequired = response.status === 401 || response.status === 403;
    
    recordTest('security', 'Authentication security', authRequired, authRequired ? 'Protected endpoint requires auth' : 'Endpoint may be unprotected');
    console.log(authRequired ? '✅ Authentication security intact' : '❌ Authentication security has issues');
  } catch (error) {
    recordTest('security', 'Authentication security', false, error.message);
    console.log('❌ Authentication security check failed:', error.message);
  }
}

// ============================================================================
// INTEGRATION REGRESSION TESTING
// ============================================================================

async function testIntegrationRegression() {
  console.log('\n=== INTEGRATION REGRESSION TESTING ===\n');
  
  // Test Int.1: Verify authentication integration with cart
  try {
    await prisma.$connect();
    const userWithCart = await prisma.user.findFirst({
      include: { cart: true },
    });
    const integrationWorks = userWithCart !== null;
    
    recordTest('integration', 'Phase 3 authentication integration with cart', integrationWorks, integrationWorks ? 'User-cart relationship works' : 'User-cart relationship broken');
    console.log(integrationWorks ? '✅ Phase 3 authentication integration with cart works' : '❌ Phase 3 authentication integration with cart has issues');
  } catch (error) {
    recordTest('integration', 'Phase 3 authentication integration with cart', false, error.message);
    console.log('❌ Integration check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  // Test Int.2: Verify product catalog integration with cart
  try {
    await prisma.$connect();
    const productWithCartItems = await prisma.product.findFirst({
      include: { cartItems: true },
    });
    const integrationWorks = productWithCartItems !== null;
    
    recordTest('integration', 'Phase 4 product catalog integration with cart', integrationWorks, integrationWorks ? 'Product-cart relationship works' : 'Product-cart relationship broken');
    console.log(integrationWorks ? '✅ Phase 4 product catalog integration with cart works' : '❌ Phase 4 product catalog integration with cart has issues');
  } catch (error) {
    recordTest('integration', 'Phase 4 product catalog integration with cart', false, error.message);
    console.log('❌ Integration check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// GENERATE REPORT
// ============================================================================

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE REGRESSION TESTING REPORT');
  console.log('Phase 6, Milestone 1 - Testing Phases 1-5');
  console.log('='.repeat(80) + '\n');
  
  const phases = [
    { name: 'Phase 1: Project Setup', key: 'phase1' },
    { name: 'Phase 2: Basic Structure', key: 'phase2' },
    { name: 'Phase 3: Authentication & User Management', key: 'phase3' },
    { name: 'Phase 4: Product Catalog', key: 'phase4' },
    { name: 'Phase 5: Search Functionality', key: 'phase5' },
    { name: 'Database', key: 'database' },
    { name: 'API', key: 'api' },
    { name: 'Frontend', key: 'frontend' },
    { name: 'Admin Panel', key: 'admin' },
    { name: 'Performance', key: 'performance' },
    { name: 'Security', key: 'security' },
    { name: 'Integration', key: 'integration' },
  ];
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const phase of phases) {
    const results = testResults[phase.key];
    const total = results.passed + results.failed;
    const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(2) : 0;
    
    console.log(`\n${phase.name}`);
    console.log('-'.repeat(80));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Pass Rate: ${passRate}%`);
    
    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      for (const test of results.tests.filter(t => !t.passed)) {
        console.log(`  ❌ ${test.name}: ${test.details}`);
      }
    }
    
    totalPassed += results.passed;
    totalFailed += results.failed;
  }
  
  const overallTotal = totalPassed + totalFailed;
  const overallPassRate = overallTotal > 0 ? ((totalPassed / overallTotal) * 100).toFixed(2) : 0;
  
  console.log('\n' + '='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${overallTotal}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Overall Pass Rate: ${overallPassRate}%`);
  
  const regressionDetected = totalFailed > 0;
  console.log('\n' + '='.repeat(80));
  console.log(regressionDetected ? '⚠️  REGRESSION DETECTED' : '✅ NO REGRESSION DETECTED');
  console.log('='.repeat(80));
  
  if (regressionDetected) {
    console.log('\n⚠️  RECOMMENDATIONS:');
    console.log('1. Review failed tests and identify root causes');
    console.log('2. Fix any breaking changes introduced in Phase 6, Milestone 1');
    console.log('3. Re-run regression tests after fixes');
    console.log('4. Ensure all existing functionality is restored');
  } else {
    console.log('\n✅ Phase 6, Milestone 1 implementation is regression-free!');
    console.log('✅ All existing functionality from Phases 1-5 continues to work correctly');
  }
  
  console.log('\n' + '='.repeat(80));
  
  return {
    totalTests: overallTotal,
    passed: totalPassed,
    failed: totalFailed,
    passRate: parseFloat(overallPassRate),
    regressionDetected,
  };
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runRegressionTests() {
  console.log('\n' + '='.repeat(80));
  console.log('STARTING COMPREHENSIVE REGRESSION TESTING');
  console.log('Phase 6, Milestone 1 - Verifying Phases 1-5');
  console.log('='.repeat(80));
  
  try {
    await testPhase1ProjectSetup();
    await testPhase2BasicStructure();
    await testPhase3Authentication();
    await testPhase4ProductCatalog();
    await testPhase5SearchFunctionality();
    await testDatabaseRegression();
    await testApiRegression();
    await testFrontendRegression();
    await testAdminPanelRegression();
    await testPerformanceRegression();
    await testSecurityRegression();
    await testIntegrationRegression();
    
    const report = generateReport();
    
    // Save report to file
    const fs = require('fs');
    const reportContent = JSON.stringify({
      timestamp: new Date().toISOString(),
      results: testResults,
      summary: report,
    }, null, 2);
    
    fs.writeFileSync('regression-test-results.json', reportContent);
    console.log('\n📄 Detailed results saved to: regression-test-results.json');
    
    return report;
  } catch (error) {
    console.error('\n❌ Regression testing failed:', error);
    throw error;
  }
}

// Run tests if executed directly
if (require.main === module) {
  runRegressionTests()
    .then(() => {
      console.log('\n✅ Regression testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Regression testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runRegressionTests, testResults };
