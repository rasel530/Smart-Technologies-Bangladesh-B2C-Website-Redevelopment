/**
 * Google OAuth Integration Test Script
 * Tests the complete Google OAuth flow from frontend to backend
 * 
 * Usage: node test-google-oauth-integration.js
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001/api/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

/**
 * Log test result
 */
function logTest(testName, passed, message, details = null) {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? colors.green : colors.red;
  
  console.log(`${color}${status}${colors.reset} - ${testName}`);
  if (message) {
    console.log(`  ${colors.cyan}${message}${colors.reset}`);
  }
  if (details) {
    console.log(`  ${colors.yellow}Details:${colors.reset}`, details);
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    message,
    details
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

/**
 * Log section header
 */
function logSection(title) {
  console.log(`\n${colors.bright}${colors.blue}══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}══════════════════════════════════════════${colors.reset}\n`);
}

/**
 * Log info message
 */
function logInfo(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

/**
 * Log warning message
 */
function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

/**
 * Log error message
 */
function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

/**
 * Log success message
 */
function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

/**
 * Test 1: Check Backend Server Health
 */
async function testBackendHealth() {
  logSection('Test 1: Backend Server Health Check');
  
  try {
    const response = await axios.get(`${BACKEND_URL.replace('/api', '')}/health`, {
      timeout: 5000
    });
    
    const isHealthy = response.status === 200;
    logTest(
      'Backend server is accessible',
      isHealthy,
      isHealthy ? 'Server responded successfully' : 'Server health check failed',
      { status: response.status, data: response.data }
    );
    
    return isHealthy;
  } catch (error) {
    logTest(
      'Backend server is accessible',
      false,
      'Failed to connect to backend server',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 2: Get OAuth Providers
 */
async function testGetOAuthProviders() {
  logSection('Test 2: Get Enabled OAuth Providers');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/oauth/providers`, {
      timeout: 5000
    });
    
    const hasGoogleProvider = response.data.providers && 
      response.data.providers.some(p => p.id === 'google');
    
    logTest(
      'OAuth providers endpoint is accessible',
      response.status === 200,
      'Successfully retrieved OAuth providers'
    );
    
    logTest(
      'Google OAuth provider is configured',
      hasGoogleProvider,
      hasGoogleProvider ? 'Google provider found in enabled providers' : 'Google provider not found',
      { providers: response.data.providers }
    );
    
    return hasGoogleProvider;
  } catch (error) {
    logTest(
      'OAuth providers endpoint is accessible',
      false,
      'Failed to get OAuth providers',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 3: Check Environment Variables
 */
async function testEnvironmentVariables() {
  logSection('Test 3: Check Environment Variables');
  
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID'
  ];
  
  const missingVars = [];
  const presentVars = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
      // Don't log the actual value for security
      const maskedValue = varName.includes('SECRET') || varName.includes('KEY')
        ? '***CONFIGURED***'
        : process.env[varName];
      logTest(
        `Environment variable ${varName} is set`,
        true,
        `Value: ${maskedValue}`
      );
    } else {
      missingVars.push(varName);
      logTest(
        `Environment variable ${varName} is set`,
        false,
        'Variable is not set'
      );
    }
  });
  
  const allConfigured = missingVars.length === 0;
  
  if (allConfigured) {
    logSuccess('All required environment variables are configured');
  } else {
    logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
  }
  
  return allConfigured;
}

/**
 * Test 4: Check Database Schema
 */
async function testDatabaseSchema() {
  logSection('Test 4: Check Database Schema');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check if UserSocialAccount model exists
    const modelExists = prisma.userSocialAccount !== undefined;
    logTest(
      'UserSocialAccount model exists in database schema',
      modelExists,
      modelExists ? 'Model found in Prisma client' : 'Model not found'
    );
    
    if (modelExists) {
      // Check if we can query the table
      try {
        const count = await prisma.userSocialAccount.count();
        logTest(
          'UserSocialAccount table is accessible',
          true,
          `Table contains ${count} social account records`
        );
      } catch (error) {
        logTest(
          'UserSocialAccount table is accessible',
          false,
          'Failed to query table',
          { error: error.message }
        );
      }
    }
    
    await prisma.$disconnect();
    return modelExists;
  } catch (error) {
    logTest(
      'Database schema is accessible',
      false,
      'Failed to connect to database',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 5: Check NextAuth Configuration
 */
async function testNextAuthConfiguration() {
  logSection('Test 5: Check NextAuth Configuration');
  
  try {
    // Check if NextAuth is properly configured
    const fs = require('fs');
    const path = require('path');
    
    const authConfigPath = path.join(__dirname, '../frontend/src/lib/auth.ts');
    const authConfigExists = fs.existsSync(authConfigPath);
    
    logTest(
      'NextAuth configuration file exists',
      authConfigExists,
      authConfigExists ? 'Configuration file found' : 'Configuration file not found'
    );
    
    if (authConfigExists) {
      const authConfigContent = fs.readFileSync(authConfigPath, 'utf-8');
      
      const hasGoogleProvider = authConfigContent.includes('GoogleProvider');
      logTest(
        'Google provider is configured in NextAuth',
        hasGoogleProvider,
        hasGoogleProvider ? 'GoogleProvider found in configuration' : 'GoogleProvider not found'
      );
      
      const hasCallbackHandler = authConfigContent.includes('oauth/callback');
      logTest(
        'OAuth callback handler is configured',
        hasCallbackHandler,
        hasCallbackHandler ? 'Callback handler found' : 'Callback handler not found'
      );
    }
    
    return authConfigExists;
  } catch (error) {
    logTest(
      'NextAuth configuration is accessible',
      false,
      'Failed to check NextAuth configuration',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 6: Check OAuth Service
 */
async function testOAuthService() {
  logSection('Test 6: Check OAuth Service Implementation');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const oauthServicePath = path.join(__dirname, 'services/oauthService.js');
    const oauthServiceExists = fs.existsSync(oauthServicePath);
    
    logTest(
      'OAuth service file exists',
      oauthServiceExists,
      oauthServiceExists ? 'OAuth service file found' : 'OAuth service file not found'
    );
    
    if (oauthServiceExists) {
      const oauthServiceContent = fs.readFileSync(oauthServicePath, 'utf-8');
      
      const hasFindOrCreateUser = oauthServiceContent.includes('findOrCreateUser');
      logTest(
        'findOrCreateUser method exists',
        hasFindOrCreateUser,
        hasFindOrCreateUser ? 'Method found in OAuth service' : 'Method not found'
      );
      
      const hasLinkSocialAccount = oauthServiceContent.includes('linkSocialAccount');
      logTest(
        'linkSocialAccount method exists',
        hasLinkSocialAccount,
        hasLinkSocialAccount ? 'Method found in OAuth service' : 'Method not found'
      );
      
      const hasGoogleProvider = oauthServiceContent.includes('google');
      logTest(
        'Google provider is configured in OAuth service',
        hasGoogleProvider,
        hasGoogleProvider ? 'Google provider found' : 'Google provider not found'
      );
    }
    
    return oauthServiceExists;
  } catch (error) {
    logTest(
      'OAuth service is accessible',
      false,
      'Failed to check OAuth service',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 7: Check OAuth Routes
 */
async function testOAuthRoutes() {
  logSection('Test 7: Check OAuth Routes');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const oauthRoutesPath = path.join(__dirname, 'routes/oauth.js');
    const oauthRoutesExists = fs.existsSync(oauthRoutesPath);
    
    logTest(
      'OAuth routes file exists',
      oauthRoutesExists,
      oauthRoutesExists ? 'OAuth routes file found' : 'OAuth routes file not found'
    );
    
    if (oauthRoutesExists) {
      const oauthRoutesContent = fs.readFileSync(oauthRoutesPath, 'utf-8');
      
      const hasCallbackRoute = oauthRoutesContent.includes('/callback/:provider');
      logTest(
        'OAuth callback route exists',
        hasCallbackRoute,
        hasCallbackRoute ? 'Callback route found' : 'Callback route not found'
      );
      
      const hasLinkRoute = oauthRoutesContent.includes('/link/:provider');
      logTest(
        'OAuth link route exists',
        hasLinkRoute,
        hasLinkRoute ? 'Link route found' : 'Link route not found'
      );
      
      const hasUnlinkRoute = oauthRoutesContent.includes('/unlink/:provider');
      logTest(
        'OAuth unlink route exists',
        hasUnlinkRoute,
        hasUnlinkRoute ? 'Unlink route found' : 'Unlink route not found'
      );
      
      const hasGetAccountsRoute = oauthRoutesContent.includes('/accounts');
      logTest(
        'Get accounts route exists',
        hasGetAccountsRoute,
        hasGetAccountsRoute ? 'Get accounts route found' : 'Get accounts route not found'
      );
    }
    
    return oauthRoutesExists;
  } catch (error) {
    logTest(
      'OAuth routes are accessible',
      false,
      'Failed to check OAuth routes',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 8: Check Social Login Component
 */
async function testSocialLoginComponent() {
  logSection('Test 8: Check Social Login Component');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const socialLoginPath = path.join(__dirname, '../frontend/src/components/auth/SocialLoginButtons.tsx');
    const socialLoginExists = fs.existsSync(socialLoginPath);
    
    logTest(
      'Social login buttons component exists',
      socialLoginExists,
      socialLoginExists ? 'Component file found' : 'Component file not found'
    );
    
    if (socialLoginExists) {
      const socialLoginContent = fs.readFileSync(socialLoginPath, 'utf-8');
      
      const hasGoogleButton = socialLoginContent.includes('handleGoogleSignIn');
      logTest(
        'Google sign-in handler exists',
        hasGoogleButton,
        hasGoogleButton ? 'Google handler found' : 'Google handler not found'
      );
      
      const hasSignInFunction = socialLoginContent.includes("signIn('google'");
      logTest(
        'NextAuth signIn function is called',
        hasSignInFunction,
        hasSignInFunction ? 'signIn function found' : 'signIn function not found'
      );
    }
    
    return socialLoginExists;
  } catch (error) {
    logTest(
      'Social login component is accessible',
      false,
      'Failed to check social login component',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 9: Check Frontend Environment
 */
async function testFrontendEnvironment() {
  logSection('Test 9: Check Frontend Environment');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const envExamplePath = path.join(__dirname, '../frontend/.env.example');
    const envExampleExists = fs.existsSync(envExamplePath);
    
    logTest(
      'Frontend .env.example file exists',
      envExampleExists,
      envExampleExists ? 'Environment example file found' : 'Environment example file not found'
    );
    
    if (envExampleExists) {
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
      
      const hasGoogleClientId = envExampleContent.includes('NEXT_PUBLIC_GOOGLE_CLIENT_ID');
      logTest(
        'NEXT_PUBLIC_GOOGLE_CLIENT_ID is documented',
        hasGoogleClientId,
        hasGoogleClientId ? 'Variable documented' : 'Variable not documented'
      );
      
      const hasGoogleClientSecret = envExampleContent.includes('GOOGLE_CLIENT_SECRET');
      logTest(
        'GOOGLE_CLIENT_SECRET is documented',
        hasGoogleClientSecret,
        hasGoogleClientSecret ? 'Variable documented' : 'Variable not documented'
      );
      
      const hasNextAuthSecret = envExampleContent.includes('NEXTAUTH_SECRET');
      logTest(
        'NEXTAUTH_SECRET is documented',
        hasNextAuthSecret,
        hasNextAuthSecret ? 'Variable documented' : 'Variable not documented'
      );
    }
    
    return envExampleExists;
  } catch (error) {
    logTest(
      'Frontend environment is accessible',
      false,
      'Failed to check frontend environment',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Test 10: Check Backend Environment
 */
async function testBackendEnvironment() {
  logSection('Test 10: Check Backend Environment');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const envExamplePath = path.join(__dirname, '.env.example');
    const envExampleExists = fs.existsSync(envExamplePath);
    
    logTest(
      'Backend .env.example file exists',
      envExampleExists,
      envExampleExists ? 'Environment example file found' : 'Environment example file not found'
    );
    
    if (envExampleExists) {
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
      
      const hasGoogleClientId = envExampleContent.includes('GOOGLE_CLIENT_ID');
      logTest(
        'GOOGLE_CLIENT_ID is documented',
        hasGoogleClientId,
        hasGoogleClientId ? 'Variable documented' : 'Variable not documented'
      );
      
      const hasGoogleClientSecret = envExampleContent.includes('GOOGLE_CLIENT_SECRET');
      logTest(
        'GOOGLE_CLIENT_SECRET is documented',
        hasGoogleClientSecret,
        hasGoogleClientSecret ? 'Variable documented' : 'Variable not documented'
      );
      
      const hasGoogleRedirectUri = envExampleContent.includes('GOOGLE_REDIRECT_URI');
      logTest(
        'GOOGLE_REDIRECT_URI is documented',
        hasGoogleRedirectUri,
        hasGoogleRedirectUri ? 'Variable documented' : 'Variable not documented'
      );
    }
    
    return envExampleExists;
  } catch (error) {
    logTest(
      'Backend environment is accessible',
      false,
      'Failed to check backend environment',
      { error: error.message }
    );
    return false;
  }
}

/**
 * Print test summary
 */
function printTestSummary() {
  logSection('Test Summary');
  
  const totalTests = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(2) : 0;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);
  console.log(`\nPass Rate: ${passRate}%`);
  
  if (testResults.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
        if (t.message) {
          console.log(`    ${colors.yellow}${t.message}${colors.reset}`);
        }
      });
  }
  
  console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════${colors.reset}`);
  
  if (testResults.failed === 0) {
    console.log(`${colors.green}${colors.bright}✓ All tests passed! Google OAuth integration is ready.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}✗ Some tests failed. Please review and fix the issues above.${colors.reset}`);
  }
  
  console.log(`${colors.bright}${colors.cyan}══════════════════════════════════════════${colors.reset}\n`);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Google OAuth Integration Test Suite                            ║
║   Smart Technologies B2C Platform                                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  logInfo(`Backend URL: ${BACKEND_URL}`);
  logInfo(`Frontend URL: ${FRONTEND_URL}`);
  logInfo(`Test started at: ${new Date().toISOString()}\n`);
  
  // Run all tests
  await testBackendHealth();
  await testGetOAuthProviders();
  await testEnvironmentVariables();
  await testDatabaseSchema();
  await testNextAuthConfiguration();
  await testOAuthService();
  await testOAuthRoutes();
  await testSocialLoginComponent();
  await testFrontendEnvironment();
  await testBackendEnvironment();
  
  // Print summary
  printTestSummary();
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});
