/**
 * OAuth Integration Test Script
 * Tests all OAuth endpoints with demo data
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Demo OAuth profiles for testing
const demoProfiles = {
  google: {
    id: 'google_demo_user_12345',
    email: 'demo.user@gmail.com',
    firstName: 'Demo',
    lastName: 'User',
    image: 'https://lh3.googleusercontent.com/demo/photo.jpg'
  },
  facebook: {
    id: 'facebook_demo_user_67890',
    email: 'demo.user@facebook.com',
    firstName: 'Demo',
    lastName: 'User',
    image: 'https://graph.facebook.com/demo/picture.jpg'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testGetProviders() {
  logSection('Test 1: Get OAuth Providers');
  
  try {
    const response = await axios.get(`${API_URL}/api/v1/oauth/providers`);
    
    if (response.status === 200) {
      log('✓ GET /api/v1/oauth/providers - SUCCESS', 'green');
      log(`  Providers: ${JSON.stringify(response.data.providers, null, 2)}`, 'blue');
      log(`  Message: ${response.data.message}`, 'blue');
      return response.data.providers;
    } else {
      log(`✗ GET /api/v1/oauth/providers - FAILED (Status: ${response.status})`, 'red');
      return [];
    }
  } catch (error) {
    log(`✗ GET /api/v1/oauth/providers - ERROR`, 'red');
    log(`  Error: ${error.message}`, 'red');
    return [];
  }
}

async function testGoogleCallback() {
  logSection('Test 2: Google OAuth Callback');
  
  try {
    const response = await axios.post(`${API_URL}/api/v1/oauth/callback/google`, {
      profile: demoProfiles.google
    });
    
    if (response.status === 200 || response.status === 201) {
      log('✓ POST /api/v1/oauth/callback/google - SUCCESS', 'green');
      log(`  User ID: ${response.data.user.id}`, 'blue');
      log(`  Email: ${response.data.user.email}`, 'blue');
      log(`  Name: ${response.data.user.firstName} ${response.data.user.lastName}`, 'blue');
      log(`  Token: ${response.data.token.substring(0, 20)}...`, 'blue');
      log(`  Session ID: ${response.data.sessionId}`, 'blue');
      log(`  Is New User: ${response.data.isNew}`, 'yellow');
      return response.data;
    } else {
      log(`✗ POST /api/v1/oauth/callback/google - FAILED (Status: ${response.status})`, 'red');
      log(`  Error: ${JSON.stringify(response.data)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`✗ POST /api/v1/oauth/callback/google - ERROR`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Error: ${JSON.stringify(error.response.data)}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return null;
  }
}

async function testFacebookCallback() {
  logSection('Test 3: Facebook OAuth Callback');
  
  try {
    const response = await axios.post(`${API_URL}/api/v1/oauth/callback/facebook`, {
      profile: demoProfiles.facebook
    });
    
    if (response.status === 200 || response.status === 201) {
      log('✓ POST /api/v1/oauth/callback/facebook - SUCCESS', 'green');
      log(`  User ID: ${response.data.user.id}`, 'blue');
      log(`  Email: ${response.data.user.email}`, 'blue');
      log(`  Name: ${response.data.user.firstName} ${response.data.user.lastName}`, 'blue');
      log(`  Token: ${response.data.token.substring(0, 20)}...`, 'blue');
      log(`  Session ID: ${response.data.sessionId}`, 'blue');
      log(`  Is New User: ${response.data.isNew}`, 'yellow');
      return response.data;
    } else {
      log(`✗ POST /api/v1/oauth/callback/facebook - FAILED (Status: ${response.status})`, 'red');
      log(`  Error: ${JSON.stringify(response.data)}`, 'red');
      return null;
    }
  } catch (error) {
    log(`✗ POST /api/v1/oauth/callback/facebook - ERROR`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Error: ${JSON.stringify(error.response.data)}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return null;
  }
}

async function testLinkSocialAccount(token, provider) {
  logSection(`Test 4: Link ${provider} Account`);
  
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/oauth/link/${provider}`,
      { profile: demoProfiles[provider] },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 200) {
      log(`✓ POST /api/v1/oauth/link/${provider} - SUCCESS`, 'green');
      log(`  Message: ${response.data.message}`, 'blue');
      return true;
    } else {
      log(`✗ POST /api/v1/oauth/link/${provider} - FAILED (Status: ${response.status})`, 'red');
      log(`  Error: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ POST /api/v1/oauth/link/${provider} - ERROR`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Error: ${JSON.stringify(error.response.data)}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testGetSocialAccounts(token) {
  logSection('Test 5: Get Social Accounts');
  
  try {
    const response = await axios.get(`${API_URL}/api/v1/oauth/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      log('✓ GET /api/v1/oauth/accounts - SUCCESS', 'green');
      log(`  Social Accounts: ${response.data.socialAccounts.length}`, 'blue');
      response.data.socialAccounts.forEach(account => {
        log(`    - ${account.provider}: ${account.providerId} (linked: ${account.createdAt})`, 'blue');
      });
      return response.data.socialAccounts;
    } else {
      log(`✗ GET /api/v1/oauth/accounts - FAILED (Status: ${response.status})`, 'red');
      return [];
    }
  } catch (error) {
    log(`✗ GET /api/v1/oauth/accounts - ERROR`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Error: ${JSON.stringify(error.response.data)}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return [];
  }
}

async function testUnlinkSocialAccount(token, provider) {
  logSection(`Test 6: Unlink ${provider} Account`);
  
  try {
    const response = await axios.delete(`${API_URL}/api/v1/oauth/unlink/${provider}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      log(`✓ DELETE /api/v1/oauth/unlink/${provider} - SUCCESS`, 'green');
      log(`  Message: ${response.data.message}`, 'blue');
      return true;
    } else {
      log(`✗ DELETE /api/v1/oauth/unlink/${provider} - FAILED (Status: ${response.status})`, 'red');
      log(`  Error: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ DELETE /api/v1/oauth/unlink/${provider} - ERROR`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Error: ${JSON.stringify(error.response.data)}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testValidateOAuthToken(provider, accessToken) {
  logSection(`Test 7: Validate ${provider} OAuth Token`);
  
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/oauth/validate/${provider}`,
      { accessToken }
    );
    
    if (response.status === 200) {
      log(`✓ POST /api/v1/oauth/validate/${provider} - SUCCESS`, 'green');
      log(`  Valid: ${response.data.valid}`, 'blue');
      log(`  Message: ${response.data.message}`, 'blue');
      return response.data.valid;
    } else {
      log(`✗ POST /api/v1/oauth/validate/${provider} - FAILED (Status: ${response.status})`, 'red');
      log(`  Error: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ POST /api/v1/oauth/validate/${provider} - ERROR`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Error: ${JSON.stringify(error.response.data)}`, 'red');
    } else {
      log(`  Error: ${error.message}`, 'red');
    }
    return false;
  }
}

async function runFullTestSuite() {
  log('\n' + '='.repeat(60));
  log('OAUTH INTEGRATION TEST SUITE', 'cyan');
  log('='.repeat(60));
  log(`API URL: ${API_URL}`, 'yellow');
  log(`Testing Date: ${new Date().toISOString()}`, 'yellow');

  let testResults = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test 1: Get Providers
  const providers = await testGetProviders();
  if (providers.length > 0) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push('Get providers failed');
  }

  // Test 2: Google Callback
  const googleAuth = await testGoogleCallback();
  if (googleAuth) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push('Google callback failed');
  }

  // Test 3: Facebook Callback
  const facebookAuth = await testFacebookCallback();
  if (facebookAuth) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push('Facebook callback failed');
  }

  // Test 4: Link Google Account
  if (googleAuth) {
    const linked = await testLinkSocialAccount(googleAuth.token, 'google');
    if (linked) {
      testResults.passed++;
    } else {
      testResults.failed++;
      testResults.errors.push('Link Google account failed');
    }
  }

  // Test 5: Get Social Accounts
  if (googleAuth) {
    const accounts = await testGetSocialAccounts(googleAuth.token);
    if (accounts.length > 0) {
      testResults.passed++;
    } else {
      testResults.failed++;
      testResults.errors.push('Get social accounts failed');
    }
  }

  // Test 6: Validate OAuth Token
  const valid = await testValidateOAuthToken('google', 'demo_access_token');
  if (valid !== false) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push('Validate OAuth token failed');
  }

  // Test 7: Unlink Social Account
  if (googleAuth) {
    const unlinked = await testUnlinkSocialAccount(googleAuth.token, 'google');
    if (unlinked) {
      testResults.passed++;
    } else {
      testResults.failed++;
      testResults.errors.push('Unlink Google account failed');
    }
  }

  // Print Summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${testResults.passed + testResults.failed}`, 'cyan');
  log(`✓ Passed: ${testResults.passed}`, 'green');
  log(`✗ Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`, 'yellow');

  if (testResults.errors.length > 0) {
    log('\nErrors:', 'red');
    testResults.errors.forEach((error, index) => {
      log(`  ${index + 1}. ${error}`, 'red');
    });
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUITE COMPLETED', 'cyan');
  log('='.repeat(60) + '\n');
}

// Run tests
if (require.main === module) {
  runFullTestSuite().catch(error => {
    log('\n' + '='.repeat(60), 'red');
    log('TEST SUITE FAILED', 'red');
    log('='.repeat(60), 'red');
    log(`Fatal Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testGetProviders,
  testGoogleCallback,
  testFacebookCallback,
  testLinkSocialAccount,
  testGetSocialAccounts,
  testUnlinkSocialAccount,
  testValidateOAuthToken,
  runFullTestSuite,
  demoProfiles
};
